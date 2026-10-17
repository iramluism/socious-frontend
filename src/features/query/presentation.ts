import { excerpt } from "./search";
import type { QueryHit } from "./types";

export const EMPTY_EXCERPT = "Este fragmento no contiene texto descriptivo";
export const CAPTURE_KIND = "memo/capture";

/**
 * Whether the hit is a user capture rather than an ingested document.
 *
 * Parameters
 * ----------
 * hit : QueryHit
 *     Semantic search fragment.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when ``kind`` is ``memo/capture`` or ``source`` starts with
 *     ``capture:``.
 */
export function isCaptureHit(hit: QueryHit): boolean {
  if (hit.kind === CAPTURE_KIND) return true;
  return typeof hit.source === "string" && hit.source.startsWith("capture:");
}

/**
 * Hits that should remain after forgetting ``forgotten``.
 *
 * Captures are removed by id. Other hits drop every fragment with the same
 * ``source`` (the whole document).
 *
 * Parameters
 * ----------
 * hits : readonly QueryHit[]
 *     Current result list.
 * forgotten : QueryHit
 *     Hit that was successfully forgotten.
 *
 * Returns
 * -------
 * QueryHit[]
 *     Remaining hits.
 */
export function hitsAfterForget(
  hits: readonly QueryHit[],
  forgotten: QueryHit,
): QueryHit[] {
  return hits.filter((item) => {
    if (isCaptureHit(forgotten) || isCaptureHit(item)) {
      return item.id !== forgotten.id;
    }
    if (forgotten.source == null || forgotten.source === "") {
      return item.id !== forgotten.id;
    }
    return String(item.source) !== String(forgotten.source);
  });
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function meaningfulLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^[\s*_=\-–—]+$/.test(line));
}

/** Accepts only explicit absolute web links supplied by the chunk metadata. */
function sourceLink(value: unknown) {
  const text = textValue(value);
  if (!text || !/^https?:\/\//i.test(text)) return undefined;
  try {
    const url = new URL(text);
    if (
      url.username ||
      url.password ||
      !["http:", "https:"].includes(url.protocol)
    )
      return undefined;
    return {
      href: url.href,
      label: ["drive.google.com", "docs.google.com"].includes(url.hostname)
        ? "Abrir en Google Drive"
        : "Abrir fuente",
    };
  } catch {
    return undefined;
  }
}

function savedDate(value: unknown): string | undefined {
  const text = textValue(value);
  // Require an ISO calendar date; reject Date's silent normalization of invalid days.
  if (!text || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text)) return undefined;
  const day = text.slice(0, 10);
  const calendarDate = new Date(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== day ||
    !Number.isFinite(Date.parse(text))
  )
    return undefined;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(calendarDate);
}

/**
 * Maps retrieval data into readable content without synthesizing facts or links.
 *
 * Parameters
 * ----------
 * hit : QueryHit
 *     Semantic search fragment.
 * query : string
 *     User query used to center the excerpt.
 *
 * Returns
 * -------
 * object
 *     Title, provenance, excerpt, optional date, labels, link, and headings.
 */
export function presentQueryHit(hit: QueryHit, query: string) {
  const source = typeof hit.source === "string" ? hit.source : "";
  const isDrive = source.startsWith("drive:");
  const isCapture = isCaptureHit(hit);
  const lines = meaningfulLines(hit.text);
  const headline = textValue(hit.metadata.headline);
  const heading1 = textValue(hit.metadata.heading_1);
  const heading2 = textValue(hit.metadata.heading_2);
  const fallback = isDrive
    ? "Fragmento de Google Drive"
    : isCapture
      ? "Nota personal"
      : "Fragmento recuperado";
  const firstLine = lines[0]?.replace(/^#{1,6}\s+/, "");
  return {
    title:
      headline ??
      heading2 ??
      heading1 ??
      (firstLine ? Array.from(firstLine).slice(0, 100).join("") : fallback),
    provenance: isDrive
      ? "Google Drive"
      : isCapture
        ? "Nota personal"
        : "Otra fuente",
    excerpt: lines.length ? excerpt(hit.text, query) : EMPTY_EXCERPT,
    date: savedDate(hit.metadata.created_at),
    labels: [
      ...new Set(
        Object.values(hit.classifications)
          .map((entry) => textValue(entry.label_name))
          .filter((label): label is string => Boolean(label)),
      ),
    ],
    link: sourceLink(hit.metadata.source_link),
    headings: [heading1, heading2].filter((heading): heading is string =>
      Boolean(heading),
    ),
  };
}
