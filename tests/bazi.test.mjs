import assert from "node:assert/strict";
import test from "node:test";
import { calculateBazi, formatBaziText, getAnnualPillar, parseSolarInput, reverseSearchBazi } from "../lib/bazi.mjs";
import { calculateFourPillars } from "../lib/four-pillars.mjs";
import { buildBaziChart, getBaziNodeRelations, getBaziNodeStates } from "../lib/chart-presentation.mjs";
import { calculateLiuRen, formatLiuRenText } from "../lib/liu-ren.mjs";
import { calculateQiMen, formatQiMenText } from "../lib/qi-men.mjs";
import { buildReadingSession } from "../lib/reading-session.mjs";
import { buildMetaphysicsCore, getTwelveGrowthStage } from "../lib/metaphysics-core.mjs";
import { buildSimpleChart, formatSimpleChartText } from "../lib/simple-chart.mjs";

test("keeps calculation and presentation as independently reusable modules", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  assert.equal(calculation.module.name, "four-pillars");
  assert.equal(calculation.fourPillars.text, "壬申 癸卯 庚寅 癸未");
  assert.match(calculation.luckStart.startTime, /^1998-/);
  assert.equal(calculation.profile, undefined);
  assert.equal(calculation.luck, undefined);
  assert.equal(calculation.fourPillars.year.branch.hiddenStems, undefined);

  const chart = buildBaziChart(calculation);
  assert.equal(chart.module.name, "chart-presentation");
  assert.equal(chart.calculation.module.name, "four-pillars");
  assert.ok(chart.fourPillars.year.branch.hiddenStems.length > 0);
  assert.ok(chart.luck.cycles.length === 8);
});

test("parses ISO and Chinese solar date strings", () => {
  assert.deepEqual(parseSolarInput("1992-03-15 14:30"), { year: 1992, month: 3, day: 15, hour: 14, minute: 30, second: 0 });
  assert.deepEqual(parseSolarInput("1992年3月15日 14:30"), { year: 1992, month: 3, day: 15, hour: 14, minute: 30, second: 0 });
});

test("uses a known Jia-Zi day anchor", () => {
  const result = calculateBazi({ solarTime: "2000-01-07 12:00", longitude: 120 }, { solarTimeMode: "none" });
  assert.equal(result.fourPillars.day.value, "甲子");
});

test("honors 23-hour and midnight day-boundary modes", () => {
  const input = { solarTime: "2000-01-07 23:30", longitude: 120 };
  const ziStart = calculateBazi(input, { solarTimeMode: "none", dayBoundary: 23 });
  const midnight = calculateBazi(input, { solarTimeMode: "none", dayBoundary: 24 });
  assert.equal(ziStart.fourPillars.day.value, "乙丑");
  assert.equal(midnight.fourPillars.day.value, "甲子");
  assert.notEqual(ziStart.fourPillars.hour.value, midnight.fourPillars.hour.value);
});

