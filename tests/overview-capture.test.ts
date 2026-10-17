import { describe, expect, it } from "vitest";
import { buildCaptureBody } from "../src/features/memories/OverviewPage";

describe("buildCaptureBody", () => {
  it("returns trimmed text when there are no files", () => {
    expect(buildCaptureBody("  hola  ", [])).toBe("hola");
  });

  it("appends adjunts line with file names", () => {
    const files = [
      new File(["a"], "a.md"),
      new File(["b"], "b.pdf"),
    ];
    expect(buildCaptureBody("texto", files)).toBe(
      "texto\n\nadjunts: a.md, b.pdf",
    );
  });

  it("uses only adjunts when text is empty", () => {
    expect(buildCaptureBody("  ", [new File(["x"], "solo.txt")])).toBe(
      "adjunts: solo.txt",
    );
  });
});
