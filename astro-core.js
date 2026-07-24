/* SCOB Night-Sky — shared astronomy core.
 * On-device position math (P. Schlyter's method), validated to arc-minute accuracy
 * against an independent NOAA implementation. Used by sky-finder.html and
 * tonights-tour.html so there's one engine to maintain. Exposes window.Astro.
 *
 * Coordinates: Science Centre Observatory, Jurong (1.3342 N, 103.7357 E).
 */
(function (root) {
  var SCOB = { LAT: 1.3342, LON: 103.7357, NAME: 'Science Centre Observatory, Jurong' };
  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  var rev = function (x) { return ((x % 360) + 360) % 360; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function jd(date) { return date.getTime() / 86400000 + 2440587.5; }

  // Schlyter day number (epoch 1999-12-31 00:00 UT = JD 2451543.5)
  function dS(date) { return jd(date) - 2451543.5; }
  function lstDeg(date) { var J = jd(date); return rev(280.46061837 + 360.98564736629 * (J - 2451545.0) + SCOB.LON); }

  function altazAt(ra, dec, date) {
    var H = (lstDeg(date) - ra) * RAD, dr = dec * RAD, l = SCOB.LAT * RAD;
    var alt = Math.asin(Math.sin(dr) * Math.sin(l) + Math.cos(dr) * Math.cos(l) * Math.cos(H)) * DEG;
    var az = Math.atan2(-Math.cos(dr) * Math.sin(H), Math.sin(dr) * Math.cos(l) - Math.cos(dr) * Math.sin(l) * Math.cos(H)) * DEG;
    return { alt: alt, az: rev(az) };
  }
  function compass(az) {
    var d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return d[Math.round(az / 22.5) % 16];
  }

  function sun(d) {
    var w = rev(282.9404 + 4.70935e-5 * d), M = rev(356.0470 + 0.9856002585 * d), e = 0.016709 - 1.151e-9 * d;
    var E = M + e * DEG * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    var xv = Math.cos(E * RAD) - e, yv = Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    var v = rev(Math.atan2(yv, xv) * DEG), r = Math.sqrt(xv * xv + yv * yv);
    return { lon: rev(v + w), M: M, r: r };
  }
  function moon(d) {
    var N = rev(125.1228 - 0.0529538083 * d), i = 5.1454, w = rev(318.0634 + 0.1643573223 * d), a = 60.2666, e = 0.0549, M = rev(115.3654 + 13.0649929509 * d);
    var E = M + e * DEG * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    for (var k = 0; k < 5; k++) E = E - (E - e * DEG * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
    var xv = a * (Math.cos(E * RAD) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    var v = rev(Math.atan2(yv, xv) * DEG), r = Math.sqrt(xv * xv + yv * yv);
    var xe = r * (Math.cos(N * RAD) * Math.cos((v + w) * RAD) - Math.sin(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    var ye = r * (Math.sin(N * RAD) * Math.cos((v + w) * RAD) + Math.cos(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    var ze = r * Math.sin((v + w) * RAD) * Math.sin(i * RAD);
    var lon = rev(Math.atan2(ye, xe) * DEG), lat = Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * DEG;
    var s = sun(d); var Lm = rev(N + w + M), Ls = rev(s.M + 282.9404), D = rev(Lm - Ls), F = rev(Lm - N);
    lon += -1.274 * Math.sin((M - 2 * D) * RAD) + 0.658 * Math.sin(2 * D * RAD) - 0.186 * Math.sin(s.M * RAD) - 0.059 * Math.sin((2 * M - 2 * D) * RAD) - 0.057 * Math.sin((M - 2 * D + s.M) * RAD) + 0.053 * Math.sin((M + 2 * D) * RAD) + 0.046 * Math.sin((2 * D - s.M) * RAD) + 0.041 * Math.sin((M - s.M) * RAD) - 0.035 * Math.sin(D * RAD) - 0.031 * Math.sin((M + s.M) * RAD);
    lat += -0.173 * Math.sin((F - 2 * D) * RAD) - 0.055 * Math.sin((M - F - 2 * D) * RAD) - 0.046 * Math.sin((M + F - 2 * D) * RAD) + 0.033 * Math.sin((F + 2 * D) * RAD) + 0.017 * Math.sin((2 * M + F) * RAD);
    var dist = r - 0.58 * Math.cos((M - 2 * D) * RAD) - 0.46 * Math.cos(2 * D * RAD); // Earth radii (Schlyter)
    return { lon: rev(lon), lat: lat, slon: s.lon, dist: dist };
  }
  function eclToEq(lon, lat, d) {
    var ecl = (23.4393 - 3.563e-7 * d) * RAD;
    var xl = Math.cos(lon * RAD) * Math.cos(lat * RAD), yl = Math.sin(lon * RAD) * Math.cos(lat * RAD), zl = Math.sin(lat * RAD);
    var xe = xl, ye = yl * Math.cos(ecl) - zl * Math.sin(ecl), ze = yl * Math.sin(ecl) + zl * Math.cos(ecl);
    return { ra: rev(Math.atan2(ye, xe) * DEG), dec: Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * DEG };
  }
  var PLAN = {
    Mercury:{sym:"☿",N:[48.3313,3.24587e-5],i:[7.0047,5.00e-8],w:[29.1241,1.01444e-5],a:[0.387098,0],e:[0.205635,5.59e-10],M:[168.6562,4.0923344368],b:-0.36,c:0.027},
    Venus:{sym:"♀",N:[76.6799,2.46590e-5],i:[3.3946,2.75e-8],w:[54.8910,1.38374e-5],a:[0.723330,0],e:[0.006773,-1.302e-9],M:[48.0052,1.6021302244],b:-4.34,c:0.013},
    Mars:{sym:"♂",N:[49.5574,2.11081e-5],i:[1.8497,-1.78e-8],w:[286.5016,2.92961e-5],a:[1.523688,0],e:[0.093405,2.516e-9],M:[18.6021,0.5240207766],b:-1.51,c:0.016},
    Jupiter:{sym:"♃",N:[100.4542,2.76854e-5],i:[1.3030,-1.557e-7],w:[273.8777,1.64505e-5],a:[5.20256,0],e:[0.048498,4.469e-9],M:[19.8950,0.0830853001],b:-9.25,c:0.014},
    Saturn:{sym:"♄",N:[113.6634,2.38980e-5],i:[2.4886,-1.081e-7],w:[339.3939,2.97661e-5],a:[9.55475,0],e:[0.055546,-9.499e-9],M:[316.9670,0.0334442282],b:-9.0,c:0.044},
    Uranus:{sym:"♅",N:[74.0005,1.3978e-5],i:[0.7733,1.9e-8],w:[96.6612,3.0565e-5],a:[19.18171,-1.55e-8],e:[0.047318,7.45e-9],M:[142.5905,0.011725806],b:-7.15,c:0.001},
    Neptune:{sym:"♆",N:[131.7806,3.0173e-5],i:[1.7700,-2.55e-7],w:[272.8461,-6.027e-6],a:[30.05826,3.313e-8],e:[0.008606,2.15e-9],M:[260.2471,0.005995147],b:-6.90,c:0}
  };
  function planetEq(p, d, sLon, sR) {
    var g = function (arr) { return arr[0] + arr[1] * d; };
    var N = rev(g(p.N)), i = g(p.i), w = rev(g(p.w)), a = g(p.a), e = g(p.e), M = rev(g(p.M));
    var E = M + e * DEG * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    for (var k = 0; k < 8; k++) E = E - (E - e * DEG * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
    var xv = a * (Math.cos(E * RAD) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    var v = rev(Math.atan2(yv, xv) * DEG), r = Math.sqrt(xv * xv + yv * yv);
    var xh = r * (Math.cos(N * RAD) * Math.cos((v + w) * RAD) - Math.sin(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    var yh = r * (Math.sin(N * RAD) * Math.cos((v + w) * RAD) + Math.cos(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    var zh = r * Math.sin((v + w) * RAD) * Math.sin(i * RAD);
    var xs = sR * Math.cos(sLon * RAD), ys = sR * Math.sin(sLon * RAD);
    var xg = xh + xs, yg = yh + ys, zg = zh; var ecl = (23.4393 - 3.563e-7 * d) * RAD;
    var xe = xg, ye = yg * Math.cos(ecl) - zg * Math.sin(ecl), ze = yg * Math.sin(ecl) + zg * Math.cos(ecl);
    var R = Math.sqrt(xg * xg + yg * yg + zg * zg);
    var FV = Math.acos(Math.max(-1, Math.min(1, (r * r + R * R - sR * sR) / (2 * r * R)))) * DEG;
    var mag = p.b + 5 * Math.log10(r * R) + p.c * FV; if (p === PLAN.Venus) mag += 4.2e-7 * FV * FV * FV;
    return { ra: rev(Math.atan2(ye, xe) * DEG), dec: Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * DEG, mag: mag,
      lam: rev(Math.atan2(yg, xg) * DEG), bet: Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)) * DEG };
  }

  function sunAltAt(date) { var d = dS(date); var s = sun(d); var eq = eclToEq(s.lon, 0, d); return altazAt(eq.ra, eq.dec, date).alt; }

  // Everything at a moment
  function sky(date) {
    var d = dS(date);
    var s = sun(d), seq = eclToEq(s.lon, 0, d), sa = altazAt(seq.ra, seq.dec, date);
    var mo = moon(d), meq = eclToEq(mo.lon, mo.lat, d), ma = altazAt(meq.ra, meq.dec, date);
    var elong = Math.acos(Math.cos((mo.slon - mo.lon) * RAD) * Math.cos(mo.lat * RAD)) * DEG;
    var illum = (1 - Math.cos(elong * RAD)) / 2, waxing = rev(mo.lon - mo.slon) < 180;
    var planets = {};
    for (var nm in PLAN) { var pe = planetEq(PLAN[nm], d, s.lon, s.r); var aa = altazAt(pe.ra, pe.dec, date); planets[nm] = { alt: aa.alt, az: aa.az, ra: pe.ra, dec: pe.dec, mag: pe.mag, sym: PLAN[nm].sym }; }
    return {
      sunAlt: sa.alt, sunAz: sa.az, dark: sa.alt < -6, deepDark: sa.alt < -12,
      moon: { alt: ma.alt, az: ma.az, ra: meq.ra, dec: meq.dec, illum: Math.round(illum * 100), waxing: waxing },
      planets: planets
    };
  }

  // Curated showpieces (fixed objects carry J2000 RA/Dec; Moon & planets resolved live).
  // blurb = general-public talking point; look = how to recognise it; scope = SCOB instrument.
  var SHOWPIECES = [
    { id:'moon', name:'The Moon', kind:'moon', scope:'Deck CPC / C6',
      blurb:"Our nearest neighbour, 384,000 km away. The line between light and dark — the terminator — is where the view is best: craters throw long shadows and jump into 3-D.",
      look:"Unmistakable. Look along the day/night line for the sharpest craters." },
    { id:'venus', name:'Venus', kind:'planet', planet:'Venus', scope:'Deck CPC / C6',
      blurb:"The brilliant Evening (or Morning) Star — the brightest point in the sky after the Moon. Through a scope it shows phases like a tiny moon, because it orbits closer to the Sun than we do.",
      look:"The dazzling white 'star' low in the west after sunset (or east before dawn)." },
    { id:'jupiter', name:'Jupiter', kind:'planet', planet:'Jupiter', scope:'40 cm main dome',
      blurb:"The largest planet — a gas giant so big all the others would fit inside it. Two dark cloud belts cross its disc, and its four big moons line up like beads on a string, shifting night to night.",
      look:"A steady, bright cream-coloured 'star'. In the scope, watch for the four Galilean moons." },
    { id:'saturn', name:'Saturn', kind:'planet', planet:'Saturn', scope:'40 cm main dome',
      blurb:"The jewel of the night — the rings are made of countless chunks of ice, and the first time anyone sees them live is a moment they never forget.",
      look:"A pale golden 'star' that holds steady. The rings show even in a small scope." },
    { id:'mars', name:'Mars', kind:'planet', planet:'Mars', scope:'40 cm main dome',
      blurb:"The Red Planet, rusty from iron in its soil. Near opposition the big scope can tease out a polar ice cap and dusky surface markings.",
      look:"A distinctly orange 'star' that doesn't twinkle much." },
    { id:'m45', name:'The Pleiades (M45)', kind:'dso', ra:56.75, dec:24.12, mag:1.6, scope:'6" apo / binoculars',
      blurb:"The Seven Sisters — a family of hot blue stars born together about 100 million years ago, still drifting through space as a group.",
      look:"A tiny, misty 'little dipper' of blue stars — best at low power or in binoculars." },
    { id:'m42', name:'Orion Nebula (M42)', kind:'dso', ra:83.82, dec:-5.39, mag:4.0, scope:'40 cm + 6" apo',
      blurb:"A stellar nursery 1,300 light-years away where brand-new stars are switching on right now, lighting up the surrounding gas.",
      look:"The fuzzy 'middle star' of Orion's sword — a glowing cloud in the scope." },
    { id:'m8', name:'Lagoon Nebula (M8)', kind:'dso', ra:270.92, dec:-24.38, mag:6.0, scope:'Seestar / 6" apo',
      blurb:"A vast glowing cloud of hydrogen in Sagittarius, cut by a dark lane like a lagoon, with a sparkling star cluster embedded inside.",
      look:"Toward the heart of the Milky Way. Superb through the Seestar's dual-band filter." },
    { id:'m7', name:'Ptolemy Cluster (M7)', kind:'dso', ra:268.45, dec:-34.79, mag:3.3, scope:'6" apo / binoculars',
      blurb:"A bright scattering of stars near the Scorpion's stinger, noted by the astronomer Ptolemy almost 2,000 years ago.",
      look:"A loose sparkle of stars low in the south, in a rich Milky Way field." },
    { id:'omega', name:'Omega Centauri', kind:'dso', ra:201.70, dec:-47.48, mag:3.9, scope:'40 cm main dome',
      blurb:"The finest globular cluster in the sky — around 10 million ancient stars packed into a ball, so crowded the centre looks solid. From Singapore it rides beautifully high.",
      look:"A fuzzy 'star' to the eye; the big scope resolves it into a blaze of pinpoints." },
    { id:'m13', name:'Hercules Cluster (M13)', kind:'dso', ra:250.42, dec:36.46, mag:5.8, scope:'40 cm + 6" apo',
      blurb:"A grand northern globular of several hundred thousand stars, 25,000 light-years away — the target of a famous 1974 radio message to the stars.",
      look:"A round glow that the scope shatters into a swarm of tiny stars." },
    { id:'eta', name:'Eta Carinae Nebula', kind:'dso', ra:161.26, dec:-59.68, mag:1.0, scope:'Seestar / 6" apo',
      blurb:"One of the biggest, brightest nebulae in the whole sky, wrapped around a doomed supergiant star that may explode as a supernova. Superbly placed from Singapore.",
      look:"A large misty patch low in the south along the Milky Way." },
    { id:'m31', name:'Andromeda Galaxy (M31)', kind:'dso', ra:10.68, dec:41.27, mag:3.4, scope:'6" apo / binoculars',
      blurb:"The most distant thing your eye can see unaided — an entire galaxy of a trillion stars, 2.5 million light-years away, on a collision course with our Milky Way.",
      look:"A faint elongated smudge; the light left it before humans existed." },
    { id:'jewelbox', name:'The Jewel Box (NGC 4755)', kind:'dso', ra:191.93, dec:-60.35, mag:4.2, scope:'6" apo',
      blurb:"A compact cluster beside the Southern Cross with a striking mix of blue-white and one ruby-red star — like a scattering of coloured gems.",
      look:"Just off Beta Crucis in the Southern Cross." },
    { id:'acrux', name:'Acrux (Southern Cross)', kind:'double', ra:186.65, dec:-63.10, mag:0.8, scope:'6" apo',
      blurb:"The brightest star of the Southern Cross splits into two brilliant blue-white suns in the eyepiece — a classic showpiece of the southern sky.",
      look:"The bottom star of the Southern Cross." },
    { id:'alphacen', name:'Alpha Centauri', kind:'double', ra:219.90, dec:-60.83, mag:-0.3, scope:'6" apo',
      blurb:"The closest star system to the Sun, 4.3 light-years away, and a gorgeous double — two Sun-like stars orbiting each other over 80 years.",
      look:"The brighter of the two 'Pointers' beside the Southern Cross." },
    { id:'albireo', name:'Albireo', kind:'double', ra:292.68, dec:27.96, mag:3.1, scope:'6" apo',
      blurb:"Everyone's favourite double star — a golden sun and a sapphire-blue companion side by side. The colour contrast is unforgettable.",
      look:"The head of Cygnus the Swan, high in the north in mid-year." },
    { id:'antares', name:'Antares', kind:'star', ra:247.35, dec:-26.43, mag:1.0, scope:'Naked eye / any scope',
      blurb:"A red supergiant so huge it would swallow Mars's orbit if placed where the Sun is. Its name means 'rival of Mars' for its fiery colour. The beating heart of the Scorpion.",
      look:"The bright orange star in the middle of Scorpius." },
    { id:'sirius', name:'Sirius', kind:'star', ra:101.29, dec:-16.72, mag:-1.46, scope:'Naked eye',
      blurb:"The brightest star in the night sky, just 8.6 light-years away. Low down it flashes every colour of the rainbow as its light bends through our atmosphere.",
      look:"The dazzling star below Orion, flashing and twinkling." },
    { id:'mercury', name:'Mercury', kind:'planet', planet:'Mercury', scope:'Deck CPC / C6', blurb:"The smallest, fastest planet — never far from the Sun, so it only peeks out low in twilight for a week or two at a time.", look:"A pinkish 'star' very low in the west after sunset (or east before dawn)." },
    { id:'uranus', name:'Uranus', kind:'planet', planet:'Uranus', scope:'40 cm main dome', blurb:"A distant ice giant four times wider than Earth — barely visible to a sharp naked eye, a pale blue-green dot in a scope.", look:"Needs a star chart; a steady greenish point of light." },
    { id:'neptune', name:'Neptune', kind:'planet', planet:'Neptune', scope:'40 cm main dome', blurb:"The farthest planet, a deep-blue ice giant 4.5 billion km away — a tiny disc only a telescope reveals.", look:"Telescope only, with a chart — a small blue dot." },
    { id:'regulus', name:'Regulus', kind:'star', ra:152.09, dec:11.97, mag:1.35, scope:'Naked eye', blurb:"The bright heart of Leo the Lion — a blue-white star spinning so fast it bulges at its equator.", look:"The base of the backwards question-mark (the 'Sickle') of Leo." },
    { id:'procyon', name:'Procyon', kind:'star', ra:114.83, dec:5.22, mag:0.34, scope:'Naked eye', blurb:"One of our nearest bright neighbours, 11 light-years away, circled by a dense white-dwarf star.", look:"Bright star east of Orion, forming a triangle with Sirius and Betelgeuse." },
    { id:'arcturus', name:'Arcturus', kind:'star', ra:213.92, dec:19.18, mag:-0.05, scope:'Naked eye', blurb:"A giant orange star, the brightest in the northern sky, racing through the galaxy at 120 km per second.", look:"Follow the curve of the Big Dipper's handle to a bright orange star." },
    { id:'spica', name:'Spica', kind:'star', ra:201.30, dec:-11.16, mag:1.04, scope:'Naked eye', blurb:"A searing-hot blue pair of stars in Virgo whirling around each other every four days.", look:"A bright bluish star south of Arcturus." },
    { id:'vega', name:'Vega', kind:'star', ra:279.23, dec:38.78, mag:0.03, scope:'Naked eye', blurb:"A brilliant blue-white star 25 light-years away, ringed by a dust disc — a corner of the Summer Triangle.", look:"Dazzling white, high overhead in mid-year." },
    { id:'altair', name:'Altair', kind:'star', ra:297.70, dec:8.87, mag:0.76, scope:'Naked eye', blurb:"A star spinning so fast — once every 9 hours — that it's squashed into an egg shape. A Summer Triangle corner.", look:"A bright star with a fainter star on each side." },
    { id:'deneb', name:'Deneb', kind:'star', ra:310.36, dec:45.28, mag:1.25, scope:'Naked eye', blurb:"A supergiant so luminous it blazes to us from ~1,500 light-years — the tail of Cygnus the Swan.", look:"The top of the Summer Triangle, lower in the north." },
    { id:'capella', name:'Capella', kind:'star', ra:79.17, dec:46.00, mag:0.08, scope:'Naked eye', blurb:"A brilliant golden star — actually a family of four — marking the Charioteer.", look:"A bright yellow star low in the north on winter evenings." },
    { id:'rigel', name:'Rigel', kind:'star', ra:78.63, dec:-8.20, mag:0.13, scope:'Naked eye', blurb:"A blue-white supergiant at Orion's foot — 860 light-years away and ~120,000 times brighter than the Sun.", look:"The bright blue star at the bottom-right of Orion." },
    { id:'betelgeuse', name:'Betelgeuse', kind:'star', ra:88.79, dec:7.41, mag:0.5, scope:'Naked eye', blurb:"A red supergiant so vast it would swallow Jupiter's orbit; one day it will explode as a supernova.", look:"The orange star at Orion's shoulder." },
    { id:'fomalhaut', name:'Fomalhaut', kind:'star', ra:344.41, dec:-29.62, mag:1.16, scope:'Naked eye', blurb:"A lonely bright star ringed by a dusty disc with at least one planet — the 'Autumn Star'.", look:"Low in the south on autumn evenings, in an empty patch of sky." },
    { id:'beehive', name:'Beehive Cluster (M44)', kind:'dso', ra:130.05, dec:19.67, mag:3.1, scope:'6\" apo / binoculars', blurb:"A swarm of hundreds of stars in Cancer — a misty smudge to the eye that bursts into suns in binoculars.", look:"A faint cloud between Gemini and Leo." },
    { id:'dblcluster', name:'The Double Cluster', kind:'dso', ra:34.75, dec:57.13, mag:4.3, scope:'6\" apo / binoculars', blurb:"Two glittering star clusters side by side — a breathtaking low-power view.", look:"Between Perseus and Cassiopeia, low in the north." },
    { id:'m22', name:'M22 (Sagittarius)', kind:'dso', ra:279.10, dec:-23.90, mag:5.1, scope:'40 cm + 6\" apo', blurb:"One of the nearest, brightest globular clusters — a dense ball of ancient stars over the southern Milky Way.", look:"Just off the 'teapot' of Sagittarius." },
    { id:'m17', name:'Swan Nebula (M17)', kind:'dso', ra:275.20, dec:-16.18, mag:6.0, scope:'Seestar / 6\" apo', blurb:"A glowing cloud shaped like a swan floating on the Milky Way — superb through the Seestar's filter.", look:"In Sagittarius, along the bright Milky Way." },
    { id:'m6', name:'Butterfly Cluster (M6)', kind:'dso', ra:265.08, dec:-32.22, mag:4.2, scope:'6\" apo / binoculars', blurb:"An open cluster whose brightest stars trace a butterfly's wings, near the Scorpion's stinger.", look:"Just above M7, low in the south." },
    { id:'m11', name:'Wild Duck Cluster (M11)', kind:'dso', ra:282.77, dec:-6.27, mag:5.8, scope:'6\" apo', blurb:"A rich, dense open cluster resembling a flight of wild ducks.", look:"In Scutum, on the Milky Way." },
    { id:'m57', name:'Ring Nebula (M57)', kind:'dso', ra:283.40, dec:33.03, mag:8.8, scope:'40 cm main dome', blurb:"A dying star's smoke ring — a tiny grey doughnut of glowing gas, a telescope classic.", look:"Between the two lower stars of Lyra." },
    { id:'m27', name:'Dumbbell Nebula (M27)', kind:'dso', ra:300.00, dec:22.72, mag:7.4, scope:'40 cm + 6\" apo', blurb:"A big, bright puff of gas cast off by a dying star — shaped like an apple core.", look:"In Vulpecula, near Albireo." },
    { id:'tuc47', name:'47 Tucanae', kind:'dso', ra:6.02, dec:-72.08, mag:4.0, scope:'40 cm main dome', blurb:"The second-brightest globular cluster in the whole sky — a dazzling southern ball of stars.", look:"Low in the south, best on spring evenings." }
  ];

  // ---- v3.15: bright-comet tracker (positions computed live from orbital elements) ----
  // Elements are heliocentric J2000 (from the MPC / aerith.net). Comets fade and new ones
  // appear, so REFRESH this table each apparition — each entry carries a `review` date and a
  // `from`/`to` visibility window (JD) so a stale comet simply drops out of the lists.
  var COMETS = [
    { id:'10p', name:'Comet 10P/Tempel 2', kind:'comet',
      q:1.4160714, e:0.5376254, i:12.03005, node:117.80992, peri:195.52491, n:0.18389389, Tp:2461254.64737,
      g:4.6, K:35, gPost:7.2, KPost:18,           // brightness law m = g + 5·logΔ + K·logr (pre / post perihelion, aerith)
      from:2461161.5, to:2461405.5, review:'2026-10-01',
      scope:'40 cm dome / 6" apo · binoculars', mag:null,
      blurb:"A short-period comet (it loops back every 5.4 years) making a good 2026 showing — a soft, tailless glow of dust and gas boiling off a city-sized ball of ice as it nears the Sun.",
      look:"A dim fuzzy patch, not a point — best in the big scope or binoculars, and easier the darker the sky." }
  ];
  function cometEq(c, date){
    var J = jd(date), d = J - 2451543.5;
    var M = rev(c.n * (J - c.Tp)), a = c.q/(1-c.e);
    var E = M + DEG*c.e*Math.sin(M*RAD)*(1+c.e*Math.cos(M*RAD));
    for (var k=0;k<12;k++) E = E - (E - DEG*c.e*Math.sin(E*RAD) - M)/(1 - c.e*Math.cos(E*RAD));
    var xv = a*(Math.cos(E*RAD)-c.e), yv = a*Math.sqrt(1-c.e*c.e)*Math.sin(E*RAD);
    var v = rev(Math.atan2(yv,xv)*DEG), r = Math.sqrt(xv*xv+yv*yv);
    var N=c.node*RAD, w=(v+c.peri)*RAD, inc=c.i*RAD;
    var xh = r*(Math.cos(N)*Math.cos(w)-Math.sin(N)*Math.sin(w)*Math.cos(inc));
    var yh = r*(Math.sin(N)*Math.cos(w)+Math.cos(N)*Math.sin(w)*Math.cos(inc));
    var zh = r*Math.sin(w)*Math.sin(inc);
    var s = sun(d), xs = s.r*Math.cos(s.lon*RAD), ys = s.r*Math.sin(s.lon*RAD);
    var xg=xh+xs, yg=yh+ys, zg=zh;
    var ecl=(23.4393-3.563e-7*d)*RAD;
    var xe=xg, ye=yg*Math.cos(ecl)-zg*Math.sin(ecl), ze=yg*Math.sin(ecl)+zg*Math.cos(ecl);
    var ra=rev(Math.atan2(ye,xe)*DEG), dec=Math.atan2(ze,Math.sqrt(xe*xe+ye*ye))*DEG;
    var delta=Math.sqrt(xg*xg+yg*yg+zg*zg);
    var pre = J <= c.Tp;
    var g = pre? c.g : (c.gPost!=null?c.gPost:c.g), K = pre? c.K : (c.KPost!=null?c.KPost:c.K);
    var mag = g + 5*Math.log10(delta) + K*Math.log10(r);
    return { ra:ra, dec:dec, mag:mag, r:r, delta:delta };
  }
  // comets currently worth pointing at (inside their window and brighter than magLimit);
  // returns showpiece-shaped objects (id/name/kind/scope/blurb/look) with the live mag filled in
  function activeComets(date, magLimit){
    var J = jd(date), lim = magLimit==null? 11 : magLimit, out=[];
    for (var i=0;i<COMETS.length;i++){ var c=COMETS[i];
      if (J < c.from || J > c.to) continue;
      var e = cometEq(c, date);
      if (e.mag > lim) continue;
      var o = {}; for (var kk in c) o[kk]=c[kk];
      o.mag = Math.round(e.mag*10)/10;
      out.push(o);
    }
    return out;
  }

  // ---- v3.14: lightweight, offline, per-object SVG illustrations (no external images) ----
  // illus(showpiece, sizePx) -> an <svg> string recognizable per object kind:
  // Moon (terminator+craters), planets (disc; Saturn rings, Jupiter bands, Mars cap, Venus phase),
  // stars (bright rayed point, colour from description), doubles (two coloured stars),
  // nebulae (glowing cloud), galaxies (tilted spiral), globular vs open clusters (dot fields).
  function _rng(seed){ var s=seed>>>0||1; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
  function _seed(str){ var h=2166136261; for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function _colorsFor(sp){
    var t=((sp.blurb||'')+' '+(sp.look||'')+' '+(sp.name||'')).toLowerCase(), c=[];
    if(/gold|golden|yellow|cream/.test(t)) c.push('#ffd27a');
    if(/red|ruby|rusty|orange|fiery/.test(t)) c.push('#ff8a5c');
    if(/sapphire|blue-white|blue white|blue/.test(t)) c.push('#bcd4ff');
    if(!c.length) c.push('#fff3d6');
    return c;
  }
  function _dsoType(sp){
    var n=(sp.name||'').toLowerCase();
    if(/nebula/.test(n)) return 'nebula';
    if(/galaxy/.test(n)) return 'galaxy';
    if(/omega centauri|47 tuc|hercules cluster|\bm22\b|\bm13\b|globular/.test(n)) return 'globular';
    return 'open';
  }
  function _star(cx,cy,r,c){
    var L=r*4.2, w=r*0.32;
    return '<path d="M'+cx+' '+(cy-L)+'L'+(cx+w)+' '+(cy-w)+'L'+(cx+L)+' '+cy+
      'L'+(cx+w)+' '+(cy+w)+'L'+cx+' '+(cy+L)+'L'+(cx-w)+' '+(cy+w)+
      'L'+(cx-L)+' '+cy+'L'+(cx-w)+' '+(cy-w)+'Z" fill="#ffffff" opacity="0.95"/>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*1.15)+'" fill="'+c+'" opacity="0.9"/>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.6)+'" fill="#fff"/>';
  }
  function _starDot(x,y,r,c){ return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r.toFixed(2)+'" fill="'+c+'"/>'; }
  function illus(sp, size){
    size = size||96;
    var id = (sp.id||sp.name||'x').replace(/[^a-z0-9]/gi,'');
    var W='<svg viewBox="0 0 100 100" width="'+size+'" height="'+size+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+(sp.name||'')+' illustration">';
    var END='</svg>';
    var rand=_rng(_seed(id)), body='';
    if(sp.kind==='moon'){
      body='<defs><radialGradient id="m'+id+'" cx="38%" cy="35%" r="75%">'+
        '<stop offset="0%" stop-color="#fdfbf2"/><stop offset="70%" stop-color="#e7e3d2"/><stop offset="100%" stop-color="#b9b4a0"/></radialGradient></defs>'+
        '<circle cx="50" cy="50" r="40" fill="url(#m'+id+')"/>'+
        '<path d="M50 10a40 40 0 0 1 0 80 30 40 0 0 0 0-80Z" fill="#000" opacity="0.28"/>';
      var craters=[[40,42,7],[62,38,5],[46,64,6],[58,60,4],[35,56,3.5],[66,54,3]];
      for(var i=0;i<craters.length;i++){ var k=craters[i];
        body+='<circle cx="'+k[0]+'" cy="'+k[1]+'" r="'+k[2]+'" fill="#c9c4b2"/>'+
          '<circle cx="'+(k[0]-k[2]*0.25)+'" cy="'+(k[1]-k[2]*0.25)+'" r="'+(k[2]*0.7)+'" fill="#ded9c6"/>'; }
      return W+body+END;
    }
    if(sp.kind==='planet'){
      var p=(sp.planet||sp.name||'').toLowerCase();
      var map={mercury:['#a9a49a','#7d786f'],venus:['#f6e9c8','#d9c290'],mars:['#d1603a','#a2422a'],
        jupiter:['#e6cda8','#b98d63'],saturn:['#ecdcae','#c9b47e'],uranus:['#a9e7e4','#79c9c6'],neptune:['#5b76d6','#38509e']};
      var col=map[p]||['#e6cda8','#b98d63'];
      body='<defs><radialGradient id="p'+id+'" cx="38%" cy="35%" r="80%">'+
        '<stop offset="0%" stop-color="'+col[0]+'"/><stop offset="100%" stop-color="'+col[1]+'"/></radialGradient></defs>';
      if(p==='saturn'){
        body+='<g transform="rotate(-18 50 52)">'+
          '<ellipse cx="50" cy="52" rx="47" ry="15" fill="none" stroke="#d8c283" stroke-width="7" opacity="0.9"/>'+
          '<ellipse cx="50" cy="52" rx="47" ry="15" fill="none" stroke="#f2e6bd" stroke-width="2.5" opacity="0.9"/>'+
          '<circle cx="50" cy="50" r="26" fill="url(#p'+id+')"/>'+
          '<path d="M3 58 A47 15 0 0 0 97 46" fill="none" stroke="#d8c283" stroke-width="7" opacity="0.9"/></g>';
      } else {
        body+='<circle cx="50" cy="50" r="34" fill="url(#p'+id+')"/>';
        if(p==='jupiter'){
          body+='<defs><clipPath id="c'+id+'"><circle cx="50" cy="50" r="34"/></clipPath></defs><g clip-path="url(#c'+id+')">'+
            '<rect x="16" y="38" width="68" height="5" fill="'+col[1]+'" opacity="0.7"/>'+
            '<rect x="16" y="52" width="68" height="6" fill="'+col[1]+'" opacity="0.6"/>'+
            '<ellipse cx="62" cy="55" rx="6" ry="3.5" fill="#c0533c"/></g>';
        } else if(p==='mars'){
          body+='<circle cx="50" cy="24" r="7" fill="#f3efe6" opacity="0.9"/>'+
            '<path d="M40 52 q10 -6 20 2 q-6 8 -20 -2Z" fill="#9a3c26" opacity="0.6"/>';
        } else if(p==='venus'){
          body+='<path d="M50 16a34 34 0 0 1 0 68 22 34 0 0 0 0-68Z" fill="#fffbe9" opacity="0.55"/>';
        }
      }
      return W+body+END;
    }
    if(sp.kind==='comet'){
      body='<defs><radialGradient id="ct'+id+'" cx="50%" cy="50%" r="50%">'+
        '<stop offset="0%" stop-color="#e6fff4" stop-opacity="0.95"/><stop offset="45%" stop-color="#8fe6c8" stop-opacity="0.5"/>'+
        '<stop offset="100%" stop-color="#0b1150" stop-opacity="0"/></radialGradient></defs>'+
        '<path d="M44 52 Q72 42 97 22 Q78 56 50 58 Z" fill="#bff3e0" opacity="0.30"/>'+
        '<path d="M44 52 Q70 50 95 40 Q76 58 50 58 Z" fill="#9ad9ff" opacity="0.22"/>'+
        '<circle cx="42" cy="53" r="19" fill="url(#ct'+id+')"/>'+
        '<circle cx="42" cy="53" r="3.5" fill="#fff"/>';
      return W+body+END;
    }
    if(sp.kind==='double'){
      var cc=_colorsFor(sp); var c1=cc[0], c2=cc[1]||cc[0];
      var bl=(sp.blurb||'').toLowerCase();
      if(/gold/.test(bl)&&/blue/.test(bl)){c1='#ffd27a';c2='#bcd4ff';}
      body='<circle cx="38" cy="54" r="15" fill="'+c1+'" opacity="0.14"/>'+
        '<circle cx="66" cy="44" r="12" fill="'+c2+'" opacity="0.14"/>'+
        _star(38,54,6,c1)+_star(66,44,4.8,c2);
      return W+body+END;
    }
    if(sp.kind==='star'){
      var sc=_colorsFor(sp)[0];
      body='<circle cx="50" cy="50" r="26" fill="'+sc+'" opacity="0.12"/>'+
        '<circle cx="50" cy="50" r="13" fill="'+sc+'" opacity="0.22"/>'+_star(50,50,8,sc);
      return W+body+END;
    }
    var dt=_dsoType(sp);
    if(dt==='nebula'){
      body='<defs><radialGradient id="n'+id+'" cx="50%" cy="50%" r="55%">'+
        '<stop offset="0%" stop-color="#ff9ad2" stop-opacity="0.9"/><stop offset="55%" stop-color="#7d5cff" stop-opacity="0.55"/>'+
        '<stop offset="100%" stop-color="#1b1150" stop-opacity="0"/></radialGradient></defs>'+
        '<ellipse cx="50" cy="50" rx="42" ry="34" fill="url(#n'+id+')"/>'+
        '<ellipse cx="40" cy="44" rx="22" ry="16" fill="#66e6ff" opacity="0.20"/>';
      for(var s=0;s<9;s++){ body+='<circle cx="'+(20+rand()*60).toFixed(1)+'" cy="'+(24+rand()*52).toFixed(1)+'" r="'+(0.8+rand()*1.3).toFixed(2)+'" fill="#fff" opacity="0.9"/>'; }
      return W+body+END;
    }
    if(dt==='galaxy'){
      body='<defs><radialGradient id="ga'+id+'" cx="50%" cy="50%" r="50%">'+
        '<stop offset="0%" stop-color="#fff7e0"/><stop offset="35%" stop-color="#ffd98a" stop-opacity="0.8"/>'+
        '<stop offset="100%" stop-color="#6a5cff" stop-opacity="0"/></radialGradient></defs>'+
        '<g transform="rotate(28 50 50)">'+
        '<ellipse cx="50" cy="50" rx="44" ry="15" fill="url(#ga'+id+')"/>'+
        '<ellipse cx="50" cy="50" rx="44" ry="15" fill="none" stroke="#cdbcff" stroke-width="1" opacity="0.4"/>'+
        '<circle cx="50" cy="50" r="11" fill="#fff7e0"/></g>';
      return W+body+END;
    }
    if(dt==='globular'){
      body='<circle cx="50" cy="50" r="36" fill="#ffe9b0" opacity="0.10"/>';
      for(var g=0;g<120;g++){
        var a=rand()*Math.PI*2, rr=Math.pow(rand(),1.7)*34;
        body+='<circle cx="'+(50+Math.cos(a)*rr).toFixed(1)+'" cy="'+(50+Math.sin(a)*rr).toFixed(1)+'" r="'+(0.7+(1-rr/34)*1.2).toFixed(2)+'" fill="#fff6df" opacity="'+(0.6+rand()*0.4).toFixed(2)+'"/>';
      }
      return W+body+END;
    }
    for(var o=0;o<16;o++){
      var big=rand()<0.35;
      body+=_starDot(20+rand()*60, 22+rand()*56, big?(2.2+rand()*1.6):(1+rand()*1), o%3===0?'#bcd4ff':'#fff6df');
    }
    return W+body+END;
  }

  // ---- v3.22: lunar libration (Meeus optical), topocentric Moon, and occultation scanning ----
  function libration(date){
    var JD = jd(date), T = (JD - 2451545.0) / 36525, I = 1.54242 * RAD;
    var m = moon(JD - 2451543.5), lam = m.lon * RAD, bet = m.lat * RAD;
    var Om = rev(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T) * RAD;   // mean ascending node
    var F  = rev(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * RAD;  // argument of latitude
    var W = lam - Om;
    var A = Math.atan2(Math.sin(W) * Math.cos(bet) * Math.cos(I) - Math.sin(bet) * Math.sin(I), Math.cos(W) * Math.cos(bet));
    var lOpt = (((A - F) / RAD) % 360 + 540) % 360 - 180;                       // libration in longitude (°)
    var bOpt = Math.asin(-Math.sin(W) * Math.cos(bet) * Math.sin(I) - Math.sin(bet) * Math.cos(I)) / RAD; // in latitude (°)
    return { lon: lOpt, lat: bOpt };
  }
  // topocentric Moon (RA/Dec corrected for the observer's parallax at SCOB) + angular radius
  function moonTopo(date){
    var d = jd(date) - 2451543.5, m = moon(d), eq = eclToEq(m.lon, m.lat, d), r = m.dist;
    var ra = eq.ra, dec = eq.dec, mpar = Math.asin(1 / r) / RAD, lat = SCOB.LAT, lst = lstDeg(date);
    var gclat = lat - 0.1924 * Math.sin(2 * lat * RAD), rho = 0.99833 + 0.00167 * Math.cos(2 * lat * RAD);
    var HA = rev(lst - ra);
    var g = Math.atan(Math.tan(gclat * RAD) / Math.cos(HA * RAD)) / RAD;
    var topRA = ra - mpar * rho * Math.cos(gclat * RAD) * Math.sin(HA * RAD) / Math.cos(dec * RAD);
    var topDec = dec - mpar * rho * Math.sin(gclat * RAD) * Math.sin((g - dec) * RAD) / Math.sin(g * RAD);
    var radius = Math.asin(1737.4 / (r * 6371.0)) / RAD;                         // Moon angular radius (°)
    return { ra: rev(topRA), dec: topDec, radius: radius, par: mpar };
  }
  function _ang(r1, d1, r2, d2){ var a = Math.sin(d1 * RAD) * Math.sin(d2 * RAD) + Math.cos(d1 * RAD) * Math.cos(d2 * RAD) * Math.cos((r1 - r2) * RAD); return Math.acos(Math.max(-1, Math.min(1, a))) / RAD; }
  // scan the next `days` for the Moon passing close to (or occulting) bright zodiac stars & planets, as seen from SCOB
  function occultations(fromDate, days){
    var t0 = fromDate.getTime(), t1 = t0 + (days || 60) * 86400000, step = 10 * 60000, out = [];
    var targets = [['Aldebaran','star',68.98,16.51,0.85],['Regulus','star',152.09,11.97,1.35],['Spica','star',201.30,-11.16,1.04],['Antares','star',247.35,-26.43,1.0],
      ['Venus','planet'],['Mars','planet'],['Jupiter','planet'],['Saturn','planet'],['Mercury','planet']];
    function pos(tg, dt){ if (tg[1] === 'star') return { ra: tg[2], dec: tg[3] }; var dd = dS(dt), s = sun(dd), pe = planetEq(PLAN[tg[0]], dd, s.lon, s.r); return { ra: pe.ra, dec: pe.dec, mag: pe.mag }; }
    targets.forEach(function(tg){
      var s2 = null, s1 = null, t1p = 0;
      for (var t = t0; t <= t1; t += step){
        var dt = new Date(t), mt = moonTopo(dt), tp = pos(tg, dt), sep = _ang(mt.ra, mt.dec, tp.ra, tp.dec);
        if (s1 != null && s2 != null && s1 < s2 && s1 < sep && s1 < 1.6){       // local minimum at previous step
          var best = { t: t1p, sep: s1 };
          for (var u = t1p - step; u <= t1p + step; u += 60000){ var du = new Date(u), mm = moonTopo(du), qq = pos(tg, du), sq = _ang(mm.ra, mm.dec, qq.ra, qq.dec); if (sq < best.sep) best = { t: u, sep: sq }; }
          var bd = new Date(best.t), mb = moonTopo(bd), aa = altazAt(mb.ra, mb.dec, bd), tpm = pos(tg, bd);
          out.push({ name: tg[0], type: tg[1], mag: (tg[4] != null ? tg[4] : (tpm.mag != null ? Math.round(tpm.mag * 10) / 10 : null)), t: best.t, sep: best.sep, radius: mb.radius, occult: best.sep < mb.radius, alt: aa.alt, az: aa.az });
        }
        s2 = s1; s1 = sep; t1p = t;
      }
    });
    out.sort(function(a, b){ return a.t - b.t; });
    return out;
  }

  /* ===== Satellite transits across the Sun / Moon (v3.31) =====================
     All of this works in the UNREFRACTED horizontal frame, so a satellite's look
     angles (from SGP4) and the body's alt/az are directly comparable. Refraction
     lifts both objects by nearly the same amount when they are within a degree of
     each other, so the differential is well under an arc-second above ~10°. */
  function sunTopo(date){
    var d = jd(date) - 2451543.5, s = sun(d), eq = eclToEq(s.lon, 0, d);
    var aa = altazAt(eq.ra, eq.dec, date);
    // Angular radius 959.63″ at 1 AU. Solar parallax (8.8″) is ~1% of the disc radius
    // and far below the TLE uncertainty, so no topocentric correction is applied.
    return { ra: eq.ra, dec: eq.dec, alt: aa.alt, az: aa.az, radius: 0.266563 / s.r, dist: s.r };
  }
  function moonDisc(date){
    var m = moonTopo(date), aa = altazAt(m.ra, m.dec, date);
    return { ra: m.ra, dec: m.dec, alt: aa.alt, az: aa.az, radius: m.radius, par: m.par };
  }
  function discBody(which, date){ return which === 'sun' ? sunTopo(date) : moonDisc(date); }
  // Angular separation of two points given as (azimuth-like, altitude-like), in degrees.
  function angSep(a1, h1, a2, h2){ return _ang(a1, h1, a2, h2); }

  function _crossTime(sepAt, tin, tout, rad){          // bisect for the moment sep == rad
    var ri = sepAt(tin), ro = sepAt(tout);
    if (!ri || !ro || ri.sep > rad || ro.sep < rad) return null;
    for (var i = 0; i < 60 && Math.abs(tout - tin) > 1; i++){
      var mid = (tin + tout) / 2, rm = sepAt(mid);
      if (!rm) return null;
      if (rm.sep < rad) tin = mid; else tout = mid;
    }
    return (tin + tout) / 2;
  }
  function _refineTransit(sepAt, a, b, issLen, maxSep){
    for (var i = 0; i < 80 && b - a > 1; i++){         // ternary search: sep is unimodal across one pass
      var m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
      var s1 = sepAt(m1), s2 = sepAt(m2);
      if (!s1 || !s2) return null;
      if (s1.sep < s2.sep) b = m2; else a = m1;
    }
    var tm = (a + b) / 2, best = sepAt(tm);
    if (!best || best.sep > maxSep) return null;
    var issDeg = 2 * Math.atan((issLen / 2) / (best.s.range * 1000)) * DEG;   // apparent size of the station
    var rad = best.b.radius;
    var kind = (best.sep + issDeg / 2 < rad) ? 'full' : (best.sep < rad ? 'transit'
             : (best.sep < rad + issDeg / 2 ? 'graze' : 'miss'));
    var dur = 0, ts = null, te = null;
    if (best.sep < rad){
      ts = _crossTime(sepAt, tm, tm - 15000, rad);
      te = _crossTime(sepAt, tm, tm + 15000, rad);
      if (ts != null && te != null) dur = (te - ts) / 1000;
    }
    return { t: tm, sep: best.sep, kind: kind, radius: rad, issDeg: issDeg, dur: dur, start: ts, end: te,
             alt: best.s.alt, az: best.s.az, range: best.s.range,
             bodyAlt: best.b.alt, bodyAz: best.b.az, frac: issDeg / (2 * rad) };
  }
  /* satFn(msEpoch) -> {alt, az, range(km)} or null when unavailable.
     Coarse-scans for local minima of the separation, then refines each to ~1 ms. */
  function transitScan(satFn, which, t0, t1, cfg){
    cfg = cfg || {};
    var step = (cfg.stepS || 20) * 1000;
    var minAlt = (cfg.minAlt == null) ? 10 : cfg.minAlt;
    var maxSep = (cfg.maxSep == null) ? 1.2 : cfg.maxSep;
    var issLen = cfg.satMeters || 109;                 // ISS solar-array span, metres
    var out = [], p1 = null, p2 = null;
    function sepAt(t){
      var dt = new Date(t), b = discBody(which, dt);
      if (b.alt < minAlt) return null;
      var s = satFn(t);
      if (!s || s.alt < minAlt) return null;
      return { sep: angSep(s.az, s.alt, b.az, b.alt), b: b, s: s };
    }
    for (var t = t0; t <= t1; t += step){
      var r = sepAt(t);
      if (!r){ p1 = p2 = null; continue; }
      var cur = { t: t, sep: r.sep };
      if (p1 && p2 && p1.sep <= p2.sep && p1.sep <= cur.sep && p1.sep < 25){
        var ev = _refineTransit(sepAt, p2.t, cur.t, issLen, maxSep);
        if (ev) out.push(ev);          // _refineTransit already drops anything beyond maxSep
      }
      p2 = p1; p1 = cur;
    }
    out.sort(function(a, b2){ return a.t - b2.t; });
    return out;
  }

  root.Astro = {
    SCOB: SCOB, RAD: RAD, DEG: DEG, rev: rev, pad: pad,
    jd: jd, lstDeg: lstDeg, altazAt: altazAt, compass: compass,
    sun: sun, moon: moon, eclToEq: eclToEq, planetEq: planetEq, PLAN: PLAN,
    sunAltAt: sunAltAt, sky: sky, SHOWPIECES: SHOWPIECES, illus: illus,
    COMETS: COMETS, cometEq: cometEq, activeComets: activeComets,
    libration: libration, moonTopo: moonTopo, occultations: occultations,
    sunTopo: sunTopo, moonDisc: moonDisc, discBody: discBody, angSep: angSep, transitScan: transitScan,
    // resolve a showpiece's current ra/dec + alt/az at a date (Moon/planets/comets live)
    positionOf: function (sp, date) {
      var d = dS(date);
      if (sp.kind === 'moon') { var mo = moon(d), meq = eclToEq(mo.lon, mo.lat, d); var a = altazAt(meq.ra, meq.dec, date); return { ra: meq.ra, dec: meq.dec, alt: a.alt, az: a.az }; }
      if (sp.kind === 'planet') { var s = sun(d), pe = planetEq(PLAN[sp.planet], d, s.lon, s.r); var a2 = altazAt(pe.ra, pe.dec, date); return { ra: pe.ra, dec: pe.dec, alt: a2.alt, az: a2.az, mag: pe.mag }; }
      if (sp.kind === 'comet') { var ce = cometEq(sp, date); var ac = altazAt(ce.ra, ce.dec, date); return { ra: ce.ra, dec: ce.dec, alt: ac.alt, az: ac.az, mag: ce.mag }; }
      var a3 = altazAt(sp.ra, sp.dec, date); return { ra: sp.ra, dec: sp.dec, alt: a3.alt, az: a3.az };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
