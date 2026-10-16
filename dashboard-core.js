/* SCOB Night-Sky — dashboard-core.js  (v4.16)
 * ---------------------------------------------------------------------------
 * The dashboard's application code: every panel, verdict and renderer on
 * scob-dashboard-v3.html. Until v4.16 this lived inside the page as a
 * <script type="text/plain" id="sharedScript"> block that a bootstrap copied
 * into a fresh <script> at load time — 143 KB of JavaScript the browser had to
 * re-parse on every visit, because injected inline code never gets the
 * engine's compiled-code cache. As its own file it is fetched once, cached by
 * the service worker and the HTTP cache, and compiled from cache thereafter.
 *
 * LOAD ORDER (unchanged): the shared engines (haze-core, seeing-core,
 * sky-culture-core, astro-core, the sky data) → the page's layout bootstrap,
 * which keeps either #desktopRoot or #mobileRoot and removes the other → this
 * file → version.js. It is a classic script, so its top-level const/let names
 * are page globals exactly as before.
 */
const {compass, jd, nextFridayYMD, pad, rev, sgtNow} = window.SkyCore;   /* shared helpers — see sky-culture-core.js */
"use strict";
const CAT=window.CAT, CONST=window.CONST;   // catalogue + constellation data moved to sky-data.js
const LAT=1.3342, LON=103.7357, RAD=Math.PI/180, DEG=180/Math.PI; // SCOB, Jurong
/* All-sky camera (optional): paste the live still-image URL of the observatory's
   all-sky / cloud camera here and the weather card will show it, refreshing each
   minute. Leave '' and the tile stays hidden — nothing changes. */
const ALLSKY_CAM='';
const IS_MOBILE=!!document.getElementById('mobileRoot');
// v4.17 — scroll behaviour of the top of the page, rebuilt.
// The v4.04-v4.16 versions collapsed part of a sticky header when the page scrolled past a small
// threshold. Collapsing changes the page height, Chrome's scroll anchoring then moves the scroll
// position to compensate, which crossed the threshold back — so the header opened and closed
// repeatedly (the flicker) and could drag the page back to the top. Rule now: nothing that reacts
// to scrolling may change the page height near its own trigger point.
//
// Desktop: the title and the glance are ordinary content (they scroll away on their own); only the
// control bar is sticky. Once it has been pinned for a while it switches to a compact form. The
// switch happens COMPACT_AT px past the bar's own place and reverses only within EXPAND_AT px of
// it; the gap between the two is far larger than the height the bar loses, so neither scroll
// anchoring (Chrome, Edge) nor its absence (Safari) can bounce it across.
if(!IS_MOBILE){(function(){
  const hdr=document.querySelector('#desktopRoot header'), sen=document.getElementById('hdrSentinel'); if(!hdr||!sen) return;
  const COMPACT_AT=180, EXPAND_AT=24;
  let min=false;
  function barTop(){ return sen.getBoundingClientRect().top+(window.pageYOffset||0); }
  function onScroll(){ const past=(window.pageYOffset||document.documentElement.scrollTop||0)-barTop();
    if(!min&&past>COMPACT_AT){ min=true; hdr.classList.add('hdr-min'); }
    else if(min&&past<EXPAND_AT){ min=false; hdr.classList.remove('hdr-min'); } }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  onScroll();
})();}

// Mobile: hide the whole pinned bar while scrolling down, bring it back on any deliberate scroll
// up. It slides with a CSS transform (layout never changes), and only once the page is past the
// bar's own height, so there is never a gap above the content. It stays put while one of its
// date/time inputs has focus, and ignores iOS rubber-banding at either end of the page.
if(IS_MOBILE){(function(){
  const bar=document.getElementById('slimbar'); if(!bar) return;
  const DIST=18;                       // px of travel in one direction before it reacts
  let hidden=false, lastY=Math.max(0,window.pageYOffset||0), run=0;
  function set(h){ if(h===hidden)return; hidden=h; bar.classList.toggle('sb-hide',h); }
  function onScroll(){
    const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    const y=Math.min(max,Math.max(0,window.pageYOffset||document.documentElement.scrollTop||0));
    const dy=y-lastY; lastY=y; if(!dy)return;
    if(y<=bar.offsetHeight+16){ run=0; set(false); return; }            // near the top: always shown
    const ae=document.activeElement; if(ae&&ae!==document.body&&bar.contains(ae)){ run=0; set(false); return; }
    if((dy>0)!==(run>0))run=0; run+=dy;
    if(run>DIST)set(true); else if(run<-DIST)set(false);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  bar.addEventListener('focusin',function(){ set(false); });
})();}

const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateLabel(y,m,d){const wd=new Date(Date.UTC(y,m,d,12)).getUTCDay();return `${WD[wd]}, ${d} ${MON[m]} ${y}`;}
function timeLabel(hh,mm){const ap=hh<12?'am':'pm';let h=hh%12||12;return h+':'+pad(mm)+' '+ap;}

// ---- v3.14: astronomy math delegated to the shared astro-core.js engine (single source of truth) ----
const sun=window.Astro.sun;
const moon=window.Astro.moon;
const eclToEq=window.Astro.eclToEq;

const PLAN=window.Astro.PLAN;
const planetEq=window.Astro.planetEq;

let LST=0, MOONEQ={ra:0,dec:0}, pct=0, illum=0, waxing=true, startUTC=0, MOONALT=-99;
let WXNOTE="";
let DARK=true;
let currentMode=(()=>{try{return localStorage.getItem('scobMode')||'visual';}catch(e){return'visual';}})();

function altaz(ra,dec){const H=(LST-ra)*RAD,dr=dec*RAD,l=LAT*RAD;
  const alt=Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;
  let az=Math.atan2(-Math.cos(dr)*Math.sin(H),Math.sin(dr)*Math.cos(l)-Math.cos(dr)*Math.sin(l)*Math.cos(H))*DEG;
  return{alt,az:rev(az)};}
function moonAltAt(date){const J=jd(date),dd=J-2451545.0,ddS=J-2451543.5;const lst=rev(280.46061837+360.98564736629*dd+LON);
  const m=moon(ddS),eq=eclToEq(m.lon,m.lat,ddS);const H=(lst-eq.ra)*RAD,dr=eq.dec*RAD,l=LAT*RAD;
  return Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;}
function moonSep(ra,dec){const a=Math.sin(dec*RAD)*Math.sin(MOONEQ.dec*RAD)+Math.cos(dec*RAD)*Math.cos(MOONEQ.dec*RAD)*Math.cos((ra-MOONEQ.ra)*RAD);return Math.acos(Math.max(-1,Math.min(1,a)))*DEG;}

// ---- v3: sunset / twilight times ----
function sunAltAt(date){const J=jd(date),dd=J-2451545.0,dS2=J-2451543.5;const lst=rev(280.46061837+360.98564736629*dd+LON);
  const s2=sun(dS2),eq=eclToEq(s2.lon,0,dS2);const Hh=(lst-eq.ra)*RAD,dr=eq.dec*RAD,l=LAT*RAD;
  return Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(Hh))*DEG;}
function sunCross(y,m,d,h0,h1,thr){let a=Date.UTC(y,m,d,h0-8,0,0),b=Date.UTC(y,m,d,h1-8,0,0);
  const f=t=>sunAltAt(new Date(t))-thr;if((f(a)>0)===(f(b)>0))return null;
  for(let k=0;k<24;k++){const mid=(a+b)/2;if((f(mid)>0)===(f(a)>0))a=mid;else b=mid;}
  const dt=new Date((a+b)/2+8*3600000);const hh2=dt.getUTCHours(),mi2=dt.getUTCMinutes();return (hh2%12||12)+':'+pad(mi2)+(hh2<12?'am':'pm');}
function sunTimes(y,m,d){return{set:sunCross(y,m,d,16,21,-0.833),dark:sunCross(y,m,d,16,22,-18),rise:sunCross(y,m,d,28,32,-0.833)};}

// ---- v3: tonight-at-a-glance summary ----
// Which of the 28 Chinese lunar mansions the Moon is in (its "lodge"), from its RA.
function moonLodgeNow(){
  if(!window.CSKY||!MOONEQ)return null;
  const yr=(GL?GL.y:new Date().getFullYear());
  const pr=(ra,dec)=>{const T=yr-2000,a=ra*RAD,dd=dec*RAD;return ra+(3.07496+1.33621*Math.sin(a)*Math.tan(dd))*T*15/3600;};
  const bnd=CSKY.map(mn=>{const s=mn.stars[mn.det];return{m:mn,ra:rev(pr(s[0],s[1]))};});
  const horn=bnd.find(b=>b.m.n===1).ra;bnd.forEach(b=>b.k=rev(b.ra-horn));bnd.sort((a,b)=>a.k-b.k);
  const mk=rev(MOONEQ.ra-horn);let lo=bnd[0].m;for(const b of bnd)if(b.k<=mk)lo=b.m;return lo;
}
function renderGlance(){
  const g=document.getElementById('glance');if(!g||!GL)return;
  const y=GL.y,m=GL.m,d=GL.d,dS=GL.dS,sLon=GL.sLon,sR=GL.sR,sunAlt=GL.sunAlt;
  const st=sunTimes(y,m,d);const ma=altaz(MOONEQ.ra,MOONEQ.dec);
  let bp=null;
  for(const nm of ['Saturn','Jupiter','Venus','Mars','Mercury']){const pe=planetEq(PLAN[nm],dS,sLon,sR);const aa=altaz(pe.ra,pe.dec);
    if(aa.alt>10){bp=nm+' '+Math.round(aa.alt)+'° '+compass(aa.az);break;}}
  let tt=null;
  if(DARK){const rows=CAT.map(t2=>{const a2=altaz(t2[3],t2[4]);return{name:t2[0],alt:a2.alt,sep:moonSep(t2[3],t2[4]),cls:t2[5],mag:t2[6]};}).filter(r=>r.alt>20).sort((a2,b2)=>b2.alt-a2.alt);
    const pick=rows.find(r=>visualVerdict(r)[0]==='exc')||rows.find(r=>visualVerdict(r)[0]==='good');
    if(pick)tt=pick.name+' '+Math.round(pick.alt)+'°';}
  let cmt=null;
  if(window.Astro&&window.Astro.activeComets){
    const cs=new Date(Date.UTC(y,m,d,GL.hh-8,GL.mm,0));
    const ups=window.Astro.activeComets(cs).map(c=>{const ce=window.Astro.cometEq(c,cs);const aa=altaz(ce.ra,ce.dec);return{name:c.name.replace(/^Comet\s+/,''),alt:aa.alt,mag:ce.mag};}).filter(c=>c.alt>8).sort((a,b)=>a.mag-b.mag);
    if(ups[0])cmt=ups[0];
    // v4.15: when every tracked comet has faded past the cut-off, say so rather than
    // let the chip silently vanish — "no comet" is an answer visitors ask for.
    if(!cmt&&window.Astro.COMETS){const J=window.Astro.jd(cs);
      const faint=window.Astro.COMETS.filter(c=>J>=c.from&&J<=c.to).map(c=>({name:c.name.replace(/^Comet\s+/,'').replace(/\/.*$/,''),mag:window.Astro.cometEq(c,cs).mag})).sort((a,b)=>a.mag-b.mag);
      if(faint[0])cmt={none:true,name:faint[0].name,mag:faint[0].mag};}}
  let head;
  // v4.14: "Tonight" was said of whatever date was on screen — Friday planned on a
  // Thursday read "Tonight looks a GO". Name the night when it is not tonight.
  function goWhen(){const dp=document.getElementById('datePick'),n=hazeDaysAhead(dp?dp.value:'');
    if(n==null||n===0)return 'Tonight';if(n===1)return 'Tomorrow night';
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(Date.UTC(y,m,d)).getUTCDay()]+' '+d+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];}
  if(sunAlt>-6)head='☀️ Sky not dark at the chosen time — fully dark from '+(st.dark||'about 8:15pm')+'.';
  else if(WXV&&WXV.cls==='ok')head='✅ '+goWhen()+' looks a GO — '+WXV.cc+'% cloud, '+WXV.pp+' rain chance.';
  else if(WXV&&WXV.cls==='warn')head='⚠️ Marginal — '+WXV.cc+'% cloud, '+WXV.pp+' rain chance; watch for breaks.';
  else if(WXV)head='❌ Likely a wash-out — '+WXV.cc+'% cloud, '+WXV.pp+' rain chance.';
  else head='🔭 Dark sky at the chosen time · live forecast loads in the weather card.';
  // v4.13: the verdict used to know about cloud and rain only, so a clear evening at
  // PSI 120 still read "Tonight looks a GO". Haze now gets a say — as a health matter
  // when NEA's band calls for one, and as a sky matter when the smoke is thick.
  const hv=hazeVerdict();
  if(sunAlt<=-6&&hv){
    const go=!!(WXV&&WXV.cls==='ok'),fc=(hv.mode==='forecast'),mg=(hv.cost!=null?'−'+hv.cost.toFixed(1)+' mag':'');
    if(hv.psi!=null&&hv.psi>200)
      head='❌ Air quality '+hv.band.name.toLowerCase()+' (PSI '+Math.round(hv.psi)+') — '+hv.call.verdict.charAt(0).toLowerCase()+hv.call.verdict.slice(1)+'.';
    else if(hv.psi!=null&&hv.psi>100)
      head=go?('⚠️ Clear enough overhead ('+WXV.cc+'% cloud), but the air is Unhealthy — PSI '+Math.round(hv.psi)+'. '+hv.call.verdict+'.')
             :(head+' Air quality Unhealthy too — PSI '+Math.round(hv.psi)+'.');
    else if(hv.cost>=1.6)
      head=go?('⚠️ Clear of cloud, but thick haze'+(fc?' is forecast':'')+' — about '+mg+(hv.aloft?', smoke aloft':'')+'. A Moon, planets and doubles night.')
             :(head+' Thick haze'+(fc?' forecast':'')+' too ('+mg+').');
    else if(hv.cost>=0.8)
      head+=' Hazy'+(fc?' (forecast)':'')+' — faint targets dimmed about '+hv.cost.toFixed(1)+' mag.';
    if(hv.now){
      head=head.replace(/^✅/,'⚠️');
      head+=' Right now the air is '+hv.now.band.name.toLowerCase()+' (PSI '+Math.round(hv.now.psi)+(hv.now.rising?', rising':'')+') — check NEA’s forecast on the day.';
    }
  }
  g.style.display='block';
  const ml=(window.CSKY?moonLodgeNow():null);
  g.innerHTML='<div class="gv">'+head+'</div><div class="gchips">'
    +'<span class="gc">🌇 Sunset <b>'+(st.set||'—')+'</b></span>'
    +'<span class="gc">🌌 Fully dark <b>'+(st.dark||'—')+'</b></span>'
    +'<span class="gc">🌙 Moon <b>'+pct+'% · '+(ma.alt>0?'up '+Math.round(ma.alt)+'°':'down')+'</b></span>'
    +(SEEREAD?'<span class="gc" title="Steadiness of the air at high power (planets, tight doubles) — '+SEEREAD.src+'">🌬️ Seeing <b>'+SEEREAD.label+'</b></span>':'')
    +(ml?'<span class="gc" title="The Chinese lunar mansion the Moon is in tonight">🐉 Moon lodges in <b>'+ml.zh+'宿 '+ml.en+'</b></span>':'')
    +(bp?'<span class="gc">🪐 Best planet <b>'+bp+'</b></span>':'')
    +(tt?'<span class="gc">🔭 Top target <b>'+tt+'</b></span>':'')
    +(cmt?(cmt.none?'<span class="gc" style="opacity:.75" title="No tracked comet is brighter than magnitude 11 and above the horizon — the practical visual limit for the telescopes under Jurong\'s sky. The Seestar can still image a fainter one. Details on the Comets page.">☄️ No comet in reach <span style="opacity:.8">· brightest '+cmt.name+' mag '+cmt.mag.toFixed(1)+'</span></span>'
          :'<span class="gc" title="A tracked comet is above the horizon now — full details on the Comets page">☄️ Comet <b>'+cmt.name+' · mag '+cmt.mag.toFixed(1)+'</b></span>'):'')
    +(DARK?(function(){const L=dynLimitMag();const cut=(L.moon+L.haze);return '<span class="gc" title="Estimated faintest deep-sky visible now — Bortle '+BORTLE+' base '+L.base.toFixed(1)+', minus the Moon and live haze">🔭 Limiting mag <b>~'+L.mag.toFixed(1)+'</b>'+(cut>=0.3?' <span style="opacity:.7">(−'+cut.toFixed(1)+')</span>':'')+'</span>';})():'')
    +(function(){const n=hazeNight(),c=n?hazeCostAt(60):null;if(!c)return '';
        if(c.total<0.25&&!(n.mode==='live'&&PSIVAL>50))return '';   // clean air needs no chip
        const lab=window.Haze.costLabel(c.total);
        const what=(n.mode==='live')?(typeof PSIVAL==='number'?'PSI '+Math.round(PSIVAL):Math.round(n.pm25)+' µg/m³'):'forecast';
        return '<span class="gc" title="Haze for the chosen night — '+(n.mode==='live'?'live NEA reading plus the model\'s column depth':'forecast only; the live NEA reading applies to tonight')+'. The figure is what it costs a well-placed target; anything low loses about three times as much.">🌫️ Haze <b>'+what+' · '+lab.word+'</b>'
          +(c.total>=0.25?' <span style="opacity:.7">(−'+c.total.toFixed(1)+' mag'+(c.aloft?', aloft':'')+')</span>':'')+'</span>';})()
    +(EVT.length?'<span class="gc">'+EVT[0][1]+' <b>'+EVT[0][2]+'</b></span>':'')
    +(ISSCHIP?'<span class="gc">🛰️ Best pass <b>'+ISSCHIP+'</b></span>':'')
    +'<span class="gc">🌅 Sunrise <b>'+(st.rise||'—')+'</b></span>'
    +'</div>';
}

const CAP=30;
function visualVerdict(r){const faint=(r.cls==='emission'||r.cls==='broadband');
  if(faint&&pct>=55)return['skip','Washed out (Moon)'];
  // v4.13: the limit is now worked out at THIS target's altitude. Haze costs in
  // proportion to the air you look through, so one flat figure flattered everything
  // low — exactly the targets smoke removes first. A cluster that is fine at 60° can
  // be gone at 20°, and it should say so.
  if(r.mag!=null&&r.cls!=='star'){const L=dynLimitMag(r.alt);
    if(r.mag>L.mag){
      if(L.haze>=0.8&&L.haze>=L.moon)return['skip','Lost in the haze'];
      if(faint)return['skip','Below tonight’s limit'];}}
  if(r.alt>=45)return['exc','Excellent'];
  if(r.alt>=22)return['good','Good'];return['low','Low — early'];}
function seestarVerdict(r){
  // v4.13: the dual-band filter beats the extra sky glow, but nothing recovers light
  // the smoke scattered out of the beam — so heavy extinction still means long subs.
  {const hc=hazeCostAt(r.alt);if(hc&&hc.ext>=2.0&&r.cls!=='star')return['low','Dimmed by haze'];}
  if(r.cls==='emission'){if(r.sep<12)return['low','Moon too close'];if(r.alt>=30)return['exc','Great — dual-band'];
    if(r.alt>=18)return['good','Later (dual-band)'];return['low','Too low now'];}
  if(r.cls==='broadband'){if(pct>=55)return['skip','Dark week'];if(r.sep<40)return['low','Near Moon'];
    if(r.alt>=30)return['good','Dark week'];return['low','Low/faint'];}
  if(r.alt>=30)return['exc','Easy'];if(r.alt>=18)return['good','Good'];return['low','Low'];}
