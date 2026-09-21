# 紫微斗数排盘口径

Fate8 `v0.2.0` 新增紫微斗数领域模块。它与八字、六壬、奇门共用 `calculateFourPillars` 的输入事实，不在紫微模块中重新解释出生地或时间。

## 时间与历法

- 输入日期和性别来自共用四柱结果。
- 安星采用共用层校正后的真太阳时 `calculation.time.trueSolar`。
- `23` 时换日映射为子初换日；`24` 时换日映射为午夜换日。
- 闰月规则为：初一至十五按前月，十六以后按后月。
- 年限、流年以农历正月初一为界，年龄按周岁显示。

## 门派与星曜分组

- 盘面框架采用三合派十二宫表达。
- 星曜位置调用 `iztro` 的中州派算法配置。
- JSON 内部仍以 `majorStars`、`minorStars`、`adjectiveStars` 保留主曜、辅煞与杂曜分组。
- Web 宫格不重复显示“甲级、乙级、丙级”标题；每颗星曜名称逐字竖写，各组星曜连续排开。
- 宫干支在宫格左上角上下排列，甲、乙、丙级星曜紧接其右侧依次向右布列。
- Web 盘面隐藏庙、旺、得、利、平、陷等亮度文字，底层 JSON 数据仍予保留。

星曜安置、亮度与四化数据均由中州派算法结果提供。

## 四化与三方四正

- 命四化取出生年干，红色显示。
- 限四化取所选大限干，绿色显示。
- 年四化取所选流年干，蓝色显示。
- 宫四化取所点击宫位天干，橙色显示。
- 四化标签显示在对应星曜下方；同一星曜可同时显示命、限、年、宫四种来源。
- 点击宫位后，同一三合局的另外两宫使用实线连接，正对宫使用虚线连接。
- 三方四正关系保存在领域 JSON 的 `palace.relations`，Web 只负责绘线。

## 模块边界

- `lib/zi-wei.mjs`：纯计算适配、序列化 JSON、大限/流年选择及 TXT 环盘。
- `app/components/zi-wei-panel.tsx`：紧凑十二宫界面、大限流年、四色四化与三方四正交互。
- `app/api/ziwei/route.ts`：JSON、TXT 和下载文件接口。
- `scripts/bazi.mjs --mode ziwei`：命令行简排。

Web 端按需加载紫微代码，只有进入“紫微”Tab 才计算十二宫，避免增加八字首页的初始包体和 CPU 消耗。

## 调用示例

```bash
npm run chart:ziwei -- --datetime "1992-03-15 14:30" --longitude 113.27 --sex male --format text
```

```js
import { calculateFourPillars } from "./lib/four-pillars.mjs";
import { calculateZiWei, formatZiWeiText } from "./lib/zi-wei.mjs";

const pillars = calculateFourPillars({
  solarTime: "1992-03-15 14:30",
  longitude: 113.27,
  sex: "male",
});
const chart = calculateZiWei(pillars, { referenceYear: 2026 });
console.log(formatZiWeiText(chart));
```
