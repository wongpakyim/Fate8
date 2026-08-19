export type ModuleTab = "bazi" | "reverse" | "liuren" | "qimen";

const tabs: Array<{ id: ModuleTab; label: string }> = [
  { id: "bazi", label: "八字" },
  { id: "reverse", label: "八字反排" },
  { id: "liuren", label: "六壬" },
  { id: "qimen", label: "奇门" },
];

export function ModuleTabs({ active, onChange }: { active: ModuleTab; onChange: (tab: ModuleTab) => void }) {
  return <div className="module-tabs" role="tablist" aria-label="术数排盘模块">
    {tabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => onChange(tab.id)} key={tab.id}>{tab.label}</button>)}
  </div>;
}
