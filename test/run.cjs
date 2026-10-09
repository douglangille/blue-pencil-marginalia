// Node tests for the analysis code. Obsidian and CodeMirror are stubbed; compromise is real.
// Run: node test/run.cjs   (after sh build.sh)
const Module = require("module"), fs = require("fs"), path = require("path"), assert = require("assert");
const orig = Module._load;
global.document = { body: { classList: { contains: () => false, toggle() {}, remove() {} }, style: { setProperty() {}, removeProperty() {} } } };
Module._load = function (r, ...a) {
  if (r === "obsidian") return { Plugin: class {}, ItemView: class {}, Setting: class {}, MarkdownView: class {}, Notice: class {}, debounce: (f) => f };
  if (r === "@codemirror/view") return { ViewPlugin: { fromClass() {} }, Decoration: {} };
  if (r === "@codemirror/state") return { StateEffect: { define() {} } };
  return orig.call(this, r, ...a);
};
const src = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8") + "\n;module.exports._nlp = nlpMod.exports.default || nlpMod.exports;";
const m = { exports: {} };
new Function("require", "module", "exports", src)(require, m, m.exports);
const { _analyzeDoc, _classify, _describeAt, _fitColor, _contrastOf, _lumpiness, _dfaExponent, _nlp } = m.exports;

const an = (t) => _analyzeDoc(_nlp, t);
const hits = (t, cls) => an(t).hits.filter((h) => h.cls === cls).map((h) => t.slice(h.from, h.to));
let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; } catch (e) { failed++; console.log("FAIL", name, "\n   ", e.message.split("\n")[0]); } };
const has = (t, cls, s) => assert(hits(t, cls).some((x) => x.toLowerCase().includes(s.toLowerCase())), `${cls} should mark "${s}" in: ${t}`);
const hasNot = (t, cls) => assert.strictEqual(hits(t, cls).length, 0, `${cls} should not fire in: ${t} (got ${JSON.stringify(hits(t, cls))})`);

