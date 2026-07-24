# Publishing the SCOB Night-Sky site

The site auto-deploys to **GitHub Pages** whenever you push to the `main` branch.
Every push runs the full test suite first, and **only publishes if all tests pass** —
so a broken build can never go live.

- **Repo:** https://github.com/AFBooster/Astro_SCOB
- **Live site:** https://afbooster.github.io/Astro_SCOB/
- **Deploy runs (Actions):** https://github.com/AFBooster/Astro_SCOB/actions

---

## The easy way — one click

Double-click **`publish.bat`** in this folder. Type a short description of what
changed, press Enter, and it will:

1. run the local tests (skipped automatically if Node isn't installed),
2. commit everything,
3. push to GitHub — which triggers the deploy.

Or from a terminal in this folder:

```
publish.bat "what changed"
```

(Git Bash users can use `./deploy.sh "what changed"` instead — same idea.)

---

## The manual way — three git commands

From a terminal **in this folder**:

```
git add -A
git commit -m "what changed"
git push
```

That's it. Then watch the **Actions** tab go green, and the change is live about a
minute later.

---

## Publishing without any file change (re-deploy on demand)

Two options:

- **GitHub website:** Actions tab → *Deploy SCOB Night-Sky to GitHub Pages* →
  **Run workflow** button.
- **Terminal:** an empty commit still triggers a deploy:
  ```
  git commit --allow-empty -m "redeploy"
  git push
  ```

---

## How to check a deploy worked

1. **Actions tab** → the latest *Deploy SCOB Night-Sky…* run has a **green tick**.
   (A red X means a step failed — click it to see which; nothing was published.)
2. **Live footer** — open the site and confirm the footer shows the current version
   (e.g. `SCOB Night-Sky v3.42`). That's the quickest "is it live and current" check.
3. **Settings → Pages** shows *"Your site is live at …"* with a green check.

---

## What gets published

Only the web files: every `*.html`, `*.js`, `*.webmanifest`, and the icons.
The workflow copies `scob-dashboard-v3.html` to `index.html` so the bare site URL
opens the dashboard.

**Not** published (they stay in the repo but never reach the live site):
`README.md` and other `.md` files, the test scripts (`test-*.js`), `check-release.sh`,
`deploy.sh`, `publish.bat`, and `SCOB-Dashboard-User-Guide.pptx/.pdf`.

---

## First-time setup (already done — for reference)

1. Create the repo on GitHub (Public).
2. In this folder: `git init`, set your name/email, `git add -A`, `git commit`,
   `git remote add origin <repo-url>`, `git push -u origin main`.
3. Repo **Settings → Pages → Source → GitHub Actions**.

If git ever says *"detected dubious ownership"*, run once:

```
git config --global --add safe.directory "C:/Users/heng_wb/Claude/Projects/Weekly Night Sky Objects To See At Singapore Science Observatory"
```

---

## Troubleshooting quick reference

| Symptom | Fix |
|---|---|
| `detected dubious ownership` | the `safe.directory` command above (run once) |
| `repository ... not found` on push | wrong remote URL — copy it from the repo's green **Code** button, then `git remote set-url origin <url>` |
| push `! [rejected] ... (fetch first)` | remote has commits you don't: `git pull --no-edit` then `git push` (or, only for a fresh repo, `git push --force`) |
| asked for a password | use a **Personal Access Token**, not your account password (GitHub removed password auth), or approve the browser popup |
| Actions run is **red** | click it to see the failing step; if it's the *Deploy* step, set Settings → Pages → Source → **GitHub Actions** |
| site shows an **old version** | the browser/service-worker cached it — hard-refresh, or unregister the service worker once (DevTools → Application → Service Workers → Unregister) |
