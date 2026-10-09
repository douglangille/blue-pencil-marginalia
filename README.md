# Marginalia

Marks parts of speech and mechanical writing signals beside your text in Obsidian, like notes in a margin. It never rewrites anything, makes no network calls, and uses no AI. Everything is word lists, patterns and counting.

A mark is a signal, not a verdict. One instance means little. A pattern that repeats in every paragraph is what to look at, so each check shows its hit count and how many paragraphs it spans. You decide what stays.

## What you get

- **Panel (left sidebar).** Tabs for Stats, Syntax, Rhythm, Flow, Structure, Words, Dialogue, Detail, Setup and Help. Every check has a toggle and its own color, and every tab has an All switch.
- **Map (right sidebar).** The whole note as small word bars, flagged words colored. Chips list what is flagged; click one to isolate it. Click anywhere to jump.
- **At the cursor.** Click a word or sentence and the panel lists everything flagged there.
- **Essay or Story.** Auto-detected from the note (past tense, pronouns, dialogue, reading level) or set by hand. Some checks only appear for one.
- **Your usual range.** In Setup, point Marginalia at folders of your own finished essays and stories. It measures them once, then shows the open note against your usual range (▲ above, ▼ below).
- **Readable marks.** While anything is switched on, the editor gets a neutral dark or light background and every color is nudged to stay readable on it. Turn that off in Setup.

The ribbon icon (notebook) shows or hides the panel and the map together. The Help tab explains each check with an example.

## The checks

- **Syntax:** nouns, verbs, adjectives, adverbs, conjunctions and prepositions.
- **Rhythm:** long sentences, same-length runs, long/short swings, runs of short sentences, repeated openers, regular one-line paragraphs.
- **Flow:** topic jumps, roadmap phrases, throat-clearing, scattered concessions, tacked-on paragraph endings.
- **Structure:** "not X, but Y", lists of three, trailing "which" clauses, "serves as", rhetorical questions, similes, stacked modifiers.
- **Words:** filler, wordy phrases, passive voice, abstract nouns, vague nouns, hedges, doubled and repeated words, uncontracted forms, commonly misused words, em dashes and semicolons.
- **Dialogue (stories):** quoted speech, fancy tags, adverbs in tags, a tag on every line, semicolons in speech, long runs of bare dialogue.
- **Detail:** specifics (where concrete detail lives), stock body language, personified abstractions, filter words.
- **Stats:** word, sentence and paragraph counts, reading grade, Gunning Fog, vocabulary diversity, sentence and paragraph variation, and more.

## Install

**With BRAT:** add `douglangille/marginalia` as a beta plugin.

**By hand:** download `main.js`, `manifest.json` and `styles.css` from the latest release into `<your vault>/.obsidian/plugins/marginalia/`, then enable Marginalia under Community plugins.

**From source:** clone the repo into `<your vault>/.obsidian/plugins/marginalia/` (or symlink it there) and run `sh build.sh`.

Desktop only for now. English only.

## Honest limits

- Part-of-speech tagging uses [compromise](https://github.com/spencermountain/compromise), which is fast and offline but not perfect. Some words will be mislabeled.
- The built-in cutoffs (a long sentence is 25+ words, for example) are rules of thumb. The "usual range" feature is there so you can compare against your own writing instead.
- Auto-detect compares against the profiles you build, so it needs both an essay folder and a story folder.
- Several checks are proxies. "Topic jump" asks whether a sentence shares any word with the one before it, which is a rough stand-in for flow. Treat every mark as a prompt to look, not a defect.

## Develop

`main.js` is generated. After editing `plugin.js` or `rules.js`, run `sh build.sh`, which joins `vendor/compromise.js`, `rules.js` and `plugin.js`. `node test/run.cjs` runs the analysis tests against `main.js` with Obsidian stubbed out.

## Credits and license

MIT, see `LICENSE`. Part-of-speech tagging by compromise 14.18.0 (MIT, license in `vendor/`). Cutoffs draw on GOV.UK plain-language guidance and the Plain English Campaign.
