/* Malay / Nusantara sky data — indigenous star-pictures (bintang) + the 12 buruj (zodiac).
   Star entry [ra,dec,mag,HIP,westernName,role]; the marker star is index `det`.
   `use` = how the star-picture was used; `az` = the compass bearing it marks (mata angin).
   Unlike the Chinese 28 宿 / Indian 27 नक्षत्र, Malay sky-lore is an oral, practical tradition —
   a handful of vivid figures for sea-navigation and the rice calendar, not a fixed division.
   Identifications after folk-astronomy studies of the Malay Peninsula & the Nusantara;
   coordinates Hipparcos J2000 (shared with chinese-/nakshatra-sky-data.js). SCOB Night-Sky, Singapore. */

/* How the star-pictures were used — the three domains of Nusantara sky-knowledge. */
window.MUSE={
  navigation:{rumi:"Pelayaran",en:"Sea navigation",col:"#5bd6e0",gloss:"Marking the cardinal directions for sailors crossing the archipelago."},
  agriculture:{rumi:"Pertanian",en:"Farming calendar",col:"#5fd38a",gloss:"Timing the rice planting and harvest by which stars rise at dusk or dawn."},
  seasons:{rumi:"Musim",en:"Seasons & monsoon",col:"#ffb454",gloss:"Reading the coming of the wet and dry monsoons and the fishing seasons."}
};

/* Eight-point Malay compass (mata angin). */
window.MDIR=[
  {az:0,  rumi:"Utara",       en:"North"},
  {az:45, rumi:"Timur Laut",  en:"Northeast"},
  {az:90, rumi:"Timur",       en:"East"},
  {az:135,rumi:"Tenggara",    en:"Southeast"},
  {az:180,rumi:"Selatan",     en:"South"},
  {az:225,rumi:"Barat Daya",  en:"Southwest"},
  {az:270,rumi:"Barat",       en:"West"},
  {az:315,rumi:"Barat Laut",  en:"Northwest"}
];

/* The indigenous star-pictures. `az` = the bearing it signals on the mata angin. */
window.MSKY=[
{n:1,rumi:"Bintang Pari",jawi:"بينتڠ ڤاري",en:"The Stingray",west:"Crux (Southern Cross) + Pointers",
 use:"navigation",az:180,dirRumi:"Selatan",dirEn:"South",
 det:0,stars:[
   [186.650,-63.099,0.8,60718,"α Cru (Acrux)","ekor · tail"],
   [187.791,-57.113,1.6,61084,"γ Cru (Gacrux)","kepala · head"],
   [191.930,-59.689,1.3,62434,"β Cru (Mimosa)","sayap · wing"],
   [183.786,-58.749,2.8,59747,"δ Cru (Imai)","sayap · wing"],
   [219.902,-60.834,-0.3,71683,"α Cen (Rigil Kent.)","penunjuk · pointer"],
   [210.956,-60.373,0.6,68702,"β Cen (Hadar)","penunjuk · pointer"]],
 lines:[[0,1],[2,3]],
 dEN:"The Southern Cross seen as a pari (stingray) gliding through the sky-sea. Its long axis points to the south celestial pole, so it is the great southern signpost — the first star-picture a Malay navigator learns. The two bright Pointers (penunjuk) swim beside it."},
{n:2,rumi:"Bintang Belantik",jawi:"بينتڠ بلنتيق",en:"The Spring-Trap (Waluku, the Plough)",west:"Orion",
 use:"agriculture",az:90,dirRumi:"Timur",dirEn:"East",
 det:1,stars:[
   [85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)","tali · belt"],
   [84.053,-1.202,1.7,26311,"ε Ori (Alnilam)","tali · belt"],
   [83.002,-0.299,2.2,25930,"δ Ori (Mintaka)","tali · belt"],
   [88.793,7.407,0.5,27989,"α Ori (Betelgeuse)","bahu · shoulder"],
   [81.283,6.350,1.6,25336,"γ Ori (Bellatrix)","bahu · shoulder"],
   [78.634,-8.202,0.2,24436,"β Ori (Rigel)","kaki · foot"],
   [86.939,-9.670,2.1,27366,"κ Ori (Saiph)","kaki · foot"]],
 lines:[[0,1],[1,2],[3,4],[3,0],[4,2],[0,6],[2,5]],
 dEN:"Orion's belt-and-body, seen on the peninsula as a belantik (a spring-loaded spear-trap) and in Java as the waluku (plough). Straddling the celestial equator, it rises almost due east and sets due west — a reliable direction- and time-keeper, and its dusk rising signalled the rice-planting season."},
{n:3,rumi:"Bintang Biduk",jawi:"بينتڠ بيدوق",en:"The Boat",west:"Ursa Major (Big Dipper)",
 use:"navigation",az:0,dirRumi:"Utara",dirEn:"North",
 det:0,stars:[
   [165.932,61.751,1.8,54061,"α UMa (Dubhe)","haluan · bow"],
   [165.460,56.382,2.3,53910,"β UMa (Merak)","","",],
   [178.458,53.695,2.4,58001,"γ UMa (Phecda)","",""],
   [183.857,57.033,3.3,59774,"δ UMa (Megrez)","",""],
   [193.507,55.960,1.8,62956,"ε UMa (Alioth)","",""],
   [200.981,54.925,2.2,65378,"ζ UMa (Mizar)","",""],
   [206.885,49.313,1.9,67301,"η UMa (Alkaid)","buritan · stern"]],
 lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
 dEN:"The Big Dipper seen as a biduk — a small boat or dugout canoe. Low in the northern sky from Singapore, it marks north for the sailor. (Its bowl also serves, as everywhere, to point the way to the Pole Star.)"},
{n:4,rumi:"Bintang Tujuh",jawi:"بينتڠ توجوه",en:"The Seven (Kartika)",west:"Pleiades (in Taurus)",
 use:"agriculture",az:67,dirRumi:"Timur Laut",dirEn:"Northeast",
 det:0,stars:[
   [56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],
   [56.219,24.113,3.7,17499,"17 Tau (Electra)",""],
   [56.302,24.467,4.3,17531,"19 Tau (Taygeta)",""],
   [56.457,24.368,3.9,17573,"20 Tau (Maia)",""],
   [56.582,23.948,4.1,17608,"23 Tau (Merope)",""],
   [57.291,24.053,3.6,17847,"27 Tau (Atlas)",""],
   [57.296,24.136,5.0,17851,"28 Tau (Pleione)",""]],
 lines:[[5,0],[0,4],[0,3],[3,2],[2,1]],
 dEN:"The Pleiades cluster — 'the Seven' (Bintang Tujuh), also Bintang Puyuh (the quail) on the peninsula and Kartika / Lintang Wuluh in Java. Its dawn rising each year signalled the start of the planting season; when it stood overhead after dusk the padi calendar had turned."},
{n:5,rumi:"Bintang Kala Jengking",jawi:"بينتڠ كالا جڠكيڠ",en:"The Scorpion",west:"Scorpius",
 use:"seasons",az:170,dirRumi:"Selatan",dirEn:"South",
 det:0,stars:[
   [247.352,-26.432,1.0,80763,"α Sco (Antares)","hati · heart"],
   [241.359,-19.805,2.6,78820,"β Sco (Graffias)","kepala · head"],
   [240.083,-22.622,2.3,78401,"δ Sco (Dschubba)","kepala · head"],
   [239.713,-26.114,2.9,78265,"π Sco","kepala · head"],
   [248.971,-28.216,2.8,81266,"τ Sco",""],
   [252.968,-38.047,2.3,82514,"ε Sco",""],
   [253.499,-42.362,3.6,82671,"μ Sco",""],
   [258.038,-43.239,3.3,84143,"η Sco",""],
   [264.330,-42.998,1.9,86228,"θ Sco (Sargas)","",""],
   [265.622,-39.030,2.4,86670,"κ Sco",""],
   [263.402,-37.104,1.6,85927,"λ Sco (Shaula)","sengat · sting"]],
 lines:[[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]],
 dEN:"Scorpius, the kala jengking (scorpion) — one of the few star-pictures that looks exactly like its name, curved tail and sting and all. Riding high across the southern sky in the middle of the year, it marked the turn of the monsoon and the fishing seasons. In the buruj almanac it is al-'Aqrab."}
];

