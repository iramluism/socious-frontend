import type { QueryInput } from "./types";

export type { QueryInput };

/** Normalizes accents and case before lexical helpers. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

/** Formats selected labels for history and result metadata. */
export function formatLabels(labels: string[]): string {
  if (!labels.length) return "Sin filtro de labels";
  return labels.join(" · ");
}

/** Returns a compact excerpt centered around the earliest lexical match. */
export function excerpt(content: string, query: string): string {
  const words = normalize(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  const found = words
    .map((word) => normalize(content).indexOf(word))
    .filter((index) => index >= 0);
  const start = Math.max(0, (found.length ? Math.min(...found) : 0) - 45);
  return `${start ? "…" : ""}${content.slice(start, start + 210)}${content.length > start + 210 ? "…" : ""}`;
}
