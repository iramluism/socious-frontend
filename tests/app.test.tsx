import { beforeEach, describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/app/App";
beforeEach(() => {
  window.location.hash = "/";
});
describe("navigable demo", () => {
  it("skips to main without changing the hash route", async () => {
    window.location.hash = "/query";
    render(<App />);
    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Saltar al contenido" }));
    expect(window.location.hash).toBe("#/query");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Query" })).toBeInTheDocument();
  });
  it("validates creation and makes new content searchable with source references", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Nuevo recuerdo" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar recuerdo" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Escribe un título",
    );
    await user.type(within(dialog).getByLabelText(/Título/), "Decisión única");
    await user.type(
      within(dialog).getByLabelText(/Contenido/),
      "Preparar la exposición del telescopio",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Colección"),
      "Proyecto",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar recuerdo" }),
    );
    expect(
      screen.getByRole("link", { name: "Decisión única" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Query" }));
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "TELESCOPIO",
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(
      screen.getByRole("link", { name: "Decisión única" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Abrir fuente →" }));
    expect(
      screen.getByRole("heading", { name: "Decisión única" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Preparar la exposición del telescopio"),
    ).toBeInTheDocument();
  });
  it("restores query text and both filters from history", async () => {
    const user = userEvent.setup();
    window.location.hash = "/query";
    render(<App />);
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "memoria",
    );
    await user.selectOptions(screen.getByLabelText("Colección"), "Proyecto");
    await user.selectOptions(screen.getByLabelText("Fuente"), "Documentos");
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(
      screen.getByRole("link", { name: "Principios de una memoria fiable" }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText("¿Qué quieres encontrar?"));
    await user.selectOptions(screen.getByLabelText("Colección"), "");
    await user.selectOptions(screen.getByLabelText("Fuente"), "");
    await user.click(
      screen.getByRole("button", { name: /memoria.*Proyecto.*Documentos/ }),
    );
    expect(screen.getByLabelText("¿Qué quieres encontrar?")).toHaveValue(
      "memoria",
    );
    expect(screen.getByLabelText("Colección")).toHaveValue("Proyecto");
    expect(screen.getByLabelText("Fuente")).toHaveValue("Documentos");
  });
  it("supports global search, collection filtering and grid view", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByLabelText("Buscar en Socious"),
      "lecturas{Enter}",
    );
    expect(
      screen.getByRole("heading", { name: "Mis recuerdos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Lecturas pendientes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ideas para Socious" }),
    ).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText("Filtrar colección"),
      "Trabajo",
    );
    expect(
      screen.getByText("No hay recuerdos que coincidan con estos filtros."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vista cuadrícula" }));
    expect(
      screen.getByRole("button", { name: "Vista cuadrícula" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("shows validation, no-results and unavailable memories clearly", async () => {
    const user = userEvent.setup();
    window.location.hash = "/query";
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe una consulta");
    await user.type(
      screen.getByLabelText("¿Qué quieres encontrar?"),
      "zzzzzzz",
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(
      screen.getByRole("heading", { name: "Sin coincidencias" }),
    ).toBeInTheDocument();
  });
  it("resolves deep links and has a fallback for session-only IDs", () => {
    window.location.hash = "/recuerdos/missing";
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Recuerdo no disponible" }),
    ).toBeInTheDocument();
  });
  it("navigates to Conexiones, filters the table and opens a detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "Conexiones" }));
    expect(window.location.hash).toBe("#/conexiones");
    expect(
      screen.getByRole("heading", { name: "Conexiones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nueva conexión · Próximamente" }),
    ).toBeDisabled();
    await user.type(screen.getByLabelText("Filtrar conexiones"), "gmail");
    expect(
      screen.getByRole("link", { name: "Gmail personal" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Drive de trabajo" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Gmail personal" }));
    expect(window.location.hash).toBe(
      "#/conexiones/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    );
    expect(
      screen.getByRole("heading", { name: "Gmail personal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reautorizar · Próximamente" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Revocar · Próximamente" }),
    ).toBeDisabled();
  });
});
