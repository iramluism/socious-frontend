import type { Memory } from "../memories/types";
/** Query inputs retained together in history. */
export interface QueryInput {
  text: string;
  collection: string;
  source: string;
}
/** Search result with number of distinct matching query words. */
export interface SearchResult {
  memory: Memory;
  score: number;
}
/** Normalizes accents and case before lexical matching. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}
/** Finds active memories matching at least one word, ranked by word count then recency. */
export function searchMemories(
  memories: Memory[],
  query: QueryInput,
): SearchResult[] {
  const words = [
    ...new Set(normalize(query.text).match(/[\p{L}\p{N}]+/gu) ?? []),
  ];
  if (!words.length) return [];
  return memories
    .filter(
      (m) =>
        !m.archived &&
        (!query.collection || m.collection === query.collection) &&
        (!query.source || m.source === query.source),
    )
    .map((memory) => {
      const tokens = new Set(
        normalize(`${memory.title} ${memory.content}`).match(
          /[\p{L}\p{N}]+/gu,
        ) ?? [],
      );
      return { memory, score: words.filter((word) => tokens.has(word)).length };
    })
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.memory.createdAt.localeCompare(a.memory.createdAt) ||
        a.memory.id.localeCompare(b.memory.id),
    );
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
