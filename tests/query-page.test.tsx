import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/app/App";
import { mockMemoQueryAndCaptureFetch } from "./memoApiMock";
import type { QueryHit } from "../src/features/query/types";

afterEach(() => vi.unstubAllGlobals());
const hit = (id: string, title: string): QueryHit => ({
  id,
  text: "---",
  source: "drive:test",
  kind: "text/markdown",
  metadata: { heading_1: title },
  classifications: {},
  distance: 0.1,
});

describe("query result integration", () => {
  it("keeps the server result order and counter including fragments without content", async () => {
    mockMemoQueryAndCaptureFetch({
      queryResults: [
        hit("b", "Segundo documento"),
        hit("a", "Primer documento"),
      ],
    });
    window.location.hash = "/query";
    render(<App />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "consulta",
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(
      await screen.findByRole("heading", { name: "Información relacionada 2" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("article")
        .map((article) => within(article).getByRole("heading").textContent),
    ).toEqual(["Segundo documento", "Primer documento"]);
    expect(
      screen.getAllByText("Este fragmento no contiene texto descriptivo"),
    ).toHaveLength(2);
  });
  it("shows loading then reports query failures without stale cards", async () => {
    mockMemoQueryAndCaptureFetch({
      queryResults: [hit("a", "Resultado previo")],
    });
    const originalFetch = globalThis.fetch;
    let rejectQuery: (error: Error) => void = () => {};
    window.location.hash = "/query";
    render(<App />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "consulta",
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    await screen.findByRole("article");
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes("/query")
          ? new Promise<Response>((_resolve, reject) => {
              rejectQuery = reject;
            })
          : originalFetch(input, init),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(screen.getByText("Buscando…")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    rejectQuery(new Error("Servicio no disponible"));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Servicio no disponible",
      ),
    );
    expect(
      screen.getByRole("heading", { name: "Información relacionada 0" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
