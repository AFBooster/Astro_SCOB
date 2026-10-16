# Publishing the SCOB Night-Sky site

The site auto-deploys to **GitHub Pages** whenever you push to the `main` branch.
Every push runs the full test suite first, and **only publishes if all tests pass** —
so a broken build can never go live.

- **Repo:** https://github.com/AFBooster/Astro_SCOB
- **Live site:** https://afbooster.online/ (custom domain; the old `afbooster.github.io/Astro_SCOB/` address forwards to it)
- **Deploy runs (Actions):** https://github.com/AFBooster/Astro_SCOB/actions

---

## The easy way — one click

Double-click **`publish.bat`** in this folder. Type a short description of what
changed, press Enter, and it will:

1. clear any stale git lock files left by a crashed git process,
2. run the local tests (skipped automatically if Node isn't installed) and `check-release.sh`,
3. commit everything — and stop with a clear message if the commit itself fails,
4. pull first (the haze-image Action commits to the repo several times a week), then
5. push to GitHub — which triggers the deploy.

Or from a terminal in this folder:

```
publish.bat "what changed"
```

(Git Bash / macOS / Linux: `./deploy.sh "what changed"` does exactly the same steps — since v4.18 it mirrors `publish.bat`, safeguards included.)

---

## The manual way — three git commands

From a terminal **in this folder**:

```
git add -A
git commit -m "what changed"
git push
```

That's it — but `git pull --no-edit` before the push saves a rejected push, because the
haze-image Action commits to `main` on its own. Then watch the **Actions** tab go green;
the change is live about a minute later.

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
   Since v4.15 the deploy's last step, *Verify the live site is serving this build*, reads
   `version.js` and `nea-haze.json` back from afbooster.online and fails the run (GitHub
   emails you) if the live site isn't serving what was just built within 8 minutes.
2. **Live footer** — open the site and confirm the footer shows the version in
   `version.js`. That's the quickest "is it live and current" check by eye.
3. **Settings → Pages** shows *"Your site is live at …"* with a green check.

---

## What gets published

Only the web files: every `*.html`, `*.js`, `*.css`, `*.webmanifest`, the icons,
`og-image.png`, `robots.txt`, `sitemap.xml` and `nea-haze.json` (the pointer to MSS's
current haze satellite image). The workflow copies `scob-dashboard-v3.html` to
`index.html` so the bare site URL opens the dashboard, and writes the `CNAME` file for
afbooster.online on every build.

**Not** published (they stay in the repo but never reach the live site):
`README.md` and other `.md` files, `check-release.sh`, `deploy.sh`, `publish.bat`,
and `SCOB-Dashboard-User-Guide.pptx/.pdf`.

Some `.js` files *would* be caught by the blanket `cp *.js` and are therefore deleted
from `_site` explicitly by the workflow — if you add another dev-only script, add it
to that `rm -f` line too:

- `test-astro.js`, `test-logic.js`, `test-pages.js`, `test-browser.js` — the CI suites
- `migrate-theme.js` — the one-page-at-a-time CSS migration tool

**Why dev tooling stays tracked.** `check-release.sh`, `deploy.sh`, `publish.bat` and
the test suites have always been committed, so `migrate-theme.js` is kept for
consistency: anyone who clones the repo gets the same tools you have. It is excluded
from the service-worker cache (`EXCLUDE_ASSETS` in `check-release.sh`) and from the
published site, so it costs visitors nothing. `world-skies-roadmap.md` likewise stays
committed — `.md` files are never published, so it is visible to anyone browsing the
repo but never served from the site.

---

## The two GitHub Actions

| Workflow | Runs | Does |
|---|---|---|
| `deploy-pages.yml` | every push to `main`, and on demand | all four test suites → `check-release.sh` → publish → read the live site back |
| `refresh-nea-haze.yml` | hourly (GitHub often runs scheduled jobs late) | looks up MSS's current haze satellite image; **only when it is a new image**, commits the pointer and starts a deploy |

A push made by a workflow does not trigger other workflows, so the refresh job starts
the deploy itself (`gh workflow run`). Both run on `ubuntu-24.04`, pinned because
`ubuntu-latest` moves to Ubuntu 26 from 19 Oct 2026 and the browser test installs
packages for a known Ubuntu.

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
| red at *Verify the live site…* | the site published but afbooster.online is not serving it — check Settings → Pages (custom domain, HTTPS), then re-run the workflow |
| site shows an **old version** | the browser/service-worker cached it — hard-refresh, or unregister the service worker once (DevTools → Application → Service Workers → Unregister) |
