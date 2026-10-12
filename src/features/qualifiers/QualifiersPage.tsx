import { CatalogSection } from "../../shared/CatalogSection";
import { qualifiersCatalog } from "./data";

/** Illustrative qualifier catalog and detail routes. */
export function QualifiersPage() {
  return <CatalogSection catalog={qualifiersCatalog} />;
}
