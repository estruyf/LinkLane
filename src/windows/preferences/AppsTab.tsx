import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useApps } from "../../hooks/useApps";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InstalledApp } from "../../types";

function normalizeHotkey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const char = trimmed[0];
  if (!/^[a-z0-9]$/i.test(char)) return null;

  return char.toLowerCase();
}

function SortableAppItem({
  app,
  index,
  onSetHotkey,
  onSetHidden,
  isSavingHidden,
}: {
  app: InstalledApp;
  index: number;
  onSetHotkey: (appName: string, hotkey: string | null) => void;
  onSetHidden: (appName: string, isHidden: boolean) => void;
  isSavingHidden: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-800"
    >
      <span
        {...attributes}
        {...listeners}
        className="mr-2 cursor-grab text-gray-400 active:cursor-grabbing"
        title="Drag to reorder"
      >
        ⠿
      </span>
      <span className="w-8 text-center text-sm text-gray-400">
        {index + 1}
      </span>
      <span className="flex items-center gap-3">
        {app.icon ? (
          <img src={app.icon} alt="" className="size-7" />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-md bg-gray-200 text-xs dark:bg-gray-700">
            {app.name[0]}
          </span>
        )}
        <span className={`text-sm ${app.is_hidden ? "opacity-60" : ""}`}>
          {app.name}
        </span>
        {app.is_hidden && (
          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Hidden
          </span>
        )}
      </span>
      <label className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Hotkey</span>
        <input
          type="text"
          inputMode="text"
          maxLength={1}
          value={app.hotkey ?? ""}
          onChange={(event) => {
            const rawValue = event.target.value;
            if (!rawValue) {
              onSetHotkey(app.name, null);
              return;
            }

            const normalized = normalizeHotkey(rawValue);
            if (normalized) {
              onSetHotkey(app.name, normalized);
            }
          }}
          className="h-7 w-9 rounded-md border border-gray-300 bg-white text-center text-xs font-medium uppercase text-gray-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          aria-label={`Hotkey for ${app.name}`}
          title="Single letter or number"
        />
      </label>
      <button
        type="button"
        onClick={() => onSetHidden(app.name, !app.is_hidden)}
        disabled={isSavingHidden}
        className="ml-2 inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        title={app.is_hidden ? "Show in picker" : "Hide from picker"}
      >
        {isSavingHidden ? (
          <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
        ) : app.is_hidden ? (
          <Eye className="size-3" aria-hidden="true" />
        ) : (
          <EyeOff className="size-3" aria-hidden="true" />
        )}
        {isSavingHidden ? "Saving..." : app.is_hidden ? "Show" : "Hide"}
      </button>
    </div>
  );
}

export default function AppsTab() {
  const { apps: initialApps, loading } = useApps();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [savedHotkeys, setSavedHotkeys] = useState<Record<string, string | null>>({});
  const [isSavingHotkeys, setIsSavingHotkeys] = useState(false);
  const [savingHiddenApps, setSavingHiddenApps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading) {
      setApps(initialApps);
      setSavedHotkeys(
        Object.fromEntries(
          initialApps.map((app) => [app.name, app.hotkey ?? null])
        )
      );
    }
  }, [initialApps, loading]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = apps.findIndex((a) => a.name === active.id);
    const newIndex = apps.findIndex((a) => a.name === over.id);
    const reordered = arrayMove(apps, oldIndex, newIndex);
    setApps(reordered);

    await invoke("reorder_apps", {
      orderedNames: reordered.map((a) => a.name),
    });
  };

  const handleSetHotkey = (appName: string, hotkey: string | null) => {
    setApps((prev) =>
      prev.map((item) => {
        if (item.name === appName) {
          return { ...item, hotkey };
        }

        if (hotkey && item.hotkey?.toLowerCase() === hotkey.toLowerCase()) {
          return { ...item, hotkey: null };
        }

        return item;
      })
    );
  };

  const handleSetHidden = (appName: string, isHidden: boolean) => {
    const previousHidden =
      apps.find((item) => item.name === appName)?.is_hidden ?? false;

    setSavingHiddenApps((prev) => ({ ...prev, [appName]: true }));
    setApps((prev) =>
      prev.map((item) =>
        item.name === appName ? { ...item, is_hidden: isHidden } : item
      )
    );

    setTimeout(() => {
      invoke("set_app_hidden", {
        appName,
        isHidden,
      })
        .catch((error) => {
          console.error("Failed to update hidden state:", error);
          setApps((prev) =>
            prev.map((item) =>
              item.name === appName
                ? { ...item, is_hidden: previousHidden }
                : item
            )
          );
        })
        .finally(() => {
          setSavingHiddenApps((prev) => {
            const next = { ...prev };
            delete next[appName];
            return next;
          });
        });
    }, 100);
  };

  const changedHotkeyApps = apps.filter(
    (app) => (savedHotkeys[app.name] ?? null) !== (app.hotkey ?? null)
  );
  const hasPendingHotkeyChanges = changedHotkeyApps.length > 0;

  const handleSaveHotkeys = () => {
    if (!hasPendingHotkeyChanges || isSavingHotkeys) return;

    setIsSavingHotkeys(true);

    setTimeout(() => {
      invoke("set_app_hotkeys", {
        updates: changedHotkeyApps.map((app) => ({
          appName: app.name,
          hotkey: app.hotkey,
        })),
      })
        .then(() => {
          setSavedHotkeys(
            Object.fromEntries(
              apps.map((app) => [app.name, app.hotkey ?? null])
            )
          );
        })
        .catch((error) => {
          console.error("Failed to set hotkey:", error);
        })
        .finally(() => {
          setIsSavingHotkeys(false);
        });
    }, 100); // Slight delay to ensure UI updates before potential main thread work
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={apps.map((a) => a.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {apps.map((app, index) => (
              <SortableAppItem
                key={app.name}
                app={app}
                index={index}
                onSetHotkey={handleSetHotkey}
                onSetHidden={handleSetHidden}
                isSavingHidden={savingHiddenApps[app.name] ?? false}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {apps.length > 0 && (
        <div className="mt-3 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <p>Drag and drop to reorder browsers.</p>
          <p>Assign one letter or number to launch directly from the picker.</p>
          <p>Use Hide to remove a browser from the picker list.</p>
          <div className="flex items-center justify-between pt-1">
            <span>
              {hasPendingHotkeyChanges
                ? `${changedHotkeyApps.length} unsaved hotkey change${changedHotkeyApps.length === 1 ? "" : "s"}`
                : "All hotkeys saved"}
            </span>
            <button
              type="button"
              onClick={handleSaveHotkeys}
              disabled={!hasPendingHotkeyChanges || isSavingHotkeys}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-2.5 py-1 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingHotkeys && (
                <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
              )}
              {isSavingHotkeys ? "Saving..." : "Save Hotkeys"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
