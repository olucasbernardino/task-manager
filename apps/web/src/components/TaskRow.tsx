import { useTranslation } from "react-i18next";
import type { Priority, Project, Task } from "../api";
import { useUpdateTask } from "../hooks";

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-slate-400",
  normal: "bg-sky-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

export function formatDue(task: Task, locale: string) {
  if (!task.dueAt) return "";
  const d = new Date(task.dueAt);
  const date = d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  return task.hasTime ? `${date} · ${d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : date;
}

export function TaskRow({ task, project, onOpen }: { task: Task; project?: Project; onOpen: (t: Task) => void }) {
  const { i18n } = useTranslation();
  const update = useUpdateTask();
  const done = task.status === "done";
  const overdue = !done && task.dueAt && new Date(task.dueAt) < new Date() && (task.hasTime || new Date(task.dueAt).toDateString() !== new Date().toDateString());

  return (
    <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-800/70">
      <button
        aria-label={done ? "Reopen" : "Complete"}
        onClick={() => update.mutate({ id: task.id, status: done ? "todo" : "done" })}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-400 dark:border-slate-500"}`}
      >
        {done && <span className="text-sm leading-none">✓</span>}
      </button>
      <button onClick={() => onOpen(task)} className="min-h-11 min-w-0 flex-1 text-left">
        <div className={`truncate text-[15px] ${done ? "text-slate-400 line-through" : ""}`}>{task.title}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className={`size-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          {task.dueAt && <span className={overdue ? "font-medium text-red-500" : ""}>{formatDue(task, i18n.language)}</span>}
          {project && (
            <span className="flex items-center gap-1 truncate">
              <span className="size-2 rounded-full" style={{ background: project.color }} />
              {project.name}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
