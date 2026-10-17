import type { Connection } from "../connections/types";
import type { KindResponse } from "../connections/types";

/**
 * Whether a connection can back a data source of the given kind.
 */
export function connectionSupportsKind(
  connection: Connection,
  kindSpec: KindResponse,
): boolean {
  if (connection.family !== kindSpec.family) {
    return false;
  }
  if (connection.status !== "active") {
    return false;
  }
  return kindSpec.required_scopes.every((scope) =>
    connection.scopes_granted.includes(scope),
  );
}
