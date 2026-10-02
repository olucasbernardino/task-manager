import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Task } from "../api";
import { QuickAdd } from "../components/QuickAdd";
import { TaskList } from "../components/TaskList";
import { addDays, dayKey, startOfDay } from "../dates";
import { useTasks } from "../hooks";

export default function Upcoming() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<"list" | "week">("list");
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const tasks = useTasks({ dueAfter: tomorrow.toISOString(), hideDone: true });

  const groups = new Map<string, Task[]>();
  if (mode === "week") for (let i = 0; i < 7; i++) groups.set(dayKey(addDays(tomorrow, i)), []);
  for (const task of tasks.data ?? []) {
    const k = dayKey(new Date(task.dueAt!));
    if (mode === "week" && !groups.has(k)) continue;
    groups.set(k, [...(groups.get(k) ?? []), task].sort((a, b) => +new Date(a.dueAt!) - +new Date(b.dueAt!)));
  }
  const days = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("nav.upcoming")}</h1>
        <div className="flex rounded-lg bg-slate-200 p-0.5 text-sm dark:bg-slate-800">
          {(["list", "week"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`min-h-9 rounded-md px-3 ${mode === m ? "bg-white shadow dark:bg-slate-700" : ""}`}>
              {t(`common.${m}`)}
            </button>
          ))}
        </div>
      </div>
      <QuickAdd status="todo" dueAt={new Date(tomorrow.getTime() + 9 * 3600_000).toISOString()} />
      {tasks.isLoading ? <TaskList tasks={undefined} loading /> : days.length === 0 ? <TaskList tasks={[]} /> : (
        days.map(([key, list]) => (
          <section key={key} aria-label={key}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {new Date(`${key}T12:00`).toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "short" })}
            </h2>
            {list.length ? <TaskList tasks={list} /> : <p className="pb-2 text-sm text-slate-400">—</p>}
          </section>
        ))
      )}
    </div>
  );
}
