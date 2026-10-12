import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { useDemo } from "../../app/DemoContext";
import { PageHeading } from "../../shared/PageHeading";
import { MemoryCard } from "./MemoryCard";
import { CreateMemory } from "./CreateMemory";
import { collections } from "./data";
/** Introduces Memo with quick capture, recent memories and catalog shortcuts. */
export function OverviewPage() {
  const { memories } = useDemo();
  const [open, setOpen] = useState(false);
  const [capture, setCapture] = useState("");
  const active = memories.filter((m) => !m.archived);
  return (
    <>
      <PageHeading
        title="Tu memoria, organizada"
        description="Guarda lo importante y retoma el contexto cuando lo necesites."
        action={
          <Button
            iconName="add-plus"
            variant="primary"
            onClick={() => setOpen(true)}
          >
            Nuevo recuerdo
          </Button>
        }
      />
      <form
        className="panel quick-capture"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Icon name="edit" />
        <label className="grow">
          <span className="sr-only">Captura rápida</span>
          <input
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder="¿Qué quieres recordar?"
          />
        </label>
        <Button formAction="submit">Guardar recuerdo</Button>
      </form>
      <div className="overview-columns">
        <section>
          <div className="section-heading">
            <h2>
              Recuerdos recientes <span className="count">{active.length}</span>
            </h2>
            <Link to="/recuerdos">Ver todos →</Link>
          </div>
          <div className="panel memory-list">
            {active.slice(0, 3).map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
          <Link className="query-banner" to="/query">
            <span className="memory-icon">
              <Icon name="search" />
            </span>
            <span>
              <strong>Encuentra el hilo de tus ideas</strong>
              <small>Consulta tus recuerdos y vuelve a sus fuentes.</small>
            </span>
            <Icon name="arrow-right" />
          </Link>
        </section>
        <aside className="overview-aside">
          <section className="panel">
            <div className="section-heading">
              <h2>Colecciones</h2>
              <Link to="/colecciones">Ver todas</Link>
            </div>
            {collections.map((c) => (
              <Link
                className="collection-row"
                key={c}
                to={`/recuerdos?coleccion=${encodeURIComponent(c)}`}
              >
                <Icon name="folder" />
                <span>
                  <strong>{c}</strong>
                  <small>
                    {active.filter((m) => m.collection === c).length} recuerdos
                  </small>
                </span>
                <Icon name="angle-right" />
              </Link>
            ))}
          </section>
          <section className="panel resources">
            <h2>Tu espacio de trabajo</h2>
            {[
              ["calificadores", "Calificadores", "Criterios de evaluación"],
              ["modelos", "Modelos", "Catálogo de Hugging Face"],
              ["datasources", "Datasources", "Fuentes de información"],
            ].map(([route, title, description]) => (
              <Link key={route} to={`/${route}`}>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <Icon name="angle-right" />
              </Link>
            ))}
          </section>
        </aside>
      </div>
      {open && (
        <CreateMemory
          open
          initialContent={capture}
          onClose={() => {
            setOpen(false);
            setCapture("");
          }}
        />
      )}
    </>
  );
}
