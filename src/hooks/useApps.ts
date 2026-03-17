import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { InstalledApp } from "../types";
import { useTauriEvent } from "./useTauriEvent";

export function useApps() {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<InstalledApp[]>("get_installed_apps");
      setApps(result);
    } catch (err) {
      console.error("Failed to fetch apps:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useTauriEvent("apps-updated", fetchApps);

  return { apps, loading, refetch: fetchApps };
}
