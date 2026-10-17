import { afterEach, describe, expect, it, vi } from "vitest";
import { createCapture, forgetMemory } from "../src/features/captures/api";
import { queryMemos } from "../src/features/query/api";
import { mockMemoQueryAndCaptureFetch } from "./memoApiMock";

describe("query and capture API clients", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts query text and labels", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    const response = await queryMemos({
      query: "planificación",
      labels: ["Laboral"],
      top_k: 5,
    });
    expect(response.results).toHaveLength(1);
    expect(api.lastQueryBody()).toEqual({
      query: "planificación",
      labels: ["Laboral"],
      top_k: 5,
    });
    expect(api.lastQueryBody()).not.toHaveProperty("collection_id");
  });

  it("posts capture body and reference date", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    const created = await createCapture({
      body: "Nota rápida",
      reference_at: "2026-10-17",
    });
    expect(created.body).toBe("Nota rápida");
    expect(api.captures).toHaveLength(1);
    expect(api.captures[0].reference_at).toBe("2026-10-17");
  });

  it("deletes a memory by capture or chunk id", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    await forgetMemory("capture-abc");
    expect(api.forgottenIds).toEqual(["capture-abc"]);
  });
});
