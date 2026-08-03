import { useEffect, useState } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { db } from "./firebase";
import type { Panel } from "./types";

export function usePanels() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const panelsRef = ref(db, "panels");
    const unsub = onValue(panelsRef, (snap) => {
      const val = snap.val() as Record<string, Partial<Omit<Panel, "id">>> | null;
      const list: Panel[] = val
        ? Object.entries(val).map(([id, p]) => ({
            id,
            title: p.title ?? "",
            description: p.description ?? "",
            imageUrl: p.imageUrl ?? null,
            link: p.link ?? "",
            order: p.order ?? 0,
            featured: p.featured ?? false,
            createdAt: p.createdAt ?? Date.now(),
          }))
        : [];
      list.sort((a, b) => a.order - b.order);
      setPanels(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addPanel = async (panel: Omit<Panel, "id">) => {
    const newRef = push(ref(db, "panels"));
    await set(newRef, panel);
    return newRef.key;
  };

  const updatePanel = async (id: string, patch: Partial<Panel>) => {
    // Realtime Database's update() throws on `undefined` values (it only
    // accepts `null` to mean "clear this field"), so strip any undefined
    // keys before sending.
    const clean: Record<string, unknown> = {};
    Object.entries(patch).forEach(([key, value]) => {
      clean[key] = value === undefined ? null : value;
    });
    await update(ref(db, `panels/${id}`), clean);
  };

  const deletePanel = async (id: string) => {
    await remove(ref(db, `panels/${id}`));
  };

  const reorderPanels = async (orderedIds: string[]) => {
    const updates: Record<string, number> = {};
    orderedIds.forEach((id, index) => {
      updates[`panels/${id}/order`] = index;
    });
    await update(ref(db), updates);
  };

  return { panels, loading, addPanel, updatePanel, deletePanel, reorderPanels };
}
