import { useTranslation } from "react-i18next";
import { QuickAdd } from "../components/QuickAdd";
import { TaskList } from "../components/TaskList";
import { useTasks } from "../hooks";

export default function Inbox() {
  const { t } = useTranslation();
  const tasks = useTasks({ status: "inbox" });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("nav.inbox")}</h1>
      <QuickAdd status="inbox" />
      <TaskList tasks={tasks.data} loading={tasks.isLoading} />
    </div>
  );
}
