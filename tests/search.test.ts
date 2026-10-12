import { describe, it, expect } from "vitest";
import { searchMemories, excerpt } from "../src/features/query/search";
import { initialMemories } from "../src/features/memories/data";
describe("local query contract", () => {
  it("normalizes accents/case and ranks distinct word matches", () => {
    const results = searchMemories(initialMemories, {
      text: "REUNIÓN planificación",
      collection: "",
      source: "",
    });
    expect(results[0].memory.id).toBe("planning");
    expect(results[0].score).toBe(2);
  });
  it("combines source and collection filters and excludes archived memories", () => {
    expect(
      searchMemories(initialMemories, {
        text: "memoria",
        collection: "Proyecto",
        source: "Documentos",
      }).map((r) => r.memory.id),
    ).toEqual(["architecture"]);
    expect(
      searchMemories(initialMemories, {
        text: "boceto",
        collection: "",
        source: "",
      }),
    ).toEqual([]);
  });
  it("rejects empty lexical queries and handles no match", () => {
    for (const text of ["", "  ", "???", "xyznonexistent"])
      expect(
        searchMemories(initialMemories, { text, collection: "", source: "" }),
      ).toEqual([]);
  });
  it("breaks equal scores by most recent date", () => {
    const memories = initialMemories
      .slice(0, 2)
      .map((m) => ({ ...m, title: "idea", content: "" }));
    expect(
      searchMemories(memories, {
        text: "idea idea",
        collection: "",
        source: "",
      }).map((r) => [r.memory.id, r.score]),
    ).toEqual([
      ["socious", 1],
      ["planning", 1],
    ]);
  });
  it("centers long excerpts around a matching term", () => {
    expect(
      excerpt("inicio ".repeat(50) + "memoria importante", "memoria"),
    ).toContain("memoria importante");
  });
});
