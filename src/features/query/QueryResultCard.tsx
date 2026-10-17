import { useId, useState } from "react";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Icon from "@cloudscape-design/components/icon";
import Modal from "@cloudscape-design/components/modal";
import { presentQueryHit } from "./presentation";
import type { QueryHit } from "./types";

/** Displays useful retrieval content and keeps technical data in optional details. */
export function QueryResultCard({
  hit,
  query,
}: {
  hit: QueryHit;
  query: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const titleId = useId();
  const content = presentQueryHit(hit, query);
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
                disabled: true,
                disabledReason: "Todavía no disponible",
                ariaLabel: "Olvidar recuerdo. Todavía no disponible",
              },
            ]}
            onItemClick={({ detail }) => {
              if (detail.id === "details") setDetailsOpen(true);
            }}
          />
        </div>
        <p className="query-result-excerpt">{content.excerpt}</p>
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
    </>
  );
}
