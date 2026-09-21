"use client";

import { useMemo, useState } from "react";
import { calculateFourPillars } from "@/lib/four-pillars.mjs";
import { calculateZiWei, formatZiWeiText, getZiWeiSelection } from "@/lib/zi-wei.mjs";
import { ChartTimeControls } from "./chart-time-controls";
import { elementClass } from "./five-elements";

type FourPillarsCalculation = ReturnType<typeof calculateFourPillars>;
type MutagenTone = "natal" | "decadal" | "yearly" | "palace";
type MutagenScope = { prefix: string; tone: MutagenTone; names: string[] };

const gridAreas: Record<string, string> = {
  巳: "1 / 1", 午: "1 / 2", 未: "1 / 3", 申: "1 / 4",
  辰: "2 / 1", 酉: "2 / 4", 卯: "3 / 1", 戌: "3 / 4",
  寅: "4 / 1", 丑: "4 / 2", 子: "4 / 3", 亥: "4 / 4",
};

const gridPoints: Record<string, { x: number; y: number }> = {
  巳: { x: 12.5, y: 12.5 }, 午: { x: 37.5, y: 12.5 }, 未: { x: 62.5, y: 12.5 }, 申: { x: 87.5, y: 12.5 },
  辰: { x: 12.5, y: 37.5 }, 酉: { x: 87.5, y: 37.5 }, 卯: { x: 12.5, y: 62.5 }, 戌: { x: 87.5, y: 62.5 },
  寅: { x: 12.5, y: 87.5 }, 丑: { x: 37.5, y: 87.5 }, 子: { x: 62.5, y: 87.5 }, 亥: { x: 87.5, y: 87.5 },
};

const mutagenLabels = ["禄", "权", "科", "忌"];

function starNames(stars: Array<{ name: string; brightness?: string }>, scopes: MutagenScope[]) {
  if (!stars.length) return <span className="ziwei-empty">—</span>;
  return stars.map((star) => <span className="ziwei-star" key={star.name}>
    <b>{star.name}</b>
    {star.brightness && <small>{star.brightness}</small>}
    {scopes.flatMap((scope) => scope.names.map((name, index) => name === star.name ? <em className={`ziwei-mutagen ${scope.tone}`} key={`${scope.tone}-${star.name}`}>{scope.prefix}{mutagenLabels[index]}</em> : []))}
  </span>);
}

function flowStars(stars: Array<{ name: string }>) {
  return stars.length ? stars.map((star) => star.name).join(" · ") : "—";
}

function mutagenItems(prefix: string, names: string[], tone: MutagenTone) {
  return names.map((name, index) => <span className="ziwei-mutagen-item" key={`${tone}-${name}`}><em className={`ziwei-mutagen ${tone}`}>{prefix}{mutagenLabels[index]}</em><b>{name}</b></span>);
}

