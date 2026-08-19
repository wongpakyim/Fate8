/**
 * 简化排盘应用层。
 *
 * 输出没有任何 HTML/CSS 假设的 JSON，可直接序列化、写文件、供 API 返回，
 * 也可由 Web 详细排盘继续消费。TXT 格式仅是同一 JSON 的等宽文字视图。
 */

import { buildMetaphysicsCore, formatMetaphysicsCoreText } from "./metaphysics-core.mjs";
import { calculateLiuRen, formatLiuRenText } from "./liu-ren.mjs";
import { calculateQiMen, formatQiMenText } from "./qi-men.mjs";

export function buildSimpleChart(calculation, options = {}) {
  if (!calculation || calculation.module?.name !== "four-pillars") throw new TypeError("简化排盘必须接收 calculateFourPillars 的结果");
  const core = options.core ?? buildMetaphysicsCore(calculation, {
    monthGeneral: options.liuRen?.monthGeneral,
    qiMen: options.qiMen,
  });
  const liuRen = calculateLiuRen(calculation, { ...options.liuRen, core });
  const qiMen = calculateQiMen(calculation, { ...options.qiMen, core });
  return {
    schemaVersion: "1.0.0",
    module: { name: "simple-chart", version: "0.1.0", responsibility: "生成可序列化的四柱、六壬、奇门简化排盘 JSON/TXT" },
    core,
    pillars: {
      standardTime: calculation.time.standard,
      trueSolarTime: calculation.time.trueSolar,
      fourPillars: calculation.fourPillars,
      luckStart: calculation.luckStart,
    },
    liuRen,
    qiMen,
  };
}

export function formatSimpleChartText(result, section = "all") {
  if (result?.module?.name !== "simple-chart") throw new TypeError("文字排盘需要 simple-chart JSON 结果");
  if (section === "core") return formatMetaphysicsCoreText(result.core);
  if (section === "liuren") return formatLiuRenText(result.liuRen);
  if (section === "qimen") return formatQiMenText(result.qiMen);
  return [formatMetaphysicsCoreText(result.core), formatLiuRenText(result.liuRen), formatQiMenText(result.qiMen)].join("\n\n");
}
