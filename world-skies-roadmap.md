# World Skies — Ancient Cultures Roadmap & Status

**Project:** SCOB Night-Sky (Singapore Science Centre Observatory)
**Purpose:** Track which ancient-culture sky systems are implemented, and plan the rest.
**Observing site:** Singapore, ~1.3°N — near-equatorial, so *both* hemispheres are visible over the year. This matters: dark-constellation systems (Aboriginal, Inca) and southern star lore work here where they wouldn't in the north.
**Last updated:** 2026-08-02
**Live site:** https://afbooster.github.io/Astro_SCOB/ · **Repo:** github.com/AFBooster/Astro_SCOB · **Publish:** `publish.bat "message"`

Status legend: ✅ Done · 🟡 In progress · ⬜ Not started

**✅ COMPLETE — all 10 sky cultures built:** Chinese · Indian · Malay/Nusantara · Babylonian · Ancient Egyptian · Maya · Inca/Andean · Polynesian · Aboriginal Australian · Greek. The star-location engine is consolidated into `sky-culture-core.js` (the three newest cultures build on it; older pages can migrate to it incrementally).

---

## Status at a glance

| # | Sky system | Status | System type | Count | Overlaps existing star data? | Visible from SG | SG cultural relevance | Data difficulty | Priority |
|---|------------|--------|-------------|-------|------------------------------|-----------------|-----------------------|-----------------|----------|
| 1 | **Chinese (中國星官)** | ✅ Done | Lunar mansions + enclosures | 28 宿 + 4 Symbols + 3 Enclosures | — (baseline) | Full | Very high | — | — |
| 2 | **Indian — Nakshatras (नक्षत्र)** | ✅ Done | Lunar mansions + 9 lords + 12 rāśi | 27 nakshatras | **High** — 21/27 junction stars shared with the 28 宿 | Full | Very high | — | — |
| 3 | **Malay / Nusantara** | ✅ Done | Star-pictures + 12 buruj | 5 bintang + 12 buruj | High — shares stars w/ Chinese & Indian | Full | High (local roots) | — | — |
| 4 | **Aboriginal Australian** | ✅ Done | Dark (Emu) + bright | 4 bright + 1 dark (Emu) | Good (southern MW) | Medium | — | — |
| 5 | **Mesopotamian / Babylonian (MUL.APIN)** | ✅ Done | Constellations (Three Paths) + zodiac | 18 figures + 12 signs | High — ancestor of Western figures | Full | Medium (historical) | — | — |
| 6 | **Ancient Egyptian** | ✅ Done | Figures + 36 decans | 5 figures + 36 decans | Shares Orion, Sirius, Big Dipper, Draco | Full | Medium (visual) | — | — |
| 7 | **Polynesian / Pacific wayfinding** | ✅ Done | Star lines + star compass | 11 figures, 4 lines | Good | Medium (maritime SEA) | — | — |
| 8 | **Inca / Andean** | ✅ Done | Dark-cloud + bright | 6 dark + 2 bright | Good (southern MW) | Low | — | — |
| 9 | **Maya / Mesoamerican** | ✅ Done | Figures + Venus calendar | 5 figures + Venus | Full | Low | — | — |
| 10 | **Greek / Ptolemaic** | ✅ Done | Constellations by myth family | 16 (of 48) + 12 zodiac | **Very high** — ≈ modern Western | Full | Low (already the default sky) | — | — |

---

## Why these picks (short rationale)

**Tier 1 — do next.** These give the most for a Singapore audience.

- ~~**Nakshatras (India)**~~ ✅ **Done** — see the Indian Sky section below.
- ~~**Malay / Southeast Asian**~~ ✅ **Done** — see the Malay Sky section below.
- **Aboriginal Australian** — introduces *dark constellations* (the Emu in the Sky, traced from Milky Way dust lanes, not stars). A genuinely different way of seeing the sky, and the southern Milky Way sits well from Singapore.

**Tier 2 — strong, do after.**

- ~~**Mesopotamian (MUL.APIN)**~~ ✅ **Done** — see the Babylonian Sky section below.
- ~~**Egyptian**~~ ✅ **Done** — see the Egyptian Sky section below.
- **Polynesian wayfinding** — a *functional* sky (navigation, not myth); ties to maritime Southeast Asia.

**Tier 3 — nice to have / later.**

- ~~**Inca**~~ ✅ **Done** (the dark-constellation sky — see below) · ~~**Maya**~~ ✅ **Done** (see below) · **Greek** — skip or just *layer* Greek myths onto the default Western sky already in `WCONST`, since it's essentially the modern sky.

---

## Chinese Sky — what's already done (baseline reference)

Implemented in `chinese-sky.html` + `chinese-sky-data.js`:

