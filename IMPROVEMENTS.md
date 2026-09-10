# SCOB Night-Sky — improvement backlog

Audited at **v4.11** (cache `scob-sky-v114`), 10 Sep 2026, against the live site
at afbooster.online. Every item below is backed by something measured, not by a
guess — the evidence is quoted so you can re-check it yourself.

Ranked by value ÷ effort. The first two are the ones I would do next.

---

## 1. 7Timer! is unreachable — "seeing" has silently degraded to a guess

**Evidence.** From a browser on `afbooster.online`:

```
fetch('https://www.7timer.info/bin/api.pl?...')   -> TypeError: Failed to fetch
fetch(same, {mode:'no-cors'})                     -> type: "opaque", status: 0
```

An *opaque* response means the server is up and answering — it simply sends no
`Access-Control-Allow-Origin` header, so the browser discards the reply. The
live dashboard confirms the user-visible result:

> 🔭 Seeing & transparency · **estimated from local weather** … *the 7Timer!
> seeing model was unavailable or outside its ~week-ahead range.*

So the fallback in `loadSeeing()` is not a fallback any more, it is the only
path. Two consequences:

* Seeing is being inferred from **surface wind speed** (2 km/h → "good"), which
  is close to meaningless for astronomical seeing. The glance chip, the session
  run-sheet and the Jupiter/Saturn high-power advice all lean on it.
* `about.html` still credits 7Timer as a live source. That is now inaccurate.

**The fix is an upgrade, not a patch.** Seeing is driven by turbulence *aloft*,
and the single best cheap predictor is the **200–300 hPa wind speed** — a jet
streak overhead wrecks high-power detail no matter how still the deck feels.
Open-Meteo already serves those levels, is already a dependency, and is already
proven to work from this origin (`wind_speed_250hPa`, `wind_speed_200hPa`, and
`temperature`/`geopotential` levels for a crude stability term). `haze-core.js`
already fetches 850 hPa winds for smoke transport, so the pattern exists.

Suggested shape: a `seeing-core.js` (or a block in `astro-core.js`) that returns
`{arcsec, label, driver}` where `driver` names *why* — "jet stream 95 kt at
250 hPa" reads far better to a volunteer than "fair". Then correct `about.html`.

**Effort:** half a day. **Value:** high — it restores a headline number that
three parts of the dashboard depend on, and makes it more honest than 7Timer was.

---

## 2. `plan-ahead.html` ignores the haze data we now have

**Evidence.**

```
haze refs in plan-ahead.html : 0
its Open-Meteo query          : hourly=cloud_cover,precipitation_probability
```

v4.09 added a **five-night haze outlook** (PM2.5, PM10, dust, satellite aerosol
depth, averaged over the 7–11 pm window, Fridays already highlighted) — and the
one page whose entire job is *"which upcoming Friday should we run?"* still
compares nights on Moon phase and cloud alone.

This is the cheapest big win on the list, because the data and the model already
exist: `Haze.fetchForecast()` → `Haze.nightlyFromForecast()` → `Haze.excess()`
gives magnitudes-lost per night in three calls. Add a haze column, and fold it
into whatever ranking the page already does, so a clear-but-hazy Friday stops
outranking a slightly-cloudier clean one.

**Effort:** 2–3 hours. **Value:** high — it closes the loop on v4.09/4.11.

---

## 3. Refresh the comet elements — due 2026-10-01 (21 days)

**Evidence.** `node test-astro.js` warns on every run:

```
! Comet elements — Comet 10P/Tempel 2: review due 2026-10-01 — 21 days left.
```

`astro-core.js` carries orbital elements with an explicit `review:` date and a
validity window (`from:2461161.5, to:2461405.5`). This is the review guard doing
exactly what it was built to do. Refresh from the Minor Planet Center or JPL
Horizons and push the review date out.

**Effort:** 30 minutes. **Value:** medium, but it is a hard deadline — after it
passes, the comet page starts quietly showing positions outside their fit.

---

## 4. The dashboard is 191 KB, and every visitor downloads both layouts

