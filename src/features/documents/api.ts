import { memoFetch } from "../../shared/api/client";
import type { DocumentAccepted } from "./types";

/** Enqueues a file for ingest via ``POST /documents`` (multipart). */
export function uploadDocument(file: File): Promise<DocumentAccepted> {
  const form = new FormData();
  form.append("file", file, file.name);
  return memoFetch<DocumentAccepted>("/documents", {
    method: "POST",
    body: form,
  });
}
