export type Theme = "dark" | "light" | "system";

const COLORS = { dark: "#0f172a", light: "#f8fafc" };

export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem("tm_theme", theme);
  } catch {}
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? COLORS.dark : COLORS.light);
}

export function initialTheme(): Theme {
  try {
    const t = localStorage.getItem("tm_theme");
    if (t === "dark" || t === "light" || t === "system") return t;
  } catch {}
  return "dark"; // dark by default
}

// Keep "follow device" live when the OS theme flips.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (initialTheme() === "system") applyTheme("system");
});
