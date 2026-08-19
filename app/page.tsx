"use client";

import { useEffect, useMemo, useState } from "react";
import divisionSource from "@/data/china-divisions.json";
import { calculateBazi, formatBaziText, reverseSearchBazi } from "@/lib/bazi.mjs";

type Division = {
  code: string;
  name: string;
  level: string;
  center?: { longitude: number; latitude: number };
  children?: Division[];
};

type Chart = ReturnType<typeof calculateBazi>;
type ReverseResult = ReturnType<typeof reverseSearchBazi>;

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

function initialChart() {
  return calculateBazi({ solarTime: "1992-03-15 14:30", sex: "male", location: "广东省 广州市 越秀区", longitude: 113.267, latitude: 23.129, timezoneOffset: 8 }, { dayBoundary: 23, solarTimeMode: "apparent" });
}

export default function Home() {
  const [inputMode, setInputMode] = useState<"picker" | "text">("picker");
  const [dateTime, setDateTime] = useState("1992-03-15T14:30");
  const [textTime, setTextTime] = useState("1992年3月15日 14:30");
  const [sex, setSex] = useState("male");
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode);
  const [cityCode, setCityCode] = useState(defaultCityCode);
  const [districtCode, setDistrictCode] = useState(defaultDistrictCode);
  const [manualLongitude, setManualLongitude] = useState(false);
  const [longitudeInput, setLongitudeInput] = useState("113.267");
  const [timezone, setTimezone] = useState("8");
  const [dayBoundary, setDayBoundary] = useState<23 | 24>(23);
  const [solarTimeMode, setSolarTimeMode] = useState<"apparent" | "mean" | "none">("apparent");
  const [result, setResult] = useState<Chart>(initialChart);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseText, setReverseText] = useState(initialChart().fourPillars.text);
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

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setReverseOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

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

  function makeChart(solarTime: string) {
    return calculateBazi({ solarTime, sex, location: manualLongitude ? "手工经度" : placeName, longitude: effectiveLongitude, latitude: manualLongitude ? undefined : locationCenter.latitude, timezoneOffset: Number(timezone) }, { dayBoundary, solarTimeMode });
  }

  function submitChart(event?: React.FormEvent) {
    event?.preventDefault();
    try {
      if (!Number.isFinite(effectiveLongitude)) throw new Error("请输入有效经度");
      setResult(makeChart(inputMode === "picker" ? dateTime.replace("T", " ") : textTime));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "排盘失败，请检查输入");
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(formatBaziText(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
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
    setReverseOpen(true);
    setReverseResult(null);
    setReverseError("");
  }

  function searchReverse(event: React.FormEvent) {
    event.preventDefault();
    try {
      const found = reverseSearchBazi(reverseText, { startYear: Number(reverseStart), endYear: Number(reverseEnd), maxResults: 60, longitude: effectiveLongitude, timezoneOffset: Number(timezone), dayBoundary, solarTimeMode, sex });
      setReverseResult(found);
      setReverseError("");
    } catch (caught) {
      setReverseError(caught instanceof Error ? caught.message : "反查失败，请检查八字");
    }
  }

  function useReverseMatch(solarTime: string) {
    const value = solarTime.replace(" ", "T");
    setDateTime(value);
    setInputMode("picker");
    setResult(makeChart(solarTime));
    setReverseOpen(false);
    window.setTimeout(() => document.querySelector("#chart")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const pillars = [result.fourPillars.year, result.fourPillars.month, result.fourPillars.day, result.fourPillars.hour];

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="知命排盘首页"><span className="brand-mark">命</span><span>知命排盘<small>ZI MING</small></span></a>
        <nav aria-label="页面导航">
          <a className="active" href="#chart">四柱排盘</a>
          <button className="nav-link" onClick={openReverse}>八字反查</button>
          <a href="#guide">算法说明</a>
        </nav>
        <button className="ghost-button" onClick={() => document.querySelector("#developer")?.scrollIntoView({ behavior: "smooth" })}>开发者接入</button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span />东方时间智慧 · 专业四柱推演</div>
        <h1>一刻出生时，<em>四柱见天地</em></h1>
        <p>以节气定月、经度校时。输入阳历出生信息，生成清晰、可追溯的八字命盘。</p>
        <div className="hero-badges"><span>太阳视黄经定节气</span><span>真太阳时校正</span><span>23 / 24 时换日</span></div>
      </section>

      <section className="workspace" id="chart">
        <form className="input-card" onSubmit={submitChart}>
          <div className="section-heading"><div><span className="step">01</span><h2>出生信息</h2></div><span className="required">阳历输入</span></div>
          <div className="segmented" role="tablist" aria-label="输入方式">
            <button type="button" className={inputMode === "picker" ? "selected" : ""} onClick={() => setInputMode("picker")}>日期选择</button>
            <button type="button" className={inputMode === "text" ? "selected" : ""} onClick={() => setInputMode("text")}>文字输入</button>
          </div>

          {inputMode === "picker" ? (
            <div className="form-grid">
              <label className="wide">阳历出生时间<input type="datetime-local" min="1000-01-01T00:00" max="2100-12-31T23:59" value={dateTime} onChange={(event) => setDateTime(event.target.value)} /></label>
              <label>性别<select value={sex} onChange={(event) => setSex(event.target.value)}><option value="male">男 · 乾造</option><option value="female">女 · 坤造</option></select></label>
              <label>时区<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="8">UTC+8 北京</option><option value="7">UTC+7</option><option value="9">UTC+9</option><option value="0">UTC±0</option></select></label>
            </div>
          ) : (
            <label className="text-input">阳历时间字符串<input value={textTime} onChange={(event) => setTextTime(event.target.value)} placeholder="如：1992年3月15日 14:30" /></label>
          )}

          <div className="divider" />
          <div className="field-title-row"><label className="field-label">出生地</label><button type="button" className="text-button" onClick={() => setManualLongitude((value) => !value)}>{manualLongitude ? "使用行政区" : "直接输入经度"}</button></div>
          {!manualLongitude ? <>
            <div className="location-row">
              <select aria-label="省份" value={province.code} onChange={(event) => selectProvince(event.target.value)}>{divisions.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
              <select aria-label="地级市" value={city?.code} onChange={(event) => selectCity(event.target.value)}>{cities.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
              <select aria-label="区县" value={district?.code} onChange={(event) => setDistrictCode(event.target.value)}>{districts.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
            </div>
            <div className="location-meta"><span>东经 {locationCenter.longitude?.toFixed(3)}°</span><span>北纬 {locationCenter.latitude?.toFixed(3)}°</span><span className="data-count">3,209 个行政区</span></div>
          </> : <div className="manual-longitude"><label>经度（东经为正）<input type="number" min="-180" max="180" step="0.001" value={longitudeInput} onChange={(event) => setLongitudeInput(event.target.value)} /></label><p>例：广州 113.27，北京 116.41。可输入出生医院的精确经度。</p></div>}

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
        </form>

        <article className="chart-card" aria-live="polite">
          <div className="chart-head">
            <div><span className="step">02</span><h2>四柱命盘</h2><span className="chart-code">{result.fourPillars.compact}</span></div>
            <div className="chart-actions"><button type="button" onClick={copyResult}>{copied ? "已复制" : "复制"}</button><button type="button" onClick={downloadResult}>下载</button></div>
          </div>
          <div className="profile-strip">
            <div><small>命造</small><strong>{result.input.sex === "female" ? "坤造" : "乾造"}</strong></div>
            <div><small>公历标准时</small><strong>{result.time.standard.slice(0, 16)}</strong></div>
            <div><small>真太阳时</small><strong>{result.time.trueSolar.slice(0, 16)}</strong></div>
            <div><small>生肖</small><strong>{result.profile.zodiac}</strong></div>
          </div>
          <div className="time-note"><span>校时 {result.time.correctionMinutes > 0 ? "+" : ""}{result.time.correctionMinutes} 分</span><span>{result.input.location || "手工经度"}</span><span>经度 {result.input.longitude.toFixed(3)}°</span><span>{result.profile.monthCommand}</span></div>

          <div className="pillars" aria-label="四柱命盘">
            <div className="pillar-labels"><span>十神</span><span>天干</span><span>地支</span><span>藏干</span><span>纳音</span></div>
            {pillars.map((pillar, index) => (
              <div className={`pillar ${index === 2 ? "day-master" : ""}`} key={pillar.label}>
                <span className="pillar-title">{pillar.label}{index === 2 && <i>命主</i>}</span>
                <span className="god">{pillar.stem.tenGod}</span>
                <strong className={`stem ${elementClass(pillar.stem.element)}`}><small>{pillar.stem.polarity}{pillar.stem.element}</small>{pillar.stem.name}</strong>
                <strong className={`branch ${elementClass(pillar.branch.element)}`}><small>{pillar.branch.zodiac}</small>{pillar.branch.name}</strong>
                <span className="hidden">{pillar.branch.hiddenStems.map((hidden) => <b key={hidden.name}>{hidden.name}<i>{hidden.tenGod}</i></b>)}</span>
                <span className="nayin">{pillar.naYin}<small>{pillar.growthStage}</small></span>
              </div>
            ))}
          </div>

          <div className="insight-grid">
            <section className="element-panel"><div className="panel-title"><small>五行权重</small><span>日主 {result.profile.elements.dayMaster} · {result.profile.elements.strength}</span></div>
              <div className="element-bars">{Object.entries(result.profile.elements.percentages).map(([element, percentage]) => <div key={element}><span>{element}</span><i><b className={elementClass(element)} style={{ width: `${percentage}%` }} /></i><em>{percentage}%</em></div>)}</div>
              <p>基础喜用倾向：<strong>{result.profile.elements.favorableElements.join("、")}</strong></p>
            </section>
            <section className="term-panel"><small>节气定位</small><div><b>{result.profile.solarTerms.previous.name}</b><span>已过 {result.profile.solarTerms.previous.daysAway} 日</span></div><i>→</i><div><b>{result.profile.solarTerms.next.name}</b><span>还有 {result.profile.solarTerms.next.daysAway} 日</span></div><p>以太阳视黄经交节点定年、定月</p></section>
          </div>
        </article>
      </section>

      <section className="detail-section">
        <div className="detail-heading"><span className="step">03</span><div><h2>命盘详解</h2><p>原局结构、关系与大运一览</p></div><span className="method-chip">基础量化版</span></div>
        <div className="detail-grid">
          <article className="detail-card relation-card"><header><span>干支关系</span><small>合 · 冲 · 害</small></header><ul>{result.profile.relations.map((relation) => <li key={relation}><span>◆</span>{relation}</li>)}</ul><p>{result.profile.elements.note}</p></article>
          <article className="detail-card table-card"><header><span>柱位细目</span><small>空亡 · 长生 · 纳音</small></header><div className="detail-table"><div><b>柱位</b><b>干支</b><b>空亡</b><b>十二长生</b></div>{pillars.map((pillar) => <div key={pillar.label}><span>{pillar.label}</span><strong>{pillar.value}</strong><span>{pillar.voidBranches}</span><span>{pillar.growthStage}</span></div>)}</div></article>
        </div>
        <article className="luck-card"><header><div><span>大运排布</span><small>{result.luck.direction} · 约 {result.luck.startAge} 岁起运 · 据 {result.luck.basisTerm}</small></div><p>{result.luck.note}</p></header><div className="luck-timeline">{result.luck.cycles.map((cycle) => <div key={cycle.order}><small>{cycle.startYear}</small><strong>{cycle.pillar}</strong><span>{cycle.startAge} 岁</span><em>{cycle.naYin}</em></div>)}</div></article>
      </section>

      <section className="reverse-teaser" id="reverse">
        <span className="seal">反</span><div><small>已有八字，寻找出生时刻？</small><h2>八字反查 · 横跨千年寻时</h2><p>按年、月、日、时四柱筛选真实阳历时间，支持经度与换日口径复核。</p></div><button onClick={openReverse}>进入反查 <span>1000—2100</span></button>
      </section>

      <section className="guide-section" id="guide">
        <div className="guide-copy"><span className="eyebrow">CALCULATION NOTES</span><h2>每一步，都说明怎么算</h2><p>年柱以立春为界，月柱以十二节为界；日柱依据延伸公历儒略日序，时柱依据校正后的地方时间。真太阳时由经度差和均时差共同校正。</p><div className="notice-box">临近节气、换日或时辰交界的命例，建议在高精度历书中二次复核。公元 1582 年以前按延伸公历解释，不还原出生地历史历法。</div></div>
        <div className="formula-card"><div><small>地方时校正</small><strong>4 ×（经度 − 时区中央经线）</strong><span>再叠加当日均时差</span></div><div><small>起运年龄</small><strong>所距节气天数 ÷ 3</strong><span>三日折一年基础口径</span></div><div><small>反查范围</small><strong>公元 1000 — 2100</strong><span>先按六十甲子筛选，再逐日复算</span></div></div>
      </section>

      <section className="developer-section" id="developer">
        <div className="developer-head"><div><span className="step">API</span><h2>同一核心，三种接入方式</h2></div><p>Web、HTTP API 与命令行共用同一个历法核心，结果结构一致，方便嵌入更大的应用。</p></div>
        <div className="developer-grid">
          <article><span>01 · ESM 模块</span><pre><code>{`import { calculateBazi } from "./lib/bazi.mjs";\n\nconst chart = calculateBazi({\n  solarTime: "1992-03-15 14:30",\n  longitude: 113.27\n});`}</code></pre></article>
          <article><span>02 · HTTP JSON</span><pre><code>{`POST /api/bazi\nContent-Type: application/json\n\n{\n  "solarTime": "1992年3月15日 14:30",\n  "longitude": 113.27,\n  "format": "json"\n}`}</code></pre></article>
          <article><span>03 · 命令行 / 文件</span><pre><code>{`npm run bazi -- \\\n  --input examples/birth.json \\\n  --format text \\\n  --out result.txt`}</code></pre></article>
        </div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark">命</span><span>知命排盘<small>ZI MING</small></span></a><p>历法工具用于传统文化研究与个人参考，不构成医疗、法律、投资或人生决策建议。</p><span>Core v0.1.0</span></footer>

      {reverseOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setReverseOpen(false)}>
        <section className="reverse-modal" role="dialog" aria-modal="true" aria-labelledby="reverse-title">
          <button className="modal-close" aria-label="关闭" onClick={() => setReverseOpen(false)}>×</button>
          <div className="modal-heading"><span className="seal">反</span><div><small>REVERSE LOOKUP</small><h2 id="reverse-title">八字反查出生时刻</h2><p>输入四柱八个字，在公元 1000–2100 年间寻找实际匹配的阳历时间。</p></div></div>
          <form onSubmit={searchReverse}>
            <label>四柱八字<input autoFocus value={reverseText} onChange={(event) => setReverseText(event.target.value)} placeholder="壬申 癸卯 庚寅 癸未" /></label>
            <div className="range-row"><label>起始年份<input type="number" min="1000" max="2100" value={reverseStart} onChange={(event) => setReverseStart(event.target.value)} /></label><span>至</span><label>结束年份<input type="number" min="1000" max="2100" value={reverseEnd} onChange={(event) => setReverseEnd(event.target.value)} /></label><button className="primary-button" type="submit">开始反查</button></div>
          </form>
          {reverseError && <p className="error-message">{reverseError}</p>}
          {reverseResult && <div className="reverse-results"><div className="results-head"><strong>找到 {reverseResult.total} 个代表时刻</strong><span>{reverseResult.range[0]} — {reverseResult.range[1]}</span></div>{reverseResult.matches.length ? <div className="match-list">{reverseResult.matches.map((match) => <button key={match.solarTime} onClick={() => useReverseMatch(match.solarTime)}><span><strong>{match.solarTime}</strong><small>真太阳时 {match.trueSolarTime.slice(11)} · {match.month}</small></span><b>{match.fourPillars}</b><i>采用 →</i></button>)}</div> : <div className="empty-result">没有找到匹配时刻。请检查四柱顺序、时间范围与排盘口径。</div>}<p>{reverseResult.notice}</p></div>}
        </section>
      </div>}
    </main>
  );
}
