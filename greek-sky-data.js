/* Greek / Ptolemaic sky data — the classical constellations and their myths, the direct source of
   today's Western sky (the 48 of Ptolemy's Almagest, grown to the modern 88). Grouped by myth family.
   Star entry [ra,dec,mag,HIP,westernName,role]; marker = index `det`. Coordinates Hipparcos J2000.
   Because these ARE the Western figures, they share their stars with every other sky-culture here —
   the cross-links are the richest of all. SCOB Night-Sky, Singapore. */

window.GFAM={
  perseus:{en:"The Perseus Legend",col:"#ff9d5c",gloss:"The great linked myth: Cassiopeia's boast, Andromeda chained to the rock, the sea-monster Cetus, and the hero Perseus on winged Pegasus who saves her — six constellations telling one story."},
  zodiac:{en:"The Zodiac",col:"#f5c542",gloss:"The twelve houses of the Sun's road — the Bull that carried Europa, the Lion of Nemea, the Scorpion that slew Orion, and more."},
  hunt:{en:"Orion & the Hunt",col:"#5bd6e0",gloss:"Orion the giant hunter with his great and lesser dogs, forever chasing across the winter sky."},
  heroes:{en:"Gods & Heroes",col:"#6fe0a0",gloss:"Zeus's bear, the herdsman who follows her, and the lyre, swan and eagle of the gods."}
};

