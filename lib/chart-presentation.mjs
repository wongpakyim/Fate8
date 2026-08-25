/**
 * 排盘信息展示模块。
 *
 * 输入 four-pillars.mjs 的纯计算结果，生成十神、藏干、纳音、十二长生、
 * 神煞、大运和文本报告。该模块不解析出生时间，也不重新计算四柱。
 */

import { BRANCHES, ELEMENTS, GROWTH_STAGES, GROWTH_START, MONTH_NAMES, NAYIN, STEMS, mod } from "./four-pillars.mjs";

const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
const SEASONAL_STATES = [
  { 木: "旺", 火: "相", 水: "休", 金: "囚", 土: "死" },
  { 火: "旺", 土: "相", 木: "休", 水: "囚", 金: "死" },
  { 金: "旺", 水: "相", 土: "休", 火: "囚", 木: "死" },
  { 水: "旺", 木: "相", 金: "休", 土: "囚", 火: "死" },
];
const BRANCH_SHENSHA_RULES = [
  { name: "驿马", groups: [[[8, 0, 4], 2], [[2, 6, 10], 8], [[5, 9, 1], 11], [[11, 3, 7], 5]] },
  { name: "桃花", groups: [[[8, 0, 4], 9], [[2, 6, 10], 3], [[5, 9, 1], 6], [[11, 3, 7], 0]] },
  { name: "华盖", groups: [[[8, 0, 4], 4], [[2, 6, 10], 10], [[5, 9, 1], 1], [[11, 3, 7], 7]] },
  { name: "将星", groups: [[[8, 0, 4], 0], [[2, 6, 10], 6], [[5, 9, 1], 9], [[11, 3, 7], 3]] },
];
const STEM_SHENSHA_RULES = [
  { name: "天乙贵人", targetsByStem: [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [3, 5], [3, 5]] },
  { name: "文昌贵人", targetsByStem: [[5], [6], [8], [9], [8], [9], [11], [0], [2], [3]] },
  { name: "禄神", targetsByStem: [[2], [3], [5], [6], [5], [6], [8], [9], [11], [0]] },
  { name: "羊刃", targetsByStem: [[3], [2], [6], [5], [6], [5], [9], [8], [0], [11]] },
];

function tenGod(dayStemIndex, otherStemIndex) {
  if (dayStemIndex === otherStemIndex) return "比肩";
  const me = STEMS[dayStemIndex], other = STEMS[otherStemIndex];
  const samePolarity = me.polarity === other.polarity;
  if (me.element === other.element) return samePolarity ? "比肩" : "劫财";
  if (GENERATES[me.element] === other.element) return samePolarity ? "食神" : "伤官";
  if (CONTROLS[me.element] === other.element) return samePolarity ? "偏财" : "正财";
  if (CONTROLS[other.element] === me.element) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}

function growthStage(stemIndex, branchIndex) {
  return GROWTH_STAGES[mod((branchIndex - GROWTH_START[stemIndex]) * (stemIndex % 2 === 0 ? 1 : -1), 12)];
}

function seasonalState(element, monthOrder) {
  return SEASONAL_STATES[Math.floor(monthOrder / 3)][element];
}

function sixKin(tenGodName, sex) {
  const common = {
    日主: "自身",
    比肩: "手足·同辈",
    劫财: "手足·同辈",
    正印: "母亲·长辈",
    偏印: "长辈·偏缘",
  };
  if (common[tenGodName]) return common[tenGodName];
  if (sex === "female") {
    return { 食神: "子女·晚辈", 伤官: "子女·晚辈", 正财: "父缘·财星", 偏财: "父亲·财星", 正官: "夫星·官星", 七杀: "伴侣·偏缘" }[tenGodName] || "六亲参考";
  }
  return { 食神: "晚辈·才艺", 伤官: "晚辈·才艺", 正财: "妻星·财星", 偏财: "父亲·财星", 正官: "子女·官星", 七杀: "子女·官杀" }[tenGodName] || "六亲参考";
}

