import { describe, it, expect } from "vitest";
import { registryItems } from "../src/features/registry/data";
import {
  filterRegistryItems,
  normalizeRegistryText,
} from "../src/features/registry/filter";

describe("registry filter", () => {
  it("returns all items for empty or whitespace queries", () => {
    expect(filterRegistryItems(registryItems, "")).toHaveLength(
      registryItems.length,
    );
    expect(filterRegistryItems(registryItems, "   ")).toHaveLength(
      registryItems.length,
    );
  });

  it("matches accent-insensitive text across visible fields", () => {
    const byName = filterRegistryItems(registryItems, "ESQUEMA");
    expect(byName.every((item) => item.category === "Esquema")).toBe(true);
    expect(byName.length).toBeGreaterThanOrEqual(2);

    const byStatus = filterRegistryItems(registryItems, "indexando");
    expect(byStatus.map((item) => item.id)).toContain("idx-reuniones");

    expect(normalizeRegistryText("Índice")).toBe("indice");
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterRegistryItems(registryItems, "zzzz-no-existe")).toEqual([]);
  });
});
