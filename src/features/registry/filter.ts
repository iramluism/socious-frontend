import type { RegistryItem } from "./types";

/**
 * Normalizes text for case- and accent-insensitive registry filtering.
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
export function normalizeRegistryText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

/**
 * Filters registry items by a free-text query across visible fields.
 *
 * Parameters
 * ----------
 * items : readonly RegistryItem[]
 *     Full sample inventory.
 * query : string
 *     User filter text; empty or whitespace returns all items.
 *
 * Returns
 * -------
 * RegistryItem[]
 *     Items whose name, category, status, owner, source or description match.
 */
export function filterRegistryItems(
  items: readonly RegistryItem[],
  query: string,
): RegistryItem[] {
  const needle = normalizeRegistryText(query.trim());
  if (!needle) return [...items];
  return items.filter((item) => {
    const haystack = normalizeRegistryText(
      [
        item.name,
        item.category,
        item.status,
        item.owner,
        item.source,
        item.description,
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
