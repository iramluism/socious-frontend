import type { Connection } from "./types";

/**
 * Normalizes text for case- and accent-insensitive connection filtering.
 *
 * Parameters
 * ----------
 * value : string
 *     Raw user or field text.
 *
 * Returns
 * -------
 * string
 *     Lowercased string without combining diacritical marks.
 */
export function normalizeConnectionText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

/**
 * Filters connections by a free-text query across visible fields.
 *
 * Parameters
 * ----------
 * items : readonly Connection[]
 *     Full sample inventory.
 * query : string
 *     User filter text; empty or whitespace returns all items.
 *
 * Returns
 * -------
 * Connection[]
 *     Items whose display name, family, status, account, kinds or scopes match.
 */
export function filterConnections(
  items: readonly Connection[],
  query: string,
): Connection[] {
  const needle = normalizeConnectionText(query.trim());
  if (!needle) return [...items];
  return items.filter((item) => {
    const haystack = normalizeConnectionText(
      [
        item.display_name,
        item.family,
        item.status,
        item.external_account_id ?? "",
        item.requested_kinds.join(" "),
        item.scopes_granted.join(" "),
        item.consent_required ? "consentimiento requerido" : "",
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
