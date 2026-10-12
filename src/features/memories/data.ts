import type { Memory } from "./types";

/** Collection labels available for capture and filters in the demo. */
export const collections = ["Proyecto", "Trabajo", "Personal"];

/** Source labels used by sample memories and Query filters. */
export const sources = ["Notas manuales", "Documentos", "Notas de reuniones"];

/** Seed memories loaded into session state on every full page reload. */
export const initialMemories: Memory[] = [
  {
    id: "socious",
    title: "Ideas para Socious",
    content:
      "Un lugar para conectar notas, proyectos y contexto. La próxima versión de Memo debe permitir recuperar recuerdos y consultar sus fuentes.",
    collection: "Proyecto",
    source: "Notas manuales",
    createdAt: "2026-10-12T09:30:00Z",
    archived: false,
  },
  {
    id: "planning",
    title: "Reunión de planificación",
    content:
      "Revisar las prioridades del proyecto y preparar la próxima iteración. Acordamos empezar por una demo de Memo y validar la navegación antes de integrar modelos.",
    collection: "Trabajo",
    source: "Notas de reuniones",
    createdAt: "2026-10-11T14:00:00Z",
    archived: false,
  },
  {
    id: "reading",
    title: "Lecturas pendientes",
    content:
      "Artículos y libros para consultar más adelante: diseño de software, memoria personal y búsqueda de información.",
    collection: "Personal",
    source: "Notas manuales",
    createdAt: "2026-10-10T10:00:00Z",
    archived: false,
  },
  {
    id: "architecture",
    title: "Principios de una memoria fiable",
    content:
      "Conservar la procedencia de la información. Distinguir hechos, inferencias y contenido generado. El usuario debe poder corregir sus recuerdos.",
    collection: "Proyecto",
    source: "Documentos",
    createdAt: "2026-10-09T10:00:00Z",
    archived: false,
  },
  {
    id: "weekend",
    title: "Una escapada a la montaña",
    content:
      "Preparar una ruta tranquila para el fin de semana. Llevar agua y revisar el tiempo antes de salir.",
    collection: "Personal",
    source: "Notas manuales",
    createdAt: "2026-10-08T08:00:00Z",
    archived: false,
  },
  {
    id: "archive",
    title: "Primer boceto de Memo",
    content:
      "Explorar una estructura de consola con selector de aplicaciones y navegación lateral.",
    collection: "Proyecto",
    source: "Documentos",
    createdAt: "2026-09-24T08:00:00Z",
    archived: true,
  },
];
