#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { calculateBazi, formatBaziText, reverseSearchBazi } from "../lib/bazi.mjs";

const defaults = JSON.parse(readFileSync(new URL("../config/bazi.config.json", import.meta.url), "utf8"));

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) args._.push(token);
    else {
      const [rawKey, inlineValue] = token.slice(2).split("=", 2);
      const next = inlineValue ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true);
      args[rawKey] = next;
    }
  }
  return args;
}

function help() {
  return `知命排盘 CLI 0.1.0

排盘：
  npm run bazi -- --datetime "1992-03-15 14:30" --longitude 113.27 --sex male
  npm run bazi -- --input ./birth.json --format text --out ./result.txt

反查：
  npm run bazi -- --reverse "壬申 癸卯 庚寅 癸未" --start 1000 --end 2100

参数：
  --datetime    阳历字符串（也可直接作为位置参数）
  --input       JSON 或纯文本输入文件
  --stdin       从标准输入读取 JSON 或纯文本
  --longitude   经度（东经为正）
  --latitude    纬度（可选）
  --location    地名（可选）
  --timezone    时区偏移，默认 +8
  --boundary    23 或 24 时换日
  --solar-time  apparent / mean / none
  --format      json / text，默认 json
  --out         写入文件；省略则输出到终端
  --help        显示帮助`;
}

function parseMaybeJson(text) {
  try { return JSON.parse(text); } catch { return text.trim(); }
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(help());
  process.exit(0);
}

try {
  let fileInput = null;
  if (args.input) fileInput = parseMaybeJson(readFileSync(String(args.input), "utf8"));
  if (args.stdin) fileInput = parseMaybeJson(readFileSync(0, "utf8"));
  const config = {
    ...defaults,
    dayBoundary: Number(args.boundary ?? defaults.dayBoundary),
    timezoneOffset: Number(args.timezone ?? defaults.timezoneOffset),
    solarTimeMode: String(args["solar-time"] ?? defaults.solarTimeMode),
  };
  let payload;
  if (args.reverse) {
    payload = reverseSearchBazi(args.reverse, { ...config, startYear: Number(args.start ?? 1000), endYear: Number(args.end ?? 2100), maxResults: Number(args.limit ?? 60), longitude: Number(args.longitude ?? defaults.defaultLongitude), sex: args.sex });
  } else {
    const supplied = fileInput && typeof fileInput === "object" ? fileInput : {};
    const positional = args._.join(" ").trim();
    const solarTime = typeof fileInput === "string" ? fileInput : (args.datetime ?? (positional || supplied.solarTime));
    payload = calculateBazi({ ...supplied, solarTime, longitude: Number(args.longitude ?? supplied.longitude ?? defaults.defaultLongitude), latitude: args.latitude ?? supplied.latitude, location: args.location ?? supplied.location, timezoneOffset: Number(args.timezone ?? supplied.timezoneOffset ?? defaults.timezoneOffset), sex: args.sex ?? supplied.sex ?? "male" }, config);
  }
  const output = String(args.format || "json") === "text" && !args.reverse ? formatBaziText(payload) : JSON.stringify(payload, null, 2);
  if (args.out) writeFileSync(String(args.out), output + "\n", "utf8");
  else console.log(output);
} catch (error) {
  console.error(`排盘失败：${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
