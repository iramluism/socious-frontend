import type { CatalogDefinition } from "../../shared/CatalogSection";

/** Illustrative datasource catalog; no external connections are opened. */
export const datasourcesCatalog: CatalogDefinition = {
  title: "Datasources",
  description: "Conoce las fuentes que dan contexto a tus recuerdos.",
  action: "Conectar fuente",
  route: "datasources",
  icon: "multiscreen",
  items: [
    {
      id: "notas",
      name: "Notas manuales",
      description: "Ideas y recuerdos capturados en Memo.",
      type: "Fuente local de ejemplo",
      details:
        "Los nuevos recuerdos se asocian a esta fuente durante la sesión. Nada se envía ni guarda fuera del navegador.",
    },
    {
      id: "documentos",
      name: "Documentos",
      description: "Información de referencia y materiales de trabajo.",
      type: "Fuente de ejemplo · Sin conexión",
      details:
        "Contiene únicamente ejemplos precargados. La importación de archivos y las conexiones externas no están disponibles.",
    },
    {
      id: "reuniones",
      name: "Notas de reuniones",
      description: "Acuerdos, prioridades y próximos pasos.",
      type: "Fuente de ejemplo · Sin conexión",
      details:
        "Notas ficticias precargadas para probar búsquedas. No existe acceso al calendario ni a herramientas de reuniones.",
    },
  ],
};
