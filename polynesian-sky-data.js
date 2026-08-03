/* Polynesian / Hawaiian wayfinding sky data — the star lines (nā kūlia hōkū) navigators steer by.
   Star entry [ra,dec,mag,HIP,westernName,role]; marker = index `det`. `line` = which of the four
   great star lines the figure belongs to. After the Polynesian Voyaging Society / Nainoa Thompson's
   Hawaiian star-compass system. Coordinates Hipparcos J2000. SCOB Night-Sky, Singapore. */

window.PLINE={
  bailer:{en:"Ke Ka o Makaliʻi",sub:"The Canoe-Bailer",col:"#5bd6e0",
    gloss:"The winter star line (Hoʻoilo) — a great bailer scooping across the sky, from Capella through the Twins and Procyon to Sirius, cradling the Pleiades and Orion."},
  backbone:{en:"Ka Iwikuamoʻo",sub:"The Backbone",col:"#f5c542",
    gloss:"The backbone of the sky — a north-south spine from Hōkūpaʻa (the North Star) down through Hōkūleʻa and Hikianalia to Hānaiakamalama, the Southern Cross. The navigator's line of latitude."},
  fishline:{en:"Manaiakalani",sub:"The Chief's Fishline",col:"#ff6b6b",
    gloss:"The summer star line (Kau) — Māui's great fishhook (Scorpius) with which he hauled the islands from the sea, hung below the Navigator's Triangle."},
  kite:{en:"Ka Lupe o Kawelo",sub:"The Kite of Kawelo",col:"#6fe0a0",
    gloss:"The kite of the chief Kawelo — the Great Square of Pegasus, sailing high between the other lines."}
};

