/* Maya / Mesoamerican sky data — the star-figures of the Classic Maya and their descendants.
   Star entry [ra,dec,mag,HIP,westernName,role]; marker = index `det`. `theme` groups each figure by
   its role in the Maya cosmos. Maya sky-lore survives in the codices (Dresden, Paris), the creation
   myth (Popol Vuh) and living Maya communities — a handful of vivid figures, not a full catalogue.
   Coordinates Hipparcos J2000 (shared with the other data files). SCOB Night-Sky, Singapore. */

window.MTHEME={
  hearth:{en:"The First Hearth",col:"#ff6b6b",gloss:"The place of creation — where the gods set the three hearthstones and lit the first fire to begin this world."},
  road:{en:"The Sky Road",col:"#f5c542",gloss:"The figures along the path of the Sun, Moon and planets — the calendar animals the Maya tracked to keep time."},
  pivot:{en:"The Pivot",col:"#5bd6e0",gloss:"The still point of the turning sky — the guide for travellers and merchants."}
};

window.MAYA=[
{n:1,name:"Tzab",en:"The Rattlesnake's Rattle",theme:"road",west:"Pleiades (in Taurus)",
 det:0,stars:[[56.871,24.105,2.9,17702,"η Tau (Alcyone)",""],[56.219,24.113,3.7,17499,"17 Tau (Electra)",""],[56.302,24.467,4.3,17531,"19 Tau (Taygeta)",""],[56.457,24.368,3.9,17573,"20 Tau (Maia)",""],[56.582,23.948,4.1,17608,"23 Tau (Merope)",""],[57.291,24.053,3.6,17847,"27 Tau (Atlas)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[0,5]],
 dEN:"Tz'ab — the rattle on the tail of the great celestial rattlesnake, our Pleiades. The Maya watched this little cluster closely; its passage overhead helped mark the turning of their sacred year, and some held it to be the very place their people came from."},
{n:2,name:"Ahk & Óoxib",en:"The Turtle & the Three Hearthstones",theme:"hearth",west:"Orion",
 det:2,stars:[[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel)",""],[86.939,-9.670,2.1,27366,"κ Ori (Saiph)",""],[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""]],lines:[[2,1],[1,0],[0,4],[4,3],[3,0]],
 dEN:"Two figures in one: the three belt-stars are Ahk, the cosmic Turtle, from whose cracked shell the Maize God was reborn; and Alnitak, Saiph and Rigel form Óoxib Xk'ub, the Three Hearthstones set by the gods at creation. Between them glows the Orion Nebula (M42) — the smoke of that first fire."},
{n:3,name:"Sina'an",en:"The Scorpion",theme:"road",west:"Scorpius",
 det:0,stars:[[247.352,-26.432,1.0,80763,"α Sco (Antares)",""],[241.359,-19.805,2.6,78820,"β Sco (Graffias)",""],[240.083,-22.622,2.3,78401,"δ Sco (Dschubba)",""],[239.713,-26.114,2.9,78265,"π Sco",""],[248.971,-28.216,2.8,81266,"τ Sco",""],[252.968,-38.047,2.3,82514,"ε Sco",""],[258.038,-43.239,3.3,84143,"η Sco",""],[264.330,-42.998,1.9,86228,"θ Sco (Sargas)",""],[263.402,-37.104,1.6,85927,"λ Sco (Shaula)",""]],lines:[[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,7],[7,8]],
 dEN:"Sina'an, the Scorpion — one of the Maya zodiac animals in the Paris Codex, in the very same stars we call Scorpius. Its dawn or dusk position helped divide the ecliptic 'road' into the signs of the Maya year."},
{n:4,name:"Chan Kan / Ak'ek'",en:"The Peccaries",theme:"road",west:"Gemini",
 det:1,stars:[[113.650,31.890,1.6,36850,"α Gem (Castor)",""],[116.329,28.026,1.1,37826,"β Gem (Pollux)",""],[99.428,16.399,1.9,31681,"γ Gem (Alhena)",""],[100.983,25.131,3.1,32246,"ε Gem (Mebsuta)",""]],lines:[[0,1],[0,3],[3,2]],
 dEN:"The pair of peccaries (wild pigs) — the twin stars Castor and Pollux and their neighbours, our Gemini. A zodiac sign of the Maya sky road, and in some readings the divine twins of the Popol Vuh."},
{n:5,name:"Xaman Ek'",en:"The North Star",theme:"pivot",west:"Polaris & Ursa Minor",
 det:0,stars:[[37.954,89.264,2.0,11767,"α UMi (Polaris)",""],[222.676,74.156,2.1,72607,"β UMi (Kochab)",""],[230.182,71.834,3.0,75097,"γ UMi (Pherkad)",""]],lines:[[0,1],[1,2]],
 dEN:"Xaman Ek', 'the North Star' — the fixed pivot of the sky and the patron of merchants, who steered their long trade routes by it. Offerings were made to it for safe travel. It is our Polaris, with the guards of the Little Dipper."}
];

/* J2000 ecliptic longitude helper (for cross-culture links / Venus). */
if(!window.eclLonOf){window.eclLonOf=function(ra,dec){var e=23.4393*Math.PI/180,a=ra*Math.PI/180,d=dec*Math.PI/180;
  var lon=Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(d)*Math.sin(e),Math.cos(a))*180/Math.PI;return (lon%360+360)%360;};}
/* Venus synodic constants used on the tonight page's calendar panel. */
window.MAYA_VENUS={synodic:583.92, tzolkin:260, haab:365, roundYears:8};
