import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

function SortableAppItem({
  app,
  index,
}: {
  app: InstalledApp;
  index: number;
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
        <span className="text-sm">{app.name}</span>
      </span>
      <span className="ml-auto text-xs text-gray-400">
        {app.hotkey || "—"}
      </span>
    </div>
  );
}

export default function AppsTab() {
  const { apps: initialApps, loading } = useApps();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && !loading && initialApps.length > 0) {
      setApps(initialApps);
      setInitialized(true);
    }
  }, [initialApps, loading, initialized]);

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
              <SortableAppItem key={app.name} app={app} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {apps.length > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Drag and drop to reorder browsers.
        </p>
      )}
    </div>
  );
}
