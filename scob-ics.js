/* SCOB Night-Sky — "Add to calendar" (v4.21)
 *
 * The site cannot send notifications (it has no server), but every phone and computer
 * calendar can import an .ics file, and a calendar reminds you without anything from us.
 * This builds the file on the device and hands it to the browser — on iPhone it opens
 * the "Add to Calendar" sheet, on Android / desktop it downloads and opens in Calendar.
 *
 *   SCOBICS.btn(ev, label)      HTML for a small 📅 button; one delegated click handler
 *                               (below) does the rest, so pages only add the markup.
 *   SCOBICS.download([ev..], filename)
 *   SCOBICS.text([ev..])        the iCalendar text itself
 *
 * An event: { title, start (ms UTC or Date), end (ms/Date; default start + 1 h),
 *             allDay (start/end are 'YYYY-MM-DD'), desc, loc, url, uid, rrule, alarm (minutes before) }
 * Times are written in UTC, which is exact for Singapore (no daylight saving).
 */
(function (global) {
'use strict';

var LOC = 'Science Centre Observatory, 15 Science Centre Road, Singapore 609081';

function p2(n) { return (n < 10 ? '0' : '') + n; }
function utc(t) {
  var d = new Date(t);
  return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + 'T' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + 'Z';
}
function dateOnly(s) { return String(s).replace(/-/g, '').slice(0, 8); }
function nextDay(s) { var d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function escTxt(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
/* RFC 5545: lines over 75 octets are folded with CRLF + space (counting UTF-8 bytes,
   and never splitting a character — Chinese and Tamil titles are multi-byte). */
function fold(line) {
  var out = [], cur = '', n = 0;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i], code = line.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < line.length) { ch += line[++i]; }
    var b = unescape(encodeURIComponent(ch)).length;
    if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}
function uidFor(ev) {
  var s = (ev.title || '') + '|' + (ev.start || '') + '|' + (ev.rrule || ''), h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 'scob-' + (h >>> 0).toString(36) + '@afbooster.online';
}
function text(list) {
  var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AFBOOSTER.online//SCOB Night-Sky//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  var stamp = utc(Date.now());
  list.forEach(function (ev) {
    L.push('BEGIN:VEVENT', 'UID:' + (ev.uid || uidFor(ev)), 'DTSTAMP:' + stamp);
    if (ev.allDay) {
      L.push('DTSTART;VALUE=DATE:' + dateOnly(ev.start), 'DTEND;VALUE=DATE:' + dateOnly(ev.end || nextDay(ev.start)));
    } else {
      var s = new Date(ev.start).getTime(), e = ev.end != null ? new Date(ev.end).getTime() : s + 3600000;
      L.push('DTSTART:' + utc(s), 'DTEND:' + utc(e));
    }
    if (ev.rrule) L.push('RRULE:' + ev.rrule);
    L.push('SUMMARY:' + escTxt(ev.title));
    var desc = (ev.desc || '') + (ev.url ? (ev.desc ? '\n\n' : '') + ev.url : '');
    if (desc) L.push('DESCRIPTION:' + escTxt(desc));
    var loc = ev.loc === undefined ? LOC : ev.loc;
    if (loc) L.push('LOCATION:' + escTxt(loc));
    if (ev.url) L.push('URL:' + ev.url);
    if (ev.alarm) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escTxt(ev.title), 'TRIGGER:-PT' + Math.round(ev.alarm) + 'M', 'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}
function slug(s) { return String(s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event'; }
function download(list, filename) {
  var blob = new Blob([text(list)], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = (filename || slug(list[0] && list[0].title)) + '.ics';
  a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(function () { try { a.remove(); URL.revokeObjectURL(url); } catch (e) {} }, 4000);
}
function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function btn(ev, label, cls) {
  var evs = Array.isArray(ev) ? ev : [ev];
  return '<button type="button" class="icsbtn' + (cls ? ' ' + cls : '') + '" data-ics="' + attr(JSON.stringify(evs)) + '"'
    + ' title="Add to your phone or computer calendar" aria-label="' + attr((label ? label + ' — ' : '') + 'add to calendar: ' + (evs[0] && evs[0].title || '')) + '">'
    + (label || '📅 Add to calendar') + '</button>';
}

/* one delegated handler for every page */
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-ics]') : null;
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  try { var list = JSON.parse(b.getAttribute('data-ics')); download(list, b.getAttribute('data-ics-file') || null); }
  catch (err) { /* malformed button — nothing to do */ }
}, true);

if (!document.getElementById('icsCSS')) {
  var st = document.createElement('style'); st.id = 'icsCSS';
  st.textContent = '.icsbtn{background:transparent;border:1px solid #33406b;color:#5bd6e0;border-radius:16px;padding:3px 10px;font-weight:700;font-size:12px;line-height:1.4;font-family:inherit;cursor:pointer;margin-top:6px;white-space:nowrap}'
    + '.icsbtn:hover,.icsbtn:focus-visible{border-color:#5bd6e0}.icsbtn.big{font-size:13.5px;padding:7px 14px;margin-top:10px}'
    + '@media print{.icsbtn{display:none}}';
  (document.head || document.documentElement).appendChild(st);
}

/* the Friday public session, every week */
var SESSIONS = {
  title: 'Stargazing at the Science Centre Observatory',
  desc: 'Public stargazing at the Science Centre Observatory, Fridays 7:30–10 pm: a planetarium show, then the telescopes from 8:15 pm. Tickets are needed (not refunded for poor weather): https://www.science.edu.sg/whats-on/workshops-activities/stargazing — tonight\'s forecast: https://afbooster.online/sky-guide.html',
  rrule: 'FREQ=WEEKLY;BYDAY=FR', alarm: 180, url: 'https://afbooster.online/sky-guide.html'
};
function sessionsEvent() {
  /* the coming Friday 7:30 pm SGT = 11:30 UTC */
  var now = new Date(Date.now() + 8 * 3600000), add = (5 - now.getUTCDay() + 7) % 7;
  if (add === 0 && now.getUTCHours() >= 22) add = 7;
  var s = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, 11, 30);
  return { title: SESSIONS.title, desc: SESSIONS.desc, rrule: SESSIONS.rrule, alarm: SESSIONS.alarm, url: SESSIONS.url,
           start: s, end: s + 150 * 60000, uid: 'scob-friday-sessions@afbooster.online' };
}

global.SCOBICS = { text: text, download: download, btn: btn, sessionsEvent: sessionsEvent, LOC: LOC };
})(typeof window !== 'undefined' ? window : this);