**Evidence.**

```
scob-dashboard-v3.html   191.3 KB total
  inline CSS              39.4 KB (20%)   desktopCSS 14.7 KB + mobileCSS 15.3 KB
  inline JS              124.9 KB (65%)
  markup + rest           27.0 KB
desktop + mobile roots both shipped to every visitor: yes
```

Both stylesheets and both DOM trees ship to every device, and JS deletes the
unused half at runtime. On a phone on observatory wifi that is ~15 KB of dead CSS
and a duplicate DOM before anything renders — and it is the **entry page**, also
copied to `index.html`.

The site already knows how to do this properly: `astro-core.js`, `sky-data.js`
and `haze-core.js` are shared, cached once, and reused across pages. The
dashboard's 125 KB of inline JS is the last big holdout. Lifting even the
target-rendering and briefing code into a `dashboard-core.js` would cut the
entry page substantially and let the service worker cache it once.

**Effort:** a day, and it is refactoring with real regression risk — the three
test suites plus `test-browser.js` make it feasible, but do it on its own release
with nothing else in flight. **Value:** medium.

---

## 5. Give the data-health strip the two sources it does not yet cover

The strip tracks weather, satellite TLEs, haze and the GRS model — genuinely
good, and it is how the v4.10 blank-image bug would have been caught sooner. It
does **not** track seeing or solar activity, which are exactly the two that fail
quietly (see item 1). Add them, and the pattern is complete: *every* live source
either shows fresh, shows stale, or shows absent.

**Effort:** an hour, once item 1 lands. **Value:** medium, compounding.

---

## 6. Let the logbook grade the haze call too

`session-log.html` already captures the go/no-go the app would have given and
grades it against what you logged (15 references to forecast/verdict/grade). Now
that the haze panel makes a *falsifiable* claim each night — "costs ~0.3 mag on a
well-placed target" — the logbook could capture it and, over a season, tell you
whether the optical model is calibrated for Jurong. That would turn the estimate
in `haze-core.js` from a documented guess into a measured one.

**Effort:** half a day. **Value:** medium, and it is the kind of thing that makes
the site distinctive rather than merely useful.

---

## 7. Housekeeping already done in this pass

* Removed `GetCapabilities.xml` (2.27 MB) — a browsing artifact of mine that got
  committed and pushed. It never reached the live site (the deploy stages an
  explicit file list that excludes `.xml`), but it was in the repo.
* Removed `Claude outputs/` (644 KB of my screenshots).
* `.gitignore` now excludes stray `*.xml` with `!sitemap.xml` re-included, so a
  browser saving into the project folder cannot repeat this.

Still yours to decide:

* `scob-v4.03.patch`, `scob-v4.04.patch`, `scob-v4.05.patch` — 148 KB of patch
  files from released versions. The history has them; the working tree probably
  does not need to.
* `.git/.writetest` — a zero-byte file I created probing write access and could
  not delete through the file bridge. `del /f /q .git\.writetest`.
* `README.md` is 130 KB, almost all version history. It is not served, so this
  costs nothing at runtime, but it is getting unwieldy to edit. Splitting
  pre-v4.0 rows into `CHANGELOG-v3.md` would keep the active table readable.

---

## Checked and found healthy — no action needed

* **All internal links resolve**, no orphan pages, 12/12 release gates, all three
  test suites green.
* **No `<img>` without `alt`** across 76 pages.
* **Service worker precache**: 100 entries, ~2.0 MB, none missing on disk.
* **Live endpoints**: NEA PSI v2, NEA PM2.5 v2, the v1 legacy fallback, the MSS
  2-hour nowcast, Open-Meteo forecast, Open-Meteo air quality, CelesTrak and
  NOAA SWPC all answered 200 with CORS from `afbooster.online`. Only 7Timer
  fails (item 1).
* **The v4.11 scheduled Action works** — `nea-haze.json` self-updated to
  `suma_20260909_140505.jpg` at 23:20 UTC without intervention.
* **Total site payload** ~2.1 MB across 76 pages, which is lean for what it does.
