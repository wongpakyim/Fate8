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
        <p><span>{result.monthGeneral.currentMiddleQi.name}后换将</span><strong>{result.threeTransmissions.method}</strong><span>贵人</span><strong className={elementClass(result.heavenlyGenerals.nobleman.element)}>{result.heavenlyGenerals.nobleman.name}</strong></p>
      </header>

      <div className="liuren-classic-board" aria-label="大六壬传统天地盘">
        {result.earthPlate.map((cell) => {
          const [row, column] = platePositions[cell.earth.index];
          return <article className="liuren-classic-cell" style={{ gridRow: row, gridColumn: column }} key={cell.earth.name}>
            <header><span><small>{cell.earth.name}宫</small><strong className={elementClass(cell.heaven.element)}>{cell.heaven.name}</strong></span><em className={elementClass(cell.heavenlyGeneralDetail.element)}>{cell.heavenlyGeneral}</em></header>
            <p>上神 · {cell.heaven.polarity}<b className={elementClass(cell.heaven.element)}>{cell.heaven.element}</b></p>
            <div className="liuren-palace-shensha">{cell.shenSha.length ? cell.shenSha.map((star) => <b key={star}>{star}</b>) : <span>无神煞</span>}</div>
          </article>;
        })}

        <section className="liuren-classic-center">
          <div className="classic-transmissions">
            <small>三传 · {result.threeTransmissions.method}</small>
            {result.threeTransmissions.items.map((item) => <p key={item.label}><span>{item.sixRelation}</span><strong className={elementClass(item.branch.element)}>{item.branch.name}</strong><b className={elementClass(item.heavenlyGeneralDetail.element)}>{item.heavenlyGeneral}</b></p>)}
          </div>
          <div className="classic-lessons">
            <small>四课</small>
            <div>{result.fourLessons.map((lesson) => <p key={lesson.order}><span className={elementClass(lesson.heavenlyGeneralDetail.element)}>{lesson.heavenlyGeneral}</span><strong className={elementClass(lesson.upper.element)}>{lesson.upper.name}</strong><b className={elementClass(lesson.lower.element)}>{lesson.lower.name}</b><em>{lesson.relation}</em></p>)}</div>
          </div>
        </section>
      </div>
      <p className="liuren-note liuren-classic-note">月将随中气交节点自动切换；手动月将只覆盖本六壬盘，不改动共用时间与四柱。</p>
    </article>
  </section>;
}
