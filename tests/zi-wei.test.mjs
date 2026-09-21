import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { calculateFourPillars } from "../lib/four-pillars.mjs";
import { textDisplayWidth } from "../lib/text-layout.mjs";
import { calculateZiWei, formatZiWeiText, getZiWeiSelection } from "../lib/zi-wei.mjs";

const calculation = calculateFourPillars({
  solarTime: "1992-03-15 14:30",
  longitude: 113.27,
  sex: "male",
});

test("Zi Wei consumes the shared corrected time and returns twelve serializable palaces", () => {
  const result = calculateZiWei(calculation, { referenceYear: 2026 });
  assert.equal(result.module.name, "zi-wei");
  assert.equal(result.rules.school, "三合派");
  assert.equal(result.rules.starAlgorithm, "中州派");
  assert.equal(result.source.standardTime, calculation.time.standard);
  assert.equal(result.source.trueSolarTime, calculation.time.trueSolar);
  assert.equal(result.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(result.palaces.length, 12);
  assert.equal(result.palaces.reduce((sum, palace) => sum + palace.majorStars.length, 0), 14);
  assert.equal(result.decades.length, 12);
  assert.ok(result.decades.every((decade) => decade.years.length === 10));
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("Zi Wei defaults to the requested year and keeps decade/year overlays aligned", () => {
  const result = calculateZiWei(calculation, { referenceYear: 2026 });
  const selection = getZiWeiSelection(result);
  assert.deepEqual(selection.decade.yearRange, [2026, 2035]);
  assert.equal(selection.year.year, 2026);
  assert.equal(selection.decade.palaceNames.length, 12);
  assert.equal(selection.year.palaceNames.length, 12);
  assert.equal(selection.decade.stars.length, 12);
  assert.equal(selection.year.stars.length, 12);
});

test("Zi Wei keeps the shared 23-hour and midnight day-boundary pillars", () => {
  for (const dayBoundary of [23, 24]) {
    const boundaryCalculation = calculateFourPillars({ solarTime: "2026-08-24 23:30", longitude: 120, sex: "male" }, { dayBoundary, solarTimeMode: "none" });
    const result = calculateZiWei(boundaryCalculation, { referenceYear: 2026 });
    assert.equal(result.calendar.chineseDate, boundaryCalculation.fourPillars.text);
    assert.equal(result.rules.dayDivide, dayBoundary === 23 ? "子初换日" : "午夜换日");
  }
});
test("Zi Wei text mode is a fixed-width twelve-palace ring with the four pillars in the center", () => {
  const result = calculateZiWei(calculation, { referenceYear: 2026 });
  const text = formatZiWeiText(result);
  const ring = text.slice(text.indexOf("┌")).split("\n");
  assert.equal(new Set(ring.map(textDisplayWidth)).size, 1);
  assert.match(text, /紫微斗数 · 三合派（中州派安星）/);
  assert.match(text, /八字/);
  for (const pillar of calculation.fourPillars.text.split(" ")) assert.match(text, new RegExp(pillar));
  assert.match(text, /大限 35–44岁 2026–2035/);
  assert.match(text, /流年 2026/);
});

test("CLI exposes Zi Wei JSON and text modes", () => {
  const script = fileURLToPath(new URL("../scripts/bazi.mjs", import.meta.url));
  const args = [script, "--mode", "ziwei", "--datetime", "1992-03-15 14:30", "--longitude", "113.27", "--sex", "male", "--reference-year", "2026"];
  const jsonRun = spawnSync(process.execPath, args, { encoding: "utf8" });
  const textRun = spawnSync(process.execPath, [...args, "--format", "text"], { encoding: "utf8" });
  assert.equal(jsonRun.status, 0, jsonRun.stderr);
  assert.equal(JSON.parse(jsonRun.stdout).module.name, "zi-wei");
  assert.equal(textRun.status, 0, textRun.stderr);
  assert.match(textRun.stdout, /紫微斗数 · 三合派/);
  assert.match(textRun.stdout, /┌/);
});
