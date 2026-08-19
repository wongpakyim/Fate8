# 知命排盘 · 八字模块初版

同一套 `lib/bazi.mjs` 历法核心同时服务 Web、HTTP API 和命令行脚本，适合作为更大应用的一层模块调用。支持阳历选择或中文/ISO 时间字符串、全国省/市/县三级出生地、手工经度、真太阳时、23/24 时换日、四柱详表、五行、干支关系、起运大运，以及公元 1000–2100 年八字反查。

## 本地运行

```bash
npm install
npm run dev
```

## CLI / Scripts

```bash
# JSON 输出到终端
npm run bazi -- --datetime "1992年3月15日 14:30" --longitude 113.27

# 读取 JSON 文件，文本写入文件
npm run bazi -- --input examples/birth.json --format text --out result.txt

# 八字反查
npm run bazi -- --reverse "壬申 癸卯 庚寅 癸未" --start 1000 --end 2100
```

直接嵌入 Node/ESM：

```js
import { calculateBazi, reverseSearchBazi } from "./lib/bazi.mjs";

const chart = calculateBazi({ solarTime: "1992-03-15 14:30", longitude: 113.27 });
const matches = reverseSearchBazi(chart.fourPillars.compact, { startYear: 1000, endYear: 2100 });
```

## HTTP API

- `GET /api/bazi?solarTime=1992-03-15%2014:30&longitude=113.27`
- `GET /api/bazi?...&format=text` 返回纯文本
- `GET /api/bazi?...&format=file` 返回可下载文本
- `POST /api/bazi` 接受 JSON；传 `{"action":"reverse","pillars":"壬申 癸卯 庚寅 癸未"}` 执行反查

## 配置

默认口径位于 `config/bazi.config.json`：

- `dayBoundary`: `23`（子初换日）或 `24`（午夜换日）
- `solarTimeMode`: `apparent`（含均时差）、`mean`（仅经度差）或 `none`（标准时）
- `timezoneOffset`: 默认东八区
- `reverseSearch`: 默认反查范围与返回条数

初版使用延伸公历和太阳视黄经近似。对于临近节气、换日、时辰边界的案例，或 1582 年以前的历史日期，应与高精度天文历表和所采用命理门派口径复核。
