"use client";

import { DEFAULT_SETTINGS } from "@/lib/settings";
import { useCallback, useEffect, useState } from "react";

type SettingsMap = Record<string, string>;

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (updated: Partial<SettingsMap>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setSettings((prev) => {
        const merged: Record<string, string> = { ...prev };
        for (const [k, v] of Object.entries(updated)) {
          if (v !== undefined) merged[k] = v;
        }
        return merged;
      });
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, save, reload: load };
}
