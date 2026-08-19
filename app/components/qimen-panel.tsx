import { calculateQiMen } from "@/lib/qi-men.mjs";
import { elementClass } from "./five-elements";

type QiMenResult = ReturnType<typeof calculateQiMen>;

const pillarLabels = ["年柱", "月柱", "日柱", "时柱"];

function growthLabel(items: Array<{ stem: string; stage: string }>) {
  const groups = new Map<string, string[]>();
  for (const item of items) groups.set(item.stem, [...(groups.get(item.stem) || []), item.stage]);
  const values = [...groups.values()].map((stages) => stages.join("、"));
  return values.join(" / ") || "—";
}

export function QiMenPanel({ result, dayPillar, hourPillar, copied, onCopy }: { result: QiMenResult; dayPillar: string; hourPillar: string; copied: boolean; onCopy: () => void }) {
  const pillars = result.source.fourPillars.split(" ");
  return <section className="qimen-section module-page" id="qimen">
    <div className="detail-heading qimen-heading">
      <span className="step">奇</span>
      <div><h2>时家奇门 · 拆补法</h2><p>复用同一标准时、真太阳时、日柱与时柱 · 九宫转盘起局</p></div>
      <div className="qimen-heading-actions"><button type="button" className="panel-copy-button" onClick={onCopy}>{copied ? "盘面信息已复制" : "复制文字简排"}</button><span className="qimen-method-chip">拆补法 · {result.ju.label}</span></div>
    </div>
    <article className="qimen-card qimen-classic-card">
      <header className="qimen-reference-summary">
        <div className="qimen-pillar-summary">
          <div className="qimen-row-label">四柱</div>
          {pillars.map((pillar, index) => <div className="qimen-pillar-item" key={pillarLabels[index]}>
            <small>{pillarLabels[index]}</small>
            <p><strong className={elementClass(pillar[0])}>{pillar[0]}</strong><b className={elementClass(pillar[1])}>{pillar[1]}</b></p>
          </div>)}
        </div>
        <div className="qimen-summary-row qimen-time-row"><small>排盘</small><strong>{result.source.standardTime.slice(0, 16)}</strong><span>真太阳时 {result.source.trueSolarTime.slice(11, 16)} · 日时取 {dayPillar}、{hourPillar}</span></div>
        <div className="qimen-summary-row qimen-term-row"><small>节气</small><strong>{result.solarTerm.current.name} {result.solarTerm.current.time.slice(5, 16)} ～ {result.solarTerm.next.name} {result.solarTerm.next.time.slice(5, 16)}</strong></div>
        <div className="qimen-rule-labels"><small>旬首</small><small>局数</small><small>值符</small><small>值使</small><small>马星</small></div>
        <div className="qimen-rule-values">
          <strong>{result.xun.start}遁{result.xun.hiddenStem}<span>旬空 {result.xun.voidBranches.join("、")}</span></strong>
          <strong>{result.ju.label}<span>{result.yuan.name} · {result.yuan.fuTou.value}</span></strong>
          <strong>{result.chiefs.star.name}<span>落{result.chiefs.star.palace}宫</span></strong>
          <strong>{result.chiefs.door.name}<span>落{result.chiefs.door.palace}宫</span></strong>
          <strong>{result.horse.branch}<span>落{result.horse.palace}宫</span></strong>
        </div>
      </header>
      <div className="qimen-nine-grid" aria-label="拆补法奇门九宫盘">
        {result.palaces.map((palace) => <article className={`qimen-palace ${palace.number === 5 ? "center" : ""} ${palace.isChiefStar ? "chief-star" : ""} ${palace.isChiefDoor ? "chief-door" : ""}`} key={palace.number}>
          <header><div><strong>{palace.name}</strong><span>{palace.direction}{palace.branches.length ? ` · ${palace.branches.join("、")}` : ""}</span></div><div className="qimen-flags">{palace.isChiefStar && <b className="chief">值符</b>}{palace.isChiefDoor && <b className="chief-door-flag">值使</b>}{palace.isVoid && <b>空亡</b>}{palace.isHorse && <b>马星</b>}</div></header>
          {palace.number === 5 ? <div className="qimen-center-content"><small>天禽寄坤二</small><strong className={elementClass(palace.earthInstrument)}>{palace.earthInstrument}</strong><span>中宫地盘奇仪</span></div> : <div className="qimen-palace-body">
            <div className="qimen-pair-row">
              <section className="qimen-deity-value"><small>八神</small><strong>{palace.deity}</strong></section>
              <section className="qimen-heaven-stem-value"><small>天盘干</small><strong className={elementClass(palace.heavenInstruments[0])}>{palace.heavenInstruments.join("·")}</strong><span>{growthLabel(palace.heavenGrowth)}</span></section>
            </div>
            <div className="qimen-pair-row">
              <section className="qimen-star-value"><small>九星</small><strong>{palace.stars.join("·")}</strong></section>
              <section className="qimen-earth-stem-value"><small>地盘干</small><strong className={elementClass(palace.earthInstrument)}>{palace.earthInstrument}</strong><span>{growthLabel(palace.earthGrowth)}</span></section>
            </div>
            <div className="qimen-door-value"><small>八门</small><strong>{palace.door}</strong></div>
          </div>}
        </article>)}
      </div>
      <div className="qimen-legend"><span><i className="legend-chief" />值符九星</span><span><i className="legend-door" />值使八门</span><span><i className="legend-status" />空亡、马星</span></div>
      <p className="qimen-note">当前按拆补法：以交节定节气，以最近甲、己日为符头分三元；奇门只读取共用四柱结果，不另行修改出生时间。</p>
    </article>
  </section>;
}