- ✅ **28 Mansions (二十八宿)** — full star asterisms with RA/Dec/mag/HIP, connect-lines, bilingual names + lore (`dEN`/`dZH`), and the authoritative traditional roster (`official`).
- ✅ **Four Symbols (四象)** — dragon / tortoise / tiger / bird groupings (`sym`).
- ✅ **Three Enclosures (三垣)** — Purple Forbidden, Supreme Palace, Heavenly Market (`CENC` / `CENCLOSURES`).
- ✅ **Western cross-reference** — `WCONST` stick-figures for the combined overlay.
- ✅ **Cross-link lookups** — `chineseStarAt(ra,dec)` and `chineseStarByName(name)` so other tools can label a star with its Chinese mansion name.
- ✅ **Bilingual UI** (EN / 中文) and circular + strip chart views.

**Reusable pattern for new cultures:** each new sky can mirror the mansion entry shape
`{n, name, stars:[[ra,dec,mag,HIP,westernName,localName],...], lines:[...], dEN, dZH?, official?}`
and expose a matching `<culture>StarAt(ra,dec)` / `<culture>StarByName(name)` lookup, so the existing cross-linking tools extend cleanly.

---

## Indian Sky — what's done ✅ (built 2026-08-02)

Two pages mirroring the Chinese pair, English-first with Devanagari + IAST names:

- ✅ **`indian-sky.html`** (explainer) — intro essay; interactive **9 planetary-lord (Navagraha) wheel** (analog of the Four Symbols); strip + circle star maps with a Western-constellation overlay; nakshatra↔star table; per-nakshatra **deep dive** (deity, symbol, lord, gaṇa, lore); a **12-rāśi zodiac** framework section (analog of the Three Enclosures) explaining sidereal vs tropical / ayanāṁśa; and a **Chinese-mansion cross-reference** on each nakshatra (21/27 share a star).
- ✅ **`indian-tonight.html`** (live model) — date/time controls, all-sky dome, up/below tables, the **Moon's nakshatra** (with pada, lord, deity), a full on-device **pañchāṅga** (vāra, tithi, nakshatra, yoga, karaṇa), 9 lord chips, and bright signpost stars.
- ✅ **`nakshatra-sky-data.js`** — `window.NAK` (27), plus `NLORDS`, `NGANA`, `NRASHI`, pañchāṅga name tables, `ayanamsa(year)` (Lahiri) and `nakOfLon()` helper.
- ✅ Wired into `scob-dashboard-v3.html` and `sky-guide.html` (with zh/ms/ta labels). Passes `test-astro` / `test-pages` / `test-logic`.

**Design decisions locked in:** English UI + Sanskrit names (no full second-language toggle); grouping wheel = 9 planetary lords; full mirror incl. rāśi framework + Chinese cross-link. Junction-star IDs follow the standard yogatārā list (Sūrya Siddhānta / B.V. Raman) — a couple are convention-dependent (Ārdrā = Betelgeuse, Mṛgaśīrṣa = λ Ori), easy to swap.

---

## Malay / Nusantara Sky — what's done ✅ (built 2026-08-02)

Two pages mirroring the pair, English-first with Rumi + Jawi names. Treated honestly as a *living oral tradition*, not a fixed catalogue.

- ✅ **`malay-sky.html`** (explainer) — intro; a **star compass (mata angin)** placing each figure by the bearing it marks (the Four-Symbols/lords analog); strip + circle maps drawing the full figures + Western overlay; star-picture table; per-figure **deep dive** with **Chinese-mansion AND Indian-nakshatra cross-links** (scans every member star via `chineseStarAt` + the new `nakshatraStarAt`); and a **12-Buruj** zodiac framework section (Jawi names).
- ✅ **`malay-tonight.html`** (live model) — controls, all-sky dome drawing the figures where they stand, up/below tables, a **"star compass now"** headline (which markers are up + the direction each gives), a **Sun's-buruj** almanac limb, **Venus as Bintang Timur/Kejora** (via `Astro.planetEq`), and 3 use-domain chips.
- ✅ **`malay-sky-data.js`** — `window.MSKY` (5 bintang: Pari/Crux, Belantik-Waluku/Orion, Biduk/Ursa Major, Bintang Tujuh-Kartika/Pleiades, Kala Jengking/Scorpius), `MBURUJ` (12), `MUSE`, `MDIR`, `eclLonOf()` + `burujOfLon()` helpers. Added `window.nakshatraStarAt()` to `nakshatra-sky-data.js`.
- ✅ Wired into the **"Skies across cultures"** dashboard section + `sky-guide.html` (zh/ms/ta labels). Passes all three test suites.

**Notes:** Malay sky-lore is regional and oral — this is a representative, well-attested selection (folk-astronomy of the Peninsula + Java/Bugis), not exhaustive. Jawi spellings follow common orthography (may vary). More bintang could be added later (e.g. Bima Sakti = Milky Way as a band; regional Bugis names) with sources.

