import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/shared/api/client";
import {
  createClassifier,
  createClassifierWithLabels,
  createLabel,
  deleteClassifier,
  deleteLabel,
  listClassifiers,
  listLabels,
  updateClassifier,
  updateLabel,
} from "../src/features/qualifiers/api";
import { filterClassifiers } from "../src/features/qualifiers/filter";
import { validateCreateLabels } from "../src/features/qualifiers/labels";
import { ambitoLabels, classifiers } from "./fixtures/classifiers";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("qualifiers api", () => {
  it("lists classifiers from GET /classifiers", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(classifiers), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const items = await listClassifiers();
    expect(items).toHaveLength(classifiers.length);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/memo/classifiers",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("creates a classifier via POST /classifiers", async () => {
    const created = classifiers[0];
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(created), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await createClassifier({
      name: "Ámbito",
      description: "Contexto personal o laboral",
    });
    expect(result.id).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/memo/classifiers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Ámbito",
          description: "Contexto personal o laboral",
        }),
      }),
    );
  });

  it("creates labels and updates or deletes registry entities", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ambitoLabels), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ambitoLabels[0]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...ambitoLabels[0], active: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...classifiers[0], active: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(listLabels(1)).resolves.toHaveLength(2);
    await expect(createLabel(1, { name: "Personal" })).resolves.toMatchObject({
      id: 11,
    });
    await expect(updateLabel(11, { active: false })).resolves.toMatchObject({
      active: false,
    });
    await expect(updateClassifier(1, { active: false })).resolves.toMatchObject({
      active: false,
    });
    await expect(deleteLabel(11)).resolves.toBeUndefined();
    await expect(deleteClassifier(2)).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/memo/classifiers/1/labels",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/memo/classifiers/1/labels",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Personal" }),
      }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/v1/memo/labels/11",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      5,
      "/api/v1/memo/labels/11",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("creates a classifier and then each label in sequence", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(classifiers[0]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ambitoLabels[0]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ambitoLabels[1]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await createClassifierWithLabels(
      { name: "Ámbito" },
      ["Personal", "Laboral"],
    );
    expect(result.classifier.id).toBe(1);
    expect(result.createdLabels).toHaveLength(2);
    expect(result.failedLabel).toBeUndefined();
  });

  it("returns a partial result when a label fails after the classifier exists", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(classifiers[0]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ambitoLabels[0]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: "conflict", message: "Nombre duplicado" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await createClassifierWithLabels(
      { name: "Ámbito" },
      ["Personal", "Laboral"],
    );
    expect(result.createdLabels).toHaveLength(1);
    expect(result.failedLabel?.name).toBe("Laboral");
    expect(result.failedLabel?.error).toBeInstanceOf(ApiError);
  });
});

describe("qualifier labels validation", () => {
  it("requires at least two unique names", () => {
    expect(validateCreateLabels(["Personal"])).toMatch(/al menos 2/);
    expect(validateCreateLabels(["Personal", "personal"])).toMatch(/repetirse/);
    expect(validateCreateLabels(["Personal", "Laboral"])).toBeNull();
  });
});

describe("classifiers filter", () => {
  it("matches name, description and active state", () => {
    expect(filterClassifiers(classifiers, "")).toHaveLength(2);
    expect(filterClassifiers(classifiers, "ambito")[0]?.id).toBe(1);
    expect(filterClassifiers(classifiers, "inactivo")[0]?.id).toBe(2);
  });
});
