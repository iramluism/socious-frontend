const DEFAULT_MEMO_API_BASE = "/api/v1/memo";

/** Parsed JSON error body from the Memo REST API. */
export interface ApiErrorBody {
  code: string;
  message: string;
  detail?: string;
}

/** HTTP failure from {@link memoFetch} with structured API error fields when present. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.detail = body.detail;
  }
}

/**
 * Memo API base URL (no trailing slash).
 *
 * Returns
 * -------
 * string
 *     ``VITE_MEMO_API_BASE`` when set, otherwise ``/api/v1/memo``.
 */
export function memoApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_MEMO_API_BASE;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, "");
  }
  return DEFAULT_MEMO_API_BASE;
}

function resolveMemoUrl(path: string): string {
  const base = memoApiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function defaultErrorMessage(status: number, fallback: string): string {
  if (status >= 500) {
    return "Error del servidor. Inténtalo de nuevo más tarde.";
  }
  return fallback || `Error HTTP ${status}`;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiErrorBody(status: number, payload: unknown): ApiErrorBody {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : defaultErrorMessage(status, responseStatusText(status));
    const code =
      typeof record.code === "string" ? record.code : `http_${status}`;
    const detail =
      typeof record.detail === "string" ? record.detail : undefined;
    return { code, message, detail };
  }
  return {
    code: `http_${status}`,
    message: defaultErrorMessage(status, "Respuesta no válida del servidor"),
  };
}

function responseStatusText(status: number): string {
  return status === 404 ? "No encontrado" : "";
}

export interface MemoFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Typed ``fetch`` against the Memo API with JSON request/response handling.
 *
 * Parameters
 * ----------
 * path : str
 *     Path relative to the Memo API base (e.g. ``/connections``).
 * options : MemoFetchOptions, optional
 *     Standard fetch options; ``body`` is JSON-serialized when provided.
 *
 * Returns
 * -------
 * Promise<T>
 *     Parsed JSON body, or ``undefined`` for 204 No Content.
 *
 * Raises
 * ------
 * ApiError
 *     When the response is not ok and the body matches ``{ code, message, detail? }``
 *     or a generic HTTP error is synthesized.
 */
export async function memoFetch<T>(
  path: string,
  options: MemoFetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(resolveMemoUrl(path), init);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseJsonBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, toApiErrorBody(response.status, payload));
  }

  return payload as T;
}
