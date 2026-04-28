import { describe, it, expect } from "vitest";
import { padCode, formatCurrency, arabicNumerals } from "@/lib/utils";

describe("padCode", () => {
  it("pads with zeros to width 6", () => {
    expect(padCode(1)).toBe("000001");
    expect(padCode(99)).toBe("000099");
    expect(padCode(123456)).toBe("123456");
  });
  it("respects custom width", () => {
    expect(padCode(7, 4)).toBe("0007");
  });
});

describe("formatCurrency", () => {
  it("formats numbers in EGP by default", () => {
    const f = formatCurrency(1500);
    // Arabic-Egypt locale uses Eastern Arabic numerals
    expect(f).toMatch(/[١0-9]/);
    expect(f.length).toBeGreaterThan(2);
  });
  it("handles null/undefined", () => {
    expect(typeof formatCurrency(null)).toBe("string");
    expect(typeof formatCurrency(undefined)).toBe("string");
  });
});

describe("arabicNumerals", () => {
  it("converts ASCII digits to Arabic-Indic", () => {
    expect(arabicNumerals("123")).toBe("١٢٣");
    expect(arabicNumerals(2026)).toBe("٢٠٢٦");
  });
  it("leaves non-digits intact", () => {
    expect(arabicNumerals("abc 1 def")).toBe("abc ١ def");
  });
});
