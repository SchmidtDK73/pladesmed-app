// Service worker: appen virker offline (ring og find vej kræver selvfølgelig net/telefon).
// Hæv VERSION når app-filer ændres.
const VERSION = "v18";
const SHELL = `pladesmed-${VERSION}`;
const FILER = [
  "./", "index.html", "styles.css", "app.js", "config.js", "manifest.webmanifest",
  "icons/logo.png", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILER.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Net først (så nye oplysninger slår igennem), cache hvis offline
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    // "no-cache": spørg altid serveren om der er en nyere fil (GitHub Pages lader ellers browseren genbruge i 10 min)
    fetch(e.request, { cache: "no-cache" }).then((r) => {
      const kopi = r.clone();
      caches.open(SHELL).then((c) => c.put(e.request, kopi));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
