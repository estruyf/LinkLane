import { useState, useCallback, useRef, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/window";
import { useTauriEvent } from "../../hooks/useTauriEvent";
import { useApps } from "../../hooks/useApps";
import AppButton from "./AppButton";
import UrlBar from "./UrlBar";
import { useKeyboardNav } from "./useKeyboardNav";
import { useHideOnBlur } from "./useHideOnBlur";

export default function PickerWindow() {
  const [url, setUrl] = useState("");
  const [noUrlMessage, setNoUrlMessage] = useState("");
  const [isResized, setIsResized] = useState(false);
  const { apps, loading, refetch } = useApps();
  const visibleApps = apps.filter((app) => !app.is_hidden);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleUrlOpened = useCallback((payload: string) => {
    setUrl(payload);
    setNoUrlMessage("");
    setFocusedIndex(0);
    refetch();
  }, [refetch]);

  const handleNoUrl = useCallback(() => {
    setNoUrlMessage("No URL to restore. Open a link first.");
    setTimeout(() => {
      setNoUrlMessage("");
      getCurrentWebviewWindow().hide();
    }, 2000);
  }, []);

  const handleInvalidCopiedUrl = useCallback(() => {
    setNoUrlMessage("Clipboard does not contain a valid URL.");
    setTimeout(() => {
      setNoUrlMessage("");
      getCurrentWebviewWindow().hide();
    }, 2000);
  }, []);

  useTauriEvent<string>("url-opened", handleUrlOpened);
  useTauriEvent("no-url-to-restore", handleNoUrl);
  useTauriEvent("invalid-copied-url", handleInvalidCopiedUrl);
  useKeyboardNav({
    apps: visibleApps,
    url,
    focusedIndex,
    setFocusedIndex,
    buttonRefs,
  });
  useHideOnBlur();

  // Auto-scale window height based on number of apps
  useEffect(() => {
    const updateWindowSize = async () => {
      const win = getCurrentWebviewWindow();

      // Calculate heights
      const appButtonHeight = 44; // h-11 in Tailwind = 44px
      const padding = 16; // pt-3 pb-1 = 12px + 4px = 16px total
      const urlBarHeight = url ? 72 : 0; // UrlBar height when visible (two rows + borders)
      const baseHeight = padding + urlBarHeight;

      // Calculate height for visible apps
      const numApps = Math.max(visibleApps.length, 1); // At least show space for "No visible browsers" message
      const maxAppsToShow = 5; // Show max 5 apps without scrolling
      const appsToCalculate = Math.min(numApps, maxAppsToShow);

      const calculatedHeight = baseHeight + (appsToCalculate * appButtonHeight);

      // Ensure minimum height of 120px (as set in tauri.conf.json)
      const windowHeight = Math.max(calculatedHeight, 120);

      try {
        await win.setSize(new LogicalSize(250, windowHeight));
        setIsResized(true);
      } catch (error) {
        console.warn('Failed to resize window:', error);
        setIsResized(true); // Still allow content to show even if resize fails
      }
    };

    // Only update size if we have loaded the apps data
    if (!loading) {
      updateWindowSize();
    } else {
      setIsResized(false); // Reset when loading new data
    }
  }, [visibleApps.length, url, loading]);

  useEffect(() => {
    if (focusedIndex >= visibleApps.length) {
      setFocusedIndex(Math.max(visibleApps.length - 1, 0));
    }
  }, [focusedIndex, visibleApps.length]);

  // Re-fetch apps whenever the picker window gains focus
  useEffect(() => {
    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | undefined;

    win.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        refetch();
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [refetch]);

  return (
    <div className="flex w-screen select-none flex-col bg-white/80 dark:bg-gray-900/95 dark:text-white rounded-xl min-h-full">
      {!isResized || loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : noUrlMessage ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {noUrlMessage}
          </p>
        </div>
      ) : (
        <div
          className="flex-1 px-2 pt-3 pb-1"
          style={{
            maxHeight: visibleApps.length > 5 ? '220px' : 'none', // 5 * 44px = 220px
            overflowY: visibleApps.length > 5 ? 'auto' : 'visible'
          }}
        >
          {visibleApps.length > 0 ? (
            visibleApps.map((app, index) => (
              <AppButton
                key={app.name}
                app={app}
                url={url}
                index={index}
                focused={index === focusedIndex}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
              />
            ))
          ) : (
            <p className="px-2 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
              No visible browsers. Unhide one in Preferences.
            </p>
          )}
        </div>
      )}

      {isResized && !loading && <UrlBar url={url} />}
    </div>
  );
}
