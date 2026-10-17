export const MIN_CREATE_LABELS = 2;
export const MAX_REGISTRY_NAME_LENGTH = 200;
export const MAX_CLASSIFIER_DESCRIPTION_LENGTH = 1000;

/** Trims a label name and rejects empty values. */
export function normalizeLabelName(value: string): string {
  return value.trim();
}

/** True when two names collide ignoring case and surrounding whitespace. */
export function labelNamesMatch(left: string, right: string): boolean {
  return (
    normalizeLabelName(left).toLocaleLowerCase("es") ===
    normalizeLabelName(right).toLocaleLowerCase("es")
  );
}

/**
 * Validates a draft list of label names for the create form.
 *
 * Returns
 * -------
 * string | null
 *     Error message, or null when the list is ready to submit.
 */
export function validateCreateLabels(names: readonly string[]): string | null {
  const trimmed = names.map(normalizeLabelName);
  if (trimmed.some((name) => name.length === 0)) {
    return "Cada label debe tener un nombre.";
  }
  if (trimmed.some((name) => name.length > MAX_REGISTRY_NAME_LENGTH)) {
    return `Cada label puede tener como máximo ${MAX_REGISTRY_NAME_LENGTH} caracteres.`;
  }
  const seen = new Set<string>();
  for (const name of trimmed) {
    const key = name.toLocaleLowerCase("es");
    if (seen.has(key)) {
      return "Los labels no pueden repetirse (sin distinguir mayúsculas).";
    }
    seen.add(key);
  }
  if (trimmed.length < MIN_CREATE_LABELS) {
    return `Añade al menos ${MIN_CREATE_LABELS} labels para que el modelo pueda calificar.`;
  }
  return null;
}
