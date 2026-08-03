/* Aboriginal Australian sky data — star figures and, most importantly, the DARK-sky figures read in
   the black dust-lanes of the Milky Way. The Emu in the Sky is one of humanity's oldest surviving
   sky-stories. Bright figures: [ra,dec,mag,HIP,westernName,role] with `det`+`lines`. Dark figures:
   a centroid {cx,cy} + ellipse {rx,ry} in degrees. Aboriginal Australia is hundreds of nations with
   their own sky-lore; this is a small, widely-shared, respectfully-chosen selection.
   Coordinates Hipparcos J2000. SCOB Night-Sky, Singapore. */

window.AKIND={
  bright:{en:"Star figures",col:"#f5c542",
    gloss:"Figures drawn from bright stars — among them the Seven Sisters (the Pleiades), one of the oldest stories on Earth, and the canoe of Orion."},
  dark:{en:"Dark-sky figures",col:"#b98cff",
    gloss:"For many Aboriginal peoples the DARK shapes between the stars matter more than the stars — above all Gawarrgay, the Emu in the Sky, stretched along the Milky Way."}
};

/* The Milky Way — a rough trace of the southern band, home of the Emu. */
window.AMILKY=[[85,-5],[105,-25],[130,-45],[160,-57],[186,-63],[210,-61],[235,-55],[255,-43],[266,-29],[280,-12],[300,5]];

window.ABOR=[
/* ---- Star figures ---- */
{n:1,name:"Meamei — the Seven Sisters",en:"The Pleiades",kind:"bright",west:"Pleiades (in Taurus)",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],[56.219,24.113,3.7,17499,"17 Tau",""],[56.302,24.467,4.3,17531,"19 Tau",""],[56.457,24.368,3.9,17573,"20 Tau",""],[56.582,23.948,4.1,17608,"23 Tau",""],[57.291,24.053,3.6,17847,"27 Tau",""]],lines:[[1,2],[2,3],[3,0],[0,4],[0,5]],
 dEN:"The Seven Sisters — a group of young women pursued across the sky by the men of Orion. Told by Aboriginal nations across Australia (and echoed worldwide), this may be among the oldest stories humanity still tells. Their dawn rising marks the turn toward winter."},
{n:2,name:"Julpan — the Canoe",en:"Orion",kind:"bright",west:"Orion",
 det:1,stars:[[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel)",""]],lines:[[0,1],[1,2],[3,0],[2,4]],
 dEN:"To the Yolngu of Arnhem Land, the three belt-stars are Julpan — three brothers in a canoe who caught and ate a forbidden kingfish (the Orion Nebula), and were swept into the sky. To central-desert peoples the same stars are hunters chasing the Seven Sisters."},
{n:3,name:"Mirrabooka — the Southern Cross",en:"Crux & the Pointers",kind:"bright",west:"Crux + α/β Centauri",
 det:0,stars:[[186.650,-63.099,0.8,60718,"α Cru (Acrux)",""],[187.791,-57.113,1.6,61084,"γ Cru (Gacrux)",""],[191.930,-59.689,1.3,62434,"β Cru (Mimosa)",""],[183.786,-58.749,2.8,59747,"δ Cru (Imai)",""],[219.902,-60.834,-0.3,71683,"α Cen (Rigil Kent.)",""],[210.956,-60.373,0.6,68702,"β Cen (Hadar)",""]],lines:[[0,1],[2,3]],
 dEN:"The Southern Cross carries many meanings — the great ancestor Mirrabooka set in the sky to watch over the land; the foot of a giant eagle; or a stingray pursued by a shark (the two Pointers). Beside it lies the dark head of the Emu."},
{n:4,name:"Waa — the Crow",en:"Canopus",kind:"bright",west:"Canopus (Carina)",
 det:0,stars:[[95.988,-52.696,-0.7,30438,"α Car (Canopus)",""]],lines:[],
 dEN:"To the Boorong of northwestern Victoria, brilliant Canopus is Waa, the Crow — an ancestral figure. The second-brightest star in the whole sky, it blazes low in the south."},
/* ---- Dark-sky figure ---- */
{n:5,name:"Gawarrgay — the Emu in the Sky",en:"a dark constellation of the Milky Way",kind:"dark",west:"Coalsack → Scorpius dust-lanes",
 cx:212,cy:-52,rx:44,ry:15,head:[186.5,-63.0],
 dEN:"Gawarrgay, the celestial Emu — the single most important figure in much of Aboriginal astronomy. Its head is the dark Coalsack beside the Southern Cross; its neck, body and legs are the dark dust-lanes of the Milky Way running down to Scorpius. It is seen in the SHADOWS, not the stars. Its changing orientation through the year told people when emus were breeding and when to gather their eggs — a calendar written in the dark."}
];
