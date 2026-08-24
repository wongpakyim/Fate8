/**
 * 时家转盘奇门（拆补法）排盘模块。
 *
 * 只接收 four-pillars.mjs 的完整结果：节气用同一标准时定位，日柱、时柱
 * 直接复用四柱模块结果，不重新解释出生时间。
 */

import { STEMS, mod } from "./four-pillars.mjs";
import { QIMEN_PALACES, buildMetaphysicsCore, getTwelveGrowthStage } from "./metaphysics-core.mjs";
import { renderTextGrid } from "./text-layout.mjs";

export { CHAI_BU_JU_TABLE, QIMEN_PALACES } from "./metaphysics-core.mjs";

const DISPLAY_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const ROTATION_RING = [1, 8, 3, 4, 9, 2, 7, 6];
const DEITIES = ["值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
const PRODUCES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const STEM_IMAGES = {
  甲: "栋梁与开创", 乙: "花草与协商", 丙: "太阳与显达", 丁: "灯火与谋划", 戊: "厚土与资本",
  己: "田园与承载", 庚: "刀兵与变革", 辛: "珠玉与规制", 壬: "江河与流动", 癸: "雨露与隐情",
};

export function getQiMenStemResponse(heavenStem, earthStem) {
  const heaven = STEMS.find((stem) => stem.name === heavenStem);
  const earth = STEMS.find((stem) => stem.name === earthStem);
  if (!heaven || !earth) throw new RangeError(`未知十干组合：${heavenStem}加${earthStem}`);

  let relation;
  let interpretation;
  if (heavenStem === earthStem) {
    relation = "同干伏吟";
    interpretation = "同一气象重叠，事情容易反复、迟滞或自我强化；宜复核旧因，避免原地打转。";
  } else if (heaven.element === earth.element) {
    relation = "五行比和";
    interpretation = "内外同气，协同较顺；阴阳相异时更有互补性，仍须合参门、星及宫位旺衰。";
  } else if (PRODUCES[heaven.element] === earth.element) {
    relation = "天盘生地盘";
    interpretation = "行动向基础输送，利培植、落实与善后，但主动一方较耗力。";
  } else if (PRODUCES[earth.element] === heaven.element) {
    relation = "地盘生天盘";
    interpretation = "基础扶助行动，较易获得资源与承接，可顺势推进。";
  } else if (CONTROLS[heaven.element] === earth.element) {
    relation = "天盘克地盘";
    interpretation = "主动一方压制环境，可用于整顿与突破，也要防冲突和损耗。";
  } else {
    relation = "地盘克天盘";
    interpretation = "环境牵制行动，现实阻力较实，应先化解条件再推进。";
  }

  return {
    key: `${heavenStem}-${earthStem}`,
    combination: `${heavenStem}加${earthStem}`,
    heaven: { ...heaven, image: STEM_IMAGES[heavenStem] },
    earth: { ...earth, image: STEM_IMAGES[earthStem] },
    relation,
    interpretation: `天盘${heavenStem}（${STEM_IMAGES[heavenStem]}）临地盘${earthStem}（${STEM_IMAGES[earthStem]}）。${interpretation}`,
    scope: "十干克应一般解读，具体吉凶须合参八门、九星、八神、宫位旺衰与所占事项。",
  };
}

function rotateFromTo(originValues, basePalace, targetPalace) {
  const baseIndex = ROTATION_RING.indexOf(basePalace);
  const targetIndex = ROTATION_RING.indexOf(targetPalace);
  const shift = mod(targetIndex - baseIndex, 8);
  const result = {};
  ROTATION_RING.forEach((originPalace, index) => {
    result[ROTATION_RING[mod(index + shift, 8)]] = originValues[originPalace];
  });
  return result;
}

export function calculateQiMen(calculation, options = {}) {
  if (!calculation || calculation.module?.name !== "four-pillars" || !calculation.fourPillars?.hour) {
    throw new TypeError("calculateQiMen 必须接收 calculateFourPillars 的完整结果");
  }
  const core = options.core ?? buildMetaphysicsCore(calculation, { qiMen: { method: options.method || "chai-bu" } });
  if (core.module?.name !== "metaphysics-core" || core.source?.fourPillars !== calculation.fourPillars.text) throw new TypeError("奇门模块收到的公共核心与四柱结果不匹配");
  const setup = core.qiMen;
  const { earthInstruments, yuan, xun, chiefs, horse, solarTerm, ju, dun } = setup;
  const direction = dun.directionStep;
  const xunBasePalace = xun.basePalace;
  const chiefDoorBasePalace = chiefs.door.basePalace;
  const chiefStarPalace = chiefs.star.palace;
  const chiefDoorPalace = chiefs.door.palace;

  const starOrigins = {};
  for (const palaceNumber of ROTATION_RING) {
    starOrigins[palaceNumber] = {
      stars: palaceNumber === 2 ? ["天芮", "天禽"] : [QIMEN_PALACES[palaceNumber].originalStar],
      heavenInstruments: palaceNumber === 2 ? [earthInstruments[2], earthInstruments[5]] : [earthInstruments[palaceNumber]],
    };
  }
  const starsByPalace = rotateFromTo(starOrigins, xunBasePalace === 5 ? 2 : xunBasePalace, chiefStarPalace);
  const doorOrigins = Object.fromEntries(ROTATION_RING.map((palaceNumber) => [palaceNumber, QIMEN_PALACES[palaceNumber].originalDoor]));
  const doorsByPalace = rotateFromTo(doorOrigins, chiefDoorBasePalace, chiefDoorPalace);

  const deitiesByPalace = {};
  const chiefStarRingIndex = ROTATION_RING.indexOf(chiefStarPalace);
  DEITIES.forEach((deity, index) => {
    deitiesByPalace[ROTATION_RING[mod(chiefStarRingIndex + direction * index, 8)]] = deity;
  });

  const voidPalaces = new Set(setup.voidPalaces);

  const palaces = DISPLAY_ORDER.map((palaceNumber) => {
    const rotation = starsByPalace[palaceNumber] || { stars: ["天禽"], heavenInstruments: [] };
    const palaceBranches = QIMEN_PALACES[palaceNumber].branches;
    return {
      ...QIMEN_PALACES[palaceNumber],
      earthInstrument: earthInstruments[palaceNumber],
      heavenInstruments: palaceNumber === 5 ? [] : rotation.heavenInstruments,
      stars: palaceNumber === 5 ? [] : rotation.stars,
      door: palaceNumber === 5 ? null : doorsByPalace[palaceNumber],
      deity: palaceNumber === 5 ? null : deitiesByPalace[palaceNumber],
      heavenGrowth: palaceNumber === 5 ? [] : rotation.heavenInstruments.flatMap((stem) => palaceBranches.map((branch) => ({ stem, branch, stage: getTwelveGrowthStage(stem, branch) }))),
      earthGrowth: palaceNumber === 5 ? [] : palaceBranches.map((branch) => ({ stem: earthInstruments[palaceNumber], branch, stage: getTwelveGrowthStage(earthInstruments[palaceNumber], branch) })),
      stemResponses: palaceNumber === 5 ? [] : rotation.heavenInstruments.map((stem) => getQiMenStemResponse(stem, earthInstruments[palaceNumber])),
      isChiefStar: palaceNumber === chiefStarPalace,
      isChiefDoor: palaceNumber === chiefDoorPalace,
      isVoid: voidPalaces.has(palaceNumber),
      isHorse: palaceNumber === horse.palace,
    };
  });

  return {
    schemaVersion: "1.0.0",
    module: { name: "qi-men", version: "0.1.0", responsibility: "接收四柱结果并生成时家转盘拆补法奇门盘" },
    source: { module: calculation.module, standardTime: calculation.time.standard, trueSolarTime: calculation.time.trueSolar, fourPillars: calculation.fourPillars.text },
    config: { method: "chai-bu", methodName: "拆补法", style: "时家转盘", centerStarLodging: "天禽寄坤二" },
    core: { module: core.module },
    solarTerm,
    dun,
    yuan,
    ju,
    xun,
    chiefs,
    horse,
    palaces,
    notices: [
      "拆补法以当前节气为界，最近甲、己日为符头，按符头地支分上、中、下元。",
      "日柱与时柱直接取自共用四柱模块；值符随时干，值使随时支，天禽寄坤二宫。",
      "临近节气、换日或时辰边界时，应按所用门派与高精度天文历表复核。",
    ],
  };
}

function compactGrowth(items) {
  const groups = new Map();
  for (const item of items) groups.set(item.stem, [...(groups.get(item.stem) || []), item.stage]);
  return [...groups.entries()].map(([stem, stages]) => `${stem}${stages.join("、")}`).join("/") || "—";
}

function qiMenPalaceCell(palace) {
  if (palace.number === 5) return [
    `${palace.name} ${palace.direction}`,
    `地盘干 ${palace.earthInstrument}`,
    "天禽寄坤二",
  ];
  const status = [palace.isChiefStar ? "值符" : "", palace.isChiefDoor ? "值使" : "", palace.isVoid ? "空亡" : "", palace.isHorse ? "马星" : ""].filter(Boolean).join("、") || "—";
  return [
    `${palace.name} ${palace.direction}（${palace.branches.join("、")}）`,
    `八神 ${palace.deity}`,
    `九星 ${palace.stars.join("/")}`,
    `八门 ${palace.door}`,
    `天盘干 ${palace.heavenInstruments.join("/")}`,
    `天盘长生 ${compactGrowth(palace.heavenGrowth)}`,
    `地盘干 ${palace.earthInstrument}`,
    `地盘长生 ${compactGrowth(palace.earthGrowth)}`,
    `十干克应 ${palace.stemResponses.map((response) => `${response.combination}·${response.relation}`).join("；")}`,
    `状态 ${status}`,
  ];
}

export function formatQiMenNineGridText(result) {
  const cells = Object.fromEntries(result.palaces.map((palace) => [palace.number, qiMenPalaceCell(palace)]));
  return [
    "奇门九宫（巽离坤／震中兑／艮坎乾）",
    renderTextGrid([
      [cells[4], cells[9], cells[2]],
      [cells[3], cells[5], cells[7]],
      [cells[8], cells[1], cells[6]],
    ], { cellWidth: 30 }),
  ].join("\n");
}

export function formatQiMenText(result) {
  return [
    "时家奇门 · 拆补法", "=================", `共用时间  ${result.source.standardTime}`, `四柱      ${result.source.fourPillars}`,
    `节气      ${result.solarTerm.current.name}（下节 ${result.solarTerm.next.name}）`,
    `拆补定局：${result.yuan.fuTou.value}符头 · ${result.yuan.name} · ${result.ju.label}（${result.yuan.hou}）`,
    `旬首      ${result.xun.start}遁${result.xun.hiddenStem} · 值符${result.chiefs.star.name} · 值使${result.chiefs.door.name}`,
    "", formatQiMenNineGridText(result),
  ].join("\n");
}
