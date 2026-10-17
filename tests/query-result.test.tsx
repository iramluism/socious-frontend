import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  presentQueryHit,
  EMPTY_EXCERPT,
} from "../src/features/query/presentation";
import { QueryResultCard } from "../src/features/query/QueryResultCard";
import type { QueryHit } from "../src/features/query/types";

const chunk: QueryHit = {
  id: "chunk-3",
  text: "---",
  source: "drive:file|last_updated=2026-07-02",
  kind: "text/markdown",
  metadata: {
    heading_2: "Contrato de caché a respetar",
    heading_1: "Plan de caché",
    created_at: "2026-10-11T16:55:55.523216+00:00",
  },
  classifications: {},
  distance: 0.1375351,
};

afterEach(() => vi.unstubAllGlobals());

describe("query result presentation", () => {
  it("presents the supplied separator chunk without inventing labels or a link", () => {
    expect(presentQueryHit(chunk, "caché")).toMatchObject({
      title: "Contrato de caché a respetar",
      provenance: "Google Drive",
      excerpt: EMPTY_EXCERPT,
      date: "11 oct 2026",
      labels: [],
      link: undefined,
    });
  });
  it("uses heading priority and bounded meaningful text before source fallbacks", () => {
    expect(
      presentQueryHit({ ...chunk, metadata: { heading_1: "Plan" } }, "").title,
    ).toBe("Plan");
    expect(
      presentQueryHit(
        { ...chunk, metadata: {}, text: `---\n\n# ${"a".repeat(150)}` },
        "",
      ).title,
    ).toBe("a".repeat(100));
    for (const [source, title, provenance] of [
      ["drive:x", "Fragmento de Google Drive", "Google Drive"],
      ["capture:x", "Nota personal", "Nota personal"],
      ["other", "Fragmento recuperado", "Otra fuente"],
    ]) {
      expect(
        presentQueryHit(
          { ...chunk, metadata: {}, source, text: "\n***\n___\n---" },
          "",
        ),
      ).toMatchObject({ title, provenance, excerpt: EMPTY_EXCERPT });
    }
  });
  it.each(["", "no date", "2026-02-30", "2026-13-01", "1234", 1234])(
    "omits invalid dates %s",
    (created_at) => {
      expect(
        presentQueryHit({ ...chunk, metadata: { created_at } }, "").date,
      ).toBeUndefined();
    },
  );
  it("deduplicates meaningful label names", () => {
    const entry = { label_id: 1, label_name: "Viaje", score: 0.9 };
    expect(
      presentQueryHit(
        {
          ...chunk,
          classifications: {
            a: entry,
            b: { ...entry, label_id: 2 },
            c: { ...entry, label_name: " " },
          },
        },
        "",
      ).labels,
    ).toEqual(["Viaje"]);
  });
  it.each([
    "/relative",
    "//drive.google.com/file",
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@drive.google.com/file",
    "https://",
    "ftp://example.com",
    "https:example.com",
  ])("rejects unsafe or relative source link %s", (source_link) => {
    expect(
      presentQueryHit({ ...chunk, metadata: { source_link } }, "").link,
    ).toBeUndefined();
  });
  it.each([
    ["https://drive.google.com/file/d/123", "Abrir en Google Drive"],
    ["https://docs.google.com/document/d/123", "Abrir en Google Drive"],
    ["http://example.com/source", "Abrir fuente"],
    ["https://drive.google.com.evil.test/", "Abrir fuente"],
  ])("labels verified host %s", (source_link, label) => {
    expect(
      presentQueryHit({ ...chunk, metadata: { source_link } }, "").link,
    ).toEqual({ href: source_link, label });
  });
  it("keeps excerpts centered on a query match", () => {
    const content = presentQueryHit(
      { ...chunk, text: `${"intro ".repeat(80)}telescopio y planificación` },
      "telescopio",
    );
    expect(content.excerpt).toContain("telescopio");
    expect(content.excerpt.startsWith("…")).toBe(true);
  });
});

describe("query result interactions", () => {
  it("keeps technical fields out of the card and opens a safe accessible external link", () => {
    render(
      <QueryResultCard
        hit={{
          ...chunk,
          metadata: {
            ...chunk.metadata,
            source_link: "https://drive.google.com/file/d/123",
          },
        }}
        query=""
      />,
    );
    const article = screen.getByRole("article");
    expect(within(article).queryByText(chunk.id)).not.toBeInTheDocument();
    expect(
      within(article).queryByText(String(chunk.source)),
    ).not.toBeInTheDocument();
    const link = within(article).getByRole("link", {
      name: /Abrir en Google Drive.*pestaña nueva/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("supports keyboard details and disabled forgetting without network side effects", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<QueryResultCard hit={chunk} query="" />);
    const trigger = screen.getByRole("button", { name: /Acciones para/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    const forget = screen.getByRole("menuitem", { name: /Olvidar recuerdo/ });
    expect(forget).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Todavía no disponible")).toBeInTheDocument();
    await user.click(forget);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Ver detalles" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Plan de caché")).toBeInTheDocument();
    expect(within(dialog).getByText("---")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Información técnica" }),
    ).toHaveAttribute("aria-expanded", "false");
    await user.click(
      within(dialog).getByRole("button", { name: "Información técnica" }),
    );
    expect(within(dialog).getByText(chunk.id)).toBeVisible();
    within(dialog).getByRole("button", { name: "Cerrar" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(fetch).not.toHaveBeenCalled();
  });
});
