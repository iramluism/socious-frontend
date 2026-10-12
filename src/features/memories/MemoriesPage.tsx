import { useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import { useDemo } from "../../app/DemoContext";
import { PageHeading, formatDate } from "../../shared/PageHeading";
import { collections } from "./data";
import { MemoryCard } from "./MemoryCard";
import { CreateMemory } from "./CreateMemory";
import { normalize } from "../query/search";
/** Lists active or archived memories with URL-backed filters and a view toggle. */
export function MemoriesPage({ archived = false }: { archived?: boolean }) {
  const { memories } = useDemo();
  const [params, setParams] = useSearchParams();
  const [grid, setGrid] = useState(false);
  const [open, setOpen] = useState(false);
  const search = params.get("q") ?? "";
  const collection = params.get("coleccion") ?? "";
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const filtered = memories.filter(
    (m) =>
      m.archived === archived &&
      (!collection || m.collection === collection) &&
      normalize(`${m.title} ${m.content}`).includes(normalize(search)),
  );
  return (
    <>
      <PageHeading
        title={archived ? "Archivados" : "Mis recuerdos"}
        description={
          archived
            ? "Bocetos e ideas que conservas como referencia."
            : "Todo lo importante, con su contexto y su origen."
        }
        action={
          !archived && (
            <Button
              iconName="add-plus"
              variant="primary"
              onClick={() => setOpen(true)}
            >
              Nuevo recuerdo
            </Button>
          )
        }
      />
      <div className="toolbar">
        <label className="grow">
          <span className="sr-only">Buscar recuerdos</span>
          <input
            placeholder="Buscar en tus recuerdos"
            value={search}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filtrar colección</span>
          <select
            value={collection}
            onChange={(e) => update("coleccion", e.target.value)}
          >
            <option value="">Todas las colecciones</option>
            {collections.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="view-buttons">
          <button
            aria-label="Vista lista"
            aria-pressed={!grid}
            onClick={() => setGrid(false)}
          >
            Lista
          </button>
          <button
            aria-label="Vista cuadrícula"
            aria-pressed={grid}
            onClick={() => setGrid(true)}
          >
            Cuadrícula
          </button>
        </div>
      </div>
      <p className="muted">{filtered.length} recuerdos</p>
      <div className={grid ? "memory-grid" : "panel memory-list"}>
        {filtered.map((m) => (
          <MemoryCard key={m.id} memory={m} />
        ))}
        {!filtered.length && (
          <p className="empty">
            No hay recuerdos que coincidan con estos filtros.
          </p>
        )}
      </div>
      {open && <CreateMemory open onClose={() => setOpen(false)} />}
    </>
  );
}
/** Shows the original memory and metadata, or a recoverable unknown-ID state. */
export function MemoryDetailPage() {
  const { id } = useParams();
  const { memories } = useDemo();
  const memory = memories.find((m) => m.id === id);
  if (!memory)
    return (
      <>
        <PageHeading
          title="Recuerdo no disponible"
          description="Puede pertenecer a una sesión anterior o el enlace no es válido."
        />
        <Link to="/recuerdos">Volver a mis recuerdos</Link>
      </>
    );
  return (
    <>
      <Link
        className="back-link"
        to={memory.archived ? "/archivados" : "/recuerdos"}
      >
        ← Volver a recuerdos
      </Link>
      <PageHeading
        title={memory.title}
        description={`${memory.source} · ${formatDate(memory.createdAt)}`}
        action={
          !memory.archived && (
            <div className="actions">
              <Button disabled>Editar · Próximamente</Button>
              <Button disabled>Archivar · Próximamente</Button>
              <Button disabled>Eliminar · Próximamente</Button>
            </div>
          )
        }
      />
      <article className="panel detail-content">
        <span className="tag">{memory.collection || "Sin colección"}</span>
        {memory.archived && <span className="tag">Archivado</span>}
        <p>{memory.content}</p>
        <hr />
        <p className="muted">
          Fuente original: {memory.source}. Contenido de demostración guardado
          en memoria.
          {memory.archived
            ? " Los archivados de la demo son ejemplos precargados sin acciones de edición."
            : ""}
        </p>
      </article>
    </>
  );
}