window.POLY=[
/* ---- Ke Ka o Makaliʻi (the Bailer) ---- */
{n:1,name:"Ke Ka o Makaliʻi",en:"The Canoe-Bailer",line:"bailer",west:"Capella–Gemini–Procyon–Sirius arc",
 det:4,stars:[[79.172,45.998,0.1,24608,"α Aur (Capella / Hōkūlei)",""],[113.650,31.890,1.6,36850,"α Gem (Castor / Nānāmua)",""],[116.329,28.026,1.1,37826,"β Gem (Pollux / Nānāhope)",""],[114.825,5.225,0.3,37279,"α CMi (Procyon / Puana)",""],[101.287,-16.716,-1.5,32349,"α CMa (Sirius / ʻAʻā)",""]],lines:[[0,1],[1,2],[2,3],[3,4]],
 dEN:"The bailer of Makaliʻi's canoe — a sweeping arc of brilliant stars from golden Capella through the Twins and Procyon down to Sirius, the brightest star of all. The heart of the winter sky."},
{n:2,name:"Makaliʻi",en:"The Pleiades",line:"bailer",west:"Pleiades (in Taurus)",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],[56.219,24.113,3.7,17499,"17 Tau",""],[56.302,24.467,4.3,17531,"19 Tau",""],[56.457,24.368,3.9,17573,"20 Tau",""],[56.582,23.948,4.1,17608,"23 Tau",""],[57.291,24.053,3.6,17847,"27 Tau",""]],lines:[[1,2],[2,3],[3,0],[0,4],[0,5]],
 dEN:"Makaliʻi — 'the little eyes' — the Pleiades. Its dawn rising opened the Makahiki, the season of peace, harvest and the god Lono. Known across the Pacific: Matariki to the Māori, Mataliki to Sāmoa."},
{n:3,name:"Nā Kao",en:"Orion's Belt",line:"bailer",west:"Orion",
 det:1,stars:[[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel / Puanakau)",""]],lines:[[0,1],[1,2],[3,0],[2,4]],
 dEN:"Nā Kao — 'the darts', the belt of Orion, lying on the celestial equator. Rising due east and setting due west, it is one of the surest east-west markers a navigator has."},
/* ---- Ka Iwikuamoʻo (the Backbone) ---- */
{n:4,name:"Hōkūpaʻa",en:"The North Star (Polaris)",line:"backbone",west:"Polaris",
 det:0,stars:[[37.954,89.264,2.0,11767,"α UMi (Polaris)",""]],lines:[],
 dEN:"Hōkūpaʻa — 'the fixed star', Polaris. It never moves; its height above the horizon tells the navigator how far north the canoe has sailed. The top of the Backbone."},
{n:5,name:"Nā Hiku",en:"The Big Dipper",line:"backbone",west:"Ursa Major (Big Dipper)",
 det:0,stars:[[165.932,61.751,1.8,54061,"α UMa (Dubhe)",""],[165.460,56.382,2.3,53910,"β UMa (Merak)",""],[178.458,53.695,2.4,58001,"γ UMa (Phecda)",""],[183.857,57.033,3.3,59774,"δ UMa (Megrez)",""],[193.507,55.960,1.8,62956,"ε UMa (Alioth)",""],[200.981,54.925,2.2,65378,"ζ UMa (Mizar)",""],[206.885,49.313,1.9,67301,"η UMa (Alkaid)",""]],lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
 dEN:"Nā Hiku — 'the seven', the Big Dipper. Its two front stars point to Hōkūpaʻa; low in the north from Hawaiʻi, it helps hold a northward course."},
{n:6,name:"Hōkūleʻa",en:"Arcturus — the zenith star of Hawaiʻi",line:"backbone",west:"Arcturus (Boötes)",
 det:0,stars:[[213.915,19.182,-0.1,69673,"α Boo (Arcturus)",""]],lines:[],
 dEN:"Hōkūleʻa — 'the star of gladness', Arcturus. It passes directly overhead at the latitude of Hawaiʻi, so when it stands at the zenith the navigator knows the islands are near. Namesake of the great voyaging canoe."},
{n:7,name:"Hikianalia",en:"Spica",line:"backbone",west:"Spica (Virgo)",
 det:0,stars:[[201.298,-11.161,1.0,65474,"α Vir (Spica)",""]],lines:[],
 dEN:"Hikianalia — the bright star Spica, companion to Hōkūleʻa along the Backbone, and namesake of Hōkūleʻa's sister canoe."},
{n:8,name:"Hānaiakamalama",en:"The Southern Cross",line:"backbone",west:"Crux (Southern Cross)",
 det:0,stars:[[186.650,-63.099,0.8,60718,"α Cru (Acrux)",""],[187.791,-57.113,1.6,61084,"γ Cru (Gacrux)",""],[191.930,-59.689,1.3,62434,"β Cru (Mimosa)",""],[183.786,-58.749,2.8,59747,"δ Cru (Imai)",""]],lines:[[0,1],[2,3]],
 dEN:"Hānaiakamalama — the Southern Cross, the foot of the Backbone. When it stands upright over the horizon, a line down its long axis points true south; its height gives southern latitude."},
/* ---- Manaiakalani (the Fishline) ---- */
{n:9,name:"Ka Makau Nui o Māui",en:"Māui's Great Fishhook",line:"fishline",west:"Scorpius",
 det:0,stars:[[247.352,-26.432,1.0,80763,"α Sco (Antares)",""],[241.359,-19.805,2.6,78820,"β Sco",""],[240.083,-22.622,2.3,78401,"δ Sco",""],[248.971,-28.216,2.8,81266,"τ Sco",""],[252.968,-38.047,2.3,82514,"ε Sco",""],[258.038,-43.239,3.3,84143,"η Sco",""],[264.330,-42.998,1.9,86228,"θ Sco (Sargas)",""],[263.402,-37.104,1.6,85927,"λ Sco (Shaula)",""]],lines:[[1,2],[2,0],[0,3],[3,4],[4,5],[5,6],[6,7]],
 dEN:"The great fishhook of Māui — Scorpius. With it the demigod hauled the islands up from the ocean floor. Its curved barb (Shaula) and red heart (Antares) ride high on summer nights."},
{n:10,name:"Huinakolu",en:"The Navigator's Triangle",line:"fishline",west:"Vega · Deneb · Altair",
 det:0,stars:[[279.235,38.784,0.0,91262,"α Lyr (Vega / Keoe)",""],[310.358,45.280,1.3,102098,"α Cyg (Deneb)",""],[297.696,8.868,0.8,97649,"α Aql (Altair / Humu)",""]],lines:[[0,1],[1,2],[2,0]],
 dEN:"Huinakolu — the great Summer Triangle of Vega, Deneb and Altair, hung above Māui's fishhook. A wide, bright signpost of the mid-year sky."},
/* ---- Ka Lupe o Kawelo (the Kite) ---- */
{n:11,name:"Ka Lupe o Kawelo",en:"The Kite of Kawelo",line:"kite",west:"Great Square of Pegasus",
 det:0,stars:[[346.190,15.205,2.5,113963,"α Peg (Markab)",""],[345.944,28.083,2.4,113881,"β Peg (Scheat)",""],[2.097,29.090,2.1,677,"α And (Alpheratz)",""],[3.309,15.184,2.8,1067,"γ Peg (Algenib)",""]],lines:[[0,1],[1,2],[2,3],[3,0]],
 dEN:"Ka Lupe o Kawelo — the kite of the chief Kawelo, the Great Square of Pegasus. A broad diamond sailing between the Backbone and the Fishline."}
];
