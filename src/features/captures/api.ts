import { memoFetch } from "../../shared/api/client";
import type { Capture, CreateCaptureRequest } from "./types";

/** Creates a capture via ``POST /captures``. */
export function createCapture(body: CreateCaptureRequest): Promise<Capture> {
  return memoFetch<Capture>("/captures", { method: "POST", body });
}
