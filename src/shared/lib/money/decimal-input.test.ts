import { describe, expect, it } from "vitest";
import {
  formatNumberDraft,
  isValidDecimalDraft,
  parseDecimalDraft,
} from "./decimal-input";

describe("isValidDecimalDraft", () => {
  it("accepts empty and partial decimal input", () => {
    expect(isValidDecimalDraft("")).toBe(true);
    expect(isValidDecimalDraft("0")).toBe(true);
    expect(isValidDecimalDraft("0.")).toBe(true);
    expect(isValidDecimalDraft("0,")).toBe(true);
    expect(isValidDecimalDraft("0,00016007")).toBe(true);
    expect(isValidDecimalDraft(".5")).toBe(true);
  });

  it("rejects invalid characters", () => {
    expect(isValidDecimalDraft("abc")).toBe(false);
    expect(isValidDecimalDraft("1.2.3")).toBe(false);
    expect(isValidDecimalDraft("1-2")).toBe(false);
  });
});

describe("parseDecimalDraft", () => {
  it("parses comma and dot decimals", () => {
    expect(parseDecimalDraft("0,00016007")).toBe(0.00016007);
    expect(parseDecimalDraft("0.00016007")).toBe(0.00016007);
    expect(parseDecimalDraft("1234.56")).toBe(1234.56);
  });

  it("returns undefined for incomplete drafts", () => {
    expect(parseDecimalDraft("")).toBeUndefined();
    expect(parseDecimalDraft(".")).toBeUndefined();
    expect(parseDecimalDraft("0.")).toBe(0);
  });
});

describe("formatNumberDraft", () => {
  it("formats numbers as strings", () => {
    expect(formatNumberDraft(0.00016007)).toBe("0.00016007");
    expect(formatNumberDraft(undefined)).toBe("");
  });
});