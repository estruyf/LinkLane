import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

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
        <div className="flex justify-between px-3 py-2">
          <span className="text-gray-500 dark:text-gray-400">Platform</span>
          <span className="font-medium">macOS</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        Built with Tauri · React · Tailwind CSS
      </p>
    </div>
  );
}
