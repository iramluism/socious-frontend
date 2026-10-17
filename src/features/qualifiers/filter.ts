import type { Classifier } from "./types";

/** Normalizes text for case- and accent-insensitive filtering. */
export function normalizeQualifierText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

/**
 * Filters classifiers by name, description or active state.
 */
export function filterClassifiers(
  items: readonly Classifier[],
  query: string,
): Classifier[] {
  const needle = normalizeQualifierText(query.trim());
  if (!needle) {
    return [...items];
  }
  return items.filter((item) => {
    const haystack = normalizeQualifierText(
      [
        item.name,
        item.description ?? "",
        item.active ? "activo" : "inactivo",
        String(item.id),
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
