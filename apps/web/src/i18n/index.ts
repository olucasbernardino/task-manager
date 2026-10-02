import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import es from "./es";
import ptBR from "./pt-BR";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "es", label: "Español" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

function initial(): LangCode {
  try {
    const saved = localStorage.getItem("tm_lang");
    if (LANGUAGES.some((l) => l.code === saved)) return saved as LangCode;
  } catch {}
  const nav = navigator.language;
  if (nav.startsWith("pt")) return "pt-BR";
  if (nav.startsWith("es")) return "es";
  return "en";
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, "pt-BR": { translation: ptBR }, es: { translation: es } },
  lng: initial(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setLanguage(code: LangCode) {
  try {
    localStorage.setItem("tm_lang", code);
  } catch {}
  document.documentElement.lang = code;
  return i18n.changeLanguage(code);
}

export default i18n;
