import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function AboutTab() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => { });
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-8">
      <img
        src="/linklane.svg"
        alt="LinkLane"
        className="h-20 w-20 drop-shadow-md brightness-0 invert"
        draggable={false}
      />

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">LinkLane</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Route every link to the right browser
        </p>
      </div>

      <div className="w-48 divide-y divide-gray-200 rounded-lg border border-gray-200 text-sm dark:divide-gray-700 dark:border-gray-700">
        <div className="flex justify-between px-3 py-2">
          <span className="text-gray-500 dark:text-gray-400">Version</span>
          <span className="font-medium">{version || "…"}</span>
        </div>
      </div>

      <button
        onClick={() => openUrl("https://github.com/estruyf/LinkLane")}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
        type="button"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        github.com/estruyf/LinkLane
      </button>
    </div>
  );
}
