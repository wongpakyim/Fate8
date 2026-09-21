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

const relationAnchorPoints: Record<string, { x: number; y: number }> = {
  巳: { x: 25, y: 25 }, 午: { x: 37.5, y: 25 }, 未: { x: 62.5, y: 25 }, 申: { x: 75, y: 25 },
  辰: { x: 25, y: 37.5 }, 酉: { x: 75, y: 37.5 }, 卯: { x: 25, y: 62.5 }, 戌: { x: 75, y: 62.5 },
  寅: { x: 25, y: 75 }, 丑: { x: 37.5, y: 75 }, 子: { x: 62.5, y: 75 }, 亥: { x: 75, y: 75 },
};

const mutagenLabels = ["禄", "权", "科", "忌"];

function starNames(stars: Array<{ name: string }>, scopes: MutagenScope[]) {
  if (!stars.length) return null;
  return stars.map((star) => {
    const transformations = scopes.flatMap((scope) => scope.names.map((name, index) => name === star.name
      ? <em className={`ziwei-mutagen ${scope.tone}`} title={`${scope.prefix}${mutagenLabels[index]}：${star.name}`} key={`${scope.tone}-${star.name}`}>{scope.prefix}{mutagenLabels[index]}</em>
      : null).filter(Boolean));
    return <span className="ziwei-star" key={star.name}>
      <b>{star.name}</b>
      {transformations.length > 0 && <span className="ziwei-star-mutagens">{transformations}</span>}
    </span>;
  });
}

function flowStars(stars: Array<{ name: string }>) {
  return stars.length ? stars.map((star) => star.name).join(" · ") : "—";
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
      <div className="ziwei-grid" aria-label="紫微斗数十二宫">
        {selectedPalace && relationPalaces && <svg className="ziwei-relation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${selectedPalace.name}宫三方四正连线`}>
          {(() => {
            const trinePalaces = [selectedPalace, ...relationPalaces.trines.map((index) => result.palaces.find((palace) => palace.index === index))].filter(Boolean) as typeof result.palaces;
            const points = trinePalaces.map((palace) => {
              const point = relationAnchorPoints[palace.earthlyBranch];
              return `${point.x},${point.y}`;
            }).join(" ");
            return <>
              <polygon className="trine" points={points} />
              {trinePalaces.map((palace) => {
                const point = relationAnchorPoints[palace.earthlyBranch];
                return <circle className="trine-node" key={`trine-node-${palace.index}`} cx={point.x} cy={point.y} r="0.8" />;
              })}
            </>;
          })()}
          {(() => {
            const target = result.palaces.find((palace) => palace.index === relationPalaces.opposite);
            if (!target) return null;
            const sourcePoint = relationAnchorPoints[selectedPalace.earthlyBranch];
            const targetPoint = relationAnchorPoints[target.earthlyBranch];
            return <>
              <line className="opposite" x1={sourcePoint.x} y1={sourcePoint.y} x2={targetPoint.x} y2={targetPoint.y} />
              <circle className="opposite-node" cx={targetPoint.x} cy={targetPoint.y} r="0.8" />
            </>;
          })()}
        </svg>}
        {result.palaces.map((palace) => {
          const decadeActive = selection.decade.palaceIndex === palace.index;
          const palaceActive = selectedPalaceIndex === palace.index;
          return <button type="button" className={`ziwei-palace ${decadeActive ? "selected" : ""} ${palaceActive ? "palace-selected" : ""}`} style={{ gridArea: gridAreas[palace.earthlyBranch] }} key={palace.index} onClick={() => setSelectedPalaceIndex(palace.index)} aria-label={`查看${palace.name}宫四化与三方四正`}>
            <span className="ziwei-palace-main">
              <span className="ziwei-palace-head"><span><b className={elementClass(palace.heavenlyStem)}>{palace.heavenlyStem}</b><b className={elementClass(palace.earthlyBranch)}>{palace.earthlyBranch}</b></span>{(palace.isOriginalPalace || palace.isBodyPalace) && <em>{palace.isOriginalPalace ? "命" : ""}{palace.isBodyPalace ? "身" : ""}</em>}</span>
              <span className="ziwei-star-columns" aria-label="甲乙丙级星曜">
                <span className="ziwei-star-column major" aria-label="甲级星">{starNames(palace.majorStars, scopes)}</span>
                <span className="ziwei-star-column minor" aria-label="乙级星">{starNames(palace.minorStars, scopes)}</span>
                <span className="ziwei-star-column adjective" aria-label="丙级星">{starNames(palace.adjectiveStars, scopes)}</span>
              </span>
            </span>
            <span className="ziwei-palace-layers"><span className="ziwei-layer-line"><b>限·{selection.decade.palaceNames[palace.index]}</b><span>{flowStars(selection.decade.stars[palace.index])}</span></span><span className="ziwei-layer-line"><b>年·{selection.year.palaceNames[palace.index]}</b><span>{flowStars(selection.year.stars[palace.index])}</span></span></span>
            <span className="ziwei-palace-foot"><span>{palace.decadal ? `${palace.decadal.range.join("–")}岁` : "—"}</span><strong>{palace.name.endsWith("宫") ? palace.name : `${palace.name}宫`}</strong><span>{palace.changsheng12}</span></span>
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
