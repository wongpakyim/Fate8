# 简式排盘测试用例说明

## 1. 自动测试入口

```bash
# 生产构建 + 全部 Node 测试
npm test

# 只运行文本盘面测试
node --test tests/text-charts.test.mjs

# 静态代码检查
npm run lint
```

文本盘面的实际回归用例位于 `tests/text-charts.test.mjs`，基础术数数据用例位于 `tests/bazi.test.mjs`，API 和服务端页面用例位于 `tests/rendered-html.test.mjs`。

## 2. 固定测试输入

```json
{
  "solarTime": "1992-03-15 14:30",
  "longitude": 113.27,
  "timezoneOffset": 8,
  "sex": "male"
}
```

该输入的公共四柱预期为：`壬申 癸卯 庚寅 癸未`。所有六壬、奇门断言都从同一个 `calculateFourPillars` 结果继续计算，用于防止领域模块各自解释时间。

## 3. 文本盘面用例矩阵

| 编号 | 用例 | 关键断言 |
| --- | --- | --- |
| TXT-01 | CJK 等宽排版 | 网格每一行显示宽度相同；边框完整闭合 |
| LR-01 | 六壬四课 | 横向文字顺序是四课、三课、二课、一课，即第一课位于最右 |
| LR-02 | 六壬天盘 | 环式盘恰有 12 个上神和 12 个天将 |
| LR-03 | 六壬方位 | 上巳午未申、左辰卯、右酉戌、下寅丑子亥 |
| LR-04 | 六壬完整简排 | 同时包含三传、四课、天盘十二宫 |
| QM-01 | 奇门九宫第一行 | 巽四、离九、坤二 |
| QM-02 | 奇门九宫第二行 | 震三、中五、兑七 |
| QM-03 | 奇门九宫第三行 | 艮八、坎一、乾六 |
| QM-04 | 奇门宫内信息 | 八个外宫各有天盘长生和地盘长生 |
| CLI-01 | 六壬脚本文本 | 退出码为 0，输出含右起四课和天盘十二宫 |
| CLI-02 | 奇门脚本文本 | 退出码为 0，输出含完整九宫格 |

## 4. 手工验收命令

```bash
npm run bazi -- --mode liuren --datetime "1992-03-15 14:30" --longitude 113.27 --format text
npm run bazi -- --mode qimen --datetime "1992-03-15 14:30" --longitude 113.27 --format text
```

六壬验收时应看到：

1. “四课（第一课在最右，自右向左）”。
2. 一个中央留空、外围十二宫的天盘。
3. 每宫具有上神、天将和神煞，宫内不重复输出固定地盘。

奇门验收时应看到：

1. 清晰的三行三列边框。
2. 每个外宫具有八神、九星、八门、天盘干、地盘干及两层十二长生。
3. 中五宫显示地盘干和“天禽寄坤二”。

## 5. API 文本回归

开发服务启动后可检查：

```text
GET /api/liuren?solarTime=1992-03-15%2014:30&longitude=113.27&format=text
GET /api/qimen?solarTime=1992-03-15%2014:30&longitude=113.27&format=text
GET /api/simple?solarTime=1992-03-15%2014:30&longitude=113.27&format=text
```

`format=file` 应返回相同正文并附带文本下载文件名；不传 `format` 时应返回 JSON。
