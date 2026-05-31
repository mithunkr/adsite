/*
 * ════════════════════════════════════════════════════════════════
 *  SITE MODE — single switch for the entire site
 * ════════════════════════════════════════════════════════════════
 *
 *  'compliant'  →  Serves index.html (tasteful, AdSense-safe layout):
 *                  • Only reputable networks (Google AdSense + Media.net)
 *                  • Healthy content-to-ad ratio (~6 clearly-labeled units)
 *                  • All 15 facts shown as readable content
 *                  • NO anti-adblock, NO service-worker proxy
 *                  • Use this while building traffic + getting AdSense approved
 *
 *  'max'        →  Serves wall.html (the ad-wall, revenue-maximized):
 *                  • All 10+ networks, 44 ad slots
 *                  • Anti-adblock detection, soft gate, fallbacks, proxy
 *                  • Facts hidden among the ads (the "hunt")
 *                  • Use ONLY with low-bar networks (Ezoic, PropellerAds,
 *                    Adsterra, etc.). This layout WILL fail AdSense review.
 *
 *  HOW TO SWITCH:  change the value below, save, redeploy.
 *  Both index.html and wall.html read this file and redirect to the
 *  correct page, so the whole site flips with one edit.
 * ════════════════════════════════════════════════════════════════
 */
window.SITE_MODE = 'compliant';   // 'compliant' | 'max'