function renderTargets(){
  const mode=currentMode;
  let rows=CAT.map(t=>{const{alt,az}=altaz(t[3],t[4]);return{name:t[0],type:t[1],con:t[2],alt,az,sep:moonSep(t[3],t[4]),cls:t[5],mag:t[6],ra:t[3],dec:t[4]};}).filter(r=>r.alt>12 && DARK);
  // v3.15: live comets currently up (computed from orbital elements in astro-core)
  if(GL && DARK && window.Astro && window.Astro.activeComets){
    const cs=new Date(Date.UTC(GL.y,GL.m,GL.d,GL.hh-8,GL.mm,0));
    window.Astro.activeComets(cs).forEach(cm=>{const ce=window.Astro.cometEq(cm,cs);const aa=altaz(ce.ra,ce.dec);
      if(aa.alt>12)rows.push({name:cm.name,type:'Comet',con:'binoc/scope',alt:aa.alt,az:aa.az,sep:moonSep(ce.ra,ce.dec),cls:'comet',mag:cm.mag,ra:ce.ra,dec:ce.dec});});
  }
  if(mode==='seestar')rows=rows.filter(r=>r.cls!=='star');
  const RANK={exc:0,good:1,low:2,skip:3};
  rows.forEach(r=>{if(r.cls==='comet'){r._cls=r.alt>=30?'good':'low';r._v=(r.mag!=null&&r.mag>10.5)?'Faint — big scope':(r.alt>=30?'Binoc/scope':'Low — later');return;}const v=(mode==='seestar'?seestarVerdict(r):visualVerdict(r));r._cls=v[0];r._v=v[1];});
  rows.sort((a,b)=>(RANK[a._cls]-RANK[b._cls])||((a.mag==null?99:a.mag)-(b.mag==null?99:b.mag))||(b.alt-a.alt));
  const total=rows.length;
  // v4.13: haze-lost targets rank last, so on a smoky night most of them fall off the end
  // of the list. Count them first, so the hint can say how much of the sky the smoke took.
  const lostHaze=rows.filter(r=>r._v==='Lost in the haze'||r._v==='Dimmed by haze').length;
  rows=rows.slice(0,CAP);
  const c=document.getElementById('targets');c.innerHTML='';
  const wS=GL?Math.max(darkStartMin(GL.y,GL.m,GL.d),19*60):20*60,wE=23*60;
  const COLLAPSE=5;const showN=(TARGEXP||rows.length<=COLLAPSE)?rows.length:COLLAPSE;
  rows.slice(0,showN).forEach(r=>{const cls=r._cls,verdict=r._v;
    const w=GL?targetWindow(r.ra,r.dec,wS,wE):null;
    const wtxt=w?(w.none?'low all session ('+Math.round(w.bmax)+'° max)':'up '+fmtMin(w.from)+'–'+fmtMin(w.to)+' · best '+fmtMin(w.best)):'';
    const el=document.createElement('div');el.className='tcard';
    let bar='';
    if(w){const span=(wE-wS)||1,pct=v=>(Math.max(0,Math.min(1,(v-wS)/span))*100).toFixed(1);
      bar=`<div class="tbar" title="${w.none?('Stays low — peaks '+Math.round(w.bmax)+'° tonight'):('Above 25° '+wtxt)}">`
        +(w.none?'':`<span class="tbar-fill" style="left:${pct(w.from)}%;right:${(100-pct(w.to)).toFixed(1)}%"></span>`)
        +`<span class="tbar-best" style="left:${pct(w.best)}%"></span>`
        +`<span class="tbar-lbl" style="left:0">${fmtMin(wS)}</span>`
        +`<span class="tbar-lbl tbar-r">${fmtMin(wE)}</span>`
        +`<span class="tbar-lbl tbar-b" style="left:${pct(w.best)}%">▲${fmtMin(w.best)}</span></div>`;}
    el.innerHTML=`<div class="trow1"><div><div class="tname"><span class="hov" data-type="${r.type}" data-name="${r.name}">${r.name}</span></div><div class="tsub">${r.type} · ${r.con}</div></div><span class="tag hov ${cls}" data-verdict="${verdict}">${verdict}</span></div>`+
      `<div class="chips"><span class="chip">⬆ <b>${Math.round(r.alt)}°</b></span><span class="chip">${compass(r.az)}</span><span class="chip">mag <b>${r.mag==null?'—':r.mag}</b></span><span class="chip">Moon <b>${Math.round(r.sep)}°</b></span></div>`+bar;
    el.style.cursor='pointer';el.title='Tap to locate “'+r.name+'” on the sky map';
    el.addEventListener('click',function(){locateObj(r.name,(r.cls==='star'?'star':'dso'),r.ra,r.dec);});
    c.appendChild(el);});
  if(rows.length===0)c.innerHTML='<div class="tsub">'+(DARK?'No catalogued targets above 12° at this time.':'Sky is not dark yet — deep-sky objects become visible once the Sun is well below the horizon. Pick a later evening time.')+'</div>';
  else if(rows.length>COLLAPSE){const mb=document.createElement('button');mb.className='morebtn';
    mb.textContent=TARGEXP?('▴ Show fewer — top '+COLLAPSE+' only'):('▾ Show all '+rows.length+' targets ('+(rows.length-COLLAPSE)+' more)');
    mb.addEventListener('click',()=>{TARGEXP=!TARGEXP;try{localStorage.setItem('scobTargExpand',TARGEXP?'1':'0');}catch(e){}renderTargets();});
    c.appendChild(mb);}
  const shownNote=`Showing ${showN} of ${total} above 12°, ranked easiest-to-hardest`+((!TARGEXP&&rows.length>COLLAPSE)?' — tap “Show all” for the rest.':'.');
  document.getElementById('hint').innerHTML=(mode==='seestar')
    ?`📷 <b style="color:var(--cyan)">Seestar S30 Pro</b> · 2 h of 30 s subs. Emission & planetary nebulae score as imageable through the dual-band Hα/OIII filter even under this ${pct}% Moon; galaxies stay Moon-limited; single stars hidden. Moon = distance from the Moon. ${shownNote}${lostHaze?` 🌫️ <b style="color:var(--red)">${lostHaze}</b> are heavily dimmed by haze — the dual-band filter beats the glow, not the extinction.`:''}`
    :`👁 <b style="color:var(--gold)">Visual</b> · eyepiece views. Faint nebulae & galaxies flagged washed-out when the Moon is &gt;55% lit. Moon = distance from the Moon. ${shownNote}${lostHaze?` 🌫️ <b style="color:var(--red)">${lostHaze} of the ${total}</b> are lost in the haze for this night — each is judged at its own altitude, and low ones go first.`:''}`;}

// ==== v3.3: Jupiter/Saturn eyepiece detail · double & carbon stars · conjunctions · rain radar ====
function angSep(ra1,dec1,ra2,dec2){const a=Math.sin(dec1*RAD)*Math.sin(dec2*RAD)+Math.cos(dec1*RAD)*Math.cos(dec2*RAD)*Math.cos((ra1-ra2)*RAD);return Math.acos(Math.max(-1,Math.min(1,a)))*DEG;}
function jovePhys(dt){ // Meeus, Astronomical Algorithms ch. 43/44 low-accuracy physical ephemeris
  const d=jd(dt)-2451545.0;
  const V=rev(172.74+0.00111588*d),M=rev(357.529+0.9856003*d);
  const N=rev(20.020+0.0830853*d+0.329*Math.sin(V*RAD));
  const J2=rev(66.115+0.9025179*d-0.329*Math.sin(V*RAD));
  const A=1.915*Math.sin(M*RAD)+0.020*Math.sin(2*M*RAD);
  const B=5.555*Math.sin(N*RAD)+0.168*Math.sin(2*N*RAD);
  const K=J2+A-B;
  const Re=1.00014-0.01671*Math.cos(M*RAD)-0.00014*Math.cos(2*M*RAD);
  const rj=5.20872-0.25208*Math.cos(N*RAD)-0.00611*Math.cos(2*N*RAD);
  const Dj=Math.sqrt(rj*rj+Re*Re-2*rj*Re*Math.cos(K*RAD));
  const psi=Math.asin(Math.max(-1,Math.min(1,Re/Dj*Math.sin(K*RAD))))*DEG;
  const dd=d-Dj/173;
  return{dd:dd,psi:psi,B:B,w2:rev(187.23+870.1869088*dd+psi-B)};
}
// REVIEW BY 2027-01-01: re-fit GRS System II longitude + drift to the latest JUPOS trend (the spot's drift rate wanders year to year). Also sanity-check the CelesTrak TLEs are still auto-refreshing (see satellite-pass code).
function grsLon(dt){return rev(91+1.75*((jd(dt)-2461192.5)/30.44));} // 91° System II on 1 Jun 2026 (JUPOS trend), drifting ~1.75°/month
function grsTransitTimes(){
  const out=[];if(!GL)return out;let prev=null;
  for(let min=17*60;min<=24*60;min+=2){
    const dt=new Date(Date.UTC(GL.y,GL.m,GL.d,Math.floor(min/60)-8,min%60,0));
    const diff=((grsLon(dt)-jovePhys(dt).w2+540)%360)-180;
    if(prev!==null&&prev>0&&diff<=0)out.push(timeLabel(Math.floor(min/60)%24,min%60));
    prev=diff;
  }
  return out;
}
function galilean(dt){
  const p=jovePhys(dt),dd=p.dd,corr=p.psi-p.B;
  let u1=rev(163.8069+203.4058646*dd+corr),u2=rev(358.4140+101.2916335*dd+corr),
      u3=rev(5.7176+50.2345180*dd+corr),u4=rev(224.8092+21.4879800*dd+corr);
  const G=rev(331.18+50.310482*dd),H=rev(87.45+21.569231*dd);
  u1+=0.473*Math.sin(2*(u1-u2)*RAD);u2+=1.065*Math.sin(2*(u2-u3)*RAD);
  u3+=0.165*Math.sin(G*RAD);u4+=0.843*Math.sin(H*RAD);
  const r1=5.9057-0.0244*Math.cos(2*(u1-u2)*RAD),r2=9.3966-0.0882*Math.cos(2*(u2-u3)*RAD),
        r3=14.9883-0.0216*Math.cos(G*RAD),r4=26.3627-0.1939*Math.cos(H*RAD);
  const mk=(nm,u,r)=>({nm:nm,x:r*Math.sin(u*RAD),front:Math.cos(u*RAD)<0});
  return[mk('Io',u1,r1),mk('Europa',u2,r2),mk('Ganymede',u3,r3),mk('Callisto',u4,r4)];
}
function saturnRingB(){
  const pe=planetEq(PLAN.Saturn,GL.dS,GL.sLon,GL.sR);
  const T=(GL.dS-1.5)/36525;
  const i=28.075216-0.012998*T,Om=169.508470+1.394681*T;
  const B=Math.asin(Math.max(-1,Math.min(1,Math.sin(i*RAD)*Math.cos(pe.bet*RAD)*Math.sin((pe.lam-Om)*RAD)-Math.cos(i*RAD)*Math.sin(pe.bet*RAD))))*DEG;
  return{B:B,pe:pe};
}
function renderPlanetDetail(){
  const el=document.getElementById('planetDetail');if(!el||!GL)return;
  const dt=new Date(Date.UTC(GL.y,GL.m,GL.d,GL.hh-8,GL.mm,0));
  const jp=planetEq(PLAN.Jupiter,GL.dS,GL.sLon,GL.sR),ja=altaz(jp.ra,jp.dec);
  const ms=galilean(dt),sc=5.3,W=320,cy=25;
  let svg='<svg viewBox="0 0 '+W+' 48" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:460px;margin-top:6px">'
    +'<rect width="'+W+'" height="48" rx="8" fill="#0a1430"/>'
    +'<text x="7" y="29" fill="#8ea3d8" font-size="9">E</text><text x="'+(W-13)+'" y="29" fill="#8ea3d8" font-size="9">W</text>'
    +'<line x1="18" y1="'+cy+'" x2="'+(W-18)+'" y2="'+cy+'" stroke="#22325a" stroke-width="0.6"/>'
    +'<circle cx="'+(W/2)+'" cy="'+cy+'" r="'+sc+'" fill="#e7c9a0"/><rect x="'+(W/2-sc)+'" y="'+(cy-1.8)+'" width="'+(2*sc)+'" height="1.4" fill="#b98a55"/><rect x="'+(W/2-sc)+'" y="'+(cy+0.6)+'" width="'+(2*sc)+'" height="1.2" fill="#c79b6a"/>';
  ms.forEach(function(mn){const x=W/2+mn.x*sc;
    svg+='<circle cx="'+x.toFixed(1)+'" cy="'+cy+'" r="2.2" fill="'+(Math.abs(mn.x)<1?(mn.front?'#ffd34d':'#4a5578'):'#fff')+'"/><text x="'+x.toFixed(1)+'" y="13" fill="#cdd6f0" font-size="8" text-anchor="middle">'+mn.nm[0]+'</text>';});
  svg+='</svg>';
  const tr=grsTransitTimes();
  let html='<div style="margin-top:13px;padding-top:11px;border-top:1px solid var(--line)">'
    +'<b style="color:var(--gold)">♃ Jupiter in the eyepiece</b> <span class="tsub" style="display:inline">'+(ja.alt>0?Math.round(ja.alt)+'° '+compass(ja.az)+' at '+timeLabel(GL.hh,GL.mm):'below horizon at the chosen time')+'</span>'
    +svg
    +'<div class="tsub" style="margin-top:3px">Galilean moons at the chosen time — I&nbsp;Io · E&nbsp;Europa · G&nbsp;Ganymede · C&nbsp;Callisto. Gold&nbsp;dot = crossing the disc (transit), dark&nbsp;dot = behind Jupiter. Sky view; most telescopes flip east–west.</div>'
    +'<div style="font-size:13px;margin-top:7px">🔴 <b>Great Red Spot</b>: '+(tr.length?'squarely face-on as it crosses Jupiter\'s meridian at <b>'+tr.join('</b> and <b>')+'</b> — well placed for ~50 min either side.':'no meridian crossing between 5 pm and midnight — the moons are the show tonight.')+'</div>';
  const rb=saturnRingB(),sa2=altaz(rb.pe.ra,rb.pe.dec),ab=Math.abs(rb.B);
  const rngTxt=ab<3?'nearly <b>edge-on — a razor-thin line</b> even in the 40 cm':(ab<10?'a <b>narrow ellipse</b>, reopening after the 2025 ring-plane crossing':'<b>wide open</b> — the classic showpiece view');
  html+='<div style="font-size:13px;margin-top:9px"><b style="color:var(--gold)">♄ Saturn</b> <span class="tsub" style="display:inline">'+(sa2.alt>0?Math.round(sa2.alt)+'° '+compass(sa2.az):'below horizon at the chosen time')+'</span> — rings tilted <b>'+rb.B.toFixed(1)+'°</b>: '+rngTxt+'.</div>'
    +(SEEREAD?'<div style="font-size:12.5px;margin-top:8px">🌬️ <b>Seeing '+SEEREAD.label+'</b>'+(SEEREAD.arc?' ('+SEEREAD.arc+')':'')+' — '+(/(poor|fair)/i.test(SEEREAD.label)?'the GRS, Jupiter&rsquo;s belts and the Cassini division will soften and shimmer; catch them in the steady moments and don&rsquo;t over-magnify.':'steady air — push magnification for the GRS, the belts and the Cassini division.')+' <span class="tsub" style="display:inline">('+SEEREAD.src+')</span></div>':'')
    +'<div class="tsub" style="margin-top:7px;margin-bottom:0">Computed on-device (Meeus low-precision series). GRS longitude assumed '+Math.round(grsLon(dt))+'° System II (JUPOS trend) — it drifts, so treat times as ±15 min.</div></div>';
  el.innerHTML=html;
}
const DBL=[
 ["Albireo","Double star","Cygnus",292.68,27.96,"3.1 + 5.1","35″","Gold & sapphire — the classic colour-contrast pair"],
 ["Epsilon Lyrae","Double-double","Lyra",281.08,39.67,"5.0 + 5.2","2.3″ pairs","Two tight pairs in one field — splits at high power in the 40 cm"],
 ["Mizar & Alcor","Double star","Ursa Major",200.98,54.93,"2.3 + 4.0","14″ (+12′)","Naked-eye pair; Mizar itself splits in any scope"],
 ["Alpha Centauri","Double star","Centaurus",219.90,-60.83,"0.0 + 1.3","~7″","Nearest star system — brilliant twin suns"],
 ["Acrux","Double star","Crux",186.65,-63.10,"1.3 + 1.8","4″","Foot of the Southern Cross — two blue-white diamonds"],
 ["Antares","Double star","Scorpius",247.35,-26.43,"1.0 + 5.4","2.6″","Red supergiant with a green-tinged companion — a 40 cm challenge"],
 ["Graffias (β Sco)","Double star","Scorpius",241.36,-19.81,"2.6 + 4.9","13.7″","Bright, easy pair near Antares"],
 ["Porrima (γ Vir)","Double star","Virgo",190.42,-1.45,"3.5 + 3.5","3.5″","Perfectly matched twins, slowly widening"],
 ["Castor","Double star","Gemini",113.65,31.89,"1.9 + 3.0","5.5″","Sextuple system; crisp A–B pair in a scope"],
 ["Rigel","Double star","Orion",78.63,-8.20,"0.1 + 6.8","9.5″","Blazing supergiant with a shy companion in its glare"],
 ["Almach (γ And)","Double star","Andromeda",30.97,42.33,"2.3 + 5.0","9.6″","Gold & blue — rivals Albireo"],
 ["Gamma Delphini","Double star","Delphinus",311.66,16.12,"4.3 + 5.1","9″","Golden pair at the dolphin's nose"],
 ["Beta Monocerotis","Triple star","Monoceros",97.20,-7.03,"4.6+5.0+5.4","7″","Stunning triple — Herschel called it one of the finest in the sky"],
 ["La Superba (Y CVn)","Carbon star","Canes Venatici",191.28,45.44,"~5.2 var","—","One of the reddest stars visible — deep ruby"],
 ["Hind's Crimson Star (R Lep)","Carbon star","Lepus",74.98,-14.81,"5.5–11.7 var","—","Glows like a drop of blood, best near maximum"],
 ["TX Piscium","Carbon star","Pisces",356.61,3.49,"~5.0 var","—","Bright orange-red carbon star"],
 ["V Aquilae","Carbon star","Aquila",286.10,-5.68,"6.6–8.1 var","—","Deep-red ember in the Milky Way"],
 ["DY Crucis","Carbon star","Crux",191.83,-59.71,"8.5–9.8 var","—","Ruby spark right beside Mimosa — a 40 cm treat"]
];
function renderDoubles(){
  const c=document.getElementById('doubles');if(!c)return;
  if(!DARK){c.innerHTML='<div class="tsub">Sky not dark yet — pick an evening time.</div>';return;}
  const rows=DBL.map(function(t){const a=altaz(t[3],t[4]);return{name:t[0],type:t[1],con:t[2],alt:a.alt,az:a.az,mags:t[5],sep:t[6],note:t[7],ra:t[3],dec:t[4]};}).filter(function(r){return r.alt>10;}).sort(function(a2,b2){return b2.alt-a2.alt;});
  if(!rows.length){c.innerHTML='<div class="tsub">None of the catalogued pairs are above 10° at this time.</div>';return;}
  const COLLAPSE=5;const showN=(DBLEXP||rows.length<=COLLAPSE)?rows.length:COLLAPSE;
  let html=rows.slice(0,showN).map(function(r){
    const cls=r.alt>=40?'exc':(r.alt>=20?'good':'low');
    const v=r.alt>=40?'Prime':(r.alt>=20?'Good':'Low');
    const carbon=/Carbon/.test(r.type);
    return '<div class="tcard" data-nm="'+r.name+'" data-ra="'+r.ra+'" data-dec="'+r.dec+'" style="cursor:pointer" title="Tap to locate on the sky map"><div class="trow1"><div><div class="tname">'+(carbon?'🔴 ':'✨ ')+r.name+'</div><div class="tsub">'+r.type+' · '+r.con+' — '+r.note+'</div></div><span class="tag '+cls+'">'+v+'</span></div>'
      +'<div class="chips"><span class="chip">⬆ <b>'+Math.round(r.alt)+'°</b></span><span class="chip">'+compass(r.az)+'</span><span class="chip">mags <b>'+r.mags+'</b></span>'+(r.sep!=='—'?'<span class="chip">sep <b>'+r.sep+'</b></span>':'')+'</div></div>';
  }).join('');
  if(rows.length>COLLAPSE)html+='<button type="button" class="morebtn" id="dblMore">'+(DBLEXP?'▴ Show fewer — top '+COLLAPSE+' only':'▾ Show all '+rows.length+' pairs ('+(rows.length-COLLAPSE)+' more)')+'</button>';
  c.innerHTML=html;
  const mb=document.getElementById('dblMore');if(mb)mb.addEventListener('click',function(){DBLEXP=!DBLEXP;try{localStorage.setItem('scobDblExpand',DBLEXP?'1':'0');}catch(e){}renderDoubles();});
}
function findConjunctions(){
  const out=[];if(!GL)return out;
  const P5=['Venus','Jupiter','Saturn','Mars','Mercury'];
  for(let dd2=0;dd2<=21;dd2++){
    const dt=new Date(Date.UTC(GL.y,GL.m,GL.d+dd2,20-8,30,0));
    const J=jd(dt),dS=J-2451543.5,lstv=rev(280.46061837+360.98564736629*(J-2451545.0)+LON);
    const aa=function(ra,dec){const H=(lstv-ra)*RAD,dr=dec*RAD,l=LAT*RAD;return Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;};
    // v4.15: the Moon as seen from SCOB, not from Earth's centre — parallax shifts it by
    // up to a degree, which is the size of the separations this list reports.
    const s=sun(dS),mo=moon(dS),meq=(window.Astro&&window.Astro.moonTopo)?window.Astro.moonTopo(dt):eclToEq(mo.lon,mo.lat,dS),malt=aa(meq.ra,meq.dec);
    const bodies={};
    P5.forEach(function(nm){const pe=planetEq(PLAN[nm],dS,s.lon,s.r);bodies[nm]={ra:pe.ra,dec:pe.dec,alt:aa(pe.ra,pe.dec)};});
    P5.forEach(function(nm){const b=bodies[nm],sp=angSep(meq.ra,meq.dec,b.ra,b.dec);
      if(sp<5&&malt>0&&b.alt>5)out.push({dd:dd2,pair:'Moon–'+nm,sep:sp,ic:'🌙'});});
    for(let i2=0;i2<P5.length;i2++)for(let j3=i2+1;j3<P5.length;j3++){
      const A=bodies[P5[i2]],B2=bodies[P5[j3]],sp=angSep(A.ra,A.dec,B2.ra,B2.dec);
      if(sp<2.5&&A.alt>5&&B2.alt>5)out.push({dd:dd2,pair:P5[i2]+'–'+P5[j3],sep:sp,ic:'🪐'});}
  }
  const best={};out.forEach(function(c2){const k=c2.pair;if(!best[k]||c2.sep<best[k].sep)best[k]=c2;});
  return Object.keys(best).map(function(k){return best[k];}).sort(function(a2,b2){return a2.dd-b2.dd;});
}
function renderConj(){
  const el=document.getElementById('conj');if(!el||!GL)return;
  const cs=findConjunctions();
  if(!cs.length){el.innerHTML='';return;}
  el.innerHTML=cs.map(function(c2){
    const dt=new Date(Date.UTC(GL.y,GL.m,GL.d+c2.dd,12));
    const when=c2.dd===0?'chosen night':dateLabel(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate())+' · in '+c2.dd+' day'+(c2.dd>1?'s':'');
    return '<div class="evrow"><span class="evic">'+c2.ic+'</span><div><b>'+c2.pair+' — just '+c2.sep.toFixed(1)+'° apart</b> <span class="evwhen">'+when+'</span><div class="evnote">Close pairing in the 8:30 pm sky — a lovely naked-eye / wide-field sight'+(c2.pair.indexOf('Moon')===0?' (Moon position geocentric; allow up to ~1° shift)':'')+'.</div></div></div>';
  }).join('')+'<div class="tsub" style="margin:2px 0 10px">↑ Pairings computed on-device for 8:30 pm each evening, next 3 weeks.</div>';
  const tonight=cs.filter(function(c2){return c2.dd===0;})[0];
  if(tonight)EVT.unshift(['','✨',tonight.pair+' '+tonight.sep.toFixed(1)+'° apart','',1]);
}
let NCAT=0;
async function loadNowcast(){
  const el=document.getElementById('nowcast');if(!el)return;
  if(Date.now()-NCAT<10*60000)return;
  try{
    const r=await fetch('https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',{cache:'no-store'});
    const j=await r.json();const it=j.items&&j.items[0];if(!it)throw 0;
    const fc=(it.forecasts||[]);
    const f=fc.find(x=>x.area==='Jurong East')||fc.find(x=>x.area==='Jurong West')||fc.find(x=>x.area==='Clementi');
    if(!f)throw 0;
    NCAT=Date.now();
    const vp=it.valid_period||{};
    const t=x=>{const d2=new Date(x);const h=d2.getHours(),mi=d2.getMinutes();return (h%12||12)+':'+pad(mi)+(h<12?'am':'pm');};
    const bad=/rain|shower|thunder/i.test(f.forecast);
    el.style.display='block';
    el.innerHTML='📡 <b>MSS 2-hr Nowcast ('+f.area+'):</b> <b class="'+(bad?'bad':'ok')+'">'+f.forecast+'</b>'+(vp.start?' <span style="opacity:.75">valid '+t(vp.start)+'–'+t(vp.end)+' · live now, not the chosen date</span>':'');
  }catch(e){}
}
let RADAT=0;
function loadRadar(){
  const el=document.getElementById('radar');if(!el)return;
  if(Date.now()-RADAT<5*60000)return;RADAT=Date.now();
  let tries=0;
  const attempt=function(){
    if(tries>5){el.style.display='block';el.innerHTML='<div class="wxsrc">Rain radar unavailable right now — <a href="https://www.weather.gov.sg/weather-rain-area-50km/" target="_blank" rel="noopener" style="color:var(--cyan)">open it on weather.gov.sg ↗</a></div>';return;}
    const t=new Date(Math.floor((Date.now()+8*3600000-(tries*5+2)*60000)/300000)*300000);tries++;
    const stamp=''+t.getUTCFullYear()+pad(t.getUTCMonth()+1)+pad(t.getUTCDate())+pad(t.getUTCHours())+pad(t.getUTCMinutes());
    const img=new Image();
    img.onload=function(){
      el.style.display='block';
      el.innerHTML='<div style="border-radius:10px;overflow:hidden;margin-top:11px;background:#0b1526 url(https://www.weather.gov.sg/wp-content/themes/wiptheme/assets/img/base-853.png) center/cover no-repeat">'
        +'<img src="'+img.src+'" alt="MSS rain radar" style="width:100%;display:block">'
        +'</div><div class="wxsrc">🛰️ MSS 50-km rain radar · '+timeLabel(t.getUTCHours(),t.getUTCMinutes())+' SGT — live now, so it applies to tonight, not future dates. <a href="https://www.weather.gov.sg/weather-rain-area-50km/" target="_blank" rel="noopener" style="color:var(--cyan)">animated loop ↗</a></div>';
    };
    img.onerror=attempt;
    img.src='https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_'+stamp+'0000dBR.dpsri.png';
  };
  attempt();
}

