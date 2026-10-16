# SCOB Night-Sky — improvement backlog

Re-audited at **v4.17** (cache `scob-sky-v120`), 15 Oct 2026. Earlier audits:
v4.14 and v4.13 (Oct), v4.11 (10 Sep 2026). Every open item is backed by something measured, not by a
guess — the evidence is quoted so you can re-check it yourself.

Open items are ranked by value ÷ effort.


## Done in v4.15 (15 Oct 2026)

* **Watch the watchers.** The freshness strip shows the haze forecast and the
  seeing source; the deploy workflow reads the live site back and fails if it
  is not serving the build.
* **Calibration hook.** The session logbook records the naked-eye limit and an
  Antoniadi grade beside what the app predicted, and fits one against the other
  once there are five nights. *The calibration itself is now up to the
  logbook* — nothing is fitted until Fridays are logged.
* **No comet in reach** is said plainly on the dashboard and the comets page.
* **Engine audit against JPL Horizons** — see below for what was fixed and
  what was deliberately left.
* README history before v4.0 moved to `CHANGELOG-v3.md`; old `.patch` files
  removed and ignored (never committed; the same changes are the v4.03-v4.05
  commits `52a63af`, `e9d35d3`, `63945f2`).

### Engine audit — results (15 Oct 2026, JPL Horizons topocentric apparent places)

| Body / feature | Before | After | Action |
|---|---|---|---|
| Mercury, Venus, Mars | 0.1–0.6′ | same | none needed |
| Jupiter | 1.3–1.5′ | 0.1–0.7′ | Schlyter perturbations |
| Saturn | 6.4–8.1′ | 0.2–1.0′ | Schlyter perturbations |
| Occultation scan: stars | J2000 vs of-date, ~22′ | to the minute (17 Jun 2027 Antares) | precess to date |
| Near-limb occultations | stated hit/miss | flagged *too close to call* within 2′ | engine Moon is good to 1–2′ |
| Conjunction finder: Moon | geocentric, up to 1° | topocentric | uses `moonTopo` |
| Comet 10P | (fixed v4.13) | 0.7′ | — |

**Checked and left alone, on purpose:**

* **Deep-sky catalogue positions** are J2000 fed to an of-date sidereal time,
  so altitudes and azimuths are ~20′ out. They are shown in whole degrees, the
  GoTo mounts precess for themselves, and the targets are tens of arc-minutes
  across. Not worth the risk of touching every catalogue consumer.
* **The Moon's altitude readout** is geocentric, so up to ~1° high near the
  horizon. Rise and set times already allow for parallax (the standard
  +0.125° altitude), the occultation and transit code uses the topocentric
  Moon, and the readout is in whole degrees. Worth fixing only if someone
  notices it.

---

## Done in v4.14 (15 Oct 2026)

* **Live MSS haze image was 8 days stale.** Bot commits from the refresh Action
  never triggered a deploy (GitHub suppresses workflow runs from `GITHUB_TOKEN`
  pushes). The Action now dispatches `deploy-pages.yml` when the pointer
  changes, and `haze.html` flags any scene older than 36 hours.
* **Tomorrow's verdict ignored today's air** (PSI 211 on a Thursday, nothing in
  the Friday headline or blurb). Fixed for nights one or two days ahead.
* `haze.html` added to `sitemap.xml`; redirect stubs marked `noindex` with a
  canonical link.

## Done in v4.13

* **7Timer replaced (was item 1, v4.13).** Seeing is estimated on-device from
  Open-Meteo's 250 hPa wind, the 850 hPa–surface shear and CAPE, and names its
  driver. `about.html` corrected. See open item 1 for what this did *not* do.
* **`plan-ahead.html` uses the haze forecast (was item 2, v4.13).** Fridays get
  a haze line and a smoky Friday is never the deep-sky pick. Two latent bugs
  fixed with it: the best-night pick ignored cloud, and Fridays beyond the
  16-day forecast said "loading…" for ever.
* **Comet elements refreshed (was item 3, v4.13)** from JPL Horizons, next
  review 31 Dec 2026 — and the check uncovered a frame error in `cometEq()`
  worth up to 76 arc-minutes, now 0.7′. See the v4.13 README row.
* **Haze drives the verdict (new in v4.13).** Column depth as well as ground
  PM2.5; go/no-go, share blurb, limiting magnitude and every target verdict
  listen; future dates use that night's forecast.

---

## Done in v4.17 — scrolling the top of the page

Desktop header flicker (collapse + scroll anchoring feedback), the phone header pinned over the
whole screen (shared theme made it sticky), and the phone bar now slides away and back. The same
slide-away behaviour on phones for every page via `version.js`. Lesson kept as a rule in
`dashboard-core.js`: nothing that reacts to scrolling may change the page height near its own
trigger point.

---

## Done in v4.16 — the dashboard's code is a file

`dashboard-core.js` replaces the inline text/plain block: page 214 KB → 70 KB,
code cached and compiled once. Six scenarios × two layouts rendered identically
before and after. Splitting the two layouts' CSS and markup was measured and
**not** done: the unused half is ~10 KB of 65 KB gzipped, against a real risk
of an unstyled flash on slow phones. If the page grows much further, the next
cut is moving the haze verdict helpers (`hazeNight`, `hazeCostAt`,
`hazeVerdict`, `hazeNow`) into `haze-core.js` so `plan-ahead.html` can share
them.

---

## 1. Feed the calibration back

Once the logbook has five or more nights with both a naked-eye limit and a
prediction, read the **🎯 Model check** report and:

* scale `Haze.skyCost()` by the fitted slope if it is clearly not −1 (the report
  says by how much), and set the clean-night baseline from the intercept;
* refit the three seeing weights in `seeing-core.js` if the rank agreement stays
  below about 0.3.

Nights with a spread of haze teach the most: a couple of clean Fridays and a
couple of smoky ones beat ten alike.

**Effort:** an hour, once the data exists. **Value:** high — it turns two
documented guesses into fitted numbers.

---

## 2. Comets — re-check in November

COBS on 15 Oct 2026 showed nothing brighter than magnitude 11 (10P ~10.5 and
fading, 161P ~11.2, P/2026 R2 ~12.1). Look again in November; the 10P window
closes 31 Dec 2026 and `test-astro.js` warns from 1 Dec.

---

## Checked at v4.13 (still current)

* 7 Oct 2026, from a browser on `afbooster.online`: NEA PSI and PM2.5 (v2),
  Open-Meteo forecast including pressure-level winds and CAPE, and Open-Meteo
  air quality (7 days accepted; column depth is null beyond about day 5) all
  answered with CORS. 7Timer still sends no CORS header.
* JPL Horizons and COBS were read by hand for the comet refresh; the site does
  not call either at runtime.
