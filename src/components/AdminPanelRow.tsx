import { useState } from "react";
import type { Panel } from "../lib/types";

interface Props {
  panel: Panel;
  onUpdate: (id: string, patch: Partial<Panel>) => void;
  onDelete: (id: string) => void;
  dragHandlers: {
    draggable: boolean;
    onDragStart: () => void;
    onDragEnter: () => void;
    onDragEnd: () => void;
  };
  isDragging: boolean;
}

export default function AdminPanelRow({ panel, onUpdate, onDelete, dragHandlers, isDragging }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(panel);

  const save = () => {
    onUpdate(panel.id, {
      title: draft.title,
      description: draft.description,
      imageUrl: draft.imageUrl,
      link: draft.link,
      featured: draft.featured,
    });
    setOpen(false);
  };

  return (
    <div
      draggable={dragHandlers.draggable}
      onDragStart={dragHandlers.onDragStart}
      onDragEnter={dragHandlers.onDragEnter}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`rounded-lg border border-border bg-surface transition-opacity ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="cursor-grab select-none font-mono text-muted" title="drag to reorder">
          ⠿
        </span>
        <div className="h-10 w-14 shrink-0 overflow-hidden rounded border border-border bg-bg">
          <img
            src={panel.imageUrl || "/default-panel.svg"}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{panel.title || "Untitled"}</p>
          <p className="truncate font-mono text-xs text-muted">{panel.link || "no link set"}</p>
        </div>
        {panel.featured && (
          <span className="rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            featured
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent"
        >
          {open ? "close" : "edit"}
        </button>
        <button
          onClick={() => onDelete(panel.id)}
          className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-red-400"
        >
          delete
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Description (shown on hover)">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className="input resize-none"
            />
          </Field>
          <Field label="Image URL (leave blank to use the default placeholder)">
            <input
              value={draft.imageUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value || null })}
              placeholder="https://…"
              className="input"
            />
          </Field>
          <Field label="Link (internal path like /project/my-app, or a full https:// URL)">
            <input
              value={draft.link}
              onChange={(e) => setDraft({ ...draft, link: e.target.value })}
              placeholder={`/project/${panel.id}`}
              className="input"
            />
          </Field>
          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              className="accent-accent"
            />
            Featured (takes up 2×2 in the grid)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setDraft(panel);
                setOpen(false);
              }}
              className="font-mono text-xs uppercase tracking-wider text-muted"
            >
              cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-bg"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
