/**
 * 四柱与起运计算模块。
 *
 * 只负责历法事实：标准时/真太阳时、年/月/日/时四柱和起运时间。
 * 十神、藏干、纳音、十二长生、神煞与展示结构由 chart-presentation.mjs 负责。
 */

export const STEMS = [
  { name: "甲", element: "木", polarity: "阳" }, { name: "乙", element: "木", polarity: "阴" },
  { name: "丙", element: "火", polarity: "阳" }, { name: "丁", element: "火", polarity: "阴" },
  { name: "戊", element: "土", polarity: "阳" }, { name: "己", element: "土", polarity: "阴" },
  { name: "庚", element: "金", polarity: "阳" }, { name: "辛", element: "金", polarity: "阴" },
  { name: "壬", element: "水", polarity: "阳" }, { name: "癸", element: "水", polarity: "阴" },
];

export const BRANCHES = [
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

export const NAYIN = ["海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木", "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "砂中金", "山下火", "平地木", "壁上土", "金箔金", "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"];
export const ELEMENTS = ["木", "火", "土", "金", "水"];
export const MONTH_NAMES = ["寅月", "卯月", "辰月", "巳月", "午月", "未月", "申月", "酉月", "戌月", "亥月", "子月", "丑月"];
export const GROWTH_STAGES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
export const GROWTH_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

const JIE_TERMS = [
  { name: "立春", longitude: 315, month: 2, day: 4 }, { name: "惊蛰", longitude: 345, month: 3, day: 6 },
  { name: "清明", longitude: 15, month: 4, day: 5 }, { name: "立夏", longitude: 45, month: 5, day: 6 },
  { name: "芒种", longitude: 75, month: 6, day: 6 }, { name: "小暑", longitude: 105, month: 7, day: 7 },
  { name: "立秋", longitude: 135, month: 8, day: 8 }, { name: "白露", longitude: 165, month: 9, day: 8 },
  { name: "寒露", longitude: 195, month: 10, day: 8 }, { name: "立冬", longitude: 225, month: 11, day: 7 },
  { name: "大雪", longitude: 255, month: 12, day: 7 }, { name: "小寒", longitude: 285, month: 1, day: 6 },
];

export const MIDDLE_QI_TERMS = [
  { name: "大寒", longitude: 300, month: 1, day: 20 }, { name: "雨水", longitude: 330, month: 2, day: 19 },
  { name: "春分", longitude: 0, month: 3, day: 20 }, { name: "谷雨", longitude: 30, month: 4, day: 20 },
  { name: "小满", longitude: 60, month: 5, day: 21 }, { name: "夏至", longitude: 90, month: 6, day: 21 },
  { name: "大暑", longitude: 120, month: 7, day: 23 }, { name: "处暑", longitude: 150, month: 8, day: 23 },
  { name: "秋分", longitude: 180, month: 9, day: 23 }, { name: "霜降", longitude: 210, month: 10, day: 23 },
  { name: "小雪", longitude: 240, month: 11, day: 22 }, { name: "冬至", longitude: 270, month: 12, day: 22 },
];

export const SOLAR_TERMS = [...JIE_TERMS, ...MIDDLE_QI_TERMS].sort((a, b) => a.month - b.month || a.day - b.day);

export const DEFAULT_CONFIG = Object.freeze({
  dayBoundary: 23,
  timezoneOffset: 8,
  solarTimeMode: "apparent",
  defaultLongitude: 120,
  calendar: "proleptic-gregorian",
  reverseSearch: { startYear: 1000, endYear: 2100, maxResults: 60 },
});

export const REVERSE_SEARCH_BASIS = Object.freeze({
  location: "反排",
  longitude: 120,
  timezoneOffset: 8,
  solarTimeMode: "none",
  administrativeDivisions: Object.freeze({ province: "反排", prefecture: "反排", county: "反排" }),
});

export const mod = (value, base) => ((value % base) + base) % base;
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
  return { year, month, day, hour: Math.floor(totalSeconds / 3600) % 24, minute: Math.floor((totalSeconds % 3600) / 60), second: totalSeconds % 60 };
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

function getTermContext(value, timezoneOffset, terms, method) {
  const parts = parseSolarInput(value);
  const offset = Number(timezoneOffset);
  if (!Number.isFinite(offset) || offset < -14 || offset > 14) throw new RangeError("时区偏移范围必须在 -14–14");
  const jd = localToJd(parts, offset);
  const boundaries = [];
  for (let year = parts.year - 1; year <= parts.year + 1; year += 1) {
    for (const term of terms) boundaries.push({ ...term, year, jd: termJd(year, term) });
  }
  boundaries.sort((a, b) => a.jd - b.jd);
  const current = [...boundaries].reverse().find((term) => term.jd <= jd);
  const next = boundaries.find((term) => term.jd > jd);
  if (!current || !next) throw new Error("无法定位中气区间");
  const expose = (term) => ({ name: term.name, longitude: term.longitude, time: formatParts(jdToLocalParts(term.jd, offset), true), julianDay: Number(term.jd.toFixed(8)) });
  return { current: expose(current), next: expose(next), method };
}

/** 返回给定标准时所在的中气区间，供月将等上层模块复用。 */
export function getMiddleQiContext(value, timezoneOffset = 8) {
  return getTermContext(value, timezoneOffset, MIDDLE_QI_TERMS, "太阳视黄经中气交节点");
}

/** 返回给定标准时所在的二十四节气区间，供奇门等上层模块复用。 */
export function getSolarTermContext(value, timezoneOffset = 8) {
  return getTermContext(value, timezoneOffset, SOLAR_TERMS, "太阳视黄经二十四节气交节点");
}

function equationOfTimeMinutes(jd) {
  const t = (jd - 2451545.0) / 36525;
  const epsilon = rad(23.439291 - .0130042 * t);
  const l0 = rad(mod(280.46646 + 36000.76983 * t, 360));
  const e = .016708634 - .000042037 * t;
  const m = rad(mod(357.52911 + 35999.05029 * t, 360));
  const y = Math.tan(epsilon / 2) ** 2;
  return 4 * (y * Math.sin(2 * l0) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l0) - .5 * y * y * Math.sin(4 * l0) - 1.25 * e * e * Math.sin(2 * m)) * 180 / Math.PI;
}

function sexagenaryIndex(stem, branch) {
  for (let index = 0; index < 60; index += 1) if (index % 10 === stem && index % 12 === branch) return index;
  return -1;
}

function rawPillar(index, label) {
  const stemIndex = mod(index, 10), branchIndex = mod(index, 12);
  return { label, value: STEMS[stemIndex].name + BRANCHES[branchIndex].name, index: mod(index, 60), stem: { ...STEMS[stemIndex], index: stemIndex }, branch: { name: BRANCHES[branchIndex].name, element: BRANCHES[branchIndex].element, zodiac: BRANCHES[branchIndex].zodiac, index: branchIndex } };
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

function calculateLuckStart({ sex, yearStem, jd, boundaries, timezoneOffset, birthYear, directionOverride }) {
  const forward = directionOverride === "forward" || (directionOverride !== "reverse" && ((sex === "male" && yearStem % 2 === 0) || (sex === "female" && yearStem % 2 === 1)));
  const relevant = forward ? boundaries.find((boundary) => boundary.jd > jd) : [...boundaries].reverse().find((boundary) => boundary.jd <= jd);
  const deltaDays = Math.abs(relevant.jd - jd);
  const startAge = Number((deltaDays / 3).toFixed(2));
  const startJd = jd + startAge * 365.2422;
  return {
    direction: forward ? "顺排" : "逆排",
    startAge,
    startYear: Math.floor(birthYear + startAge),
    startTime: formatParts(jdToLocalParts(startJd, timezoneOffset), true),
    basisTerm: relevant.name,
    basisTermTime: formatParts(jdToLocalParts(relevant.jd, timezoneOffset), true),
    distanceDays: Number(deltaDays.toFixed(4)),
    method: "三天折一年",
    note: "起运时刻按节气间隔三天折一年换算，为统一模块口径的近似交运时刻。",
  };
}

export function calculateFourPillars(input, overrideConfig = {}) {
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
  const solarParts = jdToLocalParts(jd + correctionMinutes / 1440, timezoneOffset);
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
  const pillars = [rawPillar(yearIndex, "年柱"), rawPillar(monthIndex, "月柱"), rawPillar(dayIndex, "日柱"), rawPillar(hourIndex, "时柱")];
  const sex = input.sex || "male";
  const luckStart = calculateLuckStart({ sex, yearStem, jd, boundaries: cycle.boundaries, timezoneOffset, birthYear: parts.year, directionOverride: input.luckDirection });
  return {
    schemaVersion: "1.0.0",
    module: { name: "four-pillars", version: "0.2.0", responsibility: "四柱与起运时间计算" },
    algorithm: { calendar: config.calendar, solarTerms: "Meeus/NOAA apparent-solar-longitude approximation", supportedYears: [1000, 2100] },
    input: { solarTime: formatParts(parts, true), sex, location: input.location || null, longitude, latitude: input.latitude ?? null, timezoneOffset },
    time: { standard: formatParts(parts, true), trueSolar: formatParts(solarParts, true), correctionMinutes: Number(correctionMinutes.toFixed(2)), longitudeCorrectionMinutes: Number(longitudeCorrection.toFixed(2)), equationOfTimeMinutes: Number(equationCorrection.toFixed(2)), solarTimeMode: config.solarTimeMode, dayBoundary: config.dayBoundary },
    fourPillars: { text: pillars.map((pillar) => pillar.value).join(" "), compact: pillars.map((pillar) => pillar.value).join(""), year: pillars[0], month: pillars[1], day: pillars[2], hour: pillars[3] },
    luckStart,
    calendarContext: { cycleYear: cycle.cycleYear, monthOrder: cycle.monthOrder, monthName: MONTH_NAMES[cycle.monthOrder], monthIndex, birthYear: parts.year, dayStemIndex: dayStem },
    notices: [
      `采用${config.dayBoundary}时换日；时柱按${config.solarTimeMode === "none" ? "标准时" : "真太阳时"}计算。`,
      "节气采用太阳视黄经数值近似；临近节气交接、换日或时辰边界时应以高精度天文历表复核。",
      parts.year < 1582 ? "输入日期按延伸公历解释，不还原出生地当时实际使用的历史历法。" : null,
    ].filter(Boolean),
  };
}

function normalizePillars(value) {
  const text = Array.isArray(value) ? value.join("") : String(value || "").replace(/[\s,，/|]+/g, "");
  if (text.length !== 8) throw new Error("请提供完整八字，例如“壬申 癸卯 庚寅 癸未”");
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

export function reverseSearchFourPillars(pillarInput, options = {}) {
  const target = normalizePillars(pillarInput);
  const suppliedOptions = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  const config = { ...DEFAULT_CONFIG, ...suppliedOptions, ...REVERSE_SEARCH_BASIS, reverseSearch: { ...DEFAULT_CONFIG.reverseSearch, ...(options.reverseSearch || {}) } };
  const basis = { ...REVERSE_SEARCH_BASIS, dayBoundary: config.dayBoundary };
  const startYear = Math.max(1000, Number(options.startYear ?? config.reverseSearch.startYear));
  const endYear = Math.min(2100, Number(options.endYear ?? config.reverseSearch.endYear));
  const maxResults = Number(options.maxResults ?? config.reverseSearch.maxResults);
  if (startYear > endYear) throw new RangeError("反查起始年份不能晚于结束年份");
  const expectedHourStem = mod((target[2].stem % 5) * 2 + target[3].branch, 10);
  if (expectedHourStem !== target[3].stem) return { query: target.map((x) => x.text).join(" "), range: [startYear, endYear], basis, total: 0, matches: [], notice: "时柱天干与日干、时支的五鼠遁规则不相容。" };
  const monthOrder = mod(target[1].branch - 2, 12);
  const matches = [];
  for (let cycleYear = startYear - 1; cycleYear <= endYear; cycleYear += 1) {
    if (mod(cycleYear - 4, 60) !== target[0].index) continue;
    if (mod((target[0].stem % 5) * 2 + 2 + monthOrder, 10) !== target[1].stem) continue;
    const startJd = termJd(monthOrder === 11 ? cycleYear + 1 : cycleYear, JIE_TERMS[monthOrder]);
    const nextOrder = monthOrder + 1;
    const endJd = nextOrder === 12 ? termJd(cycleYear + 1, JIE_TERMS[0]) : termJd(nextOrder === 11 ? cycleYear + 1 : cycleYear, JIE_TERMS[nextOrder]);
    const hours = target[3].branch === 0 ? (config.dayBoundary === 23 ? [23] : [0, 23]) : [target[3].branch * 2];
    const firstLocal = jdToLocalParts(startJd, config.timezoneOffset), lastLocal = jdToLocalParts(endJd, config.timezoneOffset);
    for (let cursor = gregorianJdn(firstLocal.year, firstLocal.month, firstLocal.day), last = gregorianJdn(lastLocal.year, lastLocal.month, lastLocal.day); cursor <= last; cursor += 1) {
      const local = jdToLocalParts(cursor - .5, 0);
      if (local.year < startYear || local.year > endYear) continue;
      for (const hour of hours) {
        const candidateText = `${pad(local.year, 4)}-${pad(local.month)}-${pad(local.day)} ${pad(hour)}:00`;
        const result = calculateFourPillars({ solarTime: candidateText, sex: options.sex || "male", location: REVERSE_SEARCH_BASIS.location, longitude: REVERSE_SEARCH_BASIS.longitude, timezoneOffset: REVERSE_SEARCH_BASIS.timezoneOffset }, config);
        if (result.fourPillars.compact === target.map((x) => x.text).join("")) {
          const rangeStart = { ...local, hour: target[3].branch === 0 ? hour : hour - 1, minute: 0, second: 0 };
          let rangeEnd = { ...local, hour, minute: 59, second: 0 };
          if (target[3].branch === 0 && config.dayBoundary === 23) {
            const nextDay = addLocalDays(local, 1);
            rangeEnd = { ...nextDay, hour: 0, minute: 59, second: 0 };
          }
          matches.push({
            solarTime: result.time.standard.slice(0, 16),
            timeRange: `${formatParts(rangeStart)}—${formatParts(rangeEnd)}`,
            fourPillars: result.fourPillars.text,
            cycleYear,
            month: MONTH_NAMES[monthOrder],
            location: REVERSE_SEARCH_BASIS.location,
            longitude: REVERSE_SEARCH_BASIS.longitude,
            timezoneOffset: REVERSE_SEARCH_BASIS.timezoneOffset,
            solarTimeMode: REVERSE_SEARCH_BASIS.solarTimeMode,
            administrativeDivisions: REVERSE_SEARCH_BASIS.administrativeDivisions,
          });
          if (matches.length >= maxResults) break;
        }
      }
      if (matches.length >= maxResults) break;
    }
    if (matches.length >= maxResults) break;
  }
  return { query: target.map((x) => x.text).join(" "), range: [startYear, endYear], basis, total: matches.length, matches, notice: "反排固定按东经 120°、UTC+8 标准时计算，不使用出生地、地方时或真太阳时；每项返回匹配的标准时间区间及一个采用时刻。" };
}

export function getAnnualPillar(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new RangeError("流年年份范围为 1–9999");
  const index = mod(year - 4, 60);
  const stemIndex = index % 10;
  const branchIndex = index % 12;
  return { year, index, value: STEMS[stemIndex].name + BRANCHES[branchIndex].name, stem: { ...STEMS[stemIndex], index: stemIndex }, branch: { ...BRANCHES[branchIndex], index: branchIndex }, naYin: NAYIN[Math.floor(index / 2)] };
}

export const constants = { stems: STEMS, branches: BRANCHES, elements: ELEMENTS, naYin: NAYIN, growthStages: GROWTH_STAGES, monthNames: MONTH_NAMES, middleQiTerms: MIDDLE_QI_TERMS, solarTerms: SOLAR_TERMS };
