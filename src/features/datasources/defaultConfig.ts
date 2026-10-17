import type { DataSourceKind } from "./types";
import type { DriveDataSourceConfig, GmailDataSourceConfig } from "./types";

/** Default config object for a kind when entering the configuration step. */
export function defaultConfigForKind(
  kind: DataSourceKind,
): Record<string, unknown> {
  switch (kind) {
    case "google_gmail":
      return {
        label_ids: ["INBOX"],
        query: "",
        max_messages_per_sync: 50,
        include_body: "snippet",
      } satisfies GmailDataSourceConfig as Record<string, unknown>;
    case "google_drive":
      return {
        folder_ids: [],
        include_subfolders: false,
        max_files_per_sync: 100,
      } satisfies Partial<DriveDataSourceConfig> as Record<string, unknown>;
    default:
      return {};
  }
}
