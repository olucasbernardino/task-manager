import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Priority, Status, Task } from "../api";
import { fromIso, toIso } from "../dates";
import { useDeleteTask, useProjects, useUpdateTask } from "../hooks";

const STATUSES: Status[] = ["inbox", "todo", "doing", "done"];
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const { t } = useTranslation();
  const projects = useProjects();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const initial = fromIso(task.dueAt, task.hasTime);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [status, setStatus] = useState<Status>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [projectId, setProjectId] = useState(task.projectId ?? "");

  const save = () => {
    if (!title.trim()) return;
    update.mutate({
      id: task.id,
      title: title.trim(),
      notes,
      status,
      priority,
      dueAt: date ? toIso(date, time) : null,
      hasTime: Boolean(date && time),
      projectId: projectId || null,
    });
    onClose();
  };

  const label = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="safe-bottom max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-slate-50 p-4 sm:max-w-lg sm:rounded-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{t("task.editTask")}</h2>
        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="te-title">{t("task.title")}</label>
            <input id="te-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="te-notes">{t("task.notes")}</label>
            <textarea id="te-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="te-status">{t("task.status")}</label>
              <select id="te-status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="te-priority">{t("task.priority")}</label>
              <select id="te-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="te-date">{t("task.due")}</label>
              <input id="te-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); if (!e.target.value) setTime(""); }} />
            </div>
            <div>
              <label className={label} htmlFor="te-time">{t("task.time")}</label>
              <input id="te-time" type="time" value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="te-project">{t("task.project")}</label>
            <select id="te-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">{t("common.none")}</option>
              {projects.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-danger" onClick={() => { del.mutate(task.id); onClose(); }}>{t("common.delete")}</button>
          <div className="flex-1" />
          <button className="btn btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={save}>{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}
