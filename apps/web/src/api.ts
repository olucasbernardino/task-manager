export type Status = "inbox" | "todo" | "doing" | "done";
export type Priority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: Status;
  priority: Priority;
  dueAt: string | null;
  hasTime: boolean;
  projectId: string | null;
  source: string;
  position: number;
  completedAt: string | null;
}
export interface Project {
  id: string;
  name: string;
  color: string;
}
export interface Settings {
  language: "en" | "pt-BR" | "es";
  theme: "dark" | "light" | "system";
  timezone: string;
  briefingTime: string;
  cvText: string;
  targetRoles: string;
  aiEnabled: boolean;
}
export interface Me {
  email: string;
  name: string | null;
  googleConnected: boolean;
  devLogin: boolean;
}
export interface AutomationRun {
  id: number;
  name: string;
  ok: boolean;
  startedAt: string;
}

export class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
