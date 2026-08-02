/* Ancient Egyptian sky data — the sky-figures of the tomb ceilings (Senmut, Seti I, Dendera) and
   the 36 decans that gave us the 24-hour day. Star entry [ra,dec,mag,HIP,westernName,role]; marker = `det`.
   `realm` = the two great classes of Egyptian stars: the Imperishable (circumpolar) and the
   Unwearying (rising & setting, the decans). Securely identified figures are few — the Egyptian sky
   is known mainly from art, not a star-list — so this is a faithful, representative selection.
   Coordinates Hipparcos J2000 (shared with the other data files). SCOB Night-Sky, Singapore. */

/* The two realms of Egyptian stars. */
window.EREALM={
  imperishable:{en:"The Imperishable Stars",eg:" jḫmw-skw",col:"#f5c542",
    gloss:"The circumpolar stars that never set — 'those that know no destruction'. Eternal, they were the home of the deathless king among the gods."},
  unwearying:{en:"The Unwearying Stars",eg:"jḫmw-wrḏw",col:"#5bd6e0",
    gloss:"The stars that rise and set — 'those that never rest'. Their risings through the night were the decans, the clock of the hours."}
};

window.ESKY=[
{n:1,name:"Sopdet",eg:"spdt",en:"Sopdet — Isis (Sirius)",realm:"unwearying",west:"Sirius",
 det:0,stars:[[101.287,-16.716,-1.5,32349,"α CMa (Sirius)","Sopdet"]],lines:[],
 dEN:"Sopdet — the goddess Isis, embodied in Sirius, brightest of all stars. Her heliacal rising at dawn each summer announced the flooding of the Nile and the start of the Egyptian new year. She is the chief of the 36 decans, and follows Sah (Orion) across the sky as Isis follows Osiris."},
{n:2,name:"Sah",eg:"sꜣḥ",en:"Sah — Osiris (Orion)",realm:"unwearying",west:"Orion",
 det:2,stars:[[88.793,7.407,0.5,27989,"α Ori (Betelgeuse)",""],[81.283,6.350,1.6,25336,"γ Ori (Bellatrix)",""],[85.190,-1.943,1.7,26727,"ζ Ori (Alnitak)",""],[84.053,-1.202,1.7,26311,"ε Ori (Alnilam)",""],[83.002,-0.299,2.2,25930,"δ Ori (Mintaka)",""],[78.634,-8.202,0.2,24436,"β Ori (Rigel)",""],[86.939,-9.670,2.1,27366,"κ Ori (Saiph)",""]],lines:[[0,1],[0,2],[1,4],[2,3],[3,4],[2,6],[4,5]],
 dEN:"Sah — the soul of Osiris, god of the dead and of rebirth, shown as a man striding in a reed boat with Sopdet (Isis) behind. Our Orion; the same three belt-stars China called 參 and Babylon the True Shepherd of Anu."},
{n:3,name:"Meskhetiu",eg:"msḫtjw",en:"Meskhetiu — the Bull's Foreleg",realm:"imperishable",west:"Ursa Major (Big Dipper)",
 det:0,stars:[[165.932,61.751,1.8,54061,"α UMa (Dubhe)",""],[165.460,56.382,2.3,53910,"β UMa (Merak)",""],[178.458,53.695,2.4,58001,"γ UMa (Phecda)",""],[183.857,57.033,3.3,59774,"δ UMa (Megrez)",""],[193.507,55.960,1.8,62956,"ε UMa (Alioth)",""],[200.981,54.925,2.2,65378,"ζ UMa (Mizar)",""],[206.885,49.313,1.9,67301,"η UMa (Alkaid)",""]],lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
 dEN:"Meskhetiu — the foreleg (or adze) of the bull of Set, the most prominent figure on every Egyptian star-ceiling. Our Big Dipper. Circumpolar and never setting, it was chained near the pole and used in the 'opening of the mouth' rite that gave the dead new life."},
{n:4,name:"Reret",eg:"rrt",en:"Reret / Taweret — the Hippopotamus",realm:"imperishable",west:"Draco",
 det:3,stars:[[269.152,51.489,2.2,87833,"γ Dra (Eltanin)",""],[262.608,52.301,2.8,85670,"β Dra (Rastaban)",""],[268.382,56.873,3.7,87585,"ξ Dra (Grumium)",""],[257.197,65.715,3.2,83895,"ζ Dra",""],[245.998,61.514,2.7,80331,"η Dra",""],[231.232,58.966,3.3,75458,"ι Dra (Edasich)",""],[211.097,64.376,3.7,68756,"α Dra (Thuban)",""]],lines:[[0,1],[1,2],[2,0],[0,3],[3,4],[4,5],[5,6]],
 dEN:"Reret, 'the Sow' — the hippopotamus goddess Taweret, guardian of the northern sky, drawn standing upright with a crocodile on her back. Our Draco winding round the pole; her stars include Thuban, the pole star of the pyramid age."},
{n:5,name:"Mesekhtiu-mooring",eg:"mnjt",en:"An — the Mooring Post",realm:"imperishable",west:"Ursa Minor / near the pole",
 det:0,stars:[[222.676,74.156,2.1,72607,"β UMi (Kochab)",""],[230.182,71.834,3.0,75097,"γ UMi (Pherkad)",""],[263.054,86.586,2.0,11767,"α UMi (Polaris)",""]],lines:[[2,1],[1,0]],
 dEN:"The mooring-post (An) to which the Bull's Foreleg was tethered by a chain, so it could never escape below the horizon. Around our little Ursa Minor and today's Pole Star — the still point of the turning northern sky."}
];

/* The 36 decans — the Egyptian 'hour-stars'. Each is a star or small group whose dawn (heliacal)
   rising, 10 days apart, marked a new 10-day 'week'; through the night their successive risings
   divided the darkness into ~12 hours — the origin of the 24-hour day. 36 decans × 10 days = 360,
   plus 5 feast days = the 365-day civil year. Sopdet (Sirius) is decan #1. Individual star
   identifications (beyond Sopdet and Sah/Orion) are uncertain, so the decans are shown as the
   timekeeping ring they formed, anchored on Sopdet. */
window.EDECAN_COUNT=36;
window.EMONTH=[  /* 3 seasons × 4 months; each month = 3 decans */
  {season:"Akhet — Inundation", months:["Thoth","Phaophi","Athyr","Choiak"]},
  {season:"Peret — Growing",    months:["Tybi","Mechir","Phamenoth","Pharmuthi"]},
  {season:"Shemu — Harvest",    months:["Pachons","Payni","Epiphi","Mesore"]}
];

/* J2000 ecliptic longitude of a star (deg) + which 30° sign — reused for cross-culture links. */
if(!window.eclLonOf){window.eclLonOf=function(ra,dec){var e=23.4393*Math.PI/180,a=ra*Math.PI/180,d=dec*Math.PI/180;
  var lon=Math.atan2(Math.sin(a)*Math.cos(e)+Math.tan(d)*Math.sin(e),Math.cos(a))*180/Math.PI;return (lon%360+360)%360;};}
