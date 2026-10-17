import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { ApiError } from "../../shared/api/client";
import { PageHeading, formatDate } from "../../shared/PageHeading";
import { getConnection } from "../connections/api";
import { KindIcon } from "../connections/KindIcons";
import { KIND_PRESENTATION } from "../connections/kindPresentation";
import type { Connection } from "../connections/types";
import {
  deleteDataSource,
  getDataSource,
  syncDataSource,
  updateDataSource,
} from "./api";
import type { DataSource } from "./types";

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
 * Detail view for one data source with sync and lifecycle actions.
 */
export function DataSourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<DataSource | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState<"sync" | "toggle" | "delete" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lastSyncTask, setLastSyncTask] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoadError("Identificador no válido.");
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const dataSource = await getDataSource(id);
      setItem(dataSource);
      try {
        const conn = await getConnection(dataSource.connection_id);
        setConnection(conn);
      } catch {
        setConnection(null);
      }
    } catch (err) {
      setItem(null);
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    if (!item) {
      return;
    }
    setBusy("sync");
    setActionError("");
    try {
      const result = await syncDataSource(item.id);
      setLastSyncTask(result.task_id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleToggleActive = async () => {
    if (!item) {
      return;
    }
    setBusy("toggle");
    setActionError("");
    try {
      const updated = await updateDataSource(item.id, { active: !item.active });
      setItem(updated);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!item) {
      return;
    }
    setBusy("delete");
    setActionError("");
    try {
      await deleteDataSource(item.id);
      navigate("/datasources", { replace: true });
    } catch (err) {
      setActionError(errorMessage(err));
      setDeleteOpen(false);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <>
        <Link className="back-link" to="/datasources">
          ← Volver a Fuentes de datos
        </Link>
        <StatusIndicator type="loading">Cargando fuente…</StatusIndicator>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <PageHeading
          title="Fuente no encontrada"
          description={loadError || "El enlace no corresponde a una fuente registrada."}
        />
        <Link to="/datasources">Volver al listado</Link>
      </>
    );
  }

  const kindMeta = KIND_PRESENTATION[item.kind];

  return (
    <>
      <Link className="back-link" to="/datasources">
        ← Volver a Fuentes de datos
      </Link>
      <PageHeading
        title={item.name}
        description={`${kindMeta.title} · conexión ${connection?.display_name ?? item.connection_id}`}
        action={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              loading={busy === "sync"}
              disabled={!item.active}
              onClick={() => void handleSync()}
            >
              Sincronizar
            </Button>
            <Button loading={busy === "toggle"} onClick={() => void handleToggleActive()}>
              {item.active ? "Pausar" : "Activar"}
            </Button>
            <Button onClick={() => setDeleteOpen(true)}>Eliminar</Button>
          </SpaceBetween>
        }
      />
      {actionError ? <Alert type="error">{actionError}</Alert> : null}
      {lastSyncTask ? (
        <Alert type="success" header="Sincronización encolada">
          Tarea <code>{lastSyncTask}</code>
        </Alert>
      ) : null}
      <article className="panel detail-content">
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="xs">
            <KindIcon kind={item.kind} size={32} />
            <StatusIndicator type={item.active ? "success" : "stopped"}>
              {item.active ? "Activa" : "Pausada"}
            </StatusIndicator>
            <Badge>{item.kind}</Badge>
          </SpaceBetween>
          <dl className="connections-detail-meta">
            <div>
              <dt>ID</dt>
              <dd><code>{item.id}</code></dd>
            </div>
            <div>
              <dt>Conexión</dt>
              <dd>
                <Link to={`/conexiones/${item.connection_id}`}>
                  {connection?.display_name ?? item.connection_id}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Última sincronización</dt>
              <dd>{item.sync_last_update ? formatDate(item.sync_last_update) : "Nunca"}</dd>
            </div>
            <div>
              <dt>Creada</dt>
              <dd>{formatDate(item.created_at)}</dd>
            </div>
            <div>
              <dt>Actualizada</dt>
              <dd>{formatDate(item.modified_at)}</dd>
            </div>
          </dl>
          <div>
            <h3 className="connections-section-title">Configuración</h3>
            <Box variant="code">
              <pre>{JSON.stringify(item.config, null, 2)}</pre>
            </Box>
          </div>
        </SpaceBetween>
      </article>
      <Modal
        visible={deleteOpen}
        onDismiss={() => setDeleteOpen(false)}
        header="Eliminar fuente"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={busy === "delete"}
                onClick={() => void handleDelete()}
              >
                Eliminar
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <p>
          ¿Eliminar <strong>{item.name}</strong>? No se borran los recuerdos ya
          ingeridos, pero dejará de sincronizarse.
        </p>
      </Modal>
    </>
  );
}
