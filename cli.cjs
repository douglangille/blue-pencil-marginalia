#!/usr/bin/env node
// Headless Blue Pencil: the plugin's analysis on a file, reported as markdown. No AI, no network.
// Usage: node cli.cjs <file> [--mode=essay|story|auto] [--examples=4] [--json]
// Needs main.js (sh build.sh). Compares against profile-essay.json / profile-story.json beside it.
const Module = require("module"), fs = require("fs"), path = require("path");
const orig = Module._load;
global.document = { body: { classList: { contains: () => false, toggle() {}, remove() {} }, style: { setProperty() {}, removeProperty() {} } } };
Module._load = function (r, ...a) {
  if (r === "obsidian") return { Plugin: class {}, ItemView: class {}, Setting: class {}, MarkdownView: class {}, Notice: class {}, debounce: (f) => f };
  if (r === "@codemirror/view") return { ViewPlugin: { fromClass() {} }, Decoration: {} };
  if (r === "@codemirror/state") return { StateEffect: { define() {} } };
  return orig.call(this, r, ...a);
};
const dir = __dirname;
const src = fs.readFileSync(path.join(dir, "main.js"), "utf8") + "\n;module.exports._nlp = nlpMod.exports.default || nlpMod.exports;";
const m = { exports: {} };
new Function("require", "module", "exports", src)(require, m, m.exports);
const { _analyzeDoc, _classify, _nlp } = m.exports;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => { const a = args.find((x) => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
if (!file) { console.error("Usage: node cli.cjs <file> [--mode=essay|story|auto] [--examples=4] [--json]"); process.exit(1); }
const text = fs.readFileSync(file, "utf8");
const profiles = {};
for (const k of ["essay", "story"]) { try { profiles[k] = JSON.parse(fs.readFileSync(path.join(dir, `profile-${k}.json`), "utf8")); } catch (e) {} }
const a = _analyzeDoc(_nlp, text);
let mode = opt("mode", "auto"), modeNote = "";
if (mode === "auto") { const c = _classify(a, profiles); mode = c ? c.label : "essay"; modeNote = c ? ` (auto, ${Math.round(c.p * 100)}%)` : " (auto failed, defaulted)"; }
const prof = profiles[mode];
const W = a.stats.words, kw = W / 1000;

// Classes that are context or structure, not signals worth listing.
const SKIP = /^sl-(noun|verb|adj|adv|conj|dialogue|spec|radar|passive)$/;
const STORY_ONLY = ["sl-tagfancy", "sl-tagadv", "sl-tagrun", "sl-dlgsemi", "sl-talk", "sl-stock", "sl-person", "sl-filter", "sl-closer"];
const ESSAY_ONLY = ["sl-throat", "sl-road", "sl-concede", "sl-nom", "sl-uncontr", "sl-jump"];
const hidden = mode === "story" ? ESSAY_ONLY : STORY_ONLY;
// Rule text for each class, read from the plugin's own list so the code stays the one doc.
const LABEL = {};
for (const mm of src.matchAll(/\["(sl-[a-z]+)", "((?:[^"\\]|\\.)*)"/g)) LABEL[mm[1]] = mm[2];

const lineOf = (off) => text.slice(0, off).split("\n").length;
const snip = (h) => {
  const ls = text.lastIndexOf("\n", h.from - 1) + 1, le = text.indexOf("\n", h.to); const line = text.slice(ls, le < 0 ? undefined : le);
  const s = Math.max(0, h.from - ls - 50), e = Math.min(line.length, h.to - ls + 50);
  return (s ? "…" : "") + line.slice(s, e).trim() + (e < line.length ? "…" : "");
};
const mark = (key, v) => { const p = prof && prof.metrics[key]; if (!p || !Number.isFinite(v)) return null; return { lo: p.p10, hi: p.p90, st: v < p.p10 ? "lo" : v > p.p90 ? "hi" : "ok" }; };
const f = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "-");

const rows = [];
for (const cls of Object.keys(a.counts)) {
  if (SKIP.test(cls) || hidden.includes(cls)) continue;
  const n = a.counts[cls], rate = W ? n / kw : 0, u = mark("rate:" + cls, rate);
  rows.push({ cls, n, paras: a.paraHits[cls] || 0, rate, u });
}
// Hard rules (Doug's own: no em dash, no semicolons outside nothing).
const em = (text.match(/—/g) || []).length, semi = (text.match(/;/g) || []).length;
const interesting = rows.filter((r) => r.u ? r.u.st === "hi" : r.n >= 3).sort((x, y) => (y.u ? y.rate / (y.u.hi || 0.1) : 1) - (x.u ? x.rate / (x.u.hi || 0.1) : 1));

if (args.includes("--json")) { console.log(JSON.stringify({ mode, words: W, stats: a.stats, counts: a.counts, paraHits: a.paraHits, emDashes: em, semicolons: semi, above: interesting.map((r) => r.cls) }, null, 1)); process.exit(0); }

const out = [];
out.push(`# Blue Pencil report: ${path.basename(file)}`, "", `${W} words, ${a.stats.sentences} sentences, ${a.stats.paragraphs} paragraphs. Mode: ${mode}${modeNote}.${prof ? ` Compared with your usual range (${prof.n} finished ${mode}s).` : " No profile found, so no comparison."}`, "");
out.push("## Hard rules", `- Em dashes: ${em}${em ? " FAIL" : " ok"}`, `- Semicolons: ${semi}${semi ? " FAIL" : " ok"}`, "");
out.push("## Numbers outside your usual range");
const NUM = [["avgSentence", "Average sentence (words)"], ["variation", "Sentence variation"], ["lumpiness", "Lumpiness"], ["pacing", "Pacing exponent"], ["grade", "Reading grade"], ["contractPer100", "Contractions per 100 words"], ["shortPct", "Short sentences %"], ["paraCV", "Paragraph variation"], ["adverbPct", "Adverbs %"], ["passivePct", "Passive %"], ["specificsPer100", "Specifics per 100 words"], ["mattr", "Vocabulary diversity"]];
let any = false;
for (const [k, label] of NUM) { const v = a.stats[k], u = mark(k, v); if (u && u.st !== "ok") { any = true; out.push(`- ${label}: ${f(v, 2)} ${u.st === "hi" ? "▲" : "▼"} (usual ${f(u.lo, 2)} to ${f(u.hi, 2)})`); } }
if (!any) out.push("- none");
out.push("", "## Signals above your usual rate (per 1000 words)", "", "| Signal | Hits | Paragraphs | Rate | Usual max |", "|---|---|---|---|---|");
for (const r of interesting) out.push(`| ${LABEL[r.cls] || r.cls} | ${r.n} | ${r.paras}/${a.stats.paragraphs} | ${f(r.rate)} | ${r.u ? f(r.u.hi) : "n/a"} |`);
if (!interesting.length) out.push("| none | | | | |");
const nEx = +opt("examples", 4);
out.push("", "## Examples (for judgment, one line each)");
for (const r of interesting) {
  const hs = a.hits.filter((h) => h.cls === r.cls).slice(0, nEx);
  out.push(`- **${LABEL[r.cls] || r.cls}**`);
  for (const h of hs) out.push(`  - L${lineOf(h.from)}: ${snip(h)}`);
}
out.push("", "Signals, not verdicts. A mark means look, not fix. Protect rough edges you chose.");
console.log(out.join("\n"));
