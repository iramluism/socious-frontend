/** Lifecycle status of an illustrative registry entry. */
export type RegistryStatus = "Activo" | "Indexando" | "Pausado" | "Borrador";

/** Category of indexed resource shown in the Registry table. */
export type RegistryCategory =
  | "Fuente indexada"
  | "Esquema"
  | "Índice de memoria"
  | "Colección sincronizada"
  | "Conector";

/**
 * Illustrative Memo registry entry for the AWS-style list demo.
 *
 * Values are sample-only; nothing is persisted or fetched remotely.
 */
export interface RegistryItem {
  id: string;
  name: string;
  category: RegistryCategory;
  status: RegistryStatus;
  owner: string;
  source: string;
  updatedAt: string;
  description: string;
  details: string;
}
