import { memoFetch } from "../../shared/api/client";
import type { QueryRequest, QueryResponse } from "./types";

/** Runs semantic search via ``POST /query``. */
export function queryMemos(body: QueryRequest): Promise<QueryResponse> {
  return memoFetch<QueryResponse>("/query", { method: "POST", body });
}
