#!/usr/bin/env node
/* SCOB Night-Sky — page smoke tests.
 *
 * The astronomy engine has test-astro.js. The 20-odd HTML pages had nothing, so a
 * typo in an element id or a crash on load could reach the live site unnoticed.
 *
 * This runs, for every page:
 *   1. syntax   — every inline <script> parses
 *   2. runtime  — the page's scripts are EXECUTED against a stub DOM, so anything
 *                 that throws on load fails the build
 *   3. offline  — fetch() always rejects here, so a page that does not degrade
 *                 gracefully without a network shows up as an unhandled rejection
 *   4. ids      — every document.getElementById('literal') names an id that
 *                 actually exists somewhere in the file (static markup or a
 *                 generated innerHTML string), and no id is defined twice
 *   5. links    — every local href/src resolves to a real file
 *   6. plumbing — every page loads version.js and carries a .scob-version slot
 *
 * It is deliberately dependency-free (no jsdom, no puppeteer) so it runs anywhere
 * node does, including CI with no network.
 *
 * WHAT IT IS NOT: a browser. It does not lay anything out, does not paint, and
 * does not fire user events. A page can pass here and still look wrong. It
 * catches crashes and broken wiring, which is the class of bug that has actually
 * bitten this site.
 *
 * Usage:  node test-pages.js            (exits non-zero on failure)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const SKIP_DIRS = ['archive', 'node_modules', '.git', '.github'];
// Redirect stubs and the tiny landing shims have no logic worth executing.
const STUBS = ['main.html', 'scob-dashboard.html'];

let fails = 0, warns = 0;
const red = s => '\x1b[31m' + s + '\x1b[0m';
const grn = s => '\x1b[32m' + s + '\x1b[0m';
const yel = s => '\x1b[33m' + s + '\x1b[0m';
function ok(m) { console.log('  ' + grn('/') + ' ' + m); }
function bad(m) { console.log('  ' + red('x') + ' ' + m); fails++; }
function warn(m) { console.log('  ' + yel('!') + ' ' + m); warns++; }
function section(t) { console.log('\n\x1b[1m' + t + '\x1b[0m'); }

/* ------------------------------------------------------------------ helpers */
function inlineScripts(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    // <script type="text/plain"> is the dashboard's shared-source block: it is real
    // JavaScript that the page eval()s at boot, so it must be checked like any other.
    const type = (attrs.match(/type\s*=\s*["']([^"']+)["']/) || [])[1] || '';
    if (type && !/javascript|text\/plain|module/.test(type)) continue;
    out.push(m[2]);
  }
  return out;
}
function externalScripts(html) {
  const out = [];
  const re = /<script[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}
function idsIn(html) {
  const out = [];
  const re = /\bid\s*=\s*(?:["']([^"']+)["']|([A-Za-z][\w-]*))/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1] || m[2]);
  return out;
}
function staticIds(html) {
  // ids in real markup only — i.e. outside <script> blocks
  return idsIn(html.replace(/<script[\s\S]*?<\/script>/gi, ''));
}

