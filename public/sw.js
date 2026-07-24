// Service Worker stub — caching strategies and background sync
// will be implemented in a later phase.

const CACHE_NAME = "novapay-v1"

self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Claim all clients so the first load is controlled
  event.waitUntil(clients.claim())
})

self.addEventListener("fetch", (event) => {
  // Pass-through — offline caching strategies added later
  event.respondWith(fetch(event.request))
})

// ── Web Push ──────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}

  event.waitUntil(
    self.registration.showNotification(data.title ?? "NovaPay", {
      body:  data.body  ?? "",
      icon:  "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag:   data.tag   ?? "novapay-notification",
      data:  { url: data.url ?? "/app/dashboard" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? "/app/dashboard"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url === targetUrl && "focus" in c)
        if (existing) return existing.focus()
        return clients.openWindow(targetUrl)
      })
  )
})
