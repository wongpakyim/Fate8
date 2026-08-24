/**
 * 术数公共核心层。
 *
 * 统一承接公历转四柱后的公共事实：节气、中气月将、奇门阴阳遁九局、
 * 上中下元（候）、符头、旬首、值符、值使，以及干支五行和十二长生。
 * 六壬、奇门、简化脚本和 Web 只能消费这里的结构化结果，不重复起算。
 */

import {
  BRANCHES,
  GROWTH_STAGES,
  GROWTH_START,
  STEMS,
  calculateFourPillars,
  getMiddleQiContext,
  getSolarTermContext,
  mod,
} from "./four-pillars.mjs";

export const MONTH_GENERALS = [
  { branch: "子", name: "神后", term: "大寒" }, { branch: "丑", name: "大吉", term: "冬至" },
  { branch: "寅", name: "功曹", term: "小雪" }, { branch: "卯", name: "太冲", term: "霜降" },
  { branch: "辰", name: "天罡", term: "秋分" }, { branch: "巳", name: "太乙", term: "处暑" },
  { branch: "午", name: "胜光", term: "大暑" }, { branch: "未", name: "小吉", term: "夏至" },
  { branch: "申", name: "传送", term: "小满" }, { branch: "酉", name: "从魁", term: "谷雨" },
  { branch: "戌", name: "河魁", term: "春分" }, { branch: "亥", name: "登明", term: "雨水" },
];

export const QIMEN_PALACES = {
  1: { number: 1, name: "坎一宫", trigram: "坎", direction: "北", element: "水", branches: ["子"], originalStar: "天蓬", originalDoor: "休门" },
  2: { number: 2, name: "坤二宫", trigram: "坤", direction: "西南", element: "土", branches: ["未", "申"], originalStar: "天芮", originalDoor: "死门" },
  3: { number: 3, name: "震三宫", trigram: "震", direction: "东", element: "木", branches: ["卯"], originalStar: "天冲", originalDoor: "伤门" },
  4: { number: 4, name: "巽四宫", trigram: "巽", direction: "东南", element: "木", branches: ["辰", "巳"], originalStar: "天辅", originalDoor: "杜门" },
  5: { number: 5, name: "中五宫", trigram: "中", direction: "中央", element: "土", branches: [], originalStar: "天禽", originalDoor: null },
  6: { number: 6, name: "乾六宫", trigram: "乾", direction: "西北", element: "金", branches: ["戌", "亥"], originalStar: "天心", originalDoor: "开门" },
  7: { number: 7, name: "兑七宫", trigram: "兑", direction: "西", element: "金", branches: ["酉"], originalStar: "天柱", originalDoor: "惊门" },
  8: { number: 8, name: "艮八宫", trigram: "艮", direction: "东北", element: "土", branches: ["丑", "寅"], originalStar: "天任", originalDoor: "生门" },
  9: { number: 9, name: "离九宫", trigram: "离", direction: "南", element: "火", branches: ["午"], originalStar: "天英", originalDoor: "景门" },
};

export const CHAI_BU_JU_TABLE = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

const TERM_TO_GENERAL = Object.fromEntries(MONTH_GENERALS.map((item, index) => [item.term, index]));
const INSTRUMENT_SEQUENCE = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const HIDDEN_JIA = ["戊", "己", "庚", "辛", "壬", "癸"];
const YUAN_NAMES = ["上元", "中元", "下元"];
const BRANCH_TO_PALACE = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6];
const HORSE_BRANCH = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
const YANG_TERMS = new Set(["冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种"]);

function assertCalculation(calculation) {
  if (!calculation || calculation.module?.name !== "four-pillars" || !calculation.fourPillars?.hour) {
    throw new TypeError("术数公共核心必须接收 calculateFourPillars 的完整结果");
  }
}

function stemIndexOf(value) {
  if (Number.isInteger(value)) return mod(value, 10);
  if (Number.isInteger(value?.index)) return mod(value.index, 10);
  const name = typeof value === "string" ? value : value?.name;
  const index = STEMS.findIndex((item) => item.name === name);
  if (index < 0) throw new RangeError(`无法识别天干：${name ?? value}`);
  return index;
}

