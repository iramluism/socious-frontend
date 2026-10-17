import { memoFetch } from "../../shared/api/client";
import type {
  CreateDataSourceRequest,
  DataSource,
  DriveBrowseResponse,
  SyncAcceptedResponse,
  UpdateDataSourceRequest,
} from "./types";

/** Lists all data sources from ``GET /data-sources``. */
export function listDataSources(): Promise<DataSource[]> {
  return memoFetch<DataSource[]>("/data-sources");
}

/** Fetches one data source from ``GET /data-sources/{id}``. */
export function getDataSource(dataSourceId: string): Promise<DataSource> {
  return memoFetch<DataSource>(
    `/data-sources/${encodeURIComponent(dataSourceId)}`,
  );
}

/** Creates a data source via ``POST /data-sources``. */
export function createDataSource(
  body: CreateDataSourceRequest,
): Promise<DataSource> {
  return memoFetch<DataSource>("/data-sources", { method: "POST", body });
}

/** Updates a data source via ``PATCH /data-sources/{id}``. */
export function updateDataSource(
  dataSourceId: string,
  body: UpdateDataSourceRequest,
): Promise<DataSource> {
  return memoFetch<DataSource>(
    `/data-sources/${encodeURIComponent(dataSourceId)}`,
    { method: "PATCH", body },
  );
}

/** Deletes a data source via ``DELETE /data-sources/{id}``. */
export function deleteDataSource(dataSourceId: string): Promise<void> {
  return memoFetch<void>(
    `/data-sources/${encodeURIComponent(dataSourceId)}`,
    { method: "DELETE" },
  );
}

/** Enqueues sync via ``POST /data-sources/{id}/sync``. */
export function syncDataSource(dataSourceId: string): Promise<SyncAcceptedResponse> {
  return memoFetch<SyncAcceptedResponse>(
    `/data-sources/${encodeURIComponent(dataSourceId)}/sync`,
    { method: "POST" },
  );
}

/** Lists Drive folders for a connection (folder picker). */
export function browseDriveFolders(
  connectionId: string,
  parentId = "root",
  pageToken?: string,
): Promise<DriveBrowseResponse> {
  const params = new URLSearchParams({ parent_id: parentId });
  if (pageToken) {
    params.set("page_token", pageToken);
  }
  return memoFetch<DriveBrowseResponse>(
    `/connections/${encodeURIComponent(connectionId)}/google/drive/browse?${params.toString()}`,
  );
}
