import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

interface Props {
  url: string;
}

export default function UrlBar({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    await invoke("copy_url_to_clipboard", { url });
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      getCurrentWebviewWindow().hide();
    }, 800);
  };

  if (!url) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <div
        className="w-full truncate px-3 py-1.5 text-center text-xs text-gray-500 dark:text-gray-400"
        title={url}
      >
        {url}
      </div>
      <button
        onClick={handleCopy}
        className={`flex w-full items-center justify-center gap-1.5 border-t border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors dark:border-gray-700 ${
          copied
            ? "text-green-500 dark:text-green-400"
            : "text-blue-500 hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/5"
        }`}
        type="button"
        disabled={copied}
      >
        {copied ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3"
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3"
            >
              <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V5.621a.5.5 0 0 0-.146-.354L9.354 2.768a.5.5 0 0 0-.354-.146H7a.5.5 0 0 0-.5.5v1.378a2.5 2.5 0 0 0-1 0V3.5Z" />
              <path d="M3.5 6A1.5 1.5 0 0 0 2 7.5v5A1.5 1.5 0 0 0 3.5 14h3A1.5 1.5 0 0 0 8 12.5v-5A1.5 1.5 0 0 0 6.5 6h-3Z" />
            </svg>
            Copy URL
          </>
        )}
      </button>
    </div>
  );
}
