import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type Settings as S } from "../api";
import { LANGUAGES, setLanguage, type LangCode } from "../i18n";
import { useMe, useRuns, useSettings, useUpdateSettings } from "../hooks";
import { applyTheme } from "../theme";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const me = useMe().data;
  const settings = useSettings().data;
  const runs = useRuns().data;
  const update = useUpdateSettings();
  const [cv, setCv] = useState("");
  const [roles, setRoles] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setCv(settings.cvText);
      setRoles(settings.targetRoles);
    }
  }, [settings]);

  const label = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t("nav.settings")}</h1>

      <div>
        <label className={label} htmlFor="s-lang">{t("settings.language")}</label>
        <select id="s-lang" value={i18n.language} onChange={(e) => { void setLanguage(e.target.value as LangCode); update.mutate({ language: e.target.value as S["language"] }); }}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="s-theme">{t("settings.theme")}</label>
        <select id="s-theme" value={settings?.theme ?? "dark"} onChange={(e) => { applyTheme(e.target.value as S["theme"]); update.mutate({ theme: e.target.value as S["theme"] }); }}>
          <option value="dark">{t("settings.themeDark")}</option>
          <option value="light">{t("settings.themeLight")}</option>
          <option value="system">{t("settings.themeSystem")}</option>
        </select>
      </div>

      <div>
        <label className={label} htmlFor="s-brief">{t("settings.briefingTime")}</label>
        <input id="s-brief" type="time" value={settings?.briefingTime ?? "08:00"} onChange={(e) => e.target.value && update.mutate({ briefingTime: e.target.value })} />
      </div>

      <div>
        <label className={label} htmlFor="s-roles">{t("settings.targetRoles")}</label>
        <input id="s-roles" value={roles} onChange={(e) => setRoles(e.target.value)} onBlur={() => roles !== settings?.targetRoles && update.mutate({ targetRoles: roles }, { onSuccess: flash })} />
      </div>

      <div>
        <label className={label} htmlFor="s-cv">{t("settings.cv")}</label>
        <textarea id="s-cv" rows={6} value={cv} onChange={(e) => setCv(e.target.value)} onBlur={() => cv !== settings?.cvText && update.mutate({ cvText: cv }, { onSuccess: flash })} />
        <p className="mt-1 text-xs text-slate-500">{t("settings.cvHint")}</p>
      </div>
      {saved && <p role="status" className="text-sm text-emerald-500">{t("settings.saved")}</p>}

      <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800/70">
        <h2 className="font-medium">{t("settings.account")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{me?.email}</p>
        <p className="text-sm">
          {t("settings.google")}: <span className={me?.googleConnected ? "text-emerald-500" : "text-amber-500"}>{me?.googleConnected ? t("settings.connected") : t("settings.notConnected")}</span>
        </p>
        <button className="btn btn-ghost" onClick={async () => { await api("/auth/logout", { method: "POST", body: {} }); qc.clear(); location.assign("/"); }}>
          {t("settings.signOut")}
        </button>
      </section>

      <section>
        <h2 className="mb-2 font-medium">{t("settings.automations")}</h2>
        {runs?.length ? (
          <ul className="space-y-1 text-sm">
            {runs.slice(0, 10).map((r) => (
              <li key={r.id} className="flex justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-800/70">
                <span>{r.ok ? "✓" : "✗"} {r.name}</span>
                <span className="text-slate-500">{new Date(r.startedAt).toLocaleString(i18n.language)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">{t("settings.noRuns")}</p>}
      </section>
    </div>
  );
}
