import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { useSiteConfig } from "../lib/useSiteConfig";
import { usePanels } from "../lib/usePanels";
import { themes } from "../lib/themes";
import AdminPanelRow from "../components/AdminPanelRow";
import type { Panel } from "../lib/types";

export default function Admin() {
  const { logout } = useAuth();
  const { config, updateConfig } = useSiteConfig();
  const { panels, addPanel, updatePanel, deletePanel, reorderPanels } = usePanels();

  const [tab, setTab] = useState<"site" | "panels">("panels");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-sm font-semibold text-text">Admin</span>
            <nav className="flex gap-4 font-mono text-xs uppercase tracking-wider">
              <button
                onClick={() => setTab("panels")}
                className={tab === "panels" ? "text-accent" : "text-muted"}
              >
                Projects
              </button>
              <button
                onClick={() => setTab("site")}
                className={tab === "site" ? "text-accent" : "text-muted"}
              >
                Site
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-muted">
            <Link to="/" className="transition-colors hover:text-accent">
              view site
            </Link>
            <button onClick={() => logout()} className="transition-colors hover:text-accent">
              sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {tab === "panels" ? (
          <PanelsTab
            panels={panels}
            addPanel={addPanel}
            updatePanel={updatePanel}
            deletePanel={deletePanel}
            reorderPanels={reorderPanels}
          />
        ) : (
          <SiteTab config={config} updateConfig={updateConfig} />
        )}
      </main>
    </div>
  );
}

function PanelsTab({
  panels,
  addPanel,
  updatePanel,
  deletePanel,
  reorderPanels,
}: {
  panels: Panel[];
  addPanel: (p: Omit<Panel, "id">) => Promise<string | null>;
  updatePanel: (id: string, patch: Partial<Panel>) => Promise<void>;
  deletePanel: (id: string) => Promise<void>;
  reorderPanels: (ids: string[]) => Promise<void>;
}) {
  const dragIndex = useRef<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const orderedIds = localOrder ?? panels.map((p) => p.id);
  const ordered = orderedIds
    .map((id) => panels.find((p) => p.id === id))
    .filter((p): p is Panel => Boolean(p));

  const handleAdd = async () => {
    await addPanel({
      title: "New project",
      description: "A short description of what this project is.",
      imageUrl: null,
      link: "",
      order: panels.length,
      featured: false,
      createdAt: Date.now(),
    });
  };

  const onDragStart = (index: number, id: string) => {
    dragIndex.current = index;
    setDragId(id);
  };

  const onDragEnter = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...orderedIds];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = index;
    setLocalOrder(next);
  };

  const onDragEnd = async () => {
    setDragId(null);
    dragIndex.current = null;
    if (localOrder) {
      await reorderPanels(localOrder);
      setLocalOrder(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-text">Projects</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            drag the handle to reorder · order here is the order shown on the site
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-bg"
        >
          + Add project
        </button>
      </div>

      <div className="space-y-2">
        {ordered.map((panel, i) => (
          <AdminPanelRow
            key={panel.id}
            panel={panel}
            onUpdate={updatePanel}
            onDelete={deletePanel}
            isDragging={dragId === panel.id}
            dragHandlers={{
              draggable: true,
              onDragStart: () => onDragStart(i, panel.id),
              onDragEnter: () => onDragEnter(i),
              onDragEnd,
            }}
          />
        ))}
        {ordered.length === 0 && (
          <p className="py-12 text-center font-mono text-xs text-muted">
            no projects yet — add your first one above
          </p>
        )}
      </div>
    </div>
  );
}

function SiteTab({
  config,
  updateConfig,
}: {
  config: ReturnType<typeof useSiteConfig>["config"];
  updateConfig: ReturnType<typeof useSiteConfig>["updateConfig"];
}) {
  const [draft, setDraft] = useState(config);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await updateConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-lg space-y-8">
      <section>
        <h1 className="font-display text-lg font-semibold text-text">Site</h1>
        <p className="mt-1 font-mono text-xs text-muted">name, tagline, photo and links</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Name (shown in the intro animation)
            </label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Tagline
            </label>
            <input
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Profile picture URL
            </label>
            <input
              value={draft.pfpUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, pfpUrl: e.target.value || null })}
              placeholder="https://…"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                GitHub
              </label>
              <input
                value={draft.socials.github ?? ""}
                onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, github: e.target.value } })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Twitter / X
              </label>
              <input
                value={draft.socials.twitter ?? ""}
                onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, twitter: e.target.value } })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                LinkedIn
              </label>
              <input
                value={draft.socials.linkedin ?? ""}
                onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, linkedin: e.target.value } })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Email
              </label>
              <input
                value={draft.socials.email ?? ""}
                onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, email: e.target.value } })}
                className="input"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-base font-semibold text-text">Theme</h2>
        <p className="mt-1 font-mono text-xs text-muted">pick a palette for the whole site</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setDraft({ ...draft, themeId: t.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                draft.themeId === t.id ? "border-accent" : "border-border"
              }`}
              style={{ background: `rgb(${t.colors.surface})` }}
            >
              <div className="flex gap-1.5">
                <span
                  className="h-5 w-5 rounded-full border border-white/10"
                  style={{ background: `rgb(${t.colors.bg})` }}
                />
                <span
                  className="h-5 w-5 rounded-full border border-white/10"
                  style={{ background: `rgb(${t.colors.accent})` }}
                />
              </div>
              <p className="mt-2 font-mono text-xs" style={{ color: `rgb(${t.colors.text})` }}>
                {t.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
      >
        {saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}