test("passive voice", () => has("The ball was thrown by the boy.", "sl-passive", "was thrown"));
test("filler word", () => has("It was very cold.", "sl-filler", "very"));
test("doubled word, not 'had had'", () => { has("This is the the end.", "sl-repeat", "the the"); hasNot("She had had enough.", "sl-repeat"); });
test("negative parallelism", () => { has("It isn't a bug, it's a feature.", "sl-negpar", "isn't"); has("This is not just a tool.", "sl-negpar", "not just"); });
test("uncontracted forms, capitalised too", () => { has("It is raining.", "sl-uncontr", "It is"); has("We do not know.", "sl-uncontr", "do not"); });
test("simile, without common false positives", () => { has("He moved like a ghost.", "sl-simile", "like a"); hasNot("I like it here.", "sl-simile"); hasNot("Call me as soon as you can.", "sl-simile"); hasNot("I'd like the soup.", "sl-simile"); });
test("commonly misused", () => { has("I could of gone.", "sl-misused", "could of"); has("Its a good day.", "sl-misused", "Its a"); });
test("stock body language", () => { has("Her heart raced.", "sl-stock", "heart raced"); has("Time stopped.", "sl-stock", "Time stopped"); });
test("dialogue tint, and a question inside it is not rhetorical", () => {
  has('She said, "Come here now."', "sl-dialogue", "Come here");
  hasNot('She looked at him and said, "Are you coming?"', "sl-rhetq");
  has("Why does it matter? Because it does.", "sl-rhetq", "Why does it matter?");
});
test("fancy tags and adverbs in tags", () => { has('"Stop," he exclaimed.', "sl-tagfancy", "exclaimed"); has('"Fine," she said sadly.', "sl-tagadv", "sadly"); });
test("semicolon inside speech", () => has('"Go home; it is late," she said.', "sl-dlgsemi", ";"));
test("wordy phrase, throat-clearing, roadmap, concession", () => {
  has("We did it in order to win.", "sl-wordy", "in order to");
  has("It's worth noting that this works.", "sl-throat", "worth noting");
  has("In this post we'll cover the basics.", "sl-road", "In this post");
  has("That said, it could fail.", "sl-concede", "That said");
});
test("wrap-up tail, but not 'something' or 'morning'", () => {
  has("He closed the door, reminding himself that nothing would change.", "sl-tail", "reminding");
  hasNot("We walked to the market, something I never expected to enjoy at all.", "sl-tail");
});
test("crutch words and the mind-caught-up frame", () => { has("Suddenly the door opened.", "sl-crutch", "Suddenly"); has("She ducked before her mind caught up.", "sl-crutch", "before her mind caught up"); hasNot("The door opened slowly.", "sl-crutch"); });
test("vague attribution", () => { has("Experts say this works.", "sl-attrib", "Experts say"); has("Studies show it helps.", "sl-attrib", "Studies show"); hasNot("My mother says hello.", "sl-attrib"); });
test("copula dodge", () => { has("They act as a team.", "sl-copdodge", "act as"); has("The hotel boasts a pool.", "sl-copdodge", "boasts"); });
test("triplet", () => has("The room was cold, quiet, and empty.", "sl-triplet", "cold, quiet, and empty"));
test("staccato run", () => assert(hits("He ran. He fell. He cried. Then he got up and walked home slowly.", "sl-stacc").length >= 3));
test("same-word openers", () => assert(hits("He ran. He fell. He cried. He rose.", "sl-opener").length >= 3));
test("long sentence", () => assert(hits(("word ".repeat(30)).trim() + ".", "sl-long").length === 1));
test("closed frontmatter is ignored, unclosed is text", () => {
  assert.strictEqual(an("---\ntitle: x\ntags: [a]\n---\nThe cat sat down.").stats.words, 4);
  assert(an("---\nThis is a note. It has words in it.").stats.words > 5);
});
test("a paragraph with no sentences does not steal the next one", () => {
  const a = an("Then we left early.\n\n§\n\nThen we came back.\n\nAnd so it went.");
  assert.strictEqual(a.paras.length, 3);
});
test("CRLF gives the same numbers as LF", () => {
  const lf = "She walked home. It was late.\n\nHe waited by the door.";
  assert.deepStrictEqual(an(lf).stats.words, an(lf.replace(/\n/g, "\r\n")).stats.words);
});
test("empty, whitespace and odd input do not throw", () => { for (const t of ["", "   \n\n\t", "# Heading only", "```\ncode only", "🎉🎉", "这是一个测试。"]) an(t); });
test("hit offsets stay inside the text", () => {
  const t = 'The old farmer, who was tired, said, "It is not just cold; it is brutal." He walked home. He slept. He woke.\n\nShe thought about it — then left.';
  for (const h of an(t).hits) assert(h.from >= 0 && h.to <= t.length && h.from < h.to, `bad range ${h.from}-${h.to}`);
});
test("describeAt: a selection that only touches a mark does not count it", () => {
  const t = "Perhaps it is fine and right.", a = an(t);
  assert(_describeAt(a, 3, 3).flags.includes("sl-hedge"));
  assert(!_describeAt(a, 7, 14).flags.includes("sl-hedge"));
});
test("colors fit to 4.5:1 on both neutral backgrounds", () => {
  for (const bg of ["#25272b", "#f6f5f2"]) for (const c of ["#4f9dde", "#4caf7d", "#d98cc4", "#e0913a", "#9aa0a6", "#8a7fd1", "#c2544d", "#d4a017"])
    assert(_contrastOf(_fitColor(c, bg), bg) >= 4.5, `${c} on ${bg}`);
});
test("story vs essay detection, with hand-made profiles", () => {
  const mk = (o) => ({ metrics: Object.fromEntries(Object.entries(o).map(([k, [mean, sd]]) => [k, { mean, sd }])) });
  const profiles = {
    story: mk({ pastPct: [10, 3], thirdPct: [4, 2], secondPct: [0.7, 0.8], dialogueParaPct: [30, 20], grade: [3.8, 1.2], "rate:sl-filter": [5, 3] }),
    essay: mk({ pastPct: [3, 2], thirdPct: [0.3, 0.4], secondPct: [2.2, 1.5], dialogueParaPct: [1, 3], grade: [6, 1.2], "rate:sl-filter": [1, 1.5] }),
  };
  const story = 'He walked to the door and stopped. She had left the light on. "Who is there?" she asked. He did not answer. He knew she saw him. She felt the cold and watched his hands.\n\n"Come in," she said. He stepped inside and shut the door behind him. He noticed the smell of smoke. She turned away and wondered what he wanted. They sat down and he told her the whole story, slowly and quietly, until the fire burned low and the room grew dark and cold around them both.';
  const essay = "You should treat your inbox as a tool, not a obligation. Most people never decide what goes where, and the result is predictable. The fix is a small set of rules that sort mail by who sent it. Start with the sender types you already recognize, then add one rule at a time. You will find the system gets simpler as you use it, and your attention goes where it matters. That is the whole point of the exercise, and it works for most teams I know.";
  const twice = (t) => t + "\n\n" + t; // detection wants 150+ words
  assert.strictEqual(_classify(an(twice(story)), profiles).label, "story");
  assert.strictEqual(_classify(an(twice(essay)), profiles).label, "essay");
});

test("pacing: lumpiness is low for evenly paced series and high for bursty ones", () => {
  const even = Array.from({ length: 60 }, (_, i) => 8 + (i % 3));
  const bursty = [...Array(10).fill(10), ...[2, 30, 5, 28, 3, 25, 6, 31, 4, 27], ...Array(10).fill(9), ...[1, 40, 2, 35, 3, 38, 2, 33, 4, 36], ...Array(10).fill(11), ...[3, 29, 5, 26, 2, 34, 6, 30, 3, 28]];
  assert(_lumpiness(even) < 0.2, "even series: " + _lumpiness(even));
  assert(_lumpiness(bursty) > 0.5, "bursty series: " + _lumpiness(bursty));
  assert.strictEqual(_lumpiness([5, 6, 7]), null);
});
test("pacing: DFA exponent separates alternating, random and clustered series", () => {
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const alt = Array.from({ length: 120 }, (_, i) => (i % 2 ? 24 : 6));
  const random = Array.from({ length: 400 }, () => 4 + Math.floor(rnd() * 20));
  const clustered = []; for (let b = 0; b < 12; b++) { const long = b % 2 === 0; for (let i = 0; i < 25; i++) clustered.push(long ? 18 + Math.floor(rnd() * 6) : 4 + Math.floor(rnd() * 4)); }
  const a = _dfaExponent(alt), r = _dfaExponent(random), c = _dfaExponent(clustered);
  assert(a < 0.35, "alternating should be anti-persistent, got " + a);
  assert(r > 0.35 && r < 0.65, "random should sit near 0.5, got " + r);
  assert(c > 0.7, "clustered should be persistent, got " + c);
  assert.strictEqual(_dfaExponent([1, 2, 3]), null);
});

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