let ALLSKYAT=0;
function loadAllSky(){
  if(!ALLSKY_CAM)return;                 // no camera configured → tile stays hidden, no change to the site
  const el=document.getElementById('allsky');if(!el)return;
  const sep=ALLSKY_CAM.indexOf('?')>=0?'&':'?';
  const url=ALLSKY_CAM+sep+'_t='+Date.now();
  const img=new Image();
  img.onload=function(){el.style.display='block';
    el.innerHTML='<div style="border-radius:10px;overflow:hidden;margin-top:11px"><img src="'+url+'" alt="Observatory all-sky camera" style="width:100%;display:block"></div>'
      +'<div class="wxsrc">📷 Observatory all-sky camera · live now — the true on-the-night view of cloud &amp; haze overhead.</div>';
    ALLSKYAT=Date.now();};
  img.onerror=function(){el.style.display='block';el.innerHTML='<div class="wxsrc">All-sky camera image unavailable right now.</div>';ALLSKYAT=Date.now();};
  img.src=url;
}

function moonRiseSet(y,m,d){
  const H0=0.125,startMs=Date.UTC(y,m,d,0,0,0)-8*3600000,step=5*60000,span=24*3600000;
  let prev=moonAltAt(new Date(startMs))-H0,rise=null,set=null;
  function toSGT(ms){const dt=new Date(ms+8*3600000);let h=dt.getUTCHours(),mi=dt.getUTCMinutes();const ap=h<12?'am':'pm';let h12=h%12||12;return h12+':'+pad(mi)+ap;}
  function refine(a,b,r){for(let k=0;k<22;k++){const mid=(a+b)/2,v=moonAltAt(new Date(mid))-H0;if((v>=0)===r)b=mid;else a=mid;}return toSGT((a+b)/2);}
  for(let t=step;t<=span;t+=step){const cur=moonAltAt(new Date(startMs+t))-H0;
    if(prev<0&&cur>=0&&rise===null)rise=refine(startMs+t-step,startMs+t,true);
    if(prev>=0&&cur<0&&set===null)set=refine(startMs+t-step,startMs+t,false);prev=cur;}
  return{rise,set};}

function renderSolar(dS,sunLon,sunR,sunAlt){
  const c=document.getElementById('solar');c.innerHTML='';
  function row(sym,name,alt,az,magStr,cls,status){
    const dir=alt>0?compass(az):'—';const av=alt>0?Math.round(alt)+'° '+dir:'— ';
    const el=document.createElement('div');el.className='srow';
    el.innerHTML=`<span class="snm"><span class="sym">${sym}</span><span class="hov" data-planet="${name}">${name}</span></span><span class="sval">${av}</span><span class="smag">${magStr}</span><span class="tag hov ${cls}" data-verdict="${status}">${status}</span>`;
    el.style.cursor='pointer';el.title='Tap to locate '+name+' on the sky map';
    el.addEventListener('click',function(){locateObj(name,name==='Moon'?'moon':(name==='Sun'?'sun':'planet'));});
    c.appendChild(el);}
  function st(alt,mag){if(alt<0)return['below','below'];if(sunAlt>0)return['low','daytime'];if(sunAlt>-6)return['low','twilight'];
    if(mag>6.0)return['good','scope'];if(mag>4.0)return['good','binoculars'];return['exc','naked eye'];}
  row('☉','Sun',sunAlt,180,'—',sunAlt>0?'low':'below',sunAlt>0?'daytime':(sunAlt>-18?'twilight':'dark sky'));
  const ma=altaz(MOONEQ.ra,MOONEQ.dec);
  row('☾','Moon',ma.alt,ma.az,'—',ma.alt<0?'below':(pct>=60?'low':'exc'),ma.alt<0?'below':pct+'% lit');
  for(const nm of Object.keys(PLAN)){const pe=planetEq(PLAN[nm],dS,sunLon,sunR);const aa=altaz(pe.ra,pe.dec);
    const [cls,status]=st(aa.alt,pe.mag);row(PLAN[nm].sym,nm,aa.alt,aa.az,(pe.mag>=0?'+':'')+pe.mag.toFixed(1),cls,status);}
  document.getElementById('ssNote').innerHTML='Positions for Singapore at the chosen date & time. Planets are only realistically visible once the Sun is well down (dark sky); Uranus & Neptune always need optics. Magnitudes approximate.';
}

const PCOL={Mercury:'#b9b3a7',Venus:'#f3ead0',Mars:'#d9663b',Jupiter:'#e7c9a0',Saturn:'#e9d9a8',Uranus:'#a7e6e6',Neptune:'#5b7bdc'};
function renderSkyMap(dS,sunLon,sunR){
  const R=132;const proj=(alt,az)=>[150-R*(90-alt)/90*Math.sin(az*RAD),150-R*(90-alt)/90*Math.cos(az*RAD)];
  const mk=(x,y,vis,data)=>'<g class="hov" '+data+'><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="11" fill="transparent" pointer-events="all"></circle>'+vis+'</g>';
  let s='<circle cx="150" cy="150" r="132" fill="#08101f" stroke="#33406b"/>';
  [30,60].forEach(a=>{s+='<circle cx="150" cy="150" r="'+(R*(90-a)/90).toFixed(0)+'" fill="none" stroke="#22325a" stroke-dasharray="2 3"/>';});
  [['N',0],['E',90],['S',180],['W',270]].forEach(c=>{const p=proj(-5,c[1]);s+='<text x="'+p[0].toFixed(0)+'" y="'+(p[1]+4).toFixed(0)+'" fill="#f5c542" font-size="12" font-weight="bold" text-anchor="middle">'+c[0]+'</text>';});
  if(DARK&&CONSTSHOW){ // faint Milky Way band along the galactic equator
    let mw='',prev=null;
    MW_POINTS.forEach(pt=>{const a=altaz(pt[0],pt[1]);if(a.alt>0){const p=proj(a.alt,a.az);
      if(prev){const dx=p[0]-prev[0],dy=p[1]-prev[1];if(dx*dx+dy*dy<2500)mw+='<line x1="'+prev[0].toFixed(1)+'" y1="'+prev[1].toFixed(1)+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'"/>';}
      prev=p;}else prev=null;});
    if(mw)s+='<g stroke="#aab8ff" stroke-width="13" stroke-linecap="round" opacity="0.09">'+mw+'</g>';
  }
  let cg='';
  if(DARK&&CONSTSHOW)CONST.forEach(c=>{const pts=c[1].map(st=>{const a=altaz(st[0],st[1]);return{al:a.alt,p:proj(a.alt,a.az),nm:st[2]};});
    c[2].forEach(g=>{const A=pts[g[0]],B=pts[g[1]];if(A.al>0&&B.al>0)cg+='<line x1="'+A.p[0].toFixed(1)+'" y1="'+A.p[1].toFixed(1)+'" x2="'+B.p[0].toFixed(1)+'" y2="'+B.p[1].toFixed(1)+'" stroke="#8ea3d8" stroke-width="0.7"/>';});
    pts.forEach(q=>{if(q.al>0&&q.nm)cg+=mk(q.p[0],q.p[1],'<circle cx="'+q.p[0].toFixed(1)+'" cy="'+q.p[1].toFixed(1)+'" r="1.8" fill="#e8eeff"></circle>','data-type="Star" data-name="'+q.nm+'"');});
    const up=pts.filter(q=>q.al>3);if(up.length>=2){const cx=up.reduce((a,q)=>a+q.p[0],0)/up.length,cy=up.reduce((a,q)=>a+q.p[1],0)/up.length;
      // Tap the name to open its myth + 3D depth view (constellation-story.html).
      cg+='<a class="clink" href="constellation-story.html?c='+encodeURIComponent(c[0])+'" aria-label="Read the story of '+c[0]+'">'
        +'<rect x="'+(cx-32).toFixed(0)+'" y="'+(cy-10).toFixed(0)+'" width="64" height="15" fill="transparent" pointer-events="all"></rect>'
        +'<text x="'+cx.toFixed(0)+'" y="'+cy.toFixed(0)+'" fill="#f5c542" font-size="9" font-style="italic" text-anchor="middle">'+c[0]+'</text></a>';}});
  s+='<g class="cons">'+cg+'</g>';
  if(DARK)CAT.forEach(t=>{const a=altaz(t[3],t[4]);if(a.alt>8){const p=proj(a.alt,a.az);
    const vis=(t[5]==='star')?'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.3" fill="#eaf0ff"></circle>':'<rect x="'+(p[0]-2).toFixed(1)+'" y="'+(p[1]-2).toFixed(1)+'" width="4" height="4" fill="#5bd6e0" opacity="0.8"></rect>';
    s+=mk(p[0],p[1],vis,'data-type="'+t[1]+'" data-name="'+t[0]+'"');}});
  for(const nm of Object.keys(PLAN)){const pe=planetEq(PLAN[nm],dS,sunLon,sunR);const a=altaz(pe.ra,pe.dec);if(a.alt>3){const p=proj(a.alt,a.az);
    const vis='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.6" fill="'+PCOL[nm]+'"></circle><text x="'+(p[0]+5).toFixed(1)+'" y="'+(p[1]+3).toFixed(1)+'" fill="'+PCOL[nm]+'" font-size="10">'+PLAN[nm].sym+'</text>';
    s+=mk(p[0],p[1],vis,'data-planet="'+nm+'"');}}
  const ma=altaz(MOONEQ.ra,MOONEQ.dec);if(ma.alt>0){const p=proj(ma.alt,ma.az);s+=mk(p[0],p[1],'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="6" fill="#f5c542"></circle>','data-planet="Moon"');}
  const se=eclToEq(sunLon,0,dS);const saz=altaz(se.ra,se.dec);if(saz.alt>0){const p=proj(saz.alt,saz.az);s+=mk(p[0],p[1],'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="8" fill="#ffd34d" stroke="#ffb300" stroke-width="1.5"></circle>','data-planet="Sun"');}
  if(HILITE){const dsoKind=(HILITE.kind==='dso'||HILITE.kind==='star');if(!dsoKind||DARK){const ha=hiliteAltAz(HILITE,dS,sunLon,sunR);const minA=dsoKind?8:(HILITE.kind==='moon'?0:3);if(ha&&ha.alt>minA){const hp=proj(ha.alt,ha.az);
    s+='<circle cx="'+hp[0].toFixed(1)+'" cy="'+hp[1].toFixed(1)+'" r="9" fill="none" stroke="#f5c542" stroke-width="2"><animate attributeName="r" values="7;13;7" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.35;1" dur="1.5s" repeatCount="indefinite"/></circle>'
      +'<text x="'+hp[0].toFixed(1)+'" y="'+(hp[1]-13).toFixed(1)+'" fill="#f5c542" font-size="9" font-weight="bold" text-anchor="middle" paint-order="stroke" stroke="#08101f" stroke-width="2.5">'+HILITE.name+'</text>';}}}
  if(SATSHOW&&SATTRACKS&&SATTRACKS.length){SATTRACKS.forEach(function(tr){if(!tr.pts||tr.pts.length<2)return;
    const pl=tr.pts.map(function(q){const p=proj(q.alt,q.az);return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
    const col=tr.vis?'#5bd6e0':'#7f8bb0';
    s+='<polyline points="'+pl+'" fill="none" stroke="'+col+'" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.85"/>';
    const md=tr.pts[Math.floor(tr.pts.length/2)];const mp=proj(md.alt,md.az);
    s+='<text x="'+mp[0].toFixed(1)+'" y="'+(mp[1]-3).toFixed(1)+'" fill="'+col+'" font-size="7" text-anchor="middle" paint-order="stroke" stroke="#08101f" stroke-width="2">'+tr.nm+' '+tr.t+'</text>';});}
  if(DARK&&METEOR){const a=altaz(METEOR.r.ra,METEOR.r.dec);if(a.alt>0){const p=proj(a.alt,a.az);const rate=Math.max(1,Math.round(METEOR.r.zhr*Math.sin(a.alt*RAD)));
    for(var mr=0;mr<8;mr++){var ang=mr*45*RAD;s+='<line x1="'+(p[0]+Math.cos(ang)*3).toFixed(1)+'" y1="'+(p[1]+Math.sin(ang)*3).toFixed(1)+'" x2="'+(p[0]+Math.cos(ang)*7.5).toFixed(1)+'" y2="'+(p[1]+Math.sin(ang)*7.5).toFixed(1)+'" stroke="#ff8a5c" stroke-width="0.8"/>';}
    s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.5" fill="#ff8a5c"/>';
    s+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]-10).toFixed(1)+'" fill="#ff8a5c" font-size="7.5" text-anchor="middle" paint-order="stroke" stroke="#08101f" stroke-width="2">☄ '+METEOR.r.n+' ~'+rate+'/hr</text>';}}
  document.getElementById('skymap').innerHTML='<svg viewBox="0 0 300 300" role="img" aria-label="All-sky star map, north at top, east to the left" xmlns="http://www.w3.org/2000/svg">'+s+'</svg>';
}
function hiliteAltAz(h,dS,sunLon,sunR){if(!h)return null;
  if(h.kind==='planet'){const pe=planetEq(PLAN[h.name],dS,sunLon,sunR);return altaz(pe.ra,pe.dec);}
  if(h.kind==='moon')return altaz(MOONEQ.ra,MOONEQ.dec);
  if(h.kind==='sun'){const se=eclToEq(sunLon,0,dS);return altaz(se.ra,se.dec);}
  return altaz(h.ra,h.dec);}
function showLocateNote(name,kind,alt,az){const el=document.getElementById('locateNote');if(!el)return;el.style.display='block';
  const dsoKind=(kind==='dso'||kind==='star');const minA=dsoKind?8:(kind==='moon'?0:3);
  if(alt>minA)el.innerHTML='📍 <b>'+name+'</b> — pulsing gold ring on the map · '+Math.round(alt)+'° up in the '+compass(az)+'. Tap again to clear.';
  else if(dsoKind&&!DARK)el.innerHTML='📍 <b>'+name+'</b> — the sky isn’t dark yet, so deep-sky objects aren’t plotted. Pick a later evening time.';
  else el.innerHTML='📍 <b>'+name+'</b> is below the map right now ('+Math.round(alt)+'°). Try a later time.';}
function locateObj(name,kind,ra,dec){
  const same=HILITE&&HILITE.name===name&&HILITE.kind===kind;
  HILITE=same?null:{name:name,kind:kind,ra:ra,dec:dec};
  if(GL)renderSkyMap(GL.dS,GL.sLon,GL.sR);
  const note=document.getElementById('locateNote');
  if(!HILITE){if(note)note.style.display='none';return;}
  const a=hiliteAltAz(HILITE,GL?GL.dS:0,GL?GL.sLon:0,GL?GL.sR:0);
  showLocateNote(name,kind,a?a.alt:-99,a?a.az:0);
  const map=document.getElementById('skymap');if(map&&map.scrollIntoView)map.scrollIntoView({behavior:'smooth',block:'center'});}
function recompute(y,m,d,hh,mm){
  const sessUTC=new Date(Date.UTC(y,m,d,hh-8,mm,0));
  startUTC=sessUTC.getTime();
  const JD=jd(sessUTC),d2000=JD-2451545.0,dS=JD-2451543.5;
  LST=rev(280.46061837+360.98564736629*d2000+LON);
  const mo=moon(dS);
  const elong=Math.acos(Math.cos((mo.slon-mo.lon)*RAD)*Math.cos(mo.lat*RAD))*DEG;
  illum=(1-Math.cos(elong*RAD))/2;pct=Math.round(illum*100);waxing=rev(mo.lon-mo.slon)<180;
  MOONEQ=eclToEq(mo.lon,mo.lat,dS);const maa=altaz(MOONEQ.ra,MOONEQ.dec);MOONALT=maa.alt;
  document.getElementById('moonPct').textContent=pct+"%";
  function phaseName(ill,wax){if(ill<0.03)return"New Moon";if(ill>0.97)return"Full Moon";
    if(ill<0.47)return(wax?"Waxing":"Waning")+" Crescent";if(ill<0.53)return(wax?"First":"Last")+" Quarter";
    return(wax?"Waxing":"Waning")+" Gibbous";}
  document.getElementById('moonName').textContent=phaseName(illum,waxing);
  const sh=document.getElementById('moonshadow');sh.style.left='';sh.style.right='';
  if(waxing)sh.style.left="0";else sh.style.right="0";sh.style.width=((IS_MOBILE?64:78)*(1-illum))+"px";
  const mn=document.getElementById('moonNote');
  if(pct>=60)mn.innerHTML=`Bright Moon — washes out faint nebulae visually. Favour the Moon, doubles & bright clusters. ${maa.alt>0?`Up ${Math.round(maa.alt)}° in the ${compass(maa.az)}.`:"Below horizon now."} <span class="pill warn">faint washed out</span>`;
  else if(pct>=30)mn.textContent=`Moderate moonlight — clusters & doubles fine; faintest nebulae struggle. ${maa.alt>0?`Up ${Math.round(maa.alt)}° in the ${compass(maa.az)}.`:"Below horizon now."}`;
  else mn.innerHTML=`Dark sky — great for faint deep-sky. ${maa.alt>0?`Thin Moon up ${Math.round(maa.alt)}°.`:"Moon down."} <span class="pill ok">great for deep-sky</span>`;
  const rs=moonRiseSet(y,m,d);
  document.getElementById('moonRS').textContent='🌗 Rises '+(rs.rise||'—')+' · Sets '+(rs.set||'—');

  const s=sun(dS);const seq=eclToEq(s.lon,0,dS);const sunAlt=altaz(seq.ra,seq.dec).alt;
  DARK=sunAlt<-6;
  METEOR=activeShower(y,m,d);
  renderSolar(dS,s.lon,s.r,sunAlt);
  renderSkyMap(dS,s.lon,s.r);
  document.getElementById('ssTime').textContent='at '+timeLabel(hh,mm);
  document.getElementById('timeSlider').value=hh*60+mm;

  let sea;
  if(m>=5&&m<=8)sea="Southwest Monsoon: warm, humid evenings (~28–31°C), 65–75% cloud, above-average rain. Heaviest showers tend to fall pre-dawn, so evenings often have usable breaks — passing showers possible.";
  else if(m===11||m<=2)sea="Northeast Monsoon: cooler, wetter; evening showers & surges can wipe out sessions — check the Nowcast closely.";
  else sea="Inter-monsoon: hot, humid, afternoon/evening thundery showers that usually clear by dusk.";
  WXNOTE=`For ${dateLabel(y,m,d)} — `+sea+" Make the final call on the night with the live Nowcast and SCOB's Facebook post.";
  document.getElementById('weatherNote').textContent=WXNOTE;

  document.getElementById('targHead').textContent=`🔭 Best deep-sky targets at ${timeLabel(hh,mm)}`;
  document.getElementById('datePick').value=`${y}-${pad(m+1)}-${pad(d)}`;
  document.getElementById('timePick').value=`${pad(hh)}:${pad(mm)}`;
  const wd=new Date(Date.UTC(y,m,d,12,0)).getUTCDay();
  document.getElementById('dayNote').innerHTML=`<b style="color:var(--white)">Sky for ${dateLabel(y,m,d)}, ${timeLabel(hh,mm)} SGT.</b> ` + (wd===5
    ? '<span style="color:var(--green)">Friday — session night ✓</span>'
    : '<span style="color:var(--gold)">Sessions run Fridays; sky shown for your night anyway.</span>');

  GL={y:y,m:m,d:d,hh:hh,mm:mm,dS:dS,sLon:s.lon,sR:s.r,sunAlt:sunAlt};
  renderTargets();
  renderExtras();
  renderGlance();
  renderDarkBar();
  clearTimeout(WXT);WXT=setTimeout(function(){loadWeather(false);},350);
}

