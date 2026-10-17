import { vi } from "vitest";
import { AUTH_TOKEN_STORAGE_KEY } from "../src/shared/api/client";
import { connections, googleOAuthKinds } from "./fixtures/connections";
import { ambitoLabels, classifiers } from "./fixtures/classifiers";
import type { Capture } from "../src/features/captures/types";
import type { QueryHit, QueryResponse } from "../src/features/query/types";
import type { Classifier, Label } from "../src/features/qualifiers/types";

/**
 * Installs a fetch mock for Memo connection list/detail routes used in App tests.
 */
export function mockMemoConnectionsFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const authMe = jsonIfAuthMe(url, method);
      if (authMe) return authMe;

      if (url.includes("/kinds") && method === "GET") {
        return jsonResponse(googleOAuthKinds);
      }

      if (url.includes("/oauth-apps/") && method === "GET") {
        return jsonResponse({
          family: "google_oauth2",
          redirect_uri:
            "http://127.0.0.1:8000/api/v1/memo/oauth/google/callback",
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

/**
 * Installs a fetch mock for classifier/label routes used in App tests.
 */
export function mockMemoClassifiersFetch(): void {
  const registry: Classifier[] = classifiers.map((item) => ({ ...item }));
  const labelsByClassifier = new Map<number, Label[]>([
    [1, ambitoLabels.map((item) => ({ ...item }))],
    [2, []],
  ]);
  let nextClassifierId = 3;
  let nextLabelId = 20;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const body = parseBody(init?.body);
      const authMe = jsonIfAuthMe(url, method);
      if (authMe) return authMe;

      const labelsMatch = url.match(/\/classifiers\/(\d+)\/labels/);
      if (labelsMatch && method === "GET") {
        return jsonResponse(
          labelsByClassifier.get(Number(labelsMatch[1])) ?? [],
        );
      }
      if (labelsMatch && method === "POST") {
        const classifierId = Number(labelsMatch[1]);
        const created: Label = {
          id: nextLabelId++,
          classifier_id: classifierId,
          name: String(body.name ?? ""),
          active: true,
          used: false,
        };
        const current = labelsByClassifier.get(classifierId) ?? [];
        labelsByClassifier.set(classifierId, [...current, created]);
        return jsonResponse(created, 201);
      }

      if (url.endsWith("/classifiers") && method === "GET") {
        return jsonResponse(registry);
      }
      if (url.endsWith("/classifiers") && method === "POST") {
        const created: Classifier = {
          id: nextClassifierId++,
          name: String(body.name ?? ""),
          description:
            typeof body.description === "string" ? body.description : null,
          active: true,
        };
        registry.push(created);
        labelsByClassifier.set(created.id, []);
        return jsonResponse(created, 201);
      }

      return jsonResponse(
        { code: "unexpected", message: `Unhandled fetch ${method} ${url}` },
        500,
      );
    }),
  );
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== "string" || !body) {
    return {};
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Installs a fetch mock for query, capture and classifier/label routes.
 */
export function mockMemoQueryAndCaptureFetch(
  options: {
    queryResults?: QueryHit[];
    captureFail?: boolean;
    forgetFail?: boolean;
    documentFail?: boolean;
  } = {},
): {
  captures: Capture[];
  forgottenIds: string[];
  uploadedDocuments: string[];
  lastQueryBody: () => Record<string, unknown> | null;
} {
  const captures: Capture[] = [];
  const forgottenIds: string[] = [];
  const uploadedDocuments: string[] = [];
  let lastQueryBody: Record<string, unknown> | null = null;
  const registry: Classifier[] = classifiers.map((item) => ({ ...item }));
  const labelsByClassifier = new Map<number, Label[]>([
    [1, ambitoLabels.map((item) => ({ ...item }))],
    [2, []],
  ]);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const body = parseBody(init?.body);
      const authMe = jsonIfAuthMe(url, method);
      if (authMe) return authMe;

      if (url.includes("/query") && method === "POST") {
        lastQueryBody = body;
        const response: QueryResponse = {
          results: options.queryResults ?? [
            {
              id: "hit-1",
              text: "Fragmento sobre planificación del proyecto telescopio",
              source: "nota.md",
              kind: "memo/capture",
              metadata: {},
              classifications: {
                "1": {
                  label_id: 12,
                  label_name: "Laboral",
                  score: 0.91,
                },
              },
              distance: 0.12,
            },
          ],
        };
        return jsonResponse(response);
      }

      const forgetMatch = url.match(/\/captures\/([^/?]+)$/);
      if (forgetMatch && method === "DELETE") {
        if (options.forgetFail) {
          return jsonResponse(
            { code: "chunk_not_found", message: "Fragmento no encontrado" },
            404,
          );
        }
        forgottenIds.push(decodeURIComponent(forgetMatch[1]));
        return new Response(null, { status: 204 });
      }

      if (url.endsWith("/captures") && method === "POST") {
        if (options.captureFail) {
          return jsonResponse(
            { code: "invalid_capture", message: "Cuerpo inválido" },
            400,
          );
        }
        const created: Capture = {
          id: crypto.randomUUID(),
          body: String(body.body ?? ""),
          reference_at: String(body.reference_at ?? ""),
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
        };
        captures.push(created);
        return jsonResponse(created, 201);
      }

      if (url.endsWith("/documents") && method === "POST") {
        if (options.documentFail) {
          return jsonResponse(
            { code: "invalid_document", message: "Documento inválido" },
            422,
          );
        }
        const filename = formDataFileName(init?.body);
        uploadedDocuments.push(filename);
        return jsonResponse(
          { task_id: crypto.randomUUID(), status: "accepted" },
          202,
        );
      }

      const labelsMatch = url.match(/\/classifiers\/(\d+)\/labels/);
      if (labelsMatch && method === "GET") {
        return jsonResponse(
          labelsByClassifier.get(Number(labelsMatch[1])) ?? [],
        );
      }
      if (url.endsWith("/classifiers") && method === "GET") {
        return jsonResponse(registry);
      }

      return jsonResponse(
        { code: "unexpected", message: `Unhandled fetch ${method} ${url}` },
        500,
      );
    }),
  );

  return {
    captures,
    forgottenIds,
    uploadedDocuments,
    lastQueryBody: () => lastQueryBody,
  };
}

function formDataFileName(body: BodyInit | null | undefined): string {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const file = body.get("file");
    if (file instanceof File) return file.name;
    if (typeof file === "string" && file) return file;
  }
  return "unknown";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const TEST_AUTH_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "ira",
  created_at: "2026-10-17T12:00:00+00:00",
};

/** Persist a dummy JWT so AuthProvider hydrates via GET /me. */
export function stubAuthSession(): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "test-jwt");
}

function jsonIfAuthMe(url: string, method: string): Response | null {
  if (method === "GET" && url.includes("/auth/me")) {
    return jsonResponse(TEST_AUTH_USER);
  }
  return null;
}
