type ChartTimeControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
};

export function ChartTimeControls({ onPrevious, onNext }: ChartTimeControlsProps) {
  return <div className="chart-time-controls" aria-label="切换排盘时辰">
    <button type="button" onClick={onPrevious}>← 上一个时辰</button>
    <button type="button" onClick={onNext}>下一个时辰 →</button>
  </div>;
}
