import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { registryItems } from "./data";
import { filterRegistryItems } from "./filter";
import type { RegistryItem, RegistryStatus } from "./types";

const PAGE_SIZE = 5;

/**
 * Maps a registry status label to a Cloudscape StatusIndicator type.
 *
 * Parameters
 * ----------
 * status : RegistryStatus
 *     Spanish status shown in the table.
 *
 * Returns
 * -------
 * StatusIndicator type string compatible with Cloudscape.
 */
function statusType(
  status: RegistryStatus,
): "success" | "in-progress" | "stopped" | "pending" {
  switch (status) {
    case "Activo":
      return "success";
    case "Indexando":
      return "in-progress";
    case "Pausado":
      return "stopped";
    case "Borrador":
      return "pending";
  }
}

/**
 * Detail view for one registry entry with disabled future CRUD actions.
 */
export function RegistryDetailPage() {
  const { id } = useParams();
  const item = registryItems.find((entry) => entry.id === id);
  if (!item) {
    return (
      <>
        <PageHeading
          title="Elemento no encontrado"
          description="Este enlace no corresponde a un recurso del Registry de la demo."
        />
        <Link to="/registry">Volver al Registry</Link>
      </>
    );
  }
  return (
    <>
      <Link className="back-link" to="/registry">
        ← Volver al Registry
      </Link>
      <PageHeading
        title={item.name}
        description={item.description}
        action={
          <SpaceBetween direction="horizontal" size="xs">
            <Button disabled>Editar · Próximamente</Button>
            <Button disabled>Eliminar · Próximamente</Button>
          </SpaceBetween>
        }
      />
      <article className="panel detail-content">
        <SpaceBetween size="m">
          <div>
            <span className="tag">{item.category}</span>
          </div>
          <dl className="registry-detail-meta">
            <div>
              <dt>Estado</dt>
              <dd>
                <StatusIndicator type={statusType(item.status)}>
                  {item.status}
                </StatusIndicator>
              </dd>
            </div>
            <div>
              <dt>Propietario</dt>
              <dd>{item.owner}</dd>
            </div>
            <div>
              <dt>Fuente</dt>
              <dd>{item.source}</dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>{formatDate(item.updatedAt)}</dd>
            </div>
          </dl>
          <p>{item.details}</p>
          <p className="demo-explainer">
            Las acciones de registro, edición y eliminación permanecerán
            deshabilitadas hasta una versión con persistencia real.
          </p>
        </SpaceBetween>
      </article>
    </>
  );
}

/**
 * AWS-style Registry list using Cloudscape Table, filter and header actions.
 *
 * State stays on the page: filter text, selection, pagination and a local
 * snapshot of sample data (refresh reloads that snapshot without network I/O).
 */
export function RegistryPage() {
  const [items, setItems] = useState(() => [...registryItems]);
  const [filteringText, setFilteringText] = useState("");
  const [selectedItems, setSelectedItems] = useState<RegistryItem[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const filtered = useMemo(
    () => filterRegistryItems(items, filteringText),
    [items, filteringText],
  );

  const pagesCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPageIndex, pagesCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const columnDefinitions: TableProps.ColumnDefinition<RegistryItem>[] = [
    {
      id: "name",
      header: "Nombre",
      cell: (item) => (
        <Link to={`/registry/${item.id}`} className="registry-name-link">
          {item.name}
        </Link>
      ),
      isRowHeader: true,
    },
    {
      id: "category",
      header: "Tipo",
      cell: (item) => item.category,
    },
    {
      id: "status",
      header: "Estado",
      cell: (item) => (
        <StatusIndicator type={statusType(item.status)}>
          {item.status}
        </StatusIndicator>
      ),
    },
    {
      id: "owner",
      header: "Propietario",
      cell: (item) => item.owner,
    },
    {
      id: "source",
      header: "Fuente",
      cell: (item) => item.source,
    },
    {
      id: "updatedAt",
      header: "Última actualización",
      cell: (item) => formatDate(item.updatedAt),
    },
    {
      id: "description",
      header: "Descripción",
      cell: (item) => item.description,
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
          Ningún recurso del Registry coincide con «{filteringText.trim()}».
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
        <b>No hay recursos</b>
        <Box variant="p" padding={{ bottom: "s" }}>
          El inventario de ejemplo está vacío en esta sesión.
        </Box>
      </Box>
    );

  return (
    <>
      <PageHeading
        title="Registry"
        description="Inventario ilustrativo de fuentes indexadas, esquemas e índices de memoria, al estilo de las listas de recursos de AWS."
      />
      <p className="demo-explainer">
        Listado de demostración con datos locales. Registrar, editar o eliminar
        recursos no está disponible todavía.
      </p>
      <div className="registry-table">
      <Table
        trackBy="id"
        columnDefinitions={columnDefinitions}
        items={pageItems}
        loadingText="Cargando recursos"
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems([...detail.selectedItems])
        }
        ariaLabels={{
          selectionGroupLabel: "Selección de recursos del Registry",
          allItemsSelectionLabel: () => "Seleccionar todos los recursos visibles",
          itemSelectionLabel: (_data, item) => `Seleccionar ${item.name}`,
          tableLabel: "Registry",
        }}
        header={
          <Header
            variant="h2"
            counter={counter}
            description="Recursos de ejemplo del espacio Memo. Las acciones de mutación están deshabilitadas."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  iconName="refresh"
                  ariaLabel="Actualizar lista desde datos de ejemplo"
                  onClick={() => {
                    setItems([...registryItems]);
                    setSelectedItems([]);
                    setCurrentPageIndex(1);
                  }}
                >
                  Actualizar
                </Button>
                <ButtonDropdown
                  items={[
                    {
                      id: "bulk-delete",
                      text: "Eliminar seleccionados · Próximamente",
                      disabled: true,
                    },
                    {
                      id: "bulk-edit",
                      text: "Editar seleccionados · Próximamente",
                      disabled: true,
                    },
                  ]}
                  disabled={selectedItems.length === 0}
                >
                  Acciones
                </ButtonDropdown>
                <Button disabled variant="primary">
                  Registrar · Próximamente
                </Button>
              </SpaceBetween>
            }
          >
            Recursos
          </Header>
        }
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Buscar por nombre, tipo, estado, propietario o descripción"
            filteringAriaLabel="Filtrar recursos del Registry"
            filteringClearAriaLabel="Borrar filtro del Registry"
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
              pageLabel: (pageNumber) => `Página ${pageNumber} de ${pagesCount}`,
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
