/* Indian sky data — the 27 Nakshatras (lunar mansions of Jyotiṣa / Vedic astronomy).
   Star entry [ra,dec,mag,HIP,westernName,role]; the junction star (yogatārā) is index `det`.
   `lord` = Vimśottarī ruling planet (graha); `gana` = temperament class.
   Star identifications after the standard yogatārā list (Surya Siddhānta / B.V. Raman) cross-checked
   to Hipparcos J2000; 23 of 27 coords are shared with chinese-sky-data.js. SCOB Night-Sky, Singapore. */

/* Nine planetary lords (Navagraha) — the 27 nakshatras cycle through these 3 times, in Vimśottarī order. */
window.NLORDS=[
  {key:"ketu",   en:"Ketu",             sa:"केतु",  col:"#b39ddb", gloss:"The south lunar node — the dragon's tail. Detachment, endings, spiritual release."},
  {key:"shukra", en:"Venus · Shukra",   sa:"शुक्र", col:"#e6dd93", gloss:"Teacher of the demons; beauty, love, art, pleasure and wealth."},
  {key:"surya",  en:"Sun · Surya",      sa:"सूर्य", col:"#ffb454", gloss:"The soul, the king, vitality, authority and the father."},
  {key:"chandra",en:"Moon · Chandra",   sa:"चन्द्र",col:"#cfe3ff", gloss:"The mind and emotions, the mother, memory and the tides of feeling."},
  {key:"mangala",en:"Mars · Mangala",   sa:"मङ्गल", col:"#ff6b6b", gloss:"The warrior; energy, courage, conflict, land and brothers."},
  {key:"rahu",   en:"Rahu",             sa:"राहु",  col:"#8391f0", gloss:"The north lunar node — the dragon's head. Obsession, foreign things, worldly desire."},
  {key:"guru",   en:"Jupiter · Guru",   sa:"गुरु",  col:"#ffd24a", gloss:"Teacher of the gods; wisdom, dharma, expansion, fortune and children."},
  {key:"shani",  en:"Saturn · Shani",   sa:"शनि",   col:"#8b9dc4", gloss:"The taskmaster; time, discipline, hardship, endurance and old age."},
  {key:"budha",  en:"Mercury · Budha",  sa:"बुध",   col:"#6fe0a0", gloss:"The messenger; intellect, speech, commerce, wit and learning."}
];

/* Three temperament classes (gaṇa) — nine nakshatras each. */
window.NGANA={
  deva:    {en:"Deva",    sa:"देव",     col:"#ffd24a", gloss:"Divine, gentle, benevolent natures — sattvic and light."},
  manushya:{en:"Manushya",sa:"मनुष्य", col:"#6fe0a0", gloss:"Human natures — a balance of the material and the spiritual."},
  rakshasa:{en:"Rakshasa",sa:"राक्षस", col:"#ff6b6b", gloss:"Fierce, demonic natures — powerful, intense, tamasic."}
};

/* Twelve sidereal zodiac signs (rāśi). Each spans 30°; 2¼ nakshatras fall in each. */
window.NRASHI=[
  {en:"Aries",      sa:"मेष",     iast:"Meṣa",     lord:"mangala"},
  {en:"Taurus",     sa:"वृषभ",    iast:"Vṛṣabha",  lord:"shukra"},
  {en:"Gemini",     sa:"मिथुन",   iast:"Mithuna",  lord:"budha"},
  {en:"Cancer",     sa:"कर्क",    iast:"Karka",    lord:"chandra"},
  {en:"Leo",        sa:"सिंह",    iast:"Siṃha",    lord:"surya"},
  {en:"Virgo",      sa:"कन्या",   iast:"Kanyā",    lord:"budha"},
  {en:"Libra",      sa:"तुला",    iast:"Tulā",     lord:"shukra"},
  {en:"Scorpio",    sa:"वृश्चिक", iast:"Vṛścika",  lord:"mangala"},
  {en:"Sagittarius",sa:"धनु",     iast:"Dhanu",    lord:"guru"},
  {en:"Capricorn",  sa:"मकर",     iast:"Makara",   lord:"shani"},
  {en:"Aquarius",   sa:"कुम्भ",    iast:"Kumbha",   lord:"shani"},
  {en:"Pisces",     sa:"मीन",     iast:"Mīna",     lord:"guru"}
];

