import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "./firebase";
import { defaultSiteConfig, type SiteConfig } from "./types";

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = ref(db, "siteConfig");
    const unsub = onValue(configRef, (snap) => {
      const val = snap.val() as Partial<SiteConfig> | null;
      setConfig({ ...defaultSiteConfig, ...(val ?? {}) });
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateConfig = async (patch: Partial<SiteConfig>) => {
    await update(ref(db, "siteConfig"), patch);
  };

  return { config, loading, updateConfig };
}
