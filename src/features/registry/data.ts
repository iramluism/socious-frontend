import type { RegistryItem } from "./types";

/**
 * Sample registry entries for the Memo demo (Spanish copy).
 *
 * Coherent illustrative inventory of indexed sources, schemas and memory indexes.
 */
export const registryItems: RegistryItem[] = [
  {
    id: "idx-notas-manuales",
    name: "notas-manuales",
    category: "Fuente indexada",
    status: "Activo",
    owner: "Memo · Local",
    source: "Notas manuales",
    updatedAt: "2026-10-10T09:15:00.000Z",
    description: "Índice de capturas escritas en la sesión demo.",
    details:
      "Incluye los recuerdos creados a mano durante la demo. No sincroniza con ningún servicio externo; solo ilustra cómo se listaría una fuente indexada en un registro tipo AWS.",
  },
  {
    id: "idx-documentos",
    name: "documentos-referencia",
    category: "Fuente indexada",
    status: "Activo",
    owner: "Equipo Socious",
    source: "Documentos",
    updatedAt: "2026-10-09T16:40:00.000Z",
    description: "Materiales de trabajo y notas de arquitectura precargados.",
    details:
      "Entrada de demostración que agrupa documentos ficticios usados por Query. La importación real de archivos no está disponible en esta demo.",
  },
  {
    id: "idx-reuniones",
    name: "notas-reuniones",
    category: "Fuente indexada",
    status: "Indexando",
    owner: "Memo · Local",
    source: "Notas de reuniones",
    updatedAt: "2026-10-11T08:05:00.000Z",
    description: "Acuerdos y próximos pasos de ejemplo en proceso de índice.",
    details:
      "Estado «Indexando» simulado para mostrar filtros y badges. No hay cola de trabajos ni conexión a calendario.",
  },
  {
    id: "schema-recuerdo",
    name: "schema.recuerdo.v1",
    category: "Esquema",
    status: "Activo",
    owner: "Dominio Memo",
    source: "Catálogo interno",
    updatedAt: "2026-09-28T12:00:00.000Z",
    description: "Campos canónicos de un recuerdo (título, cuerpo, colección).",
    details:
      "Esquema ilustrativo: id, título, contenido, colección, fuente, fechas y archivado. No valida payloads reales; sirve para explorar el detalle del registro.",
  },
  {
    id: "schema-consulta",
    name: "schema.consulta.v1",
    category: "Esquema",
    status: "Activo",
    owner: "Dominio Memo",
    source: "Catálogo interno",
    updatedAt: "2026-09-30T11:20:00.000Z",
    description: "Forma de una consulta léxica y sus filtros opcionales.",
    details:
      "Describe texto, colección y fuente como en la pantalla Query. La ejecución sigue siendo local y determinista en esta demo.",
  },
  {
    id: "mem-idx-principal",
    name: "memoria-principal",
    category: "Índice de memoria",
    status: "Activo",
    owner: "Memo · Local",
    source: "Índice de sesión",
    updatedAt: "2026-10-11T10:30:00.000Z",
    description: "Índice léxico de recuerdos activos de la sesión.",
    details:
      "Representa el índice sobre el que opera searchMemories. No hay embeddings ni base vectorial en el frontend demo.",
  },
  {
    id: "mem-idx-archivados",
    name: "memoria-archivados",
    category: "Índice de memoria",
    status: "Pausado",
    owner: "Memo · Local",
    source: "Índice de sesión",
    updatedAt: "2026-10-05T14:10:00.000Z",
    description: "Índice de bocetos archivados (excluido de Query).",
    details:
      "Pausado a propósito en la demo: Query no incluye archivados. Reactivar o reindexar son acciones futuras deshabilitadas.",
  },
  {
    id: "sync-coleccion-proyecto",
    name: "coleccion-proyecto",
    category: "Colección sincronizada",
    status: "Activo",
    owner: "Usuario demo",
    source: "Colecciones",
    updatedAt: "2026-10-08T18:45:00.000Z",
    description: "Vista sincronizada de la colección Proyecto.",
    details:
      "Ilustra una colección como recurso del registro. La sincronización real y el CRUD de colecciones no están disponibles.",
  },
  {
    id: "sync-coleccion-trabajo",
    name: "coleccion-trabajo",
    category: "Colección sincronizada",
    status: "Borrador",
    owner: "Usuario demo",
    source: "Colecciones",
    updatedAt: "2026-10-07T09:00:00.000Z",
    description: "Borrador de sincronización para la colección Trabajo.",
    details:
      "Estado borrador para probar filtros y selección múltiple. Publicar o eliminar permanecen deshabilitados.",
  },
  {
    id: "conn-huggingface-ref",
    name: "huggingface-referencias",
    category: "Conector",
    status: "Pausado",
    owner: "Catálogo Modelos",
    source: "Hugging Face",
    updatedAt: "2026-10-01T07:30:00.000Z",
    description: "Referencias ilustrativas a modelos (sin descarga).",
    details:
      "Solo enlaces de referencia en el catálogo de Modelos. No abre sesiones OAuth ni descarga pesos.",
  },
  {
    id: "conn-documentos-local",
    name: "importador-documentos",
    category: "Conector",
    status: "Borrador",
    owner: "Datasources",
    source: "Documentos",
    updatedAt: "2026-10-06T13:25:00.000Z",
    description: "Conector local de ejemplo para importar archivos.",
    details:
      "Placeholder del futuro importador. En la demo no lee el sistema de archivos ni envía datos fuera del navegador.",
  },
];
