import assert from "node:assert/strict";
import test from "node:test";
import { analyzeUsefulGodNodes, expandHiddenStemPath, getStrengthUseInfo, materializeHiddenStemPath } from "../lib/bazi-node-rules.mjs";

const exampleNodes = [
  { id: "a", kind: "stem", char: "甲", element: "木", stemIndex: 0, referenceStemIndex: 0 },
  { id: "b", kind: "branch", char: "寅", element: "木", referenceStemIndex: 0, hiddenStems: [
    { name: "甲", element: "木", index: 0, weight: .6 },
    { name: "丙", element: "火", index: 2, weight: .3 },
    { name: "戊", element: "土", index: 4, weight: .1 },
  ] },
  { id: "c", kind: "branch", char: "亥", element: "水", referenceStemIndex: 8, hiddenStems: [
    { name: "壬", element: "水", index: 8, weight: .7 },
    { name: "甲", element: "木", index: 0, weight: .3 },
  ] },
];

test("classifies strong and weak day-master useful relations", () => {
  assert.equal(getStrengthUseInfo("木", "水", "weak").label, "生-强弱用神");
  assert.equal(getStrengthUseInfo("木", "木", "weak").label, "扶-强弱用神");
  assert.equal(getStrengthUseInfo("木", "金", "strong").label, "克-强弱用神");
  assert.equal(getStrengthUseInfo("木", "火", "strong").label, "泄-强弱用神");
  assert.equal(getStrengthUseInfo("木", "土", "strong").label, "耗-强弱用神");
});

test("expands Jia-Yin-Hai into all six hidden-stem secondary paths", () => {
  const paths = expandHiddenStemPath(exampleNodes, [0, 1, 2]);
  assert.equal(paths.length, 6);
  assert.deepEqual(paths.map((path) => path.display), [
    "甲-甲(寅)-壬(亥)", "甲-甲(寅)-甲(亥)", "甲-丙(寅)-壬(亥)",
    "甲-丙(寅)-甲(亥)", "甲-戊(寅)-壬(亥)", "甲-戊(寅)-甲(亥)",
  ]);
  const selected = materializeHiddenStemPath(exampleNodes, paths[2]);
  assert.equal(selected[1].char, "丙");
  assert.equal(selected[1].originalBranch, "寅");
  assert.equal(selected[2].char, "壬");
  assert.equal(selected[2].originalBranch, "亥");
});

test("derives taboo and controlling useful gods from a selected useful anchor", () => {
  const nodes = [
    { char: "壬", element: "水" },
    { char: "甲", element: "木" },
    { char: "丙", element: "火" },
  ];
  const analysis = analyzeUsefulGodNodes(nodes, "木", "weak", 0);
  assert.equal(analysis[0].role, "强弱用神");
  assert.equal(analysis[1].role, "忌神");
  assert.equal(analysis[1].basis, "泄壬用神");
  assert.equal(analysis[2].role, "制忌用神");
  assert.equal(analysis[2].basis, "泄甲忌神");
});
