import type { CatalogDefinition } from "../../shared/CatalogSection";

/** Illustrative qualifier catalog; no evaluation is executed in the demo. */
export const qualifiersCatalog: CatalogDefinition = {
  title: "Calificadores",
  description: "Criterios para comprender y evaluar tus recuerdos.",
  action: "Nuevo calificador",
  route: "calificadores",
  icon: "check",
  items: [
    {
      id: "relevancia",
      name: "Relevancia",
      description: "Relación con el contexto de una consulta.",
      type: "Criterio de ejemplo",
      details:
        "Valora si un recuerdo aporta información útil para la consulta. Este criterio es ilustrativo; la demo no calcula evaluaciones.",
    },
    {
      id: "procedencia",
      name: "Procedencia",
      description: "Identificar de dónde viene la información.",
      type: "Criterio de ejemplo",
      details:
        "Comprueba si existe una fuente identificable. Ayuda a distinguir notas personales de documentos o reuniones.",
    },
    {
      id: "vigencia",
      name: "Vigencia",
      description: "Mantener presente la fecha del contexto.",
      type: "Criterio de ejemplo",
      details:
        "Permite considerar si la información sigue vigente antes de utilizarla. No se aplica automáticamente en esta demo.",
    },
  ],
};
