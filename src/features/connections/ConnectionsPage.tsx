import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import type { TableProps } from "@cloudscape-design/components/table";
import { PageHeading, formatDate } from "../../shared/PageHeading";
import { connections as sampleConnections } from "./data";
import { filterConnections } from "./filter";
import type { Connection, ConnectionStatus } from "./types";

const PAGE_SIZE = 5;

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  pending_auth: "Pendiente de autorización",
  active: "Activa",
  revoked: "Revocada",
  error: "Error",
};

/**
 * Maps a connection status to a Cloudscape StatusIndicator type.
 *
 * Parameters
 * ----------
 * status : ConnectionStatus
 *     Backend lifecycle status.
 *
 * Returns
 * -------
 * StatusIndicator type string compatible with Cloudscape.
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

/**
 * Detail view for one connection with disabled mutating actions.
 */
export function ConnectionDetailPage() {
  const { id } = useParams();
  const item = sampleConnections.find((entry) => entry.id === id);
  if (!item) {
    return (
      <>
        <PageHeading
          title="Conexión no encontrada"
          description="Este enlace no corresponde a una conexión de la demo."
        />
        <Link to="/conexiones">Volver a Conexiones</Link>
      </>
    );
  }
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
            <Button disabled>Reautorizar · Próximamente</Button>
            <Button disabled>Revocar · Próximamente</Button>
          </SpaceBetween>
        }
      />
      <article className="panel detail-content">
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="xs">
            <StatusIndicator type={statusType(item.status)}>
              {STATUS_LABEL[item.status]}
            </StatusIndicator>
            {item.consent_required && (
              <Badge color="blue">Consentimiento requerido</Badge>
            )}
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
                  <span
                    className="connections-consent-url"
                    title="Ilustración; no se abre en la demo"
                    aria-disabled="true"
                  >
                    {item.consent_url}
                  </span>
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
            Los secretos cifrados y el perfil en bruto no se muestran en la API
            ni en esta demo. Crear, reautorizar o revocar conexiones no está
            disponible todavía.
          </p>
        </SpaceBetween>
      </article>
    </>
  );
}

/**
 * AWS-style Conexiones list using Cloudscape Table, filter and header actions.
 *
 * State stays on the page: filter text, selection, pagination and a local
 * snapshot of sample data (refresh reloads that snapshot without network I/O).
 */
export function ConnectionsPage() {
  const [items, setItems] = useState(() => [...sampleConnections]);
  const [filteringText, setFilteringText] = useState("");
  const [selectedItems, setSelectedItems] = useState<Connection[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

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
        <Link
          to={`/conexiones/${item.id}`}
          className="connections-name-link"
        >
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
          El inventario de ejemplo está vacío en esta sesión.
        </Box>
      </Box>
    );

  return (
    <>
      <PageHeading
        title="Conexiones"
        description="Cuentas externas autorizadas (OAuth u otras familias), con la misma forma que el contrato Connection del backend. Datos de ejemplo locales."
      />
      <p className="demo-explainer">
        Listado de demostración sin llamadas a la API. Crear, regenerar
        consentimiento o revocar no está disponible todavía.
      </p>
      <div className="connections-table">
        <Table
          trackBy="id"
          columnDefinitions={columnDefinitions}
          items={pageItems}
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
            itemSelectionLabel: (_data, item) =>
              `Seleccionar ${item.display_name}`,
            tableLabel: "Conexiones",
          }}
          header={
            <Header
              variant="h2"
              counter={counter}
              description="Conexiones de ejemplo del espacio Memo. Las acciones de mutación están deshabilitadas."
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    iconName="refresh"
                    ariaLabel="Actualizar lista desde datos de ejemplo"
                    onClick={() => {
                      setItems([...sampleConnections]);
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
                  <Button disabled variant="primary">
                    Nueva conexión · Próximamente
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
    </>
  );
}
