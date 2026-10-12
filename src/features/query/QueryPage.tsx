import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { PageHeading } from "../../shared/PageHeading";
import { useDemo } from "../../app/DemoContext";
import { collections, sources } from "../memories/data";
import { searchMemories, excerpt, type QueryInput } from "./search";
/** Runs lexical searches against local memories and restores complete queries from history. */
export function QueryPage() {
  const { memories, history, rememberQuery } = useDemo();
  const [query, setQuery] = useState<QueryInput>({
    text: "",
    collection: "",
    source: "",
  });
  const [submitted, setSubmitted] = useState<QueryInput | null>(null);
  const [error, setError] = useState("");
  const run = (value: QueryInput) => {
    if (!value.text.trim()) {
      setError("Escribe una consulta para buscar.");
      return;
    }
    setError("");
    setSubmitted(value);
    rememberQuery(value);
  };
  const results = submitted ? searchMemories(memories, submitted) : [];
  return (
    <>
      <PageHeading
        title="Query"
        description="Haz una consulta. Recupera el contexto. Encuentra la fuente."
      />
      <div className="query-columns">
        <section>
          <form
            className="panel query-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(query);
            }}
          >
            <h2>
              <Icon name="search" /> Consulta tus recuerdos
            </h2>
            <label htmlFor="query-text">¿Qué quieres encontrar?</label>
            <textarea
              id="query-text"
              rows={4}
              placeholder="Por ejemplo: planificación del proyecto"
              value={query.text}
              onChange={(e) => setQuery({ ...query, text: e.target.value })}
            />
            <div className="query-filters">
              <label>
                Colección
                <select
                  value={query.collection}
                  onChange={(e) =>
                    setQuery({ ...query, collection: e.target.value })
                  }
                >
                  <option value="">Todas las colecciones</option>
                  {collections.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Fuente
                <select
                  value={query.source}
                  onChange={(e) =>
                    setQuery({ ...query, source: e.target.value })
                  }
                >
                  <option value="">Todas las fuentes</option>
                  {sources.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <Button variant="primary" iconName="search" formAction="submit">
                Consultar
              </Button>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <p className="demo-explainer">
              <Icon name="status-info" /> Búsqueda local por palabras. Esta demo
              no utiliza IA ni genera respuestas.
            </p>
          </form>
          {submitted ? (
            <section aria-live="polite">
              <div className="section-heading">
                <h2>
                  Resultados <span className="count">{results.length}</span>
                </h2>
                <span className="muted">Coincidencias de la demo</span>
              </div>
              {results.length ? (
                results.map(({ memory, score }, i) => (
                  <article className="panel query-result" key={memory.id}>
                    <div className="result-title">
                      <span className="reference">{i + 1}</span>
                      <h3>
                        <Link to={`/recuerdos/${memory.id}`}>
                          {memory.title}
                        </Link>
                      </h3>
                      <span className="muted">
                        {score} coincidencia{score === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p>{excerpt(memory.content, submitted.text)}</p>
                    <div className="metadata">
                      <span>{memory.collection || "Sin colección"}</span>
                      <span>{memory.source}</span>
                      <Link to={`/recuerdos/${memory.id}`}>Abrir fuente →</Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel empty">
                  <Icon name="search" />
                  <h3>Sin coincidencias</h3>
                  <p>Prueba otras palabras o amplía los filtros.</p>
                </div>
              )}
            </section>
          ) : (
            <div className="empty query-welcome">
              <Icon name="search" size="big" />
              <h2>El contexto empieza con una consulta</h2>
              <p>Busca palabras como «proyecto», «memoria» o «lecturas».</p>
            </div>
          )}
        </section>
        <aside className="panel history">
          <h2>Consultas recientes</h2>
          <p className="muted">Durante esta sesión</p>
          {history.length ? (
            history.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(item);
                  run(item);
                }}
              >
                <Icon name="history" />
                <span>
                  {item.text}
                  <small>
                    {item.collection || "Todas las colecciones"} ·{" "}
                    {item.source || "Todas las fuentes"}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="empty">Tus consultas aparecerán aquí.</p>
          )}
        </aside>
      </div>
    </>
  );
}
