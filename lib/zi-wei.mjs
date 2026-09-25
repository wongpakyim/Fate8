/**
 * 紫微斗数领域适配层。
 *
 * 只接收 four-pillars 的统一时间事实，以三合派盘面组织数据，并通过
 * iztro 的中州派算法安置甲级主曜、乙级辅煞与丙级杂曜。输出保持纯 JSON，
 * 不包含 React、HTML 或 CSS 假设。
 */

import { astro, util } from "iztro";
import { renderTextRing } from "./text-layout.mjs";

const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];
const RING_BRANCHES = {
  top: ["巳", "午", "未", "申"],
  left: ["辰", "卯"],
  right: ["酉", "戌"],
  bottom: ["寅", "丑", "子", "亥"],
};

function normalizeStar(star) {
  return {
    name: star.name,
    type: star.type || "",
    scope: star.scope || "origin",
    brightness: star.brightness || "",
    mutagen: star.mutagen || "",
  };
}

function normalizeStars(stars = []) {
  return stars.map(normalizeStar);
}

function transformationsForStem(heavenlyStem) {
  return util.getMutagensByHeavenlyStem(heavenlyStem).map((star, index) => ({
    name: star,
    mutagen: MUTAGEN_LABELS[index],
  }));
}

function normalizeFlowStars(stars = []) {
  return stars.map((palaceStars) => normalizeStars(palaceStars));
}

function parseSharedTime(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) throw new TypeError("紫微排盘需要有效的共用真太阳时");
  return {
    dateStr: `${Number(match[1])}-${Number(match[2])}-${Number(match[3])}`,
    hour: Number(match[4]),
  };
}

function timeIndexForHour(hour) {
  if (hour === 23) return 12;
  return Math.floor((hour + 1) / 2);
}

function normalizeYear(year) {
  return {
    index: year.index,
    name: year.name,
    age: year.age,
    year: year.year,
    heavenlyStem: year.heavenlyStem,
    earthlyBranch: year.earthlyBranch,
    palaceNames: [...year.palaceNames],
    mutagen: [...year.mutagen],
    stars: normalizeFlowStars(year.stars),
  };
}

function normalizeDecade(decade, years) {
  return {
    listIndex: 0,
    palaceIndex: decade.index,
    name: decade.name,
    palaceName: decade.palaceName,
    ageRange: [...decade.ageRange],
    yearRange: [...decade.yearRange],
    heavenlyStem: decade.heavenlyStem,
    earthlyBranch: decade.earthlyBranch,
    palaceNames: [...decade.palaceNames],
    mutagen: [...decade.mutagen],
    stars: normalizeFlowStars(decade.stars),
    years: years.map(normalizeYear),
  };
}

function chooseDefaultSelection(decades, targetYear) {
  let decadeIndex = decades.findIndex((decade) => targetYear >= decade.yearRange[0] && targetYear <= decade.yearRange[1]);
  if (decadeIndex < 0) {
    decadeIndex = decades.reduce((best, decade, index) => {
      const bestDistance = Math.min(Math.abs(targetYear - decades[best].yearRange[0]), Math.abs(targetYear - decades[best].yearRange[1]));
      const distance = Math.min(Math.abs(targetYear - decade.yearRange[0]), Math.abs(targetYear - decade.yearRange[1]));
      return distance < bestDistance ? index : best;
    }, 0);
  }
  const decade = decades[decadeIndex];
  const year = decade.years.find((item) => item.year === targetYear) || decade.years.reduce((best, item) => Math.abs(item.year - targetYear) < Math.abs(best.year - targetYear) ? item : best, decade.years[0]);
  return { decadeIndex, year: year.year };
}

