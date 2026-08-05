#!/usr/bin/env node
/* SCOB Night-Sky — one-page-at-a-time migration onto scob-theme.css.
 *
 * WHAT IT DOES
 * ------------
 * For a page you name, it:
 *   1. adds  <link rel="stylesheet" href="scob-theme.css">  before the first <style>
 *   2. deletes the page's :root block IF every declaration in it is already in
 *      scob-theme.css with an identical value
 *   3. deletes any CSS rule that is byte-identical (whitespace-normalised) to the
 *      same selector in scob-theme.css
 *   4. leaves everything else alone
 *
 * WHAT IT WILL NOT DO
 * -------------------
 * It never deletes a rule that DIFFERS from the theme, even slightly. Those are
 * either deliberate overrides or drift you want to look at by eye; they stay
 * inline, and inline <style> comes after the <link>, so they still win. The
 * script prints them as "kept (differs)" so you can decide.
 *
 * It never touches a :root whose values disagree with the theme. The three print
 * pages (checklist, object-cards, qr-poster) redefine --gold/--cyan for white
 * paper, so their :root is kept and the script tells you to switch them to
 * class="paper" by hand instead.
 *
 * USAGE
 * -----
 *   node migrate-theme.js meteors.html            # dry run — shows what would go
 *   node migrate-theme.js --apply meteors.html    # writes, keeping meteors.html.bak
 *   node migrate-theme.js --all                   # dry run across every page
 *   node migrate-theme.js --revert meteors.html   # restore from the .bak
 *
 * AFTER APPLYING, ALWAYS:
 *   node test-pages.js && ./check-release.sh
 * and open the page once in a browser. This script checks text, not pixels.
 *
 * Dependency-free, like test-pages.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const THEME = path.join(DIR, 'scob-theme.css');
const LINK = '<link rel="stylesheet" href="scob-theme.css">';

const red = s => '\x1b[31m' + s + '\x1b[0m';
const grn = s => '\x1b[32m' + s + '\x1b[0m';
const yel = s => '\x1b[33m' + s + '\x1b[0m';
const dim = s => '\x1b[2m' + s + '\x1b[0m';

/* ------------------------------------------------------------------- parsing */

// Blank out comments so they never confuse the rule matcher.
// CRITICAL: this replaces each comment with the SAME NUMBER of characters rather
// than deleting it, so every offset returned by topLevelRules() still points at
// the right place in the untouched source. Deleting instead of masking shifts
// every subsequent offset and silently splices out the wrong bytes.
function decomment(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
}

// Normalise a declaration body for comparison: no whitespace, no trailing ';'.
// Also resolve var(--x) against the theme's :root, so the theme can be written in
// tokens (font-family:var(--ui)) while a page still spells the value out longhand
// (font-family:-apple-system,…) and the two are recognised as the same rule.
// Resolved repeatedly because tokens can reference tokens.
let ROOT = {};
function resolveVars(s) {
  for (let i = 0; i < 5 && s.includes('var('); i++) {
    s = s.replace(/var\(\s*(--[\w-]+)\s*(?:,[^()]*)?\)/g, (m, name) => (name in ROOT ? ROOT[name] : m));
  }
  return s;
}
function norm(body) {
  return resolveVars(body.replace(/\s+/g, '')).replace(/;$/, '');
}

function normSel(sel) { return sel.replace(/\s+/g, ' ').trim(); }

// Flat top-level rules only. Anything inside @media / @supports is skipped
// entirely — nesting makes naive removal unsafe, and there is little duplication
// in the media blocks anyway.
function topLevelRules(css) {
  const out = [];
  let depth = 0, i = 0, selStart = 0, atRule = false;
  while (i < css.length) {
    const c = css[i];
    if (c === '@' && depth === 0) atRule = true;
    if (c === '{') {
      depth++;
      if (depth === 1) {
        const sel = css.slice(selStart, i);
        const bodyStart = i + 1;
        // find matching close
        let d = 1, j = bodyStart;
        while (j < css.length && d > 0) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
        const body = css.slice(bodyStart, j - 1);
        if (!atRule) out.push({ sel, body, start: selStart, end: j });
        i = j; depth = 0; selStart = j; atRule = false;
        continue;
      }
    } else if (c === '}') { depth--; }
    i++;
  }
  return out;
}

function parseDecls(body) {
  const m = {};
  body.split(';').forEach(d => {
    const k = d.indexOf(':');
    if (k < 0) return;
    const prop = d.slice(0, k).trim();
    const val = d.slice(k + 1).trim();
    if (prop) m[prop] = val.replace(/\s+/g, '');
  });
  return m;
}

/* --------------------------------------------------------------- theme index */

if (!fs.existsSync(THEME)) {
  console.error(red('scob-theme.css not found in ' + DIR + ' — put it next to the pages first.'));
  process.exit(2);
}
const themeCss = decomment(fs.readFileSync(THEME, 'utf8'));
const themeTop = topLevelRules(themeCss);

// Pass 1 — the palette, so var() can be resolved in pass 2.
let themeRoot = {};
for (const r of themeTop) if (normSel(r.sel) === ':root') themeRoot = parseDecls(r.body);
ROOT = themeRoot;

// Pass 2 — index every other rule by selector, storing BOTH the literal text and
// the var-resolved form, so a page matches whichever way it spelled the value.
const themeRules = new Map();   // normSel -> Set of comparable bodies
for (const r of themeTop) {
  const s = normSel(r.sel);
  if (s === ':root') continue;
  if (!themeRules.has(s)) themeRules.set(s, new Set());
  const set = themeRules.get(s);
  set.add(norm(r.body));                                        // resolved
  set.add(r.body.replace(/\s+/g, '').replace(/;$/, ''));        // literal
}