function enrichPillar(raw, dayStem, sex) {
  const stemIndex = raw.stem.index, branchIndex = raw.branch.index;
  const xun = Math.floor(raw.index / 10);
  const voidStart = mod(10 - 2 * xun, 12);
  const branch = BRANCHES[branchIndex];
  const stemTenGod = raw.label === "日柱" ? "日主" : tenGod(dayStem, stemIndex);
  return {
    ...raw,
    stem: { ...raw.stem, tenGod: stemTenGod, sixKin: sixKin(stemTenGod, sex) },
    branch: { ...raw.branch, hiddenStems: branch.hidden.map(([hiddenIndex, weight]) => { const hiddenTenGod = tenGod(dayStem, hiddenIndex); return { ...STEMS[hiddenIndex], index: hiddenIndex, weight, tenGod: hiddenTenGod, sixKin: sixKin(hiddenTenGod, sex) }; }) },
    naYin: NAYIN[Math.floor(raw.index / 2)],
    growthStage: growthStage(dayStem, branchIndex),
    voidBranches: BRANCHES[voidStart].name + BRANCHES[mod(voidStart + 1, 12)].name,
    shenSha: [],
  };
}

function branchRelations(pillars) {
  const sixHarmony = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  const clashes = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  const harms = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
  const stemHarmony = [[0,5,"合土"],[1,6,"合金"],[2,7,"合水"],[3,8,"合木"],[4,9,"合火"]];
  const relations = [];
  for (let a = 0; a < pillars.length; a += 1) for (let b = a + 1; b < pillars.length; b += 1) {
    const ba = pillars[a].branch.index, bb = pillars[b].branch.index;
    const pair = [Math.min(ba, bb), Math.max(ba, bb)];
    if (sixHarmony.some((x) => x[0] === pair[0] && x[1] === pair[1])) relations.push(`${pillars[a].label}${pillars[b].label}：${BRANCHES[ba].name}${BRANCHES[bb].name}六合`);
    if (clashes.some((x) => x[0] === pair[0] && x[1] === pair[1])) relations.push(`${pillars[a].label}${pillars[b].label}：${BRANCHES[ba].name}${BRANCHES[bb].name}相冲`);
    if (harms.some((x) => x[0] === pair[0] && x[1] === pair[1])) relations.push(`${pillars[a].label}${pillars[b].label}：${BRANCHES[ba].name}${BRANCHES[bb].name}相害`);
    const sa = pillars[a].stem.index, sb = pillars[b].stem.index;
    const stemPair = stemHarmony.find((x) => (x[0] === sa && x[1] === sb) || (x[0] === sb && x[1] === sa));
    if (stemPair) relations.push(`${pillars[a].label}${pillars[b].label}：${STEMS[sa].name}${STEMS[sb].name}${stemPair[2]}`);
  }
  return relations.length ? relations : ["四柱间无显著六合、六冲、六害或天干五合"];
}

function elementProfile(pillars, dayStem) {
  const scores = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  for (const pillar of pillars) {
    scores[pillar.stem.element] += 1;
    for (const hidden of pillar.branch.hiddenStems) scores[hidden.element] += hidden.weight;
  }
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const percentages = Object.fromEntries(ELEMENTS.map((element) => [element, Math.round(scores[element] / total * 100)]));
  const dm = STEMS[dayStem];
  const resourceElement = ELEMENTS.find((element) => GENERATES[element] === dm.element);
  const support = scores[dm.element] + scores[resourceElement];
  const strength = support / total >= .5 ? "偏强" : support / total >= .36 ? "中和" : "偏弱";
  return { scores, percentages, dayMaster: `${dm.name}${dm.element}`, strength, supportRatio: Number((support / total).toFixed(3)), favorableElements: strength === "偏强" ? [GENERATES[dm.element], CONTROLS[dm.element]] : [resourceElement, dm.element], note: "强弱与喜用为展示层的基础权重判读。" };
}