window.GREEK=[
/* ---- The Perseus Legend ---- */
{n:1,name:"Perseus",en:"the Hero",fam:"perseus",west:"Perseus",
 det:0,stars:[[51.081,49.861,1.8,15863,"α Per (Mirfak)",""],[47.042,40.956,2.1,14576,"β Per (Algol)",""],[46.199,53.506,2.9,13268,"γ Per",""],[59.464,47.788,3.0,18532,"δ Per",""],[58.533,31.884,2.8,18246,"ζ Per",""]],lines:[[2,0],[0,3],[0,1],[1,4]],
 dEN:"Perseus, who slew the Gorgon Medusa. He holds her severed head — the demon-star Algol, 'the ghoul', which winks and dims every three days as an eclipsing companion crosses it."},
{n:2,name:"Andromeda",en:"the Chained Princess",fam:"perseus",west:"Andromeda",
 det:0,stars:[[2.097,29.090,2.1,677,"α And (Alpheratz)",""],[17.433,35.621,2.1,5447,"β And (Mirach)",""],[30.975,42.330,2.1,9640,"γ And (Almach)",""],[9.832,30.861,3.3,3092,"δ And",""]],lines:[[0,3],[3,1],[1,2]],
 dEN:"Andromeda, chained to a rock as a sacrifice to the sea-monster, and rescued by Perseus. Her chart holds the great Andromeda Galaxy, the farthest thing the naked eye can see."},
{n:3,name:"Cassiopeia",en:"the Queen",fam:"perseus",west:"Cassiopeia",
 det:0,stars:[[10.127,56.537,2.2,3179,"α Cas (Schedar)",""],[2.294,59.150,2.3,746,"β Cas (Caph)",""],[14.177,60.717,2.2,4427,"γ Cas",""],[21.454,60.235,2.7,6686,"δ Cas (Ruchbah)",""],[28.599,63.670,3.4,8886,"ε Cas (Segin)",""]],lines:[[1,0],[0,2],[2,3],[3,4]],
 dEN:"The vain queen whose boast doomed her daughter Andromeda. Set in the sky as a great 'W', she wheels around the pole, upside-down half the time as punishment for her pride."},
{n:4,name:"Pegasus",en:"the Winged Horse",fam:"perseus",west:"Pegasus",
 det:0,stars:[[346.190,15.205,2.5,113963,"α Peg (Markab)",""],[345.944,28.083,2.4,113881,"β Peg (Scheat)",""],[3.309,15.184,2.8,1067,"γ Peg (Algenib)",""],[2.097,29.090,2.1,677,"α And (Alpheratz)",""],[326.046,9.875,2.4,107315,"ε Peg (Enif)",""]],lines:[[0,1],[1,3],[3,2],[2,0],[0,4]],
 dEN:"The winged horse born from Medusa's blood, who carried Perseus. Its body is the Great Square, a huge signpost of the autumn sky (shared with Andromeda at one corner)."},
{n:5,name:"Cetus",en:"the Sea-Monster",fam:"perseus",west:"Cetus",
 det:1,stars:[[45.570,4.090,2.5,14135,"α Cet (Menkar)",""],[10.897,-17.987,2.0,3419,"β Cet (Diphda)",""],[40.825,3.236,3.5,12706,"γ Cet",""],[26.017,-15.937,3.5,8102,"τ Cet",""]],lines:[[0,2],[0,3],[3,1]],
 dEN:"The sea-monster sent to devour Andromeda, turned to stone by Medusa's head. It contains Mira, 'the Wonderful' — the first pulsating variable star ever found, which fades from view and returns over eleven months."},
/* ---- The Zodiac ---- */
{n:6,name:"Taurus",en:"the Bull",fam:"zodiac",west:"Taurus",
 det:0,stars:[[68.980,16.510,0.9,21421,"α Tau (Aldebaran)",""],[64.948,15.628,3.6,20205,"γ Tau",""],[67.154,19.180,3.5,20889,"ε Tau",""],[81.573,28.607,1.7,25428,"β Tau (Elnath)",""],[84.411,21.143,3.0,26451,"ζ Tau",""]],lines:[[1,0],[0,2],[0,4],[2,3]],
 dEN:"The bull that Zeus became to carry off the princess Europa. Its face is the V-shaped Hyades, its red eye Aldebaran, and on its shoulder ride the Pleiades."},
{n:7,name:"Gemini",en:"the Twins",fam:"zodiac",west:"Gemini",
 det:1,stars:[[113.650,31.890,1.6,36850,"α Gem (Castor)",""],[116.329,28.026,1.1,37826,"β Gem (Pollux)",""],[99.428,16.399,1.9,31681,"γ Gem (Alhena)",""],[95.740,22.514,2.9,30343,"μ Gem",""],[100.983,25.131,3.1,32246,"ε Gem",""],[110.031,21.982,3.5,35550,"δ Gem",""]],lines:[[0,4],[4,3],[1,5],[5,2]],
 dEN:"The twins Castor and Pollux, hatched with Helen of Troy from an egg. When mortal Castor died, Pollux begged to share his immortality, so the pair spend half their time in the heavens."},
{n:8,name:"Leo",en:"the Lion",fam:"zodiac",west:"Leo",
 det:0,stars:[[152.093,11.967,1.4,49669,"α Leo (Regulus)",""],[154.993,19.842,2.0,50583,"γ Leo (Algieba)",""],[154.173,23.417,3.4,50335,"ζ Leo",""],[146.463,23.774,3.0,47908,"ε Leo",""],[168.527,20.524,2.6,54872,"δ Leo (Zosma)",""],[177.265,14.572,2.1,57632,"β Leo (Denebola)",""],[168.560,15.430,3.3,54879,"θ Leo",""]],lines:[[0,1],[1,2],[2,3],[0,6],[6,4],[4,5],[4,2]],
 dEN:"The Nemean Lion, whose hide no weapon could pierce, strangled by Heracles as the first of his labours. The 'Sickle' of stars marks its mane; Regulus, 'the little king', its heart."},
{n:9,name:"Virgo",en:"the Maiden",fam:"zodiac",west:"Virgo",
 det:0,stars:[[201.298,-11.161,1.0,65474,"α Vir (Spica)",""],[190.415,-1.449,2.7,61941,"γ Vir (Porrima)",""],[195.544,10.959,2.9,63608,"ε Vir",""],[193.901,3.397,3.4,63090,"δ Vir",""],[177.674,1.765,3.6,57757,"β Vir",""]],lines:[[0,3],[3,1],[3,2],[1,4]],
 dEN:"The maiden of the harvest — Demeter, or Astraea the goddess of justice, the last immortal to leave the Earth. In her hand she holds Spica, an ear of wheat."},
{n:10,name:"Scorpius",en:"the Scorpion",fam:"zodiac",west:"Scorpius",
 det:0,stars:[[247.352,-26.432,1.0,80763,"α Sco (Antares)",""],[241.359,-19.805,2.6,78820,"β Sco",""],[240.083,-22.622,2.3,78401,"δ Sco",""],[239.713,-26.114,2.9,78265,"π Sco",""],[248.971,-28.216,2.8,81266,"τ Sco",""],[252.968,-38.047,2.3,82514,"ε Sco",""],[258.038,-43.239,3.3,84143,"η Sco",""],[264.330,-42.998,1.9,86228,"θ Sco (Sargas)",""],[263.402,-37.104,1.6,85927,"λ Sco (Shaula)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,7],[7,8]],
 dEN:"The scorpion that stung the hunter Orion to death. The gods set them at opposite ends of the sky, so that Orion still sets in the west as the Scorpion rises in the east. Its heart is red Antares, 'the rival of Mars'."},
{n:11,name:"Sagittarius",en:"the Archer",fam:"zodiac",west:"Sagittarius",
 det:1,stars:[[275.249,-29.828,2.7,89931,"δ Sgr",""],[276.043,-34.385,1.8,90185,"ε Sgr (Kaus Aus.)",""],[276.993,-25.422,2.8,90496,"λ Sgr",""],[283.816,-26.297,2.0,92855,"σ Sgr (Nunki)",""],[285.653,-29.880,2.6,93506,"ζ Sgr",""],[281.414,-26.991,3.2,92041,"φ Sgr",""]],lines:[[1,0],[0,2],[2,5],[5,3],[3,4],[4,1]],
 dEN:"The centaur archer, drawing his bow at the heart of the Scorpion. His brightest stars form the 'Teapot', pointed at the very centre of our Milky Way galaxy."},
{n:17,name:"Aries",en:"the Ram",fam:"zodiac",west:"Aries",
 det:0,stars:[[31.793,23.462,2.0,9884,"α Ari (Hamal)",""],[28.660,20.808,2.6,8903,"β Ari (Sheratan)",""],[28.383,19.294,3.9,8832,"γ Ari (Mesarthim)",""]],lines:[[0,1],[1,2]],
 dEN:"The ram with the Golden Fleece, which flew Phrixus to safety and whose fleece became the prize of Jason and the Argonauts. A modest little bend of three stars."},
{n:18,name:"Cancer",en:"the Crab",fam:"zodiac",west:"Cancer",
 det:0,stars:[[124.129,9.186,3.5,40526,"β Cnc (Tarf)",""],[131.171,18.154,3.9,42911,"δ Cnc (Asellus Aus.)",""],[130.821,21.469,4.7,42806,"γ Cnc (Asellus Bor.)",""],[134.622,11.858,4.0,44066,"α Cnc (Acubens)",""]],lines:[[0,1],[1,2],[1,3]],
 dEN:"The crab Hera sent to nip at Heracles as he battled the Hydra; he crushed it, and she set it among the stars. The faintest zodiac constellation — but home to the lovely Beehive Cluster."},
{n:19,name:"Libra",en:"the Scales",fam:"zodiac",west:"Libra",
 det:0,stars:[[229.252,-9.383,2.6,74785,"β Lib (Zubeneschamali)",""],[222.720,-16.042,2.8,72622,"α² Lib (Zubenelgenubi)",""],[233.882,-14.790,3.9,76333,"γ Lib",""],[226.017,-25.282,3.3,73714,"σ Lib (Brachium)",""]],lines:[[1,0],[0,2],[2,1],[1,3]],
 dEN:"The scales of justice held by Astraea (Virgo, next door) — the only zodiac sign that is an object, not a living thing. Its stars were once the Scorpion's claws, and their Arabic names still mean the 'northern' and 'southern claw'."},
{n:20,name:"Capricornus",en:"the Sea-Goat",fam:"zodiac",west:"Capricornus",
 det:0,stars:[[326.760,-16.127,2.9,107556,"δ Cap (Deneb Algedi)",""],[304.514,-12.545,3.6,100064,"α² Cap (Algedi)",""],[305.253,-14.781,3.0,100345,"β Cap (Dabih)",""],[325.023,-16.662,3.7,106985,"γ Cap (Nashira)",""],[321.667,-22.411,3.7,105881,"ζ Cap",""],[312.955,-26.919,4.1,102978,"ω Cap",""]],lines:[[1,0],[0,3],[3,4],[4,5],[5,2],[2,1]],
 dEN:"The sea-goat — the god Pan, who leapt into the Nile to escape the monster Typhon and turned his lower half into a fish's tail. A faint triangular smile of stars low in the south."},
{n:21,name:"Aquarius",en:"the Water-Bearer",fam:"zodiac",west:"Aquarius",
 det:0,stars:[[322.890,-5.571,2.9,106278,"β Aqr (Sadalsuud)",""],[331.446,-0.320,3.0,109074,"α Aqr (Sadalmelik)",""],[335.414,-1.387,3.8,110395,"γ Aqr (Sadachbia)",""],[337.208,-0.020,3.7,111497,"ζ Aqr",""],[338.839,-0.117,4.0,112961,"η Aqr",""],[343.663,-15.821,3.3,113136,"δ Aqr (Skat)",""]],lines:[[0,1],[1,2],[2,3],[3,4],[2,5]],
 dEN:"Ganymede, the beautiful youth carried up to Olympus by Zeus's eagle to be cup-bearer of the gods, pouring out the waters of the sky. A little Y of stars — the Water Jar — with a stream trailing south."},
{n:22,name:"Pisces",en:"the Fishes",fam:"zodiac",west:"Pisces",
 det:0,stars:[[22.871,15.346,3.6,7097,"η Psc",""],[30.510,2.764,3.8,9487,"α Psc (Alrescha)",""],[349.290,3.282,3.7,114971,"γ Psc",""],[352.940,5.626,4.1,116771,"ι Psc",""],[359.830,6.863,4.0,118268,"ω Psc",""]],lines:[[1,0],[1,4],[4,3],[3,2]],
 dEN:"Aphrodite and her son Eros, who turned into fish and tied their tails together with a cord so as not to lose each other while fleeing Typhon. The knot where the two cords meet is the star Alrescha, 'the cord'."},
/* ---- Orion & the Hunt ---- */
{n:12,name:"Orion",en:"the Hunter",fam:"hunt",west:"Orion",
 det:2,stars:[[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""],[81.283,6.350,1.6,25336,"γ Ori (Bellatrix)",""],[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel)",""],[86.939,-9.670,2.1,27366,"κ Ori (Saiph)",""]],lines:[[0,1],[0,2],[1,4],[2,3],[3,4],[2,6],[4,5]],
 dEN:"The mighty hunter, boldest of men, killed by the Scorpion's sting. The grandest figure of the sky: two bright shoulders, two bright feet, the three-star belt between, and a sword of glowing nebula hanging from it."},
{n:13,name:"Canis Major",en:"the Great Dog",fam:"hunt",west:"Canis Major",
 det:0,stars:[[101.287,-16.716,-1.5,32349,"α CMa (Sirius)",""],[95.675,-17.956,2.0,30324,"β CMa (Mirzam)",""],[104.656,-28.972,1.5,33579,"ε CMa (Adhara)",""],[107.098,-26.393,1.8,34444,"δ CMa (Wezen)",""],[111.024,-29.303,2.4,35904,"η CMa (Aludra)",""]],lines:[[1,0],[0,3],[3,2],[3,4]],
 dEN:"Orion's great hunting dog, following at his heel. Its collar is Sirius, the Dog Star — the brightest star in all the night sky, only 8.6 light-years away."},
/* ---- Gods & Heroes ---- */
{n:14,name:"Ursa Major",en:"the Great Bear",fam:"heroes",west:"Ursa Major (Big Dipper)",
 det:0,stars:[[165.932,61.751,1.8,54061,"α UMa (Dubhe)",""],[165.460,56.382,2.3,53910,"β UMa (Merak)",""],[178.458,53.695,2.4,58001,"γ UMa (Phecda)",""],[183.857,57.033,3.3,59774,"δ UMa (Megrez)",""],[193.507,55.960,1.8,62956,"ε UMa (Alioth)",""],[200.981,54.925,2.2,65378,"ζ UMa (Mizar)",""],[206.885,49.313,1.9,67301,"η UMa (Alkaid)",""]],lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
 dEN:"The Great Bear — the nymph Callisto, loved by Zeus and turned into a bear by jealous Hera, then set in the sky. Its tail is the famous Big Dipper (or Plough); the two end stars point to the Pole Star."},
{n:15,name:"Boötes",en:"the Herdsman",fam:"heroes",west:"Boötes",
 det:0,stars:[[213.915,19.182,-0.1,69673,"α Boo (Arcturus)",""],[221.247,27.074,2.3,72105,"ε Boo (Izar)",""],[218.019,38.308,3.5,71053,"γ Boo",""],[225.487,40.390,3.5,73555,"β Boo",""],[208.671,18.398,3.5,67927,"η Boo",""]],lines:[[4,0],[0,1],[1,2],[2,3]],
 dEN:"The herdsman who drives the Great Bear around the pole, or the ploughman behind the celestial Plough. He is anchored by Arcturus, the brightest star of the northern sky — 'follow the arc to Arcturus' from the Dipper's handle."},
{n:16,name:"Lyra",en:"the Lyre",fam:"heroes",west:"Lyra",
 det:0,stars:[[279.235,38.784,0.0,91262,"α Lyr (Vega)",""],[282.520,33.363,3.5,92420,"β Lyr (Sheliak)",""],[284.736,32.690,3.2,93194,"γ Lyr (Sulafat)",""],[283.626,36.899,4.2,92791,"δ Lyr",""],[281.193,37.605,4.3,91971,"ζ Lyr",""]],lines:[[0,4],[4,3],[3,2],[2,1],[1,4]],
 dEN:"The lyre of Orpheus, whose music could charm stones and stay the rivers. It is crowned by Vega, one of the brightest stars in the sky and, 12,000 years from now, the future Pole Star."}
];

/* The 12 zodiac signs as the Greeks named them — the framework the Western world inherited. */
window.GZODIAC=[
  {n:1, en:"Aries",       gk:"Krios",     myth:"the ram of the Golden Fleece"},
  {n:2, en:"Taurus",      gk:"Tauros",    myth:"Zeus as a bull, carrying Europa"},
  {n:3, en:"Gemini",      gk:"Didymoi",   myth:"the twins Castor & Pollux"},
  {n:4, en:"Cancer",      gk:"Karkinos",  myth:"the crab crushed by Heracles"},
  {n:5, en:"Leo",         gk:"Leon",      myth:"the Nemean Lion"},
  {n:6, en:"Virgo",       gk:"Parthenos", myth:"Astraea, goddess of justice"},
  {n:7, en:"Libra",       gk:"Zygos",     myth:"the scales of justice"},
  {n:8, en:"Scorpius",    gk:"Skorpios",  myth:"the scorpion that slew Orion"},
  {n:9, en:"Sagittarius", gk:"Toxotes",   myth:"the centaur archer"},
  {n:10,en:"Capricornus", gk:"Aigokeros", myth:"the sea-goat Pan"},
  {n:11,en:"Aquarius",    gk:"Hydrochoos",myth:"Ganymede, cup-bearer of the gods"},
  {n:12,en:"Pisces",      gk:"Ichthyes",  myth:"Aphrodite & Eros as fish"}
];
