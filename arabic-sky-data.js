/* Arabic sky data — the 28 lunar mansions (manāzil al-qamar), the way stations the Moon
   passes through in its ~27.3-day journey round the ecliptic. This is the third great
   lunar-mansion system after the Chinese 28 宿 and the Indian 27 nakshatras, and the one
   whose star names the modern West inherited (Aldebaran, Altair, Deneb, Fomalhaut, …).

   Star entry [ra, dec, mag, HIP, westernName, nativeStarName]; marker = index `det`.
   `q` = which quarter of the belt the mansion sits in (q1..q4), used only for grouping/colour.
   Coordinates are Hipparcos J2000, reusing the SAME positions as chinese-sky-data.js /
   nakshatra-sky-data.js where the mansions share a star (they very often do — 21+ marker
   stars are common to all three systems). SCOB Night-Sky, Singapore.

   Sources: the classical manāzil roster (Ibn Qutayba, Kitāb al-Anwāʾ; al-Ṣūfī, Book of the
   Fixed Stars; Kunitzsch & Smart, "A Dictionary of Modern Star Names"). Names given in Arabic
   script + a common transliteration; a few boundary mansions vary by source. */

window.AGRP = {
  q1:{ en:"First quarter", ar:"الربع الأول", sub:"al-Sharaṭān → al-Dhirāʿ · Aries to Gemini", col:"#5fd38a",
    gloss:"The belt opens in Aries at the old vernal point — the two horns of the Ram, the little belly, the Pleiades and the Hyades round Aldebaran, Orion's head and the Twins. The mansions the Moon rode through as the year began." },
  q2:{ en:"Second quarter", ar:"الربع الثاني", sub:"al-Nathrah → al-Simāk · Cancer to Virgo", col:"#f5c542",
    gloss:"Across the Manger of Cancer and the whole length of the Lion — his glance, forehead, mane and tail (Denebola) — into the maiden of Virgo, ending at al-Simāk al-Aʿzal, the unarmed lofty one: Spica." },
  q3:{ en:"Third quarter", ar:"الربع الثالث", sub:"al-Ghafr → al-Baldah · Virgo to Sagittarius", col:"#ff9d3c",
    gloss:"The covering of Virgo, the Claws (later the Scales), then the Scorpion entire — his crown, his red heart Antares, his raised sting Shaula — and the Ostriches drinking at the Milky Way, closing on al-Baldah, the empty district." },
  q4:{ en:"Fourth quarter", ar:"الربع الرابع", sub:"Saʿd al-Dhābiḥ → al-Rishāʾ · Capricorn to Pisces", col:"#5bd6e0",
    gloss:"The three lucky 'Saʿd' stars of Capricorn and Aquarius, the Tents, then the two Spouts of the great Bucket (the Square of Pegasus) and finally al-Rishāʾ, the well-rope — the belly of the Fish — where the belt joins its own beginning." }
};

