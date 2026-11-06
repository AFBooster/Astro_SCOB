/* SCOB Night-Sky — the search index of every page (v4.21)
 * One list, used by the site map, the Start here page and the dashboard menu, so a
 * new page is added in exactly one place. t = title, d = description, g = group,
 * k = extra words people search for that are not in the title or description.
 * SCOBSearch.find(q) also matches the Chinese, Malay and Tamil page titles when
 * scob-i18n.js is loaded, so 月亮 or "bulan" finds the Moon pages. */
(function (global) {
'use strict';
var PAGES = [
{
"f": "start-here.html",
"t": "Start here",
"d": "New to SCOB Night-Sky? Three short paths — a first visit, owning a telescope, or teaching and volunteering — plus tonight's go / no-go and a search over every page.",
"g": "Tonight & the session",
"k": "begin new beginner help guide visitor first time welcome"
},
{
"f": "solar.html",
"t": "Daytime / Solar Mode",
"d": "Daytime solar-observing helper for the Science Centre Observatory: live Sun position, safe-viewing checklist and what to look for on the Sun.",
"g": "Tonight & the session",
"k": "sun sunspots daytime solar filter safe"
},
{
"f": "presentation.html",
"t": "Foyer Display — SCOB Night-Sky",
"d": "A big-screen foyer display that cycles through tonight's sky on its own.",
"g": "Tonight & the session",
"k": "foyer tv slideshow big screen display"
},
{
"f": "align-stars.html",
"t": "GoTo Alignment-Star Picker",
"d": "Volunteer setup tool: suggests bright, well-placed alignment stars that are up right now for the Celestron GoTo mounts (SkyAlign / 2-star).",
"g": "Tonight & the session",
"k": "goto alignment stars celestron skyalign"
},
{
"f": "now-showing.html",
"t": "Now Showing — SCOB Night-Sky",
"d": "A big-screen 'Now Showing' board for SCOB public nights — what each telescope is pointed at right now and what's next, tapped in by the duty volunteer. Runs offline; state saved on the device.",
"g": "Tonight & the session",
"k": "board telescope pointing foyer screen what each scope is on"
},
{
"f": "object-cards.html",
"t": "Object Cards — SCOB Night-Sky",
"d": "Printable one-per-object cards for the SCOB showpieces — a fact, where to look, and the right telescope — to place beside each scope. Interface in English, 中文, Malay and Tamil.",
"g": "Tonight & the session",
"k": "print cards labels next to telescope"
},
{
"f": "plan-ahead.html",
"t": "Plan Ahead — Best Session Fridays",
"d": "Compares the next several Friday observatory nights by Moon phase, weather and haze forecast, so you can pick the best night for a session.",
"g": "Tonight & the session",
"k": "best friday weather moon phase forecast plan schedule"
},
{
"f": "sky-finder.html",
"t": "Point Your Phone — Find & Identify the Sky",
"d": "Point your phone at the sky: an arrow guides you to tonight's showpiece objects, or flip to Identify mode to name whatever bright object you're aiming at. Uses the phone's compass, on-device, works offline.",
"g": "Tonight & the session",
"k": "compass ar augmented point phone find identify what is that star planet arrow saturn jupiter venus mars"
},
{
"f": "qr-poster.html",
"t": "QR Poster",
"d": "A printable A4 poster with a QR code that opens the Science Centre Observatory's live sky guide on visitors' phones.",
"g": "Tonight & the session",
"k": "print poster qr code"
},
{
"f": "scob-dashboard-v3.html",
"t": "SCOB Night-Sky",
"d": "Plan a Friday-night stargazing session at the Science Centre Observatory, Jurong — tonight's Moon, planets and best deep-sky targets, a live weather go/no-go, an all-sky map, satellite passes and a printable session pack, all computed on your device.",
"g": "Tonight & the session",
"k": "tonight planner weather cloud rain forecast go no-go planets targets sky map star chart session pack moon iss satellite passes seeing saturn jupiter venus mars planets"
},
{
"f": "session-log.html",
"t": "Session Logbook — SCOB Night-Sky",
"d": "A private, on-device logbook for SCOB public nights — record the date, conditions, objects shown and rough attendance, auto-seeded from the Now Showing board, with CSV export for planning and reporting. Nothing leaves your device.",
"g": "Tonight & the session",
"k": "log logbook attendance record export csv report"
},
{
"f": "session-reminder.html",
"t": "Session Reminder — SCOB Night-Sky",
"d": "Set an in-app reminder for the next SCOB Friday public astronomy session (7:30 pm). A local notification fires while the app is open — no account, no server, works offline.",
"g": "Tonight & the session",
"k": "reminder alarm notification calendar friday"
},
{
"f": "checklist.html",
"t": "Setup Checklist — SCOB Night-Sky",
"d": "A printable pre-session setup and pack-down checklist for the Science Centre Observatory telescopes — the 40 cm main dome, the Celestron CPC / C6 deck scopes, and the Seestar smart scope.",
"g": "Tonight & the session",
"k": "setup pack down checklist dome"
},
{
"f": "sky-events.html",
"t": "Sky Events from SCOB — Occultations & ISS Transits",
"d": "Rare timed sky events seen from the Science Centre Observatory, Jurong: lunar occultations and close passes, and transits of the ISS or Tiangong across the Sun and Moon. Computed on your device.",
"g": "Tonight & the session",
"k": "occultation iss transit tiangong moon covers star calendar"
},
{
"f": "passport.html",
"t": "Stargazer's Passport — SCOB Night-Sky",
"d": "A stargazer's passport for SCOB public nights — tick off each object as you see it through a telescope, on-screen or printed for kids to carry and collect. Science Centre Observatory, Singapore.",
"g": "Tonight & the session",
"k": "kids children family stamp card collect badge"
},
{
"f": "kiosk.html",
"t": "Tonight at the Observatory — SCOB Kiosk",
"d": "A full-screen visitor display for the Science Centre Observatory: what's up right now, with a QR code to explore the sky on your own phone.",
"g": "Tonight & the session",
"k": "tv screen display foyer qr"
},
{
"f": "moon-tonight.html",
"t": "Tonight on the Moon — SCOB Night-Sky",
"d": "Tonight on the Moon over Singapore — the craters, rilles and mountains best placed along the terminator for the chosen night, with a drawn Moon disc and scope tips, from the Science Centre Observatory.",
"g": "Tonight & the session",
"k": "craters terminator maria lunar features moon map mountains rilles 月亮 月球 bulan நிலா"
},
{
"f": "highlights-card.html",
"t": "Tonight's Highlights Card",
"d": "Generate a shareable image of tonight's stargazing highlights over Singapore — Moon phase, the best planet and top targets — in English, 中文, Malay or Tamil, to post for the Science Centre Observatory.",
"g": "Tonight & the session",
"k": "share image social media instagram post whatsapp"
},
{
"f": "tonights-tour.html",
"t": "Tonight's Tour — SCOB Night-Sky",
"d": "An auto-generated docent tour: what to show the public tonight, in order, with plain-language talking points and the right SCOB telescope for each object — in English, 中文, Malay and Tamil, talking points included, and read aloud in that language.",
"g": "Tonight & the session",
"k": "docent script guide talk read aloud speech tour chinese malay tamil what to say saturn jupiter moon showpieces"
},
{
"f": "first-night.html",
"t": "Your First Night — Volunteer Quickstart",
"d": "A first-time volunteer quickstart for the Science Centre Observatory: tonight's go/no-go, the three things to show the public first and which telescope suits each, computed on-device.",
"g": "Tonight & the session",
"k": "volunteer beginner new start three things go no-go"
},
{
"f": "aboriginal-sky.html",
"t": "Aboriginal Australian Sky — SCOB Night-Sky",
"d": "Aboriginal Australian astronomy — the Emu in the Sky (a dark constellation in the Milky Way), the Seven Sisters (Pleiades), the canoe of Orion and the Southern Cross. Among the oldest sky-stories on Earth. Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "emu australia indigenous"
},
{
"f": "aboriginal-tonight.html",
"t": "Aboriginal Sky Tonight — SCOB Night-Sky",
"d": "Which Aboriginal Australian sky-figures are above the horizon tonight from the Science Centre Observatory, Singapore — the Emu in the Sky, the Seven Sisters, the canoe of Orion and the Southern Cross. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "arabic-tonight.html",
"t": "The Arabic Sky Tonight — SCOB Night-Sky",
"d": "Which of the 28 Arabic lunar mansions (manāzil al-qamar) are above the horizon tonight from the Science Centre Observatory, Singapore — and which mansion the Moon itself is riding through now. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "arabic-sky.html",
"t": "The Arabic Sky — SCOB Night-Sky",
"d": "The Arabic sky — the 28 lunar mansions (manāzil al-qamar) the Moon crosses each month, the anwāʾ weather-star almanac, and the stars whose Arabic names the whole world still uses (Aldebaran, Altair, Deneb, Betelgeuse). Cross-referenced with the Chinese 28 宿 and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "manazil anwa star names islamic"
},
{
"f": "babylonian-tonight.html",
"t": "The Babylonian Sky Tonight — SCOB Night-Sky",
"d": "Which Babylonian MUL.APIN constellations are above the horizon tonight from the Science Centre Observatory, Singapore, by the Three Paths of Enlil, Anu and Ea, and which zodiac sign the Sun stands in — computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "babylonian-sky.html",
"t": "The Babylonian Sky — SCOB Night-Sky",
"d": "The Babylonian sky — the constellations of MUL.APIN and the Three Paths of Enlil, Anu and Ea, plus the 12-sign zodiac Babylon invented. Cross-referenced with the Western sky, the Chinese mansions and the Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "mul apin zodiac mesopotamia"
},
{
"f": "chinese-tonight.html",
"t": "The Chinese Sky Tonight — SCOB Night-Sky",
"d": "Which of the ancient Chinese Twenty-Eight Mansions are above the horizon tonight from the Science Centre Observatory, Singapore, and which mansion the Moon lodges in — computed on-device, in English or 中文.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "chinese-sky.html",
"t": "The Chinese Sky — SCOB Night-Sky",
"d": "The Chinese sky cross-referenced with the modern Western sky — the Four Symbols and the Twenty-Eight Mansions, with full star asterisms, an interactive strip and traditional circular chart, in English or 中文. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "中文 xiu 二十八宿 four symbols dragon tiger tortoise phoenix"
},
{
"f": "egyptian-tonight.html",
"t": "The Egyptian Sky Tonight — SCOB Night-Sky",
"d": "Which Ancient Egyptian sky-figures are above the horizon tonight from the Science Centre Observatory, Singapore — Sah (Orion), Meskhetiu (Big Dipper), Taweret (Draco) — and where Sopdet (Sirius) rides. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "egyptian-sky.html",
"t": "The Egyptian Sky — SCOB Night-Sky",
"d": "The Ancient Egyptian sky — Sah (Orion/Osiris), Sopdet (Sirius/Isis), Meskhetiu (the Big Dipper), Taweret (Draco), the Imperishable and Unwearying stars, and the 36 decans that gave us the 24-hour day. Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "decans osiris isis sirius"
},
{
"f": "greek-tonight.html",
"t": "The Greek Sky Tonight — SCOB Night-Sky",
"d": "Which classical Greek constellations are above the horizon tonight from the Science Centre Observatory, Singapore, and which zodiac sign the Sun is in. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "greek-sky.html",
"t": "The Greek Sky — SCOB Night-Sky",
"d": "The Greek sky — the classical constellations and their myths, the source of today's Western sky: the Perseus legend, the zodiac, Orion & the hunt, and the gods and heroes. Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "myths zodiac constellations western"
},
{
"f": "inca-tonight.html",
"t": "The Inca Sky Tonight — SCOB Night-Sky",
"d": "Which Inca / Andean constellations are above the horizon tonight from the Science Centre Observatory, Singapore — the bright Qullqa (Pleiades) and Chakana (Southern Cross), and the dark-cloud animals of Mayu including Yacana the Llama. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "inca-sky.html",
"t": "The Inca Sky — SCOB Night-Sky",
"d": "The Inca / Andean sky — the bright-star figures (Qullqa the Pleiades, Chakana the Southern Cross) and the famous DARK cloud constellations of the Milky Way (Mayu): Yacana the Llama, Yutu the partridge, the Fox, the Serpent and the Toad. Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "andes llama dark constellations"
},
{
"f": "indian-tonight.html",
"t": "The Indian Sky Tonight — SCOB Night-Sky",
"d": "Which of the 27 Indian Nakshatras (lunar mansions) are above the horizon tonight from the Science Centre Observatory, Singapore, which nakshatra the Moon lodges in, and the day's panchāṅga — computed on-device, in English with Sanskrit names.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "indian-sky.html",
"t": "The Indian Sky — SCOB Night-Sky",
"d": "The Indian sky — the 27 Nakshatras (lunar mansions) of Jyotiṣa, cross-referenced with the modern Western sky and the Chinese mansions. Their nine planetary lords, deities and symbols, with an interactive star map, in English with Sanskrit names. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "nakshatra jyotish vedic hindu tamil"
},
{
"f": "malay-tonight.html",
"t": "The Malay Sky Tonight — SCOB Night-Sky",
"d": "Which of the Malay / Nusantara star-pictures are above the horizon tonight from the Science Centre Observatory, Singapore, the directions they mark, the Sun's buruj and Venus (Bintang Timur) — computed on-device, in English with Rumi & Jawi names.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "malay-sky.html",
"t": "The Malay Sky — SCOB Night-Sky",
"d": "The Malay / Nusantara sky — the indigenous star-pictures (bintang) used for sea-navigation and the rice calendar, and the 12 buruj (zodiac). Cross-referenced with the Western sky, the Chinese mansions and the Indian nakshatras, in English with Rumi & Jawi names. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "bintang buruj nusantara jawi rumi"
},
{
"f": "maya-tonight.html",
"t": "The Maya Sky Tonight — SCOB Night-Sky",
"d": "Which Maya sky-figures are above the horizon tonight from the Science Centre Observatory, Singapore — Tzab (Pleiades), the Turtle (Orion), the Scorpion, the Peccaries — and where Chak Ek' (Venus) rides. Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "maya-sky.html",
"t": "The Maya Sky — SCOB Night-Sky",
"d": "The Maya sky — Tzab (the rattlesnake's rattle, the Pleiades), the Turtle & Three Hearthstones (Orion), the Scorpion, the Peccaries (Gemini), Xaman Ek' (Polaris) and Chak Ek' (Venus), with the Venus calendar. Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "mayan venus calendar"
},
{
"f": "polynesian-tonight.html",
"t": "The Polynesian Sky Tonight — SCOB Night-Sky",
"d": "Which Polynesian star lines are above the horizon tonight from the Science Centre Observatory, Singapore, and how to find south by Hānaiakamalama (the Southern Cross). Computed on-device.",
"g": "Skies across cultures",
"k": ""
},
{
"f": "polynesian-sky.html",
"t": "The Polynesian Sky — SCOB Night-Sky",
"d": "The Polynesian sky — the four Hawaiian star lines wayfinders steer by (Ke Ka o Makaliʻi, Ka Iwikuamoʻo, Manaiakalani, Ka Lupe o Kawelo), the star compass, and stars like Hōkūleʻa (Arcturus) and Māui's fishhook (Scorpius). Cross-referenced with the Chinese mansions and Indian nakshatras. SCOB Night-Sky, Singapore.",
"g": "Skies across cultures",
"k": "hawaii wayfinding navigation star compass"
},
{
"f": "about.html",
"t": "About & Credits — SCOB Night-Sky",
"d": "What the SCOB Night-Sky app is, how it works on your device, the data sources behind every number, and credits for the astronomy references and cultural sky-lore it draws on.",
"g": "Learn & reference",
"k": "credits sources data privacy contact"
},
{
"f": "solar-system-outer.html",
"t": "Beyond Neptune — Belts to the Oort Cloud",
"d": "A logarithmic map of the whole solar system out to the Oort cloud, and an explainer of the asteroid belt, Kuiper belt, dwarf planets, extreme trans-Neptunian objects, the Planet Nine debate, the heliosphere and the Voyagers. Science Centre Observatory, Jurong.",
"g": "Learn & reference",
"k": "pluto kuiper oort dwarf planet voyager planet nine"
},
{
"f": "comets.html",
"t": "Comets tonight — SCOB Night-Sky",
"d": "Which comets are up tonight over Singapore, from the Science Centre Observatory — each comet's live magnitude, altitude, direction, best dark-sky time and a scope recommendation, computed on your device.",
"g": "Learn & reference",
"k": "comet tail brightness"
},
{
"f": "constellation-story.html",
"t": "Constellation of Tonight",
"d": "The story of a constellation well-placed over Singapore tonight — its myth, how to star-hop to it, and a diagram of its shape. Computed on your device for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "myth legend story star hop"
},
{
"f": "quiz.html",
"t": "Constellation Quiz",
"d": "A quick constellation-guessing game for the Science Centre Observatory: name the star pattern from its shape.",
"g": "Learn & reference",
"k": "game kids test constellation"
},
{
"f": "eclipses.html",
"t": "Eclipses — Solar & Lunar — SCOB Night-Sky",
"d": "Solar and lunar eclipses explained, with a forecast of every eclipse from 2026 to 2030, a schematic world map of where each solar eclipse's shadow travels across Earth, and which ones can be seen from Singapore. SCOB Night-Sky, Science Centre Observatory.",
"g": "Learn & reference",
"k": "eclipse solar lunar blood moon totality annular calendar"
},
{
"f": "eyepiece-fov.html",
"t": "Eyepiece & Field of View — SCOB Night-Sky",
"d": "Pick a SCOB telescope and eyepiece to see the magnification, true field of view and exit pupil, with the target framed to scale so you can choose the right eyepiece.",
"g": "Learn & reference",
"k": "magnification field of view calculator focal length"
},
{
"f": "eyepiece-types.html",
"t": "Eyepiece Types & Their Pros and Cons — SCOB Night-Sky",
"d": "A guide to telescope eyepiece designs — Huygens, Kellner, Plössl, orthoscopic, Erfle, ultra-wide and long-eye-relief eyepieces — with their pros and cons, plus apparent field, eye relief, exit pupil, Barlows and zooms, and which suit the SCOB telescopes.",
"g": "Learn & reference",
"k": "plossl barlow zoom eye relief"
},
{
"f": "filters.html",
"t": "Imaging & Visual Filters — SCOB Night-Sky",
"d": "A reference to astrophotography and visual filters for the Science Centre Observatory: broadband, narrowband, dual-band, LRGB, planetary, lunar and solar filters — what each does, the wavelengths it isolates and when to reach for it.",
"g": "Learn & reference",
"k": "filter oiii h-alpha uhc light pollution filter solar filter moon filter"
},
{
"f": "meteors.html",
"t": "Meteor Showers — How They Work & How They Fare Here",
"d": "What a meteor shower really is, why the radiant and the after-midnight hours matter, and why Singapore's equator gives some showers (the Eta Aquariids, Orionids) a big edge while the famous Perseids underperform. Computed live for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "shooting stars meteor shower perseids geminids leonids calendar"
},
{
"f": "cosmic-extremes.html",
"t": "Nebulae, Neutron Stars & Black Holes",
"d": "The most extreme objects in the universe — glowing nebulae, city-sized neutron stars, black holes and the supermassive giant at the heart of our galaxy — and the ones you can actually point a telescope at from the Science Centre Observatory, Singapore.",
"g": "Learn & reference",
"k": "black hole neutron star pulsar nebula supernova galaxy"
},
{
"f": "made-of-stars.html",
"t": "Made of Stars — Where Gold, Iron & You Came From",
"d": "How the universe made the elements — hydrogen in the Big Bang, oxygen and calcium in exploding giant stars, much of the iron in exploding white dwarfs, gold in colliding neutron stars — and how they ended up in the Earth, in every living thing and in you. A playable 13.8-billion-year timeline, a periodic table of origins and the life of a star you can see tonight from the Science Centre Observatory.",
"g": "Learn & reference",
"k": "nucleosynthesis elements periodic table origin gold iron supernova kilonova neutron star merger big bang stardust star stuff body atoms fusion cosmic calendar"
},
{
"f": "hemispheres.html",
"t": "Northern vs Southern Hemisphere Skies",
"d": "Why the night sky looks completely different from the northern and southern hemispheres — the two celestial poles, circumpolar stars, the seasonal flip, Polaris versus the Southern Cross, and why Orion and the Moon appear upside down down south. Computed live for the Science Centre Observatory, Singapore.",
"g": "Learn & reference",
"k": "north south southern cross polaris upside down"
},
{
"f": "sky-guide.html",
"t": "SCOB Sky Guide — Science Centre Observatory",
"d": "Your pocket guide to tonight's sky over Singapore, from the Science Centre Observatory — see what's up, point your phone at the stars, hear the stories, and explore. Works on any phone.",
"g": "Learn & reference",
"k": "visitor home families public chinese malay tamil languages 中文 bahasa"
},
{
"f": "phone-astrophotography.html",
"t": "Shoot the Sky With Your Phone",
"d": "How to photograph the Moon through the eyepiece and the night sky with the phone in your pocket — practical settings and honest expectations, from the Science Centre Observatory.",
"g": "Learn & reference",
"k": "camera photo picture photograph smartphone iphone android night mode"
},
{
"f": "almanac.html",
"t": "Sky Almanac",
"d": "Tonight's sky almanac for the Science Centre Observatory: planets on show, the Milky Way-core window, meteor showers this month, and what's notable this month — computed on your device.",
"g": "Learn & reference",
"k": "month calendar what is up planets meteor"
},
{
"f": "scale-model.html",
"t": "Solar System to Scale",
"d": "An interactive scale model of the solar system: shrink the Sun to a basketball and see how tiny the planets are and how vast the distances between them. A crowd explainer for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "distance size basketball scale kids school"
},
{
"f": "solar-system.html",
"t": "Solar System — Live Orrery & Retrograde",
"d": "A live top-down orrery of the planets computed on your device, an animated explainer of apparent retrograde motion, and spinning planets showing their axial tilt, for the Science Centre Observatory, Jurong. Part of a three-page solar-system section.",
"g": "Learn & reference",
"k": "orrery retrograde planets orbit tilt"
},
{
"f": "space-telescopes.html",
"t": "Space Telescopes — how they work, what they see & why those orbits — SCOB Night-Sky",
"d": "Why telescopes go above the atmosphere, what each wavelength band reveals, a 15-mission fleet from Hubble to JWST, and the five orbit families they use — a reference guide for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "hubble jwst webb orbit lagrange"
},
{
"f": "telescope-types.html",
"t": "Telescope Types & Mounts — SCOB Night-Sky",
"d": "How telescopes work — refractors, reflectors and catadioptrics — with animated light paths, the main mount types, a deep-sky tracking explainer and a magnification calculator, for the Science Centre Observatory, Singapore.",
"g": "Learn & reference",
"k": "refractor reflector schmidt cassegrain dobsonian mount magnification aperture buy"
},
{
"f": "solar-system-planets.html",
"t": "The Eight Planets — Orbits & Facts",
"d": "Every planet's orbit laid out on one horizontal scale — real perihelion-to-aphelion spans showing spacing and eccentricity — plus a detailed fact card for each of the eight planets, with moons, rotation and fun facts. Science Centre Observatory, Jurong.",
"g": "Learn & reference",
"k": "mercury venus earth mars jupiter saturn uranus neptune moons facts"
},
{
"f": "seestar.html",
"t": "The Seestar — How the Little Robot Sees What the Eye Can't",
"d": "Why SCOB's Seestar S30 smart telescope shows glowing colour nebulae and galaxies that vanish in the big domes' eyepieces — live stacking explained, with tonight's best Seestar target, for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "smart telescope imaging stacking zwo s30 nebula colour"
},
{
"f": "sky-through-ages.html",
"t": "The Sky Through the Ages — SCOB Night-Sky",
"d": "The sky through the ages — how eleven civilisations, from the 65,000-year-old Aboriginal sky to the modern IAU, named the same stars, and how the names passed from Babylon to Greece to Arabia to the world. A capstone tour of SCOB Night-Sky's cultural pages, Singapore.",
"g": "Learn & reference",
"k": "history cultures timeline names"
},
{
"f": "lunar-mansions.html",
"t": "The Three Lunar-Mansion Systems — SCOB Night-Sky",
"d": "The three great lunar-mansion systems side by side — the Chinese 28 宿, the Indian 27 nakshatras and the Arabic 28 manāzil — matched star by star. One Moon, three ancient calendars, mostly the same stars. SCOB Night-Sky, Singapore.",
"g": "Learn & reference",
"k": "moon calendar chinese indian arabic xiu nakshatra manazil"
},
{
"f": "tracking-methods.html",
"t": "Tracking & Alignment Methods — SCOB Night-Sky",
"d": "How tracking mounts follow the sky, and how Celestron GoTo alignment works — SkyAlign, 1-star, 2-star, All-Star Polar Align — with Singapore-specific notes for the Science Centre Observatory.",
"g": "Learn & reference",
"k": "goto alignment skyalign polar align celestron mount tracking"
},
{
"f": "haze.html",
"t": "Haze & the Night Sky",
"d": "Live NEA haze readings for Singapore — 24-hour PSI and 1-hour PM2.5 for whichever region you follow, all five regions on one 24-hour chart, the week and a 5-day outlook — with what the smoke costs the view from the Science Centre Observatory and what it means for a public session.",
"g": "Learn & reference",
"k": "psi pm2.5 smoke air quality nea fires indonesia sumatra satellite region west east north south central"
},
{
"f": "light-pollution.html",
"t": "Where Did All the Stars Go?",
"d": "Why the Milky Way is invisible from Jurong while the Moon and Saturn look superb — light pollution explained honestly for visitors to the Science Centre Observatory.",
"g": "Learn & reference",
"k": "bortle city lights milky way invisible dark sky"
},
{
"f": "singapore-sky.html",
"t": "Why Singapore Sees Almost the Whole Sky",
"d": "From 1.3°N the Science Centre Observatory can see 99.99% of the entire celestial sphere over a year — the Southern Cross and the Big Dipper, the Magellanic Clouds and Andromeda. Almost no major observatory on Earth can say that.",
"g": "Learn & reference",
"k": "equator latitude whole sky southern northern magellanic"
},
{
"f": "site-map.html",
"t": "All pages & search",
"d": "A searchable index of every SCOB Night-Sky page.",
"g": "Learn & reference",
"k": "index search all pages"
}
];

var GROUPS = ['Tonight & the session', 'Skies across cultures', 'Learn & reference'];
function norm(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); }
/* Latin-script words match at the start of a word ("psi" must not find "upside");
   Chinese and Tamil have no spaces between words, so those match anywhere. */
function at(w) {
  if (!/^[a-z0-9.]+$/.test(w)) return function (h) { return h.indexOf(w) >= 0; };
  var re = new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return function (h) { return re.test(h); };
}
/* every term must appear somewhere; a title hit counts most, then keywords, then the description */
function find(q) {
  var terms = norm(q).split(/\s+/).filter(Boolean).map(function (t) { return t.length > 4 && /s$/.test(t) && !/ss$/.test(t) ? t.slice(0, -1) : t; });
  if (!terms.length) return PAGES.map(function (p) { return { p: p, score: 0 }; });
  var I = global.SCOBI18N && global.SCOBI18N.PAGES;
  var out = [];
  PAGES.forEach(function (p) {
    var tr = '';
    if (I && I[p.f]) ['zh', 'ms', 'ta'].forEach(function (l) { if (I[p.f][l]) tr += ' ' + (I[p.f][l].t || '') + ' ' + (I[p.f][l].s || ''); });
    var t = norm(p.t + ' ' + tr), k = norm(p.k + ' ' + p.f.replace(/[-.]/g, ' ')), d = norm(p.d), score = 0;
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i], hit = 0, has = at(w);
      if (has(t)) hit = 3; else if (has(k)) hit = 2; else if (has(d)) hit = 1;
      if (!hit) return;
      score += hit;
    }
    out.push({ p: p, score: score });
  });
  out.sort(function (a, b) { return b.score - a.score; });
  return out;
}
global.SCOB_PAGES = PAGES;
global.SCOBSearch = { PAGES: PAGES, GROUPS: GROUPS, find: find };
})(typeof window !== 'undefined' ? window : this);
