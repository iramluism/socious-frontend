import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_TOKEN_STORAGE_KEY,
  authFetch,
  setStoredAuthToken,
} from "../src/shared/api/client";
import { getMe, login, signUp } from "../src/features/auth/api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "ira",
  created_at: "2026-10-17T12:00:00+00:00",
};

describe("authFetch", () => {
  it("sends Bearer token from localStorage", async () => {
    setStoredAuthToken("jwt-token");
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await authFetch("/me");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      }),
    );
  });
});

describe("auth api", () => {
  it("posts credentials to sign-up and login", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(user), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "jwt-token",
            token_type: "bearer",
            user,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await expect(signUp("Ira", "secret123")).resolves.toEqual(user);
    await expect(login("ira", "secret123")).resolves.toMatchObject({
      access_token: "jwt-token",
      token_type: "bearer",
    });
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/auth/sign-up",
      expect.objectContaining({ method: "POST" }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loads the current user from GET /me", async () => {
    setStoredAuthToken("jwt-token");
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getMe()).resolves.toEqual(user);
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("jwt-token");
  });
});
