/* Babylonian / Mesopotamian sky data — the constellations of MUL.APIN (c. 1000 BCE) and the
   12-sign zodiac Babylon invented. Star entry [ra,dec,mag,HIP,westernName,role]; marker = index `det`.
   `path` = one of the Three Paths of the gods across the sky (Enlil north, Anu the equatorial road,
   Ea south). Figures are the direct ancestors of the Greek/Western constellations, so they share
   the same stars. Names in Sumerian/Akkadian transliteration (the scholarly standard). Coordinates
   Hipparcos J2000 (shared with the other sky-culture data files). SCOB Night-Sky, Singapore. */

/* The Three Paths (roads) of the sky. MUL.APIN sorts every figure into one, by declination band:
   Enlil the northern stars (> +17°), Anu the stars of the equator & the ecliptic road (±17°),
   Ea the southern stars (< −17°). */
window.BPATH={
  enlil:{en:"Path of Enlil",sub:"the northern sky",col:"#f5c542",god:"Enlil — lord of the sky and the air, chief of the gods",
    gloss:"The northern stars, high and often never-setting — the road of the sky-father Enlil."},
  anu:{en:"Path of Anu",sub:"the equatorial road",col:"#5bd6e0",god:"Anu — god of the heavens, the highest",
    gloss:"The band along the celestial equator — the road of the Sun, Moon and planets, ruled by Anu."},
  ea:{en:"Path of Ea",sub:"the southern sky",col:"#6fa8ff",god:"Ea — god of the deep waters and wisdom",
    gloss:"The low southern stars, close to the horizon — the road of Ea, lord of the waters below."}
};

window.BSKY=[
/* ---- Path of Enlil (northern) ---- */
{n:1,name:"MAR.GÍD.DA",en:"The Wagon",path:"enlil",west:"Ursa Major (Big Dipper)",
 det:0,stars:[[165.932,61.751,1.8,54061,"α UMa (Dubhe)",""],[165.460,56.382,2.3,53910,"β UMa (Merak)",""],[178.458,53.695,2.4,58001,"γ UMa (Phecda)",""],[183.857,57.033,3.3,59774,"δ UMa (Megrez)",""],[193.507,55.960,1.8,62956,"ε UMa (Alioth)",""],[200.981,54.925,2.2,65378,"ζ UMa (Mizar)",""],[206.885,49.313,1.9,67301,"η UMa (Alkaid)",""]],lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
 dEN:"The great Wagon of the northern sky — our Big Dipper. Circling the pole and never setting, it was a fixed marker of the north and of the turning year."},
{n:2,name:"ŠU.PA",en:"Enlil (the Herdsman)",path:"enlil",west:"Boötes",
 det:0,stars:[[213.915,19.182,-0.1,69673,"α Boo (Arcturus)",""],[221.247,27.074,2.3,72105,"ε Boo (Izar)",""],[218.019,38.308,3.5,71053,"γ Boo (Seginus)",""],[225.487,40.390,3.5,73555,"β Boo (Nekkar)",""],[208.671,18.398,3.5,67927,"η Boo",""]],lines:[[4,0],[0,1],[1,2],[2,3]],
 dEN:"ŠU.PA was identified with the god Enlil himself — its brightest star is Arcturus. Its dusk rising helped fix the start of the Babylonian year."},
{n:3,name:"APIN",en:"The Plough",path:"enlil",west:"Triangulum + Andromeda",
 det:1,stars:[[28.270,29.579,3.4,8796,"α Tri (Mothallah)",""],[32.386,34.987,3.0,10064,"β Tri",""],[34.328,33.847,4.0,10670,"γ Tri",""],[30.975,42.330,2.1,9640,"γ And (Almach)",""]],lines:[[0,1],[1,2],[2,0],[1,3]],
 dEN:"The Plough (Sumerian APIN) — the very figure that opens the tablet and gives MUL.APIN its name. A farmer's sky for a farming people."},
{n:4,name:"ŠU.GI",en:"The Old Man",path:"enlil",west:"Perseus",
 det:0,stars:[[51.081,49.861,1.8,15863,"α Per (Mirfak)",""],[47.042,40.956,2.1,14576,"β Per (Algol)",""],[46.199,53.506,2.9,13268,"γ Per",""],[59.464,47.788,3.0,18532,"δ Per",""],[58.533,31.884,2.9,18246,"ζ Per",""],[56.079,38.840,3.8,17358,"ε Per",""]],lines:[[2,0],[0,3],[0,5],[5,1],[3,4]],
 dEN:"The Old Man — the god Enmešarra, an aged deity of the underworld. It is our Perseus, holding the winking demon-star Algol."},
{n:5,name:"GAM",en:"The Crook",path:"enlil",west:"Auriga",
 det:0,stars:[[79.172,45.998,0.1,24608,"α Aur (Capella)",""],[89.882,44.947,1.9,28360,"β Aur (Menkalinan)",""],[89.930,37.213,2.6,28380,"θ Aur",""],[81.573,28.607,1.7,25428,"β Tau (Elnath)",""],[74.248,33.166,2.7,23015,"ι Aur",""],[75.492,43.823,3.0,23416,"ε Aur (Almaaz)",""]],lines:[[0,5],[0,1],[1,2],[2,3],[3,4],[4,0]],
 dEN:"The Crook or shepherd's staff (GAM) — our Auriga, crowned by brilliant Capella. A curved throwstick in the northern sky."},
{n:6,name:"MAŠ.TAB.BA.GAL.GAL",en:"The Great Twins",path:"enlil",west:"Gemini",
 det:1,stars:[[113.650,31.890,1.6,36850,"α Gem (Castor)",""],[116.329,28.026,1.1,37826,"β Gem (Pollux)",""],[99.428,16.399,1.9,31681,"γ Gem (Alhena)",""],[95.740,22.514,2.9,30343,"μ Gem (Tejat)",""],[100.983,25.131,3.1,32246,"ε Gem (Mebsuta)",""],[110.031,21.982,3.5,35550,"δ Gem (Wasat)",""]],lines:[[0,4],[4,3],[1,5],[5,2]],
 dEN:"The Great Twins Lugalirra and Meslamtaea — guardian gods of gateways. Our Gemini, the twin heads Castor and Pollux."},
{n:7,name:"MUL.MUL",en:"The Stars",path:"enlil",west:"Pleiades (in Taurus)",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],[56.219,24.113,3.7,17499,"17 Tau (Electra)",""],[56.302,24.467,4.3,17531,"19 Tau (Taygeta)",""],[56.457,24.368,3.9,17573,"20 Tau (Maia)",""],[56.582,23.948,4.1,17608,"23 Tau (Merope)",""],[57.291,24.053,3.6,17847,"27 Tau (Atlas)",""]],lines:[[5,0],[0,4],[0,3],[3,2],[2,1]],
 dEN:"MUL.MUL, 'the Stars' par excellence — the Pleiades. Their heliacal rising opened the agricultural year; the seven of them lead the whole star-list."},