function updateSatCountdown(){
  const sn=document.getElementById('satNext');if(!sn)return;
  if(!NEXTPASS||!NEXTPASS.length){sn.style.display='none';return;}
  const now=Date.now();let np=null;
  for(let i=0;i<NEXTPASS.length;i++){if(NEXTPASS[i].t>now&&(!np||NEXTPASS[i].t<np.t))np=NEXTPASS[i];}
  if(!np){sn.style.display='none';return;}
  const d=np.t-now,mag=(np.mag>=0?'+':'')+np.mag.toFixed(1);
  let when;
  if(d<3600000){const m=Math.floor(d/60000),s=Math.floor((d%60000)/1000);when='in <b>'+(m>0?m+'m ':'')+s+'s</b>';}
  else when='at <b>'+np.lbl+'</b>';
  sn.style.display='';
  sn.innerHTML='🛰️ Next pass: <b>'+np.nm+'</b> '+when+' — rises '+compass(np.az)+', peaks '+Math.round(np.el)+'°, ~mag <b>'+mag+'</b> '+(np.vis?'<span style="color:var(--green)">visible</span>':'<span style="color:var(--mute)">(in shadow)</span>');
}
function tick(){updateSatCountdown();let diff=startUTC-Date.now();const el=document.getElementById('cd'),el2=document.getElementById('cdSlim');
  const setCd=t=>{if(el)el.textContent=t;if(el2)el2.textContent=t;};
  if(diff<=0){setCd(diff>-9000000?"now 🔭":"—");return;}
  const dY=Math.floor(diff/86400000);diff-=dY*86400000;const h=Math.floor(diff/3600000);diff-=h*3600000;
  const mi=Math.floor(diff/60000);diff-=mi*60000;const sc=Math.floor(diff/1000);
  setCd((dY>0?dY+"d ":"")+pad(h)+":"+pad(mi)+":"+pad(sc));}

