import type { FormEvent } from "react";
import { reverseSearchFourPillars } from "@/lib/four-pillars.mjs";

type ReverseResult = ReturnType<typeof reverseSearchFourPillars>;

export function ReversePanel({ text, start, end, result, error, onTextChange, onStartChange, onEndChange, onSearch, onApply }: {
  text: string;
  start: string;
  end: string;
  result: ReverseResult | null;
  error: string;
  onTextChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSearch: (event: FormEvent) => void;
  onApply: (solarTime: string) => void;
}) {
  return <section className="reverse-page module-page" id="reverse-page">
    <div className="detail-heading"><span className="step">反</span><div><h2>八字反排</h2><p>输入四柱八个字，在公元 1000–2100 年间寻找匹配的阳历日期与标准时辰区间</p></div></div>
    <article className="reverse-workbench">
      <div className="modal-heading"><span className="seal">反</span><div><small>REVERSE LOOKUP</small><h2>八字反查出生时刻</h2><p>固定按东经 120°、UTC+8 标准时反排；出生地及省、市、县统一记为“反排”。</p></div></div>
      <form onSubmit={onSearch}>
        <label>四柱八字<input value={text} onChange={(event) => onTextChange(event.target.value)} placeholder="壬申 癸卯 庚寅 癸未" /></label>
        <div className="range-row"><label>起始年份<input type="number" min="1000" max="2100" value={start} onChange={(event) => onStartChange(event.target.value)} /></label><span>至</span><label>结束年份<input type="number" min="1000" max="2100" value={end} onChange={(event) => onEndChange(event.target.value)} /></label><button className="primary-button" type="submit">开始反查</button></div>
      </form>
      {error && <p className="error-message">{error}</p>}
      {result && <div className="reverse-results"><div className="results-head"><strong>找到 {result.total} 个时间区间</strong><span>{result.range[0]} — {result.range[1]}</span></div>{result.matches.length ? <div className="match-list">{result.matches.map((match) => <button key={match.timeRange} onClick={() => onApply(match.solarTime)}><span><strong>{match.timeRange}</strong><small>采用时刻 {match.solarTime} · {match.month} · 反排 / 东经 120°</small></span><b>{match.fourPillars}</b><i>采用 →</i></button>)}</div> : <div className="empty-result">没有找到匹配区间。请检查四柱顺序和搜索年份范围。</div>}<p>{result.notice}</p></div>}
    </article>
  </section>;
}
