export type ModuleTab = "bazi" | "reverse" | "liuren" | "qimen" | "ziwei";

const tabs: Array<{ id: ModuleTab; label: string }> = [
  { id: "reverse", label: "八字排盘/反排" },
  { id: "bazi", label: "八字" },
  { id: "liuren", label: "六壬" },
  { id: "qimen", label: "奇门" },
  { id: "ziwei", label: "紫微" },
];

export function ModuleTabs({ active, onChange }: { active: ModuleTab; onChange: (tab: ModuleTab) => void }) {
  return <div className="module-tabs" role="tablist" aria-label="术数排盘模块">
    {tabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => onChange(tab.id)} key={tab.id}>{tab.label}</button>)}
  </div>;
}
