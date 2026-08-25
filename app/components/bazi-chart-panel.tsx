"use client";

import { useMemo, useState } from "react";
import { getAnnualPillar } from "@/lib/four-pillars.mjs";
import { buildBaziChart, formatBaziText, getBaziFocusView, getDefaultLuckSelection } from "@/lib/chart-presentation.mjs";
import { elementClass } from "./five-elements";

type BaziResult = ReturnType<typeof buildBaziChart>;
type FocusKind = "stem" | "branch";
type FocusSelection =
  | { scope: "natal"; pillarIndex: number; kind: FocusKind }
  | { scope: "hidden"; pillarIndex: number; hiddenIndex: number }
  | { scope: "luck"; cycleIndex: number; kind: FocusKind }
  | { scope: "annual"; cycleIndex: number; year: number; kind: FocusKind };

const pillarLabels = ["年柱", "月柱", "日柱", "时柱"];

export function BaziChartPanel({ result, copied, onCopy, onDownload }: {
  result: BaziResult;
  copied: boolean;
  onCopy: (text: string) => void;
  onDownload: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const defaultLuck = useMemo(() => getDefaultLuckSelection(result, currentYear), [result, currentYear]);
  const [selectedLuck, setSelectedLuck] = useState(defaultLuck.cycleIndex);
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(defaultLuck.year);
  const [focus, setFocus] = useState<FocusSelection>({ scope: "natal", pillarIndex: 2, kind: "stem" });
  const natalPillars = useMemo(() => [result.fourPillars.year, result.fourPillars.month, result.fourPillars.day, result.fourPillars.hour], [result]);
  const selectedCycle = result.luck.cycles[selectedLuck];
  const annualPillars = useMemo(() => Array.from({ length: 10 }, (_, offset) => {
    const annual = getAnnualPillar(selectedCycle.startYear + offset);
    return { ...annual, label: "流年", age: Number((selectedCycle.startAge + offset).toFixed(2)) };
  }), [selectedCycle]);

  const focusReference = useMemo(() => {
    let pillar;
    let source;
    let key;
    let targetIndex;
    if (focus.scope === "hidden") {
      const pillar = natalPillars[focus.pillarIndex];
      const hidden = pillar.branch.hiddenStems[focus.hiddenIndex];
      return { key: `hidden-${focus.pillarIndex}-${focus.hiddenIndex}`, kind: "stem", source: `${pillarLabels[focus.pillarIndex]}${pillar.branch.name}藏干${hidden.name}`, char: hidden.name, stemIndex: hidden.index, branchIndex: pillar.branch.index };
    }

    if (focus.scope === "natal") {
      pillar = natalPillars[focus.pillarIndex];
      source = `${pillarLabels[focus.pillarIndex]}${focus.kind === "stem" ? "天干" : "地支"}`;
      key = `natal-${focus.pillarIndex}-${focus.kind}`;
      targetIndex = focus.kind === "stem" ? focus.pillarIndex : focus.pillarIndex + 4;
    } else if (focus.scope === "luck") {
      pillar = result.luck.cycles[focus.cycleIndex];
      source = `${pillar.startYear}年起${pillar.pillar}大运${focus.kind === "stem" ? "天干" : "地支"}`;
      key = `luck-${focus.cycleIndex}-${focus.kind}`;
    } else {
      pillar = getAnnualPillar(focus.year);
      source = `${focus.year}流年${focus.kind === "stem" ? "天干" : "地支"}`;
      key = `annual-${focus.year}-${focus.kind}`;
    }
    const stemIndex = Number.isInteger(pillar.stem?.index) ? pillar.stem.index : pillar.index % 10;
    const branchIndex = Number.isInteger(pillar.branch?.index) ? pillar.branch.index : pillar.index % 12;
    return { key, kind: focus.kind, source, char: focus.kind === "stem" ? pillar.stem.name : pillar.branch.name, stemIndex, branchIndex, targetIndex };
  }, [focus, natalPillars, result.luck.cycles]);

  const natalView = getBaziFocusView(result, focusReference);
  const luckView = getBaziFocusView(result, focusReference, result.luck.cycles).pillars;
  const annualView = getBaziFocusView(result, focusReference, annualPillars).pillars;

  function chooseCycle(cycleIndex: number) {
    const cycle = result.luck.cycles[cycleIndex];
    const preferredYear = currentYear >= cycle.startYear && currentYear <= cycle.startYear + 9 ? currentYear : cycle.startYear;
    setSelectedLuck(cycleIndex);
    setSelectedAnnualYear(preferredYear);
  }

  function chooseFocus(selection: FocusSelection) {
    if (selection.scope === "luck") chooseCycle(selection.cycleIndex);
    if (selection.scope === "annual") {
      setSelectedLuck(selection.cycleIndex);
      setSelectedAnnualYear(selection.year);
    }
    setFocus(selection);
  }

  function resetDayMaster() {
    setFocus({ scope: "natal", pillarIndex: 2, kind: "stem" });
  }

  return <article className="chart-card bazi-interactive-chart" aria-live="polite">
    <div className="chart-head">
      <div><span className="step">02</span><h2>四柱命盘</h2><span className="chart-code">{result.fourPillars.compact}</span></div>
      <div className="chart-actions"><button type="button" onClick={() => onCopy(formatBaziText(result))}>{copied ? "盘面信息已复制" : "复制文字简排"}</button><button type="button" onClick={onDownload}>下载</button></div>
    </div>
    <div className="profile-strip">
      <div><small>命造</small><strong>{result.input.sex === "female" ? "坤造" : "乾造"}</strong></div>
      <div><small>公历标准时</small><strong>{result.time.standard.slice(0, 16)}</strong></div>
      <div><small>真太阳时</small><strong>{result.time.trueSolar.slice(0, 16)}</strong></div>
      <div><small>生肖</small><strong>{result.profile.zodiac}</strong></div>
    </div>
    <div className="time-note"><span>校时 {result.time.correctionMinutes > 0 ? "+" : ""}{result.time.correctionMinutes} 分</span><span>{result.input.location || "手工经度"}</span><span>经度 {result.input.longitude.toFixed(3)}°</span><span>{result.profile.monthCommand}</span></div>

    <section className="bazi-focus-summary">
      <div><small>当前计算点</small><strong className={elementClass(natalView.reference.stem.element)}>{natalView.reference.char}</strong><span>{natalView.reference.source} · 以{natalView.reference.stem.name}{natalView.reference.stem.element}为中心</span></div>
      <p><span>月令旺衰 <b>{natalView.reference.monthStatus}</b></span><span>月令长生 <b>{natalView.reference.monthGrowth}</b></span><span>坐宫旺衰 <b>{natalView.reference.seatGrowth}</b></span></p>
      <button type="button" onClick={resetDayMaster}>恢复日干</button>
    </section>

    <section className="bazi-luck-panel" aria-label="大运流年">
      <header><div><strong>大运在上 · 流年随运展开</strong><small>{result.luck.direction} · 约 {result.luck.startAge} 岁起运 · 据 {result.luck.basisTerm}</small></div><span>点击干或支可切换计算点</span></header>
      <div className="luck-timeline">
        {result.luck.cycles.map((cycle, index) => {
          const item = luckView[index];
          const selected = selectedLuck === index;
          return <article className={selected ? "selected" : ""} key={cycle.order}>
            <button type="button" className="luck-cycle-meta" onClick={() => chooseCycle(index)} aria-pressed={selected}><small>{cycle.startYear}</small><span>{cycle.startAge}岁</span><em>{cycle.naYin}</em></button>
            <div className="luck-ganzhi-body">
              <div className="ganzhi-stack">
                <button type="button" className={focusReference.key === `luck-${index}-stem` ? "focus-selected" : ""} onClick={() => chooseFocus({ scope: "luck", cycleIndex: index, kind: "stem" })} aria-label={`${cycle.pillar}大运天干${item.stem.name}`}><strong className={elementClass(item.stem.element)}>{item.stem.name}</strong></button>
                <button type="button" className={focusReference.key === `luck-${index}-branch` ? "focus-selected" : ""} onClick={() => chooseFocus({ scope: "luck", cycleIndex: index, kind: "branch" })} aria-label={`${cycle.pillar}大运地支${item.branch.name}`}><strong className={elementClass(item.branch.element)}>{item.branch.name}</strong></button>
              </div>
              <div className="ganzhi-relations"><span><b>{item.stem.tenGod}</b><small>{item.stem.sixKin}</small></span><span><b>{item.growthStage}</b><small>十二长生</small></span></div>
            </div>
          </article>;
        })}
      </div>
      <section className="annual-drawer">
        <header><div><strong>{selectedCycle.pillar}大运 · 十年流年</strong><span>{selectedCycle.startYear}—{selectedCycle.startYear + 9}</span></div><small>{selectedAnnualYear === defaultLuck.year ? `默认：${defaultLuck.reason}` : "已手动选择流年"}</small></header>
        <div className="annual-grid">{annualPillars.map((annual, index) => {
          const item = annualView[index];
          const selected = selectedAnnualYear === annual.year;
          return <article className={selected ? "selected" : ""} key={annual.year}>
            <button type="button" className="annual-meta" onClick={() => setSelectedAnnualYear(annual.year)}><small>{annual.year}</small><span>{annual.age}岁</span></button>
            <div className="annual-ganzhi-body">
              <div className="ganzhi-stack">
                <button type="button" className={focusReference.key === `annual-${annual.year}-stem` ? "focus-selected" : ""} onClick={() => chooseFocus({ scope: "annual", cycleIndex: selectedLuck, year: annual.year, kind: "stem" })} aria-label={`${annual.year}流年天干${item.stem.name}`}><strong className={elementClass(item.stem.element)}>{item.stem.name}</strong></button>
                <button type="button" className={focusReference.key === `annual-${annual.year}-branch` ? "focus-selected" : ""} onClick={() => chooseFocus({ scope: "annual", cycleIndex: selectedLuck, year: annual.year, kind: "branch" })} aria-label={`${annual.year}流年地支${item.branch.name}`}><strong className={elementClass(item.branch.element)}>{item.branch.name}</strong></button>
              </div>
              <div className="ganzhi-relations"><span><b>{item.stem.tenGod}</b><small>{item.stem.sixKin}</small></span><span><b>{item.growthStage}</b><small>十二长生</small></span></div>
            </div>
          </article>;
        })}</div>
      </section>
    </section>

    <div className="pillars" aria-label="四柱命盘">
      <div className="pillar-labels"><span>十神·六亲</span><span>天干</span><span>地支·本气</span><span>藏干·六亲</span><span>纳音</span><span>十二长生</span><span>月令／坐宫</span><span>参照神煞</span></div>
      {natalView.pillars.map((pillar, index) => <div className={`pillar ${index === 2 ? "day-master" : ""}`} key={pillar.label}>
        <span className="pillar-title">{pillar.label}{index === 2 && <i>命主</i>}</span>
        <span className="god"><b>{pillar.stem.tenGod}</b><small>{pillar.stem.sixKin}</small></span>
        <button type="button" className={`stem chart-character ${elementClass(pillar.stem.element)} ${focusReference.key === `natal-${index}-stem` ? "selected" : ""}`} onClick={() => chooseFocus({ scope: "natal", pillarIndex: index, kind: "stem" })} aria-pressed={focusReference.key === `natal-${index}-stem`}><small>{pillar.stem.polarity}{pillar.stem.element}</small><b>{pillar.stem.name}</b><span>{pillar.stem.tenGod} · {pillar.stem.sixKin}</span></button>
        <button type="button" className={`branch chart-character ${elementClass(pillar.branch.element)} ${focusReference.key === `natal-${index}-branch` ? "selected" : ""}`} onClick={() => chooseFocus({ scope: "natal", pillarIndex: index, kind: "branch" })} aria-pressed={focusReference.key === `natal-${index}-branch`}><small>本气{pillar.branch.mainQi.name} · {pillar.branch.mainQi.tenGod}</small><b>{pillar.branch.name}</b><span>{pillar.branch.mainQi.sixKin}</span></button>
        <span className="hidden">{pillar.branch.hiddenStems.map((hidden, hiddenIndex) => <button type="button" className={`hidden-focus ${focusReference.key === `hidden-${index}-${hiddenIndex}` ? "selected" : ""}`} key={hidden.name} onClick={() => chooseFocus({ scope: "hidden", pillarIndex: index, hiddenIndex })} aria-pressed={focusReference.key === `hidden-${index}-${hiddenIndex}`} aria-label={`${pillar.label}${pillar.branch.name}藏干${hidden.name}`}><b>{hidden.name}</b><i>{hidden.tenGod}</i><em>{hidden.sixKin}</em></button>)}</span>
        <span className="nayin">{pillar.naYin}</span>
        <span className="growth-stage">{pillar.growthStage}</span>
        <span className="pillar-strength"><b>月令{pillar.monthStatus}</b><small>坐宫{pillar.seatGrowth}</small></span>
        <span className="shensha">{pillar.shenSha.length ? pillar.shenSha.map((star) => <b key={star}>{star}</b>) : "—"}</span>
      </div>)}
    </div>

  </article>;
}
