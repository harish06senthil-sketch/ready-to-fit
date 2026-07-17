/* =========================================================
   ZeriqAI Service Worker
   Version: 2.1
========================================================= */

const CACHE_NAME = "PULSE_TRAK";

// Fixed: Removed "public/" prefix and made paths absolute root URLs
const STATIC_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/frame1.png",
  "/icon_512.png"
];

/* ============================
   INSTALL
============================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

/* ============================
   ACTIVATE
============================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ============================
   FETCH
============================= */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;

  /* ---------- HTML Pages ----------
     Network First
  --------------------------------*/
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => {
              return cached || caches.match("/offline.html");
            });
        })
    );
    return;
  }

  /* ---------- Static Assets ----------
     Cache First
  --------------------------------*/
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (
              !response ||
              response.status !== 200
            ) {
              return response;
            }

            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, copy);
              });

            return response;
          });
      })
  );
});

/* ============================
   PUSH
============================= */
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New Notification",
    // Fixed: Pointing to your new renamed root icon
    icon: "/frame1.png", 
    badge: "/frame1.png"
  };

  event.waitUntil(
    self.registration.showNotification("ZeriqAI", options)
  );
});

/* ============================
   NOTIFICATION CLICK
============================= */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});
