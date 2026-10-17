import { memoFetch } from "../../shared/api/client";
import type {
  Classifier,
  CreateClassifierRequest,
  CreateClassifierWithLabelsResult,
  CreateLabelRequest,
  Label,
  UpdateClassifierRequest,
  UpdateLabelRequest,
} from "./types";

/** Lists classifiers from ``GET /classifiers``. */
export function listClassifiers(): Promise<Classifier[]> {
  return memoFetch<Classifier[]>("/classifiers");
}

/** Creates a classifier via ``POST /classifiers``. */
export function createClassifier(
  body: CreateClassifierRequest,
): Promise<Classifier> {
  return memoFetch<Classifier>("/classifiers", { method: "POST", body });
}

/** Updates a classifier via ``PATCH /classifiers/{id}``. */
export function updateClassifier(
  classifierId: number,
  body: UpdateClassifierRequest,
): Promise<Classifier> {
  return memoFetch<Classifier>(`/classifiers/${classifierId}`, {
    method: "PATCH",
    body,
  });
}

/** Deletes a classifier via ``DELETE /classifiers/{id}``. */
export function deleteClassifier(classifierId: number): Promise<void> {
  return memoFetch<void>(`/classifiers/${classifierId}`, { method: "DELETE" });
}

/** Lists labels from ``GET /classifiers/{id}/labels``. */
export function listLabels(classifierId: number): Promise<Label[]> {
  return memoFetch<Label[]>(`/classifiers/${classifierId}/labels`);
}

/** Creates a label via ``POST /classifiers/{id}/labels``. */
export function createLabel(
  classifierId: number,
  body: CreateLabelRequest,
): Promise<Label> {
  return memoFetch<Label>(`/classifiers/${classifierId}/labels`, {
    method: "POST",
    body,
  });
}

/** Updates a label via ``PATCH /labels/{id}``. */
export function updateLabel(
  labelId: number,
  body: UpdateLabelRequest,
): Promise<Label> {
  return memoFetch<Label>(`/labels/${labelId}`, { method: "PATCH", body });
}

/** Deletes a label via ``DELETE /labels/{id}``. */
export function deleteLabel(labelId: number): Promise<void> {
  return memoFetch<void>(`/labels/${labelId}`, { method: "DELETE" });
}

/**
 * Creates a classifier and then each label in sequence.
 *
 * If a label fails after the classifier exists, returns the partial result so
 * the UI can open the detail and finish the remaining labels.
 */
export async function createClassifierWithLabels(
  body: CreateClassifierRequest,
  labelNames: readonly string[],
): Promise<CreateClassifierWithLabelsResult> {
  const classifier = await createClassifier(body);
  const createdLabels: Label[] = [];
  for (const name of labelNames) {
    try {
      createdLabels.push(await createLabel(classifier.id, { name }));
    } catch (error) {
      return { classifier, createdLabels, failedLabel: { name, error } };
    }
  }
  return { classifier, createdLabels };
}
