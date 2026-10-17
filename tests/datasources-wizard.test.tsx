import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter, Route, Routes } from "react-router-dom";
import { DataSourceWizardPage } from "../src/features/datasources/DataSourceWizardPage";
import { connections, googleOAuthKinds } from "./fixtures/connections";
import {
  driveBrowseRoot,
  driveBrowseSharedRoot,
  driveSharedDrives,
} from "./fixtures/dataSources";

function renderWizard() {
  return render(
    <HashRouter>
      <Routes>
        <Route path="/datasources/nueva" element={<DataSourceWizardPage />} />
        <Route path="/datasources/:id" element={<div>Detalle creado</div>} />
      </Routes>
    </HashRouter>,
    { wrapper: ({ children }) => children },
  );
}

describe("DataSource wizard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a Gmail data source through the wizard", async () => {
    const user = userEvent.setup();
    let createBody: unknown;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/kinds")) {
          return json(googleOAuthKinds);
        }
        if (
          url.includes("/connections") &&
          method === "GET" &&
          !url.includes("/google/drive/browse") &&
          !url.includes("/google/drive/drives")
        ) {
          return json(connections);
        }
        if (url.includes("/data-sources") && method === "POST") {
          createBody = JSON.parse(String(init?.body));
          return json(
            {
              id: "new-ds-id",
              name: "Correo demo",
              kind: "google_gmail",
              connection_id: connections[0].id,
              config: createBody,
              sync_cursor: {},
              sync_last_update: null,
              active: true,
              created_at: "2026-10-12T00:00:00.000Z",
              modified_at: "2026-10-12T00:00:00.000Z",
            },
            201,
          );
        }
        if (url.includes("/sync") && method === "POST") {
          return json({ task_id: "sync-1" }, 202);
        }
        return json({ code: "unexpected", message: url }, 500);
      }),
    );

    window.location.hash = "#/datasources/nueva";
    renderWizard();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Gmail/i })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Gmail/i }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.type(screen.getByLabelText(/Nombre/), "Correo demo");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.click(
      screen.getByRole("radio", { name: /Gmail personal/i }),
    );
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("button", { name: "Crear fuente" }));

    await waitFor(() =>
      expect(screen.getByText("Detalle creado")).toBeInTheDocument(),
    );
    expect(createBody).toMatchObject({
      name: "Correo demo",
      kind: "google_gmail",
      connection_id: connections[0].id,
    });
  });

  it("posts folder_ids when creating Drive source", async () => {
    const user = userEvent.setup();
    let createBody: Record<string, unknown> | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/kinds")) {
          return json(googleOAuthKinds);
        }
        if (url.includes("/google/drive/drives")) {
          return json(driveSharedDrives);
        }
        if (url.includes("/google/drive/browse")) {
          return json(
            url.includes("drive_id=") ? driveBrowseSharedRoot : driveBrowseRoot,
          );
        }
        if (
          url.includes("/connections") &&
          method === "GET" &&
          !url.includes("/google/drive/browse") &&
          !url.includes("/google/drive/drives")
        ) {
          return json(connections);
        }
        if (url.includes("/data-sources") && method === "POST") {
          createBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return json(
            {
              id: "drive-ds",
              name: "Drive docs",
              kind: "google_drive",
              connection_id: connections[1].id,
              config: createBody.config,
              sync_cursor: {},
              sync_last_update: null,
              active: true,
              created_at: "2026-10-12T00:00:00.000Z",
              modified_at: "2026-10-12T00:00:00.000Z",
            },
            201,
          );
        }
        if (url.includes("/sync")) {
          return json({ task_id: "t" }, 202);
        }
        return json({ code: "unexpected", message: url }, 500);
      }),
    );

    window.location.hash = "#/datasources/nueva";
    renderWizard();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Google Drive/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /Google Drive/i }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.type(screen.getByLabelText(/Nombre/), "Drive docs");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    const driveRadio = await waitFor(() => {
      const match = screen
        .getAllByRole("radio")
        .find((node) =>
          node.closest("label")?.textContent?.includes("Drive de trabajo"),
        );
      if (!match) {
        throw new Error("radio Drive de trabajo no encontrado");
      }
      return match;
    });
    await user.click(driveRadio);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    const folderInput = await waitFor(() =>
      screen.getByPlaceholderText(/drive\.google\.com/),
    );
    await user.type(folderInput, "folder-projects");
    await user.click(screen.getByRole("button", { name: "Añadir" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("button", { name: "Crear fuente" }));

    await waitFor(() => expect(createBody).toBeDefined());
    expect(createBody?.config).toMatchObject({
      folder_ids: ["folder-projects"],
    });
  });

  it("lists shared drives and filters folders by name", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/kinds")) {
          return json(googleOAuthKinds);
        }
        if (url.includes("/google/drive/drives")) {
          return json(driveSharedDrives);
        }
        if (url.includes("/google/drive/browse")) {
          return json(
            url.includes("drive_id=") ? driveBrowseSharedRoot : driveBrowseRoot,
          );
        }
        if (url.includes("/connections") && method === "GET") {
          return json(connections);
        }
        return json({ code: "unexpected", message: url }, 500);
      }),
    );

    window.location.hash = "#/datasources/nueva";
    renderWizard();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Google Drive/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /Google Drive/i }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.type(screen.getByLabelText(/Nombre/), "Drive docs");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    const driveRadio = await waitFor(() => {
      const match = screen
        .getAllByRole("radio")
        .find((node) =>
          node.closest("label")?.textContent?.includes("Drive de trabajo"),
        );
      if (!match) {
        throw new Error("radio Drive de trabajo no encontrado");
      }
      return match;
    });
    await user.click(driveRadio);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Proyectos/ })).toBeInTheDocument(),
    );
    expect(screen.getByText(/oct 2026/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Buscar carpeta/), "xyz");
    expect(screen.queryByRole("button", { name: /Proyectos/ })).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText(/Buscar carpeta/));

    await user.click(screen.getByRole("tab", { name: "Unidades compartidas" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Equipo producto/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Equipo producto/ }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Documentos compartidos/ }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Seleccionar" }));
    expect(screen.getByText("Documentos compartidos")).toBeInTheDocument();
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
