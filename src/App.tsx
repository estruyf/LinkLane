import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Suspense, lazy } from "react";
import "./App.css";

const windowLabel = getCurrentWebviewWindow().label;
const PickerWindow = lazy(() => import("./windows/picker/PickerWindow"));
const PreferencesWindow = lazy(() => import("./windows/preferences/PreferencesWindow"));

function WindowFallback() {
  return (
    <div
      className="h-screen w-screen"
      style={{ backgroundColor: "#f9fafb" }}
    />
  );
}

function App() {
  if (windowLabel === "preferences") {
    return (
      <Suspense fallback={<WindowFallback />}>
        <PreferencesWindow />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<WindowFallback />}>
      <PickerWindow />
    </Suspense>
  );
}

export default App;
