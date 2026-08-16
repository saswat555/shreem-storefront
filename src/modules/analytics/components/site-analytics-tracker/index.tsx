"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type SiteAnalyticsTrackerProps = {
  customerId?: string | null
  customerEmail?: string | null
}

const SESSION_KEY = "shreem_site_session_id"
const SESSION_ACTIVE_KEY = "shreem_site_session_active_at"
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const LANDING_KEY = "shreem_site_landing_page"
const REFERRER_KEY = "shreem_site_first_referrer"
const UTM_KEY = "shreem_site_utm"
const LOCATION_KEY = "shreem_site_user_location_v1"
const LOCATION_PROMPT_KEY = "shreem_site_location_prompt_v1"
const LOCATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const getSessionId = () => {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY)
    const lastActive = Number(window.localStorage.getItem(SESSION_ACTIVE_KEY) || 0)
    const expired = !lastActive || Date.now() - lastActive > SESSION_TIMEOUT_MS

    if (existing && !expired) {
      window.localStorage.setItem(SESSION_ACTIVE_KEY, String(Date.now()))
      return existing
    }

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`

    window.localStorage.setItem(SESSION_KEY, next)
    window.localStorage.setItem(SESSION_ACTIVE_KEY, String(Date.now()))
    window.localStorage.removeItem(LANDING_KEY)
    window.localStorage.removeItem(REFERRER_KEY)
    window.localStorage.removeItem(UTM_KEY)

    return next
  } catch {
    return ""
  }
}

const buildPath = (pathname: string) => {
  const query = window.location.search.replace(/^\?/, "")
  return query ? `${pathname}?${query}` : pathname
}

const readStoredJson = (key: string) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}")
  } catch {
    return {}
  }
}

const getStoredLocation = () => {
  const location = readStoredJson(LOCATION_KEY) as Record<string, unknown>
  const capturedAt = Number(location.captured_at || 0)
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !capturedAt ||
    Date.now() - capturedAt > LOCATION_MAX_AGE_MS
  ) {
    return null
  }

  return {
    latitude,
    longitude,
    accuracy: Number(location.accuracy || 0) || undefined,
    source: "browser_geolocation",
    permission: "granted",
    captured_at: capturedAt,
  }
}

const captureAttribution = (pathname: string) => {
  const path = buildPath(pathname)
  const query = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
  ]) {
    const value = query.get(key)

    if (value) {
      utm[key] = value.slice(0, 180)
    }
  }

  try {
    if (!window.localStorage.getItem(LANDING_KEY)) {
      window.localStorage.setItem(LANDING_KEY, path)
    }

    if (!window.localStorage.getItem(REFERRER_KEY) && document.referrer) {
      window.localStorage.setItem(REFERRER_KEY, document.referrer.slice(0, 500))
    }

    if (Object.keys(utm).length) {
      window.localStorage.setItem(UTM_KEY, JSON.stringify(utm))
    }
  } catch {
    return {
      landing_page: path,
      first_referrer: document.referrer || "",
      utm,
    }
  }

  return {
    landing_page: window.localStorage.getItem(LANDING_KEY) || path,
    first_referrer: window.localStorage.getItem(REFERRER_KEY) || document.referrer || "",
    utm: Object.keys(utm).length ? utm : readStoredJson(UTM_KEY),
  }
}

const getDeviceInfo = () => {
  const userAgent = window.navigator.userAgent
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent)

  return {
    device_type: isMobile ? "mobile" : "desktop",
    platform: window.navigator.platform || "",
    language: window.navigator.language || "",
    languages: window.navigator.languages || [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: {
      width: window.screen?.width,
      height: window.screen?.height,
      pixel_ratio: window.devicePixelRatio || 1,
    },
    browser: userAgent.slice(0, 260),
  }
}

const sendAnalyticsEvent = ({
  eventType,
  pathname,
  customerId,
  customerEmail,
  metadata = {},
}: {
  eventType: string
  pathname: string
  customerId?: string | null
  customerEmail?: string | null
  metadata?: Record<string, unknown>
}) => {
  const sessionId = getSessionId()
  const attribution = captureAttribution(pathname)
  const payload = {
    event_type: eventType,
    path: buildPath(pathname),
    title: document.title,
    referrer: document.referrer,
    session_id: sessionId,
    customer_id: customerId || null,
    customer_email: customerEmail || null,
    is_logged_in: Boolean(customerId),
    metadata: {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      visibility: document.visibilityState,
      attribution,
      device: getDeviceInfo(),
      user_location: getStoredLocation(),
      ...metadata,
    },
  }
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" })
    )

    if (sent) {
      return
    }
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

const SiteAnalyticsTracker = ({
  customerId,
  customerEmail,
}: SiteAnalyticsTrackerProps) => {
  const pathname = usePathname()
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)

  useEffect(() => {
    try {
      const prompted = window.localStorage.getItem(LOCATION_PROMPT_KEY)
      const hasLocation = Boolean(getStoredLocation())

      if (
        !prompted &&
        !hasLocation &&
        typeof navigator !== "undefined" &&
        "geolocation" in navigator
      ) {
        const timer = window.setTimeout(() => setShowLocationPrompt(true), 2500)
        return () => window.clearTimeout(timer)
      }
    } catch {
      return
    }
  }, [])

  const closeLocationPrompt = () => {
    try {
      window.localStorage.setItem(LOCATION_PROMPT_KEY, "dismissed")
    } catch {
      // no-op
    }
    setShowLocationPrompt(false)
  }

  const allowLocation = () => {
    try {
      window.localStorage.setItem(LOCATION_PROMPT_KEY, "asked")
    } catch {
      // no-op
    }

    if (!("geolocation" in navigator)) {
      closeLocationPrompt()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy || 0),
          captured_at: Date.now(),
          source: "browser_geolocation",
          permission: "granted",
        }

        try {
          window.localStorage.setItem(LOCATION_KEY, JSON.stringify(location))
          window.localStorage.setItem(LOCATION_PROMPT_KEY, "granted")
        } catch {
          // no-op
        }

        if (pathname) {
          sendAnalyticsEvent({
            eventType: "location_permission_granted",
            pathname,
            customerId,
            customerEmail,
            metadata: {
              user_location: location,
            },
          })
        }

        setShowLocationPrompt(false)
      },
      (error) => {
        try {
          window.localStorage.setItem(
            LOCATION_PROMPT_KEY,
            error.code === error.PERMISSION_DENIED ? "denied" : "failed"
          )
        } catch {
          // no-op
        }

        if (pathname) {
          sendAnalyticsEvent({
            eventType: "location_permission_denied",
            pathname,
            customerId,
            customerEmail,
            metadata: {
              location_error: error.message,
            },
          })
        }

        setShowLocationPrompt(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: LOCATION_MAX_AGE_MS,
      }
    )
  }

  useEffect(() => {
    if (!pathname) {
      return
    }

    const startedAt = Date.now()
    sendAnalyticsEvent({
      eventType: "page_view",
      pathname,
      customerId,
      customerEmail,
      metadata: {
        source: "route_change",
      },
    })

    const heartbeat = window.setInterval(() => {
      sendAnalyticsEvent({
        eventType: "heartbeat",
        pathname,
        customerId,
        customerEmail,
        metadata: {
          seconds_on_page: Math.round((Date.now() - startedAt) / 1000),
        },
      })
    }, 30_000)

    const onVisibilityChange = () => {
      sendAnalyticsEvent({
        eventType:
          document.visibilityState === "hidden" ? "page_hidden" : "page_visible",
        pathname,
        customerId,
        customerEmail,
        metadata: {
          seconds_on_page: Math.round((Date.now() - startedAt) / 1000),
        },
      })
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const element = target?.closest("a,button") as HTMLElement | null

      if (!element) {
        return
      }

      const text = (element.textContent || "").trim().slice(0, 120)
      const href = element instanceof HTMLAnchorElement ? element.href : ""
      const lower = `${text} ${href}`.toLowerCase()
      const isCommerceIntent =
        lower.includes("checkout") ||
        lower.includes("cart") ||
        lower.includes("buy") ||
        lower.includes("payment") ||
        lower.includes("add to")

      if (!isCommerceIntent) {
        return
      }

      sendAnalyticsEvent({
        eventType: "commerce_intent_click",
        pathname,
        customerId,
        customerEmail,
        metadata: {
          text,
          href,
          seconds_on_page: Math.round((Date.now() - startedAt) / 1000),
        },
      })
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    document.addEventListener("click", onClick, true)

    return () => {
      window.clearInterval(heartbeat)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      document.removeEventListener("click", onClick, true)
      sendAnalyticsEvent({
        eventType: "page_exit",
        pathname,
        customerId,
        customerEmail,
        metadata: {
          seconds_on_page: Math.round((Date.now() - startedAt) / 1000),
        },
      })
    }
  }, [customerEmail, customerId, pathname])

  return showLocationPrompt ? (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-md rounded-2xl border border-[rgba(13,129,126,0.18)] bg-white p-4 shadow-[0_18px_50px_rgba(18,63,99,0.22)]">
      <p className="text-sm font-semibold text-[var(--shreem-ink)]">
        Help us show better delivery and local offers
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
        Share approximate location once so Shreem can improve shipping, product
        demand and service quality. You can deny it and keep using the site.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={allowLocation}
          className="rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-4 py-2 text-xs font-semibold text-white"
        >
          Allow location
        </button>
        <button
          type="button"
          onClick={closeLocationPrompt}
          className="rounded-full border border-[var(--shreem-border)] px-4 py-2 text-xs font-semibold text-[var(--shreem-muted)]"
        >
          Not now
        </button>
      </div>
    </div>
  ) : null
}

export default SiteAnalyticsTracker
