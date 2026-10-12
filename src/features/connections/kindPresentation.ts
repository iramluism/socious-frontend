import type { ConnectionKind } from "./types";

/** Spanish labels and helper copy for kind tiles in the create-connection modal. */
export const KIND_PRESENTATION: Record<
  ConnectionKind,
  { title: string; description: string }
> = {
  google_gmail: {
    title: "Gmail",
    description: "Correo y hilos de conversación (solo lectura).",
  },
  google_drive: {
    title: "Google Drive",
    description: "Archivos y carpetas autorizadas.",
  },
  google_meet: {
    title: "Google Meet",
    description: "Reuniones y grabaciones (extractor en desarrollo).",
  },
  google_play: {
    title: "Google Play",
    description: "Reservado para futuras integraciones.",
  },
  fts: {
    title: "Búsqueda local",
    description: "Índice FTS con clave API (otra familia).",
  },
};
