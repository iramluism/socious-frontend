import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import type { TableProps } from "@cloudscape-design/components/table";
import { ApiError } from "../../shared/api/client";
import { PageHeading, formatDate } from "../../shared/PageHeading";
import { KIND_PRESENTATION } from "../connections/kindPresentation";
import { listDataSources } from "./api";
import type { DataSource } from "./types";

const PAGE_SIZE = 8;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error inesperado";
}

function filterDataSources(items: DataSource[], text: string): DataSource[] {
  const query = text.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter((item) => {
    const kindTitle = KIND_PRESENTATION[item.kind].title.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.kind.toLowerCase().includes(query) ||
      kindTitle.includes(query) ||
      item.id.toLowerCase().includes(query)
    );
  });
}

const columnDefinitions: TableProps.ColumnDefinition<DataSource>[] = [
  {
    id: "name",
    header: "Nombre",
    cell: (item) => (
      <Link to={`/datasources/${item.id}`}>{item.name}</Link>
    ),
    isRowHeader: true,
  },
  {
    id: "kind",
    header: "Tipo",
    cell: (item) => (
      <SpaceBetween direction="horizontal" size="xs">
        <span>{KIND_PRESENTATION[item.kind].title}</span>
        <Badge>{item.kind}</Badge>
      </SpaceBetween>
    ),
  },
  {
    id: "active",
    header: "Estado",
    cell: (item) => (
      <StatusIndicator type={item.active ? "success" : "stopped"}>
        {item.active ? "Activa" : "Pausada"}
      </StatusIndicator>
    ),
  },
  {
    id: "sync",
    header: "Última sync",
    cell: (item) =>
      item.sync_last_update ? formatDate(item.sync_last_update) : "—",
  },
  {
    id: "connection",
    header: "Conexión",
    cell: (item) => (
      <Link to={`/conexiones/${item.connection_id}`}>
        <code>{item.connection_id.slice(0, 8)}…</code>
      </Link>
    ),
  },
];

/**
 * Lists Memo data sources from the API with filter and pagination.
 */
export function DatasourcesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [filteringText, setFilteringText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      setItems(await listDataSources());
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
    () => filterDataSources(items, filteringText),
    [items, filteringText],
  );

  const pageItems = useMemo(() => {
    const start = (currentPageIndex - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPageIndex]);

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [filteringText]);

  return (
    <>
      <PageHeading
        title="Fuentes de datos"
        description="Define qué extraer de cada conexión hacia Memo."
        action={
          <Button variant="primary" onClick={() => navigate("/datasources/nueva")}>
            Nueva fuente
          </Button>
        }
      />
      {listError ? (
        <Alert type="error" header="No se pudo cargar el listado">
          {listError}
        </Alert>
      ) : null}
      <Table
        columnDefinitions={columnDefinitions}
        items={pageItems}
        loading={loading}
        loadingText="Cargando fuentes de datos"
        empty={
          filteringText
            ? "Ninguna fuente coincide con el filtro."
            : "Aún no hay fuentes. Crea la primera con «Nueva fuente»."
        }
        header={
          <Header
            counter={`(${filtered.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button iconName="refresh" onClick={() => void loadList()}>
                  Actualizar
                </Button>
              </SpaceBetween>
            }
          >
            Inventario
          </Header>
        }
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Buscar por nombre o tipo"
            filteringAriaLabel="Filtrar fuentes de datos"
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPageIndex}
            pagesCount={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
            onChange={({ detail }) =>
              setCurrentPageIndex(detail.currentPageIndex)
            }
          />
        }
      />
    </>
  );
}
