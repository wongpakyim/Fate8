# Fate8 · 知命排盘

[English](./README_EN.md) | 简体中文

![知命排盘](./public/og.png)

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13-315f50?style=flat-square)
![React](https://img.shields.io/badge/React-19-315f50?style=flat-square)
![Tests](https://img.shields.io/badge/tests-25%20passing-315f50?style=flat-square)
![Interface](https://img.shields.io/badge/Web%20%7C%20CLI%20%7C%20API-supported-987348?style=flat-square)

一个以统一历法核心为基础的传统术数排盘项目，提供八字、大六壬、拆补法奇门与八字反查。Web、CLI 和 HTTP API 使用同一份时间、节气及四柱计算结果，支持 JSON、格式化 TXT、文件下载和模块化 ESM 调用。

> 当前版本适合传统文化研究、程序集成与排盘界面原型验证。临近节气、换日或时辰边界，以及 1582 年以前的历史日期，请使用高精度历表并结合所采用门派口径复核。

## 功能概览

| 模块 | 能力 |
| --- | --- |
| 八字排盘 | 公历时间、中文时间字符串、行政区三级选择、直接经度、真太阳时、23/24 时换日 |
| 八字盘面 | 四柱、十神、六亲、藏干、纳音、空亡、十二长生、旺相休囚死、神煞、大运与流年 |
| 八字节点 | 8 个干支节点、正交相邻路径、三节点路径高亮、动态八字关系矩阵 |
| 八字反查 | 在公元 1000—2100 年间按四柱搜索阳历日期与标准时辰区间；固定记为“反排”、东经 120° |
| 大六壬 | 中气自动换月将、手动月将、十二宫天盘、天将、神煞、右起四课、三传 |
| 拆补奇门 | 节气定局、符头、三元三候、阴阳九局、旬首、值符值使、九宫、天地盘干长生 |
| 多种接入 | Web Tab、Node/ESM、CLI、HTTP API、JSON、TXT 与下载文件 |

Web 端采用新中式水墨青山主题，八字、反排、六壬和奇门分别位于独立 Tab。八字录入完成后可自动收起，也可点击“挂起”主动折叠；三个详细盘面均支持一键复制文字简排。

## 分层架构

```text
阳历时间 / 地点 / 配置
          │
          ▼
  four-pillars.mjs       公历、校时、四柱、起运
          │
          ▼
 metaphysics-core.mjs    节气、月将、九局、三元三候、符头、值符值使
          │
          ├───────────────┐
          ▼               ▼
    liu-ren.mjs       qi-men.mjs       独立领域模块
          └───────┬───────┘
                  ▼
     simple-chart.mjs                  稳定 JSON / TXT 交换层
          ┌───────┼─────────┐
          ▼       ▼         ▼
       Web UI    CLI      HTTP API
```

关键原则：时间只计算一次。六壬、奇门和八字展示层只消费 `four-pillars` 的结果，不各自重新解释阳历时间。

更完整的边界说明见 [架构文档](./docs/architecture.md)。

## 快速开始

### 环境要求

- Node.js `22.13.0` 或更高版本
- npm

### 安装与运行

```bash
git clone https://github.com/wongpakyim/Fate8.git
cd Fate8
npm install
npm run dev
```

打开 `http://localhost:3000`。

### 生产构建

```bash
npm run build
npm run start
```

## CLI / Scripts

### 完整简盘

```bash
# JSON 输出
npm run chart:simple -- --input examples/birth.json --format json

# 格式化文字盘：六壬环式天盘 + 四课，奇门九宫格
npm run chart:simple -- --input examples/birth.json --format text

# 写入文件
npm run chart:simple -- --input examples/birth.json --format text --out simple-chart.txt
```

### 分模块调用

```bash
# 只计算四柱与起运
npm run bazi -- --mode pillars --datetime "1992-03-15 14:30" --longitude 113.27

# 公共核心
npm run chart:core -- --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 大六壬：默认按中气自动换将
npm run bazi -- --mode liuren --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 大六壬：手动指定子将
npm run bazi -- --mode liuren --month-general 子 --input examples/birth.json --format text

# 拆补法奇门九宫
npm run bazi -- --mode qimen --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 八字反查
npm run bazi -- --reverse "壬申 癸卯 庚寅 癸未" --start 1000 --end 2100
```

反查不继承正排地点、经度或真太阳时设置，统一按“反排”、东经 120°、UTC+8 标准时返回匹配区间和一个可采用的代表时刻。

完整参数、标准输入和文件调用方法见 [简式排盘脚本说明](./docs/simple-chart-script-usage.md)。

## ESM 模块调用

```js
import { calculateFourPillars } from "./lib/four-pillars.mjs";
import { buildSimpleChart, formatSimpleChartText } from "./lib/simple-chart.mjs";
import { buildBaziChart } from "./lib/chart-presentation.mjs";

const calculation = calculateFourPillars({
  solarTime: "1992-03-15 14:30",
  longitude: 113.27,
  sex: "male",
});

const simple = buildSimpleChart(calculation);
const bazi = buildBaziChart(calculation);

console.log(calculation.fourPillars.text);
console.log(JSON.stringify(simple, null, 2));
console.log(formatSimpleChartText(simple));
console.log(bazi.luck.cycles);
```

## HTTP API

| 路径 | 返回内容 |
| --- | --- |
| `GET /api/pillars` | 四柱与起运时间 |
| `GET /api/core` | 公共节气、月将与奇门核心 |
| `GET /api/simple` | 可供其他应用继续消费的完整简盘 |
| `GET /api/bazi` | 八字详细盘 |
| `GET /api/liuren` | 大六壬盘 |
| `GET /api/qimen` | 拆补法奇门盘 |

示例：

```text
GET /api/simple?solarTime=1992-03-15%2014:30&longitude=113.27
GET /api/liuren?solarTime=1992-03-15%2014:30&longitude=113.27&format=text
GET /api/qimen?solarTime=1992-03-15%2014:30&longitude=113.27&format=file
```

- 不传 `format`：返回 JSON。
- `format=text`：返回 UTF-8 纯文本。
- `format=file`：返回可下载的 TXT 文件。
- 各接口也支持 POST JSON。

## 配置

默认配置位于 [`config/bazi.config.json`](./config/bazi.config.json)：

| 配置项 | 可选值 / 含义 |
| --- | --- |
| `dayBoundary` | `23` 子初换日；`24` 午夜换日 |
| `solarTimeMode` | `apparent` 真太阳时；`mean` 平太阳时；`none` 不校时 |
| `timezoneOffset` | 默认东八区 |
| `reverseSearch` | 反查年份范围与最大返回数 |
| `liuRen.monthGeneralMethod` | 默认 `middle-qi`，按中气换将 |
| `qiMen.method` | 默认 `chai-bu`，拆补法 |

## 测试

```bash
# 生产构建 + 全部自动测试
npm test

# 静态检查
npm run lint

# 只运行文字盘面测试
node --test tests/text-charts.test.mjs
```

当前覆盖四柱解析、换日边界、反查回环、模块分层、六壬月将与课传、奇门定局与宫位、CLI 文本盘、HTTP API 和服务端渲染。测试矩阵见 [简式排盘测试用例](./docs/simple-chart-test-cases.md)。

## 项目结构

```text
app/                    Web 页面、组件与 API 路由
config/                 排盘口径配置
data/                   中国行政区数据
docs/                   架构、脚本和测试说明
examples/               示例输入
lib/                    历法核心与领域模块
scripts/                CLI 入口
tests/                  Node 自动测试
public/                 水墨主题与站点资源
```

## 说明与限制

- 项目使用延伸公历与太阳视黄经近似算法。
- 临近节气、换日或时辰交界的结果需要复核。
- 1582 年以前按延伸公历解释，不还原出生地历史历法。
- 不同术数门派可能存在换日、月将、起局、寄宫和课传规则差异。
- 本项目用于传统文化研究与软件工程实践，不构成医疗、法律、投资或人生决策建议。

## License

当前仓库尚未附带开源许可证。未经项目所有者明确授权，不应假定代码可被复制、修改或重新发布。
