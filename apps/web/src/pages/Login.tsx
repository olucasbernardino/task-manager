import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../api";

export default function Login({ devLogin }: { devLogin: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const err = new URLSearchParams(location.search).get("login");

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 px-6 text-center">
      <img src="/icon.svg" alt="" className="mx-auto size-20" />
      <div>
        <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("login.subtitle")}</p>
      </div>
      {(err === "failed" || err === "denied") && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{t(`login.${err}`)}</p>
      )}
      <a href="/api/auth/google" className="btn btn-primary">{t("login.google")}</a>
      {devLogin && (
        <button className="btn btn-ghost" onClick={async () => { await api("/auth/dev-login", { method: "POST", body: {} }); await qc.invalidateQueries({ queryKey: ["me"] }); }}>
          {t("login.dev")}
        </button>
      )}
    </main>
  );
}