/* ------------------------------------------------------------------ migrate */

function migrate(file, apply) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) { console.log(red('  missing: ' + file)); return { fail: 1 }; }
  const orig = fs.readFileSync(p, 'utf8');
  let html = orig;

  console.log('\n\x1b[1m' + file + '\x1b[0m');

  if (!/<style[^>]*>/i.test(html)) { console.log(dim('  no inline <style> — nothing to do')); return {}; }
  if (html.includes('scob-theme.css')) { console.log(dim('  already linked to scob-theme.css')); }

  let removedBytes = 0, removedCount = 0, kept = [];

  // Does this page redefine the palette (the three print pages do)? If so, a
  // literal colour and the theme's var() are NOT interchangeable — resolving
  // var(--navy) here would give the wrong answer. Fall back to exact text
  // matching only, which is always safe.
  let paletteConflict = false;
  for (const r of topLevelRules(decomment(html))) {
    if (normSel(r.sel) !== ':root') continue;
    const d = parseDecls(r.body);
    if (Object.keys(d).some(k => k !== 'color-scheme' && (!(k in themeRoot) || themeRoot[k] !== d[k]))) paletteConflict = true;
  }
  if (paletteConflict) console.log(dim('  page redefines the palette — exact-text matching only'));

  // Work style block by style block, back to front so offsets stay valid.
  const blocks = [];
  const re = /<style([^>]*)>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) blocks.push({ start: m.index, end: m.index + m[0].length, attrs: m[1], css: m[2] });

  for (let b = blocks.length - 1; b >= 0; b--) {
    const blk = blocks[b];
    let css = blk.css;
    const rules = topLevelRules(decomment(css));
    const cuts = [];

    for (const r of rules) {
      const s = normSel(r.sel);
      const body = norm(r.body);

      if (s === ':root') {
        const decls = parseDecls(r.body);
        const conflicts = Object.keys(decls).filter(k => {
          if (k === 'color-scheme') return false;
          return !(k in themeRoot) || themeRoot[k] !== decls[k];
        });
        if (conflicts.length) {
          kept.push(':root  ' + yel('(' + conflicts.length + ' value(s) differ: ' + conflicts.slice(0, 4).join(', ') + ')'));
          if (/--gold:\s*#c8971a/.test(r.body)) {
            kept.push(dim('        ^ this is a print page — use class="paper" on <body> and delete the block by hand'));
          }
        } else {
          cuts.push(r); removedCount++;
        }
        continue;
      }

      const known = themeRules.get(s);
      if (!known) continue;                       // theme says nothing about this selector
      const literal = r.body.replace(/\s+/g, '').replace(/;$/, '');
      const match = paletteConflict ? known.has(literal) : (known.has(body) || known.has(literal));
      if (match) { cuts.push(r); removedCount++; }
      else kept.push(s + '  ' + dim('(differs from theme — left inline, still wins)'));
    }

    // Splice out the cut rules, back to front.
    cuts.sort((x, y) => y.start - x.start);
    for (const c of cuts) {
      removedBytes += c.end - c.start;
      css = css.slice(0, c.start) + css.slice(c.end);
    }
    css = css.replace(/\n{3,}/g, '\n\n');
    html = html.slice(0, blk.start) + '<style' + blk.attrs + '>' + css + '</style>' + html.slice(blk.end);
  }

  // Add the <link> before the first <style>, once.
  if (!html.includes('scob-theme.css')) {
    html = html.replace(/<style/i, LINK + '\n<style');
  }

  console.log('  ' + grn(removedCount + ' rule(s), ' + removedBytes + ' bytes') + ' removed as identical to the theme');
  if (kept.length) {
    console.log('  kept:');
    kept.forEach(k => console.log('    ' + k));
  }

  if (!apply) { console.log(dim('  dry run — re-run with --apply to write')); return { removedBytes }; }
  if (html === orig) { console.log(dim('  no change')); return { removedBytes: 0 }; }

  fs.writeFileSync(p + '.bak', orig);
  fs.writeFileSync(p, html);
  console.log('  ' + grn('written') + dim('  (backup: ' + file + '.bak)'));
  return { removedBytes, wrote: 1 };
}

function revert(file) {
  const p = path.join(DIR, file), bak = p + '.bak';
  if (!fs.existsSync(bak)) { console.log(red('no backup for ' + file)); return; }
  fs.copyFileSync(bak, p); fs.unlinkSync(bak);
  console.log(grn('reverted ') + file);
}

/* --------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const all = args.includes('--all');
const doRevert = args.includes('--revert');
let files = args.filter(a => !a.startsWith('--'));

if (all) {
  files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
}
if (!files.length) {
  console.log('usage: node migrate-theme.js [--apply] <page.html> [more.html…]');
  console.log('       node migrate-theme.js --all            (dry run over every page)');
  console.log('       node migrate-theme.js --revert <page.html>');
  process.exit(1);
}

if (doRevert) { files.forEach(revert); process.exit(0); }

let total = 0, wrote = 0;
for (const f of files) {
  const r = migrate(f, apply) || {};
  total += r.removedBytes || 0;
  wrote += r.wrote || 0;
}

console.log('\n\x1b[1mTotal\x1b[0m  ' + total + ' bytes of duplicated CSS ' + (apply ? 'removed' : 'removable') +
            ' across ' + files.length + ' page(s)');
if (apply) {
  console.log(yel('\nNow run:  node test-pages.js && ./check-release.sh'));
  console.log(yel('Then open each page once in a browser — this checks text, not pixels.'));
  console.log(dim('Undo with: node migrate-theme.js --revert <page.html>'));
}
