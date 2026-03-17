import { forwardRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { InstalledApp } from "../../types";

interface Props {
  app: InstalledApp;
  url: string;
  index: number;
  focused: boolean;
}

const AppButton = forwardRef<HTMLButtonElement, Props>(
  function AppButton({ app, url, focused }, ref) {
    const handleClick = async (e: React.MouseEvent) => {
      await invoke("launch_browser", {
        appName: app.name,
        url,
        isPrivate: e.shiftKey,
        isBackground: e.altKey,
      });
      const win = getCurrentWebviewWindow();
      await win.hide();
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={`flex h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm focus:outline-none ${
          focused
            ? "bg-blue-500 text-white dark:bg-blue-700"
            : "hover:bg-black/10 dark:hover:bg-white/10"
        }`}
        type="button"
        tabIndex={focused ? 0 : -1}
      >
        <span className="flex items-center gap-3">
          {app.icon ? (
            <img src={app.icon} alt="" className="size-6 shrink-0" />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-200 text-xs dark:bg-gray-700">
              {app.name[0]}
            </span>
          )}
          <span>{app.name}</span>
        </span>

        {app.hotkey && (
          <kbd className={`rounded border px-1.5 py-0.5 text-xs ${
            focused
              ? "border-blue-300 text-blue-100"
              : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
          }`}>
            {app.hotkey}
          </kbd>
        )}
      </button>
    );
  }
);

export default AppButton;
