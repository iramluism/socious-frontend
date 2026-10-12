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
 * Safe ConnectionResponse from the Memo API.
 *
 * Mirrors socius ``ConnectionResponse``: no encrypted_secrets or profile_json.
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

/** Body for ``POST /connections`` (mirrors socius ``CreateConnectionRequest``). */
export interface CreateConnectionRequest {
  family: ConnectionFamily;
  display_name: string;
  for_kinds: ConnectionKind[];
}

/** Response from ``POST /connections/{id}/consent``. */
export interface ConsentUrlResponse {
  consent_url: string;
}

/** Masked OAuth app status from ``GET /oauth-apps/{family}``. */
export interface OAuthAppResponse {
  family: ConnectionFamily;
  redirect_uri: string;
  client_id_masked: string | null;
  client_secret_masked: string | null;
  configured: boolean;
}

/** Catalog entry from ``GET /kinds``. */
export interface KindResponse {
  kind: ConnectionKind;
  family: ConnectionFamily;
  required_scopes: string[];
  implemented: boolean;
  config_schema: Record<string, unknown> | null;
}
