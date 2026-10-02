import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ApiError } from "./api";
import { useMe, useSettings } from "./hooks";
import { setLanguage } from "./i18n";
import Inbox from "./pages/Inbox";
import Login from "./pages/Login";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import Upcoming from "./pages/Upcoming";
import { applyTheme } from "./theme";

const NAV = [
  { to: "/inbox", key: "inbox", icon: "📥" },
  { to: "/today", key: "today", icon: "☀️" },
  { to: "/upcoming", key: "upcoming", icon: "📅" },
  { to: "/projects", key: "projects", icon: "🗂️" },
  { to: "/settings", key: "settings", icon: "⚙️" },
] as const;

export default function App() {
  const { t } = useTranslation();
  const me = useMe();
  const settings = useSettings();

  // Server-stored preferences win once loaded (and are cached locally for instant paint next time).
  useEffect(() => {
    if (!settings.data) return;
    applyTheme(settings.data.theme);
    void setLanguage(settings.data.language);
  }, [settings.data]);

  if (me.isLoading) return <p className="p-8 text-center text-slate-500">{t("common.loading")}</p>;
  if (me.error instanceof ApiError && me.error.status === 401) return <Login devLogin={new URLSearchParams(location.search).has("dev") || import.meta.env.DEV} />;
  if (me.error) return <p className="p-8 text-center text-red-500">{t("common.error")}</p>;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <main className="safe-top flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/today" element={<Today />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95" aria-label="Main">
        <ul className="mx-auto flex max-w-2xl">
          {NAV.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink to={n.to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? "font-semibold text-indigo-500" : "text-slate-500 dark:text-slate-400"}`}>
                <span className="text-lg leading-none" aria-hidden>{n.icon}</span>
                {t(`nav.${n.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
