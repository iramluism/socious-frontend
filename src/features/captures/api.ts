import { memoFetch } from "../../shared/api/client";
import type { Capture, CreateCaptureRequest } from "./types";

/**
 * Creates a capture via ``POST /captures``.
 *
 * Parameters
 * ----------
 * body : CreateCaptureRequest
 *     Plain-text body and reference date.
 *
 * Returns
 * -------
 * Promise<Capture>
 *     Persisted capture.
 *
 * Raises
 * ------
 * ApiError
 *     When the Memo API rejects the request.
 */
export function createCapture(body: CreateCaptureRequest): Promise<Capture> {
  return memoFetch<Capture>("/captures", { method: "POST", body });
}

/**
 * Forgets a capture or every chunk that shares the same document ``source``.
 *
 * Calls ``DELETE /captures/{memoryId}``. Capture ids remove one note; other
 * chunk ids remove the whole ingested document.
 *
 * Parameters
 * ----------
 * memoryId : string
 *     Capture UUID, ``capture-{uuid}``, or a query hit id.
 *
 * Raises
 * ------
 * ApiError
 *     When the id is missing (404), ``source`` is absent (422), or the vector
 *     store fails (503).
 */
export function forgetMemory(memoryId: string): Promise<void> {
  return memoFetch<void>(`/captures/${encodeURIComponent(memoryId)}`, {
    method: "DELETE",
  });
}