document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));
document.getElementById('seg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#seg button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  currentMode=b.dataset.mode;try{localStorage.setItem('scobMode',currentMode);}catch(e){}renderTargets();});
function fromInputs(){const dv=document.getElementById('datePick').value,tv=document.getElementById('timePick').value;
  if(!dv||!tv)return;const [yy,mm,dd]=dv.split('-').map(Number);const [hh,mi]=tv.split(':').map(Number);
  if(yy&&mm&&dd)recompute(yy,mm-1,dd,hh||0,mi||0);}
document.getElementById('datePick').addEventListener('change',fromInputs);
document.getElementById('datePick').addEventListener('input',fromInputs);
document.getElementById('timePick').addEventListener('change',fromInputs);
document.getElementById('timePick').addEventListener('input',fromInputs);
document.getElementById('nextFri').addEventListener('click',()=>{const f=nextFridayYMD();recompute(f.y,f.m,f.d,20,30);});
document.getElementById('timeSlider').addEventListener('input',e=>{const v=+e.target.value,dv=document.getElementById('datePick').value;if(!dv)return;const [yy,mm,dd]=dv.split('-').map(Number);recompute(yy,mm-1,dd,Math.floor(v/60),v%60);});
document.getElementById('nowBtn').addEventListener('click',()=>{const n=sgtNow();recompute(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes());});
document.getElementById('skymap').addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.hov,.clink'))return;this.classList.toggle('show-cons');});
function applyNight(on,save){document.body.classList.toggle('night',on);document.getElementById('nightBtn').textContent=on?(IS_MOBILE?'☀️':'☀️ Day'):(IS_MOBILE?'🌙':'🌙 Night');if(save!==false)try{localStorage.setItem('scobNight',on?'1':'0');}catch(e){}}
document.getElementById('nightBtn').addEventListener('click',()=>applyNight(!document.body.classList.contains('night')));
try{const nv=localStorage.getItem('scobNight');
  if(nv===null)applyNight(sunAltAt(new Date())<-1,false); // auto: red night theme once the Sun is down, until the user picks manually
  else applyNight(nv==='1',false);
}catch(e){}

// ---- live weather (Open-Meteo) for the chosen date & time ----
const WMO={0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],45:["Fog","🌫️"],48:["Fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],66:["Freezing rain","🌧️"],67:["Freezing rain","🌧️"],71:["Snow","🌨️"],73:["Snow","🌨️"],75:["Snow","🌨️"],80:["Light showers","🌦️"],81:["Showers","🌧️"],82:["Violent showers","⛈️"],85:["Snow showers","🌨️"],86:["Snow showers","🌨️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm, hail","⛈️"],99:["Thunderstorm, hail","⛈️"]};
function wxCell(k,v){return '<div class="wxcell"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';}
let WXCACHE=null,WXV=null,WXT=0,GL=null,WXTS=0,SEEAT=0,SEECACHE=null,SEEREAD=null;
let BORTLE=(()=>{try{const v=+localStorage.getItem('scobBortle');return(v===7||v===8||v===9)?v:8;}catch(e){return 8;}})();
let TARGEXP=(()=>{try{return localStorage.getItem('scobTargExpand')==='1';}catch(e){return false;}})();
let DBLEXP=(()=>{try{return localStorage.getItem('scobDblExpand')==='1';}catch(e){return false;}})();
let HILITE=null;
let SATTRACKS=[];let SATSHOW=(()=>{try{return localStorage.getItem('scobSatShow')==='1';}catch(e){return false;}})();
// v3.15: constellation lines + Milky Way visibility (default on)
let CONSTSHOW=(()=>{try{var v=localStorage.getItem('scobConstShow');return v===null?true:v==='1';}catch(e){return true;}})();
// galactic-equator sample points (J2000) → the Milky Way band, computed once
const MW_POINTS=(function(){const dN=27.12825*RAD,aN=192.85948,lN=122.93192,out=[];
  for(let l=0;l<=360;l+=4){const dl=(lN-l)*RAD;
    const dec=Math.asin(Math.cos(dN)*Math.cos(dl))*DEG;
    const ra=rev(aN+Math.atan2(Math.sin(dl),-Math.sin(dN)*Math.cos(dl))*DEG);
    out.push([ra,dec]);}
  return out;})();
let METEOR=null;
const RADIANTS=[
 {n:'Quadrantids',ra:230,dec:49,mo:0,d:3,zhr:110},{n:'Lyrids',ra:271,dec:34,mo:3,d:22,zhr:18},
 {n:'Eta Aquariids',ra:338,dec:-1,mo:4,d:6,zhr:50},{n:'Delta Aquariids',ra:340,dec:-16,mo:6,d:30,zhr:25},
 {n:'Perseids',ra:48,dec:58,mo:7,d:12,zhr:100},{n:'Orionids',ra:95,dec:16,mo:9,d:21,zhr:20},
 {n:'Leonids',ra:152,dec:22,mo:10,d:17,zhr:15},{n:'Geminids',ra:112,dec:33,mo:11,d:14,zhr:120}
];
function activeShower(y,m,d){const cur=Date.UTC(y,m,d);for(const r of RADIANTS){for(const yy of [y-1,y,y+1]){const dd=Math.round((cur-Date.UTC(yy,r.mo,r.d))/86400000);if(Math.abs(dd)<=3)return {r:r,dd:dd};}}return null;}
function wxClass(cc,pp){if(cc<=30&&(pp==null||pp<30))return['ok','GO — mostly clear'];
  if(cc<=65&&(pp==null||pp<55))return['warn','CAUTION — partial cloud; watch for breaks'];
  return['bad','NO-GO — cloudy/showery, likely a wash-out'];}
async function loadWeather(force){
  const dv=document.getElementById('datePick').value,tv=document.getElementById('timePick').value;
  const box=document.getElementById('liveWx'),btn=document.getElementById('wxBtn');
  if(!dv||!tv){box.style.display='block';box.innerHTML='<div class="wxsrc">Pick a date &amp; time first.</div>';return;}
  const n=sgtNow();const t0=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());
  const p3=dv.split('-').map(Number);const days=(Date.UTC(p3[0],p3[1]-1,p3[2])-t0)/86400000;
  if(days<0||days>15){WXV=null;box.style.display='block';
    box.innerHTML='<div class="wxsrc">📅 '+(days<0?'This date is in the past':'Beyond the ~16-day forecast window')+' — no live forecast; the seasonal guidance above still applies.</div>';
    renderGlance();loadSeeing(false);renderDataHealth();return;}
  if(!force&&WXCACHE&&WXCACHE.date===dv){renderWx();return;}
  box.style.display='block';box.innerHTML='<div class="wxsrc">Loading live forecast…</div>';btn.disabled=true;
  try{
    const u='https://api.open-meteo.com/v1/forecast?latitude=1.3342&longitude=103.7357&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,wind_speed_10m,weather_code,wind_speed_250hPa,wind_speed_850hPa,cape&timezone=Asia%2FSingapore&start_date='+dv+'&end_date='+dv+'&_t='+Date.now();
    const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
    const j=await r.json();const hh3=j.hourly;if(!hh3||!hh3.time||!hh3.time.length)throw new Error('no data');
    WXCACHE={date:dv,hourly:hh3};WXTS=Date.now();renderWx();
  }catch(e){WXV=null;box.innerHTML='<div class="wxsrc">⚠️ Could not load the live forecast — you may be offline. Use the MSS Nowcast link below for the live picture.</div>';renderGlance();loadSeeing(false);renderDataHealth();}
  finally{btn.disabled=false;}
}
function renderWx(){
  const dv=document.getElementById('datePick').value,tv=document.getElementById('timePick').value;
  const box=document.getElementById('liveWx');if(!WXCACHE||WXCACHE.date!==dv||!dv||!tv)return;
  const h=WXCACHE.hourly;
  const H=parseInt(tv.split(':')[0],10),Mi=parseInt(tv.split(':')[1],10);
  const dp=dv.split('-').map(Number),Y=dp[0],Mo=dp[1],D=dp[2];
  let i=h.time.indexOf(dv+'T'+pad(H)+':00');if(i<0)i=Math.max(0,Math.min(H,h.time.length-1));
  const t=Math.round(h.temperature_2m[i]),rh=Math.round(h.relative_humidity_2m[i]),pp=h.precipitation_probability?h.precipitation_probability[i]:null,cc=h.cloud_cover[i],ws=Math.round(h.wind_speed_10m[i]),wc=h.weather_code[i];
  const wm=WMO[wc]||["—","🌡️"];
  const vv=wxClass(cc,pp),vcls=vv[0],vtxt=vv[1];
  const rainTxt=(pp==null?'—':pp+'%');
  WXV={cls:vcls,txt:vtxt,cc:cc,pp:rainTxt};
  const EH=[18,19,20,21,22,23];let best=-1,bestScore=Infinity;
  const cells=EH.map(hr=>{const ix=h.time.indexOf(dv+'T'+pad(hr)+':00');if(ix<0)return null;
    const c2=h.cloud_cover[ix],p2=h.precipitation_probability?h.precipitation_probability[ix]:null;
    const sc=c2+1.2*(p2||0);if(sc<bestScore){bestScore=sc;best=hr;}return{hr:hr,cc:c2,pp:p2};});
  // v3.18: cloud trend across the observing window (7–11 pm)
  let trend='';const ev=cells.filter(c=>c&&c.hr>=19);
  if(ev.length>=3){const early=(ev[0].cc+ev[1].cc)/2,late=(ev[ev.length-1].cc+ev[ev.length-2].cc)/2,dCloud=late-early;
    let arr,txt,tcls;
    if(dCloud<=-12){arr='↗';txt='Clearing through the evening';tcls='ok';}
    else if(dCloud>=12){arr='↘';txt='Clouding over later';tcls='bad';}
    else{arr='→';txt='Cloud fairly steady tonight';tcls='warn';}
    trend='<div class="wxtrend '+tcls+'">'+arr+' '+txt+' <span class="wxsub">('+Math.round(early)+'% → '+Math.round(late)+'% cloud, 7→11 pm)</span></div>';}
  let strip='';
  if(cells.some(c=>c)){strip='<div class="wxhours">'+cells.map(c=>{if(!c)return'';
    const k=wxClass(c.cc,c.pp)[0];const lbl=(c.hr%12||12)+(c.hr<12?'am':'pm');
    return '<div class="wxh '+k+(c.hr===best?' best':'')+'"><div class="bar"><i style="height:'+Math.max(4,Math.round(c.cc*0.44))+'px"></i></div><div><b>'+lbl+'</b></div><div>☁️'+c.cc+'%</div><div>🌧️'+(c.pp==null?'—':c.pp+'%')+'</div>'+(c.hr===best?'<div class="hl">clearest</div>':'')+'</div>';}).join('')
    +'</div>'+trend+'<div class="wxsrc">Evening hour by hour — bar height = cloud cover, with rain chance below. The clearest window is boxed in cyan.</div>';}
  box.style.display='block';
  box.innerHTML='<div class="wxverdict '+vcls+'">'+wm[1]+' '+wm[0]+' · '+vtxt+'</div>'
    +'<div class="wxgrid">'+wxCell('Cloud cover',cc+'%')+wxCell('Rain chance',rainTxt)+wxCell('Temp',t+'°C')+wxCell('Humidity',rh+'%')+wxCell('Wind',ws+' km/h')+wxCell('For',timeLabel(H,Mi))+'</div>'
    +strip
    +'<div class="wxsrc">Forecast for '+dateLabel(Y,Mo-1,D)+' at '+timeLabel(H,Mi)+' · auto-loaded from Open-Meteo. Confirm the on-the-night call with the MSS Nowcast below.</div>';
  document.getElementById('weatherNote').innerHTML='<b style="color:var(--white)">Live go/no-go for '+dateLabel(Y,Mo-1,D)+' at '+timeLabel(H,Mi)+':</b> '+vtxt+' — '+cc+'% cloud, '+rainTxt+' rain chance. <span style="color:var(--mute)">Seasonal context: '+WXNOTE+'</span>';
  renderGlance();loadSeeing(false);renderDataHealth();
}
document.getElementById('wxBtn').addEventListener('click',function(){loadWeather(true);loadSeeing(true);});

// ---- hover/tap illustrations of objects ----
(function(){
  const tip=document.createElement('div'); tip.id='tip'; document.body.appendChild(tip);
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
  const rng=seed=>{let a=seed>>>0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
  const BG='<rect width="140" height="90" rx="8" fill="#0a1430"/>';
  function field(seed){let r=rng(seed),s='';for(let i=0;i<24;i++)s+='<circle cx="'+(r()*140).toFixed(1)+'" cy="'+(r()*90).toFixed(1)+'" r="'+(r()*0.7+0.2).toFixed(1)+'" fill="#cdd6f0" opacity="'+(r()*0.6+0.2).toFixed(2)+'"/>';return s;}
  function clump(n,cx,cy,sp,rmax,seed,col){let r=rng(seed),s='';for(let i=0;i<n;i++){const a=r()*6.283,rr=Math.pow(r(),0.6)*sp;s+='<circle cx="'+(cx+Math.cos(a)*rr).toFixed(1)+'" cy="'+(cy+Math.sin(a)*rr).toFixed(1)+'" r="'+(0.5+r()*rmax).toFixed(1)+'" fill="'+col+'" opacity="'+(0.55+r()*0.45).toFixed(2)+'"/>';}return s;}
  function star(x,y,c,z){return '<circle cx="'+x+'" cy="'+y+'" r="'+z+'" fill="'+c+'"/><path d="M'+x+' '+(y-z*3.2)+'V'+(y+z*3.2)+'M'+(x-z*3.2)+' '+y+'H'+(x+z*3.2)+'" stroke="'+c+'" stroke-width="0.7" opacity="0.65"/>';}
  function starCol(n){n=(n||'').toLowerCase();if(/antares|betelgeuse/.test(n))return'#ff7a5c';if(/aldebaran|arcturus/.test(n))return'#ffc06a';if(/rigel|spica|vega|regulus|deneb|acrux|alpha cen|canopus|sirius|altair/.test(n))return'#bcd4ff';return'#fff3d6';}
  function kindOf(t,n){t=(t||'').toLowerCase();n=(n||'').toLowerCase();
    if(/planetary/.test(t)||/dumbbell|helix|saturn nebula|eskimo|ghost of jupiter|cat's eye|blue snowball|blinking|owl nebula|eight.?burst|bow tie|skull|ring nebula/.test(n))return'planetary';
    if(/reflection/.test(t)||/iris|running man|rho ophiuchi/.test(n))return'reflection';
    if(/supernova|remnant/.test(t)||/veil|crab/.test(n))return'emission';
    if(/emission|nebula/.test(t))return'emission';
    if(/globular/.test(t))return'globular';
    if(/open cluster|asterism|star cloud/.test(t))return'open';
    if(/double/.test(t))return'double';
    if(/galaxy/.test(t)){if(/sombrero|cigar|ngc 55|needle|whale|spindle/.test(n))return'galaxyEdge';if(/centaurus a/.test(n))return'galaxyEll';return'galaxy';}
    return'star';}
  const DESC={globular:['Globular cluster','A dense, symmetric swarm of hundreds of thousands of ancient stars.'],
    open:['Open cluster','A loose, sparkling group of young stars.'],
    double:['Double star','Two suns close together, often contrasting colours.'],
    emission:['Emission nebula','A glowing hydrogen cloud where stars are born — pink/red in photos, greyish to the eye.'],
    reflection:['Reflection nebula','Dust glowing soft blue as it scatters nearby starlight.'],
    planetary:['Planetary nebula','A delicate gas shell puffed off by a dying star — small but vivid.'],
    galaxy:['Spiral galaxy','Billions of stars wound into arms around a bright core.'],
    galaxyEdge:['Edge-on galaxy','A thin disc of stars seen side-on, split by a dark dust lane.'],
    galaxyEll:['Galaxy with active core','A glowing star-city crossed by a dark dust band.'],
    star:['Bright star','A single luminous sun; its colour shows its temperature.']};
  const LBL={
    "Excellent":"High in the sky (45°+) — you're looking through the least air, so this is about as good as the view gets.",
    "Good":"Well placed (roughly 22–45° up) for a clear, steady view.",
    "Lost in the haze":"Bright enough on a clean night, but tonight's smoke takes too much at this target's altitude — haze costs most where you look through the most air. Try again when it is higher, or on a cleaner night.",
    "Dimmed by haze":"The dual-band filter rejects the extra sky glow, but it cannot bring back light the smoke scattered away — expect to need much longer integration, or pick a higher target.",
    "Low — early":"Still low (under ~22°); murky through thick air — wait for it to rise higher.",
    "Washed out":"A faint nebula or galaxy that this week's bright Moon (>55% lit) will drown out to the eye.",
    "Great — dual-band":"High up, and the Seestar's dual-band Hα/OIII filter cuts through moonlight — a prime imaging target.",
    "Later (dual-band)":"Imageable with the dual-band filter, but still a little low (18–30°) — better later in the night.",
    "Too low now":"Under ~18° — too low to image cleanly yet; give it time to climb.",
    "Moon too close":"The Moon is within 12° — its glare will swamp the frame. Shoot it once the Moon has moved away.",
    "Dark week":"A broadband galaxy/nebula that needs a dark sky; under this bright Moon it won't image well.",
    "Near Moon":"Within ~40° of the Moon — moonlight will wash out this broadband target.",
    "Low/faint":"Too low in the sky, or too faint, to image well right now.",
    "Easy":"A bright cluster — straightforward to capture even in less-than-ideal conditions.",
    "Low":"Below ~18° — too low for a good shot just yet.",
    "below":"Below the horizon — not visible at the chosen time.",
    "daytime":"The Sun is up — lost in daylight.",
    "twilight":"The Sun is just below the horizon; the sky is still too bright for a good view.",
    "dark sky":"The Sun is well down (−18° or lower) — fully dark, ideal observing conditions.",
    "scope":"Fainter than about magnitude 6 — you'll need a telescope to see it.",
    "binoculars":"Around magnitude 4–6 — visible in binoculars.",
    "naked eye":"Brighter than about magnitude 4 — visible with the unaided eye."};
  function svgFor(k,nm){let inner='';
    if(k==='globular')inner=field(7)+clump(110,70,45,30,1.5,hash(nm),'#ffe9c0')+'<circle cx="70" cy="45" r="8" fill="#fff" opacity="0.45"/>';
    else if(k==='open')inner=field(3)+clump(15,70,45,36,2.1,hash(nm),'#dfe9ff');
    else if(k==='double')inner=field(5)+star(60,46,starCol(nm),3)+star(83,44,'#bcd4ff',2.3);
    else if(k==='emission')inner='<defs><radialGradient id="e"><stop offset="0%" stop-color="#ff9bb0" stop-opacity="0.95"/><stop offset="60%" stop-color="#e0566f" stop-opacity="0.45"/><stop offset="100%" stop-color="#e0566f" stop-opacity="0"/></radialGradient></defs>'+field(9)+'<ellipse cx="70" cy="46" rx="48" ry="30" fill="url(#e)"/>'+clump(9,70,46,40,1.1,hash(nm),'#fff');
    else if(k==='reflection')inner='<defs><radialGradient id="rf"><stop offset="0%" stop-color="#bcd6ff" stop-opacity="0.9"/><stop offset="70%" stop-color="#5b7fd6" stop-opacity="0.3"/><stop offset="100%" stop-color="#5b7fd6" stop-opacity="0"/></radialGradient></defs>'+field(11)+'<ellipse cx="70" cy="46" rx="44" ry="28" fill="url(#rf)"/>'+star(70,46,'#fff',2.3);
    else if(k==='planetary')inner='<defs><radialGradient id="p"><stop offset="55%" stop-color="#6ee0ff" stop-opacity="0"/><stop offset="72%" stop-color="#6ee0ff" stop-opacity="0.85"/><stop offset="100%" stop-color="#6ee0ff" stop-opacity="0"/></radialGradient></defs>'+field(13)+'<ellipse cx="70" cy="46" rx="26" ry="20" fill="url(#p)"/><circle cx="70" cy="46" r="1.6" fill="#fff"/>';
    else if(k==='galaxy')inner='<defs><radialGradient id="gx"><stop offset="0%" stop-color="#fff6d8"/><stop offset="100%" stop-color="#caa0ff" stop-opacity="0"/></radialGradient></defs>'+field(2)+'<g transform="rotate(-20 70 45)"><ellipse cx="70" cy="45" rx="46" ry="17" fill="#9fb4f0" opacity="0.22"/><path d="M70 45 Q42 31 27 44" fill="none" stroke="#cdd9ff" stroke-width="2" opacity="0.6"/><path d="M70 45 Q98 59 113 46" fill="none" stroke="#cdd9ff" stroke-width="2" opacity="0.6"/><ellipse cx="70" cy="45" rx="13" ry="8" fill="url(#gx)"/></g>';
    else if(k==='galaxyEdge')inner=field(2)+'<g transform="rotate(-15 70 46)"><ellipse cx="70" cy="46" rx="52" ry="9" fill="#dfe6ff" opacity="0.5"/><ellipse cx="70" cy="46" rx="18" ry="9" fill="#fff7df" opacity="0.85"/><rect x="20" y="45.2" width="100" height="1.6" fill="#0a1430" opacity="0.85"/></g>';
    else if(k==='galaxyEll')inner='<defs><radialGradient id="el"><stop offset="0%" stop-color="#fff6d8"/><stop offset="100%" stop-color="#6a5a8a" stop-opacity="0"/></radialGradient></defs>'+field(2)+'<ellipse cx="70" cy="46" rx="40" ry="28" fill="url(#el)"/><g transform="rotate(-12 70 46)"><rect x="34" y="44" width="72" height="4" rx="2" fill="#0a1430" opacity="0.7"/></g>';
    else inner=field(4)+star(70,45,starCol(nm),3.4);
    return '<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg">'+BG+inner+'</svg>';}
  const PDESC={Sun:['The Sun','Never view without a certified solar filter.'],
    Moon:['The Moon','Craters & mountains stand out along the terminator.'],
    Mercury:['Mercury','Small and elusive, low in bright twilight.'],
    Venus:['Venus','Brilliant white; shows Moon-like phases in a scope.'],
    Mars:['Mars','A small ochre disc; markings & polar cap when close.'],
    Jupiter:['Jupiter','Cloud belts plus four bright Galilean moons.'],
    Saturn:['Saturn','The showpiece — its rings are unforgettable.'],
    Uranus:['Uranus','A tiny blue-green dot; needs binoculars/telescope.'],
    Neptune:['Neptune','A faint blue point; telescope only.']};
  function svgPlanet(n){let inner=field(hash(n));
    const col={Sun:'#ffd34d',Mercury:'#b9b3a7',Venus:'#f3ead0',Mars:'#d9663b',Jupiter:'#e7c9a0',Saturn:'#e9d9a8',Uranus:'#a7e6e6',Neptune:'#5b7bdc',Moon:'#e9e2c8'}[n]||'#ddd';
    if(n==='Saturn')inner+='<ellipse cx="70" cy="45" rx="34" ry="10" fill="none" stroke="#cdbb86" stroke-width="3" opacity="0.55"/><circle cx="70" cy="45" r="16" fill="'+col+'"/><path d="M36 45 A34 10 0 0 1 104 45" fill="none" stroke="#cdbb86" stroke-width="3"/>';
    else if(n==='Jupiter')inner+='<defs><clipPath id="jc"><circle cx="70" cy="45" r="20"/></clipPath></defs><circle cx="70" cy="45" r="20" fill="'+col+'"/><g clip-path="url(#jc)"><rect x="50" y="35" width="40" height="3" fill="#c79b6a"/><rect x="50" y="43" width="40" height="3" fill="#b98a55"/><rect x="50" y="51" width="40" height="3" fill="#c79b6a"/><circle cx="62" cy="51" r="2.4" fill="#c0563b"/></g><circle cx="99" cy="45" r="1.3" fill="#fff"/><circle cx="106" cy="45" r="1.3" fill="#fff"/>';
    else if(n==='Sun')inner+='<circle cx="70" cy="45" r="19" fill="'+col+'"/><circle cx="70" cy="45" r="25" fill="none" stroke="#ffd34d" stroke-width="1.5" opacity="0.4"/>';
    else if(n==='Moon')inner+='<circle cx="70" cy="45" r="20" fill="'+col+'"/><circle cx="62" cy="40" r="4" fill="#cfc6a8" opacity="0.7"/><circle cx="78" cy="50" r="5" fill="#cfc6a8" opacity="0.6"/><circle cx="74" cy="38" r="2.5" fill="#cfc6a8" opacity="0.6"/>';
    else inner+='<circle cx="70" cy="45" r="'+((n==='Uranus'||n==='Neptune')?12:(n==='Mercury'?10:17))+'" fill="'+col+'"/>';
    return '<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg">'+BG+inner+'</svg>';}
  let shown=false;
  function build(el){
    if(el.dataset.verdict!==undefined){const v=el.dataset.verdict,dd=LBL[v]||(/% lit/.test(v)?"The percentage of the Moon's disc lit up right now — the brighter it is, the more it washes out faint targets.":"Observing verdict for this target at the chosen time.");tip.innerHTML='<div class="tt">'+v+'</div><div>'+dd+'</div>';return;}
    if(el.dataset.planet){const n=el.dataset.planet,d=PDESC[n]||['',''];tip.innerHTML=svgPlanet(n)+'<div class="tt">'+n+'</div><div class="ty">'+d[0]+'</div><div>'+d[1]+'</div>';}
    else{const t=el.dataset.type||'',nm=el.dataset.name||'',k=kindOf(t,nm),d=DESC[k];
      const cx=window.chineseStarByName?window.chineseStarByName(nm):null;
      tip.innerHTML=svgFor(k,nm)+'<div class="tt">'+nm+'</div><div class="ty">'+t+' · '+d[0]+'</div><div>'+d[1]+'</div>'+(cx?'<div style="color:var(--gold);margin-top:3px">🐉 '+cx.cn+' · '+cx.men+' mansion</div>':'');}}
  function place(x,y){const w=tip.offsetWidth,h=tip.offsetHeight;let L=x+14,T=y+14;if(L+w>innerWidth-6)L=x-w-14;if(L<6)L=6;if(T+h>innerHeight-6)T=y-h-14;if(T<6)T=6;tip.style.left=L+'px';tip.style.top=T+'px';}
  function show(el,x,y){build(el);tip.style.display='block';shown=true;place(x,y);}
  function hide(){tip.style.display='none';shown=false;tip._for=null;}
  document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('.hov');if(el)show(el,e.clientX,e.clientY);});
  document.addEventListener('mousemove',e=>{if(!shown)return;const el=e.target.closest&&e.target.closest('.hov');if(el)place(e.clientX,e.clientY);else hide();});
  document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.hov');if(el){const r=el.getBoundingClientRect();if(shown&&tip._for===el){hide();}else{show(el,r.left,r.bottom);tip._for=el;}e.stopPropagation();}else hide();});
})();

// ==== v3.2: special events · ISS passes · haze · session plan · briefing ====
let EVT=[],ISSCHIP='',ISSFOR='',PSIAT=0,PSIVAL=null;
// v4.08: live haze state. PSIVAL is the 24-h PSI (what NEA's health advisories key
// to); PM25VAL is the 1-hour PM2.5 (what the sky at 8 pm actually follows, and what
// the optical model uses). HAZE holds the full five-region reading.
let PM25VAL=null,HAZE=null,HAZETREND=null,HAZEERR=false,HAZETS=0;
// v4.09: the transport wind aloft — which upwind region, if any, is feeding us.
let HAZEWIND=null,HAZEWINDKEY='';
// v4.13: the multi-night outlook (so a FUTURE chosen date gets that night's haze, not
// today's), and the verdict derived from it that the headline and share blurb reuse.
let HAZEFC=null,HAZEFCAT=0,HAZEFCTS=0,HAZEV=null;
const EVENTS=[
 ['2026-07-30','☄️','Delta Aquariids meteor shower peaks','Up to 20/hr after midnight, but the full Moon washes most out this year.',1],
 ['2026-08-02','🪐','Mercury at greatest western elongation','Morning object — low in the east before sunrise, not an evening-session target.',1],
 ['2026-08-12','🌑','Total solar eclipse — not visible from Singapore','Path crosses the Arctic, Greenland, Iceland & Spain.',0],
 ['2026-08-12','☄️','Perseids meteor shower peaks','Excellent year — New Moon, dark skies. Up to 60/hr after midnight; the radiant sits low in the north from Singapore, so rates are reduced but bright ones still get through.',1],
 ['2026-08-15','🪐','Venus at greatest eastern elongation','Brilliant "evening star" in the west after sunset — a session showpiece.',1],
 ['2026-08-28','🌕','Partial lunar eclipse — not visible from Singapore','Visible from the Americas, Europe & Africa.',0],
 ['2026-09-26','🪐','Neptune at opposition','Closest & brightest of the year — a tiny blue dot for the 40 cm.',1],
 ['2026-10-04','🪐','Saturn at opposition','Closest & brightest of the year, up all night — prime target for every scope on deck.',1],
 ['2026-10-07','☄️','Draconids meteor shower peaks','Minor (~10/hr) early-evening shower, but the radiant is very low from Singapore.',1],
 ['2026-10-12','🪐','Mercury at greatest eastern elongation','Best evening view — very low in the west just after sunset.',1],
 ['2026-10-21','☄️','Orionids meteor shower peaks','Up to 20/hr from Halley\'s dust; Moon sets after midnight and the radiant is well placed from Singapore.',1],
 ['2026-11-04','☄️','Taurids meteor shower peaks','Slow, bright fireballs, ~5–10/hr, best after midnight.',1],
 ['2026-11-17','☄️','Leonids meteor shower peaks','Up to 15/hr after the Moon sets around midnight.',1],
 ['2026-11-24','🌕','Full Moon — supermoon','Slightly bigger & brighter than usual — great on the deck scopes, bad for faint targets.',1],
 ['2026-11-26','🪐','Uranus at opposition','Closest & brightest of the year — blue-green dot in the bigger scopes.',1],
 ['2026-12-13','☄️','Geminids meteor shower peaks','King of the showers — up to 120/hr and the crescent Moon sets early. Radiant climbs from ~9 pm in Singapore; an excellent year.',1],
 ['2026-12-21','☄️','Ursids meteor shower peaks','Far-northern radiant sits on/below Singapore\'s horizon — effectively not observable here.',0],
 ['2026-12-24','🌕','Full Moon — supermoon','Slightly bigger & brighter than usual (full at about 10 am; the night before and after both look full).',1],
 ['2027-01-03','☄️','Quadrantids meteor shower peaks','Up to 40/hr after midnight; little moonlight, but the radiant stays very low from Singapore.',1],
 ['2027-01-04','🪐','Venus at greatest western elongation','Brilliant "morning star" before sunrise.',1],
 ['2027-01-22','🌕','Full Moon — supermoon','Slightly bigger & brighter than usual.',1],
 ['2027-02-03','🪐','Mercury at greatest eastern elongation','Low in the west just after sunset.',1],
 ['2027-02-06','🌑','Annular solar eclipse — not visible from Singapore','Path crosses Chile, Argentina & the south Atlantic.',0],
 ['2027-02-11','🪐','Jupiter at opposition','Closest & brightest of the year, up all night — cloud belts & the four Galilean moons in any scope.',1],
 ['2027-02-19','🪐','Mars at opposition','Closest & brightest of the year — surface markings in the 40 cm.',1],
 ['2027-02-20','🌕','Penumbral lunar eclipse — not visible from Singapore','Subtle shading, visible from the Americas, Europe, Africa & western Asia. Also a supermoon.',0],
 ['2027-04-22','☄️','Lyrids meteor shower peaks','~20/hr, but a nearly-full Moon washes most out this year.',1],
 ['2027-05-06','☄️','Eta Aquariids meteor shower peaks','Excellent year — no Moon. Up to 60/hr before dawn from Halley\'s dust; one of the best showers for Singapore\'s latitude.',1],
 ['2027-05-28','🪐','Mercury at greatest eastern elongation','Low in the west just after sunset.',1],
 ['2027-07-16','🪐','Mercury at greatest western elongation','Morning object before sunrise.',1],
 ['2027-07-18','🌕','Penumbral lunar eclipse — nothing to see','Around midnight the full Moon only grazes the very edge of Earth\'s outer shadow (penumbral magnitude 0.003, for about 12 minutes). Technically an eclipse; no visible darkening at all.',0],
 ['2027-07-30','☄️','Delta Aquariids meteor shower peaks','~20/hr after midnight; waning crescent Moon — a decent year.',1],
 ['2027-08-02','🌑','Total solar eclipse — not visible from Singapore','Path crosses North Africa & the Middle East; partial from Europe to India.',0],
 ['2027-08-12','☄️','Perseids meteor shower peaks','Waxing gibbous Moon interferes; radiant low from Singapore.',1],
 ['2027-09-25','🪐','Mercury at greatest eastern elongation','Best evening apparition of the year (26° from the Sun), low in the west after sunset.',1],
 ['2027-09-28','🪐','Neptune at opposition','Tiny blue dot at its brightest for the year.',1],
 ['2027-10-07','☄️','Draconids meteor shower peaks','Minor early-evening shower; radiant very low from Singapore.',1],
 ['2027-10-18','🪐','Saturn at opposition','Closest & brightest of the year — rings on show all night.',1],
 ['2027-10-21','☄️','Orionids meteor shower peaks','~20/hr after midnight; some moonlight interferes.',1],
 ['2027-11-04','☄️','Taurids meteor shower peaks','Slow bright fireballs, ~5–10/hr after midnight.',1],
 ['2027-11-17','☄️','Leonids meteor shower peaks','Near-full Moon spoils all but the brightest this year.',1],
 ['2027-11-30','🪐','Uranus at opposition','Blue-green dot at its brightest for the year.',1],
 ['2027-12-13','☄️','Geminids meteor shower peaks','Up to 120/hr, but a full Moon hurts this year.',1],
 ['2028-01-04','☄️','Quadrantids meteor shower peaks','Up to 40/hr after midnight; a half Moon sets around midnight, and the radiant stays low from Singapore.',1],
 ['2028-01-26','🌑','Annular solar eclipse — not visible from Singapore','A "ring of fire" over the eastern Pacific, the Americas and the Atlantic into Spain.',0],
 ['2028-03-12','🪐','Jupiter at opposition','Closest & brightest of the year, up all night — cloud belts & the four Galilean moons in any scope.',1],
 ['2028-03-22','🪐','Venus at greatest eastern elongation','Brilliant "evening star" in the west after sunset — a session showpiece for weeks either side.',1],
 ['2028-04-22','☄️','Lyrids meteor shower peaks','Excellent year — a new Moon and dark skies. ~20/hr before dawn.',1],
 ['2028-05-06','☄️','Eta Aquariids meteor shower peaks','Normally one of Singapore\'s best, but a nearly-full Moon washes most out this year; a few bright Halley\'s-dust meteors still show before dawn.',1],
 ['2028-07-06','🌕','Partial lunar eclipse — visible from Singapore','After midnight: Earth\'s shadow takes a bite out of the full Moon, greatest at about 2:20 am on 7 Jul with the Moon about 60° up in the south-west. About 40% of the Moon\'s diameter is shadowed.',1],
 ['2028-07-22','🌑','Total solar eclipse — partial from Singapore','Totality crosses Christmas & Cocos Islands, Australia (Sydney) and New Zealand; from Singapore a modest partial in the late morning — a daytime event needing a certified solar filter.',1],
 ['2028-08-12','☄️','Perseids meteor shower peaks','A gibbous Moon interferes until it sets after midnight; the radiant sits low from Singapore, so a quieter year.',1],
 ['2028-10-21','☄️','Orionids meteor shower peaks','A good year — only a thin crescent Moon. Up to 20/hr after midnight from Halley\'s dust, well placed from Singapore.',1],
 ['2028-10-31','🪐','Saturn at opposition','Closest & brightest of the year, up all night — rings on show for every scope on deck.',1],
 ['2028-11-17','☄️','Leonids meteor shower peaks','New Moon, dark skies — up to ~15/hr after midnight.',1],
 ['2028-12-13','☄️','Geminids meteor shower peaks','King of the showers — up to 120/hr and a new Moon this year. The radiant climbs from ~9 pm in Singapore; an excellent year.',1],
 ['2028-12-31','🌕','Total lunar eclipse — visible from Singapore','A New Year\'s Eve total eclipse: the full Moon turns coppery-red, visible across Asia, Australia & the Pacific. A naked-eye, whole-sky event.',1]
];
function renderEvents(){
  const el=document.getElementById('events');if(!el||!GL)return;
  const cur=Date.UTC(GL.y,GL.m,GL.d);let html='';EVT=[];
  EVENTS.forEach(ev=>{const p=ev[0].split('-').map(Number),t=Date.UTC(p[0],p[1]-1,p[2]);
    const dd=Math.round((t-cur)/86400000);if(dd<0||dd>21)return;
    if(dd===0&&ev[4])EVT.push(ev);
    const when=dd===0?'chosen night':(dd===1?'next night':dateLabel(p[0],p[1]-1,p[2])+' · in '+dd+' days');
    html+='<div class="evrow'+(ev[4]?'':' dim')+'"><span class="evic">'+ev[1]+'</span><div><b>'+ev[2]+'</b> <span class="evwhen">'+when+'</span><div class="evnote">'+ev[3]+'</div></div></div>';});
  // v3.86: expiry guard — the events list is hand-maintained, so warn when the chosen date reaches
  // the end of it (within the 21-day look-ahead) rather than silently showing nothing.
  const le=EVENTS[EVENTS.length-1][0].split('-').map(Number),lastT=Date.UTC(le[0],le[1]-1,le[2]);
  let banner='';
  if(cur>lastT-21*86400000){
    banner='<div class="evrow" style="border:1px solid var(--gold);border-radius:9px;background:rgba(245,197,66,.10);margin-bottom:8px"><span class="evic">🗓️</span><div><b>Events calendar ends '+dateLabel(le[0],le[1]-1,le[2])+(cur>lastT?' — now in the past':'')+'</b><div class="evnote">Time to refresh — add the next year’s eclipses, oppositions, meteor showers &amp; supermoons to the <code>EVENTS</code> list so this panel keeps working (source: Sea &amp; Sky astronomy calendar).</div></div></div>';
  }
  el.innerHTML=banner+(html||'<div class="tsub">No major sky events in the 3 weeks after the chosen date — pick a later date to look further ahead.</div>');
}
function skyAt(hh,mm){
  const dt=new Date(Date.UTC(GL.y,GL.m,GL.d,hh-8,mm,0));
  const J=jd(dt),dS=J-2451543.5;
  const lstv=rev(280.46061837+360.98564736629*(J-2451545.0)+LON);
  const aa=(ra,dec)=>{const H=(lstv-ra)*RAD,dr=dec*RAD,l=LAT*RAD;
    const alt=Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;
    let az=Math.atan2(-Math.cos(dr)*Math.sin(H),Math.sin(dr)*Math.cos(l)-Math.cos(dr)*Math.sin(l)*Math.cos(H))*DEG;
    return{alt,az:rev(az)};};
  const s=sun(dS),seq=eclToEq(s.lon,0,dS),sa=aa(seq.ra,seq.dec).alt;
  const mo=moon(dS),meq=eclToEq(mo.lon,mo.lat,dS),ma=aa(meq.ra,meq.dec);
  const pls=[];for(const nm of Object.keys(PLAN)){const pe=planetEq(PLAN[nm],dS,s.lon,s.r);const a2=aa(pe.ra,pe.dec);pls.push({name:nm,alt:a2.alt,az:a2.az,mag:pe.mag});}
  const tg=CAT.map(t=>{const a2=aa(t[3],t[4]);return{name:t[0],type:t[1],alt:a2.alt,az:a2.az,cls:t[5],mag:t[6]};}).filter(r=>r.alt>15).sort((a2,b2)=>b2.alt-a2.alt);
  return{sunAlt:sa,moonAlt:ma.alt,moonAz:ma.az,planets:pls,targets:tg};
}
function renderPlan(){
  const el=document.getElementById('plan');if(!el||!GL)return;
  let html='';
  [[19,30],[20,30],[21,30]].forEach(sl=>{
    const sk=skyAt(sl[0],sl[1]);const rows=[];
    if(sk.sunAlt>-6)rows.push('Sky still bright — welcome & orientation talk'+(sk.moonAlt>10?'; the Moon is already up, start the deck queues on it':'')+'.');
    if(sk.moonAlt>10)rows.push('🌙 <b>Moon</b> ('+Math.round(sk.moonAlt)+'° '+compass(sk.moonAz)+') — deck <b>Celestron CPC / C6</b>: fast, queue-friendly views of the terminator.');
    const vis=sk.planets.filter(p=>p.alt>12&&['Venus','Mars','Jupiter','Saturn','Mercury'].indexOf(p.name)>=0&&sk.sunAlt<-3).sort((a2,b2)=>a2.mag-b2.mag);
    if(vis[0])rows.push('🪐 <b>'+vis[0].name+'</b> ('+Math.round(vis[0].alt)+'° '+compass(vis[0].az)+') — <b>40 cm main dome</b> for maximum detail; overflow on the 11&quot;.');
    if(vis[1])rows.push('🪐 <b>'+vis[1].name+'</b> ('+Math.round(vis[1].alt)+'° '+compass(vis[1].az)+') — <b>11&quot; second dome</b>.');
    if(sk.sunAlt<-12){
      const glob=sk.targets.find(t=>/Globular/i.test(t.type)&&t.alt>25);
      if(glob)rows.push('✨ <b>'+glob.name+'</b> ('+Math.round(glob.alt)+'°) — <b>40 cm</b> resolves the core; crisp in the <b>6&quot; apo</b>.');
      const oc=sk.targets.find(t=>/Open cluster/i.test(t.type)&&t.alt>25&&t.mag!=null&&t.mag<6.5);
      if(oc)rows.push('✨ <b>'+oc.name+'</b> ('+Math.round(oc.alt)+'°) — wide-field in the <b>6&quot; apo</b> / portable scopes.');
      const em=sk.targets.find(t=>t.cls==='emission'&&t.alt>25);
      if(em)rows.push('📷 <b>'+em.name+'</b> ('+Math.round(em.alt)+'°) — <b>Seestar S30 Pro</b> dual-band imaging'+(pct>=55?' (the Hα/OIII filter beats the moonlight)':'')+'.');
    }
    if(!rows.length)rows.push('Nothing well placed yet — sky tour & constellation talk.');
    html+='<div class="planslot"><h3>'+timeLabel(sl[0],sl[1])+'</h3><ul>'+rows.map(r=>'<li>'+r+'</li>').join('')+'</ul></div>';
  });
  const seeNote=SEEREAD?'<div class="tsub" style="margin-top:6px">🌬️ Seeing <b>'+SEEREAD.label+'</b>'+(SEEREAD.arc?' ('+SEEREAD.arc+')':'')+' — '+(/(poor|fair)/i.test(SEEREAD.label)?'keep planetary, lunar &amp; tight-double magnification modest tonight; high-power detail will boil in and out.':'steady air — push high power on the planets, the Moon &amp; tight doubles.')+' <span style="opacity:.8">('+SEEREAD.src+')</span></div>':'';
  el.innerHTML=html+seeNote+'<div class="tsub" style="margin-top:6px">Auto-generated from computed altitudes & the SCOB fleet for the chosen date — adjust on the night.</div>';
}
function loadScript(src){return new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=src;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});}
const SATS=[
 {nm:'ISS',cat:25544,mag:-1.8,note:'Naked-eye — a brilliant "star" gliding across the sky in a few minutes.'},
 {nm:'Tiangong',cat:48274,mag:-1.0,note:'China\'s space station — nearly as bright as the ISS, same graceful glide.'},
 {nm:'Hubble',cat:20580,mag:2.0,note:'The Hubble Space Telescope — fainter (mag ~2–3); easiest in binoculars.'}
];
// standard magnitudes are the brightness at 1000 km range; the pass magnitude below scales by actual range.
let NEXTPASS=[];
async function getTLE(cat){
  const key='scobTLE_'+cat;
  let cached=null;try{cached=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
  if(cached&&Date.now()-cached.ts<3*86400000)return cached;
  try{
    const r=await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR='+cat+'&FORMAT=TLE',{cache:'no-store'});
    if(!r.ok)throw 0;
    const L=(await r.text()).trim().split(/\r?\n/);
    if(L.length<3)throw 0;
    const c={l1:L[1].trim(),l2:L[2].trim(),ts:Date.now()};
    try{localStorage.setItem(key,JSON.stringify(c));}catch(e){}
    return c;
  }catch(e){return cached;}
}
function issSunlit(pos,dt){const dS=jd(dt)-2451543.5,s=sun(dS),eq=eclToEq(s.lon,0,dS);
  const ra=eq.ra*RAD,dec=eq.dec*RAD;
  const sv=[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
  const dot=pos.x*sv[0]+pos.y*sv[1]+pos.z*sv[2];
  if(dot>0)return true;
  const r2=pos.x*pos.x+pos.y*pos.y+pos.z*pos.z;
  return Math.sqrt(Math.max(0,r2-dot*dot))>6371;}
async function loadISS(){
  const box=document.getElementById('iss');if(!box||!GL)return;
  const key=GL.y+'-'+pad(GL.m+1)+'-'+pad(GL.d);
  if(ISSFOR===key)return;ISSFOR=key;ISSCHIP='';SATTRACKS=[];
  box.innerHTML='<div class="tsub">Computing evening passes…</div>';
  try{
    if(typeof satellite==='undefined')await loadScript('satellite.min.js');
    const obs={latitude:LAT*RAD,longitude:LON*RAD,height:0.02};
    const base=Date.UTC(GL.y,GL.m,GL.d,0,0,0)-8*3600000;
    const all=[];let maxAge=0,got=0;
    for(const st of SATS){
      const tle=await getTLE(st.cat);if(!tle)continue;got++;
      maxAge=Math.max(maxAge,Math.round((Date.now()-tle.ts)/86400000));
      const rec=satellite.twoline2satrec(tle.l1,tle.l2);
      let cur=null;
      for(let sec=19*3600;sec<=23*3600;sec+=10){
        const dt=new Date(base+sec*1000);
        const pv=satellite.propagate(rec,dt);if(!pv||!pv.position)continue;
        const la=satellite.ecfToLookAngles(obs,satellite.eciToEcf(pv.position,satellite.gstime(dt)));
        const elv=la.elevation*DEG;
        if(elv>10){
          const vis=sunAltAt(dt)<-6&&issSunlit(pv.position,dt);
          if(!cur)cur={sat:st,s:dt,sAz:la.azimuth*DEG,maxEl:elv,maxAz:la.azimuth*DEG,maxT:dt,maxRng:la.rangeSat,vis:vis,e:dt,eAz:la.azimuth*DEG,pts:[]};
          else{if(elv>cur.maxEl){cur.maxEl=elv;cur.maxAz=la.azimuth*DEG;cur.maxT=dt;cur.maxRng=la.rangeSat;}cur.vis=cur.vis||vis;}
          cur.pts.push({alt:elv,az:la.azimuth*DEG});
          cur.e=dt;cur.eAz=la.azimuth*DEG;
        }else if(cur){all.push(cur);cur=null;}
      }
      if(cur)all.push(cur);
    }
    if(!got)throw 0;
    all.sort((a2,b2)=>a2.s-b2.s);
    const fmt=dt=>{const t=new Date(dt.getTime()+8*3600000);return timeLabel(t.getUTCHours(),t.getUTCMinutes());};
    // peak magnitude ≈ standard mag (at 1000 km) scaled by actual range at closest point
    all.forEach(p=>{const base=(p.sat.mag!=null?p.sat.mag:-1.0);p.pkMag=base+5*Math.log10((p.maxRng||600)/1000);});
    SATTRACKS=all.map(p=>({nm:p.sat.nm,vis:p.vis,pts:p.pts,t:fmt(p.s)}));
    NEXTPASS=all.map(p=>({t:p.s.getTime(),nm:p.sat.nm,az:p.sAz,el:p.maxEl,mag:p.pkMag,vis:p.vis,lbl:fmt(p.s)}));
    if(SATSHOW&&GL)renderSkyMap(GL.dS,GL.sLon,GL.sR);
    if(!all.length){NEXTPASS=[];box.innerHTML='<div class="tsub">No ISS, Tiangong or Hubble passes above 10° between 7 pm and 11 pm this night.</div>';}
    else{
      const magTxt=p=>{const m=p.pkMag;return (m>=0?'+':'')+m.toFixed(1);};
      box.innerHTML='<div id="satNext" class="satnext" style="display:none"></div>'+all.map(p=>{
        const tag=p.vis?'<span class="tag exc">visible</span>':'<span class="tag below">in Earth\'s shadow</span>';
        return '<div class="evrow"><span class="evic">🛰️</span><div><b>'+p.sat.nm+' · '+fmt(p.s)+' → '+fmt(p.e)+'</b> '+tag+'<div class="evnote">Rises '+compass(p.sAz)+', peaks <b>'+Math.round(p.maxEl)+'°</b> in the '+compass(p.maxAz)+' at '+fmt(p.maxT)+', sets '+compass(p.eAz)+' · peak brightness <b>mag '+magTxt(p)+'</b>'+(p.vis?'':' (in shadow — won\'t be seen)')+'. '+p.sat.note+'</div></div></div>';
      }).join('')+'<div class="tsub" style="margin-top:6px">ISS · Tiangong · Hubble — computed on-device from CelesTrak orbital elements ('+(maxAge<1?'fetched today':'up to '+maxAge+' days old')+'). Times drift as orbits are adjusted — accurate within a few days of the TLE. Magnitudes are estimates (lower = brighter).</div>';
      const best=all.filter(p=>p.vis).sort((a2,b2)=>b2.maxEl-a2.maxEl)[0];
      if(best){ISSCHIP=best.sat.nm+' '+fmt(best.s)+' · '+Math.round(best.maxEl)+'°';renderGlance();}
      updateSatCountdown();
    }
  }catch(e){NEXTPASS=[];box.innerHTML='<div class="tsub">⚠️ Needs a connection once to fetch satellite orbits from CelesTrak — try again when online.</div>';ISSFOR='';}
}
// v4.08: the evening's humidity, which decides how much the smoke particles swell
// (and so how much light they scatter). Taken from the loaded forecast when we have
// it; 82% is a typical Singapore evening otherwise.
function hazeRH(){
  try{const dv=document.getElementById('datePick').value;
    if(WXCACHE&&WXCACHE.date===dv&&WXCACHE.hourly.relative_humidity_2m){
      const i=WXCACHE.hourly.time.indexOf(dv+'T21:00');
      if(i>=0)return WXCACHE.hourly.relative_humidity_2m[i];}}catch(e){}
  return 82;
}
// v4.08: the haze panel. It was a single line carrying one number (the 24-hour PSI
// for the west); it now carries the reading that actually tracks the sky (1-hour
// PM2.5), the direction it is moving, where the smoke sits across the island, what
// it is costing the view at two altitudes, and — because a Friday night is a public
// event on an open deck — the health call. Bands, physics and fetching all live in
// the shared haze-core.js.
// v4.13 — WHICH night's haze? Until now the live reading was applied to whatever date
// was on screen, so planning Friday on a Wednesday borrowed Wednesday's air. The live
// NEA reading describes tonight and only tonight; a future date gets that night's
// forecast instead; a date beyond the forecast gets nothing rather than a wrong number.
function hazeNight(){
  if(!window.Haze)return null;
  const dp=document.getElementById('datePick');const dv=dp?dp.value:'';if(!dv)return null;
  const fc=(HAZEFC||[]).find(function(n){return n.date===dv;})||null;
  if(dv===window.Haze.localDateISO()){
    const pm=(typeof PM25VAL==='number')?PM25VAL:(fc&&fc.pm25!=null?fc.pm25:null);
    const col=(fc&&fc.aod!=null)?fc.aod:null;
    if(pm==null&&col==null)return null;
    return {mode:'live',date:dv,pm25:pm,aod:col};
  }
  if(fc&&(fc.pm25!=null||fc.aod!=null))return {mode:'forecast',date:dv,pm25:fc.pm25,aod:fc.aod};
  return null;
}
function hazeCostAt(alt){
  const n=hazeNight();if(!n)return null;
  return window.Haze.skyCost({pm25:n.pm25,aod:n.aod,rh:hazeRH(),alt:alt,bortle:BORTLE});
}
// One summary the headline verdict and the share blurb both read, so they cannot disagree.
// v4.14 — the air NOW, when the chosen night is only a day or two away. v4.13 kept the
// live reading strictly to tonight, which is right for the sky cost but was wrong for
// health: on Thu 15 Oct 2026, with the west at PSI 211 and rising, the Friday headline
// and share blurb said nothing about the air ("All ages welcome — just turn up"). Nobody
// forecasts PSI for us, but a 24-hour rolling average changes slowly, so today's band is
// the best single guide to tomorrow's. It is reported as "right now", never as the
// night's own reading, and only when NEA's band carries an advisory (PSI above 100).
function hazeDaysAhead(dv){
  if(!window.Haze||!dv)return null;
  return Math.round((Date.parse(dv)-Date.parse(window.Haze.localDateISO()))/864e5);
}
function hazeNow(dv){
  const ahead=hazeDaysAhead(dv);
  if(!(ahead>=1&&ahead<=2)||typeof PSIVAL!=='number'||!(PSIVAL>100))return null;
  return {psi:PSIVAL,band:window.Haze.psiBand(PSIVAL),call:window.Haze.sessionCall(PSIVAL),ahead:ahead,
          rising:!!(HAZETREND&&HAZETREND.dir==='up')};
}
function hazeVerdict(){
  HAZEV=null;const n=hazeNight(),c=n?hazeCostAt(60):null;
  const dp=document.getElementById('datePick'),now=hazeNow(dp?dp.value:'');
  if(!c&&!now)return null;
  const psi=(n&&n.mode==='live'&&typeof PSIVAL==='number')?PSIVAL:null;
  HAZEV={mode:n?n.mode:'none',psi:psi,band:psi!=null?window.Haze.psiBand(psi):null,call:psi!=null?window.Haze.sessionCall(psi):null,
         cost:c?c.total:null,aloft:c?c.aloft:false,label:c?window.Haze.costLabel(c.total):null,
         pm25:n?n.pm25:null,aod:n?n.aod:null,now:now};
  return HAZEV;
}
function renderHaze(){
  const el=document.getElementById('haze');if(!el||!window.Haze)return;
  const Hz=window.Haze;
  if(!HAZE){
    if(!HAZEERR)return;
    el.style.display='block';
    el.innerHTML='🌫️ <b>Haze:</b> <span class="warn">no live NEA reading</span> — you may be offline, so tonight\'s limiting magnitude is shown with no haze penalty. <a class="hzmore" href="haze.html">Haze page →</a>';
    return;}
  const R=Hz.HOME_REGION,psi=HAZE.psi,pm=(HAZE.pm!=null?HAZE.pm:PM25VAL);
  const pb=Hz.psiBand(psi),mb=Hz.pmBand(pm);
  let s='<div class="hzhead">🌫️ <b style="color:var(--white)">Haze right now</b> · west (Jurong)'
    +' — 24-h PSI <span class="hznum '+(pb?pb.cls:'')+'">'+(psi==null?'—':Math.round(psi))+'</span>'+(pb?' <b class="'+pb.cls+'">'+pb.name+'</b>':'')
    +' · 1-h PM2.5 <span class="hznum '+(mb?mb.cls:'')+'">'+(pm==null?'—':Math.round(pm))+'</span> µg/m³'+(mb?' <b class="'+mb.cls+'">'+mb.name+'</b>':'')
    +(HAZETREND?' · <b class="'+HAZETREND.cls+'">'+HAZETREND.arrow+' '+HAZETREND.text+'</b>':'')
    +((HAZE.pm==null&&psi!=null)?' <span style="opacity:.7">(PM2.5 estimated from the PSI — the hourly feed did not answer)</span>':'')+'</div>';
  if(HAZE.all&&(HAZE.all.psi||HAZE.all.pm)){
    s+='<div class="hzregs">'+Hz.REGIONS.map(function(r){
      const p=HAZE.all.psi?HAZE.all.psi[r]:null,m=HAZE.all.pm?HAZE.all.pm[r]:null;
      const b=Hz.psiBand(p)||Hz.pmBand(m);
      return '<div class="hzr'+(r===R?' home':'')+'" title="'+Hz.REGION_LABEL[r]+(r===R?' — our region':'')+': 24-h PSI '+(p==null?'—':Math.round(p))+', 1-h PM2.5 '+(m==null?'—':Math.round(m))+' µg/m³">'
        +'<b class="'+(b?b.cls:'')+'">'+(p==null?'—':Math.round(p))+'</b>'+Hz.REGION_LABEL[r]+'</div>';
    }).join('')+'</div>';
  }
  // What it costs the sky — for the night that is actually on screen.
  const n=hazeNight(),hi=n?hazeCostAt(60):null,lo=n?hazeCostAt(20):null;
  if(n&&hi&&lo){
    const dv=n.date.split('-').map(Number);
    const who=(n.mode==='live')?'Tonight':('Forecast for '+dateLabel(dv[0],dv[1]-1,dv[2]));
    const src=(n.mode==='live')
      ?('ground PM2.5 '+(n.pm25==null?'—':Math.round(n.pm25))+' µg/m³'+(n.aod!=null?' · model column depth '+n.aod.toFixed(1):''))
      :('model PM2.5 ~'+(n.pm25==null?'—':Math.round(n.pm25))+' µg/m³'+(n.aod!=null?' · column depth '+n.aod.toFixed(1):''));
    s+=(hi.total<0.15)
      ? '<div><b>'+who+':</b> no real transparency penalty — the air is as clean as Jurong gets. <span style="opacity:.7">('+src+')</span></div>'
      : '<div><b>'+who+':</b> costs roughly <b class="'+(hi.total<0.6?'warn':'bad')+'">'+hi.total.toFixed(1)+' mag</b> on a well-placed target and <b class="'+(lo.total<1?'warn':'bad')+'">'+lo.total.toFixed(1)+' mag</b> on anything still down at 20° — low objects lose most, because you look through three times the air. <span style="opacity:.7">('+src+')</span></div>';
    if(hi.aloft)s+='<div class="hzcall warn"><b>Smoke aloft.</b> The column holds far more smoke than the ground reading accounts for — it is passing overhead rather than sitting at street level. The PSI will look better than the sky does: judge tonight by the stars, not by the number.</div>';
  }else if(HAZEFC){
    s+='<div style="opacity:.8">No haze forecast reaches the chosen date — the limiting magnitude for it is shown without a haze penalty.</div>';
  }
  // v4.09: a ground sensor only reports what has already arrived. One line on
  // where the air is coming FROM — the full picture is on the haze page.
  if(HAZEWIND&&HAZEWIND.source){
    const w=HAZEWIND,sc=w.source;
    s+='<div>→ Transport wind from the <b>'+Hz.compass16(w.dir)+'</b>'
      +(w.speed!=null?' at '+Math.round(w.speed)+' km/h':'')+' — '
      +(sc.risk==='low'
        ? '<b class="ok">nothing burning upwind</b>.'
        : '<b class="'+(sc.risk==='high'?'bad':'warn')+'">'+sc.name+' is upwind</b>'
          +(sc.km&&w.hours?', about '+Math.round(w.hours)+' h away at this speed':'')+'.')
      +'</div>';
  }
  const call=Hz.sessionCall(psi);
  if(call&&call.cls!=='ok')s+='<div class="hzcall '+call.cls+'"><b>'+call.verdict+'</b> — '+call.note+'</div>';
  s+='<div style="margin-top:6px;opacity:.8">The PSI and PM2.5 are live NEA readings and describe right now; the sky cost is worked out for the chosen night. <a class="hzmore" href="haze.html">Last 24 hours, the week, the outlook &amp; what haze does to the view →</a></div>';
  el.style.display='block';el.innerHTML=s;
}
// The transport wind belongs to the chosen night, so it is re-fetched when the date changes.
function loadHazeWind(){
  if(!window.Haze||!window.Haze.fetchTransport)return;
  const dp=document.getElementById('datePick');const dv=(dp&&dp.value)||window.Haze.localDateISO();
  if(HAZEWINDKEY===dv)return;HAZEWINDKEY=dv;HAZEWIND=null;
  window.Haze.fetchTransport(dv,21).then(function(w){if(HAZEWINDKEY===dv){HAZEWIND=w;renderHaze();}}).catch(function(){HAZEWINDKEY='';});
}
async function loadPSI(){
  const el=document.getElementById('haze');if(!el||!window.Haze)return;
  if(Date.now()-PSIAT<15*60000)return;
  // The multi-night outlook, hourly at most. Deliberately NOT inside the try below:
  // it must still arrive when the NEA feed is down, because a future date depends on it.
  if(Date.now()-HAZEFCAT>60*60000){HAZEFCAT=Date.now();
    window.Haze.fetchForecast(7).then(function(h){
      HAZEFC=window.Haze.nightlyFromForecast(h);HAZEFCTS=Date.now();
      renderHaze();renderTargets();renderGlance();loadSeeing(false);renderDataHealth();
    }).catch(function(){HAZEFCAT=0;renderDataHealth();});
  }
  loadHazeWind();
  try{
    const d=await window.Haze.fetchNow();
    PSIAT=Date.now();HAZETS=Date.now();HAZEERR=false;
    const R=window.Haze.HOME_REGION;
    const psi=(d.psi&&typeof d.psi[R]==='number')?d.psi[R]:null;
    const pm=(d.pm&&typeof d.pm[R]==='number')?d.pm[R]:null;
    PSIVAL=psi;
    PM25VAL=(pm!=null)?pm:(psi!=null?window.Haze.pm25FromPSI(psi):null);
    HAZE={psi:psi,pm:pm,all:d};
    renderHaze();renderTargets();renderGlance();renderDataHealth();
    // the day's readings are a second, cheap call — it only adds the trend arrow
    window.Haze.fetchTrend('pm25',R).then(function(sr){
      HAZETREND=window.Haze.trendOf(sr,3);renderHaze();}).catch(function(){});
  }catch(e){
    HAZEERR=true;PSIAT=Date.now()-13*60000;   // retry in ~2 min rather than 15
    renderHaze();renderDataHealth();
  }
}
// v3.15: printable talking-point cards for tonight's showpieces (makes the briefing a full session pack)
function objectCardsHTML(){
  if(!GL||!window.Astro)return'';
  const cs=new Date(Date.UTC(GL.y,GL.m,GL.d,GL.hh-8,GL.mm,0));
  const all=window.Astro.SHOWPIECES.concat(window.Astro.activeComets?window.Astro.activeComets(cs):[]);
  const up=[];
  all.forEach(sp=>{const p=window.Astro.positionOf(sp,cs);const minA=(sp.kind==='moon'||sp.kind==='planet')?5:12;if(p.alt>minA)up.push({sp:sp,alt:p.alt});});
  up.sort((a,b)=>b.alt-a.alt);const pick=up.slice(0,10);
  if(!pick.length)return'<p>No showpieces above the horizon at the chosen time — pick an evening time first.</p>';
  return '<div class="bfcards">'+pick.map(u=>{const sp=u.sp;
    return '<div class="bfcard"><div class="bfic">'+window.Astro.illus(sp,54)+'</div><div><b>'+sp.name+'</b>'
      +'<div class="bfblurb">'+(sp.blurb||'')+'</div>'
      +'<div class="bflook">👀 '+(sp.look||'')+'</div>'
      +'<div class="bfscope">🔭 '+(sp.scope||'')+'</div></div></div>';
  }).join('')+'</div>';
}
function buildBriefing(){
  if(!GL)return;const q=id=>{const e2=document.getElementById(id);return e2?e2.textContent.trim():'';};
  const y=GL.y,m=GL.m,d=GL.d,hh=GL.hh,mm=GL.mm,st=sunTimes(y,m,d);
  let planets='';document.querySelectorAll('#solar .srow').forEach(r=>{
    const c1=r.querySelector('.snm'),c2=r.querySelector('.sval'),c3=r.querySelector('.smag'),c4=r.querySelector('.tag');
    planets+='<tr><td>'+(c1?c1.textContent:'')+'</td><td>'+(c2?c2.textContent:'')+'</td><td>'+(c3?c3.textContent:'')+'</td><td>'+(c4?c4.textContent:'')+'</td></tr>';});
  let targs='',n=0;
  document.querySelectorAll('#targets .tcard').forEach(t=>{if(n>=10)return;n++;
    targs+='<tr><td>'+t.querySelector('.tname').textContent+'</td><td>'+t.querySelector('.tsub').textContent+'</td><td>'+(t.querySelector('.tag')?t.querySelector('.tag').textContent:'')+'</td><td>'+Array.prototype.map.call(t.querySelectorAll('.chip'),c=>c.textContent).join(' · ')+'</td></tr>';});
  let dbls='';document.querySelectorAll('#doubles .tcard').forEach(t=>{
    dbls+='<tr><td>'+t.querySelector('.tname').textContent+'</td><td>'+(t.querySelector('.tag')?t.querySelector('.tag').textContent:'')+'</td><td>'+Array.prototype.map.call(t.querySelectorAll('.chip'),c=>c.textContent).join(' · ')+'</td></tr>';});
  const gv=document.querySelector('#glance .gv');
  const part=id=>{const e2=document.getElementById(id);return e2?e2.innerHTML:'';};
  document.getElementById('briefing').innerHTML=
    '<h1>🔭 SCOB Night-Sky Session Pack</h1>'
    +'<div class="sub">Science Centre Observatory, Jurong · <b>'+dateLabel(y,m,d)+'</b> · session 7:30–10:00 pm SGT · positions shown for '+timeLabel(hh,mm)+'</div>'
    +'<h2>Tonight at a glance</h2><p>'+(gv?gv.textContent:'—')+'<br>🌇 Sunset <b>'+(st.set||'—')+'</b> · 🌌 Fully dark <b>'+(st.dark||'—')+'</b> · 🌅 Sunrise <b>'+(st.rise||'—')+'</b></p>'
    +'<h2>Sky map at '+timeLabel(hh,mm)+' <span style="font-weight:400;font-size:11px;color:#5a6480">(N top, E left · constellations shown)</span></h2><div class="bfmap">'+(document.getElementById('skymap')?document.getElementById('skymap').innerHTML:'')+'</div>'
    +'<h2>Weather</h2><p>'+q('weatherNote')+'</p>'+(q('haze')?'<p>'+q('haze')+'</p>':'')
    +'<h2>Moon</h2><p><b>'+q('moonPct')+' lit — '+q('moonName')+'</b> · '+q('moonRS')+'<br>'+q('moonNote')+'</p>'
    +'<h2>Solar system at '+timeLabel(hh,mm)+'</h2><table><tr><th>Object</th><th>Alt · direction</th><th>Mag</th><th>Verdict</th></tr>'+planets+'</table>'
    +'<h2>Jupiter &amp; Saturn in the eyepiece</h2>'+part('planetDetail')
    +'<h2>Top deep-sky targets ('+(currentMode==='seestar'?'Seestar S30 imaging':'visual')+')</h2>'+(targs?'<table><tr><th>Target</th><th>Type</th><th>Verdict</th><th>Alt · dir · mag · Moon sep</th></tr>'+targs+'</table>':'<p>Sky not dark at the chosen time — pick an evening time first.</p>')
    +(dbls?'<h2>Double &amp; carbon stars — moon-proof</h2><table><tr><th>Star</th><th>Verdict</th><th>Alt · dir · mags · sep</th></tr>'+dbls+'</table>':'')
    +'<h2>Conjunctions &amp; special events — next 3 weeks</h2>'+part('conj')+part('events')
    +'<h2>Satellite passes — ISS · Tiangong · Hubble (7–11 pm)</h2>'+part('iss')
    +'<h2>Suggested session run-sheet</h2>'+part('plan')
    +'<h2>Object cards — tonight&rsquo;s showpieces</h2>'+objectCardsHTML()
    +'<div class="src">Sources: deep-sky catalogue — AstroPixels Messier &amp; Caldwell catalogs (F. Espenak) · planetary orbital elements — P. Schlyter · Jupiter/Saturn physical ephemeris — J. Meeus, Astronomical Algorithms · GRS longitude — JUPOS trend · double/carbon star data — WDS &amp; SIMBAD (compiled) · weather &amp; rain radar — Open-Meteo &amp; MSS weather.gov.sg · seeing — estimated from Open-Meteo upper-air winds · light-pollution realism — Bortle scale · haze — NEA via data.gov.sg, column depth &amp; outlook from Open-Meteo air quality · sky events — Sea &amp; Sky astronomy calendar (seasky.org) · ISS/Tiangong/Hubble orbits — CelesTrak TLEs, propagated on-device with satellite.js · Science Centre Observatory, Singapore. · SCOB Night-Sky '+window.SCOB_VERSION+' · '+window.SCOB_COPYRIGHT+'</div>';
}
(function(){
  const bBtn=document.getElementById('briefBtn'),bW=document.getElementById('briefWrap');
  if(bBtn&&bW){
    bBtn.addEventListener('click',()=>{buildBriefing();bW.style.display='block';document.body.classList.add('briefing-open');});
    document.getElementById('briefClose').addEventListener('click',()=>{bW.style.display='none';document.body.classList.remove('briefing-open');});
    document.getElementById('briefPrint').addEventListener('click',()=>window.print());
  }
  const wb=document.getElementById('wxBtn');if(wb)wb.addEventListener('click',()=>{PSIAT=0;loadPSI();RADAT=0;loadRadar();NCAT=0;loadNowcast();loadAllSky();});
})();

// ==== v3.36: "tonight in one line" shareable blurb (WhatsApp/Facebook) ====
function _joinAnd(a){if(a.length<=1)return a[0]||'';if(a.length===2)return a[0]+' and '+a[1];return a.slice(0,-1).join(', ')+' and '+a[a.length-1];}
function _moonWord(){var p=(typeof pct==='number'?pct:0);if(p<5)return'new';if(p<45)return'crescent';if(p<=60)return'half';if(p<95)return'gibbous';return'full';}
function tonightBlurb(){
  if(!GL)return '';
  var y=GL.y,m=GL.m,d=GL.d,dS=GL.dS,sLon=GL.sLon,sR=GL.sR;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var wd=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(Date.UTC(y,m,d)).getUTCDay()];
  var whenWord=(wd==='Friday')?'this Friday':('on '+wd);
  var dateShort=d+' '+MON[m];
  var sights=[];
  ['Saturn','Jupiter','Venus','Mars'].forEach(function(nm){var pe=planetEq(PLAN[nm],dS,sLon,sR);var aa=altaz(pe.ra,pe.dec);if(aa.alt>12)sights.push(nm);});
  var ma=altaz(MOONEQ.ra,MOONEQ.dec);
  if(ma.alt>10&&(typeof pct==='number'?pct:0)>=30)sights.push('the '+_moonWord()+' Moon');
  if(GL.sunAlt<-6&&sights.length<2){
    // v4.13: carry the magnitude so the haze / limiting-magnitude check can run, and
    // prefer something a visitor can actually enjoy — the old pick was simply the
    // highest object in the catalogue, which could be a magnitude-9 globular.
    var rows=CAT.map(function(t){var a=altaz(t[3],t[4]);return{name:t[0],alt:a.alt,sep:moonSep(t[3],t[4]),cls:t[5],mag:t[6]};}).filter(function(r){return r.alt>25;}).sort(function(a,b){return b.alt-a.alt;});
    var bright=rows.filter(function(r){return r.mag==null||r.mag<=7;});
    var hz0=hazeVerdict(), smoky=!!(hz0&&(hz0.cost>=1.6||(hz0.psi!=null&&hz0.psi>100)));
    var pick=smoky?null:(bright.find(function(r){return visualVerdict(r)[0]==='exc';})||bright.find(function(r){return visualVerdict(r)[0]==='good';}));
    if(pick)sights.push(pick.name.replace(/\s*\([^)]*\)/,''));
  }
  sights=sights.slice(0,3);
  var sightStr=sights.length?_joinAnd(sights):'the planets, star clusters and deep-sky wonders';
  var wx='';
  if(WXV&&WXV.cls==='ok')wx=' Clear skies are forecast, so conditions look great.';
  else if(WXV&&WXV.cls==='warn')wx=' The forecast is a little cloudy — we’ll play it by ear.';
  else if(WXV)wx=' Cloud is likely, so do check with us before heading down.';
  // v4.13: this draft used to promise "conditions look great" on any cloud-free evening,
  // haze or not. It now reads the same verdict as the headline. The health wording is
  // NEA's, kept short, and only appears when NEA's band actually carries an advisory —
  // and it is a draft: the volunteer posting it reads it first.
  var hv=hazeVerdict();
  if(hv){
    var clear=!!(WXV&&WXV.cls==='ok');
    var care=' If you are elderly, pregnant, bringing young children or have a heart or lung condition, please follow NEA’s haze advice.';
    if(hv.psi!=null&&hv.psi>200)
      wx=' The air quality is currently '+hv.band.name.toLowerCase()+' (PSI '+Math.round(hv.psi)+'), so please check with us before heading down — the session may move indoors.';
    else if(hv.psi!=null&&hv.psi>100)
      wx=clear?(' Skies are clear of cloud but hazy (PSI '+Math.round(hv.psi)+', NEA’s Unhealthy range), so we’ll concentrate on the brightest sights and keep time outdoors flexible.'+care)
              :(wx+' The air is also hazy (PSI '+Math.round(hv.psi)+', NEA’s Unhealthy range).'+care);
    else if(hv.cost>=1.6){
      var how=(hv.mode==='forecast')?'forecast':'about';
      wx=clear?(' Skies should be clear of cloud, but thick haze is '+how+', so the faint sights will be dimmed — the Moon, planets and bright stars will still show well.')
              :(wx+' Thick haze is also '+how+', so expect the Moon, planets and bright stars rather than the faint sights.');
    }
    else if(hv.cost>=0.8&&clear)
      wx=' Skies should be clear of cloud, though a little hazy.';
    // v4.14: the session is a day or two away and the air is bad today — say so.
    if(hv.now&&wx.indexOf('conditions look great')>=0)wx=' Clear skies are forecast.';
    if(hv.now)
      wx+=' The air quality is '+hv.now.band.name.toLowerCase()+' right now (PSI '+Math.round(hv.now.psi)+'), so please check NEA’s haze advisory and check with us on the day before heading down.'
         +(wx.indexOf('NEA’s haze advice')<0?care:'');
  }
  // "just turn up" contradicts any sentence above that asks people to check first.
  var asks=/check with us|check NEA/.test(wx);
  return '🔭 Stargazing at the Science Centre Observatory '+whenWord+' ('+dateShort+'), 7:30–10:00 pm.'+wx+
    ' Come look through our telescopes at '+sightStr+'. All ages welcome'+(asks?'.':' — just turn up.')+' 🌌';
}
(function(){
  var wrap=document.getElementById('shareWrap');
  function open(){var ta=document.getElementById('shareText');if(ta)ta.value=tonightBlurb();
    var h=document.getElementById('shareHint');if(h)h.textContent='';
    var nat=document.getElementById('shareNative');if(nat)nat.hidden=!(navigator.share);
    if(wrap){wrap.classList.add('open');wrap.setAttribute('aria-hidden','false');}}
  function close(){if(wrap){wrap.classList.remove('open');wrap.setAttribute('aria-hidden','true');}}
  var sb=document.getElementById('shareBtn');if(sb)sb.addEventListener('click',open);
  var sc=document.getElementById('shareClose');if(sc)sc.addEventListener('click',close);
  if(wrap)wrap.addEventListener('click',function(e){if(e.target===wrap)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&wrap&&wrap.classList.contains('open'))close();});
  function legacyCopy(ta){try{ta.focus();ta.select();document.execCommand('copy');ta.setSelectionRange(0,0);ta.blur();}catch(e){}}
  var cp=document.getElementById('shareCopy');
  if(cp)cp.addEventListener('click',function(){
    var ta=document.getElementById('shareText'),h=document.getElementById('shareHint');if(!ta)return;var t=ta.value;
    function done(){if(h)h.textContent='📋 Copied — paste it into WhatsApp, Telegram or Facebook.';}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(function(){legacyCopy(ta);done();});
    else{legacyCopy(ta);done();}
  });
  var nat=document.getElementById('shareNative');
  if(nat)nat.addEventListener('click',function(){var ta=document.getElementById('shareText');if(navigator.share&&ta)navigator.share({text:ta.value}).catch(function(){});});
})();

