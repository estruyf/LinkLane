import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { InstalledApp } from "../../types";

interface UseKeyboardNavOptions {
  apps: InstalledApp[];
  url: string;
  focusedIndex: number;
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
  buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function useKeyboardNav({
  apps,
  url,
  focusedIndex,
  setFocusedIndex,
  buttonRefs,
}: UseKeyboardNavOptions) {
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      const { key, metaKey, altKey, shiftKey } = e;

      // Escape → hide picker
      if (key === "Escape") {
        e.preventDefault();
        const win = getCurrentWebviewWindow();
        await win.hide();
        return;
      }

      // Cmd+C → copy URL
      if (metaKey && key === "c") {
        e.preventDefault();
        if (url) {
          await invoke("copy_url_to_clipboard", { url });
          const win = getCurrentWebviewWindow();
          await win.hide();
        }
        return;
      }

      // Arrow navigation
      if (key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, apps.length - 1));
        return;
      }

      if (key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Enter → launch focused app
      if (key === "Enter" && apps[focusedIndex]) {
        e.preventDefault();
        await invoke("launch_browser", {
          appName: apps[focusedIndex].name,
          url,
          isPrivate: shiftKey,
          isBackground: altKey,
        });
        const win = getCurrentWebviewWindow();
        await win.hide();
        return;
      }

      // Single-key hotkey (no modifier except alt/shift for launch options)
      if (!metaKey && key.length === 1) {
        const matchedApp = apps.find(
          (app) => app.hotkey?.toLowerCase() === key.toLowerCase()
        );
        if (matchedApp) {
          e.preventDefault();
          await invoke("launch_browser", {
            appName: matchedApp.name,
            url,
            isPrivate: shiftKey,
            isBackground: altKey,
          });
          const win = getCurrentWebviewWindow();
          await win.hide();
        }
      }
    },
    [apps, url, focusedIndex, setFocusedIndex]
  );

  // Attach global keydown listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Keep focused button scrolled into view
  useEffect(() => {
    buttonRefs.current[focusedIndex]?.focus();
    buttonRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, buttonRefs]);
}
