import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { lazy, Suspense, useEffect, useState } from "react";
import GeneralTab from "./GeneralTab";

const AppsTab = lazy(() => import("./AppsTab"));
const AboutTab = lazy(() => import("./AboutTab"));

type Tab = "general" | "apps" | "about";

const tabs: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "apps", label: "Apps" },
  { id: "about", label: "About" },
];

export default function PreferencesWindow() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [appsTabVisited, setAppsTabVisited] = useState(false);
  const [aboutTabVisited, setAboutTabVisited] = useState(false);

  useEffect(() => {
    if (activeTab === "apps") {
      setAppsTabVisited(true);
    }

    if (activeTab === "about") {
      setAboutTabVisited(true);
    }
  }, [activeTab]);

  useEffect(() => {
    // Warm lazy chunks in the background so first tab switch feels instant.
    const preloadId = window.setTimeout(() => {
      void import("./AppsTab");
      void import("./AboutTab");
    }, 0);

    return () => {
      window.clearTimeout(preloadId);
    };
  }, []);

  useEffect(() => {
    const window = getCurrentWebviewWindow();
    let unlisten: (() => void) | undefined;

    window
      .onCloseRequested(async (event) => {
        event.preventDefault();
        await window.hide();
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => { });

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="flex shrink-0 gap-1 border-b border-gray-200 px-4 pt-8 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className={activeTab === "general" ? "block" : "hidden"}>
          <GeneralTab />
        </div>

        {appsTabVisited && (
          <div className={activeTab === "apps" ? "block" : "hidden"}>
            <Suspense fallback={<div className="text-sm text-gray-500">Loading apps...</div>}>
              <AppsTab />
            </Suspense>
          </div>
        )}

        {aboutTabVisited && (
          <div className={activeTab === "about" ? "block" : "hidden"}>
            <Suspense fallback={<div className="text-sm text-gray-500">Loading about...</div>}>
              <AboutTab />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
