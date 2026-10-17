/** Body for ``POST /query``. */
export interface QueryRequest {
  query: string;
  labels?: string[];
  top_k?: number;
}

/** Classification attached to a query hit. */
export interface ClassificationEntry {
  label_id: number;
  label_name: string;
  score: number;
}

/** Fragment returned by semantic search (mirrors socius ``QueryHitResponse``). */
export interface QueryHit {
  id: string;
  text: string;
  source: string | number | null;
  kind: string | number | null;
  metadata: Record<string, string | number>;
  classifications: Record<string, ClassificationEntry>;
  distance: number;
}

/** Response for ``POST /query``. */
export interface QueryResponse {
  results: QueryHit[];
}

/** Query inputs retained together in session history. */
export interface QueryInput {
  text: string;
  labels: string[];
}
