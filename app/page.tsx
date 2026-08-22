"use client";

import { useMemo, useState } from "react";
import divisionSource from "@/data/china-divisions.json";
import { formatBirthCode, parseBirthCode } from "@/lib/birth-code.mjs";
import { calculateFourPillars, getAnnualPillar, REVERSE_SEARCH_BASIS, reverseSearchFourPillars } from "@/lib/four-pillars.mjs";
import { formatBaziText, getBaziNodeRelations, getBaziNodeStates } from "@/lib/chart-presentation.mjs";
import { buildReadingSession } from "@/lib/reading-session.mjs";
import { formatLiuRenText } from "@/lib/liu-ren.mjs";
import { formatQiMenText } from "@/lib/qi-men.mjs";
import { BaziNodePanel } from "@/app/components/bazi-node-panel";
import { LiuRenPanel } from "@/app/components/liuren-panel";
import { ModuleTabs, type ModuleTab } from "@/app/components/module-tabs";
import { QiMenPanel } from "@/app/components/qimen-panel";
import { ReversePanel } from "@/app/components/reverse-panel";

type Division = {
  code: string;
  name: string;
  level: string;
  center?: { longitude: number; latitude: number };
  children?: Division[];
};

type FourPillarsCalculation = ReturnType<typeof calculateFourPillars>;
type ReverseResult = ReturnType<typeof reverseSearchFourPillars>;

const divisions = divisionSource as Division[];
const defaultProvinceCode = "440000";
const defaultCityCode = "440100";
const defaultDistrictCode = "440104";
function citiesFor(province?: Division): Division[] {
  if (!province?.children?.length) return province ? [province] : [];
  if (province.children[0].level === "county") {
    return [{ ...province, code: `${province.code}-direct`, children: province.children }];
  }
  return province.children;
}

function districtsFor(city?: Division): Division[] {
  return city?.children?.length ? city.children : city ? [city] : [];
}

function elementClass(element: string) {
  return `element-${({ 木: "wood", 火: "fire", 土: "earth", 金: "metal", 水: "water" } as Record<string, string>)[element]}`;
}

