const STEMS = [
  { name: "甲", element: "木", polarity: "阳" }, { name: "乙", element: "木", polarity: "阴" },
  { name: "丙", element: "火", polarity: "阳" }, { name: "丁", element: "火", polarity: "阴" },
  { name: "戊", element: "土", polarity: "阳" }, { name: "己", element: "土", polarity: "阴" },
  { name: "庚", element: "金", polarity: "阳" }, { name: "辛", element: "金", polarity: "阴" },
  { name: "壬", element: "水", polarity: "阳" }, { name: "癸", element: "水", polarity: "阴" },
];

const BRANCHES = [
  { name: "子", element: "水", zodiac: "鼠", hidden: [[9, 1]] },
  { name: "丑", element: "土", zodiac: "牛", hidden: [[5, .6], [9, .3], [7, .1]] },
  { name: "寅", element: "木", zodiac: "虎", hidden: [[0, .6], [2, .3], [4, .1]] },
  { name: "卯", element: "木", zodiac: "兔", hidden: [[1, 1]] },
  { name: "辰", element: "土", zodiac: "龙", hidden: [[4, .6], [1, .3], [9, .1]] },
  { name: "巳", element: "火", zodiac: "蛇", hidden: [[2, .6], [4, .3], [6, .1]] },
  { name: "午", element: "火", zodiac: "马", hidden: [[3, .7], [5, .3]] },
  { name: "未", element: "土", zodiac: "羊", hidden: [[5, .6], [3, .3], [1, .1]] },
  { name: "申", element: "金", zodiac: "猴", hidden: [[6, .6], [8, .3], [4, .1]] },
  { name: "酉", element: "金", zodiac: "鸡", hidden: [[7, 1]] },
  { name: "戌", element: "土", zodiac: "狗", hidden: [[4, .6], [7, .3], [3, .1]] },
  { name: "亥", element: "水", zodiac: "猪", hidden: [[8, .7], [0, .3]] },
];

