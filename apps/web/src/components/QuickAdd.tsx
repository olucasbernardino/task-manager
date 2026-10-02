import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Status } from "../api";
import { useCreateTask } from "../hooks";

export function QuickAdd({ status, projectId, dueAt }: { status?: Status; projectId?: string; dueAt?: string }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const create = useCreateTask();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = title.trim();
        if (!v) return;
        create.mutate({ title: v, status, projectId, dueAt });
        setTitle("");
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("task.quickAdd")} aria-label={t("task.quickAdd")} enterKeyHint="done" />
      <button className="btn btn-primary shrink-0" type="submit" disabled={create.isPending}>
        {t("common.add")}
      </button>
    </form>
  );
}
