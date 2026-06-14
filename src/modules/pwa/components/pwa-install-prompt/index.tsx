"use client"

import { useEffect, useMemo, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const DISMISSED_KEY = "shreem_pwa_install_dismissed_at"
const DISMISS_DAYS = 14

const trackPwaEvent = (eventType: string, metadata: Record<string, unknown>) => {
  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: eventType,
      path: window.location.pathname,
      title: document.title,
      metadata,
    }),
    keepalive: true,
  }).catch(() => undefined)
}

const wasRecentlyDismissed = () => {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0)

  if (!dismissedAt) {
    return false
  }

  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

const PwaInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  const canInstall = useMemo(
    () => Boolean(promptEvent) || showIosHint,
    [promptEvent, showIosHint]
  )

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("[PWA] service worker registration failed", error)
      })
    })
  }, [])

  useEffect(() => {
    if (wasRecentlyDismissed() || isStandalone()) {
      setDismissed(true)
      return
    }

    setDismissed(false)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
      trackPwaEvent("pwa_install_available", { platform: "android_chrome" })
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)

    if (isIos()) {
      const timeout = window.setTimeout(() => {
        if (!isStandalone()) {
          setShowIosHint(true)
          trackPwaEvent("pwa_install_available", { platform: "ios_safari" })
        }
      }, 2500)

      return () => {
        window.clearTimeout(timeout)
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    }
  }, [])

  if (dismissed || !canInstall) {
    return null
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setDismissed(true)
    trackPwaEvent("pwa_install_dismissed", {
      platform: promptEvent ? "android_chrome" : "ios_safari",
    })
  }

  const install = async () => {
    if (!promptEvent) {
      return
    }

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice.catch(() => null)
    trackPwaEvent("pwa_install_choice", {
      platform: choice?.platform || "android_chrome",
      outcome: choice?.outcome || "unknown",
    })
    setPromptEvent(null)
    setDismissed(true)
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-lg border border-[rgba(18,63,99,0.14)] bg-white px-4 py-3 shadow-[0_18px_44px_rgba(15,49,70,0.18)]">
      <div className="flex items-start gap-3">
        <img src="/icon.jpg" alt="" className="h-10 w-10 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            Install Shreem
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
            {promptEvent
              ? "Open Shreem faster from your home screen."
              : "On iPhone, tap Share, then Add to Home Screen."}
          </p>
          <div className="mt-3 flex gap-2">
            {promptEvent && (
              <button
                type="button"
                onClick={install}
                className="rounded-md bg-[var(--shreem-ink)] px-3 py-2 text-xs font-semibold text-white"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-[var(--shreem-border)] px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallPrompt
