import { describe, it, expect } from "vitest";
import { excerpt, formatLabels, normalize } from "../src/features/query/search";

describe("query helpers", () => {
  it("normalizes accents and case", () => {
    expect(normalize("REUNIÓN")).toBe("reunion");
  });

  it("formats selected labels for history", () => {
    expect(formatLabels([])).toBe("Sin filtro de labels");
    expect(formatLabels(["Personal", "Laboral"])).toBe("Personal · Laboral");
  });

  it("centers long excerpts around a matching term", () => {
    expect(
      excerpt("inicio ".repeat(50) + "memoria importante", "memoria"),
    ).toContain("memoria importante");
  });
});