/* ---- Path of Anu (equatorial / ecliptic road) ---- */
{n:8,name:"GU4.AN.NA",en:"The Bull of Heaven",path:"anu",west:"Taurus",
 det:0,stars:[[68.980,16.510,0.9,21421,"α Tau (Aldebaran)",""],[64.948,15.628,3.6,20205,"γ Tau",""],[67.154,19.180,3.5,20889,"ε Tau",""],[81.573,28.607,1.7,25428,"β Tau (Elnath)",""],[84.411,21.143,3.0,26451,"ζ Tau",""]],lines:[[1,0],[0,2],[0,4],[2,3]],
 dEN:"The Bull of Heaven — the beast Gilgamesh slew, sent by Ishtar. Our Taurus, its red eye Aldebaran and its horns reaching to Elnath and ζ Tau."},
{n:9,name:"SIPA.ZI.AN.NA",en:"The True Shepherd of Anu",path:"anu",west:"Orion",
 det:5,stars:[[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""],[81.283,6.350,1.6,25336,"γ Ori (Bellatrix)",""],[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel)",""],[86.939,-9.670,2.1,27366,"κ Ori (Saiph)",""]],lines:[[0,1],[0,2],[1,4],[2,3],[3,4],[2,6],[4,5]],
 dEN:"The True Shepherd of Anu — the god Papsukkal, herald of the gods. Our Orion; the same three belt-stars China called 參 and India Mṛgaśīrṣa/Ārdrā."},
{n:10,name:"AL.LUL",en:"The Crab",path:"anu",west:"Cancer",
 det:0,stars:[[124.129,9.186,3.5,40526,"β Cnc (Tarf)",""],[131.171,18.154,3.9,42911,"δ Cnc (Asellus Aus.)",""],[130.821,21.469,4.7,42806,"γ Cnc (Asellus Bor.)",""],[134.622,11.858,4.0,44066,"α Cnc (Acubens)",""]],lines:[[0,1],[1,2],[1,3]],
 dEN:"The Crab (AL.LUL) — the 'seat of Anu', where the summer Sun once stood at its highest. Our Cancer, cradling the Beehive cluster."},
{n:11,name:"UR.GU.LA",en:"The Lion",path:"anu",west:"Leo",
 det:0,stars:[[152.093,11.967,1.4,49669,"α Leo (Regulus)",""],[154.993,19.842,2.0,50583,"γ Leo (Algieba)",""],[154.173,23.417,3.4,50335,"ζ Leo (Adhafera)",""],[146.463,23.774,3.0,47908,"ε Leo",""],[168.527,20.524,2.6,54872,"δ Leo (Zosma)",""],[177.265,14.572,2.1,57632,"β Leo (Denebola)",""],[168.560,15.430,3.3,54879,"θ Leo (Chertan)",""]],lines:[[0,1],[1,2],[2,3],[0,6],[6,4],[4,5],[4,2]],
 dEN:"The Lion (UR.GU.LA) — Latarak, a fierce guardian god. Our Leo; Regulus, 'the little king', has marked kingship in Mesopotamia for four thousand years."},
{n:12,name:"AB.SÍN",en:"The Furrow",path:"anu",west:"Virgo",
 det:0,stars:[[201.298,-11.161,1.0,65474,"α Vir (Spica)",""],[190.415,-1.449,2.7,61941,"γ Vir (Porrima)",""],[195.544,10.959,2.9,63608,"ε Vir (Vindemiatrix)",""],[193.901,3.397,3.4,63090,"δ Vir (Auva)",""],[177.674,1.765,3.6,57757,"β Vir (Zavijava)",""]],lines:[[0,3],[3,1],[3,2],[1,4]],
 dEN:"The Furrow (AB.SÍN) — the goddess Shala holding an ear of barley: bright Spica, 'the ear of grain'. Our Virgo, herald of the harvest."},
{n:13,name:"zibānītu",en:"The Scales",path:"anu",west:"Libra",
 det:1,stars:[[222.720,-16.042,2.8,72622,"α² Lib (Zubenelgenubi)",""],[229.252,-9.383,2.6,74785,"β Lib (Zubeneschamali)",""],[233.882,-14.790,3.9,76333,"γ Lib",""]],lines:[[0,1],[1,2],[2,0]],
 dEN:"The Scales (zibānītu) — the balance of the god of justice. The only zodiac figure that is an object, not a creature; our Libra. Its Arabic star-names still mean the 'southern' and 'northern claw' of the neighbouring Scorpion."},
{n:14,name:"KAK.SI.SÁ",en:"The Arrow",path:"anu",west:"Sirius & Canis Major",
 det:0,stars:[[101.287,-16.716,-1.5,32349,"α CMa (Sirius)",""],[95.675,-17.956,2.0,30324,"β CMa (Mirzam)",""],[104.656,-28.972,1.5,33579,"ε CMa (Adhara)",""],[107.098,-26.393,1.8,34444,"δ CMa (Wezen)",""]],lines:[[1,0],[0,3],[3,2]],
 dEN:"The Arrow (KAK.SI.SÁ) — pointed by brilliant Sirius, the brightest star in the sky. Its heliacal rising marked the peak of summer heat."},
/* ---- Path of Ea (southern) ---- */
{n:15,name:"GÍR.TAB",en:"The Scorpion",path:"ea",west:"Scorpius",
 det:0,stars:[[247.352,-26.432,1.0,80763,"α Sco (Antares)",""],[241.359,-19.805,2.6,78820,"β Sco (Graffias)",""],[240.083,-22.622,2.3,78401,"δ Sco (Dschubba)",""],[239.713,-26.114,2.9,78265,"π Sco",""],[252.968,-38.047,2.3,82514,"ε Sco",""],[258.038,-43.239,3.3,84143,"η Sco",""],[264.330,-42.998,1.9,86228,"θ Sco (Sargas)",""],[263.402,-37.104,1.6,85927,"λ Sco (Shaula)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,7]],
 dEN:"The Scorpion (GÍR.TAB) — the monster of the Gilgamesh epic that guards the mountains of sunrise. Our Scorpius; red Antares was 'the heart of the Scorpion'."},
{n:16,name:"PA.BIL.SAG",en:"Pabilsag (the Archer)",path:"ea",west:"Sagittarius",
 det:1,stars:[[275.249,-29.828,2.7,89931,"δ Sgr (Kaus Media)",""],[276.043,-34.385,1.8,90185,"ε Sgr (Kaus Australis)",""],[276.993,-25.422,2.8,90496,"λ Sgr (Kaus Borealis)",""],[283.816,-26.297,2.0,92855,"σ Sgr (Nunki)",""],[285.653,-29.880,2.6,93506,"ζ Sgr (Ascella)",""],[281.414,-26.991,3.2,92041,"φ Sgr",""]],lines:[[1,0],[0,2],[2,5],[5,3],[3,4],[4,1]],
 dEN:"Pabilsag — a warrior-god drawn as a winged, scorpion-tailed centaur archer, the origin of our Sagittarius. Its brightest stars form the modern 'Teapot'."},
{n:17,name:"KU6",en:"The Fish",path:"ea",west:"Piscis Austrinus",
 det:0,stars:[[344.413,-29.622,1.2,113368,"α PsA (Fomalhaut)",""],[340.164,-27.044,4.2,111954,"ε PsA",""],[343.986,-32.539,4.2,113246,"δ PsA",""]],lines:[[1,0],[0,2]],
 dEN:"The Fish (KU6) — a great fish low in the southern sky, marked by lonely Fomalhaut. It swims in the watery region of Ea, among Aquarius and Capricornus."},
{n:18,name:"UGA",en:"The Raven",path:"ea",west:"Corvus",
 det:1,stars:[[183.952,-17.542,2.6,59803,"γ Crv (Gienah)",""],[188.597,-23.397,2.6,61359,"β Crv (Kraz)",""],[187.466,-16.515,2.9,60965,"δ Crv (Algorab)",""],[182.531,-22.620,3.0,59316,"ε Crv (Minkar)",""]],lines:[[0,2],[2,1],[1,3],[3,0]],
 dEN:"The Raven (UGA) — a bird of omen perched on the Scorpion's road. Our Corvus, a small tidy quadrilateral riding the southern sky."}
];

/* The 12 Babylonian zodiac signs — the direct ancestors of the Western zodiac, born here when
   Babylonian astronomers divided the ecliptic into twelve equal 30° signs (mid-1st millennium BCE). */
window.BZODIAC=[
  {n:1, name:"MUL.LÚ.ḪUN.GÁ", en:"The Hired Man",   west:"Aries"},
  {n:2, name:"GU4.AN.NA",      en:"The Bull of Heaven",west:"Taurus"},
  {n:3, name:"MAŠ.TAB.BA",     en:"The Great Twins", west:"Gemini"},
  {n:4, name:"AL.LUL",         en:"The Crab",        west:"Cancer"},
  {n:5, name:"UR.GU.LA",       en:"The Lion",        west:"Leo"},
  {n:6, name:"AB.SÍN",         en:"The Furrow",      west:"Virgo"},
  {n:7, name:"zibānītu",       en:"The Scales",      west:"Libra"},
  {n:8, name:"GÍR.TAB",        en:"The Scorpion",    west:"Scorpio"},
  {n:9, name:"PA.BIL.SAG",     en:"Pabilsag",        west:"Sagittarius"},
  {n:10,name:"SUḪUR.MÁŠ",      en:"The Goat-Fish",   west:"Capricorn"},
  {n:11,name:"GU.LA",          en:"The Great One",   west:"Aquarius"},
  {n:12,name:"KUN.MEŠ",        en:"The Tails",       west:"Pisces"}
];

/* J2000 ecliptic longitude of a star (deg) + which 30° sign it falls in — for the tonight page. */
if(!window.eclLonOf){window.eclLonOf=function(ra,dec){var e=23.4393*Math.PI/180,a=ra*Math.PI/180,d=dec*Math.PI/180;
  var lon=Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(d)*Math.sin(e),Math.cos(a))*180/Math.PI;return (lon%360+360)%360;};}
window.signOfLon=function(lon){return Math.floor(((lon%360)+360)%360/30);};