test("reverse lookup round-trips a generated chart", () => {
  const result = calculateBazi({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const reverse = reverseSearchBazi(result.fourPillars.compact, { startYear: 1992, endYear: 1992, longitude: 113.27 });
  assert.equal(reverse.total, 1);
  assert.equal(reverse.matches[0].solarTime, "1992-03-15 14:00");
  assert.equal(reverse.matches[0].timeRange, "1992-03-15 13:00—1992-03-15 14:59");
  assert.equal(reverse.matches[0].fourPillars, result.fourPillars.text);
  assert.deepEqual(reverse.basis.administrativeDivisions, { province: "反排", prefecture: "反排", county: "反排" });
  assert.equal(reverse.basis.longitude, 120);
  assert.equal(reverse.basis.solarTimeMode, "none");
});

test("reverse lookup ignores birthplace and true-solar settings and finds the Xining chart", () => {
  const reverse = reverseSearchBazi("丁卯 壬寅 癸丑 乙卯", {
    startYear: 1987,
    endYear: 1987,
    longitude: 101.705357,
    timezoneOffset: 7,
    solarTimeMode: "apparent",
  });
  assert.equal(reverse.total, 1);
  assert.equal(reverse.matches[0].solarTime, "1987-03-05 06:00");
  assert.equal(reverse.matches[0].timeRange, "1987-03-05 05:00—1987-03-05 06:59");
  assert.equal(reverse.matches[0].location, "反排");
  assert.equal(reverse.matches[0].longitude, 120);
  assert.equal(reverse.matches[0].solarTimeMode, "none");
});

test("produces a human-readable text report", () => {
  const result = calculateBazi({ solarTime: "1992年3月15日 14:30", longitude: 113.27, location: "广州" });
  const report = formatBaziText(result);
  assert.match(report, /四柱：壬申 癸卯 庚寅 癸未/);
  assert.match(report, /真太阳时/);
  assert.match(report, /大运：/);
});

test("adds twelve-growth and Shen-Sha data to every pillar", () => {
  const result = calculateBazi({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  for (const pillar of [result.fourPillars.year, result.fourPillars.month, result.fourPillars.day, result.fourPillars.hour]) {
    assert.equal(typeof pillar.growthStage, "string");
    assert.ok(Array.isArray(pillar.shenSha));
  }
  assert.ok(result.profile.shenSha.all.length > 0);
  assert.equal(getAnnualPillar(2024).value, "甲辰");
});

test("builds reusable month-state nodes and an eight-cell comparison matrix", () => {
  const chart = buildBaziChart(calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 }));
  const nodes = getBaziNodeStates(chart);
  assert.deepEqual(nodes.map((node) => node.meta), ["年干", "月干", "日干", "时干", "年支", "月支", "日支", "时支"]);
  assert.equal(nodes.length, 8);
  for (const node of nodes) {
    assert.match(node.monthStatus, /^(旺|相|休|囚|死)$/);
    assert.ok(node.monthGrowth);
  }

  const stemRelations = getBaziNodeRelations(chart, 0);
  assert.equal(stemRelations.relations.length, 8);
  assert.deepEqual(stemRelations.relations.map((relation) => relation.meta), ["年干", "月干", "日干", "时干", "年支", "月支", "日支", "时支"]);
  assert.equal(stemRelations.relations[0].isSelf, true);
  assert.equal(stemRelations.relations[0].sixKin, "自身");
  assert.ok(stemRelations.relations.find((relation) => relation.meta === "月干").tenGod);
  const branchRelation = stemRelations.relations.find((relation) => relation.meta === "月支");
  assert.ok(branchRelation.mainQiTenGod);
  assert.ok(branchRelation.hiddenTenGods.length > 0);

  const branchRelations = getBaziNodeRelations(chart, 5);
  assert.match(branchRelations.reference.source, /本气/);
  assert.ok(chart.fourPillars.year.stem.sixKin);
  assert.ok(stemRelations.relations.every((relation) => relation.kind === "stem" ? relation.sixKin : relation.mainQiSixKin));
});

test("builds Liu Ren from the exact shared four-pillar result", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const liuRen = calculateLiuRen(calculation);
  assert.equal(liuRen.module.name, "liu-ren");
  assert.equal(liuRen.source.standardTime, calculation.time.standard);
  assert.equal(liuRen.source.trueSolarTime, calculation.time.trueSolar);
  assert.equal(liuRen.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(liuRen.monthGeneral.currentMiddleQi.name, "雨水");
  assert.equal(liuRen.monthGeneral.branch, "亥");
  assert.equal(liuRen.monthGeneral.name, "登明");
  assert.equal(liuRen.divinationTime.branch.name, calculation.fourPillars.hour.branch.name);
  assert.equal(liuRen.earthPlate.length, 12);
  assert.equal(liuRen.fourLessons.length, 4);
  assert.equal(liuRen.threeTransmissions.items.length, 3);
  assert.ok(liuRen.earthPlate.some((palace) => palace.shenSha.length > 0));
  assert.deepEqual(new Set(liuRen.earthPlate.flatMap((palace) => palace.shenShaGroups.map((group) => group.category))), new Set(["年煞", "月煞", "季煞", "旬煞", "支煞", "干煞"]));
  assert.ok(liuRen.fourLessons.every((lesson) => lesson.earthHeavenlyGeneral && lesson.earthHeavenlyGeneralDetail.element));
  assert.ok(liuRen.earthPlate.every((palace) => palace.heavenlyGeneralDetail.element));
  assert.match(formatLiuRenText(liuRen), /月将：亥登明/);
});

test("allows a manual month-general override without changing shared time", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const liuRen = calculateLiuRen(calculation, { monthGeneral: "子" });
  assert.equal(liuRen.monthGeneral.branch, "子");
  assert.equal(liuRen.monthGeneral.name, "神后");
  assert.equal(liuRen.monthGeneral.mode, "手动指定");
  assert.equal(liuRen.source.standardTime, calculation.time.standard);
});

test("separates the upper and earth-palace generals in the 2026-08-24 noon lessons", () => {
  const calculation = calculateFourPillars({ solarTime: "2026-08-24 12:00", longitude: 120 }, { solarTimeMode: "none" });
  const liuRen = calculateLiuRen(calculation);
  const first = liuRen.fourLessons[0];
  assert.equal(calculation.fourPillars.text, "丙午 丙申 庚午 壬午");
  assert.equal(first.upper.name, "未");
  assert.equal(first.heavenlyGeneral, "天空");
  assert.equal(first.lower.name, "庚");
  assert.equal(first.earthPalace, "申");
  assert.equal(first.earthHeavenlyGeneral, "白虎");

  const starsByPalace = Object.fromEntries(liuRen.earthPlate.map((palace) => [palace.earth.name, palace.shenSha]));
  assert.ok(starsByPalace.未.includes("血支"));
  assert.ok(starsByPalace.寅.includes("血忌"));
  assert.ok(starsByPalace.辰.includes("天医"));
  assert.ok(starsByPalace.戌.includes("地医"));
  assert.ok(starsByPalace.巳.includes("飞魂"));
  assert.ok(starsByPalace.辰.includes("月厌"));
  assert.ok(starsByPalace.子.includes("游都"));
  assert.ok(starsByPalace.午.includes("鲁都"));
});

test("rejects Liu Ren input that did not come from the four-pillar module", () => {
  assert.throws(() => calculateLiuRen({}), /calculateFourPillars/);
});

test("builds Chai-Bu rotating Qi Men from the shared four-pillar result", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const qiMen = calculateQiMen(calculation);
  assert.equal(qiMen.module.name, "qi-men");
  assert.equal(qiMen.source.standardTime, calculation.time.standard);
  assert.equal(qiMen.source.trueSolarTime, calculation.time.trueSolar);
  assert.equal(qiMen.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(qiMen.config.method, "chai-bu");
  assert.equal(qiMen.solarTerm.current.name, "惊蛰");
  assert.equal(qiMen.yuan.fuTou.value, "己丑");
  assert.equal(qiMen.yuan.name, "下元");
  assert.equal(qiMen.ju.label, "阳遁4局");
  assert.equal(qiMen.xun.start, "甲戌");
  assert.equal(qiMen.palaces.length, 9);
  assert.deepEqual(new Set(qiMen.palaces.map((palace) => palace.earthInstrument)), new Set(["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"]));
  assert.ok(qiMen.palaces.filter((palace) => palace.number !== 5).every((palace) => palace.heavenGrowth.length >= palace.branches.length));
  assert.ok(qiMen.palaces.filter((palace) => palace.number !== 5).every((palace) => palace.earthGrowth.length === palace.branches.length));
  assert.ok(qiMen.palaces.filter((palace) => palace.number !== 5).every((palace) => palace.stemResponses.length === palace.heavenInstruments.length));
  assert.ok(qiMen.palaces.filter((palace) => palace.number !== 5).every((palace) => palace.stemResponses.every((response) => response.combination && response.relation && response.interpretation)));
  assert.equal(getTwelveGrowthStage("甲", "辰"), "衰");
  assert.equal(getTwelveGrowthStage("甲", "巳"), "病");
  assert.equal(getTwelveGrowthStage("庚", "酉"), "帝旺");
  assert.match(formatQiMenText(qiMen), /拆补定局：己丑符头 · 下元 · 阳遁4局/);
  assert.match(formatQiMenText(qiMen), /天盘长生/);
  assert.match(formatQiMenText(qiMen), /地盘长生/);
});

test("builds one public core for scripts and a serializable simple chart for Web", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const core = buildMetaphysicsCore(calculation);
  assert.equal(core.module.name, "metaphysics-core");
  assert.equal(core.monthGeneral.name, "登明");
  assert.equal(core.qiMen.ju.label, "阳遁4局");
  assert.equal(core.qiMen.yuan.hou, "下候");
  assert.equal(core.qiMen.chiefs.star.name, "天禽");
  assert.equal(core.qiMen.chiefs.door.name, "死门");

  const simple = buildSimpleChart(calculation, { core });
  assert.equal(simple.module.name, "simple-chart");
  assert.equal(simple.core, core);
  assert.equal(simple.liuRen.core.module.name, "metaphysics-core");
  assert.equal(simple.qiMen.core.module.name, "metaphysics-core");
  assert.doesNotThrow(() => JSON.stringify(simple));
  assert.match(formatSimpleChartText(simple), /大六壬简盘/);
  assert.match(formatSimpleChartText(simple), /时家奇门/);
});

test("rejects Qi Men input that did not come from the four-pillar module", () => {
  assert.throws(() => calculateQiMen({}), /calculateFourPillars/);
});

test("application session distributes one calculation to all domain modules", () => {
  const calculation = calculateFourPillars({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
  const session = buildReadingSession(calculation);
  assert.equal(session.module.name, "reading-session");
  assert.equal(session.calculation, calculation);
  assert.equal(session.core.module.name, "metaphysics-core");
  assert.equal(session.simple.module.name, "simple-chart");
  assert.equal(session.bazi.calculation.module.name, "four-pillars");
  assert.equal(session.liuRen.source.standardTime, calculation.time.standard);
  assert.equal(session.qiMen.source.standardTime, calculation.time.standard);
  assert.equal(session.bazi.fourPillars.text, session.liuRen.source.fourPillars);
  assert.equal(session.liuRen.source.fourPillars, session.qiMen.source.fourPillars);
});
