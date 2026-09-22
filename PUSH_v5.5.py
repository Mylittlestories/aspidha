#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUSH_v5.5.py — δημοσίευση της ΑΣΠΙΔΑΣ v5.5 στο GitHub.

ΤΙ ΚΑΝΕΙ (με τη σειρά)
  1. push του τοπικού commit στο main (μέσω https με token στο URL — ΔΕΝ γράφεται σε
     κανένα αρχείο, κανένα .git/config, κανένα commit· μένει στη μνήμη της εντολής).
  2. push του tag v5.4.
  3. διαγραφή του αποσυρμένου release v28.0 και του tag v28.0 (αν υπάρχουν).
  4. δημιουργία release v5.4 με τις σημειώσεις από docs/RELEASE_NOTES_v5.5.md.
  5. έλεγχος ότι η ζωντανή σελίδα (GitHub Pages) σερβίρει το ΝΕΟ αρχείο: συγκρίνει
     sha256 τοπικού index.html και της σελίδας, με λίγες επαναλήψεις για το rebuild.

ΧΡΗΣΗ
  GH_TOKEN=ghp_... python3 publish/PUSH_v5.4.py

ΔΕΝ ΤΥΠΩΝΕΙ ΠΟΤΕ ΤΟ TOKEN. Αν κάτι αποτύχει, λέει τι και σταματά.
"""
import base64, hashlib, io, json, os, subprocess, sys, time, urllib.request, urllib.error

REPO = 'Mylittlestories/aspidha'
ROOT = os.path.dirname(os.path.abspath(__file__))
TOKEN = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN') or ''
if not TOKEN:
    print('✗ Λείπει το token.  Χρήση:  GH_TOKEN=... python3 publish/PUSH_v5.4.py'); sys.exit(2)

AUTH = {'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'aspidha-release'}

def api(method, path, body=None, raw=False):
    url = 'https://api.github.com' + path
    data = None if body is None else json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=AUTH, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            payload = r.read()
            return r.status, (payload if raw else (json.loads(payload) if payload else None))
    except urllib.error.HTTPError as e:
        return e.code, (e.read()[:400].decode('utf-8', 'replace'))

def git(*args, url_with_token=False):
    cmd = ['git', '-C', ROOT] + list(args)
    if url_with_token:
        cmd = [a.replace('https://github.com/', 'https://x-access-token:%s@github.com/' % TOKEN) for a in cmd]
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout or '') + (p.stderr or '')
    print(('  ✓ ' if p.returncode == 0 else '  ✗ ') + ' '.join(a for a in args if not a.startswith('https://')) )
    if out.strip():
        print('     ' + out.strip().replace(TOKEN, '<κρυφό>').replace('\n', '\n     '))
    return p.returncode == 0

print('══ 1. PUSH ΤΟΥ ΚΩΔΙΚΑ ══')
sha = subprocess.run(['git', '-C', ROOT, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
print('  τοπικό commit:', sha[:9])
if not git('push', 'https://github.com/%s.git' % REPO, 'HEAD:main', url_with_token=True):
    print('✗ Το push απέτυχε — τίποτε άλλο δεν εκτελέστηκε.'); sys.exit(1)

print('══ 2. TAG v5.4 ══')
git('push', '--force', 'https://github.com/%s.git' % REPO, 'refs/tags/v5.5', url_with_token=True)

print('══ 3. ΑΠΟΣΥΡΣΗ ΤΟΥ v28.0 ══')
for tag in ['v28.0']:
    st, _ = api('DELETE', '/repos/%s/git/refs/tags/%s' % (REPO, tag))
    print(('  ✓ ' if st in (204, 404, 422) else '  ✗ ') + 'tag %s %s' % (tag, 'έφυγε' if st == 204 else ('δεν υπήρχε πια' if st in (404, 422) else st)))
st, rels = api('GET', '/repos/%s/releases?per_page=30' % REPO)
if not isinstance(rels, list):                       # το GET μπορεί να αποτύχει σε νέο token: δεν σταματάμε γι' αυτό
    print('  ⚠ δεν διαβάστηκε η λίστα releases (%s) — συνεχίζω' % str(rels)[:80]); rels = []
old = [r for r in rels if r.get('tag_name') == 'v28.0']
for r in old:
    st, _ = api('DELETE', '/repos/%s/releases/%s' % (REPO, r['id']))
    print(('  ✓ ' if st in (204, 404) else '  ✗ ') + 'release v28.0 (id %s) %s' % (r['id'], 'διαγράφηκε' if st == 204 else st))

print('══ 4. RELEASE v5.4 ══')
notes = io.open(os.path.join(ROOT, 'docs/RELEASE_NOTES_v5.5.md'), encoding='utf-8').read()
body = {'tag_name': 'v5.5', 'name': 'ΑΣΠΙΔΑ v5.5 — δοκιμή σε όλα τα έργα: επτά ψευδείς καταγγελίες κλεισμένες',
        'body': notes, 'draft': False, 'prerelease': False}
st, rel = api('POST', '/repos/%s/releases' % REPO, body)
if st in (200, 201):
    print('  ✓ δημιουργήθηκε: ' + rel['html_url'])
else:
    st2, rels = api('GET', '/repos/%s/releases?per_page=30' % REPO)
    mine = [r for r in (rels if isinstance(rels, list) else []) if r.get('tag_name') == 'v5.5']
    if mine:
        st3, rel = api('PATCH', '/repos/%s/releases/%s' % (REPO, mine[0]['id']), {'body': notes, 'name': body['name']})
        print('  ✓ ενημερώθηκε υπάρχον release: ' + rel['html_url'])
    else:
        print('  ✗ δεν δημιουργήθηκε release (%s): %s' % (st, str(rel)[:200]))

print('══ 5. ΖΩΝΤΑΝΗ ΣΕΛΙΔΑ (Pages) ══')
local = io.open(os.path.join(ROOT, 'index.html'), 'rb').read()
want = hashlib.sha256(local).hexdigest()
url = 'https://mylittlestories.github.io/aspidha/?v=' + str(int(time.time()))
got = None
for i in range(20):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'aspidha-check', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(req, timeout=30) as r:
            live = r.read()
        got = hashlib.sha256(live).hexdigest()
        if got == want:
            print('  ✓ η ζωντανή σελίδα είναι το νέο αρχείο (%d KB, sha256 %s…)' % (len(live) // 1024, got[:12]))
            break
        print('  … το Pages ξαναχτίζεται (%dο δευτ., ζωντανό %d KB)' % (20 * (i + 1), len(live) // 1024))
    except Exception as e:
        print('  … καμία απάντηση ακόμη (%s)' % str(e)[:60])
    time.sleep(20)
else:
    print('  ⚠ Το Pages δεν έδειξε ακόμη το νέο αρχείο. Άνοιξε το Actions του αποθετηρίου: το workflow «pages» χρειάζεται λίγα λεπτά.')

print('\nΤΕΛΟΣ. Τοπικό αρχείο: %s' % hashlib.sha256(local).hexdigest()[:16])
