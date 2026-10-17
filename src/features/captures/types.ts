/** Capture persisted by Memo (mirrors socius ``CaptureResponse``). */
export interface Capture {
  id: string;
  body: string;
  reference_at: string;
  created_at: string;
  modified_at: string;
}

/** Body for ``POST /captures``. */
export interface CreateCaptureRequest {
  body: string;
  reference_at: string;
}
