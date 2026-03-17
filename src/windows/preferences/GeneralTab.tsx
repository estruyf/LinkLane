import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export default function GeneralTab() {
  const [isDefault, setIsDefault] = useState(false);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    invoke<boolean>("is_default_browser").then(setIsDefault).catch(() => {});
    invoke<number>("get_installed_app_count").then(setAppCount).catch(() => {});
  }, []);

  const handleSetDefault = async () => {
    await invoke("set_as_default_browser");
    // Re-check after a delay — user may need to confirm in System Settings
    const recheckInterval = setInterval(async () => {
      const result = await invoke<boolean>("is_default_browser");
      if (result) {
        setIsDefault(true);
        clearInterval(recheckInterval);
      }
    }, 2000);
    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(recheckInterval), 30000);
  };

  const handleRescan = async () => {
    await invoke("rescan_apps");
    const count = await invoke<number>("get_installed_app_count");
    setAppCount(count);
  };

  const handleReset = async () => {
    if (confirm("Are you sure you wish to reset all preferences?")) {
      await invoke("factory_reset");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 text-right text-sm font-medium">
          Default web browser:
        </div>
        <div className="col-span-7">
          {isDefault ? (
            <span className="text-sm text-green-600 dark:text-green-400">
              BrowserPicker is the default web browser
            </span>
          ) : (
            <button
              onClick={handleSetDefault}
              className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
              type="button"
            >
              Set As Default Browser
            </button>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            System Settings will open — select BrowserPicker as the default web
            browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 text-right text-sm font-medium">
          Find apps:
        </div>
        <div className="col-span-7">
          <button
            onClick={handleRescan}
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            type="button"
          >
            Rescan
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {appCount} compatible apps found.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 text-right text-sm font-medium">
          Factory Reset:
        </div>
        <div className="col-span-7">
          <button
            onClick={handleReset}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            type="button"
          >
            Reset
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Restores all preferences to initial defaults.
          </p>
        </div>
      </div>
    </div>
  );
}
