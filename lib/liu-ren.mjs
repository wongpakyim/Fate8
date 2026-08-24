/**
 * 大六壬排盘模块。
 *
 * 本模块不重新解析阳历，也不重新计算四柱；它只接收 four-pillars.mjs 的结果，
 * 以同一标准时、真太阳时和时柱起天地盘、四课、三传与十二天将。
 */

import { BRANCHES, mod } from "./four-pillars.mjs";
import { buildMetaphysicsCore } from "./metaphysics-core.mjs";
import { renderTextGrid, renderTextRing } from "./text-layout.mjs";

export { MONTH_GENERALS } from "./metaphysics-core.mjs";
const STEM_PALACES = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1];
const HEAVENLY_GENERAL_NAMES = ["贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"];
const PRODUCES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const PUNISHMENT = [3, 10, 5, 0, 4, 8, 6, 1, 2, 9, 7, 11];
const HORSE = { 0: 2, 1: 11, 2: 8, 3: 5, 4: 2, 5: 11, 6: 8, 7: 5, 8: 2, 9: 11, 10: 8, 11: 5 };
const STEM_COMBINATION = [5, 6, 7, 8, 9, 0, 1, 2, 3, 4];
const HEAVENLY_GENERAL_ELEMENTS = {
  贵人: "土", 螣蛇: "火", 朱雀: "火", 六合: "木", 勾陈: "土", 青龙: "木",
  天空: "土", 白虎: "金", 太常: "土", 玄武: "水", 太阴: "金", 天后: "水",
};

function branch(index) {
  const item = BRANCHES[mod(index, 12)];
  return { ...item, index: mod(index, 12), polarity: mod(index, 2) === 0 ? "阳" : "阴" };
}

function controls(from, to) {
  return CONTROLS[from] === to;
}

function sixRelation(dayElement, targetElement) {
  if (dayElement === targetElement) return "兄弟";
  if (PRODUCES[targetElement] === dayElement) return "父母";
  if (PRODUCES[dayElement] === targetElement) return "子孙";
  if (CONTROLS[dayElement] === targetElement) return "妻财";
  return "官鬼";
}

function nobleBranchIndex(dayStemIndex, daytime) {
  const pairs = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [5, 3], [5, 3]];
  return pairs[dayStemIndex][daytime ? 0 : 1];
}

function chooseByPolarityThenPosition(candidates, dayPolarity) {
  const matching = candidates.filter((lesson) => lesson.upper.polarity === dayPolarity);
  if (matching.length === 1) return { lesson: matching[0], method: "比用" };
  const pool = matching.length ? matching : candidates;
  const rank = (earthIndex) => [2, 5, 8, 11].includes(earthIndex) ? 0 : [0, 3, 6, 9].includes(earthIndex) ? 1 : 2;
  const bestRank = Math.min(...pool.map((lesson) => rank(lesson.earthIndex)));
  const best = pool.filter((lesson) => rank(lesson.earthIndex) === bestRank);
  const stemFirst = dayPolarity === "阳";
  return { lesson: best.find((lesson) => stemFirst ? lesson.source === "干课" : lesson.source === "支课") || best[0], method: "涉害" };
}

function uniqueLessons(lessons) {
  return new Set(lessons.map((lesson) => `${lesson.lower.name}-${lesson.upper.name}`)).size;
}

