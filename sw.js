/*
 * Service Worker — First-Party Ad Proxy
 *
 * Routes requests from /prx/* through to real ad network origins.
 * This makes ad script requests appear as same-origin (first-party) to
 * adblock filter lists, which almost exclusively match on remote hostnames.
 *
 * HOW TO CONFIGURE YOUR SERVER (pick one):
 *
 * ── Option A: Nginx reverse proxy ──────────────────────────────────────
 * location /prx/adsense/ {
 *   proxy_pass https://pagead2.googlesyndication.com/;
 *   proxy_set_header Host pagead2.googlesyndication.com;
 *   proxy_ssl_server_name on;
 * }
 * location /prx/medianet/ {
 *   proxy_pass https://contextual.media.net/;
 *   proxy_set_header Host contextual.media.net;
 *   proxy_ssl_server_name on;
 * }
 * location /prx/ezoic/ {
 *   proxy_pass https://www.ezojs.com/;
 *   proxy_set_header Host www.ezojs.com;
 *   proxy_ssl_server_name on;
 * }
 * location /prx/tab/ {
 *   proxy_pass https://cdn.taboola.com/;
 *   proxy_set_header Host cdn.taboola.com;
 *   proxy_ssl_server_name on;
 * }
 * location /prx/propeller/ {
 *   proxy_pass https://a.magsrv.com/;
 *   proxy_set_header Host a.magsrv.com;
 *   proxy_ssl_server_name on;
 * }
 * location /prx/sovrn/ {
 *   proxy_pass https://cdn.viglink.com/;
 *   proxy_set_header Host cdn.viglink.com;
 *   proxy_ssl_server_name on;
 * }
 *
 * ── Option B: Cloudflare Worker ───────────────────────────────────────
 * See cloudflare-worker.js in this repo for a ready-made CF Worker script.
 */

const PROXY_MAP = {
  'pagead2.googlesyndication.com':  '/prx/adsense/',
  'contextual.media.net':           '/prx/medianet/',
  'www.ezojs.com':                  '/prx/ezoic/',
  'cdn.taboola.com':                '/prx/tab/',
  'a.magsrv.com':                   '/prx/propeller/',
  'resources.infolinks.com':        '/prx/infolinks/',
  'cdn.viglink.com':                '/prx/sovrn/',
  'widgets.outbrain.com':           '/prx/outbrain/',
};

const CACHE_NAME = 'almanac-ad-proxy-v1';
const CACHEABLE_PATTERNS = [/\.js(\?|$)/, /\.css(\?|$)/];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const proxyBase = PROXY_MAP[url.hostname];

  /* ── Rewrite known ad-network requests to first-party proxy path ── */
  if (proxyBase) {
    const proxiedUrl = proxyBase + url.pathname.replace(/^\//, '') + url.search;
    const proxiedRequest = new Request(proxiedUrl, {
      method: e.request.method,
      headers: e.request.headers,
      credentials: 'omit',
    });

    /* Cache static ad scripts to survive refresh-based blocking */
    if (CACHEABLE_PATTERNS.some(p => p.test(url.pathname))) {
      e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          cache.match(proxiedRequest).then(cached => {
            if (cached) return cached;
            return fetch(proxiedRequest).then(res => {
              cache.put(proxiedRequest, res.clone());
              return res;
            }).catch(() => cached || new Response('', { status: 204 }));
          })
        )
      );
    } else {
      e.respondWith(
        fetch(proxiedRequest).catch(() => new Response('', { status: 204 }))
      );
    }
    return;
  }

  /* ── Pass-through for everything else ── */
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 204 })));
});