function shenShaProfile(pillars, dayStem) {
  const byPillar = pillars.map(() => new Set());
  const referenceBranches = [pillars[0].branch.index, pillars[2].branch.index];
  for (const reference of referenceBranches) for (const rule of BRANCH_SHENSHA_RULES) {
    const target = rule.groups.find(([group]) => group.includes(reference))?.[1];
    pillars.forEach((pillar, index) => { if (pillar.branch.index === target) byPillar[index].add(rule.name); });
  }
  for (const rule of STEM_SHENSHA_RULES) pillars.forEach((pillar, index) => { if (rule.targetsByStem[dayStem].includes(pillar.branch.index)) byPillar[index].add(rule.name); });
  const items = pillars.map((pillar, index) => ({ label: pillar.label, pillar: pillar.value, stars: [...byPillar[index]] }));
  items.forEach((item, index) => { pillars[index].shenSha = item.stars; });
  return { byPillar: items, all: [...new Set(items.flatMap((item) => item.stars))], note: "神煞按年支、日支及日干的常用规则定位，仅作展示层辅助标记。" };
}

function buildLuckCycles(calculation) {
  const { direction, startAge, startYear, startTime, basisTerm, basisTermTime, distanceDays, method, note } = calculation.luckStart;
  const monthIndex = calculation.calendarContext.monthIndex;
  const forward = direction === "顺排";
  const cycles = Array.from({ length: 8 }, (_, index) => {
    const pillarIndex = mod(monthIndex + (forward ? index + 1 : -(index + 1)), 60);
    const stemIndex = pillarIndex % 10;
    const branchIndex = pillarIndex % 12;
    return { order: index + 1, index: pillarIndex, pillar: STEMS[stemIndex].name + BRANCHES[branchIndex].name, stem: { ...STEMS[stemIndex], index: stemIndex }, branch: { ...BRANCHES[branchIndex], index: branchIndex }, startAge: Number((startAge + index * 10).toFixed(2)), startYear: startYear + index * 10, naYin: NAYIN[Math.floor(pillarIndex / 2)] };
  });
  return { direction, startAge, startYear, startTime, basisTerm, basisTermTime, distanceDays, method, cycles, note };
}

export function buildBaziChart(calculation) {
  if (calculation?.module?.name !== "four-pillars") throw new TypeError("排盘展示模块需要 four-pillars 计算模块的结果");
  const dayStem = calculation.calendarContext.dayStemIndex;
  const raw = calculation.fourPillars;
  const pillars = [raw.year, raw.month, raw.day, raw.hour].map((pillar) => enrichPillar(pillar, dayStem, calculation.input.sex));
  const shenSha = shenShaProfile(pillars, dayStem);
  return {
    schemaVersion: calculation.schemaVersion,
    module: { name: "chart-presentation", version: "0.3.0", responsibility: "排盘信息组织、动态参照关系与展示" },
    calculation: { module: calculation.module, luckStart: calculation.luckStart, calendarContext: calculation.calendarContext },
    algorithm: { ...calculation.algorithm, name: "ZiMing Four Pillars + Presentation" },
    input: calculation.input,
    time: calculation.time,
    fourPillars: { text: calculation.fourPillars.text, compact: calculation.fourPillars.compact, year: pillars[0], month: pillars[1], day: pillars[2], hour: pillars[3] },
    profile: { zodiac: pillars[0].branch.zodiac, monthCommand: MONTH_NAMES[calculation.calendarContext.monthOrder], dayMaster: STEMS[dayStem].name, elements: elementProfile(pillars, dayStem), relations: branchRelations(pillars), shenSha },
    luck: buildLuckCycles(calculation),
    notices: calculation.notices,
  };
}

