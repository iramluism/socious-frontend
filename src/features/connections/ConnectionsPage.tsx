import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Header from "@cloudscape-design/components/header";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import type { TableProps } from "@cloudscape-design/components/table";
import { ApiError } from "../../shared/api/client";
import { PageHeading, formatDate } from "../../shared/PageHeading";
import {
  createConnection,
  getConnection,
  getOAuthApp,
  listConnections,
  listKinds,
  regenerateConsent,
  revokeConnection,
} from "./api";
import { filterConnections } from "./filter";
import type {
  Connection,
  ConnectionKind,
  ConnectionStatus,
  KindResponse,
} from "./types";

const PAGE_SIZE = 5;
const GOOGLE_OAUTH2_FAMILY = "google_oauth2" as const;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  pending_auth: "Pendiente de autorización",
  active: "Activa",
  revoked: "Revocada",
  error: "Error",
};

const OAUTH_NOT_CONFIGURED_MESSAGE =
  "La app OAuth de Google no está configurada en el servidor. Define MEMO_GOOGLE_OAUTH_CLIENT_ID, MEMO_GOOGLE_OAUTH_CLIENT_SECRET, MEMO_PUBLIC_BASE_URL y MEMO_SECRETS_KEY en el entorno de Socius y registra la URI de redirección en Google Cloud.";

type ConnectionDetailLocationState = {
  pollAuth?: boolean;
  openConsentUrl?: string | null;
};

/**
 * Maps a connection status to a Cloudscape StatusIndicator type.
 */
