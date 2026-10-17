import type { ConnectionKind } from "../connections/types";

/** Data-source kind (same values as ConnectionKind / backend DataSourceKind). */
export type DataSourceKind = ConnectionKind;

/** Configured data source from ``GET /data-sources``. */
export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  connection_id: string;
  config: Record<string, unknown>;
  sync_cursor: Record<string, unknown>;
  sync_last_update: string | null;
  active: boolean;
  created_at: string;
  modified_at: string;
}

/** Body for ``POST /data-sources``. */
export interface CreateDataSourceRequest {
  name: string;
  kind: DataSourceKind;
  connection_id: string;
  config: Record<string, unknown>;
  active?: boolean;
}

/** Body for ``PATCH /data-sources/{id}``. */
export interface UpdateDataSourceRequest {
  name?: string;
  config?: Record<string, unknown>;
  active?: boolean;
}

/** Response from ``POST /data-sources/{id}/sync``. */
export interface SyncAcceptedResponse {
  task_id: string;
}

/** One folder in Drive browse results. */
export interface DriveFolderItem {
  id: string;
  name: string;
  mime_type: string;
}

/** Paginated Drive folder listing for picker UIs. */
export interface DriveBrowseResponse {
  parent_id: string;
  items: DriveFolderItem[];
  next_page_token: string | null;
}

/** Gmail data source config (mirrors backend GmailDataSourceConfig). */
export interface GmailDataSourceConfig {
  label_ids: string[];
  query: string;
  max_messages_per_sync: number;
  include_body: "metadata" | "snippet" | "full";
}

/** Drive data source config (mirrors backend DriveDataSourceConfig). */
export interface DriveDataSourceConfig {
  folder_ids: string[];
  include_subfolders?: boolean;
  mime_types?: string[];
  max_files_per_sync?: number;
}