// ==== v3.36: dismissible "what's new" line for returning volunteers ====
(function(){
  var VER=window.SCOB_VERSION||'';
  var WHATSNEW='A full accuracy check of the site’s data against JPL, NASA and the major star catalogues. Corrected: 14 deep-sky positions and magnitudes, 28 stars in the sky-culture figures that were drawn in the wrong place (and six labelled as the wrong star), ten event dates (now all Singapore dates), and the eclipse list — including a partial lunar eclipse on 7 July 2028 that we can actually see.';
  var seen='';try{seen=localStorage.getItem('scobSeenVer')||'';}catch(e){}
  if(seen===VER)return;
  var g=document.getElementById('glance');if(!g||!g.parentNode)return;
  var bar=document.createElement('div');bar.className='whatsnew';
  bar.innerHTML='<span>✨ <b>New in '+VER+':</b> '+WHATSNEW+' <a href="#" id="wnMore">Open the menu ☰</a></span><button type="button" class="wnx" id="wnX" aria-label="Dismiss">✕</button>';
  g.parentNode.insertBefore(bar,g.nextSibling);
  function dismiss(){try{localStorage.setItem('scobSeenVer',VER);}catch(e){}if(bar.parentNode)bar.parentNode.removeChild(bar);}
  var x=bar.querySelector('#wnX');if(x)x.addEventListener('click',dismiss);
  var more=bar.querySelector('#wnMore');if(more)more.addEventListener('click',function(e){e.preventDefault();
    var dr=document.getElementById('navDrawer'),bd=document.getElementById('navBackdrop');
    if(dr){dr.classList.add('open');dr.setAttribute('aria-hidden','false');}if(bd)bd.style.display='block';dismiss();});
})();
// ==== v3.7: seeing/transparency · light-pollution realism · observing windows · live Now · data-health ====
function lpLimitMag(){return BORTLE>=9?8.5:(BORTLE>=8?9.5:10.5);}
// v3.86: dynamic limiting magnitude — the Bortle "clear, moonless" scope limit, reduced live for
// the Moon (illuminated fraction × how high it is) and for haze (live west 24-h PSI). Feeds the
// visual deep-sky verdicts and shows as a glance figure. Deliberately a rough estimate, not photometry.
function dynLimitMag(alt){
  const base=lpLimitMag();
  let moon=0;
  if(typeof MOONALT==='number'&&MOONALT>0) moon=(illum||0)*Math.sin(MOONALT*RAD)*2.2; // up to ~2.2 mag, high full Moon
  // Haze: the shared model in haze-core.js. v4.08 drove it from the ground PM2.5 alone;
  // v4.13 adds the whole-column optical depth (smoke in transit rides above the sensor)
  // and takes an altitude, so a caller can ask about one target rather than "a typical
  // one". With no altitude it answers for 60°, which is what the glance figure quotes.
  let haze=0;const hc=hazeCostAt(alt==null?60:alt);
  if(hc)haze=Math.min(4,hc.total);
  return {base:base,moon:moon,haze:haze,hc:hc,mag:Math.max(3.5,base-moon-haze)};
}

