import { Link } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { useDemo } from "../../app/DemoContext";
import { PageHeading } from "../../shared/PageHeading";
import { collections } from "../memories/data";

/** Opens each collection as a filtered memory list using a shareable hash URL. */
export function CollectionsPage() {
  const { memories } = useDemo();
  return (
    <>
      <PageHeading
        title="Colecciones"
        description="Organiza tus recuerdos alrededor de lo que importa."
        action={<Button disabled>Nueva colección · Próximamente</Button>}
      />
      <div className="catalog-grid">
        {collections.map((collection) => (
          <Link
            key={collection}
            to={`/recuerdos?coleccion=${encodeURIComponent(collection)}`}
            className="panel catalog-card"
          >
            <Icon name="folder" size="big" />
            <h2>{collection}</h2>
            <p>
              {
                memories.filter(
                  (m) => !m.archived && m.collection === collection,
                ).length
              }{" "}
              recuerdos
            </p>
            <span>Explorar colección →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
