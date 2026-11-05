/* SCOB Night-Sky — "Should I come tonight?" (v4.21)
 *
 * One plain answer for a visitor deciding, at 5 pm, whether to travel to Jurong for
 * the Friday public session (7:30–10 pm). It combines what the dashboard already
 * reads, but for the whole session rather than one chosen minute:
 *   • cloud and rain chance across 7–10 pm        (Open-Meteo, the dashboard's source)
 *   • thunderstorms in that window                 (Open-Meteo weather codes)
 *   • NEA's own 2-hour forecast for Jurong          (tonight only, from 4 pm)
 *   • haze — live NEA PSI (west) tonight, the model's PM2.5 for a later Friday
 * It never says the session is on or off: that is the observatory's call, and the
 * card always says so and points to the observatory's own page.
 *
 *   ComeTonight.render(el, lang)  — draws the card into el ('en' | 'zh' | 'ms' | 'ta')
 *   ComeTonight.check()           — Promise of the raw result (used by First Night)
 *   ComeTonight.session(now)      — which Friday the card is about
 * Works offline from the last result (kept on the device for 6 hours, labelled with its age).
 */
(function (global) {
'use strict';

var LAT = 1.3342, LON = 103.7357;
var START_H = 19.5, END_H = 22;              /* public session, SGT */
var HOURS = [19, 20, 21];                    /* forecast hours covering 7–10 pm */
var CACHE_KEY = 'scobComeTonight';
var FB = 'https://www.facebook.com/ScienceCentreObservatory/';

function pad(n) { return (n < 10 ? '0' : '') + n; }
function sgt(d) { return new Date((d ? d.getTime() : Date.now()) + 8 * 3600000); }   /* read with getUTC* */
function ymdOf(t) { return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); }

/* Tonight if it is Friday before 10 pm SGT, otherwise the next Friday. */
function session(now) {
  var t = sgt(now), dow = t.getUTCDay(), h = t.getUTCHours() + t.getUTCMinutes() / 60;
  var add = (5 - dow + 7) % 7;
  if (add === 0 && h >= END_H) add = 7;
  var d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + add));
  return { ymd: ymdOf(d), daysAhead: add, tonight: add === 0, live: add === 0 && h >= START_H, date: d };
}

/* Same thresholds as the dashboard's go/no-go (wxClass), applied to the session window. */
function cloudLevel(cc, pp) {
  if (cc <= 30 && (pp == null || pp < 30)) return 'go';
  if (cc <= 65 && (pp == null || pp < 55)) return 'maybe';
  return 'no';
}
var RANK = { go: 0, maybe: 1, no: 2 };
function worse(a, b) { return RANK[b] > RANK[a] ? b : a; }

