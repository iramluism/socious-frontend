/** A user memory stored only for the current demo session. */
export interface Memory {
  id: string;
  title: string;
  content: string;
  collection: string;
  source: string;
  createdAt: string;
  archived: boolean;
}
/** Validated input for creating a memory. */
export type MemoryDraft = Pick<Memory, "title" | "content" | "collection">;
