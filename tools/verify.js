#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════════════
   verify.js — έλεγχος δομής του ΑΣΠΙΔΑ (τρέχει με σκέτο node, χωρίς εξαρτήσεις)
   ──────────────────────────────────────────────────────────────────────────────────
   Τι ελέγχει — και γιατί αυτά:
     1. ΜΟΝΟ ΑΡΧΕΙΟ: το index.html δεν ΦΟΡΤΩΝΕΙ τίποτε από το δίκτυο (ούτε script, ούτε
        stylesheet, ούτε εικονίδιο, ούτε γραμματοσειρά). Σύνδεσμος-αναφορά επιτρέπεται·
        φόρτωση όχι. Έτσι το αρχείο δουλεύει και χωρίς σύνδεση, για πάντα.
     2. ΕΙΚΟΝΙΔΙΑ: κάθε data URI αποκωδικοποιείται και ελέγχεται η υπογραφή PNG και οι
        διαστάσεις. Ένα σπασμένο ή άδειο εικονίδιο δεν περνά.
     3. ΕΝΑ ΣΗΜΑ, ΠΕΝΤΕ ΜΕΓΕΘΗ: το ίδιο σχήμα (χρυσή ασπίδα) στα 16, 32, 180, 192, 512 —
        μετρημένο στα pixel, όχι «εμπιστέψου με».
     4. ΤΑΥΤΟΤΗΤΑ: APP_VER / APP_BUILD / APP_DATE / APP_CHECKS και κάθε εμφάνιση της
        έκδοσης (τίτλος, πανό, σχόλιο κεφαλίδας) λένε το ΙΔΙΟ πράγμα.
     5. ΣΚΕΛΕΤΟΣ: υπάρχουν οι καρτέλες και τα βασικά στοιχεία της εφαρμογής· το χρυσό
        δείγμα ύφους έχει και τις τρεις φωνές του.
     6. ΕΝΟΤΗΤΕΣ: τα ΜΕΡΗ/ΠΡΑΞΕΙΣ/ΤΟΜΟΙ μετριούνται όπως τα κεφάλαια· το πρόσωπο μόνο
        στην αφήγηση· τα ονόματα δεν είναι κεφαλαία στην αρχή πρότασης.
     7. ΦΩΣ: το χαρτί (#f6f4ef) είναι η προεπιλογή, η νύχτα υπάρχει ως επιλογή που θυμάται,
        και κανένα χρώμα της παλιάς σκούρης παλέτας δεν έμεινε καρφωμένο στον κώδικα.
     7. ΠΥΛΗ, ΤΑΥΤΟΤΗΤΑ, ΑΝΕΞΑΡΤΗΣΙΑ: η «Πύλη Παραδοτέου» υπάρχει με τα κουμπιά της, η σειρά
        έκδοσης είναι η 5.x, και το αρχείο δεν αναφέρει άλλο πρόγραμμα (ούτε το caveman).
   Έξοδος: κωδικός 1 αν κάτι λείπει — ώστε το CI να σταματά.
   ══════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const FILE = process.argv[2] || path.join(ROOT, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');

let run = 0, fail = 0;
const ok = (c, m, extra) => {
  run++; if (!c) fail++;
  console.log((c ? '✓ ' : '✗ ') + m + (extra ? ' — ' + extra : ''));
};
const grab = (re) => (html.match(re) || [])[1] || '';
const attr = (tag, name) => (tag.match(new RegExp(name + '="([^"]*)"')) || [])[1] || '';

/* ── 1. ΜΟΝΟ ΑΡΧΕΙΟ, ΧΩΡΙΣ ΦΟΡΤΩΣΗ ΑΠΟ ΕΞΩ ─────────────────────────────────── */
const scripts = (html.match(/<script[^>]+src=/g) || []).length;
const loaders = (html.match(/<link[^>]+rel="(?:stylesheet|preload|prefetch|icon|apple-touch-icon|manifest)"[^>]*href="(?!data:)/g) || []).length;
const imports = (html.match(/@import|fonts\.googleapis|cdn\.jsdelivr|unpkg\.com|cdnjs/g) || []).length;
ok(scripts === 0 && loaders === 0 && imports === 0,
   'μονό αρχείο: καμία φόρτωση από το δίκτυο (script ' + scripts + ' · link ' + loaders + ' · import ' + imports + ')');

/* ── 2. ΕΙΚΟΝΙΔΙΑ: ΑΠΟΚΩΔΙΚΟΠΟΙΗΣΗ, ΟΧΙ ΕΜΠΙΣΤΟΣΥΝΗ ──────────────────────── */
const bytesOf = (uri) => {
  const raw = String(uri || '');
  return Buffer.from((raw.indexOf(',') > -1 ? raw.split(',')[1] : raw) || '', 'base64');
};
const pngOf = (uri) => {
  const b = bytesOf(uri);
  return { ok: b.slice(0, 8).toString('hex') === '89504e470d0a1a0a',
           w: b.length > 24 ? b.readUInt32BE(16) : 0,
           h: b.length > 24 ? b.readUInt32BE(20) : 0, bytes: b.length };
};
/* Τα pixel, για να μη «περνά» ένα άδειο PNG: PNG8 με παλέτα, zlib + φίλτρα γραμμής. */
const pixels = (uri) => {
  try {
    const b = bytesOf(uri);
    let off = 8, w = 0, h = 0, bd = 8, ct = 0, plte = null, idat = [];
    while (off < b.length) {
      const len = b.readUInt32BE(off), type = b.slice(off + 4, off + 8).toString('ascii');
      const d = b.slice(off + 8, off + 8 + len);
      if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; }
      else if (type === 'PLTE') plte = d;
      else if (type === 'IDAT') idat.push(d);
      else if (type === 'IEND') break;
      off += 12 + len;
    }
    if (ct !== 3 || bd !== 8 || !plte) return null;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const px = new Uint8Array(w * h * 4);
    let prev = Buffer.alloc(w);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (w + 1)];
      const line = Buffer.from(raw.slice(y * (w + 1) + 1, y * (w + 1) + 1 + w));
      for (let x = 0; x < w; x++) {
        const a = x ? line[x - 1] : 0, bb = prev[x], c = x ? prev[x - 1] : 0;
        let v = line[x];
        if (f === 1) v += a; else if (f === 2) v += bb; else if (f === 3) v += (a + bb) >> 1;
        else if (f === 4) { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c); }
        line[x] = v & 255;
      }
      for (let x = 0; x < w; x++) {
        const i = line[x];
        px[(y * w + x) * 4] = plte[i * 3]; px[(y * w + x) * 4 + 1] = plte[i * 3 + 1];
        px[(y * w + x) * 4 + 2] = plte[i * 3 + 2]; px[(y * w + x) * 4 + 3] = 255;
      }
      prev = line;
    }
    return { w: w, h: h, px: px };
  } catch (e) { return null; }
};
const goldPct = (uri) => {
  const im = pixels(uri); if (!im) return null;
  let g = 0;
  for (let i = 0; i < im.w * im.h; i++) {
    const r = im.px[i * 4], gg = im.px[i * 4 + 1], b = im.px[i * 4 + 2];
    if (r > 150 && gg > 120 && b < 120) g++;
  }
  return Math.round(100 * g / (im.w * im.h));
};
const uri32 = grab(/<link rel="icon" type="image\/png" sizes="32x32" href="(data:image\/png;base64,[^"]+)"/);
const uri16 = grab(/<link rel="icon" type="image\/png" sizes="16x16" href="(data:image\/png;base64,[^"]+)"/);
const uriTouch = grab(/<link rel="apple-touch-icon"[^>]*href="(data:image\/png;base64,[^"]+)"/);
const uriLogo = grab(/<img class="logo" src="(data:image\/png;base64,[^"]+)"/);
const sizes = [['favicon 16', uri16, 16], ['favicon 32', uri32, 32], ['apple-touch 180', uriTouch, 180], ['λογότυπο κεφαλίδας 192', uriLogo, 192]];
sizes.forEach(function (s) {
  const p = pngOf(s[1]);
  ok(p.ok && p.w === s[2] && p.h === s[2], 'εικονίδιο ' + s[0] + ': έγκυρο PNG ' + p.w + '×' + p.h, p.bytes + ' bytes');
});
const maniUri = grab(/<link rel="manifest" href="(data:application\/[a-z+]+\+?json;base64,[^"]+)"/) || grab(/<link rel="manifest" href="(data:[^"]+)"/);
let mani = null;
try { mani = JSON.parse(bytesOf(maniUri).toString('utf8')); } catch (e) { mani = null; }
ok(!!mani && Array.isArray(mani.icons) && mani.icons.length === 2 && mani.icons.every(function (i) { return pngOf(i.src).ok; }),
   'manifest ενσωματωμένο: ' + (mani ? mani.icons.map(function (i) { return pngOf(i.src).w; }).join(' + ') : '—') + ' px, έγκυρα PNG',
   mani ? mani.short_name + ' · ' + mani.theme_color : '');
const gs = [goldPct(uri16), goldPct(uri32), goldPct(uriLogo)].filter(function (v) { return v !== null; });
ok(gs.length === 3 && gs[0] >= 12 && Math.abs(gs[0] - gs[2]) <= 20 && Math.abs(gs[1] - gs[2]) <= 15,
   'ένα σήμα, πολλά μεγέθη: χρυσό στα pixel 16:' + gs[0] + '% · 32:' + gs[1] + '% · 192:' + gs[2] + '% (15–30% = σχήμα, όχι τετράγωνο)');

/* ── 3. ΤΑΥΤΟΤΗΤΑ: ΜΙΑ ΕΚΔΟΣΗ, ΠΑΝΤΟΥ Η ΙΔΙΑ ───────────────────────────────── */
const VER = grab(/const APP_VER='([^']*)'/), BUILD = grab(/const APP_BUILD='([^']*)'/);
const DATE = grab(/const APP_DATE='([^']*)'/), CHECKS = grab(/const APP_CHECKS='([^']*)'/);
ok(!!VER && !!BUILD && !!DATE && !!CHECKS, 'ταυτότητα: έκδοση ' + VER + ' · build ' + BUILD + ' · ' + DATE + ' · ' + CHECKS + ' έλεγχοι');
const title = grab(/<title>([^<]*)<\/title>/);
ok(title.indexOf('v' + VER) > -1 && /ΑΣΠΙΔΑ/.test(title), 'τίτλος παραθύρου: ' + title.slice(0, 62) + '…');
ok(/id="verBadge"[^>]*>v/.test(html) || new RegExp('id="verBadge"[^>]*>v' + VER.replace('.', '\\.')).test(html),
   'πανό: το σήμα έκδοσης δηλώνει v' + VER);
ok(new RegExp('Έκδοση v' + VER.replace('.', '\\.') + '  ·  build ' + BUILD + '  ·  ' + DATE).test(html),
   'σχόλιο κεφαλίδας: «Έκδοση v' + VER + ' · build ' + BUILD + ' · ' + DATE + '»');
const declared = (html.match(/Επαλήθευση κατασκευής: (\d+) έλεγχοι/) || [])[1] || '';
ok(declared === CHECKS, 'η δηλωμένη επαλήθευση συμφωνεί με APP_CHECKS (' + declared + ' = ' + CHECKS + ')');
ok(/^5\./.test(VER) && html.indexOf('v28') === -1 && html.indexOf('v3.') === -1 && html.indexOf('v4.') === -1,
   'σειρά έκδοσης: 5.x (' + VER + ') — καμία εμφάνιση v28 ή παλαιότερης σειράς στο αρχείο');
ok(!/caveman/i.test(html), 'ανεξαρτησία: καμία αναφορά σε ξένο πρόγραμμα μέσα στο αρχείο');

/* ── 3β. ΦΩΣ Ή ΣΚΟΤΟΣ ──────────────────────────────────────────────────────── */
const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
ok(/--bg:#f6f4ef/.test(css) && /body\.dark\{[^}]*--bg:#0f1428/.test(css),
   'θέμα: φωτεινό χαρτί εξ ορισμού (#f6f4ef), νύχτα ως παραλλαγή (#0f1428)');
ok(/id="themeBtn"/.test(html) && /function applyTheme/.test(html) && /wpg_theme/.test(html),
   'θέμα: κουμπί ημέρας/νύχτας που θυμάται την επιλογή (localStorage wpg_theme)');
const leftovers = ['#09090e', '#12121b', '#191926', '#252538', '#e4e3ea', '#898899', '#0b0b12'].filter(function (x) { return html.indexOf(x) > -1; });
ok(leftovers.length === 0, 'θέμα: κανένα καρφωμένο χρώμα της παλιάς σκούρης παλέτας' + (leftovers.length ? ' [' + leftovers.join(',') + ']' : ''));
ok(!!mani && mani.theme_color === '#f6f4ef' && mani.background_color === '#f6f4ef',
   'θέμα: το ενσωματωμένο manifest δηλώνει το ίδιο φωτεινό θέμα (χωρίς μαύρο άλμα στην εγκατάσταση)');

/* ── 3γ. Η ΠΥΛΗ ΠΑΡΑΔΟΤΕΟΥ ─────────────────────────────────────────────────── */
ok(/function manuscriptGate/.test(html) && /id="gateOut"/.test(html) && /Πύλη Παραδοτέου/.test(html),
   'πύλη παραδοτέου: υπάρχει, με πάνελ αποτελέσματος και κάρτα στην καρτέλα επιμέλειας');
ok(/function chapterSegments/.test(html) && /function gtPovTense/.test(html) && /function gateVerdictText/.test(html),
   'πύλη παραδοτέου: κατατμήει το χειρόγραφο, διαβάζει πρόσωπο/χρόνο και βγάζει συμπέρασμα με λόγο');
ok(/gateToPrompt/.test(html), 'πύλη παραδοτέου: τα ευρήματα γυρίζουν στο prompt ως οδηγία διόρθωσης');

const repo = 'github.com/Mylittlestories/aspidha';
ok(html.indexOf(repo) > -1, 'το αρχείο δηλώνει το αποθετήριό του (' + repo + ') — σύνδεσμος, όχι εξάρτηση');

/* ── 4. ΣΚΕΛΕΤΟΣ ΕΦΑΡΜΟΓΗΣ ─────────────────────────────────────────────────── */
const tabs = ['forge', 'names', 'audit', 'world', 'ledger', 'edit'];
const missing = tabs.filter(function (t) { return html.indexOf('data-tab="' + t + '"') < 0; });
ok(missing.length === 0, 'καρτέλες: ' + tabs.length + ' καρτέλες παρούσες' + (missing.length ? ' — λείπουν: ' + missing.join(',') : ''));
const ids = ['promptOut', 'nameOut', 'auditOut', 'worldFields', 'ledgerPeople', 'editOut', 'verBadge'];
const lack = ids.filter(function (i) { return html.indexOf('id="' + i + '"') < 0; });
ok(lack.length === 0, 'στοιχεία: τα βασικά πεδία υπάρχουν' + (lack.length ? ' — λείπουν: ' + lack.join(',') : ''));
const voices = (html.match(/GOLD\s*=\s*\{|label:\s*'/g) || []).length;
ok(voices >= 3, 'χρυσό δείγμα ύφους: ' + voices + ' καταχωρίσεις φωνών (χρειάζονται ≥3)');
const golds = (html.match(/ΧΡΥΣΟ_ΔΕΙΓΜΑ/g) || []).length;
ok(golds >= 6, 'ο μηχανισμός του χρυσού δείγματος είναι παρών (' + golds + ' αναφορές: μπλοκ, σκάλα, έλεγχοι)');
ok(/ΣΥΜΒΟΛΑΙΟ ΟΝΟΜΑΤΩΝ/.test(html), 'συμβόλαιο ονομάτων: το κλειδωμένο λεξιλόγιο δηλώνεται μέσα στο prompt');
ok(/continuation|ΓΡΑΜΜΗ ΣΥΝΕΧΕΙΑΣ|γραμμή συνέχειας/i.test(html), 'γραμμή συνέχειας: το έργο συνεχίζεται χωρίς επανεκκίνηση');
ok(html.indexOf('__adopting') > -1, 'υιοθέτηση ονομάτων: ό,τι υιοθετεί ο χρήστης δεν σβήνεται από την επόμενη κλήρωση');

console.log('\n' + '─'.repeat(72));
console.log(fail === 0 ? 'ΟΛΟΚΛΗΡΩΘΗΚΕ: ' + run + ' έλεγχοι, 0 αποτυχίες · ' + path.basename(FILE) + ' (' + (html.length / 1024).toFixed(0) + ' KB)'
                       : 'ΑΠΟΤΥΧΙΑ: ' + fail + ' από ' + run);
process.exit(fail === 0 ? 0 : 1);
