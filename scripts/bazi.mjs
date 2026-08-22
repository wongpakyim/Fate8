#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { calculateFourPillars, reverseSearchFourPillars } from "../lib/four-pillars.mjs";
import { buildBaziChart, formatBaziText } from "../lib/chart-presentation.mjs";
import { formatLiuRenText } from "../lib/liu-ren.mjs";
import { formatQiMenText } from "../lib/qi-men.mjs";
import { buildReadingSession } from "../lib/reading-session.mjs";
import { formatMetaphysicsCoreText } from "../lib/metaphysics-core.mjs";
import { buildSimpleChart, formatSimpleChartText } from "../lib/simple-chart.mjs";

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

六壬：
  npm run bazi -- --mode liuren --datetime "1992-03-15 14:30" --longitude 113.27
  npm run bazi -- --mode liuren --month-general 子 --format text --input ./birth.json

奇门：
  npm run bazi -- --mode qimen --datetime "1992-03-15 14:30" --longitude 113.27
  npm run bazi -- --mode qimen --format text --input ./birth.json

公共核心与简盘：
  npm run bazi -- --mode core --datetime "1992-03-15 14:30" --longitude 113.27
  npm run bazi -- --mode simple --format text --input ./birth.json

反查：
  npm run bazi -- --reverse "壬申 癸卯 庚寅 癸未" --start 1000 --end 2100
  固定按东经 120°、UTC+8 标准时查找时间区间，不读取地点和真太阳时参数

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
  --mode        pillars / core（公共核心）/ simple（简化全盘）/ chart（八字，默认）/ liuren / qimen / all
  --month-general  六壬手动月将：子/神后等；省略按中气自动换将
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
    payload = reverseSearchFourPillars(args.reverse, { dayBoundary: config.dayBoundary, startYear: Number(args.start ?? 1000), endYear: Number(args.end ?? 2100), maxResults: Number(args.limit ?? 60), sex: args.sex });
  } else {
    const supplied = fileInput && typeof fileInput === "object" ? fileInput : {};
    const positional = args._.join(" ").trim();
    const solarTime = typeof fileInput === "string" ? fileInput : (args.datetime ?? (positional || supplied.solarTime));
    const calculation = calculateFourPillars({ ...supplied, solarTime, longitude: Number(args.longitude ?? supplied.longitude ?? defaults.defaultLongitude), latitude: args.latitude ?? supplied.latitude, location: args.location ?? supplied.location, timezoneOffset: Number(args.timezone ?? supplied.timezoneOffset ?? defaults.timezoneOffset), sex: args.sex ?? supplied.sex ?? "male" }, config);
    const mode = String(args.mode || "chart");
    const simpleOptions = { liuRen: { monthGeneral: args["month-general"] ?? supplied.monthGeneral }, qiMen: { method: "chai-bu" } };
    let simple;
    const getSimple = () => simple ??= buildSimpleChart(calculation, simpleOptions);
    if (mode === "pillars") payload = calculation;
    else if (mode === "core") payload = getSimple().core;
    else if (mode === "simple") payload = getSimple();
    else if (mode === "liuren") payload = getSimple().liuRen;
    else if (mode === "qimen") payload = getSimple().qiMen;
    else if (mode === "all") {
      const session = buildReadingSession(calculation, simpleOptions);
      payload = { core: session.core, simple: session.simple, fourPillars: session.calculation, bazi: session.bazi, liuRen: session.liuRen, qiMen: session.qiMen };
    }
    else payload = buildBaziChart(calculation);
  }
  let output;
  if (String(args.format || "json") === "text" && !args.reverse) {
    const mode = String(args.mode || "chart");
    output = mode === "pillars" ? `四柱：${payload.fourPillars.text}\n起运：${payload.luckStart.startTime}\n方向：${payload.luckStart.direction}\n起运年龄：${payload.luckStart.startAge} 岁` : mode === "core" ? formatMetaphysicsCoreText(payload) : mode === "simple" ? formatSimpleChartText(payload) : mode === "liuren" ? formatLiuRenText(payload) : mode === "qimen" ? formatQiMenText(payload) : mode === "all" ? `${formatSimpleChartText(payload.simple)}\n\n${formatBaziText(payload.bazi)}` : formatBaziText(payload);
  } else output = JSON.stringify(payload, null, 2);
  if (args.out) writeFileSync(String(args.out), output + "\n", "utf8");
  else console.log(output);
} catch (error) {
  console.error(`排盘失败：${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
