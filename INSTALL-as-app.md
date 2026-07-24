# Install the SCOB Night-Sky dashboard as a phone app

The dashboard is now a **single file** (`scob-dashboard-v3.html`) that auto-detects desktop vs. mobile, and is a **Progressive Web App (PWA)** — it can sit on your home screen with its own icon and open full-screen like a normal app, working offline.

## Important: phones won't install a plain local file

For security, phones only let you "install" a web page that's served from an **https:// address** — they will not install a file opened straight from the Files app. So the page (plus its icon/manifest/service-worker files) needs to live at a web link first. This is a one-time, free setup.

### Files that must stay together in the same folder

- `scob-dashboard-v3.html` (the app — detects desktop/mobile automatically)
- `scob-dashboard.html`, `main.html` (redirect stubs for older installs)
- `moon-tonight.html` (Tonight on the Moon page)
- `telescope-types.html` (telescope guide page)
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`, `icon-512.png`, `icon-180.png`

**After any update, re-upload ALL of these** — the phone app updates itself on the next open once the new files are live.

## Easiest way to host it (free, no account): Netlify Drop

1. On a computer, go to **https://app.netlify.com/drop**
2. Drag the **whole folder** (containing all the files above) onto the page.
3. Netlify gives you a link like `https://your-name.netlify.app/scob-dashboard.html`. Open that link on your phone.

(Alternatives that work the same way: GitHub Pages, Cloudflare Pages, or any static web host.)

## Add it to your home screen

**iPhone / iPad (Safari):** open the link → tap the **Share** button → **Add to Home Screen** → Add. The gold-moon icon appears on your home screen and opens full-screen.

**Android (Chrome):** open the link → tap the **⋮ menu** → **Install app** (or **Add to Home screen**) → Install.

Once added, it launches like an app, remembers your Visual/Seestar choice, and works without a signal (the sky data is computed on-device). The only things that need internet are the live feeds — weather forecast, rain radar, PSI, satellite orbits, and the MSS Nowcast / SCOB Facebook links.

## Tip

If you can't host it right now, you can still use it: just open `scob-dashboard-v3.html` in your phone's (or computer's) browser. You won't get the installed icon, but everything else works — it'll show the mobile or desktop layout automatically.
