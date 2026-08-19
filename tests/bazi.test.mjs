import assert from "node:assert/strict";
import test from "node:test";
import { calculateBazi, formatBaziText, parseSolarInput, reverseSearchBazi } from "../lib/bazi.mjs";

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
  assert.equal(reverse.matches[0].fourPillars, result.fourPillars.text);
});

test("produces a human-readable text report", () => {
  const result = calculateBazi({ solarTime: "1992年3月15日 14:30", longitude: 113.27, location: "广州" });
  const report = formatBaziText(result);
  assert.match(report, /四柱：壬申 癸卯 庚寅 癸未/);
  assert.match(report, /真太阳时/);
  assert.match(report, /大运：/);
});
