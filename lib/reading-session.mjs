/**
 * 共用排盘会话应用层。
 *
 * 领域层只负责各自算法；本文件负责把一份 four-pillars 结果分发给
 * 八字展示、六壬和奇门，保证所有模块引用同一时间事实。
 */

import { calculateFourPillars } from "./four-pillars.mjs";
import { buildBaziChart } from "./chart-presentation.mjs";
import { buildSimpleChart } from "./simple-chart.mjs";

export function buildReadingSession(calculation, options = {}) {
  if (!calculation || calculation.module?.name !== "four-pillars") throw new TypeError("排盘会话必须接收 calculateFourPillars 的结果");
  const simple = buildSimpleChart(calculation, options);
  return {
    module: { name: "reading-session", version: "0.2.0", responsibility: "以简化排盘 JSON 为中间层组织详细 Web 排盘" },
    calculation,
    core: simple.core,
    simple,
    bazi: buildBaziChart(calculation),
    liuRen: simple.liuRen,
    qiMen: simple.qiMen,
  };
}

export function calculateReadingSession(input, config = {}, options = {}) {
  return buildReadingSession(calculateFourPillars(input, config), options);
}