/* Pañchāṅga name tables (the five limbs of the Hindu calendar) — shared by the "tonight" page. */
window.NVARA=[
  {en:"Sunday",   sa:"रविवार",    iast:"Ravivāra",     lord:"surya"},
  {en:"Monday",   sa:"सोमवार",    iast:"Somavāra",     lord:"chandra"},
  {en:"Tuesday",  sa:"मंगलवार",   iast:"Maṅgalavāra",  lord:"mangala"},
  {en:"Wednesday",sa:"बुधवार",    iast:"Budhavāra",    lord:"budha"},
  {en:"Thursday", sa:"गुरुवार",   iast:"Guruvāra",     lord:"guru"},
  {en:"Friday",   sa:"शुक्रवार",  iast:"Śukravāra",    lord:"shukra"},
  {en:"Saturday", sa:"शनिवार",    iast:"Śanivāra",     lord:"shani"}
];
window.NTITHI=["Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañchamī","Ṣaṣṭhī","Saptamī","Aṣṭamī",
  "Navamī","Daśamī","Ekādaśī","Dvādaśī","Trayodaśī","Chaturdaśī","Pūrṇimā/Amāvāsyā"];
window.NYOGA=["Viṣkambha","Prīti","Āyuṣmān","Saubhāgya","Śobhana","Atigaṇḍa","Sukarma","Dhṛti","Śūla",
  "Gaṇḍa","Vṛddhi","Dhruva","Vyāghāta","Harṣaṇa","Vajra","Siddhi","Vyatīpāta","Varīyān","Parigha",
  "Śiva","Siddha","Sādhya","Śubha","Śukla","Brahma","Māhendra","Vaidhṛti"];
window.NKARANA=["Bava","Bālava","Kaulava","Taitila","Gara","Vaṇija","Viṣṭi (Bhadrā)"]; // 7 movable
window.NKARANA_FIXED=["Śakuni","Chatuṣpāda","Nāga","Kiṃstughna"];

