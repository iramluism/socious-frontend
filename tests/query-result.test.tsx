import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  presentQueryHit,
  hitsAfterForget,
  isCaptureHit,
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
  it("classifies capture hits and drops a whole document source on forget", () => {
    const capture: QueryHit = {
      ...chunk,
      id: "capture-1",
      kind: "memo/capture",
      source: "capture:1",
    };
    const other: QueryHit = { ...chunk, id: "keep", source: "drive:other" };
    const sibling: QueryHit = { ...chunk, id: "sib" };
    expect(isCaptureHit(capture)).toBe(true);
    expect(isCaptureHit(chunk)).toBe(false);
    expect(
      hitsAfterForget([chunk, sibling, other], chunk).map((item) => item.id),
    ).toEqual(["keep"]);
    expect(
      hitsAfterForget([capture, other], capture).map((item) => item.id),
    ).toEqual(["keep"]);
  });

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
      presentQueryHit(
        {
          ...chunk,
          metadata: { ...chunk.metadata, headline: "Informe trimestral" },
        },
        "",
      ).title,
    ).toBe("Informe trimestral");
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
  it("asks before forgetting an external document and skips the request on cancel", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<QueryResultCard hit={chunk} query="" />);
    await user.click(screen.getByRole("button", { name: /Acciones para/ }));
    await user.click(
      screen.getByRole("menuitem", { name: /Olvidar recuerdo/ }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Se elimina el documento entero"),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forgets a personal capture without a document warning", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const onForgotten = vi.fn();
    const user = userEvent.setup();
    const capture: QueryHit = {
      ...chunk,
      id: "capture-11111111-1111-1111-1111-111111111111",
      source: "capture:11111111-1111-1111-1111-111111111111",
      kind: "memo/capture",
      metadata: {},
      text: "Nota personal",
    };
    render(
      <QueryResultCard hit={capture} query="" onForgotten={onForgotten} />,
    );
    await user.click(screen.getByRole("button", { name: /Acciones para/ }));
    await user.click(
      screen.getByRole("menuitem", { name: /Olvidar recuerdo/ }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(onForgotten).toHaveBeenCalledWith(capture));
    expect(String(fetch.mock.calls[0]?.[0])).toContain(
      "/captures/capture-11111111-1111-1111-1111-111111111111",
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE" });
  });

  it("confirms forgetting an external source then deletes the memory", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const onForgotten = vi.fn();
    const user = userEvent.setup();
    render(<QueryResultCard hit={chunk} query="" onForgotten={onForgotten} />);
    await user.click(screen.getByRole("button", { name: /Acciones para/ }));
    await user.click(
      screen.getByRole("menuitem", { name: /Olvidar recuerdo/ }),
    );
    await user.click(screen.getByRole("button", { name: "Olvidar documento" }));
    await waitFor(() => expect(onForgotten).toHaveBeenCalledWith(chunk));
    expect(String(fetch.mock.calls[0]?.[0])).toContain(`/captures/${chunk.id}`);
  });

  it("supports keyboard details without network side effects", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<QueryResultCard hit={chunk} query="" />);
    const trigger = screen.getByRole("button", { name: /Acciones para/ });
    trigger.focus();
    await user.keyboard("{Enter}");
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
