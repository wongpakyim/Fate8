/**
 * 向后兼容的组合入口。
 *
 * 新应用建议直接使用：
 * - four-pillars.mjs：四柱与起运时间
 * - chart-presentation.mjs：完整排盘展示
 * - liu-ren.mjs：接收同一四柱结果生成大六壬盘
 * - qi-men.mjs：接收同一四柱结果生成拆补法奇门盘
 */

import { calculateFourPillars, reverseSearchFourPillars } from "./four-pillars.mjs";
import { buildBaziChart } from "./chart-presentation.mjs";

export { DEFAULT_CONFIG, calculateFourPillars, constants, getAnnualPillar, parseSolarInput, reverseSearchFourPillars } from "./four-pillars.mjs";
export { buildBaziChart, formatBaziText, getBaziNodeRelations, getBaziNodeStates } from "./chart-presentation.mjs";
export { calculateLiuRen, formatLiuRenFourLessonsText, formatLiuRenHeavenPlateText, formatLiuRenText, MONTH_GENERALS } from "./liu-ren.mjs";
export { calculateQiMen, CHAI_BU_JU_TABLE, formatQiMenNineGridText, formatQiMenText, QIMEN_PALACES } from "./qi-men.mjs";
export { buildBranchShenSha, buildMetaphysicsCore, calculateMetaphysicsCore, deriveMonthGeneral, deriveQiMenCore, formatMetaphysicsCoreText, getTwelveGrowthStage } from "./metaphysics-core.mjs";
export { buildSimpleChart, formatSimpleChartText } from "./simple-chart.mjs";
export { buildReadingSession, calculateReadingSession } from "./reading-session.mjs";

export function calculateBazi(input, config = {}) {
  return buildBaziChart(calculateFourPillars(input, config));
}

export const reverseSearchBazi = reverseSearchFourPillars;
