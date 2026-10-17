import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { ApiError } from "../../../shared/api/client";
import { formatDate } from "../../../shared/PageHeading";
import { browseDriveFolders, listDriveDrives } from "../api";
import type {
  DriveDataSourceConfig,
  DriveFolderItem,
  DriveSharedDriveItem,
} from "../types";

const ROOT_ID = "root";
const ROOT_LABEL = "Mi unidad";
const SHARED_ROOT_LABEL = "Unidades compartidas";

type BrowseTab = "my_drive" | "shared";
type BrowseRow = {
  id: string;
  name: string;
  modified_time: string | null;
  kind: "folder" | "drive";
};

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

function matchesFilter(name: string, filter: string): boolean {
  const needle = filter.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return name.toLowerCase().includes(needle);
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
  const [tab, setTab] = useState<BrowseTab>("my_drive");
  const [trail, setTrail] = useState<Breadcrumb[]>([
    { id: ROOT_ID, name: ROOT_LABEL },
  ]);
  const [items, setItems] = useState<BrowseRow[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [activeDriveId, setActiveDriveId] = useState<string | null>(null);

  const listingDrives = tab === "shared" && activeDriveId === null;
  const parentId = listingDrives
    ? ""
    : (trail[trail.length - 1]?.id ?? (tab === "my_drive" ? ROOT_ID : ""));

  const loadFolders = useCallback(
    async (parent: string, pageToken?: string, append = false, driveId?: string) => {
      setLoading(true);
      setLoadError("");
      try {
        const page = await browseDriveFolders(
          connectionId,
          parent,
          pageToken,
          driveId,
        );
        const rows: BrowseRow[] = page.items.map((folder: DriveFolderItem) => ({
          id: folder.id,
          name: folder.name,
          modified_time: folder.modified_time,
          kind: "folder",
        }));
        setItems((current) => (append ? [...current, ...rows] : rows));
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

  const loadDrives = useCallback(
    async (pageToken?: string, append = false) => {
      setLoading(true);
      setLoadError("");
      try {
        const page = await listDriveDrives(connectionId, pageToken);
        const rows: BrowseRow[] = page.items.map((drive: DriveSharedDriveItem) => ({
          id: drive.id,
          name: drive.name,
          modified_time: drive.modified_time,
          kind: "drive",
        }));
        setItems((current) => (append ? [...current, ...rows] : rows));
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
    if (listingDrives) {
      void loadDrives();
      return;
    }
    if (!parentId) {
      return;
    }
    void loadFolders(parentId, undefined, false, activeDriveId ?? undefined);
  }, [listingDrives, parentId, activeDriveId, loadDrives, loadFolders]);

  const selectedIds = config.folder_ids;
  const visibleItems = useMemo(
    () => items.filter((item) => matchesFilter(item.name, filter)),
    [items, filter],
  );

  const switchTab = (next: BrowseTab) => {
    if (disabled || next === tab) {
      return;
    }
    setTab(next);
    setFilter("");
    setItems([]);
    setNextPageToken(null);
    setLoadError("");
    if (next === "my_drive") {
      setActiveDriveId(null);
      setTrail([{ id: ROOT_ID, name: ROOT_LABEL }]);
    } else {
      setActiveDriveId(null);
      setTrail([]);
    }
  };

  const toggleRow = (row: BrowseRow) => {
    if (disabled) {
      return;
    }
    const exists = selectedIds.includes(row.id);
    const nextIds = exists
      ? selectedIds.filter((id) => id !== row.id)
      : [...selectedIds, row.id];
    setLabels((current) => ({
      ...current,
      [row.id]: row.name,
    }));
    onChange({ ...config, folder_ids: nextIds });
  };

  const openRow = (row: BrowseRow) => {
    if (disabled) {
      return;
    }
    if (row.kind === "drive") {
      setActiveDriveId(row.id);
      setTrail([{ id: row.id, name: row.name }]);
      setFilter("");
      return;
    }
    setTrail((current) => [...current, { id: row.id, name: row.name }]);
    setFilter("");
  };

  const goToCrumb = (index: number) => {
    if (disabled) {
      return;
    }
    if (tab === "shared" && index < 0) {
      setActiveDriveId(null);
      setTrail([]);
      setFilter("");
      return;
    }
    setTrail((current) => current.slice(0, index + 1));
    setFilter("");
  };

  const goUp = () => {
    if (disabled) {
      return;
    }
    if (tab === "shared" && trail.length <= 1) {
      setActiveDriveId(null);
      setTrail([]);
      setFilter("");
      return;
    }
    if (trail.length <= 1) {
      return;
    }
    setTrail((current) => current.slice(0, -1));
    setFilter("");
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

  const canGoUp =
    tab === "my_drive" ? trail.length > 1 : !listingDrives;
  const emptyCopy = listingDrives
    ? "No hay unidades compartidas."
    : "No hay subcarpetas en esta ruta.";

  return (
    <SpaceBetween size="m">
      {loadError ? <Alert type="error">{loadError}</Alert> : null}
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
      <div className="drive-browse-layout">
        <section className="drive-browse-panel" aria-label="Explorar carpetas">
          <div className="drive-browse-tabs" role="tablist" aria-label="Origen">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "my_drive"}
              className={`drive-browse-tab${tab === "my_drive" ? " is-active" : ""}`}
              disabled={disabled}
              onClick={() => switchTab("my_drive")}
            >
              Mi unidad
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "shared"}
              className={`drive-browse-tab${tab === "shared" ? " is-active" : ""}`}
              disabled={disabled}
              onClick={() => switchTab("shared")}
            >
              Unidades compartidas
            </button>
          </div>
          <div className="drive-browse-toolbar">
            <Button disabled={disabled || !canGoUp} onClick={goUp}>
              Subir
            </Button>
            <nav className="drive-browse-breadcrumbs" aria-label="Ruta">
              {tab === "shared" ? (
                <span>
                  <button
                    type="button"
                    className="drive-browse-crumb"
                    disabled={disabled}
                    onClick={() => goToCrumb(-1)}
                  >
                    {SHARED_ROOT_LABEL}
                  </button>
                  {trail.length > 0 ? <span className="muted"> / </span> : null}
                </span>
              ) : null}
              {trail.map((crumb, index) => (
                <span key={`${crumb.id}-${index}`}>
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
          <label className="drive-browse-filter">
            Filtrar
            <input
              value={filter}
              disabled={disabled}
              placeholder={listingDrives ? "Buscar unidad…" : "Buscar carpeta…"}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
          {loading && items.length === 0 ? (
            <StatusIndicator type="loading">
              {listingDrives ? "Cargando unidades…" : "Cargando carpetas…"}
            </StatusIndicator>
          ) : visibleItems.length === 0 ? (
            <p className="demo-explainer muted">{emptyCopy}</p>
          ) : (
            <ul className="drive-browse-list">
              {visibleItems.map((row) => {
                const selected = selectedIds.includes(row.id);
                return (
                  <li key={row.id} className="drive-browse-row">
                    <button
                      type="button"
                      className="drive-browse-open"
                      disabled={disabled}
                      onClick={() => openRow(row)}
                      title={row.kind === "drive" ? "Abrir unidad" : "Abrir carpeta"}
                    >
                      <span className="drive-browse-open-name">
                        {row.kind === "drive" ? "🗂" : "📁"} {row.name}
                      </span>
                      {row.modified_time ? (
                        <span className="drive-browse-date muted">
                          {formatDate(row.modified_time)}
                        </span>
                      ) : null}
                    </button>
                    <Button
                      disabled={disabled}
                      onClick={() => toggleRow(row)}
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
              onClick={() =>
                listingDrives
                  ? void loadDrives(nextPageToken, true)
                  : void loadFolders(
                      parentId,
                      nextPageToken,
                      true,
                      activeDriveId ?? undefined,
                    )
              }
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
    </SpaceBetween>
  );
}
