import { afterEach, describe, expect, it, vi } from "vitest";
import {
  browseDriveFolders,
  createDataSource,
  listDataSources,
  listDriveDrives,
  syncDataSource,
} from "../src/features/datasources/api";
import {
  dataSources,
  driveBrowseRoot,
  driveSharedDrives,
} from "./fixtures/dataSources";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("datasources api", () => {
  it("lists data sources from GET /data-sources", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(dataSources), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(listDataSources()).resolves.toEqual(dataSources);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/memo/data-sources",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("creates a data source via POST /data-sources", async () => {
    const body = {
      name: "Nueva",
      kind: "google_gmail" as const,
      connection_id: dataSources[0].connection_id,
      config: dataSources[0].config,
    };
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...dataSources[0], name: "Nueva" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(createDataSource(body)).resolves.toMatchObject({ name: "Nueva" });
  });

  it("browses drive folders under a connection", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(driveBrowseRoot), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      browseDriveFolders("b2c3d4e5-f6a7-8901-bcde-f12345678901", "root"),
    ).resolves.toEqual(driveBrowseRoot);
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("/google/drive/browse");
    expect(calledUrl).toContain("parent_id=root");
  });

  it("browses a shared drive when drive_id is set", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(driveBrowseRoot), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await browseDriveFolders(
      "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "shared-team",
      undefined,
      "shared-team",
    );
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("parent_id=shared-team");
    expect(calledUrl).toContain("drive_id=shared-team");
  });

  it("lists shared drives under a connection", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(driveSharedDrives), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      listDriveDrives("b2c3d4e5-f6a7-8901-bcde-f12345678901"),
    ).resolves.toEqual(driveSharedDrives);
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("/google/drive/drives");
  });

  it("sync returns task id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ task_id: "task-abc" }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(syncDataSource(dataSources[0].id)).resolves.toEqual({
      task_id: "task-abc",
    });
  });
});
