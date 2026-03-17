export interface AppEntry {
  name: string;
  hotkey: string | null;
  is_installed: boolean;
  icon: string | null;
}

export interface Settings {
  apps: AppEntry[];
  picker_height: number;
  is_setup: boolean;
}

export interface InstalledApp {
  name: string;
  hotkey: string | null;
  icon: string | null;
}
