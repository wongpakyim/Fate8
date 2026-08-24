"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { analyzeUsefulGodNodes, expandHiddenStemPath, materializeHiddenStemPath } from "@/lib/bazi-node-rules.mjs";

type HiddenStem = { name: string; element: string; index: number; weight: number };
type BaziNode = {
  id: string;
  meta: string;
  char: string;
  kind: "stem" | "branch";
  element: string;
  stemIndex?: number;
  referenceStemIndex: number;
  hiddenStems?: HiddenStem[];
};
type NodePath = { nodes: [number, number, number]; edges: [[number, number], [number, number]]; color: string };
type HiddenChoice = { nodeIndex: number; char: string; element: string; stemIndex: number; originalBranch: string | null; weight: number };
type HiddenPath = { key: string; choices: HiddenChoice[]; display: string };

const nodeCoordinates = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]] as const;
const pathColors = ["#9b3a2d", "#315f50", "#987348", "#3e6670", "#64715a", "#8b5448", "#2f7370", "#756346", "#4f6b47", "#7e493d", "#477981", "#596b64", "#9a6538", "#3f6456", "#76535b", "#526b78"];

function buildNodePaths(): NodePath[] {
  const neighbors = nodeCoordinates.map(([x1, y1]) => nodeCoordinates.flatMap(([x2, y2], index) => Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1 ? [index] : []));
  const paths: Omit<NodePath, "color">[] = [];
  neighbors.forEach((adjacent, center) => {
    for (let left = 0; left < adjacent.length; left += 1) for (let right = left + 1; right < adjacent.length; right += 1) {
      paths.push({ nodes: [adjacent[left], center, adjacent[right]], edges: [[adjacent[left], center], [center, adjacent[right]]] });
    }
  });
  paths.sort((a, b) => a.nodes[0] - b.nodes[0] || a.nodes[1] - b.nodes[1] || a.nodes[2] - b.nodes[2]);
  return paths.map((path, index) => ({ ...path, color: pathColors[index] }));
}

const nodePaths = buildNodePaths();
const directedPathEntries = nodePaths.flatMap((path, index) => [
  { path, index, startIndex: path.nodes[0], nodes: path.nodes, key: `${index}-${path.nodes[0]}` },
  { path, index, startIndex: path.nodes[2], nodes: [path.nodes[2], path.nodes[1], path.nodes[0]] as [number, number, number], key: `${index}-${path.nodes[2]}` },
]);
const pathStartIndexes = [...new Set(directedPathEntries.map((entry) => entry.startIndex))].sort((a, b) => a - b);
const edgePathIndexes = new Map<string, number[]>();
nodePaths.forEach((path, pathIndex) => path.edges.forEach(([from, to]) => {
  const key = [from, to].sort((a, b) => a - b).join("-");
  edgePathIndexes.set(key, [...(edgePathIndexes.get(key) || []), pathIndex]);
}));

function pathSegmentStyle(from: number, to: number, pathIndex: number, color: string): CSSProperties {
  const [x1, y1] = nodeCoordinates[from], [x2, y2] = nodeCoordinates[to];
  const key = [from, to].sort((a, b) => a - b).join("-");
  const usages = edgePathIndexes.get(key) || [pathIndex];
  const offset = (usages.indexOf(pathIndex) - (usages.length - 1) / 2) * 4;
  if (y1 === y2) return { left: `${Math.min(x1, x2) * 25 + 12.5}%`, top: `calc(${y1 === 0 ? 25 : 75}% + ${offset}px)`, width: "25%", height: 3, background: color };
  return { left: `calc(${x1 * 25 + 12.5}% + ${offset}px)`, top: "25%", width: 3, height: "50%", background: color };
}

