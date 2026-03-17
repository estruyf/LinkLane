import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import PickerWindow from "./windows/picker/PickerWindow";
import PreferencesWindow from "./windows/preferences/PreferencesWindow";
import "./App.css";

const windowLabel = getCurrentWebviewWindow().label;

function App() {
  if (windowLabel === "preferences") {
    return <PreferencesWindow />;
  }

  return <PickerWindow />;
}

export default App;
