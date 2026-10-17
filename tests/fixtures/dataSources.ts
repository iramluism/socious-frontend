import type { DataSource } from "../../src/features/datasources/types";

export const dataSources: DataSource[] = [
  {
    id: "ds-11111111-1111-1111-1111-111111111111",
    name: "Bandeja principal",
    kind: "google_gmail",
    connection_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    config: {
      label_ids: ["INBOX"],
      query: "",
      max_messages_per_sync: 50,
      include_body: "snippet",
    },
    sync_cursor: {},
    sync_last_update: "2026-10-10T12:00:00.000Z",
    active: true,
    created_at: "2026-10-01T10:00:00.000Z",
    modified_at: "2026-10-10T12:00:00.000Z",
  },
];

export const driveBrowseRoot = {
  parent_id: "root",
  items: [
    {
      id: "folder-projects",
      name: "Proyectos",
      mime_type: "application/vnd.google-apps.folder",
    },
  ],
  next_page_token: null,
};