---

## Babylonian Sky — what's done ✅ (built 2026-08-02)

- ✅ **`babylonian-sky.html`** — intro; the **Three Paths** grouping (Enlil/Anu/Ea) with a declination-band diagram + path cards; strip/circle maps + Western overlay; 18 MUL.APIN figures; per-figure deep dive with **Chinese + Indian cross-links**; and the **12-sign zodiac** framework (Babylon → the world).
- ✅ **`babylonian-tonight.html`** — dome, up/below tables, Three-Path chips, and the **sign the Sun stands in** (sidereal).
- ✅ **`babylonian-sky-data.js`** — `BSKY` (18), `BPATH` (3), `BZODIAC` (12), `signOfLon`. Paths assigned by MUL.APIN's ±17° declination bands.
- Notes: names in Sumerian/Akkadian transliteration; a few boundary figures sit in different paths in different copies of the tablet.

## Egyptian Sky — what's done ✅ (built 2026-08-02)

- ✅ **`egyptian-sky.html`** — intro (Nut, the two star-families); **Imperishable vs Unwearying** realms with a polar diagram + cards; maps + overlay; 5 figures (Sah/Orion, Sopdet/Sirius, Meskhetiu/UMa, Reret-Taweret/Draco, the Mooring-post); per-figure deep dive with cross-links; and the **36-decan** clock framework (origin of the 24-hour day).
- ✅ **`egyptian-tonight.html`** — dome, up/below, realm chips, and a **Sopdet (Sirius) watch**.
- ✅ **`egyptian-sky-data.js`** — `ESKY` (5), `EREALM` (2), `EMONTH`/decan helpers.
- Notes: securely identified figures are few (the sky is known from art, not a star-list); Sah/Sopdet/Meskhetiu solid, Taweret & the northern group per the tomb ceilings; individual decan star-IDs uncertain, so decans shown as the timekeeping ring anchored on Sopdet.

---

## Maya Sky — what's done ✅ (built 2026-08-02)

- ✅ **`maya-sky.html`** — intro; 3 themes (the First Hearth / the Sky Road / the Pivot) on a polar chart + cards; maps + overlay; 5 figures (Tzab/Pleiades, the Turtle & Three Hearthstones/Orion w/ M42, Sina'an/Scorpius, the Peccaries/Gemini, Xaman Ek'/Polaris); deep dive w/ Chinese+Indian cross-links; and a **Venus pentagram** framework (584-day cycle, 8-year 5-cycle resonance, Tzolk'in/Haab'/Calendar Round).
- ✅ **`maya-tonight.html`** — dome, up/below, theme chips, and **Chak Ek' (Venus)** as morning/evening star (via `Astro.planetEq`).
- ✅ **`maya-sky-data.js`** — `MAYA` (5), `MTHEME` (3), `MAYA_VENUS` constants.

## Inca / Andean Sky — what's done ✅ (built 2026-08-02) — first dark-constellation culture

- ✅ **`inca-sky.html`** — intro; 2 kinds (bright-star / **dark-cloud**) on a polar chart + cards; maps + overlay with a traced **Mayu** (Milky Way) band; 8 figures — bright Qullqa/Pleiades & Chakana/Crux, dark Yacana (Llama, eyes α/β Cen), Uñallamacha, Yutu (Coalsack), Hanp'atu, Atoq, Mach'acuay; deep dive (dark figures honestly show *no* Chinese/Indian counterpart); Mayu + Pleiades-calendar framework.
- ✅ **`inca-tonight.html`** — dome that draws the dark clouds as shaded blobs where they stand, up/below, kind chips, and a **Yacana/Qullqa watch**.
- ✅ **`inca-sky-data.js`** — `INCA` (8, mixed bright/dark), `IKIND` (2), `IMAYU` (Milky Way trace). **New dark-cloud renderer** (ellipse silhouettes + eye-stars) — reuse for Aboriginal Australian.
- Notes: dark-cloud outlines/positions are approximate (vary by source); after Urton (1981).

---

## Polynesian · Aboriginal · Greek — what's done ✅ (built 2026-08-02) — the final three

- ✅ **Polynesian** (`polynesian-sky.html` / `-tonight.html` / `-sky-data.js`) — the four Hawaiian **star lines** (grouping), a polar map + Western overlay, per-figure deep dive, and a **star-compass** diagram; tonight page shows star lines up + how to find south by the Southern Cross, and the season (Kau / Hoʻoilo).
- ✅ **Aboriginal Australian** (`aboriginal-sky.html` / `-tonight.html` / `-sky-data.js`) — bright figures (Seven Sisters, Orion canoe, Southern Cross, Canopus) + the **Emu in the Sky** dark constellation (reuses the Inca dark-cloud renderer + a Milky Way band); tonight page has an Emu watch. Framework: the Emu seasonal calendar.
- ✅ **Greek** (`greek-sky.html` / `-tonight.html` / `-sky-data.js`) — 16 classical constellations grouped by **myth family** (Perseus legend / zodiac / Orion & hunt / gods & heroes), the **12 zodiac** framework, and the richest cross-links of all; tonight page shows the Sun's (tropical) sign.

