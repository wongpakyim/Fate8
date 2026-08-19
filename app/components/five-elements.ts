const characterElements: Record<string, string> = {
  甲: "木", 乙: "木", 寅: "木", 卯: "木",
  丙: "火", 丁: "火", 巳: "火", 午: "火",
  戊: "土", 己: "土", 辰: "土", 戌: "土", 丑: "土", 未: "土",
  庚: "金", 辛: "金", 申: "金", 酉: "金",
  壬: "水", 癸: "水", 亥: "水", 子: "水",
};

const elementSlugs: Record<string, string> = { 木: "wood", 火: "fire", 土: "earth", 金: "metal", 水: "water" };

export function elementClass(value: string | undefined) {
  const element = value && (elementSlugs[value] ? value : characterElements[value]);
  return `element-${elementSlugs[element || "土"]}`;
}
