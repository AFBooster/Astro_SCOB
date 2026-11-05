# SCOB Night-Sky — size & speed review (v4.21, Nov 2026)

How heavy the site is on a phone, what was fixed, and what is left. Re-run the numbers
after any big change.

## How it was measured

Chromium, 390 × 844 phone, **Slow 4G** (1.6 Mbit/s down, 150 ms round trip), **CPU slowed
4×**, files served gzip-compressed (as GitHub Pages does), service worker off (a first
visit), outside APIs blocked so only the site's own files count. Second of two runs.

## Results

| Page | Before (v4.20) | After (v4.21) |
|---|---|---|
| Sky Guide | 40 KB · first paint 0.42 s · LCP 0.58 s | 53 KB · 0.44 s · 0.68 s — adds the *Should I come tonight?* card and calendar button |
| Dashboard | 142 KB · LCP 0.87 s · **layout shift 0.65** | 148 KB · **layout shift 0.03** (desktop 0.63 → 0.09) |
| Haze | 41 KB · 0.47 s | 45 KB · 0.51 s — adds the five-region chart |
| Tonight's Tour | 45 KB · 0.47 s | 46 KB · 0.48 s (+14 KB of talking points only when 中文 / BM / தமிழ் is chosen) |
| First Night | 27 KB · 0.43 s | 39 KB · 0.50 s — adds the haze / storm line |
| Start here (new) | — | 38 KB · 0.51 s · LCP 0.66 s |

"Layout shift" is the Core Web Vitals CLS score: under 0.1 is good, over 0.25 is poor. On
the dashboard the whole page jumped down by 200–330 px about a second after it appeared,
when the summary line, chips and darkness bar were filled in — exactly when someone
reaches for a button.

## What was changed in v4.21

1. **Dashboard layout jump fixed** — the summary, the day note and the darkness bar now
   hold their space before the script fills them (`scob-dashboard-v3.html`, `:empty`
   min-heights). CLS 0.65 → 0.03 on a phone, 0.63 → 0.09 on desktop.
2. **Chinese-mansion data deferred** — `chinese-sky-data.js` (31 KB, 12 KB gzipped) only
   feeds the "Moon lodges in" chip, so the dashboard fetches it after the first paint.
3. **The visitor card stays light** — `come-tonight.js` reads the PSI and the PM2.5
   forecast directly instead of loading the 36 KB haze engine.
4. **Languages cost English readers nothing** — `scob-i18n.js` (21 KB gzipped) and
   `tour-i18n-data.js` (14 KB) load only when another language has been chosen.

## Left as it is, and why

- **Dashboard script, 147 KB (52 KB gzipped).** One file for every panel. Splitting out
  the rarely used parts (session pack, live mode, satellite tracks) would save perhaps
  15–20 KB on first load, but it is a large change to the most-used page for a modest
  gain. Worth doing only if the dashboard grows much further.
- **The dashboard ships both layouts** (desktop and phone) in its HTML and removes one at
  start-up — about 30 KB of HTML (14 KB gzipped) for the whole page. A rebuild would be
  needed to change that.
- **First-visit offline download.** The service worker caches all ~110 files (about 2.3 MB,
  roughly 0.9 MB compressed) in the background on the first visit, so the installed app
  works with no signal in the dome. It does not slow the page being viewed, but it is
  mobile data. If that ever matters, the culture pages could be cached on first visit
  instead of up front.
- Every page is under 150 KB compressed and shows content in about half a second on the
  test phone; there are no web fonts, no frameworks and no third-party scripts.
