import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Kanban } from "../components/Kanban";
import { QuickAdd } from "../components/QuickAdd";
import { TaskList } from "../components/TaskList";
import { useDeleteProject, useProjects, useTasks } from "../hooks";

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mode, setMode] = useState<"list" | "board">("list");
  const project = useProjects().data?.find((p) => p.id === id);
  const tasks = useTasks({ projectId: id });
  const del = useDeleteProject();

  return (
    <div className="space-y-4">
      <Link to="/projects" className="text-sm text-indigo-500">← {t("common.back")}</Link>
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 truncate text-xl font-semibold">
          {project && <span className="size-3 shrink-0 rounded-full" style={{ background: project.color }} />}
          {project?.name}
        </h1>
        <div className="flex rounded-lg bg-slate-200 p-0.5 text-sm dark:bg-slate-800">
          {(["list", "board"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`min-h-9 rounded-md px-3 ${mode === m ? "bg-white shadow dark:bg-slate-700" : ""}`}>
              {t(`common.${m}`)}
            </button>
          ))}
        </div>
      </div>
      <QuickAdd status="todo" projectId={id} />
      {mode === "list" ? <TaskList tasks={tasks.data} loading={tasks.isLoading} /> : <Kanban tasks={tasks.data ?? []} />}
      <button
        className="btn btn-danger"
        onClick={() => {
          if (confirm(t("project.deleteConfirm"))) del.mutate(id, { onSuccess: () => nav("/projects") });
        }}
      >
        {t("project.delete")}
      </button>
    </div>
  );
}
