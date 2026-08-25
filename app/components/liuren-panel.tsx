import { calculateLiuRen, MONTH_GENERALS } from "@/lib/liu-ren.mjs";
import { elementClass } from "./five-elements";

type LiuRenResult = ReturnType<typeof calculateLiuRen>;

const platePositions = [[4, 3], [4, 2], [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4]] as const;
const pillarLabels = ["年", "月", "日", "时"];

export function LiuRenPanel({ result, mode, manualMonthGeneral, copied, onCopy, onModeChange, onMonthGeneralChange }: {
  result: LiuRenResult;
  mode: "auto" | "manual";
  manualMonthGeneral: string;
  copied: boolean;
  onCopy: () => void;
  onModeChange: (mode: "auto" | "manual") => void;
  onMonthGeneralChange: (monthGeneral: string) => void;
}) {
  const pillars = result.source.fourPillars.split(" ");
  const [date, time] = result.source.standardTime.split(" ");
  const [year, month, day] = date.split("-");
  return <section className="liuren-section module-page" id="liuren">
    <div className="detail-heading liuren-heading">
      <span className="step">壬</span>
      <div><h2>大六壬排盘</h2><p>直接调用同一次四柱计算 · 月将加占时 · 天地盘、四课与三传</p></div>
      <button type="button" className="panel-copy-button" onClick={onCopy}>{copied ? "盘面信息已复制" : "复制文字简排"}</button>
      <div className="month-general-control" aria-label="月将设置">
        <button type="button" className={mode === "auto" ? "selected" : ""} onClick={() => onModeChange("auto")}>中气自动换将</button>
        <button type="button" className={mode === "manual" ? "selected" : ""} onClick={() => onModeChange("manual")}>手动月将</button>
        {mode === "manual" && <select aria-label="指定月将" value={manualMonthGeneral} onChange={(event) => onMonthGeneralChange(event.target.value)}>{MONTH_GENERALS.map((item) => <option value={item.branch} key={item.branch}>{item.branch} · {item.name}</option>)}</select>}
      </div>
    </div>

    <article className="liuren-card liuren-classic-card">
      <header className="liuren-classic-meta">
        <div className="liuren-date-line"><strong>{year}年{month}月{day}日</strong><span>{time.slice(0, 5)} · 真太阳时 {result.source.trueSolarTime.slice(11, 16)}</span></div>
        <div className="liuren-pillar-table">
          {pillars.map((pillar, index) => <div key={pillarLabels[index]}><small>{pillarLabels[index]}</small><strong>{pillar[0]}</strong><b>{pillar[1]}</b></div>)}
        </div>
        <p><span>月将</span><strong><b className={elementClass(result.monthGeneral.element)}>{result.monthGeneral.branch}</b>{result.monthGeneral.name}</strong><span>占时</span><strong className={elementClass(result.divinationTime.branch.element)}>{result.divinationTime.branch.name}</strong><span>{result.heavenlyGenerals.dayNight}</span><strong>{result.heavenlyGenerals.direction}</strong></p>
        <p><span>{result.monthGeneral.currentMiddleQi.name}后换将</span><span>贵人</span><strong className={elementClass(result.heavenlyGenerals.nobleman.element)}>{result.heavenlyGenerals.nobleman.name}</strong></p>
      </header>

      <div className="liuren-classic-board" aria-label="大六壬传统天地盘">
        {result.earthPlate.map((cell) => {
          const [row, column] = platePositions[cell.earth.index];
          const voidClassName = `${cell.earthVoid ? " is-earth-void" : ""}${cell.heavenVoid ? " is-heaven-void" : ""}`;
          const voidLabel = [cell.earthVoid ? "地盘空亡" : "", cell.heavenVoid ? "天盘空亡" : ""].filter(Boolean).join("、");
          return <article className={`liuren-classic-cell${voidClassName}`} style={{ gridRow: row, gridColumn: column }} aria-label={`${cell.earth.name}宫，天盘${cell.heaven.name}${voidLabel ? `，${voidLabel}` : ""}`} title={voidLabel || undefined} key={cell.earth.name}>
            <header><span><b className={cell.dunStem ? elementClass(cell.dunStem.element) : "dun-stem-empty"}>{cell.dunStem?.name || "空"}</b><strong className={elementClass(cell.heaven.element)}>{cell.heaven.name}</strong></span><em className={elementClass(cell.heavenlyGeneralDetail.element)}>{cell.heavenlyGeneral}</em></header>
            <p>天盘 · {cell.heaven.polarity}<b className={elementClass(cell.heaven.element)}>{cell.heaven.element}</b></p>
            <div className="liuren-palace-shensha liuren-heaven-shensha"><small className="liuren-palace-layer-title">天盘神煞</small>{cell.heavenShenShaGroups.length ? cell.heavenShenShaGroups.map((group) => <p key={group.category}><small>{group.category}</small><span>{group.items.join(" · ")}</span></p>) : <span>无神煞</span>}</div>
            <footer className="liuren-palace-earth">
              <div className="liuren-palace-shensha liuren-earth-shensha"><small className="liuren-palace-layer-title">地盘神煞</small>{cell.earthShenShaGroups.length ? cell.earthShenShaGroups.map((group) => <p key={group.category}><small>{group.category}</small><span>{group.items.join(" · ")}</span></p>) : <span>无神煞</span>}</div>
            </footer>
          </article>;
        })}

        <section className="liuren-classic-center">
          <div className="classic-liuren-summary">
            <p><small>六壬卦四柱</small>{pillars.map((pillar, index) => <span key={pillarLabels[index]}><b className={elementClass(pillar[0])}>{pillar[0]}</b><b className={elementClass(pillar[1])}>{pillar[1]}</b></span>)}</p>
            <p><small>月将</small><strong><b className={elementClass(result.monthGeneral.element)}>{result.monthGeneral.branch}</b>{result.monthGeneral.name}</strong><small>占时</small><strong className={elementClass(result.divinationTime.branch.element)}>{result.divinationTime.branch.name}</strong><small>旬遁</small><strong>{result.xunDun.start}</strong></p>
          </div>
          <div className="classic-transmissions">
            <small>三传 · 六亲／遁干／支神／天将</small>
            {result.threeTransmissions.items.map((item) => <p key={item.label}><span>{item.sixRelation}</span><i className={item.dunStem ? elementClass(item.dunStem.element) : "dun-stem-empty"}>{item.dunStem?.name || "空"}</i><strong className={elementClass(item.branch.element)}>{item.branch.name}</strong><b className={elementClass(item.heavenlyGeneralDetail.element)}>{item.heavenlyGeneral}</b></p>)}
          </div>
          <div className="classic-lessons">
            <div>{result.fourLessons.map((lesson) => <p key={lesson.order}><span className={elementClass(lesson.heavenlyGeneralDetail.element)}>{lesson.heavenlyGeneral}</span><strong className={elementClass(lesson.upper.element)}>{lesson.upper.name}</strong><b className={elementClass(lesson.lower.element)}>{lesson.lower.name}</b><em className={elementClass(lesson.earthHeavenlyGeneralDetail.element)}><small>{lesson.earthPalace}宫贵神</small>{lesson.earthHeavenlyGeneral}</em></p>)}</div>
          </div>
        </section>
      </div>
      <p className="liuren-note liuren-classic-note">月将随中气交节点自动切换；手动月将只覆盖本六壬盘，不改动共用时间与四柱。</p>
    </article>
  </section>;
}
