import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, note, icon: Icon, tone }: {
  label: string; value: number | string; note: string; icon: LucideIcon; tone: "blue" | "mint" | "violet";
}) {
  return <article className="stat-card"><div className="stat-card-top"><span>{label}</span><span className={`stat-icon tone-${tone}`}><Icon size={19} /></span></div><div className="stat-value">{value}</div><p className="stat-note">{note}</p></article>;
}
