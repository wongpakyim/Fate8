/**
 * 八字节点路径的强弱用神与藏干展开规则。
 *
 * 本模块只消费节点的五行、地支藏干，不参与四柱历法计算。Web、脚本或后续
 * 断语模块都可以复用同一组“生扶克泄耗”与次级路径结果。
 */

const PRODUCES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const STRENGTH_USEFUL_RELATIONS = {
  strong: new Set(["克", "泄", "耗"]),
  weak: new Set(["生", "扶"]),
};

export function getFiveElementRelation(referenceElement, targetElement) {
  if (referenceElement === targetElement) return "扶";
  if (PRODUCES[targetElement] === referenceElement) return "生";
  if (CONTROLS[targetElement] === referenceElement) return "克";
  if (PRODUCES[referenceElement] === targetElement) return "泄";
  if (CONTROLS[referenceElement] === targetElement) return "耗";
  throw new RangeError(`无法识别五行关系：${referenceElement} → ${targetElement}`);
}

export function getStrengthUseInfo(dayMasterElement, targetElement, strength = "strong") {
  if (!STRENGTH_USEFUL_RELATIONS[strength]) throw new RangeError("身强弱只允许 strong 或 weak");
  const relation = getFiveElementRelation(dayMasterElement, targetElement);
  const isStrengthUseful = STRENGTH_USEFUL_RELATIONS[strength].has(relation);
  return {
    relation,
    isStrengthUseful,
    role: isStrengthUseful ? "强弱用神" : null,
    label: isStrengthUseful ? `${relation}-强弱用神` : relation,
  };
}

export function expandHiddenStemPath(nodes, pathNodeIndexes) {
  if (!Array.isArray(pathNodeIndexes) || pathNodeIndexes.length !== 3) throw new TypeError("藏干次级路径必须由三个节点组成");
  const choicesByNode = pathNodeIndexes.map((nodeIndex) => {
    const node = nodes[nodeIndex];
    if (!node) throw new RangeError(`节点序号不存在：${nodeIndex}`);
    if (node.kind !== "branch") {
      return [{ nodeIndex, char: node.char, element: node.element, stemIndex: node.stemIndex, originalBranch: null, weight: 1 }];
    }
    return node.hiddenStems.map((hidden) => ({
      nodeIndex,
      char: hidden.name,
      element: hidden.element,
      stemIndex: hidden.index,
      originalBranch: node.char,
      weight: hidden.weight,
    }));
  });

  return choicesByNode.reduce((paths, choices) => paths.flatMap((path) => choices.map((choice) => [...path, choice])), [[]]).map((choices) => ({
    key: choices.map((choice) => `${choice.nodeIndex}:${choice.char}`).join("|"),
    choices,
    display: choices.map((choice) => choice.originalBranch ? `${choice.char}(${choice.originalBranch})` : choice.char).join("-"),
  }));
}

export function materializeHiddenStemPath(nodes, hiddenPath = null) {
  const replacements = new Map((hiddenPath?.choices || []).map((choice) => [choice.nodeIndex, choice]));
  return nodes.map((node, index) => {
    const replacement = replacements.get(index);
    return {
      ...node,
      char: replacement?.char || node.char,
      element: replacement?.element || node.element,
      effectiveStemIndex: replacement?.stemIndex ?? node.referenceStemIndex,
      originalBranch: replacement?.originalBranch || null,
      hiddenWeight: replacement?.weight ?? null,
    };
  });
}

/**
 * 选中一个用神锚点后：
 * 1. 泄该用神者标为忌神；
 * 2. 对已得忌神作克、泄、耗者标为制忌用神。
 */
export function analyzeUsefulGodNodes(nodes, dayMasterElement, strength = "strong", anchorIndex = null) {
  const base = nodes.map((node) => getStrengthUseInfo(dayMasterElement, node.element, strength));
  if (anchorIndex == null) return base.map((item, index) => ({ ...item, index, basis: item.role ? `按日干${strength === "strong" ? "身强" : "身弱"}取用` : null }));
  if (!nodes[anchorIndex]) throw new RangeError(`用神锚点不存在：${anchorIndex}`);

  const anchorElement = nodes[anchorIndex].element;
  const tabooIndexes = new Set();
  nodes.forEach((node, index) => {
    if (index !== anchorIndex && getFiveElementRelation(anchorElement, node.element) === "泄") tabooIndexes.add(index);
  });

  const controllingUseful = new Map();
  for (const tabooIndex of tabooIndexes) {
    nodes.forEach((node, index) => {
      if (index === anchorIndex || tabooIndexes.has(index)) return;
      const relationToTaboo = getFiveElementRelation(nodes[tabooIndex].element, node.element);
      if (["克", "泄", "耗"].includes(relationToTaboo) && !controllingUseful.has(index)) {
        controllingUseful.set(index, { tabooIndex, relationToTaboo });
      }
    });
  }

  return base.map((item, index) => {
    let role = item.role;
    let basis = role ? `按日干${strength === "strong" ? "身强" : "身弱"}取用` : null;
    if (index === anchorIndex) {
      role = item.isStrengthUseful ? "强弱用神" : "直接用神";
      basis = "当前用神锚点";
    } else if (tabooIndexes.has(index)) {
      role = "忌神";
      basis = `泄${nodes[anchorIndex].char}用神`;
    } else if (controllingUseful.has(index)) {
      const derived = controllingUseful.get(index);
      role = "制忌用神";
      basis = `${derived.relationToTaboo}${nodes[derived.tabooIndex].char}忌神`;
    }
    return { ...item, index, role, basis, label: role ? `${item.relation}-${role}` : item.relation };
  });
}