function normalizeReference(chart, reference = {}) {
  if (chart?.module?.name !== "chart-presentation") throw new TypeError("动态参照需要 chart-presentation 模块的结果");
  const dayPillar = chart.fourPillars.day;
  const kind = reference.kind === "branch" ? "branch" : "stem";
  const branchIndex = Number.isInteger(reference.branchIndex) ? mod(reference.branchIndex, 12) : dayPillar.branch.index;
  const stemIndex = kind === "branch" ? BRANCHES[branchIndex].hidden[0][0] : Number.isInteger(reference.stemIndex) ? mod(reference.stemIndex, 10) : dayPillar.stem.index;
  const stem = { ...STEMS[stemIndex], index: stemIndex };
  const branch = { ...BRANCHES[branchIndex], index: branchIndex };
  const monthOrder = chart.calculation.calendarContext.monthOrder;
  const monthBranchIndex = chart.fourPillars.month.branch.index;
  return {
    key: reference.key || "natal-day-stem",
    kind,
    source: reference.source || "日干",
    char: reference.char || (kind === "branch" ? branch.name : stem.name),
    stem,
    branch,
    monthStatus: seasonalState(stem.element, monthOrder),
    monthGrowth: growthStage(stemIndex, monthBranchIndex),
    seatGrowth: growthStage(stemIndex, branchIndex),
  };
}

function shenShaForReference(referenceStemIndex, referenceBranchIndex, targetBranchIndex) {
  const stars = new Set();
  for (const rule of BRANCH_SHENSHA_RULES) {
    const target = rule.groups.find(([group]) => group.includes(referenceBranchIndex))?.[1];
    if (targetBranchIndex === target) stars.add(rule.name);
  }
  for (const rule of STEM_SHENSHA_RULES) if (rule.targetsByStem[referenceStemIndex].includes(targetBranchIndex)) stars.add(rule.name);
  return [...stars];
}

function focusPillar(chart, pillar, reference, fallbackLabel) {
  const stemIndex = Number.isInteger(pillar.stem?.index) ? pillar.stem.index : mod(pillar.index, 10);
  const branchIndex = Number.isInteger(pillar.branch?.index) ? pillar.branch.index : mod(pillar.index, 12);
  const stemTenGod = tenGod(reference.stem.index, stemIndex);
  const branch = BRANCHES[branchIndex];
  const hiddenStems = branch.hidden.map(([hiddenIndex, weight]) => {
    const hiddenTenGod = tenGod(reference.stem.index, hiddenIndex);
    return { ...STEMS[hiddenIndex], index: hiddenIndex, weight, tenGod: hiddenTenGod, sixKin: sixKin(hiddenTenGod, chart.input.sex) };
  });
  const mainQi = hiddenStems[0];
  return {
    label: pillar.label || fallbackLabel,
    value: pillar.value || pillar.pillar,
    index: pillar.index,
    stem: { ...STEMS[stemIndex], index: stemIndex, tenGod: stemTenGod, sixKin: sixKin(stemTenGod, chart.input.sex) },
    branch: { ...branch, index: branchIndex, mainQi, hiddenStems },
    naYin: pillar.naYin || NAYIN[Math.floor(mod(pillar.index, 60) / 2)],
    growthStage: growthStage(reference.stem.index, branchIndex),
    monthStatus: reference.monthStatus,
    monthGrowth: reference.monthGrowth,
    seatGrowth: growthStage(reference.stem.index, branchIndex),
    shenSha: shenShaForReference(reference.stem.index, reference.branch.index, branchIndex),
  };
}

/**
 * 以任意本命、大运或流年干支为参照，重算目标柱的十神、六亲、长生、旺衰与神煞。
 * 地支参照自动取本气天干；天干参照使用该干，并以同柱地支作为坐宫。
 */
export function getBaziFocusView(chart, reference, pillars) {
  const normalizedReference = normalizeReference(chart, reference);
  const targetPillars = pillars || [chart.fourPillars.year, chart.fourPillars.month, chart.fourPillars.day, chart.fourPillars.hour];
  return { reference: normalizedReference, pillars: targetPillars.map((pillar, index) => focusPillar(chart, pillar, normalizedReference, `第${index + 1}柱`)) };
}

