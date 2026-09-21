"use client";

import { useMemo, useState } from "react";
import { calculateFourPillars } from "@/lib/four-pillars.mjs";
import { calculateZiWei, formatZiWeiText, getZiWeiSelection } from "@/lib/zi-wei.mjs";
import { ChartTimeControls } from "./chart-time-controls";
import { elementClass } from "./five-elements";

type FourPillarsCalculation = ReturnType<typeof calculateFourPillars>;

const gridAreas: Record<string, string> = {
  巳: "1 / 1", 午: "1 / 2", 未: "1 / 3", 申: "1 / 4",
  辰: "2 / 1", 酉: "2 / 4", 卯: "3 / 1", 戌: "3 / 4",
  寅: "4 / 1", 丑: "4 / 2", 子: "4 / 3", 亥: "4 / 4",
};

const mutagenLabels = ["禄", "权", "科", "忌"];

function starNames(stars: Array<{ name: string; brightness?: string; mutagen?: string }>) {
  if (!stars.length) return <span className="ziwei-empty">—</span>;
  return stars.map((star) => <span className="ziwei-star" key={`${star.name}-${star.mutagen || ""}`}><b>{star.name}</b>{star.brightness && <small>{star.brightness}</small>}{star.mutagen && <em>{star.mutagen}</em>}</span>);
}

function flowStars(stars: Array<{ name: string }>) {
  return stars.length ? stars.map((star) => star.name).join(" · ") : "—";
}

function mutagenText(names: string[]) {
  return names.map((name, index) => `${name}${mutagenLabels[index]}`).join(" · ");
}

export function ZiWeiPanel({ calculation, copied, onCopy, onPreviousTime, onNextTime }: { calculation: FourPillarsCalculation; copied: boolean; onCopy: (text: string) => void; onPreviousTime: () => void; onNextTime: () => void }) {
  const result = useMemo(() => calculateZiWei(calculation), [calculation]);
  const [decadeIndex, setDecadeIndex] = useState(result.defaultSelection.decadeIndex);
  const [yearValue, setYearValue] = useState(result.defaultSelection.year);
  const selection = useMemo(() => getZiWeiSelection(result, decadeIndex, yearValue), [result, decadeIndex, yearValue]);
  const pillars = result.source.fourPillars.split(" ");

  function chooseDecade(nextIndex: number) {
    const next = result.decades[nextIndex];
    const currentYear = new Date().getFullYear();
    const nextYear = next.years.find((item) => item.year === currentYear) || next.years[0];
    setDecadeIndex(nextIndex);
    setYearValue(nextYear.year);
  }

  function choosePalace(palaceIndex: number) {
    const nextIndex = result.decades.findIndex((decade) => decade.palaceIndex === palaceIndex);
    if (nextIndex >= 0) chooseDecade(nextIndex);
  }

  return <section className="ziwei-section module-page" id="ziwei">
    <div className="detail-heading ziwei-heading">
      <span className="step">紫</span>
      <div><h2>紫微斗数 · 三合盘</h2><p>共用同一真太阳时与四柱 · 中州派安星 · 大限流年联动</p></div>
      <div className="ziwei-heading-actions"><ChartTimeControls onPrevious={onPreviousTime} onNext={onNextTime} /><button type="button" className="panel-copy-button" onClick={() => onCopy(formatZiWeiText(result, decadeIndex, yearValue))}>{copied ? "盘面信息已复制" : "复制文字简排"}</button></div>
    </div>

    <article className="ziwei-card">
      <header className="ziwei-toolbar">
        <div className="ziwei-profile"><strong>{result.profile.fiveElementsClass}</strong><span>命主 {result.profile.soul}</span><span>身主 {result.profile.body}</span><span>{result.source.gender}命</span></div>
        <label>大限<select value={decadeIndex} onChange={(event) => chooseDecade(Number(event.target.value))}>{result.decades.map((decade) => <option key={`${decade.palaceIndex}-${decade.yearRange[0]}`} value={decade.listIndex}>{decade.ageRange.join("–")}岁 · {decade.heavenlyStem}{decade.earthlyBranch} · {decade.yearRange.join("–")}</option>)}</select></label>
        <label>流年<select value={selection.year.year} onChange={(event) => setYearValue(Number(event.target.value))}>{selection.decade.years.map((year) => <option key={year.year} value={year.year}>{year.year} · {year.age}岁 · {year.heavenlyStem}{year.earthlyBranch}</option>)}</select></label>
      </header>
      <div className="ziwei-flow-summary">
        <span><b>大限四化</b>{mutagenText(selection.decade.mutagen)}</span>
        <span><b>流年四化</b>{mutagenText(selection.year.mutagen)}</span>
      </div>

      <div className="ziwei-grid" aria-label="紫微斗数十二宫">
        {result.palaces.map((palace) => {
          const active = selection.decade.palaceIndex === palace.index;
          return <button type="button" className={`ziwei-palace ${active ? "selected" : ""}`} style={{ gridArea: gridAreas[palace.earthlyBranch] }} key={palace.index} onClick={() => choosePalace(palace.index)} aria-label={`选择${palace.name}宫大限`}>
            <span className="ziwei-palace-head"><span><b className={elementClass(palace.heavenlyStem)}>{palace.heavenlyStem}</b><b className={elementClass(palace.earthlyBranch)}>{palace.earthlyBranch}</b></span><strong>{palace.name.endsWith("宫") ? palace.name : `${palace.name}宫`}</strong><em>{palace.isOriginalPalace ? "命" : ""}{palace.isBodyPalace ? "身" : ""}</em></span>
            <span className="ziwei-star-row major"><small>甲级·主曜</small><span className="ziwei-stars">{starNames(palace.majorStars)}</span></span>
            <span className="ziwei-star-row minor"><small>乙级·辅煞</small><span className="ziwei-stars">{starNames(palace.minorStars)}</span></span>
            <span className="ziwei-star-row adjective"><small>丙级·杂曜</small><span className="ziwei-stars">{starNames(palace.adjectiveStars)}</span></span>
            <span className="ziwei-palace-layers"><span className="ziwei-layer-line"><b>限·{selection.decade.palaceNames[palace.index]}</b><span>{flowStars(selection.decade.stars[palace.index])}</span></span><span className="ziwei-layer-line"><b>年·{selection.year.palaceNames[palace.index]}</b><span>{flowStars(selection.year.stars[palace.index])}</span></span></span>
            <span className="ziwei-palace-foot"><span>{palace.decadal ? `${palace.decadal.range.join("–")}岁` : "—"}</span><span>{palace.changsheng12}</span></span>
          </button>;
        })}
        <div className="ziwei-center" style={{ gridArea: "2 / 2 / 4 / 4" }} aria-label={`八字 ${result.source.fourPillars}`}>
          <div>{pillars.map((pillar, index) => <p key={`${pillar}-${index}`}><strong className={elementClass(pillar[0])}>{pillar[0]}</strong><b className={elementClass(pillar[1])}>{pillar[1]}</b></p>)}</div>
        </div>
      </div>
      <p className="ziwei-note">点击十二宫可切换该宫对应大限；大限与流年下拉框用于精确选择。甲、乙、丙级星曜位置均由中州派安星口径生成。</p>
    </article>
  </section>;
}
