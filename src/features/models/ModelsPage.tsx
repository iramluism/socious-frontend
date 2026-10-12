import { CatalogSection } from "../../shared/CatalogSection";
import { modelsCatalog } from "./data";

/** Illustrative model catalog with Hugging Face reference links only. */
export function ModelsPage() {
  return <CatalogSection catalog={modelsCatalog} />;
}