/** 默认选中当前流年；1950 年以前出生者改取与当前年同干支且距离最近的流年。 */
export function getDefaultLuckSelection(chart, currentYear = new Date().getFullYear()) {
  if (!Number.isInteger(currentYear)) throw new TypeError("当前年份必须为整数");
  const candidates = chart.luck.cycles.flatMap((cycle, cycleIndex) => Array.from({ length: 10 }, (_, offset) => ({ cycleIndex, year: cycle.startYear + offset })));
  if (!candidates.length) throw new RangeError("命盘没有可选大运流年");
  const birthYear = chart.calculation.calendarContext.birthYear;
  let selected;
  let reason = "当前流年";
  if (birthYear < 1950) {
    const currentIndex = mod(currentYear - 4, 60);
    selected = candidates.filter((candidate) => mod(candidate.year - 4, 60) === currentIndex).sort((a, b) => Math.abs(a.year - currentYear) - Math.abs(b.year - currentYear))[0];
    reason = "同干支最近流年";
  } else {
    selected = candidates.find((candidate) => candidate.year === currentYear);
  }
  selected ||= [...candidates].sort((a, b) => Math.abs(a.year - currentYear) - Math.abs(b.year - currentYear))[0];
  const yearIndex = mod(selected.year - 4, 60);
  return { ...selected, reason, pillar: STEMS[yearIndex % 10].name + BRANCHES[yearIndex % 12].name };
}

/**
 * 生成固定的 2×4 八字节点。上排为年月至时四干，下排为对应四支。
 * 每个节点都携带在本命月令中的旺相休囚死与十二长生，供任何展示层复用。
 */
export function getBaziNodeStates(chart) {
  if (chart?.module?.name !== "chart-presentation") throw new TypeError("节点状态需要 chart-presentation 模块的结果");
  const pillars = [chart.fourPillars.year, chart.fourPillars.month, chart.fourPillars.day, chart.fourPillars.hour];
  const monthOrder = chart.calculation.calendarContext.monthOrder;
  const monthBranchIndex = chart.fourPillars.month.branch.index;
  const stemNodes = pillars.map((pillar, pillarIndex) => ({
    id: `${["year", "month", "day", "hour"][pillarIndex]}-stem`,
    meta: `${["年", "月", "日", "时"][pillarIndex]}干`,
    kind: "stem",
    pillarIndex,
    char: pillar.stem.name,
    element: pillar.stem.element,
    stemIndex: pillar.stem.index,
    seatBranchIndex: pillar.branch.index,
    referenceStemIndex: pillar.stem.index,
    monthStatus: seasonalState(pillar.stem.element, monthOrder),
    monthGrowth: growthStage(pillar.stem.index, monthBranchIndex),
    shenSha: [],
  }));
  const branchNodes = pillars.map((pillar, pillarIndex) => {
    const mainQi = pillar.branch.hiddenStems[0];
    return {
      id: `${["year", "month", "day", "hour"][pillarIndex]}-branch`,
      meta: `${["年", "月", "日", "时"][pillarIndex]}支`,
      kind: "branch",
      pillarIndex,
      char: pillar.branch.name,
      element: pillar.branch.element,
      branchIndex: pillar.branch.index,
      referenceStemIndex: mainQi.index,
      mainQi: { name: mainQi.name, element: mainQi.element, index: mainQi.index },
      hiddenStems: pillar.branch.hiddenStems,
      monthStatus: seasonalState(pillar.branch.element, monthOrder),
      monthGrowth: growthStage(mainQi.index, monthBranchIndex),
      shenSha: pillar.shenSha,
    };
  });
  return [...stemNodes, ...branchNodes];
}

/**
 * 以被点击节点为参照，计算八个字（包括自身）的动态关系。地支节点以本气天干为参照。
 */
export function getBaziNodeRelations(chart, targetIndex) {
  const nodes = getBaziNodeStates(chart);
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= nodes.length) throw new RangeError("节点序号必须在 0—7 之间");
  const target = nodes[targetIndex];
  return getBaziRelationsByReference(chart, {
    key: target.id,
    kind: target.kind,
    source: target.kind === "branch" ? `${target.char}之本气` : target.meta,
    char: target.char,
    stemIndex: target.referenceStemIndex,
    branchIndex: target.kind === "branch" ? target.branchIndex : target.seatBranchIndex,
    targetIndex,
  });
}

