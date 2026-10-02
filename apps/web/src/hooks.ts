import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, type AutomationRun, type Me, type Project, type Settings, type Task } from "./api";

export const useMe = () =>
  useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/auth/me"), retry: false, staleTime: 60_000 });

export interface TaskFilter {
  status?: string;
  projectId?: string;
  dueBefore?: string;
  dueAfter?: string;
  hideDone?: boolean;
}

export function useTasks(filter: TaskFilter) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) if (v !== undefined) qs.set(k, String(v));
  return useQuery({ queryKey: ["tasks", filter], queryFn: () => api<Task[]>(`/tasks?${qs}`) });
}

export const useProjects = () => useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/settings") });
export const useRuns = () => useQuery({ queryKey: ["runs"], queryFn: () => api<AutomationRun[]>("/automation-runs") });

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Task>) => api<Task>("/tasks", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Optimistic: patches every cached task list immediately, rolls back on error. */
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Task> & { id: string }) => api<Task>(`/tasks/${id}`, { method: "PATCH", body }),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = qc.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => old?.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]: [QueryKey, Task[] | undefined]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string }) => api<Project>("/projects", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Settings>) => api<Settings>("/settings", { method: "PATCH", body }),
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}
