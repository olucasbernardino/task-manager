import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCreateProject, useProjects } from "../hooks";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#d946ef"];

export default function Projects() {
  const { t } = useTranslation();
  const projects = useProjects();
  const create = useCreateProject();
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("nav.projects")}</h1>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate({ name: name.trim(), color: COLORS[(projects.data?.length ?? 0) % COLORS.length] });
          setName("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("project.name")} aria-label={t("project.name")} />
        <button className="btn btn-primary shrink-0" type="submit">{t("common.add")}</button>
      </form>
      {projects.data?.length === 0 && <p className="py-8 text-center text-slate-500">{t("project.empty")}</p>}
      <ul className="space-y-2">
        {projects.data?.map((p) => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}`} className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 shadow-sm dark:bg-slate-800/70">
              <span className="size-3 rounded-full" style={{ background: p.color }} />
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
