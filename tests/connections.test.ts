import { describe, it, expect } from "vitest";
import { connections } from "../src/features/connections/data";
import {
  filterConnections,
  normalizeConnectionText,
} from "../src/features/connections/filter";

describe("connections filter", () => {
  it("returns all items for empty or whitespace queries", () => {
    expect(filterConnections(connections, "")).toHaveLength(connections.length);
    expect(filterConnections(connections, "   ")).toHaveLength(
      connections.length,
    );
  });

  it("matches accent-insensitive text across visible fields", () => {
    const byName = filterConnections(connections, "GMAIL");
    expect(byName.some((item) => item.display_name === "Gmail personal")).toBe(
      true,
    );
    expect(byName.length).toBeGreaterThanOrEqual(2);

    const byStatus = filterConnections(connections, "pending_auth");
    expect(byStatus.every((item) => item.status === "pending_auth")).toBe(true);
    expect(byStatus.length).toBeGreaterThanOrEqual(2);

    const byFamily = filterConnections(connections, "api_key");
    expect(byFamily).toHaveLength(1);
    expect(byFamily[0]?.requested_kinds).toContain("fts");

    expect(normalizeConnectionText("Índice")).toBe("indice");
  });

  it("covers all connection statuses in sample data", () => {
    const statuses = new Set(connections.map((item) => item.status));
    expect(statuses).toEqual(
      new Set(["pending_auth", "active", "revoked", "error"]),
    );
    expect(connections.length).toBeGreaterThanOrEqual(6);
    expect(connections.length).toBeLessThanOrEqual(10);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterConnections(connections, "zzzz-no-existe")).toEqual([]);
  });
});
