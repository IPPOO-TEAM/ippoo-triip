import { describe, it, expect } from "vitest";
import { dictionaries, LANGUAGE_OPTIONS } from "../i18n/translations";

describe("i18n / dictionaries", () => {
  it("expose les 4 langues IPPOO", () => {
    expect(Object.keys(dictionaries).sort()).toEqual(["en", "fon", "fr", "yor"]);
  });

  it("chaque dictionnaire couvre toutes les clés", () => {
    const fr = dictionaries.fr;
    const keys = Object.keys(fr);
    for (const lang of ["fon", "yor", "en"] as const) {
      const d = dictionaries[lang] as Record<string, string>;
      for (const k of keys) {
        expect(d[k], `clé manquante: ${lang}.${k}`).toBeDefined();
      }
    }
  });

  it("LANGUAGE_OPTIONS contient bien fon et yor", () => {
    const codes = LANGUAGE_OPTIONS.map((l) => l.code);
    expect(codes).toContain("fon");
    expect(codes).toContain("yor");
  });
});