export function calculateZiWei(calculation, options = {}) {
  if (!calculation || calculation.module?.name !== "four-pillars") throw new TypeError("紫微排盘必须接收 calculateFourPillars 的结果");
  const sharedTime = parseSharedTime(calculation.time.trueSolar);
  const gender = calculation.input.sex === "female" ? "女" : "男";
  const dayDivide = calculation.time.dayBoundary === 24 ? "current" : "forward";
  const astrolabe = astro.withOptions({
    type: "solar",
    dateStr: sharedTime.dateStr,
    timeIndex: timeIndexForHour(sharedTime.hour),
    gender,
    fixLeap: true,
    language: "zh-CN",
    config: {
      algorithm: "zhongzhou",
      yearDivide: "normal",
      horoscopeDivide: "normal",
      ageDivide: "normal",
      dayDivide,
    },
    astroType: "heaven",
  });
  const source = astrolabe.toJSON();
  const decades = astrolabe.decadalList().map((decade, listIndex) => ({
    ...normalizeDecade(decade, astrolabe.yearlyList(listIndex)),
    listIndex,
  }));
  const defaultSelection = chooseDefaultSelection(decades, Number(options.referenceYear || new Date().getFullYear()));

  return {
    schemaVersion: "1.0.0",
    module: { name: "zi-wei", version: "0.2.1", responsibility: "三合派紫微盘面与中州派安星的可序列化结果" },
    rules: {
      school: "三合派",
      starAlgorithm: "中州派",
      chartType: "天盘",
      fixLeap: true,
      yearDivide: "正月初一",
      horoscopeDivide: "正月初一",
      ageDivide: "周岁",
      dayDivide: calculation.time.dayBoundary === 24 ? "午夜换日" : "子初换日",
    },
    source: {
      standardTime: calculation.time.standard,
      trueSolarTime: calculation.time.trueSolar,
      fourPillars: calculation.fourPillars.text,
      gender,
      timeIndex: timeIndexForHour(sharedTime.hour),
    },
    transformations: {
      natal: {
        heavenlyStem: calculation.fourPillars.year.stem.name,
        stars: transformationsForStem(calculation.fourPillars.year.stem.name),
      },
    },
    calendar: {
      solarDate: source.solarDate,
      lunarDate: source.lunarDate,
      chineseDate: source.chineseDate,
      time: source.time,
      timeRange: source.timeRange,
      rawDates: source.rawDates,
    },
    profile: {
      gender: source.gender,
      sign: source.sign,
      zodiac: source.zodiac,
      fiveElementsClass: source.fiveElementsClass,
      soul: source.soul,
      body: source.body,
      soulPalaceBranch: source.earthlyBranchOfSoulPalace,
      bodyPalaceBranch: source.earthlyBranchOfBodyPalace,
    },
    palaces: source.palaces.map((palace) => ({
      index: palace.index,
      name: palace.name,
      isBodyPalace: palace.isBodyPalace,
      isOriginalPalace: palace.isOriginalPalace,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: normalizeStars(palace.majorStars),
      minorStars: normalizeStars(palace.minorStars),
      adjectiveStars: normalizeStars(palace.adjectiveStars),
      palaceTransformations: transformationsForStem(palace.heavenlyStem),
      relations: {
        trines: [(palace.index + 4) % 12, (palace.index + 8) % 12],
        opposite: (palace.index + 6) % 12,
      },
      changsheng12: palace.changsheng12,
      boshi12: palace.boshi12,
      jiangqian12: palace.jiangqian12,
      suiqian12: palace.suiqian12,
      decadal: palace.decadal ? { range: [...palace.decadal.range], heavenlyStem: palace.decadal.heavenlyStem, earthlyBranch: palace.decadal.earthlyBranch } : null,
      ages: [...palace.ages],
    })),
    decades,
    defaultSelection,
  };
}

export function getZiWeiSelection(result, decadeIndex = result.defaultSelection.decadeIndex, yearValue = result.defaultSelection.year) {
  if (result?.module?.name !== "zi-wei") throw new TypeError("紫微流限选择需要 zi-wei 结果");
  const safeIndex = Math.min(Math.max(Number(decadeIndex) || 0, 0), result.decades.length - 1);
  const decade = result.decades[safeIndex];
  const targetYear = Number(yearValue);
  const year = decade.years.find((item) => item.year === targetYear) || decade.years[0];
  return { decadeIndex: safeIndex, decade, year };
}

