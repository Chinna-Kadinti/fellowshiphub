const CACHE_NAME = "egf-connect-v5";
// Never precache Next.js documents. Their generated CSS filenames change between
// deployments, so an old HTML document can render as an unstyled page.
const APP_SHELL = ["/manifest.webmanifest", "/egf-connect.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isNextNavigationRequest =
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    url.searchParams.has("_rsc");

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    isNextNavigationRequest
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !response.redirected && response.url === request.url) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
