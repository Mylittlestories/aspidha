# 🛡️ ΑΣΠΙΔΑ (Aspidha) — Bulletproof Prompt Forge

**v5.7 · build VV · 2026-09-22** — a single HTML file (≈800 KB), light interface, offline, no dependencies, no installation.

[![Version](https://img.shields.io/badge/version-v5.7-d4af37)](https://github.com/Mylittlestories/aspidha/releases)
[![Checks](https://img.shields.io/badge/checks-574%2F574%20%E2%9C%93-27ae60)](tools/verify.js)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![Single file](https://img.shields.io/badge/single%20file-offline-8c7ae6)
![Language](https://img.shields.io/badge/prose%20language-Greek-e67e22)

![ΑΣΠΙΔΑ — Bulletproof Prompt Forge](assets/banner-1280.png)

**Ελληνικά:** [διάβασε το README στα ελληνικά](README.el.md) · **Live:** <https://Mylittlestories.github.io/aspidha/>

---

## What it is, and what it is for

**Aspidha does not write your novel. It forges the prompt that makes an AI model — ChatGPT, Claude, Gemini, a local model — write it the way *you* want, and then measures the result with numbers instead of taste.**

It is built for **Greek-language fiction**: inflections, Greek typography, sentence rhythm, dialogue,
names that do not echo films or novels. It runs entirely on your machine — nothing is uploaded,
there is no telemetry, no account, no network call of any kind. Download the file and it works
forever.

**The problem it solves:** language models write alike — flat paragraphs, average prose, predictable
imagery, clichéd names, a sudden "the end" in the middle of a scene. Aspidha puts into the prompt
the commitments that are usually missing: a **measured voice** (a real sample, not an adjective), a
**name contract** (locked names with their Greek cases), **pace quotas** (≈13.6 words per sentence,
45–55% of sentences under ten words), a **continuity line** that carries state into the next
chapter, and a **final self-check** the model must produce before it stops.

Who it is for: novelists and short-story writers working in Greek, editors, and anyone who wants a
model to keep a book-length project consistent instead of drifting chapter by chapter.

---

## What's new in v5.7

**The repository and the app's introduction now speak English — so anyone can see what this is and
what it is for.** The tool itself keeps writing Greek; what changed is everything around it:

- **`README.md` is now in English** (this file), and the Greek original is preserved as
  [`README.el.md`](README.el.md), with links between the two.
- **The app's introduction is bilingual.** The page description and the social preview (og/Twitter)
  start in English, and the header carries one short English line — *"A single-file, offline studio
  that forges the prompt which makes any AI model write your novel the way you want — then measures
  what came back: pace, narrative person, dialogue, names, continuity."* The interface and the
  prompts themselves remain Greek: the tool is built for Greek prose.
- **A false positive found and closed while doing this.** The structural check that verifies every
  `onclick` handler has an implementation read the new `content="Aspidha (…)"` meta tag as a handler
  named "Aspidha" and reported the structure broken. The check now requires whitespace before `on…=`
  (73 real handlers, all implemented).

- **A test that was a lottery, made deterministic.** The gate check that verifies an unknown name is
  reported was picking its "unknown" from the same pool the tool draws names from: when the Name
  Forge happened to lock that name at start-up, the gate *correctly* stayed silent (a locked name is
  part of the contract) and the check failed — one run in seven. The fixture now uses a name that is
  provably absent from the tool's pools, clears the locks first, and locks the other half of the same
  rule: once the stranger is adopted, the warning goes quiet.

---

## What's new in v5.6

**The per-chapter continuation instructions are now produced by the tool itself.** What used to be
the writer's job — which chapter needs work, how many words are missing, at what pace, what must
stay exactly as it is — is measured by the Delivery Gate and written out for you, one block per
chapter:

- **Button "📝 Per-chapter continuation instructions"** in the Delivery Gate card. It reads the
  manuscript you pasted and measures every unit separately: words vs. target, the six-sentence
  breathing paragraph, pace, narrative person, tense, dialogue share, proper names.
- **Sorted by shortfall.** The chapter that is furthest off comes first — one click catches the
  worst, not a random one.
- **Every block stands alone.** "You have delivered 183 of 600 words. Write 417 more words of the
  SAME SCENE — not a summary, not a new scene, not a repetition." Alongside it: the majority person
  and tense of the work (with an instruction to return, if the unit drifted), the breathing
  paragraph with its rule, the pace target (≈13.6 words/sentence) together with the unit's measured
  figure, the dialogue percentage, the locked names, and the closing rule.
- **Continuity line with the unit's own identity.** `STATUS: **chapter three** complete · next
  scene: …` — not the last word of the title, and with Greek accents correct in lower case.
- **Three buttons:** copy, download `.md`, and "send instructions block into the manuscript field" —
  inserted once (a second click will not duplicate it).
- **When everything hits the target, it says so.** "✓ NO CONTINUATION PENDING", with the locked
  names as a reminder — the tool does not invent work to look useful.

---

## What's new in v5.5

Tested against **every completed work of the author** (Η ΟΦΕΙΛΗ 18,299 words · Η ΑΠΟΔΕΙΞΗ 13,660 ·
ΤΟ ΞΕΒΓΑΛΜΑ · ΤΟ ΑΚΟΥΣΜΑ · ΕΚΘΕΣΗ ΑΥΤΟΨΙΑΣ · and more) — and every finding went back into the
tool so that it cannot happen again:

- **Narrative person is measured in narration only.** Dialogue speaks in the first person even when
  the story is in the third ("—Where are you going? —Home"). Before, any novel with live dialogue
  was reported as "shifting person" — a false accusation. Two works were wrongly blamed.
- **Person shows in the ending.** In Greek, "δουλεύαμε" is first person plural without a pronoun;
  "γύρισε" is third. Verb endings are now counted, with a stop-list so that "οκτώ", "λόγω" and
  "αίθουσα" are not read as verbs.
- **A capital letter is not a name.** "Πήρα τους φακέλους" and "Γύρισε και κοίταξε" used to come out
  as characters (Η ΟΦΕΙΛΗ had 25 "characters" that were verbs). A name is now something that also
  appears **inside** a sentence, where a capital has no other explanation.
- **One person, one entry.** "Ρίτσι", "Μπόουντεν" and "ΡΙΤΣΙ ΜΠΟΟΥΝΤΕΝ" are the same person — the
  tool merges the forms and counts occurrences, with correct accents.
- **PARTS, ACTS and VOLUMES count as units.** ΤΟ ΞΕΒΓΑΛΜΑ has five PARTS and the gate reported "0
  chapters" — i.e. it checked nothing at all (not length, not pace, not person).
- **The ending is judged at the tail.** Asymmetric quotation marks in the middle no longer mean "the
  work was truncated" — two works were wrongly blocked.
- **Quotation marks are checked with a state machine**, so two different mistakes stay distinct:
  "closing without opening" (a stray ») and "opening without closing" (a missing »), each with its
  line number. A quotation that spans several paragraphs is **not** flagged.
- **Two new checks:** pace that drifts away from the contract (≈13.6 words/sentence) is reported, so
  that it is either fixed or declared as a deliberate choice; and a **sudden change of texture in
  the finale** (in Η ΑΠΟΔΕΙΞΗ dialogue fell from 50–72% to 11% in the last chapter).
- **No fake success:** "all chapters hit the target" is said only when at least one unit with a
  target exists; otherwise the tool asks for chapter headings so that it can measure at all.
- **Two real mistakes were found in the works** (a stray » in ΤΟ ΑΚΟΥΣΜΑ, two unclosed quotations in
  ΤΟ ΞΕΒΓΑΛΜΑ) — fixed in the corrected files under `ΔΙΟΡΘΩΜΕΝΑ/`.

Also in v5.5:

- **Light interface by default.** Paper (#f6f4ef), white cards, ink (#14203a) — and the logo redrawn
  on the same paper, so icon, page and manifest agree. Night owls press **🌙 Dark**: the choice is
  remembered by the browser.
- **Delivery Gate** ("Copyedit" tab). Paste the manuscript and get a measured verdict: PASS / PASS
  WITH CAUTION / **DOES NOT PASS**, with a reason for every finding, a per-chapter table (words,
  target, mean sentence length, six-sentence paragraph, dialogue, person, tense, names), warnings
  for tense/person shifts, names outside the contract, characters that fade, and an open ending.
  One click turns the findings **into the prompt** as a fix instruction; another downloads the
  report as Markdown.
- **A fix that saved text.** Protocol trimming now stops exactly where the protocol ends: previously
  a measurement pasted mid-manuscript removed everything after it from the count. Now the following
  chapter is measured in full, and a protocol found inside the body is reported as a warning —
  nothing is hidden, nothing is erased.
- **Version numbering returns to 5.x.** The "v28.0" numbering is retired; v5.4 follows v5.3. The file
  mentions no other program — the "independence" check verifies this on every push.

---

## Quick start

**1. Open it now** — <https://Mylittlestories.github.io/aspidha/> (GitHub Pages).

**2. Download it** — grab [`index.html`](index.html) (or the identical
[`writing-prompt-generator.html`](writing-prompt-generator.html)) and double-click it. No server, no
internet: the file is self-contained.

**3. From the repository**

```bash
git clone https://github.com/Mylittlestories/aspidha.git
cd aspidha && open index.html      # Linux: xdg-open index.html
```

> The app is **one** self-contained file. The `assets/` folder exists for the README, the og-image
> and the repository icons — the app never requests them. You can keep only `index.html` and delete
> everything else.

---

## What it does — six tabs

| Tab | What it does |
|---|---|
| 🎛 **Prompt Forge** | Composes the full prompt: system directive, project specifications, onomastics, world building, voice, quality gate, anti-detection, continuity ledger. Three size tiers with calibrated token counts. |
| 🏷 **Name Forge** | Names that fit the genre and the **naming framework** you choose — phonology, Greek cases, similarity check against well-known works. The draw changes with every press. |
| 🔍 **Text Audit** | Measures what you wrote: pace and sentence-length distribution, bullet paragraphs, smoke words, repetitions, unsupported dialogue, etymology, borrowings from the style sample, distance from the target voice. |
| 🌍 **World** | Twelve layers of world building (place, technology, institutions, economy, language, myth…) with a consistency check. |
| 📚 **Continuity Ledger** | Chapter, summary, characters with their cases, key objects, threads. Whatever you declare, the prompt knows it every time — and anything dropped is dropped **declared**, never silently. |
| ✒️ **Copyedit** | Clean copy, seven copyedit passes, style sheet, name-contract check, progress sheet, report export. |

In between: 🥁 pace quotas (13.6 words/sentence · 45–55% under 10) · 🎯 borrowings from the golden
sample · 💬 dialogue discipline (tags, movement) · ✍️ Greek typography · ♻️ phrase recycling · 🪨
compact prompt (fewer tokens, same commitment) · copy with three fallbacks · project memory ·
history · your own text corpus with search.

---

## The discipline of the protocol

- **Golden style sample** — three voices (dry / interior / cinematic), two or three paragraphs
  written for the tool. The prompt does not **describe** the style; it **shows** it and forbids
  borrowing its content. When the budget tightens, the sample shrinks to a small dose — and only in
  an extreme case does it leave, declared.
- **Three tiers** — `Full` ≈35,000 chars (≈15,800 o200k tokens) · `Medium` ≈15,000 (≈6,800) ·
  `Minimal` ≈7,700 (≈3,470). The size supervisor trims in priority order (dossier → ledger → name
  contract → sample last) and **declares** what it cut.
- **Name contract** — whatever you lock stays, in every case; any other proper name is forbidden.
  The tool can **adopt** the names it found in your text with one click, and the next draw does not
  erase them.
- **Continuity line** — the end of every chapter carries state, last sentence and next scene: the
  following chapter starts without a restart and without loops.
- **Measurement outside the text** — the word count is requested under its own label, with a blank
  line, so that it never ends up inside the manuscript.
- **Delivery Gate** — the last filter before the publisher: per-chapter measures, a verdict with a
  reason, and a fix instruction that returns to the prompt with one click.
- **Light or dark** — light by default (paper), dark with one press, remembered.

---

## Why trust it

- **574 checks, 0 failures, in 51 sections.** The development suite (`rev.js`) exercises the tool's
  behaviour in a virtual environment: forge bursts, budget limits, stress with a full ledger,
  false positives in the text audit, name contract, typography — plus two sections that test
  **manuscripts whose truth we know**: a clean three-chapter work (passes, with 8 verifications) and
  a broken one (a short chapter, a tense shift, no breathing paragraph, a truncated clause) that
  **does not pass**.
- **The audit does not lie.** Every finding of the Text Audit carries a measured figure and an
  example; anything that did not hold up was hunted down and closed (false "outside contract",
  "paragraph without final punctuation" in introductions ending with ":", etymology with negation,
  bullet/staccato flagged in narration only).
- **The logo's pixels are measured.** CI decodes the embedded PNGs, checks dimensions, and verifies
  that the golden shape exists at 16/32/192 px — it will not pass an empty icon.
- **No network loads.** An `href` pointing at this repository is a link, not a dependency. CI checks
  it too: zero `src`, zero stylesheets, zero `@import`.

Run the checks yourself:

```bash
node tools/verify.js            # 33 structural checks (no dependencies)
```

---

## Repository layout

```
index.html                     the app — the WHOLE tool, one file, offline
writing-prompt-generator.html  the same file (historical name, identical content)
README.md                      this file (English)
README.el.md                   the same README in Greek
manifest.webmanifest           for "add to home screen" when served as a website
assets/                        the logo (SVG + PNG 16/32/180/192/512), banner, og-image
tools/verify.js                structural check (33 checks) — runs in CI
.github/workflows/verify.yml   CI: checks on every push
CHANGELOG.md                   what changed, version by version
LICENSE                        MIT © 2026 George Derventlis
```

---

## Limits, honestly

- **It is a writing tool, not a writer.** Without your own text, the prompt produces a good first
  chapter — not a book. Its value shows from the second chapter onward, with a ledger.
- **`Minimal` is a compromise.** Everything cut to fit in 8k tokens is declared; in a small window,
  ask for **one chapter at a time** (≥1,500 words), exactly as the prompt itself instructs.
- **Style measurements are targets, not literary criteria.** Pace and percentages come from measured
  texts; they do not replace your judgement — they free it from mechanical mistakes.
- **The interface and the prompts are in Greek.** The tool is built for Greek prose and its field
  names are Greek terms; there is no English translation of the interface. (The English in this
  README is here so that non-Greek speakers can see what the project is and what it is for.)

---

## License & credits

MIT — see [LICENSE](LICENSE). Free to use, with attribution.

- Live: <https://Mylittlestories.github.io/aspidha/> · Windows / macOS / Linux · any modern browser
- Verified: 574 development checks, 0 failures · 33 structural checks in CI

The tool was built by studying **technique**, not by copying texts: accounts of sentence rhythm and
voice, guides to naming imaginary worlds, essays on the relationship between style and machine, and
measured Greek texts. No borrowing ends up in the user's text: the golden sample was written for the
tool, and the prompt explicitly forbids borrowing from it.

Questions, ideas, mistakes: open an **issue** in the repository. If you find a false finding in the
text audit, paste the excerpt — that is the only way it gets fixed.
