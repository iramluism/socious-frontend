import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, memoFetch } from "../src/shared/api/client";
import {
  createConnection,
  listConnections,
  regenerateConsent,
  revokeConnection,
} from "../src/features/connections/api";
import { connections as fixtureConnections } from "./fixtures/connections";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("memoFetch", () => {
  it("parses JSON API errors into ApiError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "validation_error",
          message: "Datos inválidos",
          detail: "for_kinds vacío",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(memoFetch("/connections")).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      code: "validation_error",
      message: "Datos inválidos",
      detail: "for_kinds vacío",
    } satisfies Partial<ApiError>);
  });

  it("returns undefined for 204 responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      memoFetch<void>("/connections/id/revoke", { method: "POST" }),
    ).resolves.toBeUndefined();
  });
});

describe("connections api", () => {
  it("lists connections from GET /connections", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fixtureConnections), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const items = await listConnections();
    expect(items).toHaveLength(fixtureConnections.length);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/memo/connections",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("surfaces list failures as ApiError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ code: "internal", message: "Fallo interno" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(listConnections()).rejects.toBeInstanceOf(ApiError);
  });

  it("creates a connection via POST /connections", async () => {
    const created = {
      ...fixtureConnections[0],
      id: "new-connection-id",
      status: "pending_auth" as const,
      consent_required: true,
      consent_url: "https://accounts.google.com/o/oauth2/v2/auth?state=test",
    };

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(created), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await createConnection({
      family: "google_oauth2",
      display_name: "Nueva",
      for_kinds: ["google_gmail"],
    });

    expect(result.id).toBe("new-connection-id");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/memo/connections",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          family: "google_oauth2",
          display_name: "Nueva",
          for_kinds: ["google_gmail"],
        }),
      }),
    );
  });

  it("calls consent and revoke endpoints", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ consent_url: "https://consent.example" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const consent = await regenerateConsent("conn-1");
    expect(consent.consent_url).toBe("https://consent.example");
    await expect(revokeConnection("conn-1")).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/memo/connections/conn-1/consent",
      expect.objectContaining({ method: "POST" }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/memo/connections/conn-1/revoke",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