function branchIndexOf(value) {
  if (Number.isInteger(value)) return mod(value, 12);
  if (Number.isInteger(value?.index)) return mod(value.index, 12);
  const name = typeof value === "string" ? value : value?.name;
  const index = BRANCHES.findIndex((item) => item.name === name);
  if (index < 0) throw new RangeError(`无法识别地支：${name ?? value}`);
  return index;
}

export function getTwelveGrowthStage(stem, branch) {
  const stemIndex = stemIndexOf(stem);
  const branchIndex = branchIndexOf(branch);
  return GROWTH_STAGES[mod((branchIndex - GROWTH_START[stemIndex]) * (stemIndex % 2 === 0 ? 1 : -1), 12)];
}

function normalizeMonthGeneral(value) {
  if (value == null || value === "" || value === "auto") return null;
  if (Number.isInteger(value) && value >= 0 && value < 12) return value;
  const text = String(value).trim();
  const index = MONTH_GENERALS.findIndex((item) => text === item.branch || text === item.name || text === `${item.branch}${item.name}`);
  if (index < 0) throw new RangeError("monthGeneral 请使用子至亥的地支或神后至登明的月将名");
  return index;
}

export function deriveMonthGeneral(calculation, override) {
  assertCalculation(calculation);
  const middleQi = getMiddleQiContext(calculation.input.solarTime, calculation.input.timezoneOffset);
  const manualIndex = normalizeMonthGeneral(override);
  const index = manualIndex ?? TERM_TO_GENERAL[middleQi.current.name];
  const branch = BRANCHES[index];
  return {
    ...MONTH_GENERALS[index],
    index,
    element: branch.element,
    polarity: index % 2 === 0 ? "阳" : "阴",
    mode: manualIndex == null ? "中气自动" : "手动指定",
    method: "middle-qi",
    currentMiddleQi: middleQi.current,
    nextMiddleQi: middleQi.next,
  };
}

function wrapPalace(value) {
  return mod(value - 1, 9) + 1;
}

function sexagenaryLabel(index) {
  return STEMS[mod(index, 10)].name + BRANCHES[mod(index, 12)].name;
}

function determineYuan(dayIndex) {
  const daysSinceFuTou = mod(dayIndex, 5);
  const fuTouIndex = mod(dayIndex - daysSinceFuTou, 60);
  const branchIndex = mod(fuTouIndex, 12);
  const yuanIndex = [0, 3, 6, 9].includes(branchIndex) ? 0 : [2, 5, 8, 11].includes(branchIndex) ? 1 : 2;
  return {
    yuanIndex,
    name: YUAN_NAMES[yuanIndex],
    hou: ["上候", "中候", "下候"][yuanIndex],
    daysSinceFuTou,
    fuTou: { index: fuTouIndex, value: sexagenaryLabel(fuTouIndex), branch: BRANCHES[branchIndex].name },
  };
}

