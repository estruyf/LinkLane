import { useState } from "react";
import GeneralTab from "./GeneralTab";
import AppsTab from "./AppsTab";
import AboutTab from "./AboutTab";

type Tab = "general" | "apps" | "about";

const tabs: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "apps", label: "Apps" },
  { id: "about", label: "About" },
];

export default function PreferencesWindow() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="flex shrink-0 gap-1 border-b border-gray-200 px-4 pt-8 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
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
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "apps" && <AppsTab />}
        {activeTab === "about" && <AboutTab />}
      </div>
    </div>
  );
}
