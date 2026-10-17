import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";
import { useDemo } from "../../app/DemoContext";
import { listClassifiers, listLabels } from "../qualifiers/api";
import type { Classifier, Label } from "../qualifiers/types";
import { queryMemos } from "./api";
import { excerpt, formatLabels } from "./search";
import type { QueryHit, QueryInput } from "./types";

type LabelOption = Label & { classifierName: string };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail ? `${error.message}: ${error.detail}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "No se pudo completar la consulta.";
}

/** Runs semantic queries against Memo and filters by selected labels. */
export function QueryPage() {
  const { history, rememberQuery } = useDemo();
  const [searchParams] = useSearchParams();
  const initialText = searchParams.get("q") ?? "";
  const [query, setQuery] = useState<QueryInput>({
    text: initialText,
    labels: [],
  });
  const [submitted, setSubmitted] = useState<QueryInput | null>(null);
  const [results, setResults] = useState<QueryHit[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState<LabelOption[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labelsError, setLabelsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLabelsLoading(true);
    setLabelsError("");
    listClassifiers()
      .then(async (classifiers: Classifier[]) => {
        const active = classifiers.filter((item) => item.active);
        const groups = await Promise.all(
          active.map(async (classifier) => {
            const labels = await listLabels(classifier.id);
            return labels
              .filter((label) => label.active)
              .map((label) => ({
                ...label,
                classifierName: classifier.name,
              }));
          }),
        );
        if (!cancelled) {
          setLabelOptions(groups.flat());
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLabelsError(errorMessage(err));
          setLabelOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLabelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl != null) {
      setQuery((current) => ({ ...current, text: fromUrl }));
    }
  }, [searchParams]);

  const labelsByClassifier = useMemo(() => {
    const map = new Map<string, LabelOption[]>();
    for (const label of labelOptions) {
      const current = map.get(label.classifierName) ?? [];
      current.push(label);
      map.set(label.classifierName, current);
    }
    return [...map.entries()];
  }, [labelOptions]);

  const toggleLabel = (name: string) => {
    setQuery((current) => {
      const selected = current.labels.includes(name)
        ? current.labels.filter((item) => item !== name)
        : [...current.labels, name];
      return { ...current, labels: selected };
    });
  };

  const run = async (value: QueryInput) => {
    if (!value.text.trim()) {
      setError("Escribe una consulta para buscar.");
      setSubmitted(null);
      setResults([]);
      return;
    }
    setError("");
    setLoading(true);
    setSubmitted(value);
    rememberQuery(value);
    try {
      const response = await queryMemos({
        query: value.text.trim(),
        labels: value.labels,
        top_k: 10,
      });
      setResults(response.results);
    } catch (err) {
      setResults([]);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Query"
        description="Haz una consulta. Filtra por labels. Recupera el contexto."
      />
      <div className="query-columns">
        <section>
          <form
            className="panel query-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(query);
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
            <fieldset className="query-label-filters">
              <legend>Labels</legend>
              <p className="muted query-label-hint">
                Opcional. Si seleccionas varios, solo aparecen fragmentos que
                tengan todos (AND).
              </p>
              {labelsLoading ? (
                <p className="muted">Cargando labels…</p>
              ) : labelsError ? (
                <Alert type="error" header="No se pudieron cargar los labels">
                  {labelsError}
                </Alert>
              ) : labelsByClassifier.length === 0 ? (
                <p className="muted">
                  No hay labels activos. Crea calificadores para filtrar.
                </p>
              ) : (
                labelsByClassifier.map(([classifierName, labels]) => (
                  <div key={classifierName} className="query-label-group">
                    <h3>{classifierName}</h3>
                    <ul className="query-label-chips">
                      {labels.map((label) => {
                        const selected = query.labels.includes(label.name);
                        return (
                          <li key={label.id}>
                            <button
                              type="button"
                              className={
                                selected
                                  ? "query-label-chip is-selected"
                                  : "query-label-chip"
                              }
                              aria-pressed={selected}
                              onClick={() => toggleLabel(label.name)}
                            >
                              {label.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </fieldset>
            <div className="query-filters">
              <Button
                variant="primary"
                iconName="search"
                formAction="submit"
                loading={loading}
              >
                Consultar
              </Button>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </form>
          {submitted ? (
            <section aria-live="polite">
              <div className="section-heading">
                <h2>
                  Resultados{" "}
                  <span className="count">{loading ? "…" : results.length}</span>
                </h2>
                <span className="muted">{formatLabels(submitted.labels)}</span>
              </div>
              {loading ? (
                <div className="panel empty">
                  <p>Buscando…</p>
                </div>
              ) : results.length ? (
                results.map((hit, i) => (
                  <article className="panel query-result" key={hit.id}>
                    <div className="result-title">
                      <span className="reference">{i + 1}</span>
                      <h3>{String(hit.source ?? hit.id)}</h3>
                      <span className="muted">
                        distancia {hit.distance.toFixed(3)}
                      </span>
                    </div>
                    <p>{excerpt(hit.text, submitted.text)}</p>
                    <div className="metadata">
                      {hit.kind != null && <span>{String(hit.kind)}</span>}
                      {Object.values(hit.classifications).map((entry) => (
                        <span key={`${hit.id}-${entry.label_id}`}>
                          {entry.label_name}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel empty">
                  <Icon name="search" />
                  <h3>Sin coincidencias</h3>
                  <p>Prueba otras palabras o amplía los filtros de labels.</p>
                </div>
              )}
            </section>
          ) : (
            <div className="empty query-welcome">
              <Icon name="search" size="big" />
              <h2>El contexto empieza con una consulta</h2>
              <p>Busca en lenguaje natural y filtra por los labels que quieras.</p>
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
                  void run(item);
                }}
              >
                <Icon name="history" />
                <span>
                  {item.text}
                  <small>{formatLabels(item.labels)}</small>
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
