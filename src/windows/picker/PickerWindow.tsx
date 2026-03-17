import { useState, useCallback, useRef, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useTauriEvent } from "../../hooks/useTauriEvent";
import { useApps } from "../../hooks/useApps";
import AppButton from "./AppButton";
import UrlBar from "./UrlBar";
import { useKeyboardNav } from "./useKeyboardNav";
import { useHideOnBlur } from "./useHideOnBlur";

export default function PickerWindow() {
  const [url, setUrl] = useState("");
  const [noUrlMessage, setNoUrlMessage] = useState("");
  const { apps, loading, refetch } = useApps();
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

  useTauriEvent<string>("url-opened", handleUrlOpened);
  useTauriEvent("no-url-to-restore", handleNoUrl);
  useKeyboardNav({ apps, url, focusedIndex, setFocusedIndex, buttonRefs });
  useHideOnBlur();

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
    <div className="flex h-screen w-screen select-none flex-col bg-white/80 dark:bg-gray-900/90 dark:text-white">
      {noUrlMessage ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {noUrlMessage}
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pt-3 pb-1">
          {apps.map((app, index) => (
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
          ))}
        </div>
      )}

      <UrlBar url={url} />
    </div>
  );
}