/** 供 Web 端把本命、大运、流年统一接入八格动态信息。 */
export function getBaziRelationsByReference(chart, reference) {
  const nodes = getBaziNodeStates(chart);
  const normalizedReference = normalizeReference(chart, reference);
  const targetIndex = Number.isInteger(reference?.targetIndex) ? reference.targetIndex : null;
  return {
    target: targetIndex == null ? { meta: normalizedReference.source, char: normalizedReference.char, kind: normalizedReference.kind } : nodes[targetIndex],
    reference: { ...normalizedReference.stem, source: normalizedReference.source, key: normalizedReference.key, monthStatus: normalizedReference.monthStatus, monthGrowth: normalizedReference.monthGrowth, seatGrowth: normalizedReference.seatGrowth },
    relations: nodes.map((node, index) => {
      const isSelf = targetIndex === index;
      const seatBranchIndex = node.kind === "branch" ? node.branchIndex : node.seatBranchIndex;
      const nodeShenSha = shenShaForReference(normalizedReference.stem.index, normalizedReference.branch.index, seatBranchIndex);
      if (node.kind === "stem") {
        const relationTenGod = tenGod(normalizedReference.stem.index, node.stemIndex);
        return { ...node, isSelf, tenGod: relationTenGod, sixKin: isSelf ? "自身" : sixKin(relationTenGod, chart.input.sex), mainQiTenGod: null, mainQiSixKin: null, hiddenTenGods: [], relationGrowth: growthStage(normalizedReference.stem.index, seatBranchIndex), monthStatus: normalizedReference.monthStatus, monthGrowth: normalizedReference.monthGrowth, seatGrowth: growthStage(normalizedReference.stem.index, seatBranchIndex), shenSha: nodeShenSha };
      }
      const mainQiTenGod = tenGod(normalizedReference.stem.index, node.mainQi.index);
      return {
        ...node,
        isSelf,
        tenGod: null,
        mainQiTenGod,
        mainQiSixKin: isSelf ? "自身" : sixKin(mainQiTenGod, chart.input.sex),
        hiddenTenGods: node.hiddenStems.map((hidden) => { const hiddenTenGod = tenGod(normalizedReference.stem.index, hidden.index); return { name: hidden.name, element: hidden.element, weight: hidden.weight, tenGod: hiddenTenGod, sixKin: sixKin(hiddenTenGod, chart.input.sex) }; }),
        relationGrowth: growthStage(normalizedReference.stem.index, node.branchIndex),
        monthStatus: normalizedReference.monthStatus,
        monthGrowth: normalizedReference.monthGrowth,
        seatGrowth: growthStage(normalizedReference.stem.index, node.branchIndex),
        shenSha: nodeShenSha,
      };
    }),
  };
}

export function formatBaziText(result) {
  const p = result.fourPillars;
  return [
    "知命排盘 · 四柱命盘", "====================", `阳历：${result.time.standard}`, `真太阳时：${result.time.trueSolar}（校正 ${result.time.correctionMinutes} 分）`,
    `出生地：${result.input.location || "未指定"}  经度：${result.input.longitude}°`, `四柱：${p.text}`, `起运：${result.luck.startTime}（约 ${result.luck.startAge} 岁，${result.luck.direction}）`, `生肖：${result.profile.zodiac}  月令：${result.profile.monthCommand}  日主：${result.profile.dayMaster}`,
    "", "柱位  十神  天干  地支  藏干  纳音  十二长生  神煞", ...[p.year, p.month, p.day, p.hour].map((x) => `${x.label}  ${x.stem.tenGod.padEnd(3)} ${x.stem.name}${x.stem.element}   ${x.branch.name}${x.branch.element}   ${x.branch.hiddenStems.map((h) => h.name + h.tenGod).join("、")}  ${x.naYin}  ${x.growthStage}  ${x.shenSha.join("、") || "—"}`),
    "", `大运：${result.luck.cycles.map((x) => `${x.pillar}(${x.startAge}岁)`).join(" → ")}`, "", ...result.notices.map((notice) => `注：${notice}`),
  ].join("\n");
}