function getJSON(u) {
  return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
/* Haze, read directly (v4.21 speed): the visitor pages need two numbers, not the whole haze
   engine (haze-core.js, 36 KB) — the west region's 24-hour PSI tonight from NEA, and the
   model's PM2.5 across 7–10 pm for a later Friday from Open-Meteo. */
function psiWestNow() {
  var urls = ['https://api-open.data.gov.sg/v2/real-time/api/psi', 'https://api.data.gov.sg/v1/environment/psi'], i = 0;
  function attempt() {
    if (i >= urls.length) return Promise.reject(new Error('no PSI'));
    return getJSON(urls[i++]).then(function (j) {
      var items = ((j && j.data) ? j.data : j || {}).items || [], it = items[items.length - 1], r = it && it.readings;
      var reg = r && (r.psi_twenty_four_hourly || r.psiTwentyFourHourly);
      if (!reg || typeof reg.west !== 'number') throw new Error('no west PSI');
      return reg.west;
    }).catch(attempt);
  }
  return attempt();
}
function pm25Forecast(ymd) {
  return getJSON('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + LAT + '&longitude=' + LON
      + '&hourly=pm2_5&timezone=Asia%2FSingapore&forecast_days=6').then(function (j) {
    var h = j && j.hourly, v = [];
    if (!h || !h.time) return null;
    HOURS.concat([22]).forEach(function (hr) { var k = h.time.indexOf(ymd + 'T' + pad(hr) + ':00'); if (k >= 0 && typeof h.pm2_5[k] === 'number') v.push(h.pm2_5[k]); });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  });
}

function check() {
  var S = session();
  var wx = getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON
      + '&hourly=cloud_cover,precipitation_probability,weather_code&timezone=Asia%2FSingapore&start_date=' + S.ymd + '&end_date=' + S.ymd)
    .then(function (j) {
      var h = j && j.hourly; if (!h || !h.time) throw new Error('no forecast');
      var cc = [], pp = [], thunder = false;
      HOURS.forEach(function (hr) {
        var i = h.time.indexOf(S.ymd + 'T' + pad(hr) + ':00'); if (i < 0) return;
        if (h.cloud_cover[i] != null) cc.push(h.cloud_cover[i]);
        if (h.precipitation_probability && h.precipitation_probability[i] != null) pp.push(h.precipitation_probability[i]);
        if (h.weather_code && h.weather_code[i] >= 95) thunder = true;
      });
      if (!cc.length) throw new Error('no session hours');
      return { cc: Math.round(cc.reduce(function (a, b) { return a + b; }, 0) / cc.length),
               pp: pp.length ? Math.max.apply(null, pp) : null, thunder: thunder };
    });
  /* NEA's own 2-hour forecast — only meaningful on the evening itself */
  var t = sgt(), nea = (S.tonight && t.getUTCHours() >= 16)
    ? getJSON('https://api.data.gov.sg/v1/environment/2-hour-weather-forecast').then(function (j) {
        var it = j && j.items && j.items[0], fc = it && it.forecasts || [];
        var f = fc.filter(function (x) { return x.area === 'Jurong West'; })[0] || fc.filter(function (x) { return x.area === 'Jurong East'; })[0];
        return f ? f.forecast : null;
      }).catch(function () { return null; })
    : Promise.resolve(null);
  var haze = S.tonight
    ? psiWestNow().then(function (v) { return { psi: v, live: true }; }).catch(function () { return null; })
    : (S.daysAhead > 4 ? Promise.resolve(null)                 /* the haze model runs ~5 days */
       : pm25Forecast(S.ymd).then(function (v) { return v == null ? null : { pm25: v, live: false }; }).catch(function () { return null; }));

  return Promise.all([wx.catch(function () { return null; }), nea, haze]).then(function (r) {
    var w = r[0], n = r[1], hz = r[2];
    if (!w) throw new Error('offline');
    /* the headline names whatever set the final level: cloud, rain/storms, or haze */
    var level = cloudLevel(w.cc, w.pp), cause = 'cloud', why = [];
    var bump = function (lv, c) { if (RANK[lv] > RANK[level]) { level = lv; cause = c; } };
    why.push(w.cc <= 30 ? 'clear' : w.cc <= 65 ? 'partcloud' : 'cloudy');
    if (w.thunder) { why.push('thunder'); bump((w.pp != null && w.pp >= 55) ? 'no' : 'maybe', 'storm'); }
    if (n) {
      if (/thunder|heavy/i.test(n)) { why.push('neaStorm'); bump('no', 'storm'); }
      else if (/shower|rain/i.test(n)) { why.push('neaRain'); bump('maybe', 'storm'); }
    }
    if (hz) {
      var v = hz.live ? hz.psi : hz.pm25;
      if (hz.live ? v > 200 : v > 150) { why.push('hazeBad'); bump('no', 'haze'); }
      else if (hz.live ? v > 100 : v > 55) { why.push('hazeUnhealthy'); bump('maybe', 'haze'); }
      else if (hz.live ? v > 55 : v > 35) why.push('hazy');
    }
    var res = { S: { ymd: S.ymd, daysAhead: S.daysAhead, tonight: S.tonight, live: S.live },
                level: level, cause: cause, cc: w.cc, pp: w.pp, thunder: w.thunder, nea: n, haze: hz, why: why, at: Date.now() };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(res)); } catch (e) {}
    return res;
  });
}
function cached() {
  try {
    var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.S && c.S.ymd === session().ymd && Date.now() - c.at < 6 * 3600000) return c;
  } catch (e) {}
  return null;
}