export function ZiWeiPanel({ calculation, copied, onCopy, onPreviousTime, onNextTime }: { calculation: FourPillarsCalculation; copied: boolean; onCopy: (text: string) => void; onPreviousTime: () => void; onNextTime: () => void }) {
  const result = useMemo(() => calculateZiWei(calculation), [calculation]);
  const [decadeIndex, setDecadeIndex] = useState(result.defaultSelection.decadeIndex);
  const [yearValue, setYearValue] = useState(result.defaultSelection.year);
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const selection = useMemo(() => getZiWeiSelection(result, decadeIndex, yearValue), [result, decadeIndex, yearValue]);
  const selectedPalace = result.palaces.find((palace) => palace.index === selectedPalaceIndex) || null;

  const relationPalaces = selectedPalace?.relations || null;

  const natalMutagens = result.transformations.natal.stars.map((item) => item.name);
  const palaceMutagens = selectedPalace?.palaceTransformations.map((item) => item.name) || [];
  const scopes: MutagenScope[] = [
    { prefix: "命", tone: "natal", names: natalMutagens },
    { prefix: "限", tone: "decadal", names: selection.decade.mutagen },
    { prefix: "年", tone: "yearly", names: selection.year.mutagen },
    ...(selectedPalace ? [{ prefix: "宫", tone: "palace" as const, names: palaceMutagens }] : []),
  ];
  const pillars = result.source.fourPillars.split(" ");

  function chooseDecade(nextIndex: number) {
    const next = result.decades[nextIndex];
    const currentYear = new Date().getFullYear();
    const nextYear = next.years.find((item) => item.year === currentYear) || next.years[0];
    setDecadeIndex(nextIndex);
    setYearValue(nextYear.year);
  }

  return <section className="ziwei-section module-page" id="ziwei">
    <div className="detail-heading ziwei-heading">
      <span className="step">紫</span>
      <div><h2>紫微斗数 · 三合盘</h2><p>共用同一真太阳时与四柱 · 中州派安星 · 大限流年联动</p></div>
      <div className="ziwei-heading-actions"><ChartTimeControls onPrevious={onPreviousTime} onNext={onNextTime} /><button type="button" className="panel-copy-button" onClick={() => onCopy(formatZiWeiText(result, decadeIndex, yearValue, selectedPalaceIndex ?? undefined))}>{copied ? "盘面信息已复制" : "复制文字简排"}</button></div>
    </div>

    <article className="ziwei-card">
      <header className="ziwei-toolbar">
        <div className="ziwei-profile"><strong>{result.profile.fiveElementsClass}</strong><span>命主 {result.profile.soul}</span><span>身主 {result.profile.body}</span><span>{result.source.gender}命</span></div>
        <label>大限<select value={decadeIndex} onChange={(event) => chooseDecade(Number(event.target.value))}>{result.decades.map((decade) => <option key={`${decade.palaceIndex}-${decade.yearRange[0]}`} value={decade.listIndex}>{decade.ageRange.join("–")}岁 · {decade.heavenlyStem}{decade.earthlyBranch} · {decade.yearRange.join("–")}</option>)}</select></label>
        <label>流年<select value={selection.year.year} onChange={(event) => setYearValue(Number(event.target.value))}>{selection.decade.years.map((year) => <option key={year.year} value={year.year}>{year.year} · {year.age}岁 · {year.heavenlyStem}{year.earthlyBranch}</option>)}</select></label>
      </header>
      <div className="ziwei-mutagen-band" aria-label="命限年宫四化">
        <div className="ziwei-mutagen-group natal"><small>命四化</small>{mutagenItems("命", natalMutagens, "natal")}</div>
        <div className="ziwei-mutagen-group decadal"><small>限四化</small>{mutagenItems("限", selection.decade.mutagen, "decadal")}</div>
        <div className="ziwei-mutagen-group yearly"><small>年四化</small>{mutagenItems("年", selection.year.mutagen, "yearly")}</div>
        <div className="ziwei-mutagen-group palace"><small>宫四化</small>{selectedPalace ? mutagenItems("宫", palaceMutagens, "palace") : <span className="ziwei-palace-prompt">点击宫位查看</span>}</div>
      </div>

      <div className="ziwei-grid" aria-label="紫微斗数十二宫">
        {selectedPalace && relationPalaces && <svg className="ziwei-relation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${selectedPalace.name}宫三方四正连线`}>
          {relationPalaces.trines.map((index) => {
            const target = result.palaces.find((palace) => palace.index === index);
            if (!target) return null;
            return <line className="trine" key={`trine-${index}`} x1={gridPoints[selectedPalace.earthlyBranch].x} y1={gridPoints[selectedPalace.earthlyBranch].y} x2={gridPoints[target.earthlyBranch].x} y2={gridPoints[target.earthlyBranch].y} />;
          })}
          {(() => {
            const target = result.palaces.find((palace) => palace.index === relationPalaces.opposite);
            return target ? <line className="opposite" x1={gridPoints[selectedPalace.earthlyBranch].x} y1={gridPoints[selectedPalace.earthlyBranch].y} x2={gridPoints[target.earthlyBranch].x} y2={gridPoints[target.earthlyBranch].y} /> : null;
          })()}
          <circle cx={gridPoints[selectedPalace.earthlyBranch].x} cy={gridPoints[selectedPalace.earthlyBranch].y} r="1.15" />
        </svg>}
        {result.palaces.map((palace) => {
          const decadeActive = selection.decade.palaceIndex === palace.index;
          const palaceActive = selectedPalaceIndex === palace.index;
          const trineRelated = relationPalaces?.trines.includes(palace.index);
          const oppositeRelated = relationPalaces?.opposite === palace.index;
          return <button type="button" className={`ziwei-palace ${decadeActive ? "selected" : ""} ${palaceActive ? "palace-selected" : ""} ${trineRelated ? "trine-related" : ""} ${oppositeRelated ? "opposite-related" : ""}`} style={{ gridArea: gridAreas[palace.earthlyBranch] }} key={palace.index} onClick={() => setSelectedPalaceIndex(palace.index)} aria-label={`查看${palace.name}宫四化与三方四正`}>
            <span className="ziwei-palace-head"><span><b className={elementClass(palace.heavenlyStem)}>{palace.heavenlyStem}</b><b className={elementClass(palace.earthlyBranch)}>{palace.earthlyBranch}</b></span><strong>{palace.name.endsWith("宫") ? palace.name : `${palace.name}宫`}</strong><em>{palace.isOriginalPalace ? "命" : ""}{palace.isBodyPalace ? "身" : ""}</em></span>
            <span className="ziwei-star-row major" aria-label="主曜"><span className="ziwei-stars">{starNames(palace.majorStars, scopes)}</span></span>
            <span className="ziwei-star-row minor" aria-label="辅煞"><span className="ziwei-stars">{starNames(palace.minorStars, scopes)}</span></span>
            <span className="ziwei-star-row adjective" aria-label="杂曜"><span className="ziwei-stars">{starNames(palace.adjectiveStars, scopes)}</span></span>
            <span className="ziwei-palace-layers"><span className="ziwei-layer-line"><b>限·{selection.decade.palaceNames[palace.index]}</b><span>{flowStars(selection.decade.stars[palace.index])}</span></span><span className="ziwei-layer-line"><b>年·{selection.year.palaceNames[palace.index]}</b><span>{flowStars(selection.year.stars[palace.index])}</span></span></span>
            <span className="ziwei-palace-foot"><span>{palace.decadal ? `${palace.decadal.range.join("–")}岁` : "—"}</span><span>{palace.changsheng12}</span></span>
          </button>;
        })}
        <div className="ziwei-center" style={{ gridArea: "2 / 2 / 4 / 4" }} aria-label={`八字 ${result.source.fourPillars}`}>
          <div>{pillars.map((pillar, index) => <p key={`${pillar}-${index}`}><strong className={elementClass(pillar[0])}>{pillar[0]}</strong><b className={elementClass(pillar[1])}>{pillar[1]}</b></p>)}</div>
        </div>
      </div>
      <div className="ziwei-relation-legend"><span><i className="trine" />三方实线</span><span><i className="opposite" />对宫虚线</span></div>
      <p className="ziwei-note">大限、流年在上方选择；点击十二宫切换橙色宫干四化及三方四正连线。红、绿、蓝、橙依次表示命、限、年、宫四化。</p>
    </article>
  </section>;
}