/* The 27 nakshatras, in ecliptic-longitude order (each spans 13°20′ of the sidereal zodiac). */
window.NAK=[
{n:1,sa:"अश्विनी",iast:"Aśvinī",en:"The Horsewoman",lord:"ketu",gana:"deva",
 deity:"Ashvini Kumaras",deityEn:"twin horse-headed physicians of the gods",symbol:"Horse's head",
 det:0,stars:[[28.660,20.808,2.6,8903,"β Ari (Sheratan)","yogatārā"],[28.383,19.294,3.9,8832,"γ Ari (Mesarthim)",""],[31.793,23.462,2.0,9884,"α Ari (Hamal)",""]],lines:[[0,1],[0,2]],
 dEN:"The first mansion — the swift twin healers who race across the dawn sky on horseback. It rules speed, healing and fresh beginnings."},
{n:2,sa:"भरणी",iast:"Bharaṇī",en:"The Bearer",lord:"shukra",gana:"manushya",
 deity:"Yama",deityEn:"lord of death and dharma",symbol:"Yoni (womb)",
 det:0,stars:[[42.496,27.261,3.6,13209,"41 Ari (Bharani)","yogatārā"],[41.977,29.247,4.5,13061,"39 Ari (Lilii Borea)",""],[40.863,27.707,4.7,12719,"35 Ari",""]],lines:[[0,1],[0,2]],
 dEN:"Three faint stars ruled by Yama, who bears the soul away at death. It governs the womb, transformation and the passage between worlds."},
{n:3,sa:"कृत्तिका",iast:"Kṛttikā",en:"The Cutters",lord:"surya",gana:"rakshasa",
 deity:"Agni",deityEn:"god of fire",symbol:"Razor / flame",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)","yogatārā"],[56.219,24.113,3.7,17499,"17 Tau (Electra)",""],[56.302,24.467,4.3,17531,"19 Tau (Taygeta)",""],[56.457,24.368,3.9,17573,"20 Tau (Maia)",""],[56.582,23.948,4.1,17608,"23 Tau (Merope)",""],[57.291,24.053,3.6,17847,"27 Tau (Atlas)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[0,5]],
 dEN:"The Pleiades — the six flame-bright nurses who raised the war-god Kārttikeya. Sharp, fiery and purifying, ruled by Agni."},
{n:4,sa:"रोहिणी",iast:"Rohiṇī",en:"The Red One",lord:"chandra",gana:"manushya",
 deity:"Prajapati / Brahma",deityEn:"the creator",symbol:"Chariot / ox-cart",
 det:0,stars:[[68.980,16.510,0.9,21421,"α Tau (Aldebaran)","yogatārā"],[64.948,15.628,3.6,20205,"γ Tau (Hyadum)",""],[67.154,19.180,3.5,20889,"ε Tau (Ain)",""],[66.372,17.928,4.3,20648,"δ Tau",""]],lines:[[1,2],[1,3],[3,0]],
 dEN:"The ruddy star Aldebaran, eye of the Hyades bull. The Moon's beloved mansion — fertile, growing, beautiful and much-desired."},
{n:5,sa:"मृगशीर्ष",iast:"Mṛgaśīrṣa",en:"The Deer's Head",lord:"mangala",gana:"deva",
 deity:"Soma",deityEn:"the Moon / nectar of immortality",symbol:"Deer's head",
 det:0,stars:[[83.784,9.934,3.4,26207,"λ Ori (Meissa)","yogatārā"],[83.705,9.490,4.4,26176,"φ¹ Ori",""],[84.227,9.291,4.1,26366,"φ² Ori",""]],lines:[[0,1],[0,2]],
 dEN:"The faint head of Orion, seen as a searching deer. It rules seeking, curiosity, travel and gentle exploration."},
{n:6,sa:"आर्द्रा",iast:"Ārdrā",en:"The Moist One",lord:"rahu",gana:"manushya",
 deity:"Rudra",deityEn:"the fierce storm-god, an aspect of Shiva",symbol:"Teardrop / diamond",
 det:0,stars:[[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)","yogatārā"]],lines:[],
 dEN:"The single red giant Betelgeuse — the teardrop of Rudra's storm. It rules upheaval, destruction that clears the way, and renewal after grief."},
{n:7,sa:"पुनर्वसु",iast:"Punarvasu",en:"Return of the Light",lord:"guru",gana:"deva",
 deity:"Aditi",deityEn:"mother of the gods, goddess of boundlessness",symbol:"Bow and quiver",
 det:0,stars:[[116.329,28.026,1.1,37826,"β Gem (Pollux)","yogatārā"],[113.650,31.890,1.6,36850,"α Gem (Castor)",""]],lines:[[0,1]],
 dEN:"The twin heads of Gemini — the pair of restorers. It brings renewal, return, safe repetition and the light that always comes back."},
{n:8,sa:"पुष्य",iast:"Puṣya",en:"The Nourisher",lord:"shani",gana:"deva",
 deity:"Brihaspati",deityEn:"the guru of the gods (Jupiter)",symbol:"Cow's udder / lotus",
 det:0,stars:[[131.171,18.154,3.9,42911,"δ Cnc (Asellus Australis)","yogatārā"],[130.821,21.469,4.7,42806,"γ Cnc (Asellus Borealis)",""]],lines:[[0,1]],
 dEN:"By the misty Beehive cluster — the most auspicious of all mansions. It nourishes, protects and blesses; a favoured time for sacred acts."},
{n:9,sa:"आश्लेषा",iast:"Āśleṣā",en:"The Embrace",lord:"budha",gana:"rakshasa",
 deity:"Nagas",deityEn:"the serpent deities",symbol:"Coiled serpent",
 det:0,stars:[[131.694,6.419,3.4,43109,"ε Hya (Ashlesha)","yogatārā"],[129.414,5.704,4.1,42313,"δ Hya",""],[130.806,3.399,4.3,42799,"σ Hya (Minchir)",""],[129.689,3.341,4.5,42402,"η Hya",""]],lines:[[1,0],[0,2],[2,3]],
 dEN:"The coiled head of the Hydra serpent — hypnotic, penetrating and entwining. It rules cunning, kundalini energy and the serpent's embrace."},
{n:10,sa:"मघा",iast:"Maghā",en:"The Mighty",lord:"ketu",gana:"rakshasa",
 deity:"Pitris",deityEn:"the ancestors / departed forefathers",symbol:"Royal throne",
 det:0,stars:[[152.093,11.967,1.4,49669,"α Leo (Regulus)","yogatārā"],[151.833,16.763,3.4,49583,"η Leo",""],[154.993,19.842,2.0,50583,"γ Leo (Algieba)",""]],lines:[[0,1],[1,2]],
 dEN:"Regulus, the little king at the lion's heart — the royal throne. It rules ancestry, authority, tradition and honour inherited from the forebears."},
{n:11,sa:"पूर्वफल्गुनी",iast:"Pūrva Phalgunī",en:"The Former Red One",lord:"shukra",gana:"manushya",
 deity:"Bhaga",deityEn:"god of delight and good fortune",symbol:"Front legs of a bed",
 det:0,stars:[[168.527,20.524,2.6,54872,"δ Leo (Zosma)","yogatārā"],[168.560,15.430,3.3,54879,"θ Leo (Chertan)",""]],lines:[[0,1]],
 dEN:"The front of the resting couch — pleasure, romance, relaxation and creative enjoyment. Ruled by Bhaga, giver of delight."},
{n:12,sa:"उत्तरफल्गुनी",iast:"Uttara Phalgunī",en:"The Latter Red One",lord:"surya",gana:"manushya",
 deity:"Aryaman",deityEn:"god of patronage, contracts and marriage",symbol:"Back legs of a bed",
 det:0,stars:[[177.265,14.572,2.1,57632,"β Leo (Denebola)","yogatārā"]],lines:[],
 dEN:"Denebola at the lion's tail — the back of the couch. It rules committed partnership, patronage, generosity and reliable friendship."},
{n:13,sa:"हस्त",iast:"Hasta",en:"The Hand",lord:"chandra",gana:"deva",
 deity:"Savitr",deityEn:"the solar creator who inspires",symbol:"Hand / fist",
 det:0,stars:[[187.466,-16.515,2.9,60965,"δ Crv (Algorab)","yogatārā"],[183.952,-17.542,2.6,59803,"γ Crv (Gienah)",""],[182.531,-22.620,3.0,59316,"ε Crv (Minkar)",""],[188.597,-23.397,2.6,61359,"β Crv (Kraz)",""],[182.103,-24.729,4.0,59199,"α Crv (Alchiba)",""]],lines:[[1,0],[0,3],[3,2],[2,4],[4,1]],
 dEN:"The five stars of Corvus as a grasping hand. It rules skill, craft, healing hands and the power to seize what one seeks."},
{n:14,sa:"चित्रा",iast:"Chitrā",en:"The Brilliant Jewel",lord:"mangala",gana:"rakshasa",
 deity:"Tvashtar",deityEn:"the celestial architect (Vishvakarma)",symbol:"Bright pearl",
 det:0,stars:[[201.298,-11.161,1.0,65474,"α Vir (Spica)","yogatārā"]],lines:[],
 dEN:"Spica, the lone bright jewel — the masterwork of the divine craftsman. It rules design, beauty, brilliance and the making of dazzling things."},
{n:15,sa:"स्वाति",iast:"Svāti",en:"The Self-Going",lord:"rahu",gana:"deva",
 deity:"Vayu",deityEn:"god of wind and breath",symbol:"Coral / young shoot",
 det:0,stars:[[213.915,19.182,-0.1,69673,"α Boo (Arcturus)","yogatārā"]],lines:[],
 dEN:"Arcturus, standing alone far from the ecliptic — the independent one, swaying like a young shoot in the wind. It rules freedom, movement and self-reliance."},
{n:16,sa:"विशाखा",iast:"Viśākhā",en:"The Forked",lord:"guru",gana:"rakshasa",
 deity:"Indra-Agni",deityEn:"the paired gods of storm-power and fire",symbol:"Triumphal archway",
 det:0,stars:[[222.720,-16.042,2.8,72622,"α² Lib (Zubenelgenubi)","yogatārā"],[229.252,-9.383,2.6,74785,"β Lib (Zubeneschamali)",""]],lines:[[0,1]],
 dEN:"The forked scales of Libra as a gateway of triumph. It rules focused ambition, determination and success won after patient effort."},
{n:17,sa:"अनुराधा",iast:"Anurādhā",en:"The Follower",lord:"shani",gana:"deva",
 deity:"Mitra",deityEn:"god of friendship and cooperation",symbol:"Lotus",
 det:0,stars:[[240.083,-22.622,2.3,78401,"δ Sco (Dschubba)","yogatārā"],[241.359,-19.805,2.6,78820,"β Sco (Acrab)",""],[239.713,-26.114,2.9,78265,"π Sco",""]],lines:[[1,0],[0,2]],
 dEN:"The scorpion's brow, ruled by Mitra the friend. It rules devotion, friendship across distance, and success through warm cooperation."},
{n:18,sa:"ज्येष्ठा",iast:"Jyeṣṭhā",en:"The Eldest",lord:"budha",gana:"rakshasa",
 deity:"Indra",deityEn:"king of the gods",symbol:"Earring / umbrella",
 det:0,stars:[[247.352,-26.432,1.1,80763,"α Sco (Antares)","yogatārā"],[245.297,-25.593,2.9,80112,"σ Sco (Alniyat)",""],[248.971,-28.216,2.8,81266,"τ Sco (Paikauhale)",""]],lines:[[1,0],[0,2]],
 dEN:"Red Antares, the rival of Mars — the eldest, the chief. It rules seniority, courage, protection of others and hard-won authority."},
{n:19,sa:"मूल",iast:"Mūla",en:"The Root",lord:"ketu",gana:"rakshasa",
 deity:"Nirriti",deityEn:"goddess of dissolution and calamity",symbol:"Tied bunch of roots",
 det:0,stars:[[263.402,-37.104,1.6,85927,"λ Sco (Shaula)","yogatārā"],[262.691,-37.296,2.7,85696,"υ Sco (Lesath)",""],[265.622,-39.030,2.4,86670,"κ Sco (Girtab)",""],[264.330,-42.998,1.9,86228,"θ Sco (Sargas)",""]],lines:[[0,1],[0,2],[2,3]],
 dEN:"The scorpion's sting, near the heart of the galaxy — the root of things. It rules investigation, getting to the bottom, destruction and deep foundations."},
{n:20,sa:"पूर्वाषाढा",iast:"Pūrva Āṣāḍhā",en:"The Former Invincible",lord:"shukra",gana:"manushya",
 deity:"Apas",deityEn:"the cosmic waters",symbol:"Fan / winnowing basket",
 det:0,stars:[[275.249,-29.828,2.7,89931,"δ Sgr (Kaus Media)","yogatārā"],[276.043,-34.385,1.8,90185,"ε Sgr (Kaus Australis)",""]],lines:[[0,1]],
 dEN:"The archer's bow, ruled by the waters. It rules invincibility, purification, patience and the unstoppable flow that wears down all resistance."},
{n:21,sa:"उत्तराषाढा",iast:"Uttara Āṣāḍhā",en:"The Latter Invincible",lord:"surya",gana:"manushya",
 deity:"Vishvadevas",deityEn:"the ten universal gods",symbol:"Elephant tusk / planks",
 det:0,stars:[[283.816,-26.297,2.0,92855,"σ Sgr (Nunki)","yogatārā"],[285.653,-29.880,2.6,93506,"ζ Sgr (Ascella)",""]],lines:[[0,1]],
 dEN:"The later part of the archer — final, lasting victory. It rules integrity, leadership, and success that endures because it is deserved."},
{n:22,sa:"श्रवण",iast:"Śravaṇa",en:"The Listening",lord:"chandra",gana:"deva",
 deity:"Vishnu",deityEn:"the preserver of the universe",symbol:"Three footprints / an ear",
 det:0,stars:[[297.696,8.868,0.8,97649,"α Aql (Altair)","yogatārā"],[298.828,6.407,3.7,98036,"β Aql (Alshain)",""],[296.565,10.613,2.7,97278,"γ Aql (Tarazed)",""]],lines:[[1,0],[0,2]],
 dEN:"Altair and its two flankers — the three strides of Vishnu, or a listening ear. It rules learning, listening, wisdom through hearing and connection."},
{n:23,sa:"धनिष्ठा",iast:"Dhaniṣṭhā",en:"The Wealthiest",lord:"mangala",gana:"rakshasa",
 deity:"Vasus",deityEn:"the eight gods of the elements",symbol:"Drum / flute",
 det:0,stars:[[309.387,14.595,3.6,101769,"β Del (Rotanev)","yogatārā"],[309.909,15.912,3.8,101958,"α Del (Sualocin)",""],[311.663,16.124,4.3,102532,"γ Del",""],[310.663,15.075,4.4,102281,"δ Del",""]],lines:[[0,1],[1,2],[2,3],[3,0]],
 dEN:"The little diamond of Delphinus, seen as a drum. It rules music, rhythm, abundance and prosperity — wealth that comes with fame and celebration."},
{n:24,sa:"शतभिषा",iast:"Śatabhiṣā",en:"The Hundred Healers",lord:"rahu",gana:"rakshasa",
 deity:"Varuna",deityEn:"god of the cosmic waters and cosmic law",symbol:"Empty circle",
 det:0,stars:[[335.414,-1.387,3.8,110395,"γ Aqr (Sadachbia)","yogatārā"],[337.208,-0.020,3.7,111497,"ζ Aqr",""]],lines:[[0,1]],
 dEN:"A faint ring of a hundred dim stars in Aquarius — 'the hundred physicians'. It rules healing, secrecy, mysticism and the hidden cure."},
{n:25,sa:"पूर्वभाद्रपदा",iast:"Pūrva Bhādrapadā",en:"The Former Blessed Feet",lord:"guru",gana:"manushya",
 deity:"Aja Ekapada",deityEn:"the one-footed serpent-goat of fire",symbol:"Front of a funeral cot",
 det:0,stars:[[346.190,15.205,2.5,113963,"α Peg (Markab)","yogatārā"],[345.944,28.083,2.4,113881,"β Peg (Scheat)",""]],lines:[[0,1]],
 dEN:"The western side of the Great Square of Pegasus. Fiery and intense, ruled by a one-footed cosmic goat — it rules zeal, penance and transformation through fire."},
{n:26,sa:"उत्तरभाद्रपदा",iast:"Uttara Bhādrapadā",en:"The Latter Blessed Feet",lord:"shani",gana:"manushya",
 deity:"Ahir Budhnya",deityEn:"the serpent of the deep",symbol:"Back of a funeral cot",
 det:0,stars:[[3.309,15.184,2.8,1067,"γ Peg (Algenib)","yogatārā"],[2.097,29.090,2.1,677,"α And (Alpheratz)",""]],lines:[[0,1]],
 dEN:"The eastern side of the Great Square, ruled by the deep-sea serpent. It rules depth, calm wisdom, endurance and the still power beneath the surface."},
{n:27,sa:"रेवती",iast:"Revatī",en:"The Prosperous",lord:"budha",gana:"deva",
 deity:"Pushan",deityEn:"the shepherd-god, protector of travellers and herds",symbol:"Pair of fish / drum",
 det:0,stars:[[18.433,7.575,5.2,5737,"ζ Psc","yogatārā"]],lines:[],
 dEN:"The last, faint mansion by the fishes — the shepherd star that guides flocks and travellers safely home. It rules journeys, endings, nourishment and safe arrival."}
];