export function getZiWeiRelationPalaceIndex(result, selection, mode = "natal") {
  if (result?.module?.name !== "zi-wei") throw new TypeError("紫微三方四正需要 zi-wei 结果");
  if (!["natal", "decadal", "yearly"].includes(mode)) throw new RangeError("三方四正模式仅支持 natal、decadal 或 yearly");

  if (mode === "natal") {
    const palace = result.palaces.find((item) => item.name === "命宫" || item.earthlyBranch === result.profile.soulPalaceBranch);
    if (!palace) throw new Error("紫微本命命宫缺失");
    return palace.index;
  }

  const palaceNames = mode === "decadal" ? selection?.decade?.palaceNames : selection?.year?.palaceNames;
  const palaceIndex = palaceNames?.findIndex((name) => name === "命宫" || name === "命");
  if (!Number.isInteger(palaceIndex) || palaceIndex < 0) throw new Error(`紫微${mode === "decadal" ? "大限" : "流年"}命宫缺失`);
  return palaceIndex;
}

function starText(stars) {
  return stars.map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `[${star.mutagen}]` : ""}`).join(" ") || "—";
}

function palaceText(palace, selection) {
  const decadeName = selection.decade.palaceNames[palace.index];
  const yearName = selection.year.palaceNames[palace.index];
  const decadeStars = starText(selection.decade.stars[palace.index]);
  const yearStars = starText(selection.year.stars[palace.index]);
  return [
    `${palace.heavenlyStem}${palace.earthlyBranch} ${palace.name.endsWith("宫") ? palace.name : `${palace.name}宫`}${palace.isBodyPalace ? "·身" : ""}${palace.isOriginalPalace ? "·命" : ""}`,
    `星曜 ${starText([...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars])}`,
    `大限 ${decadeName} ${decadeStars}`,
    `流年 ${yearName} ${yearStars}`,
  ];
}

function scopedMutagenText(prefix, names) {
  return names.map((item, index) => `${prefix}${MUTAGEN_LABELS[index]}:${typeof item === "string" ? item : item.name}`).join(" ");
}

export function formatZiWeiText(result, decadeIndex, yearValue, palaceIndex) {
  const selection = getZiWeiSelection(result, decadeIndex, yearValue);
  const byBranch = new Map(result.palaces.map((palace) => [palace.earthlyBranch, palace]));
  const cells = (branches) => branches.map((branch) => palaceText(byBranch.get(branch), selection));
  const selectedPalace = result.palaces.find((palace) => palace.index === Number(palaceIndex));
  const ring = renderTextRing({
    top: cells(RING_BRANCHES.top),
    left: cells(RING_BRANCHES.left),
    right: cells(RING_BRANCHES.right),
    bottom: cells(RING_BRANCHES.bottom),
    center: ["八字", ...result.source.fourPillars.split(" ")],
  }, { cellWidth: 30 });
  return [
    "紫微斗数 · 三合派（中州派安星）",
    `时间 ${result.source.trueSolarTime}  ${result.source.gender}命  ${result.profile.fiveElementsClass}`,
    scopedMutagenText("命", result.transformations.natal.stars),
    `大限 ${selection.decade.ageRange.join("–")}岁 ${selection.decade.yearRange.join("–")}  ${scopedMutagenText("限", selection.decade.mutagen)}`,
    `流年 ${selection.year.year} ${selection.year.age}岁 ${selection.year.heavenlyStem}${selection.year.earthlyBranch}  ${scopedMutagenText("年", selection.year.mutagen)}`,
    ...(selectedPalace ? [`点击 ${selectedPalace.heavenlyStem}${selectedPalace.earthlyBranch}${selectedPalace.name}  ${scopedMutagenText("宫", selectedPalace.palaceTransformations)}`] : []),
    ring,
  ].join("\n");
}
