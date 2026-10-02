import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Task } from "../api";
import { useProjects } from "../hooks";
import { TaskEditor } from "./TaskEditor";
import { TaskRow } from "./TaskRow";

export function TaskList({ tasks, loading }: { tasks: Task[] | undefined; loading?: boolean }) {
  const { t } = useTranslation();
  const projects = useProjects();
  const [editing, setEditing] = useState<Task | null>(null);
  const byId = new Map(projects.data?.map((p) => [p.id, p]));

  if (loading) return <p className="py-8 text-center text-slate-500">{t("common.loading")}</p>;
  if (!tasks?.length) return <p className="py-8 text-center text-slate-500">{t("task.empty")}</p>;
  return (
    <>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} project={task.projectId ? byId.get(task.projectId) : undefined} onOpen={setEditing} />
        ))}
      </ul>
      {editing && <TaskEditor key={editing.id} task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
