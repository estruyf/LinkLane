import { useCallback, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "up-to-date" }
  | { state: "available"; version: string; notes?: string }
  | { state: "downloading"; percent: number | null }
  | { state: "restarting" }
  | { state: "error"; message: string };

/**
 * Checks for a new LinkLane release on request and installs it.
 *
 * Nothing runs on its own: the person starts each check, and an update is
 * only downloaded after they choose to install it.
 */
export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });
  // The Update object holds the handle the plugin needs to download, so it is
  // kept between the check and the install.
  const pending = useRef<Update | null>(null);

  const checkForUpdates = useCallback(async () => {
    setStatus({ state: "checking" });
    try {
      const update = await check();
      pending.current = update;
      if (update) {
        setStatus({ state: "available", version: update.version, notes: update.body });
      } else {
        setStatus({ state: "up-to-date" });
      }
    } catch (error) {
      pending.current = null;
      setStatus({ state: "error", message: errorMessage(error) });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = pending.current;
    if (!update) return;

    let total = 0;
    let received = 0;
    setStatus({ state: "downloading", percent: null });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          received += event.data.chunkLength;
          setStatus({
            state: "downloading",
            percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : null,
          });
        }
      });
      setStatus({ state: "restarting" });
      await relaunch();
    } catch (error) {
      setStatus({ state: "error", message: errorMessage(error) });
    }
  }, []);

  return { status, checkForUpdates, installUpdate };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}
