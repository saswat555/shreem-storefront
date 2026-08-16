const CACHE_NAME = "shreem-pwa-v6-astrology-no-store"
const STATIC_ASSETS = [
  "/",
  "/in",
  "/manifest.webmanifest",
  "/icon.jpg",
  "/logo.jpeg",
]

const NETWORK_ONLY_PREFIXES = [
  "/api/",
  "/app",
  "/admin",
  "/in/account",
  "/in/shreem-astrology",
  "/in/cart",
  "/in/checkout",
  "/in/order",
  "/in/auth",
  "/account",
  "/shreem-astrology",
  "/cart",
  "/checkout",
  "/order",
  "/auth",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (NETWORK_ONLY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      fetch(request, {
        cache: "no-store",
      }).catch(() =>
        new Response("Network required for this secure page.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        })
      )
    )
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/in")))
    )
    return
  }

  // Let the browser fetch scripts, RSC payloads, images and API-like GETs
  // directly. Intercepting these made a transient network failure reject the
  // FetchEvent and could break hydration or loading a saved Kundli.
  return
})