## Engine consolidation ✅ — `sky-culture-core.js`

The star-location engine is now shared: `SkyCore` exposes `lstAt()`, `altAz()`, `eclLonOf()`, `signOfLon()`, `compass()`, `el()`, the time helpers, the SCOB location, and a unified `crossLinks(ra,dec)`. The **three newest cultures import it and are noticeably leaner** (no per-page copies of the geometry). The 7 earlier culture pages still carry inline copies; each can be migrated later by adding the `<script>` and deleting its local helper block (the test suite verifies each migration). **Future cultures should build on `sky-culture-core.js` from the start.**

---

## Per-culture build playbook (proven on all 10 cultures — newest built on `sky-culture-core.js`)

Order matters — data accuracy first, then the pages, then wiring, then tests.

1. ⬜ **Decide the structure** — what plays the role of the Four Symbols / lords grouping, and what plays the "enclosures / rāśi" framing section. Ask upfront: language handling, grouping principle, scope.
2. ⬜ **Gather + verify the star list** (name → HIP / J2000 RA / Dec / mag) from a citable source. Reuse coords already in `chinese-sky-data.js` / `nakshatra-sky-data.js` where stars are shared; verify the rest.
3. ⬜ **Build `<culture>-sky-data.js`** following the `CSKY` / `NAK` entry shape; validate in node (counts, group balance, coord ranges, line indices).
4. ⬜ **Build `<culture>-sky.html`** (clone `indian-sky.html` — it's the most complete template) with intro, grouping wheel + cards, strip/circle maps + Western overlay, table, deep dive, framework section, and cross-references to Chinese + Indian via `chineseStarAt()` (and a new `<culture>StarAt()`).
5. ⬜ **Build `<culture>-tonight.html`** (clone `indian-tonight.html`) — dome, up/below, any "Moon/Sun position in this system", almanac/calendar limb, group chips, signpost stars.
6. ⬜ **Wire nav** — add cards to `scob-dashboard-v3.html` (the **Skies across cultures** section) and `sky-guide.html` (fill zh/ms/ta labels).
7. ⬜ **Release-chain housekeeping (do this EVERY release — see checklist below).**
8. ⬜ **Verify** — syntax + runtime smoke test, then `node test-astro.js && node test-pages.js && node test-logic.js` and `bash check-release.sh` (all gate the release).
9. ⬜ **Publish** — `publish.bat "add <culture> sky pages"`.

### Release housekeeping checklist (run for every feature / update)

Do these together on any release, not just new cultures — they keep the version, the offline cache, the credits and the docs in lockstep:

1. ⬜ **About & credits** (`about.html`) — add the feature under *Sky lore & cultural star-names* (link both its pages) and its data sources under *Where the numbers come from*. *(Now enforced: `test-logic.js` fails if a culture page isn't linked here.)*
2. ⬜ **Offline cache** (`sw.js`) — add every new `.html` page and `.js` data file to `ASSETS`, and **bump the `scob-sky-vNN` cache name**.
3. ⬜ **Release check lists** (`check-release.sh`) — add new pages to `PAGES` and `CACHED`, and new data files to `CACHED`.
4. ⬜ **Version** (`version.js`) — bump `SCOB_VERSION`, kept in lockstep with the sw cache name.
5. ⬜ **README** — add a newest-first row to the version-history table, mark it `*(current)*`, note the new `cache -> scob-sky-vNN`.
6. ⬜ **Roadmap** (`world-skies-roadmap.md`) — flip the culture to ✅ and add its "what's done" section.
7. ⬜ **Gate** — `bash check-release.sh` + the three `node test-*.js` suites must all pass before `publish.bat`.

---

## Notes / open questions

- **Malay sources are sparse** — worth consulting Singapore/regional ethno-astronomy references (e.g. the Bugis/Malay star-lore literature) and crediting them. Likely fewer, larger asterisms rather than a fixed count.
- **Dark constellations** (Aboriginal, Inca) need a rendering mode that draws *regions of the Milky Way*, not connect-the-dots stars — a small extension to the viewer (shade a polygon / dust-lane path instead of star-to-star lines).
- **Cross-links compound:** each new culture should ideally cross-reference *all* prior ones (Chinese, Indian, …) on shared stars — that side-by-side comparison is the app's signature. Keep adding `<culture>StarAt()` lookups.
- **`world-skies-roadmap.md` is committed to the public repo.** Fine as an internal note; `.gitignore` it if you'd rather keep it private.