function statusType(
  status: ConnectionStatus,
): "success" | "pending" | "stopped" | "error" {
  switch (status) {
    case "active":
      return "success";
    case "pending_auth":
      return "pending";
    case "revoked":
      return "stopped";
    case "error":
      return "error";
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error inesperado";
}

function isTerminalPollStatus(status: ConnectionStatus): boolean {
  return status === "active" || status === "error";
}

function canReauthorize(item: Connection): boolean {
  return (
    item.consent_required ||
    item.status === "pending_auth" ||
    item.status === "error"
  );
}

function ConsentUrlLink({ url }: { url: string }) {
  return (
    <a
      className="connections-consent-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {url}
    </a>
  );
}

function CreateConnectionModal({
  visible,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onDismiss: () => void;
  onCreated: (connection: Connection, consentUrl: string | null) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<ConnectionKind[]>([]);
  const [kinds, setKinds] = useState<KindResponse[]>([]);
  const [loadingKinds, setLoadingKinds] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDisplayName("");
    setSelectedKinds([]);
    setError("");
    setLoadingKinds(true);
    listKinds()
      .then((entries) =>
        setKinds(entries.filter((entry) => entry.family === GOOGLE_OAUTH2_FAMILY)),
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoadingKinds(false));
  }, [visible]);

  const toggleKind = (kind: ConnectionKind) => {
    setSelectedKinds((current) =>
      current.includes(kind)
        ? current.filter((value) => value !== kind)
        : [...current, kind],
    );
  };

  const submit = async () => {
    if (!displayName.trim()) {
      setError("Escribe un nombre visible para la conexión.");
      return;
    }
    if (selectedKinds.length === 0) {
      setError("Selecciona al menos un kind de Google OAuth.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const oauthApp = await getOAuthApp(GOOGLE_OAUTH2_FAMILY);
      if (!oauthApp.configured) {
        setError(OAUTH_NOT_CONFIGURED_MESSAGE);
        return;
      }
      const connection = await createConnection({
        family: GOOGLE_OAUTH2_FAMILY,
        display_name: displayName.trim(),
        for_kinds: selectedKinds,
      });
      onCreated(connection, connection.consent_url);
      onDismiss();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={() => {
        if (!submitting) {
          onDismiss();
        }
      }}
      header="Nueva conexión"
      closeAriaLabel="Cerrar nueva conexión"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" loading={submitting} onClick={() => void submit()}>
              Crear conexión
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error ? <Alert type="error">{error}</Alert> : null}
        <p className="demo-explainer">
          Familia fija: <code>{GOOGLE_OAUTH2_FAMILY}</code>. Los kinds definen
          los scopes OAuth solicitados a Google.
        </p>
        <div className="form-stack">
          <label>
            Nombre visible <span className="required">*</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-required="true"
              disabled={submitting}
            />
          </label>
          <fieldset className="connections-kind-fieldset">
            <legend>
              Kinds <span className="required">*</span>
            </legend>
            {loadingKinds ? (
              <StatusIndicator type="loading">Cargando kinds…</StatusIndicator>
            ) : kinds.length === 0 ? (
              <p className="demo-explainer">No hay kinds disponibles para Google OAuth.</p>
            ) : (
              <SpaceBetween size="xs">
                {kinds.map((entry) => (
                  <label key={entry.kind} className="connections-kind-option">
                    <input
                      type="checkbox"
                      checked={selectedKinds.includes(entry.kind)}
                      onChange={() => toggleKind(entry.kind)}
                      disabled={submitting}
                    />
                    <span>
                      <code>{entry.kind}</code>
                      {!entry.implemented ? (
                        <Badge color="grey">Sin extractor</Badge>
                      ) : null}
                    </span>
                  </label>
                ))}
              </SpaceBetween>
            )}
          </fieldset>
        </div>
      </SpaceBetween>
    </Modal>
  );
}

/**
 * Detail view for one connection loaded from the Memo API.
 */
export function ConnectionDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as ConnectionDetailLocationState | null;
  const [item, setItem] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState<"reauth" | "revoke" | null>(
    null,
  );
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoadError("Identificador de conexión no válido.");
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const connection = await getConnection(id);
      setItem(connection);
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

  useEffect(() => {
    if (!locationState?.openConsentUrl) {
      return;
    }
    window.open(locationState.openConsentUrl, "_blank", "noopener,noreferrer");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, locationState?.openConsentUrl, navigate]);

  useEffect(() => {
    if (!id || !item) {
      return;
    }
    if (isTerminalPollStatus(item.status)) {
      setPolling(false);
      return;
    }
    const shouldPoll =
      locationState?.pollAuth === true || item.status === "pending_auth";
    if (!shouldPoll) {
      return;
    }
    if (pollIntervalRef.current !== null) {
      return;
    }

    setPolling(true);
    const startedAt = Date.now();

    pollIntervalRef.current = window.setInterval(() => {
      void (async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPolling(false);
          if (pollIntervalRef.current !== null) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }
        try {
          const fresh = await getConnection(id);
          setItem(fresh);
          if (isTerminalPollStatus(fresh.status)) {
            setPolling(false);
            if (pollIntervalRef.current !== null) {
              window.clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch {
          /* keep polling until timeout */
        }
      })();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setPolling(false);
    };
  }, [id, item, locationState?.pollAuth]);

  const handleReauthorize = async () => {
    if (!item) {
      return;
    }
    setBusyAction("reauth");
    setActionError("");
    try {
      const { consent_url: consentUrl } = await regenerateConsent(item.id);
      window.open(consentUrl, "_blank", "noopener,noreferrer");
      const fresh = await getConnection(item.id);
      setItem(fresh);
      if (
        pollIntervalRef.current === null &&
        !isTerminalPollStatus(fresh.status)
      ) {
        setPolling(true);
      }
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevoke = async () => {
    if (!item) {
      return;
    }
    setBusyAction("revoke");
    setActionError("");
    try {
      await revokeConnection(item.id);
      setRevokeConfirmOpen(false);
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <>
        <Link className="back-link" to="/conexiones">
          ← Volver a Conexiones
        </Link>
        <StatusIndicator type="loading">Cargando conexión…</StatusIndicator>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <PageHeading
          title="Conexión no encontrada"
          description={
            loadError ||
            "Este enlace no corresponde a una conexión del inventario."
          }
        />
        <Link to="/conexiones">Volver a Conexiones</Link>
      </>
    );
  }

  const showReauth = canReauthorize(item);

  return (
    <>
      <Link className="back-link" to="/conexiones">
        ← Volver a Conexiones
      </Link>
      <PageHeading
        title={item.display_name}
        description={`Familia ${item.family} · estado ${item.status}`}
        action={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={!showReauth}
              loading={busyAction === "reauth"}
              onClick={() => void handleReauthorize()}
            >
              Reautorizar
            </Button>
            <Button
              disabled={item.status === "revoked"}
              loading={busyAction === "revoke"}
              onClick={() => setRevokeConfirmOpen(true)}
            >
              Revocar
            </Button>
          </SpaceBetween>
        }
      />
      {actionError ? (
        <Alert type="error" header="No se pudo completar la acción">
          {actionError}
        </Alert>
      ) : null}
      {polling ? (
        <Alert type="info">
          Esperando autorización OAuth… comprobando el estado cada 2 segundos.
        </Alert>
      ) : null}
      <article className="panel detail-content">
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="xs">
            <StatusIndicator type={statusType(item.status)}>
              {STATUS_LABEL[item.status]}
            </StatusIndicator>
            {item.consent_required ? (
              <Badge color="blue">Consentimiento requerido</Badge>
            ) : null}
          </SpaceBetween>
          <dl className="connections-detail-meta">
            <div>
              <dt>ID</dt>
              <dd>
                <code>{item.id}</code>
              </dd>
            </div>
            <div>
              <dt>Familia</dt>
              <dd>
                <code>{item.family}</code>
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <code>{item.status}</code>
              </dd>
            </div>
            <div>
              <dt>Cuenta externa</dt>
              <dd>{item.external_account_id ?? "—"}</dd>
            </div>
            <div>
              <dt>Consentimiento requerido</dt>
              <dd>{item.consent_required ? "Sí" : "No"}</dd>
            </div>
            <div>
              <dt>URL de consentimiento</dt>
              <dd>
                {item.consent_url ? (
                  <ConsentUrlLink url={item.consent_url} />
                ) : (
                  "—"
                )}
              </dd>
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
            <h3 className="connections-section-title">Kinds solicitados</h3>
            <SpaceBetween direction="horizontal" size="xs">
              {item.requested_kinds.map((kind) => (
                <Badge key={kind}>{kind}</Badge>
              ))}
            </SpaceBetween>
          </div>
          <div>
            <h3 className="connections-section-title">Scopes concedidos</h3>
            {item.scopes_granted.length === 0 ? (
              <p className="demo-explainer">Ningún scope concedido todavía.</p>
            ) : (
              <ul className="connections-scope-list">
                {item.scopes_granted.map((scope) => (
                  <li key={scope}>
                    <code>{scope}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="demo-explainer">
            Los tokens cifrados y el perfil en bruto no se muestran en la API ni
            en esta consola.
          </p>
        </SpaceBetween>
      </article>
      <Modal
        visible={revokeConfirmOpen}
        onDismiss={() => setRevokeConfirmOpen(false)}
        header="Revocar conexión"
        closeAriaLabel="Cerrar confirmación de revocación"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setRevokeConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={busyAction === "revoke"}
                onClick={() => void handleRevoke()}
              >
                Revocar conexión
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <p>
          ¿Revocar <strong>{item.display_name}</strong>? Las fuentes que dependan
          de esta cuenta dejarán de sincronizar hasta crear una conexión nueva.
        </p>
      </Modal>
    </>
  );
}

/**
 * AWS-style Conexiones list using Cloudscape Table, filter and Memo API data.
 */
export function ConnectionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [filteringText, setFilteringText] = useState("");
  const [selectedItems, setSelectedItems] = useState<Connection[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const connections = await listConnections();
      setItems(connections);
    } catch (err) {
      setItems([]);
      setListError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filtered = useMemo(
    () => filterConnections(items, filteringText),
    [items, filteringText],
  );

  const pagesCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPageIndex, pagesCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const columnDefinitions: TableProps.ColumnDefinition<Connection>[] = [
    {
      id: "display_name",
      header: "Nombre",
      cell: (item) => (
        <Link to={`/conexiones/${item.id}`} className="connections-name-link">
          {item.display_name}
        </Link>
      ),
      isRowHeader: true,
    },
    {
      id: "family",
      header: "Familia",
      cell: (item) => <code>{item.family}</code>,
    },
    {
      id: "status",
      header: "Estado",
      cell: (item) => (
        <StatusIndicator type={statusType(item.status)}>
          {STATUS_LABEL[item.status]}
        </StatusIndicator>
      ),
    },
    {
      id: "external_account_id",
      header: "Cuenta",
      cell: (item) => item.external_account_id ?? "—",
    },
    {
      id: "requested_kinds",
      header: "Kinds solicitados",
      cell: (item) => item.requested_kinds.join(", "),
    },
    {
      id: "consent_required",
      header: "Consentimiento",
      cell: (item) =>
        item.consent_required ? (
          <Badge color="blue">Requerido</Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "modified_at",
      header: "Actualizado",
      cell: (item) => formatDate(item.modified_at),
    },
  ];

  const counter =
    selectedItems.length > 0
      ? `(${selectedItems.length}/${filtered.length})`
      : `(${filtered.length})`;

  const empty =
    filteringText.trim().length > 0 ? (
      <Box textAlign="center" color="inherit">
        <b>Sin coincidencias</b>
        <Box variant="p" padding={{ bottom: "s" }}>
          Ninguna conexión coincide con «{filteringText.trim()}».
        </Box>
        <Button
          onClick={() => {
            setFilteringText("");
            setCurrentPageIndex(1);
            setSelectedItems([]);
          }}
        >
          Borrar filtro
        </Button>
      </Box>
    ) : (
      <Box textAlign="center" color="inherit">
        <b>No hay conexiones</b>
        <Box variant="p" padding={{ bottom: "s" }}>
          Crea una conexión Google OAuth para autorizar Gmail, Drive u otros
          kinds disponibles.
        </Box>
      </Box>
    );

  return (
    <>
      <PageHeading
        title="Conexiones"
        description="Cuentas externas autorizadas contra la API Memo de Socius (OAuth Google en el MVP)."
      />
      {listError ? (
        <Alert type="error" header="No se pudo cargar el inventario">
          {listError}
        </Alert>
      ) : null}
      <div className="connections-table">
        <Table
          trackBy="id"
          columnDefinitions={columnDefinitions}
          items={pageItems}
          loading={loading}
          loadingText="Cargando conexiones"
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems([...detail.selectedItems])
          }
          ariaLabels={{
            selectionGroupLabel: "Selección de conexiones",
            allItemsSelectionLabel: () =>
              "Seleccionar todas las conexiones visibles",
            itemSelectionLabel: (_data, row) =>
              `Seleccionar ${row.display_name}`,
            tableLabel: "Conexiones",
          }}
          header={
            <Header
              variant="h2"
              counter={counter}
              description="Datos en vivo desde GET /connections. Los secretos nunca se muestran."
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    iconName="refresh"
                    ariaLabel="Actualizar lista desde la API"
                    loading={loading}
                    onClick={() => {
                      void loadList();
                      setSelectedItems([]);
                      setCurrentPageIndex(1);
                    }}
                  >
                    Actualizar
                  </Button>
                  <ButtonDropdown
                    items={[
                      {
                        id: "bulk-reauth",
                        text: "Reautorizar seleccionadas · Próximamente",
                        disabled: true,
                      },
                      {
                        id: "bulk-revoke",
                        text: "Revocar seleccionadas · Próximamente",
                        disabled: true,
                      },
                    ]}
                    disabled={selectedItems.length === 0}
                  >
                    Acciones
                  </ButtonDropdown>
                  <Button variant="primary" onClick={() => setCreateOpen(true)}>
                    Nueva conexión
                  </Button>
                </SpaceBetween>
              }
            >
              Conexiones
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Buscar por nombre, familia, estado, cuenta o kinds"
              filteringAriaLabel="Filtrar conexiones"
              filteringClearAriaLabel="Borrar filtro de conexiones"
              countText={
                filteringText.trim()
                  ? `${filtered.length} ${filtered.length === 1 ? "coincidencia" : "coincidencias"}`
                  : undefined
              }
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPageIndex(1);
                setSelectedItems([]);
              }}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={safePage}
              pagesCount={pagesCount}
              ariaLabels={{
                nextPageLabel: "Página siguiente",
                previousPageLabel: "Página anterior",
                pageLabel: (pageNumber) =>
                  `Página ${pageNumber} de ${pagesCount}`,
              }}
              onChange={({ detail }) =>
                setCurrentPageIndex(detail.currentPageIndex)
              }
            />
          }
          empty={empty}
          stickyHeader
          resizableColumns
        />
      </div>
      <CreateConnectionModal
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        onCreated={(connection, consentUrl) => {
          navigate(`/conexiones/${connection.id}`, {
            state: {
              pollAuth: true,
              openConsentUrl: consentUrl,
            } satisfies ConnectionDetailLocationState,
          });
        }}
      />
    </>
  );
}