function initialCalculation() {
  return calculateFourPillars({ solarTime: "1992-03-15 14:30", sex: "male", location: "广东省 广州市 越秀区", longitude: 113.267, latitude: 23.129, timezoneOffset: 8 }, { dayBoundary: 23, solarTimeMode: "apparent" });
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ModuleTab>("bazi");
  const [inputMode, setInputMode] = useState<"picker" | "text">("picker");
  const [dateTime, setDateTime] = useState("1992-03-15T14:30");
  const [textTime, setTextTime] = useState("1199203151430");
  const [sex, setSex] = useState("male");
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode);
  const [cityCode, setCityCode] = useState(defaultCityCode);
  const [districtCode, setDistrictCode] = useState(defaultDistrictCode);
  const [manualLongitude, setManualLongitude] = useState(false);
  const [longitudeInput, setLongitudeInput] = useState("113.267");
  const [locationOverride, setLocationOverride] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("8");
  const [dayBoundary, setDayBoundary] = useState<23 | 24>(23);
  const [solarTimeMode, setSolarTimeMode] = useState<"apparent" | "mean" | "none">("apparent");
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [calculation, setCalculation] = useState<FourPillarsCalculation>(initialCalculation);
  const [monthGeneralMode, setMonthGeneralMode] = useState<"auto" | "manual">("auto");
  const [manualMonthGeneral, setManualMonthGeneral] = useState("子");
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [selectedLuck, setSelectedLuck] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copiedPanel, setCopiedPanel] = useState<"bazi" | "liuren" | "qimen" | null>(null);
  const [reverseText, setReverseText] = useState(calculation.fourPillars.text);
  const [reverseStart, setReverseStart] = useState("1000");
  const [reverseEnd, setReverseEnd] = useState("2100");
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null);
  const [reverseError, setReverseError] = useState("");

  const province = divisions.find((item) => item.code === provinceCode) || divisions[0];
  const cities = useMemo(() => citiesFor(province), [province]);
  const city = cities.find((item) => item.code === cityCode) || cities[0];
  const districts = useMemo(() => districtsFor(city), [city]);
  const district = districts.find((item) => item.code === districtCode) || districts[0];
  const locationCenter = district?.center || city?.center || province?.center || { longitude: 120, latitude: 0 };
  const effectiveLongitude = manualLongitude ? Number(longitudeInput) : locationCenter.longitude;
  const placeName = [province?.name, city?.name !== province?.name ? city?.name : null, district?.name !== city?.name ? district?.name : null].filter(Boolean).join(" ");

  function selectProvince(code: string) {
    const nextProvince = divisions.find((item) => item.code === code) || divisions[0];
    const nextCities = citiesFor(nextProvince);
    const nextDistricts = districtsFor(nextCities[0]);
    setProvinceCode(code);
    setCityCode(nextCities[0]?.code || "");
    setDistrictCode(nextDistricts[0]?.code || "");
  }

  function selectCity(code: string) {
    const nextCity = cities.find((item) => item.code === code) || cities[0];
    setCityCode(code);
    setDistrictCode(districtsFor(nextCity)[0]?.code || "");
  }

  function makeCalculation(solarTime: string, chartSex = sex) {
    return calculateFourPillars({ solarTime, sex: chartSex, location: locationOverride ?? (manualLongitude ? "手工经度" : placeName), longitude: effectiveLongitude, latitude: manualLongitude ? undefined : locationCenter.latitude, timezoneOffset: Number(timezone) }, { dayBoundary, solarTimeMode });
  }

  function submitChart(event?: React.FormEvent) {
    event?.preventDefault();
    try {
      if (!Number.isFinite(effectiveLongitude)) throw new Error("请输入有效经度");
      const codedInput = inputMode === "text" ? parseBirthCode(textTime) : null;
      const chartSex = codedInput?.sex || sex;
      const nextCalculation = makeCalculation(codedInput?.solarTime || dateTime.replace("T", " "), chartSex);
      setSex(chartSex);
      if (codedInput) setDateTime(codedInput.solarTime.slice(0, 16).replace(" ", "T"));
      setCalculation(nextCalculation);
      setSelectedNode(null);
      setSelectedPath(null);
      setSelectedLuck(null);
      setInputCollapsed(true);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "排盘失败，请检查输入");
    }
  }

  function useCurrentTime() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDateTime(local);
    setTextTime(formatBirthCode(local, sex));
    setInputMode("picker");
  }

  async function copyPanelText(panel: "bazi" | "liuren" | "qimen", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPanel(panel);
      window.setTimeout(() => setCopiedPanel((current) => current === panel ? null : current), 2200);
    } catch {
      setError("复制失败，请允许浏览器访问剪贴板后重试");
    }
  }

  function downloadResult() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([formatBaziText(result)], { type: "text/plain;charset=utf-8" }));
    link.download = `八字命盘-${result.fourPillars.compact}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function openReverse() {
    setReverseText(result.fourPillars.text);
    setActiveTab("reverse");
    setReverseResult(null);
    setReverseError("");
  }

  function searchReverse(event: React.FormEvent) {
    event.preventDefault();
    try {
      const found = reverseSearchFourPillars(reverseText, { startYear: Number(reverseStart), endYear: Number(reverseEnd), maxResults: 60, dayBoundary, sex });
      setReverseResult(found);
      setReverseError("");
    } catch (caught) {
      setReverseError(caught instanceof Error ? caught.message : "反查失败，请检查八字");
    }
  }

  function applyReverseMatch(solarTime: string) {
    const value = solarTime.replace(" ", "T");
    setDateTime(value);
    setTextTime(formatBirthCode(value, sex));
    setInputMode("picker");
    setManualLongitude(true);
    setLongitudeInput(String(REVERSE_SEARCH_BASIS.longitude));
    setLocationOverride(REVERSE_SEARCH_BASIS.location);
    setTimezone(String(REVERSE_SEARCH_BASIS.timezoneOffset));
    setSolarTimeMode(REVERSE_SEARCH_BASIS.solarTimeMode);
    const nextCalculation = calculateFourPillars({ solarTime, sex, location: REVERSE_SEARCH_BASIS.location, longitude: REVERSE_SEARCH_BASIS.longitude, timezoneOffset: REVERSE_SEARCH_BASIS.timezoneOffset }, { dayBoundary, solarTimeMode: REVERSE_SEARCH_BASIS.solarTimeMode });
    setCalculation(nextCalculation);
    setSelectedNode(null);
    setSelectedPath(null);
    setSelectedLuck(null);
    setInputCollapsed(true);
    setActiveTab("bazi");
    window.setTimeout(() => document.querySelector("#chart")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const session = useMemo(() => buildReadingSession(calculation, { liuRen: { monthGeneral: monthGeneralMode === "manual" ? manualMonthGeneral : undefined }, qiMen: { method: "chai-bu" } }), [calculation, monthGeneralMode, manualMonthGeneral]);
  const result = session.bazi;
  const pillars = [result.fourPillars.year, result.fourPillars.month, result.fourPillars.day, result.fourPillars.hour];
  const baziNodes = getBaziNodeStates(result);
  const nodeRelations = selectedNode == null ? null : getBaziNodeRelations(result, selectedNode);
  const selectedCycle = selectedLuck == null ? null : result.luck.cycles[selectedLuck];
  const annualYears = selectedCycle ? Array.from({ length: 10 }, (_, index) => ({ ...getAnnualPillar(selectedCycle.startYear + index), age: Number((selectedCycle.startAge + index).toFixed(2)) })) : [];
  const liuRen = session.liuRen;
  const qiMen = session.qiMen;

  return (
    <main>
      <header className="topbar">
        <button className="brand brand-button" type="button" onClick={() => setActiveTab("bazi")} aria-label="进入八字排盘"><span className="brand-mark">命</span><span>知命排盘<small>ZI MING</small></span></button>
        <ModuleTabs active={activeTab} onChange={(tab) => tab === "reverse" ? openReverse() : setActiveTab(tab)} />
        <button className="ghost-button" onClick={() => { setActiveTab("bazi"); setInputCollapsed(false); }}>排盘资料</button>
      </header>

      {activeTab === "bazi" && <section className="hero" id="top">
        <div className="eyebrow"><span />青山入墨 · 四柱观时</div>
        <h1>一纸观天时，<em>四柱见山河</em></h1>
        <p>以节气定月、经度校时。于水墨清境中，展开一方清晰、可追溯的八字命盘。</p>
        <div className="hero-badges"><span>太阳视黄经定节气</span><span>真太阳时校正</span><span>23 / 24 时换日</span></div>
      </section>}

      {activeTab === "bazi" && <section className={`workspace ${inputCollapsed ? "input-collapsed" : ""}`} id="chart">
        {inputCollapsed ? <aside className="input-collapsed-rail"><button onClick={() => setInputCollapsed(false)} aria-label="展开排盘资料"><span>排盘</span><small>编辑资料</small></button></aside> : <form className="input-card" onSubmit={submitChart}>
          <div className="section-heading"><div><span className="step">01</span><h2>出生信息</h2></div><div className="input-heading-actions"><span className="required">阳历输入</span><div className="input-suspend" role="button" tabIndex={0} onClick={() => setInputCollapsed(true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setInputCollapsed(true); }}>挂起</div></div></div>
          <div className="segmented" role="tablist" aria-label="输入方式">
            <button type="button" className={inputMode === "picker" ? "selected" : ""} onClick={() => setInputMode("picker")}>日期选择</button>
            <button type="button" className={inputMode === "text" ? "selected" : ""} onClick={() => setInputMode("text")}>文字输入</button>
          </div>

          <div className="form-grid">
            {inputMode === "picker" ? <label className="wide datetime-field"><span className="datetime-label-row">阳历出生时间<button type="button" onClick={useCurrentTime}>现在</button></span><input type="datetime-local" required min="1000-01-01T00:00" max="2100-12-31T23:59" value={dateTime} onChange={(event) => { const value = event.target.value; setDateTime(value); if (value) setTextTime(formatBirthCode(value, sex)); }} /></label> : <label className="wide text-input">性别码 + 阳历时间<input inputMode="numeric" autoComplete="off" value={textTime} onChange={(event) => { const value = event.target.value; setTextTime(value); const code = value.trim()[0]; if (code === "0" || code === "1") setSex(code === "0" ? "female" : "male"); }} placeholder="如：0201903010856" /><small>0 女 · 1 男，后接 yyyyMMddHHmm，秒数自动按 00 计算</small></label>}
            <label>性别<select value={sex} onChange={(event) => { const nextSex = event.target.value; setSex(nextSex); setTextTime((current) => current.replace(/^(\s*)[01]/, `$1${nextSex === "female" ? "0" : "1"}`)); }}><option value="female">女 · 坤造 · 0</option><option value="male">男 · 乾造 · 1</option></select></label>
            <label>时区<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="8">UTC+8 北京</option><option value="7">UTC+7</option><option value="9">UTC+9</option><option value="0">UTC±0</option></select></label>
          </div>

          <div className="divider" />
          <div className="field-title-row"><span className="field-label">出生地</span><button type="button" className="text-button" onClick={() => { setLocationOverride(null); setManualLongitude((value) => !value); }}>{manualLongitude ? "使用行政区" : "直接输入经度"}</button></div>
          {!manualLongitude ? <>
            <div className="location-row">
              <select aria-label="省份" value={province.code} onChange={(event) => { setLocationOverride(null); selectProvince(event.target.value); }}>{divisions.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
              <select aria-label="地级市" value={city?.code} onChange={(event) => { setLocationOverride(null); selectCity(event.target.value); }}>{cities.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
              <select aria-label="区县" value={district?.code} onChange={(event) => { setLocationOverride(null); setDistrictCode(event.target.value); }}>{districts.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
            </div>
            <div className="location-meta"><span>东经 {locationCenter.longitude?.toFixed(3)}°</span><span>北纬 {locationCenter.latitude?.toFixed(3)}°</span><span className="data-count">3,209 个行政区</span></div>
          </> : <div className="manual-longitude"><label>经度（东经为正）<input type="number" min="-180" max="180" step="0.001" value={longitudeInput} onChange={(event) => { setLocationOverride(null); setLongitudeInput(event.target.value); }} /></label>{locationOverride === REVERSE_SEARCH_BASIS.location ? <p><strong>省 / 地级市 / 县：反排</strong><br />出生地按“反排”记录，固定使用东经 120° 标准时。</p> : <p>例：广州 113.27，北京 116.41。可输入出生医院的精确经度。</p>}</div>}

          <details className="settings">
            <summary>排盘口径设置 <span>{solarTimeMode === "apparent" ? "真太阳时" : solarTimeMode === "mean" ? "地方平太阳时" : "标准时"} · {dayBoundary}时换日</span></summary>
            <div className="settings-grid">
              <label>换日规则<select value={dayBoundary} onChange={(event) => setDayBoundary(Number(event.target.value) as 23 | 24)}><option value="23">23 时（子初）换日</option><option value="24">24 时（午夜）换日</option></select></label>
              <label>校时方式<select value={solarTimeMode} onChange={(event) => setSolarTimeMode(event.target.value as typeof solarTimeMode)}><option value="apparent">真太阳时（经度 + 均时差）</option><option value="mean">地方平太阳时（仅经度）</option><option value="none">标准时（不校正）</option></select></label>
            </div>
          </details>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit">开始排盘 <span>→</span></button>
          <p className="privacy">仅在当前浏览器内计算，不上传或保存出生信息</p>
        </form>}

        <article className="chart-card" aria-live="polite">
          <div className="chart-head">
            <div><span className="step">02</span><h2>四柱命盘</h2><span className="chart-code">{result.fourPillars.compact}</span></div>
            <div className="chart-actions"><button type="button" onClick={() => copyPanelText("bazi", formatBaziText(result))}>{copiedPanel === "bazi" ? "盘面信息已复制" : "复制文字简排"}</button><button type="button" onClick={downloadResult}>下载</button></div>
          </div>
          <div className="profile-strip">
            <div><small>命造</small><strong>{result.input.sex === "female" ? "坤造" : "乾造"}</strong></div>
            <div><small>公历标准时</small><strong>{result.time.standard.slice(0, 16)}</strong></div>
            <div><small>真太阳时</small><strong>{result.time.trueSolar.slice(0, 16)}</strong></div>
            <div><small>生肖</small><strong>{result.profile.zodiac}</strong></div>
          </div>
          <div className="time-note"><span>校时 {result.time.correctionMinutes > 0 ? "+" : ""}{result.time.correctionMinutes} 分</span><span>{result.input.location || "手工经度"}</span><span>经度 {result.input.longitude.toFixed(3)}°</span><span>{result.profile.monthCommand}</span></div>

          <div className="pillars" aria-label="四柱命盘">
            <div className="pillar-labels"><span>十神·六亲</span><span>天干·五行</span><span>地支·五行</span><span>藏干十神</span><span>纳音</span><span>十二长生</span><span>神煞</span></div>
            {pillars.map((pillar, index) => (
              <div className={`pillar ${index === 2 ? "day-master" : ""}`} key={pillar.label}>
                <span className="pillar-title">{pillar.label}{index === 2 && <i>命主</i>}</span>
                <span className="god"><b>{pillar.stem.tenGod}</b><small>{pillar.stem.sixKin}</small></span>
                <button type="button" className={`stem chart-character ${elementClass(pillar.stem.element)} ${selectedNode === index ? "selected" : ""}`} onClick={() => setSelectedNode(selectedNode === index ? null : index)} aria-pressed={selectedNode === index}><small>{pillar.stem.polarity}{pillar.stem.element}</small><b>{pillar.stem.name}</b><span>月令{baziNodes[index].monthStatus} · {baziNodes[index].monthGrowth}</span></button>
                <button type="button" className={`branch chart-character ${elementClass(pillar.branch.element)} ${selectedNode === index + 4 ? "selected" : ""}`} onClick={() => setSelectedNode(selectedNode === index + 4 ? null : index + 4)} aria-pressed={selectedNode === index + 4}><small>{pillar.branch.zodiac} · {pillar.branch.element}</small><b>{pillar.branch.name}</b><span>月令{baziNodes[index + 4].monthStatus} · 本气{baziNodes[index + 4].mainQi.name}{baziNodes[index + 4].monthGrowth}</span></button>
                <span className="hidden">{pillar.branch.hiddenStems.map((hidden) => <b key={hidden.name}>{hidden.name}<i>{hidden.tenGod}</i><em>{hidden.sixKin}</em></b>)}</span>
                <span className="nayin">{pillar.naYin}</span>
                <span className="growth-stage">{pillar.growthStage}</span>
                <span className="shensha">{pillar.shenSha.length ? pillar.shenSha.map((star) => <b key={star}>{star}</b>) : "—"}</span>
              </div>
            ))}
          </div>

          {nodeRelations && <section className="chart-relation-panel" aria-live="polite">
            <header><div><small>动态信息 · 八字对比矩阵</small><strong>{nodeRelations.target.meta}{nodeRelations.target.char}</strong><span>以 {nodeRelations.reference.source}「{nodeRelations.reference.name}{nodeRelations.reference.element}」为参照 · 上排四干，下排四支</span></div><button type="button" onClick={() => setSelectedNode(null)}>关闭</button></header>
            <div className="node-relation-grid">
              {nodeRelations.relations.map((relation) => <article className={relation.isSelf ? "self" : ""} key={relation.id}>
                <div><small>{relation.meta} · {relation.element}</small><strong className={elementClass(relation.element)}>{relation.char}</strong>{relation.isSelf && <em>自身</em>}</div>
                <p>{relation.kind === "stem" ? <><b>十神·六亲</b><span>{relation.tenGod} · {relation.sixKin}</span></> : <><b>本气关系</b><span>{relation.mainQi.name}{relation.mainQiTenGod} · {relation.mainQiSixKin}</span></>}</p>
                <p><b>藏干关系</b><span>{relation.kind === "branch" ? relation.hiddenTenGods.map((hidden) => `${hidden.name}${hidden.tenGod}（${hidden.sixKin}）`).join("、") : "—"}</span></p>
                <p><b>十二长生</b><span>{relation.relationGrowth}</span></p>
                <p><b>月令旺衰</b><span>{relation.monthStatus}</span></p>
                <p><b>神煞</b><span>{relation.kind === "branch" ? relation.shenSha.join("、") || "无" : "—"}</span></p>
              </article>)}
            </div>
          </section>}

        </article>
      </section>}

      {activeTab === "liuren" && <LiuRenPanel result={liuRen} mode={monthGeneralMode} manualMonthGeneral={manualMonthGeneral} copied={copiedPanel === "liuren"} onCopy={() => copyPanelText("liuren", formatLiuRenText(liuRen))} onModeChange={setMonthGeneralMode} onMonthGeneralChange={setManualMonthGeneral} />}

      {activeTab === "qimen" && <QiMenPanel result={qiMen} dayPillar={calculation.fourPillars.day.value} hourPillar={calculation.fourPillars.hour.value} copied={copiedPanel === "qimen"} onCopy={() => copyPanelText("qimen", formatQiMenText(qiMen))} />}

      {activeTab === "bazi" && <section className="detail-section luck-only">
        <div className="detail-heading"><span className="step">运</span><div><h2>大运流年</h2><p>点击任一大运，展开该运十个流年</p></div></div>
        <article className="luck-card"><header><div><span>{result.luck.direction}</span><small>约 {result.luck.startAge} 岁起运 · 据 {result.luck.basisTerm}</small></div><p>{result.luck.note}</p></header><div className="luck-timeline">{result.luck.cycles.map((cycle, index) => <button type="button" className={selectedLuck === index ? "selected" : ""} onClick={() => setSelectedLuck(selectedLuck === index ? null : index)} aria-expanded={selectedLuck === index} key={cycle.order}><small>{cycle.startYear}</small><strong>{cycle.pillar}</strong><span>{cycle.startAge} 岁</span><em>{cycle.naYin}</em><i>{selectedLuck === index ? "收起" : "看流年"}</i></button>)}</div>
          {selectedCycle && <section className="annual-drawer"><header><div><strong>{selectedCycle.pillar}大运 · 十年流年</strong><span>{selectedCycle.startYear}—{selectedCycle.startYear + 9}</span></div><small>流年以当年立春为干支交接</small></header><div className="annual-grid">{annualYears.map((annual) => <div key={annual.year}><small>{annual.year}</small><strong>{annual.value}</strong><span>{annual.age} 岁</span><em>{annual.naYin}</em></div>)}</div></section>}
        </article>
      </section>}

      {activeTab === "bazi" && <section className="reverse-teaser" id="reverse">
        <span className="seal">反</span><div><small>已有八字，寻找出生时刻？</small><h2>八字反查 · 横跨千年寻时</h2><p>按年、月、日、时四柱筛选真实阳历时间，支持经度与换日口径复核。</p></div><button onClick={openReverse}>进入反查 <span>1000—2100</span></button>
      </section>}

      {activeTab === "bazi" && <section className="detail-section node-only">
        <div className="detail-heading"><span className="step">点</span><div><h2>八字节点</h2><p>按起始节点查看相邻三节点正交路径</p></div></div>
        <BaziNodePanel nodes={baziNodes} selectedPath={selectedPath} onSelectPath={setSelectedPath} />
      </section>}

      {activeTab === "reverse" && <ReversePanel text={reverseText} start={reverseStart} end={reverseEnd} result={reverseResult} error={reverseError} onTextChange={setReverseText} onStartChange={setReverseStart} onEndChange={setReverseEnd} onSearch={searchReverse} onApply={applyReverseMatch} />}

      {copiedPanel && <div className="copy-toast" role="status">盘面信息已复制，可在其他地方直接粘贴</div>}
      <footer><button className="brand brand-button" type="button" onClick={() => setActiveTab("bazi")}><span className="brand-mark">命</span><span>知命排盘<small>ZI MING</small></span></button><p>历法工具用于传统文化研究与个人参考，不构成医疗、法律、投资或人生决策建议。</p><span>Modules v0.4.0</span></footer>
    </main>
  );
}
