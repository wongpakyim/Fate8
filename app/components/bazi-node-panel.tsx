import type { CSSProperties } from "react";

type BaziNode = { id: string; meta: string; char: string };
type NodePath = { nodes: [number, number, number]; edges: [[number, number], [number, number]]; color: string };

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
  { path, index, startIndex: path.nodes[0], nodes: path.nodes },
  { path, index, startIndex: path.nodes[2], nodes: [path.nodes[2], path.nodes[1], path.nodes[0]] as [number, number, number] },
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
  const activePathNodes = new Set(selectedPath == null ? [] : nodePaths[selectedPath].nodes);
  const togglePath = (index: number) => onSelectPath(selectedPath === index ? null : index);

  return <section className="manhattan-panel" aria-label="八字正交相邻路径图">
    <header><div><strong>八字节点</strong><span>2 × 4 正交网格 · 16 组路径 · 8 个起点双向排列</span></div><small>仅显示节点路径</small></header>
    <div className="manhattan-board">
      {nodePaths.flatMap((path, pathIndex) => path.edges.map(([from, to], edgeIndex) => <button type="button" className={`path-segment ${selectedPath === pathIndex ? "selected" : selectedPath != null ? "muted" : ""}`} style={pathSegmentStyle(from, to, pathIndex, path.color)} onClick={() => togglePath(pathIndex)} aria-label={`选择路径 ${path.nodes.map((index) => nodes[index].meta).join("-")}`} key={`${pathIndex}-${edgeIndex}`} />))}
      {nodes.map((node, index) => {
        const [x, y] = nodeCoordinates[index];
        const state = selectedPath != null && activePathNodes.has(index) ? "connected" : selectedPath != null ? "faded" : "";
        return <div className={`bazi-node ${state}`} style={{ gridColumn: x + 1, gridRow: y + 1 }} key={node.id}><small>{node.meta}</small><strong>{node.char}</strong></div>;
      })}
    </div>
    <div className="path-combinations" aria-label="按起始节点排列的连续三节点组合">
      {pathStartIndexes.map((startIndex) => <section className="path-start-group" key={startIndex}>
        <header><strong>{nodes[startIndex].meta}{nodes[startIndex].char}</strong><span>起点</span></header>
        <div>{directedPathEntries.filter((entry) => entry.startIndex === startIndex).map(({ path, index, nodes: pathNodes }) => <button type="button" className={selectedPath === index ? "selected" : ""} onClick={() => togglePath(index)} aria-pressed={selectedPath === index} key={`${index}-${startIndex}`}><i style={{ background: path.color }} /><span>{pathNodes.map((nodeIndex) => `${nodes[nodeIndex].meta}${nodes[nodeIndex].char}`).join(" — ")}</span></button>)}</div>
      </section>)}
    </div>
    <footer><span><i className="legend-route" />彩色辅助线均可点击</span><span><i className="legend-connected" />黑框内为三节点路径</span></footer>
  </section>;
}
