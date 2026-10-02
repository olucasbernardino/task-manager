// Renders public/icon.svg to the PNG sizes the PWA manifest needs.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("apps/web/public/icon.svg", "utf8");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  writeFileSync(`apps/web/public/icon-${size}.png`, await page.screenshot({ omitBackground: true }));
}
await browser.close();