/* ── words, in Singapore's four official languages ───────────────────────── */
var W = {
  en: { q: 'Should I come tonight?', qFri: 'Coming on Friday?',
    sess: 'Public stargazing · Fridays 7:30–10 pm · Science Centre Observatory, Jurong',
    next: 'Next session: {d}', tonightLbl: 'Tonight, 7:30–10 pm', nowOn: 'The session is on now — until 10 pm',
    maybeStorm: 'Worth a try — but showers are possible', noStorm: 'Rain or storms likely — not a good night',
    maybeHaze: 'Clear enough, but the air is hazy', noHaze: 'Very hazy air — better to stay in tonight',
    go: 'Good night to come', maybe: 'Worth a try — but cloud may get in the way', no: 'Likely clouded out — maybe another Friday',
    goH: 'Haze-free and mostly clear',
    clear: 'Mostly clear', partcloud: 'Partly cloudy', cloudy: 'Cloudy',
    stats: '{cc}% cloud · up to {pp}% chance of rain, 7–10 pm',
    thunder: 'Thunderstorms possible in the evening.',
    neaRain: 'NEA expects showers around Jurong in the next 2 hours.',
    neaStorm: 'NEA expects thundery or heavy showers around Jurong in the next 2 hours.',
    hazy: 'A little hazy — the Moon and planets will still look fine.',
    hazeUnhealthy: 'Haze is in the Unhealthy range — sensitive visitors may prefer to stay away.',
    hazeBad: 'Haze is Very Unhealthy — check NEA\'s advice before going out.',
    psi: 'PSI {v} (NEA, west)', pm: 'haze forecast {v} µg/m³',
    early: 'This is {n} days ahead — forecasts change; check again on the day.',
    caveat: 'A weather forecast, not the observatory\'s decision. Sessions can close for rain — check the observatory\'s page before you travel.',
    cal: '📅 Every Friday in my calendar', fbLink: 'Observatory updates ↗', more: 'Full forecast', updated: 'Updated {t}', saved: 'Saved forecast from {t} — you seem to be offline.',
    offline: 'Could not load the forecast just now (offline?). Check the sky, or the observatory\'s page.',
    loading: 'Checking the forecast…',
    D: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], M: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dfmt: '{w} {d} {m}' },
  zh: { q: '今晚该来吗？', qFri: '星期五来吗？',
    sess: '公众观星 · 每逢星期五 晚上7:30–10:00 · 裕廊科学馆天文台',
    next: '下一场：{d}', tonightLbl: '今晚 7:30–10:00', nowOn: '观星活动正在进行，到晚上10点',
    maybeStorm: '值得一试，但可能有阵雨', noStorm: '很可能下雨或有雷暴，不适合前来',
    maybeHaze: '天空尚可，但空气有烟霾', noHaze: '烟霾严重，今晚最好留在家里',
    go: '适合前来', maybe: '值得一试，但云层可能会挡住', no: '很可能被云遮住，不妨改天',
    clear: '大致晴朗', partcloud: '局部多云', cloudy: '多云',
    stats: '晚上7–10点：云量 {cc}% · 降雨概率最高 {pp}%',
    thunder: '傍晚可能有雷雨。',
    neaRain: '新加坡环境局预测未来2小时裕廊一带有阵雨。',
    neaStorm: '新加坡环境局预测未来2小时裕廊一带有雷雨或大雨。',
    hazy: '略有烟霾，月亮和行星依然清晰。',
    hazeUnhealthy: '烟霾处于“不健康”水平，敏感人士可考虑不来。',
    hazeBad: '烟霾处于“非常不健康”水平，出门前请查看环境局的建议。',
    psi: 'PSI {v}（环境局，西区）', pm: '烟霾预测 {v} µg/m³',
    early: '距今还有 {n} 天，预报可能会变，当天请再查看。',
    caveat: '这是天气预报，不是天文台的决定。下雨时活动可能取消，出发前请查看天文台的公告。',
    cal: '📅 把每周五加入我的日历', fbLink: '天文台公告 ↗', more: '完整预报', updated: '更新于 {t}', saved: '离线中，显示 {t} 保存的预报。',
    offline: '暂时无法载入预报（可能离线）。请看看天空，或查看天文台的公告。',
    loading: '正在查看预报…',
    D: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'], M: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dfmt: '{m}{d}日（{w}）' },
  ms: { q: 'Patutkah saya datang malam ini?', qFri: 'Datang hari Jumaat?',
    sess: 'Cerapan bintang awam · Setiap Jumaat 7:30–10 malam · Balai Cerap Pusat Sains, Jurong',
    next: 'Sesi seterusnya: {d}', tonightLbl: 'Malam ini, 7:30–10 malam', nowOn: 'Sesi sedang berlangsung — hingga 10 malam',
    maybeStorm: 'Boleh dicuba — tetapi mungkin hujan', noStorm: 'Hujan atau ribut berkemungkinan — bukan malam yang baik',
    maybeHaze: 'Langit agak cerah, tetapi udara berjerebu', noHaze: 'Jerebu teruk — lebih baik duduk di rumah malam ini',
    go: 'Malam yang baik untuk datang', maybe: 'Boleh dicuba — tetapi awan mungkin mengganggu', no: 'Mungkin dilitupi awan — cuba Jumaat lain',
    clear: 'Kebanyakannya cerah', partcloud: 'Sebahagian berawan', cloudy: 'Berawan',
    stats: '{cc}% awan · peluang hujan sehingga {pp}%, 7–10 malam',
    thunder: 'Ribut petir mungkin berlaku pada waktu petang.',
    neaRain: 'NEA menjangka hujan di sekitar Jurong dalam 2 jam akan datang.',
    neaStorm: 'NEA menjangka hujan lebat atau ribut petir di sekitar Jurong dalam 2 jam akan datang.',
    hazy: 'Sedikit berjerebu — Bulan dan planet masih kelihatan baik.',
    hazeUnhealthy: 'Jerebu pada tahap Tidak Sihat — pengunjung yang sensitif mungkin lebih baik tidak datang.',
    hazeBad: 'Jerebu pada tahap Sangat Tidak Sihat — semak nasihat NEA sebelum keluar.',
    psi: 'PSI {v} (NEA, barat)', pm: 'ramalan jerebu {v} µg/m³',
    early: 'Ini {n} hari lagi — ramalan boleh berubah; semak semula pada hari itu.',
    caveat: 'Ini ramalan cuaca, bukan keputusan balai cerap. Sesi boleh ditutup jika hujan — semak halaman balai cerap sebelum bertolak.',
    cal: '📅 Setiap Jumaat dalam kalendar saya', fbLink: 'Berita balai cerap ↗', more: 'Ramalan penuh', updated: 'Dikemas kini {t}', saved: 'Ramalan disimpan pada {t} — anda mungkin di luar talian.',
    offline: 'Ramalan tidak dapat dimuatkan sekarang (luar talian?). Lihat langit, atau halaman balai cerap.',
    loading: 'Menyemak ramalan…',
    D: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'], M: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
    dfmt: '{w}, {d} {m}' },
  ta: { q: 'இன்றிரவு வரலாமா?', qFri: 'வெள்ளிக்கிழமை வருகிறீர்களா?',
    sess: 'பொது நட்சத்திரப் பார்வை · ஒவ்வொரு வெள்ளி இரவு 7:30–10 · அறிவியல் மைய வானாய்வகம், ஜூரோங்',
    next: 'அடுத்த அமர்வு: {d}', tonightLbl: 'இன்றிரவு, 7:30–10', nowOn: 'அமர்வு இப்போது நடைபெறுகிறது — இரவு 10 வரை',
    maybeStorm: 'முயற்சிக்கலாம் — ஆனால் மழை பெய்யலாம்', noStorm: 'மழை அல்லது இடிமழை வாய்ப்பு அதிகம் — நல்ல இரவு அல்ல',
    maybeHaze: 'வானம் ஓரளவு தெளிவு, ஆனால் காற்றில் புகைமூட்டம்', noHaze: 'கடும் புகைமூட்டம் — இன்றிரவு வீட்டிலேயே இருப்பது நல்லது',
    go: 'வருவதற்கு நல்ல இரவு', maybe: 'முயற்சிக்கலாம் — ஆனால் மேகம் மறைக்கக்கூடும்', no: 'மேகமூட்டமாக இருக்கும் — வேறு வெள்ளியில் வரலாம்',
    clear: 'பெரும்பாலும் தெளிவு', partcloud: 'பகுதி மேகமூட்டம்', cloudy: 'மேகமூட்டம்',
    stats: 'இரவு 7–10: மேகம் {cc}% · மழை வாய்ப்பு அதிகபட்சம் {pp}%',
    thunder: 'மாலையில் இடியுடன் கூடிய மழை பெய்யலாம்.',
    neaRain: 'அடுத்த 2 மணி நேரத்தில் ஜூரோங் பகுதியில் மழை பெய்யும் என NEA எதிர்பார்க்கிறது.',
    neaStorm: 'அடுத்த 2 மணி நேரத்தில் ஜூரோங் பகுதியில் இடி அல்லது கனமழை பெய்யும் என NEA எதிர்பார்க்கிறது.',
    hazy: 'சற்றுப் புகைமூட்டம் — நிலவும் கோள்களும் நன்றாகத் தெரியும்.',
    hazeUnhealthy: 'புகைமூட்டம் "ஆரோக்கியமற்ற" நிலையில் உள்ளது — உணர்திறன் உள்ளவர்கள் வராமல் இருப்பது நல்லது.',
    hazeBad: 'புகைமூட்டம் "மிகவும் ஆரோக்கியமற்ற" நிலையில் உள்ளது — வெளியே செல்லும் முன் NEA ஆலோசனையைப் பாருங்கள்.',
    psi: 'PSI {v} (NEA, மேற்கு)', pm: 'புகைமூட்ட முன்னறிவிப்பு {v} µg/m³',
    early: 'இன்னும் {n} நாட்கள் உள்ளன — முன்னறிவிப்பு மாறலாம்; அன்றைய நாள் மீண்டும் பாருங்கள்.',
    caveat: 'இது வானிலை முன்னறிவிப்பு மட்டுமே, வானாய்வகத்தின் முடிவு அல்ல. மழையின்போது அமர்வு மூடப்படலாம் — புறப்படும் முன் வானாய்வகப் பக்கத்தைப் பாருங்கள்.',
    cal: '📅 ஒவ்வொரு வெள்ளியையும் என் நாள்காட்டியில் சேர்', fbLink: 'வானாய்வகச் செய்திகள் ↗', more: 'முழு முன்னறிவிப்பு', updated: '{t} புதுப்பிக்கப்பட்டது', saved: '{t} சேமித்த முன்னறிவிப்பு — நீங்கள் இணைப்பில் இல்லை போலும்.',
    offline: 'முன்னறிவிப்பை இப்போது ஏற்ற முடியவில்லை (இணைப்பு இல்லையா?). வானத்தைப் பாருங்கள், அல்லது வானாய்வகப் பக்கத்தைப் பாருங்கள்.',
    loading: 'முன்னறிவிப்பைப் பார்க்கிறது…',
    D: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'], M: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
    dfmt: '{w}, {d} {m}' }
};
function tr(lang, k, o) {
  var L = W[lang] || W.en, s = L[k] != null ? L[k] : W.en[k];
  if (o) for (var p in o) s = s.split('{' + p + '}').join(o[p]);
  return s;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function dateWords(lang, d) {
  var L = W[lang] || W.en;
  return tr(lang, 'dfmt', { w: L.D[d.getUTCDay()], d: d.getUTCDate(), m: L.M[d.getUTCMonth()] });
}
function clock(ms) { var t = sgt(new Date(ms)), h = t.getUTCHours(); return (h % 12 || 12) + ':' + pad(t.getUTCMinutes()) + (h < 12 ? 'am' : 'pm'); }

var CSS = '.ct{border:1px solid #33406b;border-radius:14px;padding:13px 15px;background:#13224a;margin:14px 0;text-align:left;color:#f4f6fb}'
  + '.ct .ctq{font-size:12px;color:#9fb0d6;font-weight:700;letter-spacing:.02em}'
  + '.ct .ctv{font-size:19px;font-weight:900;margin:3px 0 4px;line-height:1.25}'
  + '.ct.go .ctv{color:#39c97e}.ct.maybe .ctv{color:#f5c542}.ct.no .ctv{color:#ff6b6b}.ct.none .ctv{color:#f4f6fb;font-size:15px}'
  + '.ct.go{border-color:rgba(57,201,126,.55)}.ct.maybe{border-color:rgba(245,197,66,.55)}.ct.no{border-color:rgba(255,107,107,.55)}'
  + '.ct .cts{font-size:13.5px;line-height:1.5}.ct .ctn{font-size:13px;line-height:1.5;margin-top:4px}'
  + '.ct .ctc{font-size:11.5px;color:#9fb0d6;margin-top:8px;line-height:1.5}.ct a{color:#5bd6e0;font-weight:700}'
  + '.ct .ctl{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:7px;font-size:12.5px}';
function css() {
  if (document.getElementById('ctCSS')) return;
  var st = document.createElement('style'); st.id = 'ctCSS'; st.textContent = CSS; document.head.appendChild(st);
}

function draw(el, lang, res, note) {
  var S = session(), icon = { go: '✅', maybe: '⚠️', no: '❌' };
  var head = S.tonight ? tr(lang, 'q') : tr(lang, 'qFri');
  var when = S.live ? tr(lang, 'nowOn') : S.tonight ? tr(lang, 'tonightLbl') : tr(lang, 'next', { d: dateWords(lang, S.date) });
  var h = '<div class="ctq">' + esc(head) + ' · ' + esc(when) + '</div>';
  if (!res) {
    el.className = 'ct none';
    el.innerHTML = h + '<div class="ctv">' + esc(note === 'loading' ? tr(lang, 'loading') : tr(lang, 'offline')) + '</div>'
      + '<div class="ctc">' + esc(tr(lang, 'sess')) + '</div>'
      + '<div class="ctl"><a href="' + FB + '" target="_blank" rel="noopener">' + esc(tr(lang, 'fbLink')) + '</a></div>' + calBtn(lang);
    return;
  }
  el.className = 'ct ' + res.level;
  var lines = [];
  res.why.forEach(function (k) { if (k !== 'clear' && k !== 'partcloud' && k !== 'cloudy') lines.push(tr(lang, k)); });
  if (res.haze) lines.push(res.haze.live ? tr(lang, 'psi', { v: Math.round(res.haze.psi) }) : tr(lang, 'pm', { v: Math.round(res.haze.pm25) }));
  if (res.S.daysAhead >= 3) lines.push(tr(lang, 'early', { n: res.S.daysAhead }));
  el.innerHTML = h
    + '<div class="ctv">' + icon[res.level] + ' ' + esc(tr(lang, res.level === 'go' || !res.cause || res.cause === 'cloud' ? res.level : res.level + (res.cause === 'haze' ? 'Haze' : 'Storm'))) + '</div>'
    + '<div class="cts"><b>' + esc(tr(lang, res.why[0])) + '</b> · ' + esc(tr(lang, 'stats', { cc: res.cc, pp: res.pp == null ? '—' : res.pp })) + '</div>'
    + (lines.length ? '<div class="ctn">' + lines.map(esc).join('<br>') + '</div>' : '')
    + '<div class="ctc">' + esc(tr(lang, 'caveat')) + ' ' + esc(note === 'saved' ? tr(lang, 'saved', { t: clock(res.at) }) : tr(lang, 'updated', { t: clock(res.at) })) + '</div>'
    + '<div class="ctl"><a href="' + FB + '" target="_blank" rel="noopener">' + esc(tr(lang, 'fbLink')) + '</a>'
    + '<a href="scob-dashboard-v3.html">' + esc(tr(lang, 'more')) + ' →</a></div>'
    + calBtn(lang);
}

/* every Friday session as one repeating calendar entry (scob-ics.js, when the page loads it) */
function calBtn(lang) {
  return global.SCOBICS ? global.SCOBICS.btn(global.SCOBICS.sessionsEvent(), tr(lang, 'cal')) : '';
}

var LAST = null;
function render(el, lang) {
  if (!el) return;
  css();
  lang = W[lang] ? lang : 'en';
  el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.setAttribute('data-lang', lang);
  if (LAST) { draw(el, lang, LAST.res, LAST.note); }
  else { var c = cached(); draw(el, lang, c, c ? 'saved' : 'loading'); }
  if (LAST && Date.now() - LAST.t < 10 * 60000) return;
  LAST = LAST || { t: 0 };
  LAST.t = Date.now();
  check().then(function (r) { LAST = { t: Date.now(), res: r, note: '' }; draw(el, el.getAttribute('data-lang') || lang, r, ''); })
    .catch(function () { var c = cached(); LAST = { t: Date.now(), res: c, note: c ? 'saved' : 'offline' }; draw(el, el.getAttribute('data-lang') || lang, c, c ? 'saved' : 'offline'); });
}

global.ComeTonight = { session: session, check: check, cached: cached, render: render, cloudLevel: cloudLevel, WORDS: W };
})(typeof window !== 'undefined' ? window : this);
