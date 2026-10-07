# SCOB Night-Sky — improvement backlog

Re-audited at **v4.13** (cache `scob-sky-v116`), 7 Oct 2026. First written at
v4.11 on 10 Sep 2026. Every open item is backed by something measured, not by a
guess — the evidence is quoted so you can re-check it yourself.

Open items are ranked by value ÷ effort.

---

## Done since the last audit

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

## 1. Calibrate the two estimates v4.13 introduced

v4.13 makes the dashboard *act* on two numbers nobody has measured at Jurong.

**The haze sky cost.** The model's nightly PM2.5 level checked out against NEA
(mean 48.2 vs 51.1 µg/m³ over 177 paired hours, the week to 7 Oct 2026) but its
hourly timing did not (r = 0.38), and the *column* depth it supplies has not
been checked against anything at all — there is no sun-photometer near Jurong
in the data we use. The 5–7 Oct episode showed model column depths of 1.1–1.5
against about 0.47 implied by the ground reading; that is physically plausible
for a deep smoke layer, but plausible is not verified. NASA's AERONET network
has listed a sun-photometer site in Singapore; if it is still reporting, its
measured aerosol optical depth would settle this in an afternoon.

**The seeing estimate.** `arc = 0.9 + 0.035·jet + 0.05·shear + 0.25·CAPE/1000`
is hand-weighted from general principles. It has the right inputs and no
calibration.

**The fix for both is the logbook** (old item 6). `session-log.html` already
records what the app predicted and grades it against what was logged. Add two
fields — faintest star seen near the zenith, and a 1–5 seeing score on Jupiter
or a double — and a season of Fridays turns both formulas from documented
guesses into fitted ones.

**Effort:** half a day for the logbook fields; the fitting is later.
**Value:** high — it is the difference between a number the dashboard shows and
one it can be trusted to act on.

---

## 2. Other J2000 / of-date mixing in the engine

**Evidence.** The comet bug was J2000 elements added to an of-date Sun. The
same question applies elsewhere and has not been audited:

```
SHOWPIECES ra/dec        : catalogue J2000, passed straight to alt/az
planets                  : Schlyter elements, equinox of date
precession 2000 -> 2026.8: 0.37 degrees
```

For a deep-sky object 0.37° is a small pointing offset on a chart and nothing
at all to a GoTo mount that does its own precession, so this is far less severe
than the comet case (where Earth's proximity multiplied it). But rise/set and
transit times, and anything compared against a planet's position (conjunction
separations, occultation predictions), deserve a look. `occultations.html` and
`iss-transits.html` are the pages where a third of a degree could matter.

**Effort:** 2–3 hours to audit, with Horizons as the reference.
**Value:** medium — probably fine, but "probably" is what the comet was.

---

## 3. The dashboard is over 200 KB, and every visitor downloads both layouts

**Evidence (v4.13).**

```
scob-dashboard-v3.html   208 KB   (191 KB at v4.11 — it is growing)
desktop + mobile roots both shipped to every visitor: yes
```

Both stylesheets and both DOM trees ship to every device, and JS deletes the
unused half at runtime. It is the **entry page**, also copied to `index.html`.
The haze logic that v4.13 added to the dashboard (`hazeNight`, `hazeCostAt`,
`hazeVerdict`, `seeingEstimate`) would sit better in `haze-core.js` and a small
`seeing-core.js`, where the service worker caches them once and `plan-ahead`
could share them instead of repeating the call.

**Effort:** a day, with real regression risk — do it on its own release.
**Value:** medium.

---

## 4. Give the data-health strip the sources it does not yet cover

The strip tracks weather, satellite TLEs, haze readings and the GRS model. It
does not track the **air-quality forecast** (which v4.13 now leans on for every
future-dated verdict), **seeing inputs**, or **solar activity**. When the haze
forecast is missing the dashboard says so in the haze panel, but the strip
should show it too: every live source either fresh, stale, or absent.

**Effort:** an hour. **Value:** medium, compounding.

---

## 5. Comet 10P leaves the list — decide what follows it

The refitted brightness law has 10P at about magnitude 10.6 on 9 Oct and past
the magnitude-11 cut-off by mid-October; its window closes 31 Dec 2026, and
`test-astro.js` will start warning on 1 Dec. The comets page will then be
empty. Either add the next bright comet (check COBS / aerith.net's weekly list
nearer the time) or let the page say plainly that nothing is in reach.

**Effort:** 30 minutes per comet. **Value:** low until December.

---

## Still yours to decide

* `scob-v4.03.patch`, `scob-v4.04.patch`, `scob-v4.05.patch` — 148 KB of patch
  files from released versions. The history has them.
* `.git/.writetest` — a zero-byte file I created probing write access and could
  not delete through the file bridge. `del /f /q .git\.writetest`.
* `README.md` is over 130 KB, almost all version history. It is not served, so
  it costs nothing at runtime, but splitting pre-v4.0 rows into
  `CHANGELOG-v3.md` would keep the active table readable.

---

## Checked at v4.13

* 7 Oct 2026, from a browser on `afbooster.online`: NEA PSI and PM2.5 (v2),
  Open-Meteo forecast including pressure-level winds and CAPE, and Open-Meteo
  air quality (7 days accepted; column depth is null beyond about day 5) all
  answered with CORS. 7Timer still sends no CORS header.
* JPL Horizons and COBS were read by hand for the comet refresh; the site does
  not call either at runtime.