/* Ecliptic longitude helpers — each nakshatra spans 13°20′ = 13.3333° of the SIDEREAL zodiac,
   starting from 0° = the start of Aśvinī (near the sidereal vernal point). */
window.NAK_SPAN=360/27;                 // 13.3333°
window.NPADA_SPAN=window.NAK_SPAN/4;    // 3.3333° — each nakshatra has 4 padas (quarters)
/* Lahiri (Chitrapaksha) ayanāṁśa, degrees, as a function of decimal year — converts the
   of-date TROPICAL ecliptic longitude from astro-core into a SIDEREAL longitude. */
window.ayanamsa=function(year){ return 23.853 + 0.013969*(year-2000); };
/* Sidereal longitude (deg) → {index 0..26, pada 1..4, frac 0..1 within the nakshatra}. */
window.nakOfLon=function(sidLon){ var L=((sidLon%360)+360)%360; var i=Math.floor(L/window.NAK_SPAN);
  var within=L-i*window.NAK_SPAN; return {index:i, pada:Math.floor(within/window.NPADA_SPAN)+1, frac:within/window.NAK_SPAN}; };

/* Lookup: given a star's J2000 RA/Dec, return the nakshatra whose junction/member star it is
   (nearest within ~0.6°), else null. Mirrors window.chineseStarAt for cross-culture linking. */
window.nakshatraStarAt=function(ra,dec){
  if(!window.NAK||ra==null||dec==null)return null;var best=null,NAK=window.NAK;
  for(var i=0;i<NAK.length;i++){var k=NAK[i];for(var j=0;j<k.stars.length;j++){var s=k.stars[j];
    var dr=Math.abs(((s[0]-ra+540)%360)-180),dd=Math.abs(s[1]-dec);
    if(dr<0.6&&dd<0.6){var d=dr*dr+dd*dd;if(!best||d<best.d)best={d:d,sa:k.sa,iast:k.iast,en:k.en,west:s[4],n:k.n,junction:j===k.det};}}}
  return best;
};
