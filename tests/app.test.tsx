import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/app/App";
import {
  mockMemoClassifiersFetch,
  mockMemoConnectionsFetch,
  mockMemoQueryAndCaptureFetch,
} from "./memoApiMock";

beforeEach(() => {
  window.location.hash = "/";
});

describe("navigable demo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips to main without changing the hash route", async () => {
    mockMemoQueryAndCaptureFetch();
    window.location.hash = "/query";
    render(<App />);
    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Saltar al contenido" }));
    expect(window.location.hash).toBe("#/query");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Query" })).toBeInTheDocument();
  });

  it("saves a capture from resumen without opening a modal", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.queryByRole("button", { name: "Nuevo recuerdo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("¿Qué quieres recordar?"),
      "Reunión con el equipo del telescopio",
    );
    await user.click(screen.getByRole("button", { name: "Guardar recuerdo" }));

    await waitFor(() => expect(api.captures).toHaveLength(1));
    expect(api.captures[0].body).toBe("Reunión con el equipo del telescopio");
    expect(api.captures[0].reference_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(api.uploadedDocuments).toHaveLength(0);
    expect(screen.getByText("Recuerdo guardado.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("¿Qué quieres recordar?")).toHaveValue(
      "",
    );
  });

  it("saves a capture with attachments and uploads each document", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText("¿Qué quieres recordar?"),
      "Notas de la reunión",
    );
    expect(
      screen.getByRole("button", { name: "Adjuntar archivos" }),
    ).toBeInTheDocument();
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const notes = new File(["hola"], "notas.md", { type: "text/markdown" });
    const brief = new File(["pdf"], "brief.pdf", { type: "application/pdf" });
    await user.upload(fileInput, [notes, brief]);

    expect(screen.getByText("notas.md")).toBeInTheDocument();
    expect(screen.getByText("brief.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar recuerdo" }));

    await waitFor(() => expect(api.captures).toHaveLength(1));
    expect(api.captures[0].body).toBe(
      "Notas de la reunión\n\nadjunts: notas.md, brief.pdf",
    );
    await waitFor(() => expect(api.uploadedDocuments).toEqual(["notas.md", "brief.pdf"]));
    expect(screen.getByText("Recuerdo guardado.")).toBeInTheDocument();
    expect(screen.queryByText("notas.md")).not.toBeInTheDocument();
  });

  it("queries the API and restores text plus labels from history", async () => {
    const api = mockMemoQueryAndCaptureFetch();
    const user = userEvent.setup();
    window.location.hash = "/query";
    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Laboral" }),
      ).toBeInTheDocument(),
    );
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "telescopio",
    );
    await user.click(screen.getByRole("button", { name: "Laboral" }));
    await user.click(screen.getByRole("button", { name: "Consultar" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /planificación del proyecto/ }),
      ).toBeInTheDocument(),
    );
    expect(api.lastQueryBody()).toMatchObject({
      query: "telescopio",
      labels: ["Laboral"],
      top_k: 10,
    });

    await user.clear(screen.getByLabelText("¿Qué quieres encontrar?"));
    await user.click(screen.getByRole("button", { name: "Laboral" }));
    await user.click(
      screen.getByRole("button", { name: /telescopio.*Laboral/ }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("¿Qué quieres encontrar?")).toHaveValue(
        "telescopio",
      ),
    );
    expect(screen.getByRole("button", { name: "Laboral" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("routes global search to Query with the typed text", async () => {
    mockMemoQueryAndCaptureFetch();
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByLabelText("Buscar en Socious"),
      "lecturas{Enter}",
    );
    expect(window.location.hash).toBe("#/query?q=lecturas");
    await waitFor(() =>
      expect(screen.getByLabelText("¿Qué quieres encontrar?")).toHaveValue(
        "lecturas",
      ),
    );
  });

  it("shows validation and empty API results clearly", async () => {
    mockMemoQueryAndCaptureFetch({ queryResults: [] });
    const user = userEvent.setup();
    window.location.hash = "/query";
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Consultar" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe una consulta");
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "zzzzzzz",
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sin coincidencias" }),
      ).toBeInTheDocument(),
    );
  });

  it("hides removed memory navigation entries", () => {
    mockMemoQueryAndCaptureFetch();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Navegación de Memo" });
    expect(
      within(nav).queryByRole("link", { name: "Mis recuerdos" }),
    ).not.toBeInTheDocument();
    expect(
      within(nav).queryByRole("link", { name: "Colecciones" }),
    ).not.toBeInTheDocument();
    expect(
      within(nav).queryByRole("link", { name: "Archivados" }),
    ).not.toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Query" }),
    ).toBeInTheDocument();
  });

  it("navigates to Conexiones, filters the table and opens a detail", async () => {
    mockMemoConnectionsFetch();

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "Conexiones" }));
    expect(window.location.hash).toBe("#/conexiones");
    expect(
      screen.getByRole("heading", { name: "Conexiones" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Nueva conexión" }),
      ).toBeEnabled(),
    );
    await user.type(screen.getByLabelText("Filtrar conexiones"), "gmail");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Gmail personal" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("link", { name: "Drive de trabajo" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Gmail personal" }));
    expect(window.location.hash).toBe(
      "#/conexiones/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Gmail personal" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Reautorizar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeEnabled();
  });

  it("creates a qualifier with custom labels from the same form", async () => {
    mockMemoClassifiersFetch();

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "Calificadores" }));
    expect(window.location.hash).toBe("#/calificadores");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Nuevo calificador" }),
      ).toBeEnabled(),
    );
    expect(screen.getByRole("link", { name: "Ámbito" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nuevo calificador" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Crear calificador" }),
    );
    expect(within(dialog).getByText(/Escribe un nombre/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Nombre/), "Prioridad");
    await user.type(within(dialog).getByLabelText("Nuevo label"), "Alta");
    await user.click(
      within(dialog).getByRole("button", { name: "Añadir label" }),
    );
    await user.type(within(dialog).getByLabelText("Nuevo label"), "Baja");
    await user.click(
      within(dialog).getByRole("button", { name: "Añadir label" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Crear calificador" }),
    );
    await waitFor(() => expect(window.location.hash).toBe("#/calificadores/3"));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Prioridad" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Baja")).toBeInTheDocument();
  });
});
