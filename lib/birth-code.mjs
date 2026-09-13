import { parseSolarInput } from "./four-pillars.mjs";

function pad(value, width = 2) {
  return String(value).padStart(width, "0");
}

export function formatCurrentDateTime(timezoneOffset = 8, now = new Date()) {
  const offsetMilliseconds = Number(timezoneOffset) * 60 * 60 * 1000;
  return new Date(now.getTime() + offsetMilliseconds).toISOString().slice(0, 16);
}

export function shiftSolarDateTime(solarTime, hours) {
  const parts = parseSolarInput(solarTime);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0) + Number(hours) * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  if (year < 1000 || year > 2100) throw new RangeError("排盘年份范围为 1000–2100");
  return `${pad(year, 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

export function parseBirthCode(value) {
  const compact = String(value ?? "").trim().replace(/[\s+＋:：\-/.]/g, "");
  if (!/^[01]\d{12}$/.test(compact)) throw new Error("请输入 0 或 1 加 12 位阳历时间，例如 0201903010856");
  const sexCode = compact[0];
  const parts = {
    year: Number(compact.slice(1, 5)),
    month: Number(compact.slice(5, 7)),
    day: Number(compact.slice(7, 9)),
    hour: Number(compact.slice(9, 11)),
    minute: Number(compact.slice(11, 13)),
    second: 0,
  };
  if (parts.year < 1000 || parts.year > 2100) throw new RangeError("排盘年份范围为 1000–2100");
  parseSolarInput(parts);
  return {
    code: compact,
    sexCode,
    sex: sexCode === "0" ? "female" : "male",
    solarTime: `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:00`,
    parts,
  };
}

export function formatBirthCode(solarTime, sex = "male") {
  const parts = parseSolarInput(solarTime);
  const sexCode = sex === "female" || sex === "0" ? "0" : "1";
  return `${sexCode}${pad(parts.year, 4)}${pad(parts.month)}${pad(parts.day)}${pad(parts.hour)}${pad(parts.minute)}`;
}
