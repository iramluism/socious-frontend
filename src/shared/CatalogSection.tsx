import { Link, useParams } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import type { IconProps } from "@cloudscape-design/components/icon";
import { PageHeading } from "./PageHeading";

/** Read-only catalog entry; external links are references, never model execution. */
export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  type: string;
  details: string;
  url?: string;
}

/** Metadata and items for an illustrative catalog section. */
export interface CatalogDefinition {
  title: string;
  description: string;
  action: string;
  route: string;
  icon: IconProps.Name;
  items: CatalogItem[];
}

/**
 * Renders an illustrative catalog list or detail view.
 *
 * External links appear only when an item provides a reference URL (models).
 */
export function CatalogSection({ catalog }: { catalog: CatalogDefinition }) {
  const { id } = useParams();
  const item = id ? catalog.items.find((entry) => entry.id === id) : undefined;
  if (id && !item)
    return (
      <>
        <PageHeading
          title="Elemento no encontrado"
          description="Este enlace no corresponde a un elemento de la demo."
        />
        <Link to={`/${catalog.route}`}>Volver al catálogo</Link>
      </>
    );
  return (
    <>
      {item && (
        <Link className="back-link" to={`/${catalog.route}`}>
          ← Volver a {catalog.title.toLocaleLowerCase("es")}
        </Link>
      )}
      <PageHeading
        title={item?.name ?? catalog.title}
        description={item?.description ?? catalog.description}
        action={
          !item && <Button disabled>{catalog.action} · Próximamente</Button>
        }
      />
      {item ? (
        <article className="panel detail-content">
          <span className="tag">{item.type}</span>
          <p>{item.details}</p>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer">
              Ver referencia en Hugging Face ↗
            </a>
          )}
        </article>
      ) : (
        <>
          <p className="demo-explainer">
            Catálogo ilustrativo. La configuración y ejecución estarán
            disponibles en una próxima versión.
          </p>
          <div className="catalog-grid">
            {catalog.items.map((entry) => (
              <Link
                className="panel catalog-card"
                to={`/${catalog.route}/${entry.id}`}
                key={entry.id}
              >
                <Icon name={catalog.icon} />
                <span className="tag">{entry.type}</span>
                <h2>{entry.name}</h2>
                <p>{entry.description}</p>
                <span>Ver detalle →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
