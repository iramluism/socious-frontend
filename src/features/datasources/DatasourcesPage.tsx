import { CatalogSection } from "../../shared/CatalogSection";
import { datasourcesCatalog } from "./data";

/** Illustrative datasource catalog without external connections. */
export function DatasourcesPage() {
  return <CatalogSection catalog={datasourcesCatalog} />;
}
