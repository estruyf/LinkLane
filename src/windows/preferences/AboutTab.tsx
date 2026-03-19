import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

export default function AboutTab() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <h1 className="text-3xl font-light tracking-wide">LinkLane</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400">
        The browser prompter for macOS
      </p>
      <p className="text-sm text-gray-400">Version {version || "..."}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Built with Tauri, React & Tailwind CSS
      </p>
    </div>
  );
}