function buildThreeTransmission({ lessons, upperAt, dayStem, dayBranchIndex, plateOffset }) {
  const lowerControls = lessons.filter((lesson) => lesson.relation === "下贼上");
  const upperControls = lessons.filter((lesson) => lesson.relation === "上克下");

  const fromDirect = () => {
    const candidates = lowerControls.length ? lowerControls : upperControls;
    if (!candidates.length) return null;
    if (candidates.length === 1) return { initial: candidates[0].upper.index, method: lowerControls.length ? "重审" : "元首" };
    const chosen = chooseByPolarityThenPosition(candidates, dayStem.polarity);
    return { initial: chosen.lesson.upper.index, method: chosen.method };
  };

  const direct = fromDirect();
  if (plateOffset === 0) {
    const initial = direct?.initial ?? (dayStem.polarity === "阳" ? lessons[0].upper.index : dayBranchIndex);
    let middle = PUNISHMENT[initial];
    if (middle === initial) middle = dayStem.polarity === "阳" ? dayBranchIndex : lessons[0].upper.index;
    let final = PUNISHMENT[middle];
    if (final === middle) final = dayStem.polarity === "阳" ? dayBranchIndex : lessons[0].upper.index;
    return { initial, middle, final, method: direct ? `伏吟·${direct.method}` : "伏吟" };
  }

  if (direct) {
    const prefix = plateOffset === 6 ? "返吟·" : "";
    return { ...direct, method: prefix + direct.method, middle: upperAt(direct.initial), final: upperAt(upperAt(direct.initial)) };
  }

  if (plateOffset === 6) {
    return { initial: HORSE[dayBranchIndex], middle: lessons[2].upper.index, final: lessons[0].upper.index, method: "返吟·井栏" };
  }

  const upperGods = lessons.map((lesson) => lesson.upper).filter((item, index, all) => all.findIndex((candidate) => candidate.index === item.index) === index);
  const remoteUpper = upperGods.filter((item) => controls(item.element, dayStem.element));
  const remoteLower = upperGods.filter((item) => controls(dayStem.element, item.element));
  const remote = remoteUpper.length ? remoteUpper : remoteLower;
  if (remote.length) {
    const matching = remote.filter((item) => item.polarity === dayStem.polarity);
    const initial = (matching.length ? matching : remote)[0].index;
    return { initial, middle: upperAt(initial), final: upperAt(upperAt(initial)), method: remoteUpper.length ? "遥克·蒿矢" : "遥克·弹射" };
  }

  const count = uniqueLessons(lessons);
  if (count >= 4) {
    const initial = dayStem.polarity === "阳" ? upperAt(9) : Array.from({ length: 12 }, (_, index) => index).find((index) => upperAt(index) === 9);
    return { initial, middle: dayStem.polarity === "阳" ? lessons[2].upper.index : lessons[0].upper.index, final: dayStem.polarity === "阳" ? lessons[0].upper.index : lessons[2].upper.index, method: "昴星" };
  }
  if (count === 3) {
    const combinedPalace = STEM_PALACES[STEM_COMBINATION[dayStem.index]];
    const initial = dayStem.polarity === "阳" ? upperAt(combinedPalace) : mod(dayBranchIndex + 4, 12);
    return { initial, middle: lessons[0].upper.index, final: lessons[0].upper.index, method: "别责" };
  }
  const initial = dayStem.polarity === "阳" ? mod(lessons[0].upper.index + 2, 12) : mod(lessons[3].upper.index - 2, 12);
  return { initial, middle: lessons[0].upper.index, final: lessons[0].upper.index, method: "八专" };
}

