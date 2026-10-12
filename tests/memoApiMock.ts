import { vi } from "vitest";
import {
  connections,
  googleOAuthKinds,
} from "./fixtures/connections";

/**
 * Installs a fetch mock for Memo connection list/detail routes used in App tests.
 */
export function mockMemoConnectionsFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method = (init?.method ?? "GET").toUpperCase();

      if (url.includes("/kinds") && method === "GET") {
        return jsonResponse(googleOAuthKinds);
      }

      if (url.includes("/oauth-apps/") && method === "GET") {
        return jsonResponse({
          family: "google_oauth2",
          redirect_uri: "http://127.0.0.1:8000/api/v1/memo/oauth/google/callback",
          client_id_masked: "demo…id",
          client_secret_masked: null,
          configured: true,
        });
      }

      const detailMatch = url.match(/\/connections\/([^/?]+)(?:\?|$)/);
      if (detailMatch && method === "GET") {
        const item = connections.find((entry) => entry.id === detailMatch[1]);
        if (!item) {
          return jsonResponse(
            { code: "not_found", message: "Conexión no encontrada" },
            404,
          );
        }
        return jsonResponse(item);
      }

      if (url.includes("/connections") && method === "GET") {
        return jsonResponse(connections);
      }

      return jsonResponse(
        { code: "unexpected", message: `Unhandled fetch ${method} ${url}` },
        500,
      );
    }),
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
