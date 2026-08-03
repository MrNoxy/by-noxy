import type { Panel } from "../lib/types";
import PanelCard from "./PanelCard";

export default function PanelGrid({ panels }: { panels: Panel[] }) {
  if (panels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <p className="font-mono text-sm text-muted">
          no projects yet — add one from the admin panel
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 sm:gap-5"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        gridAutoRows: "220px",
      }}
    >
      {panels.map((panel, i) => (
        <PanelCard key={panel.id} panel={panel} index={i} />
      ))}
    </div>
  );
}