// ---- observing windows within the session ----
function altAtMin(ra,dec,y,m,d,t){const dt=new Date(Date.UTC(y,m,d,Math.floor(t/60)-8,t%60,0));
  const J=jd(dt),lst=rev(280.46061837+360.98564736629*(J-2451545.0)+LON);
  const H=(lst-ra)*RAD,dr=dec*RAD,l=LAT*RAD;
  return Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;}
function darkStartMin(y,m,d){for(let t=18*60;t<=21*60;t+=5){const dt=new Date(Date.UTC(y,m,d,Math.floor(t/60)-8,t%60,0));if(sunAltAt(dt)<-12)return t;}return 20*60;}
function fmtMin(t){t=((t%1440)+1440)%1440;return timeLabel(Math.floor(t/60),t%60);}
function targetWindow(ra,dec,s,e){let from=null,to=null,best=s,bmax=-90;
  for(let t=s;t<=e;t+=10){const a=altAtMin(ra,dec,GL.y,GL.m,GL.d,t);if(a>bmax){bmax=a;best=t;}if(a>=25){if(from==null)from=t;to=t;}}
  if(from==null)return{none:true,best,bmax};return{from,to,best,bmax};}

// ---- seeing & transparency (v4.13: estimated from the forecast's upper-air fields) ----
// Until v4.12 this asked 7Timer! for an astronomical-seeing forecast and fell back to a
// "weather estimate" from surface wind when that failed. 7Timer sends no CORS header, so
// from a browser it ALWAYS failed — the fallback was the only path that ever ran, and it
// was grading the steadiness of the air from the breeze on the deck (2 km/h -> "good"),
// which says almost nothing about seeing.
// Seeing is made by turbulence, and turbulence is made by three things the forecast we
// already download can speak to: wind at jet level, shear in the lowest kilometre or two,
// and convection (CAPE) — the last one mattering most in the tropics, where the jet is
// usually weak but the evening air is still turning over after a hot day.
// This is a heuristic with hand-set weights, NOT a seeing monitor. It names its biggest
// driver so a volunteer can judge it against what the eyepiece shows, and the session
// logbook is the place to calibrate it.
// v4.15: the formula moved to seeing-core.js so the session logbook records the very
// same prediction it is later graded against. This wrapper keeps the old name.
function seeingEstimate(v250,v850,v10,cape){return window.Seeing?window.Seeing.estimate(v250,v850,v10,cape):null;}
async function loadSeeing(force){
  const el=document.getElementById('seeing');if(!el)return;
  const dv=document.getElementById('datePick').value,tv=document.getElementById('timePick').value;if(!dv||!tv)return;
  const tp=tv.split(':').map(Number);
  if(!(WXCACHE&&WXCACHE.date===dv)){el.style.display='none';SEEREAD=null;return;}
  const h=WXCACHE.hourly;let i=h.time.indexOf(dv+'T'+pad(tp[0])+':00');if(i<0)i=Math.min(tp[0],h.time.length-1);
  const cc=h.cloud_cover[i],rh=h.relative_humidity_2m[i],ws=h.wind_speed_10m[i];
  if(cc==null){el.style.display='none';SEEREAD=null;return;}
  const at=function(k){return (h[k]&&typeof h[k][i]==='number')?h[k][i]:null;};
  const se=seeingEstimate(at('wind_speed_250hPa'),at('wind_speed_850hPa'),ws,at('cape'));
  // Transparency now counts haze as well as cloud and humidity — smoke is the one
  // thing that can ruin it on a cloudless, dry night.
  const hc=hazeCostAt(60),hz=hc?hc.total:0;
  const tr=(cc>=50||rh>=88||hz>=1.6)?['bad','poor']:(cc>=20||rh>=75||hz>=0.6)?['warn','fair']:['ok','good'];
  const trSub='cloud '+cc+'% · RH '+rh+'%'+(hz>=0.25?' · haze −'+hz.toFixed(1)+' mag':'');
  let html;
  if(se){
    SEEREAD={label:se.label,cls:se.cls,src:'upper-air wind estimate',arc:'~'+se.arc.toFixed(1)+'″',driver:se.driver};
    html='<div class="seehead">🔭 Seeing &amp; transparency <span style="opacity:.7;font-weight:400">· estimated from upper-air winds</span></div>'
      +'<div class="seegrid"><div class="seecell"><div class="k">Seeing</div><div class="v '+se.cls+'">'+se.label+'</div><div class="s">~'+se.arc.toFixed(1)+'″ at high power</div></div>'
      +'<div class="seecell"><div class="k">Transparency</div><div class="v '+tr[0]+'">'+tr[1]+'</div><div class="s">'+trSub+'</div></div></div>'
      +'<div class="wxsrc"><b style="color:var(--white)">Driven by:</b> '+se.driver+'. Seeing (steadiness) governs how much planetary &amp; double-star detail holds at high power; transparency governs how faint the deep sky reaches. An estimate from the Open-Meteo forecast — jet-level wind, low-level shear and convection — not a seeing monitor: trust the eyepiece over it.</div>';
  } else {
    const st=(ws<12)?['ok','good']:(ws<22)?['warn','fair']:['bad','poor'];
    SEEREAD={label:st[1],cls:st[0],src:'surface wind only',arc:null};
    html='<div class="seehead">🔭 Seeing &amp; transparency <span style="opacity:.7;font-weight:400">· surface wind only</span></div>'
      +'<div class="seegrid"><div class="seecell"><div class="k">Steadiness</div><div class="v '+st[0]+'">'+st[1]+'</div><div class="s">wind '+Math.round(ws)+' km/h</div></div>'
      +'<div class="seecell"><div class="k">Transparency</div><div class="v '+tr[0]+'">'+tr[1]+'</div><div class="s">'+trSub+'</div></div></div>'
      +'<div class="wxsrc">The forecast carried no upper-air winds for this hour, so steadiness is guessed from the surface breeze alone — a weak proxy. Treat it as a placeholder.</div>';
  }
  el.style.display='block';el.innerHTML=html;
  renderGlance();renderPlanetDetail();renderPlan();   // surface the seeing read in the glance, run-sheet & planet detail
}

