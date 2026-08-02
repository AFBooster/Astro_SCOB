/* Inca / Andean sky data — the two kinds of Andean constellation: the bright-star figures, and the
   famous DARK CLOUD constellations read in the black dust-lanes of the Milky Way (Mayu, the celestial
   river). After Gary Urton, "At the Crossroads of the Earth and the Sky" (1981) and Andean ethnography.
   Bright figures: [ra,dec,mag,HIP,westernName,role] with `det`+`lines`. Dark figures: a centroid
   {cx,cy} and ellipse size {rx,ry} in degrees, plus any bright `eyes`. SCOB Night-Sky, Singapore. */

window.IKIND={
  bright:{en:"Bright-star figures",qu:"Pukllay coyllur",col:"#f5c542",
    gloss:"Constellations drawn from bright stars, as in most of the world — chief among them Qullqa, the storehouse (the Pleiades), the great calendar-marker of the Andes."},
  dark:{en:"Dark-cloud figures",qu:"Pachatira",col:"#b98cff",
    gloss:"The Inca's signature: living animals seen in the DARK patches of the Milky Way — silhouettes come to drink from Mayu, the celestial river. A whole zoo written in shadow, not light."}
};

/* The Milky Way (Mayu) — a rough trace of the southern galactic band, for context behind the dark figures. */
window.IMAYU=[[85,-5],[105,-25],[130,-45],[160,-57],[186,-63],[210,-61],[235,-55],[255,-43],[266,-29],[280,-12],[300,5]];

window.INCA=[
/* ---- Bright-star figures ---- */
{n:1,name:"Qullqa",en:"The Storehouse",kind:"bright",west:"Pleiades (in Taurus)",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],[56.219,24.113,3.7,17499,"17 Tau (Electra)",""],[56.302,24.467,4.3,17531,"19 Tau (Taygeta)",""],[56.457,24.368,3.9,17573,"20 Tau (Maia)",""],[56.582,23.948,4.1,17608,"23 Tau (Merope)",""],[57.291,24.053,3.6,17847,"27 Tau (Atlas)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[0,5]],
 dEN:"Qullqa, 'the Storehouse' — the Pleiades, the single most important star-group in the Andes. Its heliacal rising in June, and how clear or dim it looked, was read each year to predict the coming rains and the best time to plant the potatoes — a forecast farmers still make today."},
{n:2,name:"Chakana",en:"The Bridge / Southern Cross",kind:"bright",west:"Crux (Southern Cross)",
 det:0,stars:[[186.650,-63.099,0.8,60718,"α Cru (Acrux)",""],[187.791,-57.113,1.6,61084,"γ Cru (Gacrux)",""],[191.930,-59.689,1.3,62434,"β Cru (Mimosa)",""],[183.786,-58.749,2.8,59747,"δ Cru (Imai)",""]],lines:[[0,1],[2,3]],
 dEN:"Chakana — 'the bridge' or 'stair' — the Southern Cross, the most sacred figure of the Andean sky and the source of the stepped chakana cross still seen everywhere in the Andes. When it stood upright overhead it marked the cross-quarter of the year."},
/* ---- Dark-cloud figures (in the Milky Way) ---- */
{n:3,name:"Mach'acuay",en:"The Serpent",kind:"dark",west:"dark lanes of Vela–Carina",
 cx:132,cy:-47,rx:26,ry:9,
 dEN:"Mach'acuay, the Serpent — the first and longest of the dark animals, its head low toward Canis Major and its body winding up the Milky Way. It governed serpents on Earth; its appearance and disappearance timed their season."},
{n:4,name:"Hanp'atu",en:"The Toad",kind:"dark",west:"dark cloud near Crux",
 cx:203,cy:-58,rx:6,ry:4.5,
 dEN:"Hanp'atu, the Toad — a small dark patch near the Southern Cross. In Andean thought the toad heralds the rains; its rising belonged to the wet-season sky."},
{n:5,name:"Yutu",en:"The Tinamou (Partridge)",kind:"dark",west:"the Coalsack (by Crux)",
 cx:186.5,cy:-62.5,rx:5,ry:4,
 dEN:"Yutu, the Andean partridge — the Coalsack, the inky dark nebula beside the Southern Cross. (The same dark cloud is the head of the Emu in Aboriginal Australian sky-lore — two peoples, one shadow, two very different birds.)"},
{n:6,name:"Yacana",en:"The Llama",kind:"dark",west:"dark lanes, Centaurus to Scorpius",
 cx:232,cy:-56,rx:22,ry:12,eyes:[[219.902,-60.834,-0.3,71683,"α Cen (Rigil Kent.)"],[210.956,-60.373,0.6,68702,"β Cen (Hadar)"]],
 dEN:"Yacana, the Mother Llama — the greatest of the dark constellations, a huge llama striding the Milky Way from Centaurus toward Scorpius. Her two eyes (Llamacñawin) are the brilliant stars α and β Centauri. At midnight in the wet season she was said to descend to drink the seas, keeping the world from flooding."},
{n:7,name:"Uñallamacha",en:"The Baby Llama",kind:"dark",west:"dark cloud below the Llama",
 cx:224,cy:-64,rx:6,ry:5,
 dEN:"Uñallamacha, the Baby Llama — a smaller dark patch nestled below Yacana, shown suckling at its mother. The pair mirrored the llama herds on which Andean life depended."},
{n:8,name:"Atoq",en:"The Fox",kind:"dark",west:"dark cloud toward the galactic centre",
 cx:255,cy:-42,rx:8,ry:6,
 dEN:"Atoq, the Fox — a dark cloud toward the bright heart of the Milky Way in Scorpius/Sagittarius. Andean lore says the fox's tail was singed by the Sun; his rising was tied to the birthing season of the wild animals."}
];

if(!window.eclLonOf){window.eclLonOf=function(ra,dec){var e=23.4393*Math.PI/180,a=ra*Math.PI/180,d=dec*Math.PI/180;
  var lon=Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(d)*Math.sin(e),Math.cos(a))*180/Math.PI;return (lon%360+360)%360;};}
