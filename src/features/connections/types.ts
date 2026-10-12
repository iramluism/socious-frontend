/** Credential strategy for an illustrative Connection (mirrors backend family). */
export type ConnectionFamily = "google_oauth2" | "api_key";

/**
 * Lifecycle status of a Connection (mirrors backend ConnectionStatus).
 *
 * pending_auth: OAuth consent still required.
 * active: ready for sync.
 * revoked: credentials revoked.
 * error: auth/refresh failure.
 */
export type ConnectionStatus =
  | "pending_auth"
  | "active"
  | "revoked"
  | "error";

/**
 * Data-source kind requested when creating a connection
 * (mirrors backend DataSourceKind values used in for_kinds / requested_kinds).
 */
export type ConnectionKind =
  | "google_gmail"
  | "google_drive"
  | "google_meet"
  | "google_play"
  | "fts";

/**
 * Safe ConnectionResponse-shaped sample for the Memo demo.
 *
 * Mirrors socius ``ConnectionResponse``: no encrypted_secrets or profile_json.
 * Values are sample-only; nothing is persisted or fetched remotely.
 */
export interface Connection {
  id: string;
  family: ConnectionFamily;
  display_name: string;
  status: ConnectionStatus;
  consent_required: boolean;
  consent_url: string | null;
  external_account_id: string | null;
  scopes_granted: string[];
  requested_kinds: ConnectionKind[];
  created_at: string;
  modified_at: string;
}
