import { DndContext, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Status, Task } from "../api";
import { useUpdateTask } from "../hooks";
import { formatDue } from "./TaskRow";
import { TaskEditor } from "./TaskEditor";

const COLUMNS: Status[] = ["inbox", "todo", "doing", "done"];

function Card({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { i18n } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, touchAction: "manipulation" }}
      className={`cursor-grab rounded-lg bg-white p-3 text-sm shadow dark:bg-slate-800 ${isDragging ? "relative z-10 opacity-90 ring-2 ring-indigo-500" : ""}`}
    >
      <div className={task.status === "done" ? "text-slate-400 line-through" : ""}>{task.title}</div>
      {task.dueAt && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDue(task, i18n.language)}</div>}
    </div>
  );
}

function Column({ status, tasks, onOpen }: { status: Status; tasks: Task[]; onOpen: (t: Task) => void }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={t(`status.${status}`)}
      className={`flex w-[78vw] max-w-72 shrink-0 snap-start flex-col rounded-xl bg-slate-200/70 p-2 dark:bg-slate-800/50 ${isOver ? "ring-2 ring-indigo-500" : ""}`}
    >
      <h3 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t(`status.${status}`)} <span className="ml-1 opacity-60">{tasks.length}</span>
      </h3>
      <div className="min-h-24 flex-1 space-y-2">{tasks.map((task) => <Card key={task.id} task={task} onOpen={onOpen} />)}</div>
    </section>
  );
}

export function Kanban({ tasks }: { tasks: Task[] }) {
  const update = useUpdateTask();
  const [editing, setEditing] = useState<Task | null>(null);
  // Small distance / press delay so scrolling and taps still work on touch screens.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const to = e.over?.id as Status | undefined;
    const task = tasks.find((x) => x.id === e.active.id);
    if (!to || !task || task.status === to) return;
    update.mutate({ id: task.id, status: to, position: Date.now() });
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {COLUMNS.map((s) => (
            <Column key={s} status={s} tasks={tasks.filter((x) => x.status === s)} onOpen={setEditing} />
          ))}
        </div>
      </DndContext>
      {editing && <TaskEditor key={editing.id} task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