window.AMANZIL = [
/* ───────── q1 · Aries → Gemini ───────── */
{n:1,ar:"الشرطان",tr:"al-Sharaṭān",en:"The two signs",q:"q1",west:"β, γ, α Arietis",det:0,
 stars:[[28.660,20.808,2.64,8903,"β Ari (Sheratan)",""],[28.383,19.294,3.86,8832,"γ Ari (Mesarthim)",""],[31.793,23.462,2.00,9884,"α Ari (Hamal)",""]],lines:[[0,1],[0,2]],
 dEN:"The very first mansion — 'the two signs' that marked the start of the year, the horns of the Ram. β and γ Arietis, with bright Hamal alongside. As the Moon left here, the old Arabian year began."},
{n:2,ar:"البطين",tr:"al-Buṭayn",en:"The little belly",q:"q1",west:"δ, ε, ρ Arietis",det:0,
 stars:[[45.580,19.727,4.35,14838,"δ Ari (Botein)",""],[42.756,21.331,4.63,13914,"ε Ari",""],[44.070,18.339,5.60,14477,"ρ³ Ari",""]],lines:[[1,0],[0,2]],
 dEN:"'The little belly' of the Ram — three faint stars behind the horns. A dim mansion, but the anwāʾ almanac still marked the Moon's passage through it."},
{n:3,ar:"الثريا",tr:"al-Thurayyā",en:"The many little ones",q:"q1",west:"The Pleiades",det:0,
 stars:[[56.871,24.105,2.87,17702,"η Tau (Alcyone)",""],[57.291,24.053,3.63,17847,"27 Tau (Atlas)",""],[56.219,24.113,3.70,17499,"17 Tau (Electra)",""],[56.457,24.368,3.87,17573,"20 Tau (Maia)",""],[56.582,23.948,4.14,17608,"23 Tau (Merope)",""],[56.302,24.467,4.30,17531,"19 Tau (Taygeta)",""]],lines:[[2,5],[5,3],[3,0],[0,4],[0,1]],
 dEN:"al-Thurayyā — 'the abundant little ones', the Pleiades: the most beloved star cluster of Arab poetry, its name still worn by countless people and places. The richest, most crowded of all the mansions."},
{n:4,ar:"الدبران",tr:"al-Dabarān",en:"The follower",q:"q1",west:"Aldebaran + the Hyades",det:0,
 stars:[[68.980,16.509,0.85,21421,"α Tau (Aldebaran)",""],[67.169,15.871,3.40,20894,"θ² Tau",""],[64.474,15.628,3.65,20205,"γ Tau",""],[67.154,19.180,3.53,20889,"ε Tau",""]],lines:[[0,1],[1,2],[2,3]],
 dEN:"al-Dabarān — 'the follower', because it forever chases the Pleiades across the sky. Fiery orange Aldebaran, the eye of the Bull, set in the V of the Hyades. Its name survives unchanged in English."},
{n:5,ar:"الهقعة",tr:"al-Haqʿah",en:"The white spot",q:"q1",west:"λ, φ¹, φ² Orionis",det:0,
 stars:[[83.784,9.934,3.39,26207,"λ Ori (Meissa)",""],[84.686,9.489,4.39,26594,"φ¹ Ori",""],[85.402,9.293,4.09,26864,"φ² Ori",""]],lines:[[0,1],[0,2]],
 dEN:"al-Haqʿah — a little triangle marking the head of the giant, al-Jabbār (Orion). Named for the whitish patch of a horse's coat. Meissa, its brightest, still carries the mansion's memory in the star Al-Maisan."},
{n:6,ar:"الهنعة",tr:"al-Hanʿah",en:"The brand-mark",q:"q1",west:"γ, ξ, μ Geminorum",det:0,
 stars:[[99.428,16.399,1.93,31681,"γ Gem (Alhena)",""],[101.322,12.896,3.35,32362,"ξ Gem",""],[95.740,22.514,2.87,30343,"μ Gem (Tejat)",""]],lines:[[2,0],[0,1]],
 dEN:"al-Hanʿah — a camel's brand, marking the feet of the leading Twin. Alhena, its chief star, is one of the sky's bright signposts near the Milky Way."},
{n:7,ar:"الذراع",tr:"al-Dhirāʿ",en:"The forearm",q:"q1",west:"α, β Geminorum (Castor & Pollux)",det:0,
 stars:[[116.329,28.026,1.14,37826,"β Gem (Pollux)",""],[113.650,31.888,1.58,36850,"α Gem (Castor)",""]],lines:[[0,1]],
 dEN:"al-Dhirāʿ — 'the outstretched forearm' of the old giant-Lion the Arabs saw sprawled across this whole quarter of sky. The two heads of the Twins, Castor and Pollux."},
/* ───────── q2 · Cancer → Virgo ───────── */
{n:8,ar:"النثرة",tr:"al-Nathrah",en:"The muzzle",q:"q2",west:"Praesepe (M44) + γ, δ Cancri",det:0,
 stars:[[130.050,19.670,3.70,0,"M44 (Praesepe / the Manger)",""],[131.171,21.469,4.66,43103,"γ Cnc (Asellus Borealis)",""],[131.171,18.154,3.94,42911,"δ Cnc (Asellus Australis)",""]],lines:[[1,0],[0,2]],
 dEN:"al-Nathrah — 'the muzzle' or nose-tip of the Lion: the hazy Beehive cluster (Praesepe, the Manger) between the two Ass-stars. A misty patch the eye can only just resolve — a fine binocular mansion."},
{n:9,ar:"الطرف",tr:"al-Ṭarf",en:"The glance",q:"q2",west:"β Cancri + λ Leonis",det:0,
 stars:[[124.128,9.186,3.53,40526,"β Cnc (Tarf)",""],[141.163,22.968,4.31,47908,"λ Leo (Alterf)",""]],lines:[[0,1]],
 dEN:"al-Ṭarf — 'the glance' of the Lion, the look in his eyes just before the forehead. β Cancri still bears the name Tarf, λ Leonis the name Alterf."},
{n:10,ar:"الجبهة",tr:"al-Jabhah",en:"The forehead",q:"q2",west:"α, η, γ, ζ Leonis (the Sickle)",det:0,
 stars:[[152.093,11.967,1.35,49669,"α Leo (Regulus)",""],[151.833,16.763,3.48,49583,"η Leo",""],[154.993,19.842,2.01,50583,"γ Leo (Algieba)",""],[154.173,23.417,3.44,50335,"ζ Leo (Adhafera)",""]],lines:[[0,1],[1,2],[2,3]],
 dEN:"al-Jabhah — 'the forehead' of the Lion: the curved Sickle of Leo, anchored on royal Regulus. Its stars Algieba and Adhafera still wear Arabic names."},
{n:11,ar:"الزبرة",tr:"al-Zubrah",en:"The mane",q:"q2",west:"δ, θ Leonis",det:0,
 stars:[[168.527,20.524,2.56,54872,"δ Leo (Zosma)",""],[168.560,15.430,3.33,54879,"θ Leo (Chertan)",""]],lines:[[0,1]],
 dEN:"al-Zubrah — 'the mane' on the Lion's shoulders, also called al-Kharatān. The two stars Zosma and Chertan on the hindquarters of Leo."},
{n:12,ar:"الصرفة",tr:"al-Ṣarfah",en:"The turning",q:"q2",west:"β Leonis (Denebola)",det:0,
 stars:[[177.265,14.572,2.11,57632,"β Leo (Denebola)",""]],lines:[],
 dEN:"al-Ṣarfah — 'the changer of the weather', for when the Moon left this star the heat of summer was said to break. Denebola, the Lion's tail, whose very name is 'dhanab al-asad', the tail of the lion."},
{n:13,ar:"العواء",tr:"al-ʿAwwāʾ",en:"The barker",q:"q2",west:"β, η, γ, δ, ε Virginis",det:4,
 stars:[[195.544,10.959,2.83,63608,"ε Vir (Vindemiatrix)",""],[193.901,3.398,3.38,63090,"δ Vir",""],[190.415,-1.449,2.74,61941,"γ Vir (Porrima)",""],[184.977,-0.667,3.89,60129,"η Vir (Zaniah)",""],[177.674,1.765,3.60,57757,"β Vir (Zavijava)",""]],lines:[[4,3],[3,2],[2,1],[1,0]],
 dEN:"al-ʿAwwāʾ — 'the barker', a bent line of stars sometimes seen as dogs baying behind the Lion. Its stars keep Arabic names: Zavijava, Zaniah, Porrima, Vindemiatrix."},
{n:14,ar:"السماك",tr:"al-Simāk",en:"The lofty one",q:"q2",west:"α Virginis (Spica)",det:0,
 stars:[[201.298,-11.161,0.98,65474,"α Vir (Spica)",""]],lines:[],
 dEN:"al-Simāk al-Aʿzal — 'the lofty, unarmed one', brilliant Spica, ear of wheat in the maiden's hand. Its sister al-Simāk al-Rāmiḥ ('the lance-bearer') is Arcturus."},
/* ───────── q3 · Virgo → Sagittarius ───────── */
{n:15,ar:"الغفر",tr:"al-Ghafr",en:"The covering",q:"q3",west:"ι, κ, λ Virginis",det:0,
 stars:[[214.004,-6.000,4.08,69701,"ι Vir (Syrma)",""],[213.224,-10.274,4.18,69427,"κ Vir",""],[217.963,-13.371,4.52,71075,"λ Vir",""]],lines:[[0,1],[0,2]],
 dEN:"al-Ghafr — 'the covering', three soft stars in the maiden's trailing robe. A faint mansion, held lucky in the anwāʾ almanac as a bringer of gentle weather."},
{n:16,ar:"الزبانى",tr:"al-Zubānā",en:"The claws",q:"q3",west:"α, β Librae",det:1,
 stars:[[229.252,-9.383,2.61,74785,"β Lib (Zubeneschamali)",""],[222.720,-16.042,2.75,72622,"α² Lib (Zubenelgenubi)",""]],lines:[[0,1]],
 dEN:"al-Zubānā — 'the claws of the Scorpion', reaching out where the Greeks later set the Scales. The two stars still carry their Arabic names: Zubeneschamali (northern claw) and Zubenelgenubi (southern claw)."},
{n:17,ar:"الإكليل",tr:"al-Iklīl",en:"The crown",q:"q3",west:"β, δ, π Scorpii",det:0,
 stars:[[241.359,-19.805,2.56,78820,"β Sco (Acrab)",""],[240.083,-22.622,2.29,78401,"δ Sco (Dschubba)",""],[239.713,-26.114,2.89,78265,"π Sco",""]],lines:[[0,1],[1,2]],
 dEN:"al-Iklīl — 'the crown' or forehead of the Scorpion, the curved row of stars above his heart. Acrab and Dschubba keep the mansion's Arabic voice."},
{n:18,ar:"القلب",tr:"al-Qalb",en:"The heart",q:"q3",west:"α Scorpii (Antares)",det:0,
 stars:[[247.352,-26.432,1.06,80763,"α Sco (Antares)",""],[245.297,-25.593,2.90,80112,"σ Sco",""],[248.971,-28.216,2.82,81266,"τ Sco",""]],lines:[[1,0],[0,2]],
 dEN:"Qalb al-ʿAqrab — 'the heart of the Scorpion', red Antares blazing between two flanking stars. One star, three ancient thrones: it is also the Chinese Fire Star 心宿二 and the Indian nakshatra Jyeṣṭhā."},
{n:19,ar:"الشولة",tr:"al-Shaulah",en:"The raised sting",q:"q3",west:"λ, υ Scorpii",det:0,
 stars:[[263.402,-37.104,1.63,85927,"λ Sco (Shaula)",""],[262.691,-37.296,2.70,85696,"υ Sco (Lesath)",""]],lines:[[0,1]],
 dEN:"al-Shaulah — 'the raised sting' at the Scorpion's tail-tip, the twin stars the Arabs called 'the two who sting'. Shaula and Lesath hang low over the southern horizon on Singapore's evenings."},
{n:20,ar:"النعائم",tr:"al-Naʿāʾim",en:"The ostriches",q:"q3",west:"γ, δ, ε, λ, σ, ζ, τ, φ Sagittarii",det:4,
 stars:[[271.452,-30.424,2.98,88635,"γ² Sgr (Alnasl)",""],[275.248,-29.828,2.70,89931,"δ Sgr (Kaus Media)",""],[276.043,-34.385,1.85,90185,"ε Sgr (Kaus Australis)",""],[276.993,-25.421,2.81,90496,"λ Sgr (Kaus Borealis)",""],[283.816,-26.297,2.05,92855,"σ Sgr (Nunki)",""],[285.653,-29.880,2.60,93506,"ζ Sgr (Ascella)",""],[286.741,-27.671,3.32,93864,"τ Sgr",""],[281.414,-26.990,3.17,92041,"φ Sgr",""]],lines:[[0,1],[1,2],[3,7],[7,4],[4,5],[5,6]],
 dEN:"al-Naʿāʾim — 'the ostriches', four going down to the Milky Way to drink and four coming back. The stars of the Archer we now read as the Teapot; Nunki keeps its old name."},
{n:21,ar:"البلدة",tr:"al-Baldah",en:"The empty district",q:"q3",west:"the starless field by π Sagittarii",det:0,
 stars:[[287.441,-21.024,2.88,94141,"π Sgr (Albaldah)",""]],lines:[],
 dEN:"al-Baldah — 'the district' or empty place: a bare patch of sky with no bright star, bordered by faint π Sagittarii. A rare mansion defined by darkness rather than light — the Moon crosses an empty room."},
/* ───────── q4 · Capricorn → Pisces ───────── */
{n:22,ar:"سعد الذابح",tr:"Saʿd al-Dhābiḥ",en:"Luck of the slaughterer",q:"q4",west:"α, β Capricorni",det:0,
 stars:[[305.253,-14.781,3.05,100345,"β Cap (Dabih)",""],[304.514,-12.545,3.57,100064,"α² Cap (Algedi)",""]],lines:[[0,1]],
 dEN:"Saʿd al-Dhābiḥ — 'the lucky star of the slaughterer', the first of the four 'Saʿd' fortune-mansions. Algedi and Dabih, a naked-eye double at the horn of the Sea-Goat."},
{n:23,ar:"سعد بلع",tr:"Saʿd Bulaʿ",en:"Luck of the swallower",q:"q4",west:"ε, ν Aquarii",det:0,
 stars:[[311.552,-9.496,3.77,102618,"ε Aqr (Albali)",""],[317.585,-11.372,4.51,103045,"ν Aqr",""]],lines:[[0,1]],
 dEN:"Saʿd Bulaʿ — 'the luck of the swallower', a modest pair on the water-pourer's stream. ε Aquarii still carries the mansion's name, Albali."},
{n:24,ar:"سعد السعود",tr:"Saʿd al-Suʿūd",en:"Luckiest of the lucky",q:"q4",west:"β Aquarii + ξ Aquarii",det:0,
 stars:[[322.890,-5.571,2.90,106278,"β Aqr (Sadalsuud)",""],[321.611,-7.784,4.69,105881,"ξ Aqr",""]],lines:[[0,1]],
 dEN:"Saʿd al-Suʿūd — 'the luckiest of the lucky', held the most fortunate mansion of all, rising as the harshness of winter softened. Sadalsuud, the brightest star of Aquarius, keeps its name."},
{n:25,ar:"سعد الأخبية",tr:"Saʿd al-Aḫbiyah",en:"Luck of the tents",q:"q4",west:"γ, ζ, η, π Aquarii",det:0,
 stars:[[335.414,-1.387,3.84,110395,"γ Aqr (Sadachbia)",""],[337.209,-0.020,3.65,110960,"ζ Aqr",""],[338.839,-0.117,4.02,111497,"η Aqr",""],[336.075,1.377,4.66,110672,"π Aqr",""]],lines:[[0,1],[0,2],[0,3]],
 dEN:"Saʿd al-Aḫbiyah — 'the luck of the tents', a little Y of stars imagined as tents pitched when the spring pastures greened. Sadachbia, γ Aquarii, still names the group."},
{n:26,ar:"الفرغ المقدم",tr:"al-Fargh al-Muqaddam",en:"The forward spout",q:"q4",west:"α, β Pegasi",det:0,
 stars:[[345.944,28.083,2.42,113881,"β Peg (Scheat)",""],[346.190,15.205,2.48,113963,"α Peg (Markab)",""]],lines:[[0,1]],
 dEN:"al-Fargh al-Muqaddam — 'the forward spout' of the great water-Bucket: the leading side of the Square of Pegasus, Scheat above Markab. Both names are still in use today."},
{n:27,ar:"الفرغ المؤخر",tr:"al-Fargh al-Muʾakhkhar",en:"The rear spout",q:"q4",west:"γ Pegasi + α Andromedae",det:1,
 stars:[[3.309,15.184,2.83,1067,"γ Peg (Algenib)",""],[2.097,29.090,2.06,677,"α And (Alpheratz)",""]],lines:[[0,1]],
 dEN:"al-Fargh al-Muʾakhkhar — 'the rear spout' of the Bucket, the trailing side of the Square: Algenib and Alpheratz. Together with mansion 26 it frames the Great Square of Pegasus."},
{n:28,ar:"بطن الحوت",tr:"Baṭn al-Ḥūt",en:"The belly of the fish",q:"q4",west:"β Andromedae (Mirach)",det:0,
 stars:[[17.433,35.621,2.05,5447,"β And (Mirach)",""]],lines:[],
 dEN:"Baṭn al-Ḥūt — 'the belly of the fish', also called al-Rishāʾ, 'the well-rope'. Mirach closes the circle of mansions; from here the Moon returns to al-Sharaṭān and the round begins again."}
];

