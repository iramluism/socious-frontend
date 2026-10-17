import { vi } from "vitest";
import {
  connections,
  googleOAuthKinds,
} from "./fixtures/connections";
import { ambitoLabels, classifiers } from "./fixtures/classifiers";
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

      const labelsMatch = url.match(/\/classifiers\/(\d+)\/labels/);
      if (labelsMatch && method === "GET") {
        return jsonResponse(labelsByClassifier.get(Number(labelsMatch[1])) ?? []);
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
