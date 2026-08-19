# 简式排盘脚本调用说明

简式排盘脚本入口是 `scripts/bazi.mjs`。它与 Web、HTTP API 共用 `four-pillars`、`metaphysics-core`、`liu-ren` 和 `qi-men`，不会单独计算另一套时间或四柱。

## 1. 最常用调用

```bash
# 完整简盘 JSON：公共核心 + 六壬 + 奇门
npm run chart:simple -- --input examples/birth.json --format json

# 完整简盘 TXT：包含六壬十二宫天盘、四课和奇门九宫格
npm run chart:simple -- --input examples/birth.json --format text

# 文本写入文件
npm run chart:simple -- --input examples/birth.json --format text --out simple-chart.txt
```

## 2. 分模块输出

```bash
# 只取四柱和起运时间
npm run bazi -- --mode pillars --datetime "1992-03-15 14:30" --longitude 113.27

# 公共核心：节气、月将、奇门局数、符头、值符值使等
npm run chart:core -- --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 大六壬 JSON
npm run bazi -- --mode liuren --datetime "1992-03-15 14:30" --longitude 113.27

# 大六壬 TXT；默认中气换将
npm run bazi -- --mode liuren --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 大六壬手动指定子将
npm run bazi -- --mode liuren --month-general 子 --input examples/birth.json --format text

# 拆补法奇门九宫 TXT
npm run bazi -- --mode qimen --datetime "1992-03-15 14:30" --longitude 113.27 --format text

# 全部领域对象：四柱、八字、六壬、奇门
npm run bazi -- --mode all --input examples/birth.json --format json
```

## 3. 输入形式

### 命令行参数

```bash
npm run bazi -- --datetime "1992年3月15日 14:30" --longitude 113.27 --latitude 23.13 --sex male
```

### JSON 文件

```json
{
  "solarTime": "1992-03-15 14:30",
  "sex": "male",
  "location": "广东省 广州市 越秀区",
  "longitude": 113.27,
  "latitude": 23.13,
  "timezoneOffset": 8
}
```

```bash
npm run chart:simple -- --input examples/birth.json --format json
```

### 标准输入

PowerShell：

```powershell
Get-Content -Raw examples\birth.json | npm run chart:simple -- --stdin --format text
```

## 4. 关键参数

| 参数 | 说明 |
| --- | --- |
| `--mode` | `pillars`、`core`、`simple`、`chart`、`liuren`、`qimen`、`all` |
| `--format` | `json` 或 `text` |
| `--out` | 把结果写入指定文件 |
| `--boundary` | `23` 为子初换日，`24` 为午夜换日 |
| `--solar-time` | `apparent` 真太阳时、`mean` 平太阳时、`none` 不校时 |
| `--month-general` | 六壬手动月将，可传 `子` 或 `神后`；省略时按中气自动换将 |
| `--timezone` | 时区偏移，默认 `8` |

## 5. ESM 模块调用

```js
import { calculateFourPillars } from "./lib/four-pillars.mjs";
import { buildSimpleChart, formatSimpleChartText } from "./lib/simple-chart.mjs";
import { formatLiuRenText } from "./lib/liu-ren.mjs";
import { formatQiMenText } from "./lib/qi-men.mjs";

const pillars = calculateFourPillars({
  solarTime: "1992-03-15 14:30",
  longitude: 113.27,
});

const simple = buildSimpleChart(pillars);

console.log(JSON.stringify(simple, null, 2));
console.log(formatSimpleChartText(simple));
console.log(formatLiuRenText(simple.liuRen));
console.log(formatQiMenText(simple.qiMen));
```

## 6. TXT 输出结构

- 六壬：共用时间、四柱、月将、占时、课式、三传、右起四课、环式天盘十二宫。
- 奇门：共用时间、四柱、节气、局数、符头、旬首、值符值使，以及巽离坤／震中兑／艮坎乾九宫格。
- 四维宫长生使用顿号合并两个地支状态；寄宫或双天盘干使用斜线分组。

TXT 适合终端查看、复制和文件存档；程序间稳定交换应优先使用 JSON。

## 7. 六壬文本编排约定

六壬式盘采用“巳午未申／辰—酉／卯—戌／寅丑子亥”的固定方位，格内只写移动的天盘上神、天将和神煞；固定地盘只存在于方位说明中，不在每宫重复。四课按古籍阅读习惯把第一课放在最右，向左依次为二、三、四课。

参考资料：

- [大六壬起课步骤与传统天盘式](https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=805)
- [大六壬盘的基本组成与四课顺序](https://zh.wikipedia.org/wiki/%E5%A4%A7%E5%85%AD%E5%A3%AC)