export function deriveQiMenCore(calculation, options = {}) {
  assertCalculation(calculation);
  const method = String(options.method || "chai-bu");
  if (method !== "chai-bu") throw new RangeError("当前仅支持拆补法 chai-bu");
  const solarTerm = getSolarTermContext(calculation.input.solarTime, calculation.input.timezoneOffset);
  const dayIndex = calculation.fourPillars.day.index;
  const hourIndex = calculation.fourPillars.hour.index;
  const yuan = determineYuan(dayIndex);
  const dunName = YANG_TERMS.has(solarTerm.current.name) ? "阳遁" : "阴遁";
  const directionStep = dunName === "阳遁" ? 1 : -1;
  const juNumber = CHAI_BU_JU_TABLE[solarTerm.current.name][yuan.yuanIndex];
  const earthInstruments = {};
  INSTRUMENT_SEQUENCE.forEach((instrument, offset) => {
    earthInstruments[wrapPalace(juNumber + directionStep * offset)] = instrument;
  });

  const xunGroup = Math.floor(hourIndex / 10);
  const xunStartIndex = xunGroup * 10;
  const hiddenStem = HIDDEN_JIA[xunGroup];
  const hourStem = calculation.fourPillars.hour.stem.name;
  const hourMarkerStem = hourStem === "甲" ? hiddenStem : hourStem;
  const xunBasePalace = Number(Object.keys(earthInstruments).find((palace) => earthInstruments[palace] === hiddenStem));
  const chiefStar = QIMEN_PALACES[xunBasePalace].originalStar;
  const chiefDoorBasePalace = xunBasePalace === 5 ? 2 : xunBasePalace;
  const chiefDoor = QIMEN_PALACES[chiefDoorBasePalace].originalDoor;
  const chiefStarRawPalace = Number(Object.keys(earthInstruments).find((palace) => earthInstruments[palace] === hourMarkerStem));
  const chiefStarPalace = chiefStarRawPalace === 5 ? 2 : chiefStarRawPalace;
  const hourOffset = hourIndex - xunStartIndex;
  const chiefDoorRawPalace = wrapPalace(xunBasePalace + directionStep * hourOffset);
  const chiefDoorPalace = chiefDoorRawPalace === 5 ? 2 : chiefDoorRawPalace;
  const voidBranchIndexes = [mod(xunStartIndex + 10, 12), mod(xunStartIndex + 11, 12)];
  const horseBranchIndex = HORSE_BRANCH[calculation.fourPillars.hour.branch.index];

  return {
    method,
    solarTerm,
    dun: { name: dunName, directionStep, direction: directionStep === 1 ? "顺布六仪、逆布三奇" : "逆布六仪、顺布三奇" },
    yuan,
    ju: { number: juNumber, label: `${dunName}${juNumber}局`, term: solarTerm.current.name, yuan: yuan.name, hou: yuan.hou },
    earthInstruments,
    xun: { startIndex: xunStartIndex, start: sexagenaryLabel(xunStartIndex), hiddenStem, hourOffset, voidBranchIndexes, voidBranches: voidBranchIndexes.map((index) => BRANCHES[index].name), basePalace: xunBasePalace },
    chiefs: {
      star: { name: chiefStar, basePalace: xunBasePalace, palace: chiefStarPalace, rawPalace: chiefStarRawPalace, rule: "值符随时干" },
      door: { name: chiefDoor, basePalace: chiefDoorBasePalace, palace: chiefDoorPalace, rawPalace: chiefDoorRawPalace, rule: "值使随时支" },
    },
    horse: { branch: BRANCHES[horseBranchIndex].name, branchIndex: horseBranchIndex, palace: BRANCH_TO_PALACE[horseBranchIndex] },
    voidPalaces: [...new Set(voidBranchIndexes.map((branchIndex) => BRANCH_TO_PALACE[branchIndex]))],
  };
}