const ELEMENTS = ["木", "火", "土", "金", "水"];
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
const NAYIN = ["海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木", "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "砂中金", "山下火", "平地木", "壁上土", "金箔金", "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"];
const GROWTH_STAGES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
const GROWTH_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const MONTH_NAMES = ["寅月", "卯月", "辰月", "巳月", "午月", "未月", "申月", "酉月", "戌月", "亥月", "子月", "丑月"];
const JIE_TERMS = [
  { name: "立春", longitude: 315, month: 2, day: 4 }, { name: "惊蛰", longitude: 345, month: 3, day: 6 },
  { name: "清明", longitude: 15, month: 4, day: 5 }, { name: "立夏", longitude: 45, month: 5, day: 6 },
  { name: "芒种", longitude: 75, month: 6, day: 6 }, { name: "小暑", longitude: 105, month: 7, day: 7 },
  { name: "立秋", longitude: 135, month: 8, day: 8 }, { name: "白露", longitude: 165, month: 9, day: 8 },
  { name: "寒露", longitude: 195, month: 10, day: 8 }, { name: "立冬", longitude: 225, month: 11, day: 7 },
  { name: "大雪", longitude: 255, month: 12, day: 7 }, { name: "小寒", longitude: 285, month: 1, day: 6 },
];
const ALL_TERMS = [
  { name:"小寒", longitude:285, month:1, day:6 }, { name:"大寒", longitude:300, month:1, day:20 },
  { name:"立春", longitude:315, month:2, day:4 }, { name:"雨水", longitude:330, month:2, day:19 },
  { name:"惊蛰", longitude:345, month:3, day:6 }, { name:"春分", longitude:0, month:3, day:20 },
  { name:"清明", longitude:15, month:4, day:5 }, { name:"谷雨", longitude:30, month:4, day:20 },
  { name:"立夏", longitude:45, month:5, day:6 }, { name:"小满", longitude:60, month:5, day:21 },
  { name:"芒种", longitude:75, month:6, day:6 }, { name:"夏至", longitude:90, month:6, day:21 },
  { name:"小暑", longitude:105, month:7, day:7 }, { name:"大暑", longitude:120, month:7, day:23 },
  { name:"立秋", longitude:135, month:8, day:8 }, { name:"处暑", longitude:150, month:8, day:23 },
  { name:"白露", longitude:165, month:9, day:8 }, { name:"秋分", longitude:180, month:9, day:23 },
  { name:"寒露", longitude:195, month:10, day:8 }, { name:"霜降", longitude:210, month:10, day:23 },
  { name:"立冬", longitude:225, month:11, day:7 }, { name:"小雪", longitude:240, month:11, day:22 },
  { name:"大雪", longitude:255, month:12, day:7 }, { name:"冬至", longitude:270, month:12, day:22 },
];

export const DEFAULT_CONFIG = Object.freeze({
  dayBoundary: 23,
  timezoneOffset: 8,
  solarTimeMode: "apparent",
  defaultLongitude: 120,
  calendar: "proleptic-gregorian",
  reverseSearch: { startYear: 1000, endYear: 2100, maxResults: 60 },
});

const mod = (value, base) => ((value % base) + base) % base;
const pad = (value, size = 2) => String(value).padStart(size, "0");
const rad = (degrees) => degrees * Math.PI / 180;
const normalize180 = (degrees) => mod(degrees + 180, 360) - 180;

function gregorianJdn(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function localToJd(parts, timezoneOffset) {
  const fraction = (parts.hour - timezoneOffset + parts.minute / 60 + (parts.second || 0) / 3600) / 24;
  return gregorianJdn(parts.year, parts.month, parts.day) - .5 + fraction;
}

function jdToLocalParts(jd, timezoneOffset) {
  const shifted = jd + .5 + timezoneOffset / 24;
  const z = Math.floor(shifted);
  const f = shifted - z;
  let a = z;
  const alpha = Math.floor((a - 1867216.25) / 36524.25);
  a = a + 1 + alpha - Math.floor(alpha / 4);
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const dayFloat = b - d - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayFloat);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const totalSeconds = Math.round((dayFloat - day) * 86400);
  const hour = Math.floor(totalSeconds / 3600) % 24;
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;
  return { year, month, day, hour, minute, second };
}

function addLocalDays(parts, days) {
  return jdToLocalParts(localToJd({ ...parts, hour: 12, minute: 0, second: 0 }, 0) + days, 0);
}

function formatParts(parts, seconds = false) {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}${seconds ? `:${pad(parts.second || 0)}` : ""}`;
}

export function parseSolarInput(value) {
  if (value && typeof value === "object" && Number.isInteger(value.year)) {
    const parts = { year: value.year, month: value.month, day: value.day, hour: value.hour || 0, minute: value.minute || 0, second: value.second || 0 };
    validateParts(parts);
    return parts;
  }
  if (typeof value !== "string") throw new TypeError("solarTime 必须是阳历字符串或日期对象");
  const normalized = value.trim().replace(/[年/.]/g, "-").replace(/[月]/g, "-").replace(/[日号]/g, " ").replace(/[时点]/g, ":").replace(/分/g, "").replace(/T/, " ").replace(/下午|晚上/g, " PM ").replace(/上午/g, " AM ");
  const match = normalized.match(/^(\d{1,4})-(\d{1,2})-(\d{1,2})(?:\s+(?:(AM|PM)\s*)?(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?)?\s*$/i);
  if (!match) throw new Error("无法识别时间，请使用 YYYY-MM-DD HH:mm 或“1992年3月15日 14:30”");
  let hour = Number(match[5] || 0);
  const marker = match[4]?.toUpperCase();
  if (marker === "PM" && hour < 12) hour += 12;
  if (marker === "AM" && hour === 12) hour = 0;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour, minute: Number(match[6] || 0), second: Number(match[7] || 0) };
  validateParts(parts);
  return parts;
}

function validateParts(parts) {
  if (parts.year < 1 || parts.year > 9999) throw new RangeError("年份范围为 1–9999");
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31 || parts.hour < 0 || parts.hour > 23 || parts.minute < 0 || parts.minute > 59) throw new RangeError("日期或时间超出有效范围");
  const roundTrip = jdToLocalParts(localToJd(parts, 0), 0);
  if (roundTrip.year !== parts.year || roundTrip.month !== parts.month || roundTrip.day !== parts.day) throw new RangeError("阳历日期不存在");
}

function solarLongitude(jd) {
  const t = (jd - 2451545.0) / 36525;
  const l0 = mod(280.46646 + 36000.76983 * t + .0003032 * t * t, 360);
  const m = mod(357.52911 + 35999.05029 * t - .0001537 * t * t, 360);
  const c = (1.914602 - .004817 * t - .000014 * t * t) * Math.sin(rad(m)) + (.019993 - .000101 * t) * Math.sin(rad(2 * m)) + .000289 * Math.sin(rad(3 * m));
  const omega = 125.04 - 1934.136 * t;
  return mod(l0 + c - .00569 - .00478 * Math.sin(rad(omega)), 360);
}

function termJd(year, term) {
  let jd = localToJd({ year, month: term.month, day: term.day, hour: 12, minute: 0, second: 0 }, 0);
  for (let i = 0; i < 8; i += 1) jd -= normalize180(solarLongitude(jd) - term.longitude) / .98564736;
  return jd;
}

function equationOfTimeMinutes(jd) {
  const t = (jd - 2451545.0) / 36525;
  const epsilon = rad(23.439291 - .0130042 * t);
  const l0 = rad(mod(280.46646 + 36000.76983 * t, 360));
  const e = .016708634 - .000042037 * t;
  const m = rad(mod(357.52911 + 35999.05029 * t, 360));
  const y = Math.tan(epsilon / 2) ** 2;
  const value = y * Math.sin(2 * l0) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l0) - .5 * y * y * Math.sin(4 * l0) - 1.25 * e * e * Math.sin(2 * m);
  return 4 * value * 180 / Math.PI;
}

function sexagenaryIndex(stem, branch) {
  for (let index = 0; index < 60; index += 1) if (index % 10 === stem && index % 12 === branch) return index;
  return -1;
}

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

function pillarDetails(index, dayStem, label) {
  const stemIndex = mod(index, 10), branchIndex = mod(index, 12);
  const stem = STEMS[stemIndex], branch = BRANCHES[branchIndex];
  const xun = Math.floor(mod(index, 60) / 10);
  const voidStart = mod(10 - 2 * xun, 12);
  const growthDirection = stemIndex % 2 === 0 ? 1 : -1;
  return {
    label, value: stem.name + branch.name, index: mod(index, 60),
    stem: { ...stem, index: stemIndex, tenGod: label === "日柱" ? "日主" : tenGod(dayStem, stemIndex) },
    branch: { name: branch.name, index: branchIndex, element: branch.element, zodiac: branch.zodiac,
      hiddenStems: branch.hidden.map(([hiddenIndex, weight]) => ({ ...STEMS[hiddenIndex], index: hiddenIndex, weight, tenGod: tenGod(dayStem, hiddenIndex) })) },
    naYin: NAYIN[Math.floor(mod(index, 60) / 2)],
    growthStage: GROWTH_STAGES[mod((branchIndex - GROWTH_START[dayStem]) * (dayStem % 2 === 0 ? 1 : -1), 12)],
    voidBranches: BRANCHES[voidStart].name + BRANCHES[mod(voidStart + 1, 12)].name,
  };
}

function getCycleContext(jd, standardYear) {
  const liChunThisYear = termJd(standardYear, JIE_TERMS[0]);
  const cycleYear = jd < liChunThisYear ? standardYear - 1 : standardYear;
  const boundaries = JIE_TERMS.map((term, order) => ({ ...term, order, jd: termJd(order === 11 ? cycleYear + 1 : cycleYear, term) }));
  boundaries.push({ ...JIE_TERMS[0], order: 12, jd: termJd(cycleYear + 1, JIE_TERMS[0]) });
  let monthOrder = 0;
  for (let i = 0; i < 12; i += 1) if (jd >= boundaries[i].jd && jd < boundaries[i + 1].jd) monthOrder = i;
  return { cycleYear, monthOrder, boundaries };
}

function nearestSolarTerms(jd, localYear, timezoneOffset) {
  const entries = [];
  for (let year = localYear - 1; year <= localYear + 1; year += 1) {
    for (const term of ALL_TERMS) entries.push({ name: term.name, jd: termJd(year, term) });
  }
  entries.sort((a, b) => a.jd - b.jd);
  const nextIndex = entries.findIndex((entry) => entry.jd > jd);
  const previous = entries[Math.max(0, nextIndex - 1)], next = entries[nextIndex];
  return {
    previous: { name: previous.name, time: formatParts(jdToLocalParts(previous.jd, timezoneOffset)), daysAway: Number((jd - previous.jd).toFixed(3)) },
    next: { name: next.name, time: formatParts(jdToLocalParts(next.jd, timezoneOffset)), daysAway: Number((next.jd - jd).toFixed(3)) },
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
  const favorable = strength === "偏强" ? [GENERATES[dm.element], CONTROLS[dm.element]] : [resourceElement, dm.element];
  return { scores, percentages, dayMaster: `${dm.name}${dm.element}`, strength, supportRatio: Number((support / total).toFixed(3)), favorableElements: favorable, note: "强弱与喜用为五行权重的基础判读，未替代格局、调候及流通的人工复核。" };
}

function luckCycles(sex, yearStem, monthIndex, jd, boundaries, directionOverride) {
  const forward = directionOverride === "forward" || (directionOverride !== "reverse" && ((sex === "male" && yearStem % 2 === 0) || (sex === "female" && yearStem % 2 === 1)));
  const relevant = forward ? boundaries.find((boundary) => boundary.jd > jd) : [...boundaries].reverse().find((boundary) => boundary.jd <= jd);
  const delta = Math.abs(relevant.jd - jd);
  const startAge = Number((delta / 3).toFixed(2));
  const birthYear = jdToLocalParts(jd, 0).year;
  const cycles = Array.from({ length: 8 }, (_, i) => {
    const index = mod(monthIndex + (forward ? i + 1 : -(i + 1)), 60);
    return { order: i + 1, pillar: STEMS[index % 10].name + BRANCHES[index % 12].name, startAge: Number((startAge + i * 10).toFixed(2)), startYear: Math.floor(birthYear + startAge + i * 10), naYin: NAYIN[Math.floor(index / 2)] };
  });
  return { direction: forward ? "顺排" : "逆排", startAge, basisTerm: relevant.name, cycles, note: "按三天折一年估算起运；精确交运时刻可在专业版加入时辰折算口径。" };
}

export function calculateBazi(input, overrideConfig = {}) {
  const suppliedConfig = Object.fromEntries(Object.entries(overrideConfig).filter(([, value]) => value !== undefined));
  const config = { ...DEFAULT_CONFIG, ...suppliedConfig, reverseSearch: { ...DEFAULT_CONFIG.reverseSearch, ...(overrideConfig.reverseSearch || {}) } };
  if (![23, 24].includes(config.dayBoundary)) throw new RangeError("dayBoundary 仅支持 23 或 24");
  const parts = parseSolarInput(input.solarTime ?? input.datetime ?? input.date ?? input);
  const timezoneOffset = Number(input.timezoneOffset ?? config.timezoneOffset);
  if (!Number.isFinite(timezoneOffset) || timezoneOffset < -14 || timezoneOffset > 14) throw new RangeError("时区偏移范围必须在 -14–14");
  const longitude = Number(input.longitude ?? config.defaultLongitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError("经度范围必须在 -180–180");
  const jd = localToJd(parts, timezoneOffset);
  const longitudeCorrection = (longitude - timezoneOffset * 15) * 4;
  const equationCorrection = config.solarTimeMode === "apparent" ? equationOfTimeMinutes(jd) : 0;
  const correctionMinutes = config.solarTimeMode === "none" ? 0 : longitudeCorrection + equationCorrection;
  const solarJd = jd + correctionMinutes / 1440;
  const solarParts = jdToLocalParts(solarJd, timezoneOffset);
  const cycle = getCycleContext(jd, parts.year);
  const yearIndex = mod(cycle.cycleYear - 4, 60);
  const yearStem = yearIndex % 10;
  const monthStem = mod((yearStem % 5) * 2 + 2 + cycle.monthOrder, 10);
  const monthBranch = mod(2 + cycle.monthOrder, 12);
  const monthIndex = sexagenaryIndex(monthStem, monthBranch);
  let dayParts = solarParts;
  if (config.dayBoundary === 23 && solarParts.hour >= 23) dayParts = addLocalDays(solarParts, 1);
  const dayIndex = mod(gregorianJdn(dayParts.year, dayParts.month, dayParts.day) + 49, 60);
  const dayStem = dayIndex % 10;
  const hourBranch = mod(Math.floor((solarParts.hour + 1) / 2), 12);
  const hourStem = mod((dayStem % 5) * 2 + hourBranch, 10);
  const hourIndex = sexagenaryIndex(hourStem, hourBranch);
  const pillars = [
    pillarDetails(yearIndex, dayStem, "年柱"), pillarDetails(monthIndex, dayStem, "月柱"),
    pillarDetails(dayIndex, dayStem, "日柱"), pillarDetails(hourIndex, dayStem, "时柱"),
  ];
  const terms = nearestSolarTerms(jd, parts.year, timezoneOffset);
  return {
    schemaVersion: "1.0.0",
    algorithm: { name: "ZiMing Four Pillars Core", version: "0.1.0", calendar: config.calendar, solarTerms: "Meeus/NOAA apparent-solar-longitude approximation", supportedYears: [1000, 2100] },
    input: { solarTime: formatParts(parts, true), sex: input.sex || "male", location: input.location || null, longitude, latitude: input.latitude ?? null, timezoneOffset },
    time: { standard: formatParts(parts, true), trueSolar: formatParts(solarParts, true), correctionMinutes: Number(correctionMinutes.toFixed(2)), longitudeCorrectionMinutes: Number(longitudeCorrection.toFixed(2)), equationOfTimeMinutes: Number(equationCorrection.toFixed(2)), solarTimeMode: config.solarTimeMode, dayBoundary: config.dayBoundary },
    fourPillars: { text: pillars.map((pillar) => pillar.value).join(" "), compact: pillars.map((pillar) => pillar.value).join(""), year: pillars[0], month: pillars[1], day: pillars[2], hour: pillars[3] },
    profile: { zodiac: pillars[0].branch.zodiac, monthCommand: MONTH_NAMES[cycle.monthOrder], dayMaster: STEMS[dayStem].name, elements: elementProfile(pillars, dayStem), relations: branchRelations(pillars), solarTerms: terms },
    luck: luckCycles(input.sex || "male", yearStem, monthIndex, jd, cycle.boundaries, input.luckDirection),
    notices: [
      `采用${config.dayBoundary}时换日；时柱按${config.solarTimeMode === "none" ? "标准时" : "真太阳时"}计算。`,
      "节气采用太阳视黄经数值近似；临近节气交接、换日或时辰边界时应以高精度天文历表复核。",
      parts.year < 1582 ? "输入日期按延伸公历（proleptic Gregorian）解释，不还原出生地当时实际使用的历史历法。" : null,
    ].filter(Boolean),
  };
}

function normalizePillars(value) {
  const text = Array.isArray(value) ? value.join("") : String(value || "").replace(/[\s,，/|]+/g, "");
  if (text.length !== 8) throw new Error("请提供完整八字，例如“壬申 癸卯 丁酉 丁未”");
  const parsed = [];
  for (let i = 0; i < 8; i += 2) {
    const stem = STEMS.findIndex((item) => item.name === text[i]);
    const branch = BRANCHES.findIndex((item) => item.name === text[i + 1]);
    const index = sexagenaryIndex(stem, branch);
    if (index < 0) throw new Error(`“${text.slice(i, i + 2)}”不是有效干支`);
    parsed.push({ stem, branch, index, text: text.slice(i, i + 2) });
  }
  return parsed;
}

export function reverseSearchBazi(pillarInput, options = {}) {
  const target = normalizePillars(pillarInput);
  const suppliedOptions = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  const config = { ...DEFAULT_CONFIG, ...suppliedOptions, reverseSearch: { ...DEFAULT_CONFIG.reverseSearch, ...(options.reverseSearch || {}) } };
  const startYear = Math.max(1000, Number(options.startYear ?? config.reverseSearch.startYear));
  const endYear = Math.min(2100, Number(options.endYear ?? config.reverseSearch.endYear));
  const maxResults = Number(options.maxResults ?? config.reverseSearch.maxResults);
  if (startYear > endYear) throw new RangeError("反查起始年份不能晚于结束年份");
  const expectedHourStem = mod((target[2].stem % 5) * 2 + target[3].branch, 10);
  if (expectedHourStem !== target[3].stem) return { query: target.map((x) => x.text).join(" "), range: [startYear, endYear], total: 0, matches: [], notice: "时柱天干与日干、时支的五鼠遁规则不相容。" };
  const monthOrder = mod(target[1].branch - 2, 12);
  const matches = [];
  for (let cycleYear = startYear - 1; cycleYear <= endYear; cycleYear += 1) {
    if (mod(cycleYear - 4, 60) !== target[0].index) continue;
    const expectedMonthStem = mod(((target[0].stem % 5) * 2 + 2 + monthOrder), 10);
    if (expectedMonthStem !== target[1].stem) continue;
    const startTerm = JIE_TERMS[monthOrder];
    const startJd = termJd(monthOrder === 11 ? cycleYear + 1 : cycleYear, startTerm);
    const nextOrder = monthOrder + 1;
    const endJd = nextOrder === 12 ? termJd(cycleYear + 1, JIE_TERMS[0]) : termJd(nextOrder === 11 ? cycleYear + 1 : cycleYear, JIE_TERMS[nextOrder]);
    const hour = target[3].branch === 0 ? (config.dayBoundary === 23 ? 23 : 0) : target[3].branch * 2;
    const firstLocal = jdToLocalParts(startJd, config.timezoneOffset);
    const lastLocal = jdToLocalParts(endJd, config.timezoneOffset);
    let cursor = gregorianJdn(firstLocal.year, firstLocal.month, firstLocal.day);
    const lastJdn = gregorianJdn(lastLocal.year, lastLocal.month, lastLocal.day);
    for (; cursor <= lastJdn; cursor += 1) {
      const local = jdToLocalParts(cursor - .5, 0);
      if (local.year < startYear || local.year > endYear) continue;
      const candidateText = `${pad(local.year, 4)}-${pad(local.month)}-${pad(local.day)} ${pad(hour)}:00`;
      const result = calculateBazi({ solarTime: candidateText, sex: options.sex || "male", longitude: options.longitude ?? config.defaultLongitude, timezoneOffset: options.timezoneOffset ?? config.timezoneOffset }, config);
      if (result.fourPillars.compact === target.map((x) => x.text).join("")) {
        matches.push({ solarTime: result.time.standard.slice(0, 16), trueSolarTime: result.time.trueSolar.slice(0, 16), fourPillars: result.fourPillars.text, cycleYear, month: MONTH_NAMES[monthOrder], longitude: result.input.longitude });
        if (matches.length >= maxResults) break;
      }
    }
    if (matches.length >= maxResults) break;
  }
  return { query: target.map((x) => x.text).join(" "), range: [startYear, endYear], total: matches.length, matches, notice: "每个时辰返回一个代表时刻；临近节气、换日和时辰边界需结合经度与出生地复核。" };
}

export function formatBaziText(result) {
  const p = result.fourPillars;
  const lines = [
    "知命排盘 · 四柱命盘", "====================", `阳历：${result.time.standard}`, `真太阳时：${result.time.trueSolar}（校正 ${result.time.correctionMinutes} 分）`,
    `出生地：${result.input.location || "未指定"}  经度：${result.input.longitude}°`, `四柱：${p.text}`, `生肖：${result.profile.zodiac}  月令：${result.profile.monthCommand}  日主：${result.profile.dayMaster}`,
    "", "柱位  十神  天干  地支  藏干  纳音  十二长生", ...[p.year, p.month, p.day, p.hour].map((x) => `${x.label}  ${x.stem.tenGod.padEnd(3)} ${x.stem.name}${x.stem.element}   ${x.branch.name}${x.branch.element}   ${x.branch.hiddenStems.map((h) => h.name + h.tenGod).join("、")}  ${x.naYin}  ${x.growthStage}`),
    "", `五行：${ELEMENTS.map((e) => `${e}${result.profile.elements.percentages[e]}%`).join("  ")}`, `日主：${result.profile.elements.strength}；基础喜用：${result.profile.elements.favorableElements.join("、")}`,
    `关系：${result.profile.relations.join("；")}`, `节气：前一节气 ${result.profile.solarTerms.previous.name} ${result.profile.solarTerms.previous.time}；后一节气 ${result.profile.solarTerms.next.name} ${result.profile.solarTerms.next.time}`,
    `起运：${result.luck.direction}，约 ${result.luck.startAge} 岁（据 ${result.luck.basisTerm}）`, `大运：${result.luck.cycles.map((x) => `${x.pillar}(${x.startAge}岁)`).join(" → ")}`,
    "", ...result.notices.map((notice) => `注：${notice}`),
  ];
  return lines.join("\n");
}

export const constants = { stems: STEMS, branches: BRANCHES, elements: ELEMENTS, jieTerms: JIE_TERMS };