/* The 12 Buruj — the Arabic-Malay zodiac, adopted through Islamic almanac scholarship (ilmu falak)
   and used in the traditional Malay taqwim for seasons and the qibla. Each spans 30°.
   `west` = the matching Western/sidereal sign; jawi = the Arabic form as written in Malay manuscripts. */
window.MBURUJ=[
  {n:1, rumi:"Al-Hamal",   jawi:"الحمل",   en:"The Ram",        west:"Aries"},
  {n:2, rumi:"Al-Thaur",   jawi:"الثور",   en:"The Bull",       west:"Taurus"},
  {n:3, rumi:"Al-Jauza'",  jawi:"الجوزاء", en:"The Twins",      west:"Gemini"},
  {n:4, rumi:"Al-Saratan", jawi:"السرطان", en:"The Crab",       west:"Cancer"},
  {n:5, rumi:"Al-Asad",    jawi:"الأسد",   en:"The Lion",       west:"Leo"},
  {n:6, rumi:"Al-Sunbulah",jawi:"السنبلة", en:"The Ear of Grain",west:"Virgo"},
  {n:7, rumi:"Al-Mizan",   jawi:"الميزان", en:"The Scales",     west:"Libra"},
  {n:8, rumi:"Al-'Aqrab",  jawi:"العقرب",  en:"The Scorpion",   west:"Scorpio"},
  {n:9, rumi:"Al-Qaus",    jawi:"القوس",   en:"The Bow",        west:"Sagittarius"},
  {n:10,rumi:"Al-Jady",    jawi:"الجدي",   en:"The Kid-Goat",   west:"Capricorn"},
  {n:11,rumi:"Al-Dalw",    jawi:"الدلو",   en:"The Water-Bucket",west:"Aquarius"},
  {n:12,rumi:"Al-Hut",     jawi:"الحوت",   en:"The Fish",       west:"Pisces"}
];

/* J2000 ecliptic longitude of a star (deg), for cross-linking to the Indian nakshatras / buruj signs.
   No time needed — uses the mean obliquity. */
window.eclLonOf=function(ra,dec){
  var e=23.4393*Math.PI/180, a=ra*Math.PI/180, d=dec*Math.PI/180;
  var lon=Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(d)*Math.sin(e), Math.cos(a))*180/Math.PI;
  return (lon%360+360)%360;
};
/* Which buruj (0..11) a given SIDEREAL ecliptic longitude falls in. */
window.burujOfLon=function(sidLon){ return Math.floor(((sidLon%360)+360)%360/30); };