/* --------------------------------------------------------------- stub DOM */
function makeElement(tag, ctx) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    nodeType: 1,
    style: new Proxy({}, { get: (t, k) => (k in t ? t[k] : ''), set: (t, k, v) => { t[k] = v; return true; } }),
    dataset: {},
    children: [], childNodes: [],
    attributes: {},
    _html: '', _text: '', value: '', checked: false, disabled: false,
    scrollTop: 0, scrollLeft: 0, offsetWidth: 300, offsetHeight: 200, clientWidth: 300, clientHeight: 200,
    width: 300, height: 200,
    classList: {
      _s: new Set(),
      add() { for (const a of arguments) this._s.add(a); },
      remove() { for (const a of arguments) this._s.delete(a); },
      toggle(c, force) {  // honor the optional force arg, like the real DOM
        if (force === true) { this._s.add(c); return true; }
        if (force === false) { this._s.delete(c); return false; }
        if (this._s.has(c)) { this._s.delete(c); return false; }
        this._s.add(c); return true;
      },
      contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); } return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    remove() {},
    replaceChildren() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'id') this.id = String(v); },
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
    removeAttribute(k) { delete this.attributes[k]; },
    hasAttribute(k) { return k in this.attributes; },
    setPointerCapture() {}, releasePointerCapture() {},
    focus() {}, blur() {}, click() {}, scrollIntoView() {}, closest() { return null; },
    getBoundingClientRect() { return { top: 0, left: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0 }; },
    querySelector() { return makeElement('div', ctx); },
    querySelectorAll() { return []; },
    cloneNode() { return makeElement(this.tagName, ctx); },
    getContext() { return ctx.__canvas2d; },
    toDataURL() { return 'data:image/png;base64,'; },
    toBlob(cb) { cb(null); },
    play() { return Promise.resolve(); }, pause() {}, load() {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; },
    // Registering ids that appear in generated markup is the whole point: pages build
    // most of their UI through innerHTML and then look those elements up by id.
    set(v) { this._html = String(v); idsIn(this._html).forEach(id => ctx.__ids.add(id)); }
  });
  Object.defineProperty(el, 'outerHTML', { get() { return this._html; }, set(v) { this._html = String(v); } });
  Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = String(v); } });
  Object.defineProperty(el, 'innerText', { get() { return this._text; }, set(v) { this._text = String(v); } });
  return el;
}
function makeContext(html, file) {
  const ctxIds = new Set(idsIn(html));       // static markup AND ids inside script strings
  const sandbox = {};
  const ctx = sandbox;
  ctx.__ids = ctxIds;
  ctx.__missing = [];
  ctx.__cache = new Map();
  const noop = () => {};
  const chain = new Proxy(function () {}, { get: () => chain, apply: () => chain });
  ctx.__canvas2d = new Proxy({
    measureText: () => ({ width: 42 }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    canvas: { width: 300, height: 200 }
  }, { get: (t, k) => (k in t ? t[k] : noop) });

  const doc = {
    documentElement: makeElement('html', ctx),
    head: makeElement('head', ctx),
    body: makeElement('body', ctx),
    readyState: 'complete',
    title: '',
    cookie: '',
    getElementById(id) {
      if (ctx.__ids.has(id)) {
        if (!ctx.__cache.has(id)) { const e = makeElement('div', ctx); e.id = id; ctx.__cache.set(id, e); }
        return ctx.__cache.get(id);
      }
      ctx.__missing.push(id);
      return null;                                   // real browser behaviour
    },
    querySelector(sel) {
      const m = /^#([\w-]+)$/.exec(String(sel || ''));
      if (m) return doc.getElementById(m[1]);
      return makeElement('div', ctx);
    },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    getElementsByClassName() { return []; },
    createElement(t) { return makeElement(t, ctx); },
    createElementNS(ns, t) { return makeElement(t, ctx); },
    createTextNode(t) { const e = makeElement('#text', ctx); e._text = String(t); return e; },
    createDocumentFragment() { return makeElement('fragment', ctx); },
    addEventListener() {}, removeEventListener() {},
    execCommand() {}, hasFocus() { return true; },
    visibilityState: 'visible'
  };

  const store = new Map();
  const storage = {
    getItem: k => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: k => store.delete(String(k)),
    clear: () => store.clear(),
    key: () => null, length: 0
  };

  ctx.window = ctx;
  ctx.self = ctx;
  ctx.globalThis = ctx;
  ctx.document = doc;
  ctx.localStorage = storage;
  ctx.sessionStorage = storage;
  ctx.location = { href: 'https://example.test/' + file, search: '', hash: '', pathname: '/' + file, origin: 'https://example.test', protocol: 'https:', reload: noop, assign: noop, replace: noop };
  ctx.navigator = {
    userAgent: 'node-smoke-test', language: 'en-SG', languages: ['en-SG'], platform: 'test',
    geolocation: { getCurrentPosition: noop, watchPosition: () => 1, clearWatch: noop },
    serviceWorker: { register: () => Promise.reject(new Error('no service worker in tests')), controller: null, addEventListener: noop },
    share: () => Promise.reject(new Error('no share')), clipboard: { writeText: () => Promise.resolve() },
    maxTouchPoints: 0
  };
  ctx.screen = { width: 1280, height: 800, orientation: { type: 'landscape-primary', addEventListener: noop } };
  ctx.console = console;
  ctx.setTimeout = () => 1;            // never actually fire: keeps the run finite
  ctx.setInterval = () => 1;
  ctx.clearTimeout = noop; ctx.clearInterval = noop;
  ctx.requestAnimationFrame = () => 1; ctx.cancelAnimationFrame = noop;
  ctx.matchMedia = () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop });
  // Offline by design — every page must survive the network being gone.
  ctx.fetch = () => Promise.reject(new Error('offline (smoke test)'));
  ctx.XMLHttpRequest = function () { return new Proxy({}, { get: () => noop }); };
  ctx.Image = function () { const e = makeElement('img', ctx); return e; };
  ctx.Audio = function () { return makeElement('audio', ctx); };
  ctx.XMLSerializer = function () { return { serializeToString: () => '<svg/>' }; };
  ctx.DOMParser = function () { return { parseFromString: () => doc }; };
  ctx.Blob = function () { return {}; };
  ctx.FileReader = function () { return new Proxy({}, { get: () => noop }); };
  ctx.URL = { createObjectURL: () => 'blob:test', revokeObjectURL: noop };
  ctx.speechSynthesis = { speak: noop, cancel: noop, pause: noop, resume: noop, getVoices: () => [], addEventListener: noop, speaking: false, paused: false };
  ctx.SpeechSynthesisUtterance = function () { return { addEventListener: noop }; };
  ctx.DeviceOrientationEvent = function () {};
  ctx.addEventListener = noop; ctx.removeEventListener = noop; ctx.dispatchEvent = () => true;
  ctx.alert = noop; ctx.confirm = () => true; ctx.prompt = () => null;
  ctx.print = noop; ctx.open = () => null; ctx.close = noop;
  ctx.scrollTo = noop; ctx.scrollBy = noop;
  ctx.innerWidth = 1280; ctx.innerHeight = 800; ctx.devicePixelRatio = 2;
  ctx.performance = { now: () => Date.now() };
  ctx.chain = chain;
  return ctx;
}

