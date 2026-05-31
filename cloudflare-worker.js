/*
 * Cloudflare Worker — First-Party Ad Proxy
 *
 * Deploy this at workers.cloudflare.com on your domain.
 * Requests to https://yourdomain.com/prx/* are forwarded to ad networks,
 * making them appear first-party to browser adblock extensions.
 *
 * Routes (must match your server config in sw.js):
 *   /prx/adsense/*   -> pagead2.googlesyndication.com
 *   /prx/medianet/*  -> contextual.media.net
 *   /prx/ezoic/*     -> www.ezojs.com
 *   /prx/tab/*       -> cdn.taboola.com
 *   /prx/propeller/* -> a.magsrv.com
 *   /prx/infolinks/* -> resources.infolinks.com
 *   /prx/sovrn/*     -> cdn.viglink.com
 *   /prx/outbrain/*  -> widgets.outbrain.com
 *   /prx/adsterra/*  -> cdn.adsterra.com
 */

const ROUTES = {
  '/prx/adsense':   'https://pagead2.googlesyndication.com',
  '/prx/medianet':  'https://contextual.media.net',
  '/prx/ezoic':     'https://www.ezojs.com',
  '/prx/tab':       'https://cdn.taboola.com',
  '/prx/propeller': 'https://a.magsrv.com',
  '/prx/infolinks': 'https://resources.infolinks.com',
  '/prx/sovrn':     'https://cdn.viglink.com',
  '/prx/outbrain':  'https://widgets.outbrain.com',
  '/prx/adsterra':  'https://cdn.adsterra.com',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  for (const [prefix, origin] of Object.entries(ROUTES)) {
    if (url.pathname.startsWith(prefix + '/') || url.pathname === prefix) {
      const upstreamPath = url.pathname.slice(prefix.length) || '/';
      const upstreamUrl  = origin + upstreamPath + url.search;

      const upstreamReq = new Request(upstreamUrl, {
        method:  request.method,
        headers: filterHeaders(request.headers),
        body:    ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      });

      try {
        const res = await fetch(upstreamReq);
        const headers = new Headers(res.headers);
        /* Allow embedding in our page */
        headers.set('Access-Control-Allow-Origin', '*');
        /* Cache ad scripts aggressively */
        if (/\.js(\?|$)/.test(url.pathname)) {
          headers.set('Cache-Control', 'public, max-age=3600');
        }
        return new Response(res.body, { status: res.status, headers });
      } catch {
        return new Response('', { status: 204 });
      }
    }
  }

  /* Not a proxy route — serve normally */
  return fetch(request);
}

function filterHeaders(inHeaders) {
  const out = new Headers();
  const PASS = ['accept', 'accept-language', 'accept-encoding', 'content-type',
                'content-length', 'user-agent', 'referer'];
  for (const [k, v] of inHeaders.entries()) {
    if (PASS.includes(k.toLowerCase())) out.set(k, v);
  }
  return out;
}