export function buildBranchShenSha(calculation) {
  assertCalculation(calculation);
  const categories = ["年煞", "月煞", "季煞", "旬煞", "支煞", "干煞"];
  const groupedStars = Array.from({ length: 12 }, () => Object.fromEntries(categories.map((category) => [category, new Set()])));
  const add = (category, target, name) => groupedStars[mod(target, 12)][category].add(name);
  const yearBranch = calculation.fourPillars.year.branch.index;
  const monthBranch = calculation.fourPillars.month.branch.index;
  const dayBranch = calculation.fourPillars.day.branch.index;
  const dayStem = calculation.fourPillars.day.stem.index;
  const trineRules = [
    { branches: [8, 0, 4], horse: 2, peach: 9, canopy: 4, general: 0, robbery: 5, disaster: 6, 亡神: 11 },
    { branches: [2, 6, 10], horse: 8, peach: 3, canopy: 10, general: 6, robbery: 11, disaster: 0, 亡神: 5 },
    { branches: [5, 9, 1], horse: 11, peach: 6, canopy: 1, general: 9, robbery: 2, disaster: 3, 亡神: 8 },
    { branches: [11, 3, 7], horse: 5, peach: 0, canopy: 7, general: 3, robbery: 8, disaster: 9, 亡神: 2 },
  ];
  const trineFor = (reference) => trineRules.find((rule) => rule.branches.includes(reference));
  const addTrineStars = (category, reference, prefix = "", extended = false) => {
    const rule = trineFor(reference);
    add(category, rule.horse, `${prefix}驿马`);
    add(category, rule.peach, `${prefix}桃花`);
    add(category, rule.canopy, `${prefix}华盖`);
    add(category, rule.general, `${prefix}将星`);
    if (extended) {
      add(category, rule.robbery, "劫煞");
      add(category, rule.disaster, "灾煞");
      add(category, rule.亡神, "亡神");
    }
  };

  add("年煞", yearBranch, "太岁");
  add("年煞", yearBranch + 6, "岁破");
  addTrineStars("年煞", yearBranch, "年");

  add("月煞", monthBranch, "月建");
  add("月煞", monthBranch + 6, "月破");
  addTrineStars("月煞", monthBranch, "月");

  const season = [
    { name: "春", branches: [2, 3, 4], peak: 3, grave: 7 },
    { name: "夏", branches: [5, 6, 7], peak: 6, grave: 10 },
    { name: "秋", branches: [8, 9, 10], peak: 9, grave: 1 },
    { name: "冬", branches: [11, 0, 1], peak: 0, grave: 4 },
  ].find((item) => item.branches.includes(monthBranch));
  add("季煞", season.peak, `${season.name}旺`);
  add("季煞", season.grave, `${season.name}墓`);

  const xunStartIndex = Math.floor(calculation.fourPillars.day.index / 10) * 10;
  add("旬煞", xunStartIndex, "旬首");
  add("旬煞", xunStartIndex + 10, "旬空");
  add("旬煞", xunStartIndex + 11, "旬空");

  addTrineStars("支煞", dayBranch, "", true);

  const stemRules = [
    { name: "天乙贵人", targets: [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [3, 5], [3, 5]][dayStem] },
    { name: "文昌贵人", targets: [[5], [6], [8], [9], [8], [9], [11], [0], [2], [3]][dayStem] },
    { name: "禄神", targets: [[2], [3], [5], [6], [5], [6], [8], [9], [11], [0]][dayStem] },
    { name: "羊刃", targets: [[3], [2], [6], [5], [6], [5], [9], [8], [0], [11]][dayStem] },
  ];
  for (const rule of stemRules) for (const target of rule.targets) add("干煞", target, rule.name);

  return groupedStars.map((categoryMap, index) => {
    const groups = categories.map((category) => ({ category, items: [...categoryMap[category]] })).filter((group) => group.items.length);
    return {
      branch: { ...BRANCHES[index], index },
      groups,
      stars: [...new Set(groups.flatMap((group) => group.items))],
    };
  });
}

export function buildMetaphysicsCore(calculation, options = {}) {
  assertCalculation(calculation);
  const monthGeneral = deriveMonthGeneral(calculation, options.monthGeneral ?? options.liuRen?.monthGeneral);
  const qiMen = deriveQiMenCore(calculation, options.qiMen ?? options);
  const result = {
    schemaVersion: "1.0.0",
    module: { name: "metaphysics-core", version: "0.1.0", responsibility: "统一四柱、节气、月将与奇门起局公共事实" },
    source: { standardTime: calculation.time.standard, trueSolarTime: calculation.time.trueSolar, fourPillars: calculation.fourPillars.text },
    solarTerm: qiMen.solarTerm,
    middleQi: { current: monthGeneral.currentMiddleQi, next: monthGeneral.nextMiddleQi },
    monthGeneral,
    qiMen,
    branchShenSha: buildBranchShenSha(calculation),
  };
  Object.defineProperty(result, "calculation", { value: calculation, enumerable: false });
  return result;
}

export function calculateMetaphysicsCore(input, config = {}, options = {}) {
  return buildMetaphysicsCore(calculateFourPillars(input, config), options);
}

export function formatMetaphysicsCoreText(core) {
  return [
    "术数公共核心", "============",
    `标准时间  ${core.source.standardTime}`,
    `真太阳时  ${core.source.trueSolarTime}`,
    `四柱      ${core.source.fourPillars}`,
    `节气      ${core.solarTerm.current.name} → ${core.solarTerm.next.name}`,
    `月将      ${core.monthGeneral.branch}${core.monthGeneral.name}（${core.monthGeneral.mode}）`,
    `奇门      ${core.qiMen.ju.label} · ${core.qiMen.yuan.name}/${core.qiMen.yuan.hou}`,
    `符头      ${core.qiMen.yuan.fuTou.value}`,
    `旬首      ${core.qiMen.xun.start}遁${core.qiMen.xun.hiddenStem}`,
    `值符      ${core.qiMen.chiefs.star.name} 落${core.qiMen.chiefs.star.palace}宫`,
    `值使      ${core.qiMen.chiefs.door.name} 落${core.qiMen.chiefs.door.palace}宫`,
  ].join("\n");
}
