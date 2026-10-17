import { useId, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Icon from "@cloudscape-design/components/icon";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { ApiError } from "../../shared/api/client";
import { forgetMemory } from "../captures/api";
import { isCaptureHit, presentQueryHit } from "./presentation";
import type { QueryHit } from "./types";

/**
 * User-facing message for a failed forget request.
 *
 * Parameters
 * ----------
 * error : unknown
 *     Rejection from ``forgetMemory`` or the runtime.
 *
 * Returns
 * -------
 * string
 *     Message suitable for an alert on the result card.
 */
function forgetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail ? `${error.message}: ${error.detail}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "No se pudo olvidar el recuerdo.";
}

/**
 * Displays useful retrieval content and keeps technical data in optional details.
 *
 * Parameters
 * ----------
 * hit : QueryHit
 *     Semantic search fragment.
 * query : string
 *     Active query text used for the excerpt.
 * onForgotten : ((hit: QueryHit) => void) | undefined, optional
 *     Called after a successful forget so the parent can drop related hits.
 */
export function QueryResultCard({
  hit,
  query,
  onForgotten,
}: {
  hit: QueryHit;
  query: string;
  onForgotten?: (hit: QueryHit) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const content = presentQueryHit(hit, query);
  const capture = isCaptureHit(hit);

  const runForget = async () => {
    setError("");
    setBusy(true);
    try {
      await forgetMemory(hit.id);
      setConfirmOpen(false);
      onForgotten?.(hit);
    } catch (err) {
      setError(forgetErrorMessage(err));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <article className="panel query-result" aria-labelledby={titleId}>
        <div className="query-result-header">
          <div className="query-result-heading">
            <div className="query-result-provenance">
              <Icon name="file" />
              {content.provenance}
            </div>
            <h3 id={titleId}>{content.title}</h3>
          </div>
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Acciones para ${content.title}`}
            expandToViewport
            items={[
              { id: "details", text: "Ver detalles", iconName: "status-info" },
              {
                id: "forget",
                text: "Olvidar recuerdo",
                iconName: "remove",
                disabled: busy,
                disabledReason: busy ? "Olvidando…" : undefined,
                ariaLabel: "Olvidar recuerdo",
              },
            ]}
            onItemClick={({ detail }) => {
              if (detail.id === "details") setDetailsOpen(true);
              if (detail.id === "forget") {
                if (capture) {
                  void runForget();
                  return;
                }
                setConfirmOpen(true);
              }
            }}
          />
        </div>
        <p className="query-result-excerpt">{content.excerpt}</p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {(content.date || content.labels.length > 0 || content.link) && (
          <div className="query-result-footer">
            <div className="query-result-metadata">
              {content.date && (
                <span className="query-result-date">
                  <Icon name="calendar" />
                  Guardado el {content.date}
                </span>
              )}
              {content.labels.map((label) => (
                <span className="query-result-label" key={label}>
                  {label}
                </span>
              ))}
            </div>
            {content.link && (
              <div className="query-result-cta">
                <Button
                  href={content.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  external
                  i18nStrings={{
                    externalIconAriaLabel: "Se abre en una pestaña nueva",
                  }}
                >
                  {content.link.label}
                </Button>
              </div>
            )}
          </div>
        )}
      </article>
      {detailsOpen && (
        <Modal
          visible={detailsOpen}
          onDismiss={() => setDetailsOpen(false)}
          header={content.title}
          closeAriaLabel="Cerrar detalles"
          footer={<Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>}
        >
          <div className="query-result-details">
            {content.headings.length > 0 && (
              <>
                <h4>Encabezados</h4>
                <ul>
                  {content.headings.map((heading, index) => (
                    <li key={index}>{heading}</li>
                  ))}
                </ul>
              </>
            )}
            <h4>Texto completo</h4>
            <p className="query-result-full-text">
              {hit.text || "Este fragmento no contiene texto descriptivo"}
            </p>
            <ExpandableSection headerText="Información técnica">
              <dl>
                {[
                  ["ID", hit.id],
                  ["Source", hit.source],
                  ["Kind", hit.kind],
                  ["Distancia", hit.distance],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value == null ? "No disponible" : String(value)}</dd>
                  </div>
                ))}
              </dl>
            </ExpandableSection>
          </div>
        </Modal>
      )}
      {confirmOpen && (
        <Modal
          visible={confirmOpen}
          onDismiss={() => {
            if (!busy) setConfirmOpen(false);
          }}
          header="Olvidar documento"
          closeAriaLabel="Cerrar confirmación de olvido"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  disabled={busy}
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  loading={busy}
                  onClick={() => void runForget()}
                >
                  Olvidar documento
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Alert type="warning" header="Se elimina el documento entero">
            Este recuerdo no es una nota personal. Al olvidarlo se quitan todos
            los fragmentos de la misma fuente, no solo este resultado.
          </Alert>
          <p>
            Documento: <strong>{content.title}</strong>
          </p>
        </Modal>
      )}
    </>
  );
}