export function calculateLiuRen(calculation, options = {}) {
  if (!calculation || calculation.module?.name !== "four-pillars" || !calculation.fourPillars?.hour) {
    throw new TypeError("calculateLiuRen 必须接收 calculateFourPillars 的完整结果");
  }

  const core = options.core ?? buildMetaphysicsCore(calculation, { monthGeneral: options.monthGeneral ?? options.monthGeneralOverride });
  if (core.module?.name !== "metaphysics-core" || core.source?.fourPillars !== calculation.fourPillars.text) throw new TypeError("六壬模块收到的公共核心与四柱结果不匹配");
  const general = core.monthGeneral;
  const generalIndex = general.index;
  const hourIndex = calculation.fourPillars.hour.branch.index;
  const plateOffset = mod(generalIndex - hourIndex, 12);
  const upperAt = (earthIndex) => mod(earthIndex + plateOffset, 12);
  const dayStem = calculation.fourPillars.day.stem;
  const dayBranchIndex = calculation.fourPillars.day.branch.index;
  const daytime = hourIndex >= 3 && hourIndex < 9;
  const nobleIndex = nobleBranchIndex(dayStem.index, daytime);
  const nobleEarth = Array.from({ length: 12 }, (_, index) => index).find((index) => upperAt(index) === nobleIndex);
  const generalsForward = [11, 0, 1, 2, 3, 4].includes(nobleEarth);
  const generalForHeaven = (heavenIndex) => HEAVENLY_GENERAL_NAMES[mod((generalsForward ? 1 : -1) * (heavenIndex - nobleIndex), 12)];
  const generalDetail = (name) => ({ name, element: HEAVENLY_GENERAL_ELEMENTS[name] });

  const earthPlate = Array.from({ length: 12 }, (_, earthIndex) => {
    const heavenIndex = upperAt(earthIndex);
    const heavenlyGeneral = generalForHeaven(heavenIndex);
    const shenSha = core.branchShenSha[earthIndex];
    return { earth: branch(earthIndex), heaven: branch(heavenIndex), heavenlyGeneral, heavenlyGeneralDetail: generalDetail(heavenlyGeneral), shenSha: shenSha.stars, shenShaGroups: shenSha.groups };
  });

  const makeLesson = (order, label, lower, earthIndex, source) => {
    const upper = branch(upperAt(earthIndex));
    const relation = controls(lower.element, upper.element) ? "下贼上" : controls(upper.element, lower.element) ? "上克下" : lower.element === upper.element ? "比和" : "生泄";
    const heavenlyGeneral = generalForHeaven(upper.index);
    const heavenlyGeneralDetail = generalDetail(heavenlyGeneral);
    const earthHeavenlyGeneral = generalForHeaven(earthIndex);
    return {
      order, label, source, earthIndex, earthPalace: BRANCHES[earthIndex].name, lower, upper,
      heavenlyGeneral, heavenlyGeneralDetail,
      earthHeavenlyGeneral,
      earthHeavenlyGeneralDetail: generalDetail(earthHeavenlyGeneral),
      relation,
    };
  };
  const stemPalace = STEM_PALACES[dayStem.index];
  const firstLower = { kind: "stem", name: dayStem.name, element: dayStem.element, polarity: dayStem.polarity, index: dayStem.index };
  const first = makeLesson(1, "一课", firstLower, stemPalace, "干课");
  const secondLower = { kind: "branch", ...branch(first.upper.index) };
  const second = makeLesson(2, "二课", secondLower, first.upper.index, "干课");
  const thirdLower = { kind: "branch", ...branch(dayBranchIndex) };
  const third = makeLesson(3, "三课", thirdLower, dayBranchIndex, "支课");
  const fourthLower = { kind: "branch", ...branch(third.upper.index) };
  const fourth = makeLesson(4, "四课", fourthLower, third.upper.index, "支课");
  const fourLessons = [first, second, third, fourth];
  const rawTransmissions = buildThreeTransmission({ lessons: fourLessons, upperAt, dayStem, dayBranchIndex, plateOffset });
  const transmissionIndexes = [rawTransmissions.initial, rawTransmissions.middle, rawTransmissions.final];
  const threeTransmissions = {
    method: rawTransmissions.method,
    items: transmissionIndexes.map((index, order) => {
      const heavenlyGeneral = generalForHeaven(index);
      return { order: order + 1, label: ["初传", "中传", "末传"][order], branch: branch(index), heavenlyGeneral, heavenlyGeneralDetail: generalDetail(heavenlyGeneral), sixRelation: sixRelation(dayStem.element, BRANCHES[index].element) };
    }),
  };

  return {
    schemaVersion: "1.0.0",
    module: { name: "liu-ren", version: "0.2.0", responsibility: "消费公共核心并生成大六壬十二宫、四课、三传" },
    source: { module: calculation.module, standardTime: calculation.time.standard, trueSolarTime: calculation.time.trueSolar, fourPillars: calculation.fourPillars.text },
    core: { module: core.module },
    config: { monthGeneralMethod: "middle-qi", monthGeneralMode: general.mode === "手动指定" ? "manual" : "auto", dayNight: daytime ? "昼占" : "夜占" },
    monthGeneral: general,
    divinationTime: { branch: branch(hourIndex), pillar: calculation.fourPillars.hour.value, source: "四柱模块时柱" },
    earthPlate,
    fourLessons,
    threeTransmissions,
    heavenlyGenerals: { nobleman: branch(nobleIndex), noblemanEarth: branch(nobleEarth), direction: generalsForward ? "顺布" : "逆布", dayNight: daytime ? "昼贵" : "夜贵", names: HEAVENLY_GENERAL_NAMES, details: HEAVENLY_GENERAL_NAMES.map(generalDetail) },
    notices: [
      "月将默认在中气交节点切换；手动月将仅覆盖本次六壬起盘，不改动共用的出生时间和四柱。",
      "天地盘按月将加占时；四课依日干寄宫及日支逐课取上神，三传依九宗门次序裁定。",
      "临近中气、时辰边界或涉及古代历法时，应结合所用门派和高精度天文历表复核。",
    ],
  };
}

