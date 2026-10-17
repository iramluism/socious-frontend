import { useCallback, useEffect, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { ApiError } from "../../../shared/api/client";
import { browseDriveFolders } from "../api";
import type { DriveDataSourceConfig, DriveFolderItem } from "../types";

const ROOT_ID = "root";
const ROOT_LABEL = "Mi unidad";

function normalizeFolderId(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("/folders/")) {
    const segment = trimmed.split("/folders/", 2)[1] ?? "";
    const id = segment.split("?", 1)[0]?.split("/", 1)[0]?.trim();
    if (id) {
      return id;
    }
  }
  return trimmed;
}

type Breadcrumb = { id: string; name: string };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error inesperado";
}

/**
 * Browse Google Drive folders and build ``folder_ids`` for Drive data sources.
 */
export function DriveFolderPickerStep({
  connectionId,
  config,
  disabled,
  onChange,
}: {
  connectionId: string;
  config: DriveDataSourceConfig;
  disabled?: boolean;
  onChange: (next: DriveDataSourceConfig) => void;
}) {
  const [trail, setTrail] = useState<Breadcrumb[]>([
    { id: ROOT_ID, name: ROOT_LABEL },
  ]);
  const [items, setItems] = useState<DriveFolderItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});

  const parentId = trail[trail.length - 1]?.id ?? ROOT_ID;

  const loadPage = useCallback(
    async (parent: string, pageToken?: string, append = false) => {
      setLoading(true);
      setLoadError("");
      try {
        const page = await browseDriveFolders(
          connectionId,
          parent,
          pageToken,
        );
        setItems((current) =>
          append ? [...current, ...page.items] : page.items,
        );
        setNextPageToken(page.next_page_token);
      } catch (err) {
        setItems([]);
        setNextPageToken(null);
        setLoadError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [connectionId],
  );

  useEffect(() => {
    void loadPage(parentId);
  }, [parentId, loadPage]);

  const selectedIds = config.folder_ids;

  const toggleFolder = (folder: DriveFolderItem) => {
    if (disabled) {
      return;
    }
    const exists = selectedIds.includes(folder.id);
    const nextIds = exists
      ? selectedIds.filter((id) => id !== folder.id)
      : [...selectedIds, folder.id];
    setLabels((current) => ({
      ...current,
      [folder.id]: folder.name,
    }));
    onChange({ ...config, folder_ids: nextIds });
  };

  const openFolder = (folder: DriveFolderItem) => {
    if (disabled) {
      return;
    }
    setTrail((current) => [...current, { id: folder.id, name: folder.name }]);
  };

  const goToCrumb = (index: number) => {
    if (disabled) {
      return;
    }
    setTrail((current) => current.slice(0, index + 1));
  };

  const goUp = () => {
    if (trail.length <= 1 || disabled) {
      return;
    }
    setTrail((current) => current.slice(0, -1));
  };

  const removeSelected = (folderId: string) => {
    if (disabled) {
      return;
    }
    onChange({
      ...config,
      folder_ids: selectedIds.filter((id) => id !== folderId),
    });
  };

  const addManual = () => {
    const id = normalizeFolderId(manualInput);
    if (!id || disabled) {
      return;
    }
    if (!selectedIds.includes(id)) {
      onChange({ ...config, folder_ids: [...selectedIds, id] });
    }
    setManualInput("");
  };

  return (
    <SpaceBetween size="m">
      {loadError ? <Alert type="error">{loadError}</Alert> : null}
      <div className="drive-browse-layout">
        <section className="drive-browse-panel" aria-label="Explorar carpetas">
          <div className="drive-browse-toolbar">
            <Button disabled={disabled || trail.length <= 1} onClick={goUp}>
              Subir
            </Button>
            <nav className="drive-browse-breadcrumbs" aria-label="Ruta">
              {trail.map((crumb, index) => (
                <span key={crumb.id}>
                  {index > 0 ? <span className="muted"> / </span> : null}
                  <button
                    type="button"
                    className="drive-browse-crumb"
                    disabled={disabled}
                    onClick={() => goToCrumb(index)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          </div>
          {loading && items.length === 0 ? (
            <StatusIndicator type="loading">Cargando carpetas…</StatusIndicator>
          ) : items.length === 0 ? (
            <p className="demo-explainer muted">No hay subcarpetas en esta ruta.</p>
          ) : (
            <ul className="drive-browse-list">
              {items.map((folder) => {
                const selected = selectedIds.includes(folder.id);
                return (
                  <li key={folder.id} className="drive-browse-row">
                    <button
                      type="button"
                      className="drive-browse-open"
                      disabled={disabled}
                      onClick={() => openFolder(folder)}
                      title="Abrir carpeta"
                    >
                      📁 {folder.name}
                    </button>
                    <Button
                      disabled={disabled}
                      onClick={() => toggleFolder(folder)}
                    >
                      {selected ? "Quitar" : "Seleccionar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {nextPageToken ? (
            <Button
              loading={loading}
              disabled={disabled}
              onClick={() => void loadPage(parentId, nextPageToken, true)}
            >
              Cargar más
            </Button>
          ) : null}
        </section>
        <section className="drive-browse-panel" aria-label="Carpetas seleccionadas">
          <h3 className="connections-section-title">Carpetas incluidas</h3>
          {selectedIds.length === 0 ? (
            <p className="demo-explainer muted">
              Selecciona al menos una carpeta. Los archivos dentro se sincronizarán.
            </p>
          ) : (
            <ul className="drive-browse-selected">
              {selectedIds.map((id) => (
                <li key={id}>
                  <span>{labels[id] ?? id}</span>
                  <code>{id}</code>
                  <button
                    type="button"
                    className="drive-browse-remove"
                    disabled={disabled}
                    onClick={() => removeSelected(id)}
                    aria-label={`Quitar carpeta ${id}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="form-stack">
        <label>
          Añadir por URL o id de carpeta
          <div className="drive-browse-manual">
            <input
              value={manualInput}
              disabled={disabled}
              placeholder="https://drive.google.com/drive/folders/…"
              onChange={(event) => setManualInput(event.target.value)}
            />
            <Button disabled={disabled || !manualInput.trim()} onClick={addManual}>
              Añadir
            </Button>
          </div>
        </label>
      </div>
    </SpaceBetween>
  );
}
