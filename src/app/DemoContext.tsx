import { createContext, useContext, useState, type ReactNode } from "react";
import { initialMemories } from "../features/memories/data";
import type { Memory, MemoryDraft } from "../features/memories/types";
import type { QueryInput } from "../features/query/search";
interface DemoState {
  memories: Memory[];
  history: QueryInput[];
  addMemory: (draft: MemoryDraft) => Memory;
  rememberQuery: (query: QueryInput) => void;
}
const Context = createContext<DemoState | null>(null);
/** Owns demo state above the router pages, preserving it until the page reloads. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [memories, setMemories] = useState(initialMemories);
  const [history, setHistory] = useState<QueryInput[]>([]);
  const addMemory = (draft: MemoryDraft) => {
    if (!draft.title.trim() || !draft.content.trim())
      throw new Error("El título y el contenido son obligatorios.");
    const memory: Memory = {
      ...draft,
      title: draft.title.trim(),
      content: draft.content.trim(),
      id: crypto.randomUUID(),
      source: "Notas manuales",
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setMemories((previous) => [memory, ...previous]);
    return memory;
  };
  const rememberQuery = (query: QueryInput) =>
    setHistory((previous) =>
      [
        query,
        ...previous.filter(
          (item) => JSON.stringify(item) !== JSON.stringify(query),
        ),
      ].slice(0, 10),
    );
  return (
    <Context.Provider value={{ memories, history, addMemory, rememberQuery }}>
      {children}
    </Context.Provider>
  );
}
/** Provides shared session data; must be called under DemoProvider. */
export function useDemo(): DemoState {
  const state = useContext(Context);
  if (!state) throw new Error("DemoProvider is required");
  return state;
}
