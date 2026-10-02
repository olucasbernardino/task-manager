import { useTranslation } from "react-i18next";
import { QuickAdd } from "../components/QuickAdd";
import { TaskList } from "../components/TaskList";
import { addDays, startOfDay } from "../dates";
import { useTasks } from "../hooks";

export default function Today() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  // Today + anything overdue: everything due before tomorrow 00:00 local.
  const tasks = useTasks({ dueBefore: addDays(startOfDay(now), 1).toISOString(), hideDone: true });
  const noon = new Date(startOfDay(now).getTime() + 9 * 3600_000).toISOString();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">{t("nav.today")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {now.toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>
      <QuickAdd status="todo" dueAt={noon} />
      <TaskList tasks={tasks.data} loading={tasks.isLoading} />
    </div>
  );
}
