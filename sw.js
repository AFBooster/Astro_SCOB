/* SCOB Night-Sky — service worker: offline cache so the installed app opens with no signal */
const CACHE = 'scob-sky-v99';
const ASSETS = [
  'aboriginal-sky.html',
  'aboriginal-tonight.html',
  'about.html',
  'align-stars.html',
  'almanac.html',
  'audio-tour.html',
  'babylonian-sky.html',
  'babylonian-tonight.html',
  'checklist.html',
  'chinese-sky.html',
  'chinese-tonight.html',
  'comets.html',
  'constellation-story.html',
  'cosmic-extremes.html',
  'egyptian-sky.html',
  'egyptian-tonight.html',
  'eyepiece-fov.html',
  'filters.html',
  'greek-sky.html',
  'greek-tonight.html',
  'highlights-card.html',
  'identify.html',
  'inca-sky.html',
  'inca-tonight.html',
  'indian-sky.html',
  'indian-tonight.html',
  'arabic-sky.html',
  'arabic-tonight.html',
  'lunar-mansions.html',
  'sky-through-ages.html',
  'session-log.html',
  'passport.html',
  'presentation.html',
  'now-showing.html',
  'session-reminder.html',
  'iss-transits.html',
  'kiosk.html',
  'light-pollution.html',
  'main.html',
  'malay-sky.html',
  'malay-tonight.html',
  'maya-sky.html',
  'maya-tonight.html',
  'meteors.html',
  'moon-tonight.html',
  'object-cards.html',
  'occultations.html',
  'phone-astrophotography.html',
  'plan-ahead.html',
  'polynesian-sky.html',
  'polynesian-tonight.html',
  'qr-poster.html',
  'quiz.html',
  'scale-model.html',
  'scob-dashboard-v3.html',
  'scob-dashboard.html',
  'seestar.html',
  'singapore-sky.html',
  'sky-events.html',
  'sky-finder.html',
  'sky-guide.html',
  'solar.html',
  'solar-system-outer.html',
  'solar-system-planets.html',
  'solar-system.html',
  'space-telescopes.html',
  'telescope-types.html',
  'tonights-tour.html',
  'tracking-methods.html',
  'aboriginal-sky-data.js',
  'astro-core.js',
  'babylonian-sky-data.js',
  'chinese-sky-data.js',
  'egyptian-sky-data.js',
  'greek-sky-data.js',
  'inca-sky-data.js',
  'malay-sky-data.js',
  'maya-sky-data.js',
  'nakshatra-sky-data.js',
  'arabic-sky-data.js',
  'polynesian-sky-data.js',
  'sky-culture-core.js',
  'sky-data.js',
  'version.js',
  'scob-theme.css',
  'manifest.webmanifest',
  'sky-guide.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];
self.addEventListener('install', e => {
  // Cache assets individually so one missing file doesn't abort the whole install.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(a => c.add(a)))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Don't intercept cross-origin requests (e.g. the live weather API) — let them hit the network fresh.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // Network-first for pages AND for version.js / astro-core.js — these change on every
  // release and control what the site shows (the footer version, the astronomy engine),
  // so an updated build must show immediately when online. The cache is only the OFFLINE
  // fallback. Everything else (icons, manifests) stays cache-first — they almost never change.
  // This is what prevents a stale cached version.js from pinning the footer to an old version.
  const url = e.request.url;
  const isPage = e.request.mode === 'navigate' || url.endsWith('.html');
  const isLive = url.endsWith('version.js') || url.endsWith('astro-core.js') || url.endsWith('sky-culture-core.js');
  if (isPage || isLive) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || (isPage ? caches.match('scob-dashboard-v3.html') : undefined)))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('scob-dashboard-v3.html')))
  );
});
