import { describe, expect, it } from "vitest";
import en from "./en";
import es from "./es";
import ptBR from "./pt-BR";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("i18n key coverage", () => {
  const base = keys(en).sort();
  it.each([["pt-BR", ptBR], ["es", es]])("%s has exactly the English keys", (_n, lang) => {
    expect(keys(lang as Record<string, unknown>).sort()).toEqual(base);
  });
  it("has no empty strings", () => {
    for (const l of [en, es, ptBR]) for (const k of keys(l)) expect(k).toBeTruthy();
  });
});
