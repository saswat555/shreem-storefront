"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

type SiteAnalyticsTrackerProps = {
  customerId?: string | null
  customerEmail?: string | null
}

const SESSION_KEY = "shreem_site_session_id"
const LANDING_KEY = "shreem_site_landing_page"
const REFERRER_KEY = "shreem_site_first_referrer"
const UTM_KEY = "shreem_site_utm"

const getSessionId = () => {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY)

    if (existing) {
      return existing
    }

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`

    window.localStorage.setItem(SESSION_KEY, next)

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
  const attribution = captureAttribution(pathname)
  const payload = {
    event_type: eventType,
    path: buildPath(pathname),
    title: document.title,
    referrer: document.referrer,
    session_id: getSessionId(),
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

  return null
}

export default SiteAnalyticsTracker
