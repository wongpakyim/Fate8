import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { calculateFourPillars } from "../lib/four-pillars.mjs";
import { calculateLiuRen, formatLiuRenFourLessonsText, formatLiuRenHeavenPlateText, formatLiuRenText } from "../lib/liu-ren.mjs";
import { calculateQiMen, formatQiMenNineGridText, formatQiMenText } from "../lib/qi-men.mjs";
import { renderTextGrid, textDisplayWidth } from "../lib/text-layout.mjs";

const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });

test("CJK text-grid helper keeps every line at one display width", () => {
  const grid = renderTextGrid([["甲木\n天盘", "乙木\n地盘"], ["丙火", "丁火"]], { cellWidth: 10 });
  const widths = grid.split("\n").map(textDisplayWidth);
  assert.equal(new Set(widths).size, 1);
  assert.match(grid, /^┌/);
  assert.match(grid, /┘$/);
});

test("Liu Ren text contains right-to-left four lessons and a twelve-palace heaven ring", () => {
  const result = calculateLiuRen(calculation);
  const lessons = formatLiuRenFourLessonsText(result);
  const heavenPlate = formatLiuRenHeavenPlateText(result);
  const report = formatLiuRenText(result);
  const lessonHeading = lessons.split("\n").find((line) => ["四课", "三课", "二课", "一课"].every((label) => line.includes(label)));

  assert.ok(lessonHeading.indexOf("四课") < lessonHeading.indexOf("三课"));
  assert.ok(lessonHeading.indexOf("三课") < lessonHeading.indexOf("二课"));
  assert.ok(lessonHeading.indexOf("二课") < lessonHeading.indexOf("一课"));
  assert.equal((heavenPlate.match(/上神 /g) || []).length, 12);
  assert.equal((heavenPlate.match(/天将 /g) || []).length, 12);
  assert.equal((heavenPlate.match(/旬遁 /g) || []).length, 12);
  assert.equal((heavenPlate.match(/天盘神煞 /g) || []).length, 12);
  assert.equal((heavenPlate.match(/地盘神煞 /g) || []).length, 12);
  assert.match(heavenPlate, /上巳午未申／左辰卯／右酉戌／下寅丑子亥/);
  const ringWidths = heavenPlate.slice(heavenPlate.indexOf("┌")).split("\n").map(textDisplayWidth);
  assert.equal(new Set(ringWidths).size, 1);
  assert.match(report, /四课（第一课在最右/);
  assert.match(lessons, /上神贵神/);
  assert.match(lessons, /地盘贵神/);
  assert.doesNotMatch(lessons, /关系 (生泄|上克下|下贼上|比和)/);
  assert.match(report, /天盘十二宫/);
  assert.match(report, /旬遁 {6}甲申旬/);
});

test("Qi Men text is a visual 3-by-3 palace grid with full palace data", () => {
  const result = calculateQiMen(calculation);
  const grid = formatQiMenNineGridText(result);
  const report = formatQiMenText(result);
  const firstRow = grid.split("\n").find((line) => line.includes("巽四宫"));
  const middleRow = grid.split("\n").find((line) => line.includes("震三宫"));
  const bottomRow = grid.split("\n").find((line) => line.includes("艮八宫"));

  assert.match(firstRow, /巽四宫.*离九宫.*坤二宫/);
  assert.match(middleRow, /震三宫.*中五宫.*兑七宫/);
  assert.match(bottomRow, /艮八宫.*坎一宫.*乾六宫/);
  assert.equal((grid.match(/天盘长生 /g) || []).length, 8);
  assert.equal((grid.match(/地盘长生 /g) || []).length, 8);
  assert.equal((grid.match(/十干克应 /g) || []).length, 8);
  assert.match(report, /奇门九宫/);
});

test("CLI text modes expose the same Liu Ren and Qi Men grids", () => {
  const script = fileURLToPath(new URL("../scripts/bazi.mjs", import.meta.url));
  const baseArgs = [script, "--datetime", "1992-03-15 14:30", "--longitude", "113.27", "--format", "text"];
  const liuRen = spawnSync(process.execPath, [...baseArgs, "--mode", "liuren"], { encoding: "utf8" });
  const qiMen = spawnSync(process.execPath, [...baseArgs, "--mode", "qimen"], { encoding: "utf8" });

  assert.equal(liuRen.status, 0, liuRen.stderr);
  assert.match(liuRen.stdout, /四课（第一课在最右/);
  assert.match(liuRen.stdout, /天盘十二宫/);
  assert.equal(qiMen.status, 0, qiMen.stderr);
  assert.match(qiMen.stdout, /奇门九宫（巽离坤／震中兑／艮坎乾）/);
});
