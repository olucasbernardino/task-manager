// Ranks the idea files in docs/produto/ideias by weighted score.
// Usage: node scripts/compare-ideas.mjs [dir]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WEIGHTS = {
  dor_frequente: 3,
  ia_diferencial: 3,
  eu_sou_usuario: 2,
  cabe_no_gratis: 2,
  mvp_2_semanas: 2,
  outros_teriam_a_dor: 1,
};
const dir = process.argv[2] ?? "docs/produto/ideias";

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = line.replace(/\s+#.*$/, "").match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^"|"$/g, "");
  }
  return out;
}

const rows = readdirSync(dir)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .map((f) => {
    const fm = frontMatter(readFileSync(join(dir, f), "utf8"));
    const scores = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, fm[k] === "" || fm[k] === undefined ? null : Number(fm[k])]));
    const invalid = Object.entries(scores).filter(([, v]) => v !== null && !(Number.isInteger(v) && v >= 1 && v <= 5)).map(([k]) => k);
    const missing = Object.entries(scores).filter(([, v]) => v === null).map(([k]) => k);
    const complete = missing.length === 0 && invalid.length === 0;
    const total = complete
      ? Math.round((Object.entries(WEIGHTS).reduce((s, [k, w]) => s + w * scores[k], 0) / (Object.values(WEIGHTS).reduce((a, b) => a + b, 0) * 5)) * 100)
      : null;
    const veto = scores.dor_frequente !== null && scores.dor_frequente <= 2;
    return { file: f, nome: fm.nome || f, status: fm.status || "?", scores, missing, invalid, total, veto };
  });

const ranked = rows.filter((r) => r.total !== null).sort((a, b) => b.total - a.total);
const pending = rows.filter((r) => r.total === null);

console.log("| # | Ideia | Estado | Pontuação | Observação |\n|---|---|---|---|---|");
ranked.forEach((r, i) => console.log(`| ${i + 1} | ${r.nome} | ${r.status} | ${r.total}/100 | ${r.veto ? "VETO: dor pouco frequente" : ""} |`));
if (pending.length) {
  console.log("\nIncompletas (preencha as notas):");
  for (const r of pending)
    console.log(`- ${r.nome} (${r.file}): ${[...r.missing.map((k) => `falta ${k}`), ...r.invalid.map((k) => `${k} inválida (use 1 a 5)`)].join(", ")}`);
}
if (ranked.length >= 2 && ranked[0].total - ranked[1].total < 5) console.log("\nAviso: diferença menor que 5 pontos entre as duas primeiras; aplique a regra de desempate (menor risco de privacidade).");