/* The 12 zodiac signs (al-burūj) — the framework the mansions sit inside, 12 solar signs
   against 28 lunar stations. Arabic astronomy handed these names, sidereally reckoned, to
   medieval Europe. Used by the page's zodiac-framework section. */
window.ABURUJ = [
  {ar:"الحمل",tr:"al-Ḥamal",en:"the Ram (Aries)"},
  {ar:"الثور",tr:"al-Thawr",en:"the Bull (Taurus)"},
  {ar:"الجوزاء",tr:"al-Jawzāʾ",en:"the Twins (Gemini)"},
  {ar:"السرطان",tr:"al-Saraṭān",en:"the Crab (Cancer)"},
  {ar:"الأسد",tr:"al-Asad",en:"the Lion (Leo)"},
  {ar:"السنبلة",tr:"al-Sunbulah",en:"the Ear of Grain (Virgo)"},
  {ar:"الميزان",tr:"al-Mīzān",en:"the Balance (Libra)"},
  {ar:"العقرب",tr:"al-ʿAqrab",en:"the Scorpion (Scorpio)"},
  {ar:"القوس",tr:"al-Qaws",en:"the Bow (Sagittarius)"},
  {ar:"الجدي",tr:"al-Jady",en:"the Kid (Capricorn)"},
  {ar:"الدلو",tr:"al-Dalw",en:"the Bucket (Aquarius)"},
  {ar:"الحوت",tr:"al-Ḥūt",en:"the Fish (Pisces)"}
];

/* Which manzil a given ecliptic point falls in (0..27), for the "Moon in manzil" readout.
   Mansion 1 (al-Sharaṭān) is anchored near ecliptic longitude ~27° (β Ari, J2000); the 28
   mansions divide the 360° belt into equal 12°51′ steps from that origin. */
window.manzilOfLon = function (lon) {
  var origin = 27.0, step = 360 / 28;
  var x = (((lon - origin) % 360) + 360) % 360;
  return Math.floor(x / step);   // 0-based index into AMANZIL
};