// ---- data-health indicator ----
function timeAgo(ms){if(!ms)return '';const mi=Math.round(Math.max(0,Date.now()-ms)/60000);if(mi<1)return 'just now';if(mi<60)return mi+' min';const h=Math.round(mi/60);if(h<48)return h+' h';return Math.round(h/24)+' days';}
function renderDataHealth(){
  const el=document.getElementById('dataHealth');if(!el)return;
  const parts=[];let worst='ok';const bump=c=>{if(c==='bad')worst='bad';else if(c==='warn'&&worst==='ok')worst='warn';};
  if(WXTS){const mins=(Date.now()-WXTS)/60000,c=mins>180?'bad':(mins>60?'warn':'ok');bump(c);const w=timeAgo(WXTS);parts.push('<span class="dh '+c+'" title="How long since the live weather forecast was fetched">weather forecast: '+(w==='just now'?'up to date':w+' old')+'</span>');}
  else{bump('warn');parts.push('<span class="dh warn" title="The live weather forecast hasn\'t loaded yet — pick a date within the next ~16 days, or check your connection">weather forecast: not loaded yet</span>');}
  let tleTs=0;try{const c=JSON.parse(localStorage.getItem('scobTLE_25544')||'null');if(c)tleTs=c.ts;}catch(e){}
  if(tleTs){const days=(Date.now()-tleTs)/86400000,c=days>4?'warn':'ok';bump(c);const o=timeAgo(tleTs);parts.push('<span class="dh '+c+'" title="Age of the satellite orbital data (CelesTrak) used to predict the ISS/Tiangong/Hubble passes. Good for a few days.">satellite pass data: '+(o==='just now'?'fresh':o+' old')+'</span>');}
  else{bump('warn');parts.push('<span class="dh warn" title="Needs a connection once to download satellite orbits from CelesTrak for pass predictions">satellite pass data: not fetched</span>');}
  // v4.08: the haze feed used to fail silently — the limiting magnitude simply lost its
  // haze term with nothing on screen to say so. Now its freshness shows up here.
  if(HAZETS){const hm=(Date.now()-HAZETS)/60000,hc=hm>90?'warn':'ok';bump(hc);const ha=timeAgo(HAZETS);
    parts.push('<span class="dh '+hc+'" title="Age of the live NEA haze reading (24-hour PSI and 1-hour PM2.5) behind the transparency penalty and the session call">haze reading: '+(ha==='just now'?'up to date':ha+' old')+'</span>');}
  else{bump('warn');
    parts.push('<span class="dh warn" title="The live NEA haze reading has not loaded — tonight\'s limiting magnitude is being estimated with no haze penalty at all">haze reading: not loaded</span>');}
  // v4.15: two more sources that can fail quietly. Since v4.13 every future-date haze
  // verdict comes from the air-quality model — if it fails to load, those dates simply
  // get no haze penalty, which reads exactly like clean air. And seeing has a fallback
  // (surface wind) that is much cruder than the upper-air estimate. Show both.
  if(HAZEFCTS){const fm=(Date.now()-HAZEFCTS)/60000,fcl=fm>180?'warn':'ok';bump(fcl);
    const last=(HAZEFC||[]).filter(function(n){return n.pm25!=null||n.aod!=null;}).map(function(n){return n.date;}).pop();
    const lastTxt=last?(function(){const p=last.split('-').map(Number);return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()]+' '+p[2]+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p[1]-1];})():'';
    parts.push('<span class="dh '+fcl+'" title="The air-quality model (Open-Meteo / CAMS) behind the haze verdict for any date other than tonight. Dates past its last night get no haze figure at all — not a clean one.">haze forecast: '+(fm<2?'up to date':timeAgo(HAZEFCTS)+' old')+(lastTxt?' · to '+lastTxt:'')+'</span>');}
  else if(HAZEFCAT===0){bump('warn');
    parts.push('<span class="dh warn" title="The air-quality model has not loaded — future dates are being judged with no haze penalty, which looks the same as clean air. Tonight still uses the live NEA reading.">haze forecast: not loaded</span>');}
  if(SEEREAD){const sc=(SEEREAD.src==='upper-air wind estimate')?'ok':'warn';bump(sc);
    parts.push('<span class="dh '+sc+'" title="Where the seeing estimate comes from. The upper-air estimate uses the 250 hPa jet, low-level wind shear and CAPE; the fallback uses the surface wind alone and is much cruder.">seeing: '+(sc==='ok'?'upper-air winds':'surface-wind fallback')+'</span>');}
  const dleft=(Date.UTC(2027,0,1)-Date.now())/86400000,gc=dleft<0?'bad':(dleft<45?'warn':'ok');bump(gc);
  parts.push('<span class="dh '+gc+'" title="The Jupiter Great Red Spot transit-timing model has a built-in review date so it gets re-fitted before it drifts.">Jupiter red-spot model: '+(dleft<0?'due for review':'good to Jan 2027')+'</span>');
  el.style.display='flex';
  el.title='How fresh the live data is — the weather forecast, the satellite orbit data for pass predictions, the live NEA haze reading, the haze forecast, the source of the seeing estimate, and the Jupiter Great Red Spot timing model. Green means current.';
  el.innerHTML='<span class="dhlabel '+worst+'">🩺 Live-data freshness</span> '+parts.join(' ');
}

// ---- live "Now" session screen ----
function skyAtFull(y,m,d,hh,mm){
  const dt=new Date(Date.UTC(y,m,d,hh-8,mm,0));const J=jd(dt),dS=J-2451543.5;
  const lstv=rev(280.46061837+360.98564736629*(J-2451545.0)+LON);
  const aa=(ra,dec)=>{const H=(lstv-ra)*RAD,dr=dec*RAD,l=LAT*RAD;
    const alt=Math.asin(Math.sin(dr)*Math.sin(l)+Math.cos(dr)*Math.cos(l)*Math.cos(H))*DEG;
    let az=Math.atan2(-Math.cos(dr)*Math.sin(H),Math.sin(dr)*Math.cos(l)-Math.cos(dr)*Math.sin(l)*Math.cos(H))*DEG;
    return{alt,az:rev(az)};};
  const s=sun(dS),seq=eclToEq(s.lon,0,dS),sa=aa(seq.ra,seq.dec).alt;
  const mo=moon(dS),meq=eclToEq(mo.lon,mo.lat,dS),ma=aa(meq.ra,meq.dec);
  const pls=[];for(const nm of Object.keys(PLAN)){const pe=planetEq(PLAN[nm],dS,s.lon,s.r);const a2=aa(pe.ra,pe.dec);pls.push({name:nm,alt:a2.alt,az:a2.az,mag:pe.mag});}
  const tg=CAT.map(t=>{const a2=aa(t[3],t[4]);return{name:t[0],type:t[1],alt:a2.alt,az:a2.az,cls:t[5],mag:t[6]};}).filter(r=>r.alt>15).sort((a2,b2)=>b2.alt-a2.alt);
  return{sunAlt:sa,moonAlt:ma.alt,moonAz:ma.az,planets:pls,targets:tg};}
let NOWTIMER=0;
function renderNow(){
  const body=document.getElementById('nowBody');if(!body)return;
  const n=sgtNow();const sk=skyAtFull(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes());
  const dark=sk.sunAlt<-6;const picks=[];
  if(sk.moonAlt>8)picks.push(['🌙 Moon','Deck Celestron CPC / C6',Math.round(sk.moonAlt)+'° '+compass(sk.moonAz),'Terminator craters — fast, queue-friendly for the public line.']);
  else{const bp=sk.planets.filter(p=>p.alt>12&&['Venus','Jupiter','Saturn','Mars','Mercury'].indexOf(p.name)>=0).sort((a,b)=>a.mag-b.mag)[0];
    if(bp)picks.push(['🪐 '+bp.name,'Deck Celestron CPC / C6',Math.round(bp.alt)+'° '+compass(bp.az),'Bright & easy — good for the queue.']);}
  const bpl=sk.planets.filter(p=>p.alt>15&&['Jupiter','Saturn','Mars','Venus'].indexOf(p.name)>=0).sort((a,b)=>a.mag-b.mag)[0];
  if(bpl)picks.push(['🪐 '+bpl.name,'40 cm main dome · high power',Math.round(bpl.alt)+'° '+compass(bpl.az),bpl.name==='Jupiter'?'Belts, the Great Red Spot & Galilean moons.':bpl.name==='Saturn'?'Rings & the Cassini division.':'Maximum detail in the big scope.']);
  if(dark){const gc=sk.targets.find(t=>/Globular|cluster/i.test(t.type)&&t.alt>25)||sk.targets.find(t=>/Double/i.test(t.type)&&t.alt>25);
    if(gc)picks.push(['✨ '+gc.name,'40 cm + 6" apo',Math.round(gc.alt)+'° '+compass(gc.az),'Resolves to the core at high power.']);}
  if(dark){const em=sk.targets.find(t=>t.cls==='emission'&&t.alt>20);
    if(em)picks.push(['📷 '+em.name,'Seestar S30 Pro · dual-band',Math.round(em.alt)+'° '+compass(em.az),'Hα/OIII filter cuts through the moonlight.']);}
  let html='<div class="nowhdr"><div class="nowclock">'+timeLabel(n.getHours(),n.getMinutes())+' SGT</div><div class="nowsub">'+(dark?'Dark sky · Moon '+pct+'% lit':'Sky still bright · Moon '+pct+'% lit')+'</div></div>';
  if(!picks.length)html+='<div class="nowcard"><div class="nwtarget">Nothing well placed yet</div><div class="nwd">Run a sky tour / constellation talk until the targets climb higher.</div></div>';
  else html+=picks.map(p=>'<div class="nowcard"><div class="nwtarget">'+p[0]+'</div><div class="nwpos">'+p[2]+'</div><div class="nwinst">'+p[1]+'</div><div class="nwd">'+p[3]+'</div></div>').join('');
  html+='<div class="nowfoot">Live — refreshes every 30 s from this device’s clock. Tap ✕ to close.</div>';
  body.innerHTML=html;}
function openNow(){const w=document.getElementById('nowWrap');if(!w)return;renderNow();w.style.display='block';document.body.classList.add('now-open');clearInterval(NOWTIMER);NOWTIMER=setInterval(renderNow,30000);}
function closeNow(){const w=document.getElementById('nowWrap');if(!w)return;w.style.display='none';document.body.classList.remove('now-open');clearInterval(NOWTIMER);}
(function(){
  const lps=document.getElementById('lpSel');
  if(lps){lps.value=String(BORTLE);lps.addEventListener('change',()=>{BORTLE=+lps.value||8;try{localStorage.setItem('scobBortle',BORTLE);}catch(e){}renderTargets();renderGlance();});}
  const lnb=document.getElementById('liveNowBtn');if(lnb)lnb.addEventListener('click',openNow);
  const nc=document.getElementById('nowClose');if(nc)nc.addEventListener('click',closeNow);
  const dcont=document.getElementById('doubles');if(dcont)dcont.addEventListener('click',function(e){const card=e.target.closest('.tcard[data-ra]');if(card)locateObj(card.getAttribute('data-nm'),'double',+card.getAttribute('data-ra'),+card.getAttribute('data-dec'));});
  const stog=document.getElementById('satToggle');if(stog){stog.checked=SATSHOW;stog.addEventListener('change',function(){SATSHOW=stog.checked;try{localStorage.setItem('scobSatShow',SATSHOW?'1':'0');}catch(e){}if(GL)renderSkyMap(GL.dS,GL.sLon,GL.sR);});}
  const ctog=document.getElementById('constToggle');if(ctog){ctog.checked=CONSTSHOW;ctog.addEventListener('change',function(){CONSTSHOW=ctog.checked;try{localStorage.setItem('scobConstShow',CONSTSHOW?'1':'0');}catch(e){}if(GL)renderSkyMap(GL.dS,GL.sLon,GL.sR);});}
  const drawer=document.getElementById('navDrawer'),bd=document.getElementById('navBackdrop');
  function openMenu(){if(drawer){drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');}if(bd)bd.style.display='block';}
  function closeMenu(){if(drawer){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}if(bd)bd.style.display='none';}
  document.querySelectorAll('.js-menu').forEach(function(b){b.addEventListener('click',openMenu);});
  const ncl=document.getElementById('navClose');if(ncl)ncl.addEventListener('click',closeMenu);
  if(bd)bd.addEventListener('click',closeMenu);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var f=document.getElementById('navFilter');if(f&&f.value){f.value='';if(window.applyNavFilter)window.applyNavFilter();return;}closeMenu();}});

  // ---- v3.35: collapsible menu sections + filter ----
  (function(){
    if(!drawer)return;
    var secs=[].slice.call(drawer.querySelectorAll('.ndsec'));
    var DEFAULT_OPEN=['session'];               // the group a docent needs mid-session
    var open={};
    try{var saved=localStorage.getItem('scobNavOpen');
        if(saved!==null){saved.split(',').forEach(function(k){if(k)open[k]=1;});}
        else DEFAULT_OPEN.forEach(function(k){open[k]=1;});
    }catch(e){DEFAULT_OPEN.forEach(function(k){open[k]=1;});}
    function persist(){try{localStorage.setItem('scobNavOpen',Object.keys(open).join(','));}catch(e){}}
    function apply(){secs.forEach(function(sec){
      var k=sec.getAttribute('data-sec'),on=!!open[k];
      sec.classList.toggle('open',on);
      var btn=sec.querySelector('.ndgroup');if(btn)btn.setAttribute('aria-expanded',on?'true':'false');
    });}
    secs.forEach(function(sec){
      var btn=sec.querySelector('.ndgroup'),k=sec.getAttribute('data-sec');
      if(btn)btn.addEventListener('click',function(){
        if(drawer.classList.contains('filtering'))return;   // headers inert while filtering
        if(open[k])delete open[k];else open[k]=1;persist();apply();
      });
    });
    apply();
    // filter box: live-hide non-matching links; show only sections with a hit
    var fin=document.getElementById('navFilter'),empty=document.getElementById('navEmpty');
    function applyNavFilterInner(){
      var q=(fin&&fin.value||'').trim().toLowerCase();
      drawer.classList.toggle('filtering',q.length>0);
      var anyGlobal=false;
      secs.forEach(function(sec){
        var links=[].slice.call(sec.querySelectorAll('a')),anyHit=false;
        links.forEach(function(a){
          var hit=!q||a.textContent.toLowerCase().indexOf(q)>=0;
          a.classList.toggle('ndhide',!hit);if(hit)anyHit=true;
        });
        sec.classList.toggle('ndhide',q.length>0&&!anyHit);
        if(anyHit)anyGlobal=true;
      });
      if(empty)empty.hidden=!(q.length>0&&!anyGlobal);
    }
    window.applyNavFilter=applyNavFilterInner;   // reachable from the Esc handler
    if(fin)fin.addEventListener('input',applyNavFilterInner);
  })();
  const a11yBtn=document.getElementById('a11yBtn');
  function applyA11y(on){document.body.classList.toggle('a11y',on);if(a11yBtn)a11yBtn.textContent='Larger text & colour-blind symbols: '+(on?'On':'Off');try{localStorage.setItem('scobA11y',on?'1':'0');}catch(e){}}
  if(a11yBtn)a11yBtn.addEventListener('click',function(){applyA11y(!document.body.classList.contains('a11y'));});
  try{applyA11y(localStorage.getItem('scobA11y')==='1');}catch(e){}
})();

// ---- v3.11: tonight's darkness-window bar ----
function crossMs(fn,thr,a,b){if((fn(a)>thr)===(fn(b)>thr))return null;for(var k=0;k<26;k++){var m=(a+b)/2;if((fn(m)>thr)===(fn(a)>thr))a=m;else b=m;}return (a+b)/2;}
function renderDarkBar(){
  const el=document.getElementById('darkbar');if(!el||!GL)return;
  const y=GL.y,m=GL.m,d=GL.d;
  const base=Date.UTC(y,m,d,10,0,0), end=base+13.5*3600000;        // 6pm → 7:30am SGT
  const sunF=t=>sunAltAt(new Date(t)), moonF=t=>moonAltAt(new Date(t));
  const sset=crossMs(sunF,-0.833,base,base+4*3600000);
  const darkS=crossMs(sunF,-18,base,base+6*3600000);
  const darkE=crossMs(sunF,-18,base+8*3600000,end);
  const srise=crossMs(sunF,-0.833,base+9*3600000,end);
  let mevs=[],prev=moonF(base);
  for(let t=base+900000;t<=end;t+=900000){let cur=moonF(t);if((prev>0)!==(cur>0)){let mm=crossMs(moonF,0,t-900000,t);if(mm!=null)mevs.push({t:mm,rise:cur>0});}prev=cur;}
  let ups=[],c=moonF(base)>0?base:null;
  mevs.forEach(ev=>{if(ev.rise)c=ev.t;else{if(c!=null){ups.push([c,ev.t]);c=null;}}});
  if(c!=null)ups.push([c,end]);
  const X=t=>Math.max(0,Math.min(300,(t-base)/(end-base)*300));
  let s='<svg viewBox="0 0 300 24" preserveAspectRatio="none" style="width:100%;height:22px;display:block;border-radius:4px">';
  s+='<rect x="0" y="2" width="300" height="18" fill="#26406f"/>';
  if(darkS!=null&&darkE!=null)s+='<rect x="'+X(darkS).toFixed(1)+'" y="2" width="'+(X(darkE)-X(darkS)).toFixed(1)+'" height="18" fill="#080e1c"/>';
  ups.forEach(iv=>{const a=Math.max(iv[0],darkS!=null?darkS:base),b=Math.min(iv[1],darkE!=null?darkE:end);if(b>a)s+='<rect x="'+X(a).toFixed(1)+'" y="2" width="'+(X(b)-X(a)).toFixed(1)+'" height="18" fill="#6a5410" opacity="0.5"/>';});
  const tick=(t,col)=>t==null?'':'<line x1="'+X(t).toFixed(1)+'" y1="0" x2="'+X(t).toFixed(1)+'" y2="22" stroke="'+col+'" stroke-width="1.4"/>';
  s+=tick(sset,'#f5c542')+tick(srise,'#f5c542')+tick(darkS,'#5bd6e0')+tick(darkE,'#5bd6e0');
  mevs.forEach(ev=>{s+=tick(ev.t,'#e8d48a');});
  const now=Date.now();if(now>=base&&now<=end)s+='<line x1="'+X(now).toFixed(1)+'" y1="0" x2="'+X(now).toFixed(1)+'" y2="22" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 2"/>';
  s+='</svg>';
  const tl=t=>{if(t==null)return '—';const dt=new Date(t+8*3600000);return timeLabel(dt.getUTCHours(),dt.getUTCMinutes());};
  let moonTxt;
  const midDark=(darkS!=null&&darkE!=null)?(darkS+darkE)/2:null;
  if(!mevs.length)moonTxt=(midDark!=null&&moonF(midDark)>0)?'🌙 Moon up all night':'🌙 Moon down — dark all night';
  else moonTxt='🌙 Moon '+mevs.map(e=>(e.rise?'rises ':'sets ')+tl(e.t)).join(', ');
  el.innerHTML=s+'<div class="dbcap">🌇 sunset '+tl(sset)+' · 🌌 astro-dark '+tl(darkS)+'–'+tl(darkE)+' · '+moonTxt+' · 🌅 sunrise '+tl(srise)+'<br><span style="opacity:.7">Gold ticks = sun up/down · cyan = full dark · amber band = Moon above horizon (washes faint objects).</span></div>';
}
function renderExtras(){renderEvents();renderConj();renderPlanetDetail();renderDoubles();renderPlan();loadISS();renderDataHealth();
  renderHaze();loadHazeWind();}   // v4.13: the haze panel follows the chosen date
loadPSI();loadRadar();loadNowcast();loadAllSky();if(ALLSKY_CAM)setInterval(loadAllSky,60000);

const f0=nextFridayYMD();
recompute(f0.y,f0.m,f0.d,20,30);
tick();setInterval(tick,1000);

if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});}