export function BaziNodePanel({ nodes, selectedPath, onSelectPath }: { nodes: BaziNode[]; selectedPath: number | null; onSelectPath: (index: number | null) => void }) {
  const [strength, setStrength] = useState<"strong" | "weak">("strong");
  const [expandedEntryKey, setExpandedEntryKey] = useState<string | null>(null);
  const [hiddenPath, setHiddenPath] = useState<HiddenPath | null>(null);
  const [usefulAnchor, setUsefulAnchor] = useState<number | null>(null);
  const dayMasterElement = nodes.find((node) => node.id === "day-stem")?.element || nodes[2]?.element;
  const effectiveNodes = useMemo(() => materializeHiddenStemPath(nodes, hiddenPath), [nodes, hiddenPath]);
  const baseAnalysis = useMemo(() => analyzeUsefulGodNodes(nodes, dayMasterElement, strength), [nodes, dayMasterElement, strength]);
  const effectiveAnalysis = useMemo(() => analyzeUsefulGodNodes(effectiveNodes, dayMasterElement, strength, usefulAnchor), [effectiveNodes, dayMasterElement, strength, usefulAnchor]);
  const activePathNodes = new Set(selectedPath == null ? [] : nodePaths[selectedPath].nodes);

  const resetDerivedSelection = () => {
    setHiddenPath(null);
    setUsefulAnchor(null);
  };
  const selectStrength = (next: "strong" | "weak") => {
    setStrength(next);
    setUsefulAnchor(null);
  };
  const togglePath = (index: number, entryKey: string | null = null) => {
    const closing = selectedPath === index && (entryKey == null || expandedEntryKey === entryKey);
    onSelectPath(closing ? null : index);
    setExpandedEntryKey(closing ? null : entryKey);
    resetDerivedSelection();
  };
  const selectHiddenPath = (index: number, entryKey: string, nextHiddenPath: HiddenPath) => {
    onSelectPath(index);
    setExpandedEntryKey(entryKey);
    setHiddenPath(nextHiddenPath);
    setUsefulAnchor(null);
  };
  const toggleUsefulAnchor = (index: number) => setUsefulAnchor(usefulAnchor === index ? null : index);

  return <section className="manhattan-panel" aria-label="八字正交相邻路径图">
    <header>
      <div><strong>八字节点</strong><span>2 × 4 正交网格 · 路径藏干展开 · 强弱用神</span></div>
      <label className="strength-control"><span>日干强弱</span><button type="button" role="switch" aria-checked={strength === "weak"} className={strength} onClick={() => selectStrength(strength === "strong" ? "weak" : "strong")}><i /><b>{strength === "strong" ? "强" : "弱"}</b></button><small>{strength === "strong" ? "喜克、泄、耗" : "喜生、扶"}</small></label>
    </header>
    <div className="manhattan-board">
      {nodePaths.flatMap((path, pathIndex) => path.edges.map(([from, to], edgeIndex) => <button type="button" className={`path-segment ${selectedPath === pathIndex ? "selected" : selectedPath != null ? "muted" : ""}`} style={pathSegmentStyle(from, to, pathIndex, path.color)} onClick={() => togglePath(pathIndex)} aria-label={`选择路径 ${path.nodes.map((index) => nodes[index].meta).join("-")}`} key={`${pathIndex}-${edgeIndex}`} />))}
      {effectiveNodes.map((node, index) => {
        const [x, y] = nodeCoordinates[index];
        const state = selectedPath != null && activePathNodes.has(index) ? "connected" : selectedPath != null ? "faded" : "";
        const analysis = effectiveAnalysis[index];
        return <button type="button" className={`bazi-node ${state} ${usefulAnchor === index ? "useful-anchor" : ""}`} style={{ gridColumn: x + 1, gridRow: y + 1 }} onClick={() => toggleUsefulAnchor(index)} aria-pressed={usefulAnchor === index} title={analysis.basis || "点击设为直接用神"} key={node.id}><small>{node.meta}</small><strong>{node.char}{node.originalBranch && <i>({node.originalBranch})</i>}</strong><span className={analysis.role ? "has-role" : ""}>{analysis.label}</span>{node.originalBranch && <em>{node.element} · 藏干{Math.round((node.hiddenWeight || 0) * 100)}%</em>}</button>;
      })}
    </div>
    <div className="path-combinations" aria-label="按起始节点排列的连续三节点组合">
      {pathStartIndexes.map((startIndex) => <section className="path-start-group" key={startIndex}>
        <header><strong>{nodes[startIndex].meta}{nodes[startIndex].char}</strong><span>起点</span></header>
        <div>{directedPathEntries.filter((entry) => entry.startIndex === startIndex).map(({ path, index, nodes: pathNodes, key }) => {
          const hasBranch = pathNodes.some((nodeIndex) => nodes[nodeIndex].kind === "branch");
          const isExpanded = selectedPath === index && expandedEntryKey === key;
          const secondaryPaths = hasBranch ? expandHiddenStemPath(nodes, pathNodes) as HiddenPath[] : [];
          return <article className={`path-entry ${isExpanded ? "expanded" : ""}`} key={key}>
            <button type="button" className={`primary-path-button ${selectedPath === index ? "selected" : ""}`} onClick={() => togglePath(index, key)} aria-expanded={hasBranch ? isExpanded : undefined} aria-pressed={selectedPath === index}><i style={{ background: path.color }} /><span>{pathNodes.map((nodeIndex) => `${nodes[nodeIndex].meta}${nodes[nodeIndex].char}`).join(" — ")}</span>{hasBranch && <small>{isExpanded ? "收起藏干" : "展开藏干"}</small>}</button>
            <div className="path-useful-tags">{pathNodes.map((nodeIndex) => baseAnalysis[nodeIndex].isStrengthUseful && hasBranch
              ? <button type="button" className="useful" onClick={() => togglePath(index, key)} aria-expanded={isExpanded} key={nodeIndex}>{nodes[nodeIndex].char}<b>{baseAnalysis[nodeIndex].label}</b></button>
              : <span className={baseAnalysis[nodeIndex].isStrengthUseful ? "useful" : ""} key={nodeIndex}>{nodes[nodeIndex].char}<b>{baseAnalysis[nodeIndex].label}</b></span>)}</div>
            {isExpanded && <div className="secondary-paths"><header><strong>藏干次级路径</strong><span>{secondaryPaths.length} 组</span></header><div>{secondaryPaths.map((secondary) => {
              const secondaryNodes = materializeHiddenStemPath(nodes, secondary);
              const secondaryAnalysis = analyzeUsefulGodNodes(secondaryNodes, dayMasterElement, strength);
              return <button type="button" className={hiddenPath?.key === secondary.key ? "selected" : ""} onClick={() => selectHiddenPath(index, key, secondary)} aria-pressed={hiddenPath?.key === secondary.key} key={secondary.key}><strong>{secondary.display}</strong><span>{pathNodes.map((nodeIndex) => secondaryAnalysis[nodeIndex].label).join(" · ")}</span></button>;
            })}</div></div>}
          </article>;
        })}</div>
      </section>)}
    </div>
    <footer><span><i className="legend-route" />点击主路径展开藏干</span><span><i className="legend-connected" />点节点设为用神锚点</span><span><b>规则</b> 泄用神为忌；克、泄、耗忌神者为制忌用神</span></footer>
  </section>;
}
