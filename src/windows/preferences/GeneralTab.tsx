import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export default function GeneralTab() {
  const [isDefault, setIsDefault] = useState(false);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    invoke<boolean>("is_default_browser").then(setIsDefault).catch(() => { });
    invoke<number>("get_installed_app_count").then(setAppCount).catch(() => { });
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
      const count = await invoke<number>("get_installed_app_count");
      setAppCount(count);
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Default browser */}
      <div className="flex items-start justify-between py-4">
        <div>
          <p className="text-sm font-medium">Default web browser</p>
          {!isDefault && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              System Settings will open — select LinkLane to confirm.
            </p>
          )}
        </div>
        <div className="ml-6 shrink-0">
          {isDefault ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Set as default
            </span>
          ) : (
            <button
              onClick={handleSetDefault}
              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 active:bg-blue-700"
              type="button"
            >
              Set as default
            </button>
          )}
        </div>
      </div>

      {/* Find apps */}
      <div className="flex items-start justify-between py-4">
        <div>
          <p className="text-sm font-medium">Browser apps</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {appCount} compatible {appCount === 1 ? "app" : "apps"} found.
          </p>
        </div>
        <div className="ml-6 shrink-0">
          <button
            onClick={handleRescan}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            type="button"
          >
            Rescan
          </button>
        </div>
      </div>

      {/* Factory reset */}
      <div className="flex items-start justify-between py-4">
        <div>
          <p className="text-sm font-medium">Factory reset</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Restores all preferences to initial defaults.
          </p>
        </div>
        <div className="ml-6 shrink-0">
          <button
            onClick={handleReset}
            className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
