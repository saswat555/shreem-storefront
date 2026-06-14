"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

type SiteAnalyticsTrackerProps = {
  customerId?: string | null
  customerEmail?: string | null
}

const SESSION_KEY = "shreem_site_session_id"

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