/* ------------------------------------------------------------------- run */
// The stub-DOM machinery above is reused by test-logic.js. When this file is
// require()'d, export the helpers and DON'T run the page sweep; only run the
// sweep when invoked directly (node test-pages.js).
if (require.main !== module) {
  module.exports = { makeContext, inlineScripts, externalScripts, idsIn };
} else {
  runPageSweep();
}
function runPageSweep() {
const files = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.html'))
  .filter(f => !SKIP_DIRS.some(d => f.startsWith(d)))
  .sort();

console.log('SCOB page smoke tests — ' + files.length + ' pages\n' +
            'Executing each page against a stub DOM with the network offline.');

const rejections = [];
process.on('unhandledRejection', r => rejections.push(r));

for (const file of files) {
  const full = path.join(DIR, file);
  const html = fs.readFileSync(full, 'utf8');
  section(file);

  /* 1 — syntax + 2/3 — execution */
  if (STUBS.includes(file)) {
    ok('redirect stub — nothing to execute');
  } else {
    const ctx = makeContext(html, file);
    vm.createContext(ctx);
    let crashed = false;

    for (const src of externalScripts(html)) {
      if (/^https?:/i.test(src)) continue;                    // CDN scripts are loaded at runtime, not here
      const p = path.join(DIR, src);
      if (!fs.existsSync(p)) { bad('missing local script: ' + src); crashed = true; continue; }
      try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: src, timeout: 15000 }); }
      catch (e) { bad(src + ' threw on load: ' + e.message); crashed = true; }
    }
    const blocks = inlineScripts(html);
    blocks.forEach((code, i) => {
      const label = 'inline script ' + (i + 1) + '/' + blocks.length;
      try { new vm.Script(code, { filename: file + '#' + (i + 1) }); }
      catch (e) { bad(label + ' does not parse: ' + e.message); crashed = true; return; }
      try { vm.runInContext(code, ctx, { filename: file + '#' + (i + 1), timeout: 20000 }); }
      catch (e) {
        const line = (e.stack || '').split('\n').slice(0, 3).join(' | ');
        bad(label + ' threw while running: ' + e.message + '\n      ' + line);
        crashed = true;
      }
    });
    if (!crashed) ok('scripts parse and run clean (' + blocks.length + ' inline block' + (blocks.length === 1 ? '' : 's') + ', network offline)');

    /* 4 — element ids that were looked up but never exist */
    const missing = Array.from(new Set(ctx.__missing));
    if (missing.length) warn('getElementById returned null for: ' + missing.join(', ') + ' — fine if guarded, a latent crash if not');
    else ok('every element looked up at load time exists');
  }

  /* 4b — duplicate static ids */
  const sids = staticIds(html);
  const dupes = sids.filter((v, i) => sids.indexOf(v) !== i);
  if (dupes.length) {
    // the dashboard renders a desktop and a mobile root from one source, so its
    // duplicated ids are deliberate and documented
    const msg = 'duplicate ids in markup: ' + Array.from(new Set(dupes)).join(', ');
    if (/desktopRoot/.test(html) && /mobileRoot/.test(html)) ok('duplicate ids present but expected (dual desktop/mobile roots)');
    else bad(msg);
  } else ok('no duplicate ids in markup');

  /* 5 — local links resolve */
  const links = [];
  const lre = /\b(?:href|src)\s*=\s*["']([^"'#?]+)["']/gi;
  let lm;
  while ((lm = lre.exec(html))) {
    const u = lm[1];
    if (/^(https?:|data:|mailto:|blob:|javascript:|#)/i.test(u) || u === '') continue;
    links.push(u);
  }
  const broken = Array.from(new Set(links)).filter(u => !fs.existsSync(path.join(DIR, u)));
  if (broken.length) bad('broken local link(s): ' + broken.join(', '));
  else ok(Array.from(new Set(links)).length + ' local link(s) all resolve');

  /* 6 — version plumbing */
  if (STUBS.includes(file)) {
    ok('stub — version plumbing not required');
  } else {
    const hasVer = /<script[^>]*src\s*=\s*["']version\.js["']/.test(html);
    const hasSlot = /class\s*=\s*["'][^"']*\bscob-version\b/.test(html);
    if (hasVer && hasSlot) ok('loads version.js and has a .scob-version slot');
    else if (!hasVer) bad('does not load version.js — its footer will never show a version');
    else bad('loads version.js but has no .scob-version placeholder to fill');
    if (/SCOB Night-Sky <b>v\d/.test(html)) bad('hard-coded version string found — must come from version.js');
  }
}

/* async fallout from the offline fetches */
setTimeout(() => {
  section('Offline behaviour');
  if (rejections.length) {
    bad(rejections.length + ' unhandled promise rejection(s) — a page does not cope with the network being unavailable:');
    rejections.slice(0, 5).forEach(r => console.log('      ' + (r && r.message ? r.message : r)));
  } else ok('no unhandled rejections — every page degrades gracefully with no network');

  section('Result');
  console.log('  ' + (fails ? red(fails + ' failed') : grn('0 failed')) + (warns ? ', ' + yel(warns + ' warning(s)') : '') );
  if (fails) { console.log('  ' + red('FIX BEFORE UPLOADING.')); process.exit(1); }
  console.log('  ' + grn('Pages look healthy.'));
}, 250);
}  // runPageSweep