function liuRenHeavenCell(cell) {
  const groupedShenSha = cell.shenShaGroups.map((group) => `${group.category}：${group.items.join("、")}`).join("；");
  return [
    `上神 ${cell.heaven.name}${cell.heaven.element}`,
    `天将 ${cell.heavenlyGeneral}${cell.heavenlyGeneralDetail.element}`,
    `神煞 ${groupedShenSha || "—"}`,
  ];
}

export function formatLiuRenFourLessonsText(result) {
  const lessonsRightToLeft = [...result.fourLessons].reverse().map((lesson) => [
    lesson.label,
    `上神贵神 ${lesson.heavenlyGeneral}${lesson.heavenlyGeneralDetail.element}`,
    `上神 ${lesson.upper.name}${lesson.upper.element}`,
    `下神 ${lesson.lower.name}${lesson.lower.element}`,
    `寄宫 ${lesson.earthPalace}`,
    `地盘贵神 ${lesson.earthHeavenlyGeneral}${lesson.earthHeavenlyGeneralDetail.element}`,
  ]);
  return ["四课（第一课在最右，自右向左）", renderTextGrid([lessonsRightToLeft], { cellWidth: 20, align: "center" })].join("\n");
}

export function formatLiuRenHeavenPlateText(result) {
  const cells = Object.fromEntries(result.earthPlate.map((cell) => [cell.earth.index, liuRenHeavenCell(cell)]));
  return [
    "天盘十二宫（固定宫位只作方位，不重复书写地盘）",
    "方位：上巳午未申／左辰卯／右酉戌／下寅丑子亥",
    renderTextRing({
      top: [cells[5], cells[6], cells[7], cells[8]],
      left: [cells[4], cells[3]],
      right: [cells[9], cells[10]],
      bottom: [cells[2], cells[1], cells[0], cells[11]],
      center: ["大六壬", "天盘十二宫", `${result.monthGeneral.branch}将加${result.divinationTime.branch.name}时`, result.heavenlyGenerals.dayNight, result.heavenlyGenerals.direction],
    }, { cellWidth: 24 }),
  ].join("\n");
}

export function formatLiuRenText(result) {
  const transmissions = result.threeTransmissions.items.map((item) => `${item.label}${item.branch.name}${item.heavenlyGeneral}${item.sixRelation}`).join(" → ");
  return [
    "大六壬简盘", "============", `共用时间  ${result.source.standardTime}`, `四柱      ${result.source.fourPillars}`,
    `月将：${result.monthGeneral.branch}${result.monthGeneral.name}（${result.monthGeneral.mode}，${result.monthGeneral.currentMiddleQi.name}后）`,
    `占时      ${result.divinationTime.branch.name}时（${result.divinationTime.pillar}）`, `课式      ${result.threeTransmissions.method}`, `三传      ${transmissions}`,
    "", formatLiuRenFourLessonsText(result), "", formatLiuRenHeavenPlateText(result),
  ].join("\n");
}
