// Phone-viewport (390x844) smoke test: all 3 languages x both themes, plus core flows.
// Usage: BASE_URL=http://localhost:5173 node e2e/smoke.mjs
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = "e2e/screens";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(BASE);
await page.getByRole("button", { name: /dev login/i }).click();
await page.waitForURL("**/today");
// Start from known preferences (settings persist server-side between runs).
await page.request.patch(`${BASE}/api/settings`, { data: { language: "en", theme: "dark" } });
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByRole("link", { name: "Inbox" }).waitFor();

// --- core flow (English) ---
await page.getByRole("link", { name: "Inbox" }).click();
await page.getByLabel("Add a task…").fill("Buy milk");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByText("Buy milk").waitFor();

await page.getByText("Buy milk").click(); // open editor
const today = new Date();
const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
await page.getByLabel("Due date").fill(ymd);
await page.getByLabel("Time").fill("18:30");
await page.getByLabel("Status").selectOption("todo");
await page.getByRole("button", { name: "Save" }).click();

await page.getByRole("link", { name: "Today" }).click();
await page.getByText("Buy milk").waitFor();
assert.ok(await page.getByText(/(18:30|6:30)/).isVisible(), "timed task shows its time in Today");

await page.getByRole("button", { name: "Complete" }).click();
await page.getByText("Buy milk").waitFor({ state: "detached" });

// --- projects + kanban drag ---
await page.getByRole("link", { name: "Projects" }).click();
await page.getByLabel("Project name").fill("Home");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByRole("link", { name: "Home" }).click();
await page.getByLabel("Add a task…").fill("Paint wall");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByText("Paint wall").waitFor();
await page.getByRole("button", { name: "Board" }).click();
const card = page.getByText("Paint wall");
const target = page.getByRole("region", { name: "Inbox" }); // visible without horizontal scroll at 390px
const cb = await card.boundingBox();
const tb = await target.boundingBox();
await page.mouse.move(cb.x + 10, cb.y + 10);
await page.mouse.down();
await page.mouse.move(cb.x + 20, cb.y + 20, { steps: 3 });
await page.mouse.move(tb.x + tb.width / 2, tb.y + 60, { steps: 10 });
await page.mouse.up();
await target.getByText("Paint wall").waitFor({ timeout: 5000 }).catch(async (e) => { await page.screenshot({ path: `${OUT}/drag-fail.png` }); throw e; });

// --- languages x themes ---
await page.getByRole("link", { name: "Settings" }).click();
const langs = { en: "Settings", "pt-BR": "Ajustes", es: "Ajustes" };
for (const [lang, title] of Object.entries(langs)) {
  for (const theme of ["dark", "light"]) {
    await page.locator("#s-lang").selectOption(lang);
    await page.locator("#s-theme").selectOption(theme);
    await page.getByRole("heading", { level: 1, name: title }).waitFor();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    assert.equal(isDark, theme === "dark", `${lang}/${theme} class`);
    await page.screenshot({ path: `${OUT}/settings-${lang}-${theme}.png` });
  }
}
await page.locator("#s-lang").selectOption("en");
await page.locator("#s-theme").selectOption("system");
await page.getByRole("link", { name: "Projects" }).click();
await page.screenshot({ path: `${OUT}/projects.png` });

// No horizontal page scroll at phone width.
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
assert.equal(overflow, false, "no horizontal overflow");

// Persisted preferences survive reload.
await page.reload();
await page.getByRole("link", { name: "Settings" }).click();
assert.equal(await page.locator("#s-theme").inputValue(), "system");

await browser.close();
assert.deepEqual(errors.filter((e) => !/favicon|404|401 \(Unauthorized\)/.test(e)), [], "no console/page errors");
console.log("smoke OK");
