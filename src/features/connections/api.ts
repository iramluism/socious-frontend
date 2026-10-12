import { memoFetch } from "../../shared/api/client";
import type {
  Connection,
  ConnectionFamily,
  ConsentUrlResponse,
  CreateConnectionRequest,
  KindResponse,
  OAuthAppResponse,
} from "./types";

/** Lists all connections from ``GET /connections``. */
export function listConnections(): Promise<Connection[]> {
  return memoFetch<Connection[]>("/connections");
}

/** Fetches one connection from ``GET /connections/{id}``. */
export function getConnection(connectionId: string): Promise<Connection> {
  return memoFetch<Connection>(`/connections/${encodeURIComponent(connectionId)}`);
}

/** Creates a connection via ``POST /connections``. */
export function createConnection(
  body: CreateConnectionRequest,
): Promise<Connection> {
  return memoFetch<Connection>("/connections", { method: "POST", body });
}

/** Regenerates OAuth consent URL via ``POST /connections/{id}/consent``. */
export function regenerateConsent(
  connectionId: string,
): Promise<ConsentUrlResponse> {
  return memoFetch<ConsentUrlResponse>(
    `/connections/${encodeURIComponent(connectionId)}/consent`,
    { method: "POST" },
  );
}

/** Revokes a connection via ``POST /connections/{id}/revoke``. */
export function revokeConnection(connectionId: string): Promise<void> {
  return memoFetch<void>(
    `/connections/${encodeURIComponent(connectionId)}/revoke`,
    { method: "POST" },
  );
}

/** Reads masked OAuth app config via ``GET /oauth-apps/{family}``. */
export function getOAuthApp(family: ConnectionFamily): Promise<OAuthAppResponse> {
  return memoFetch<OAuthAppResponse>(
    `/oauth-apps/${encodeURIComponent(family)}`,
  );
}

/** Returns the data-source kind catalog from ``GET /kinds``. */
export function listKinds(): Promise<KindResponse[]> {
  return memoFetch<KindResponse[]>("/kinds");
}
