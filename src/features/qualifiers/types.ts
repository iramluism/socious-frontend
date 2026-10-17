/** Classifier registered in Memo (mirrors socius ``ClassifierResponse``). */
export interface Classifier {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

/** Label under a classifier (mirrors socius ``LabelResponse``). */
export interface Label {
  id: number;
  classifier_id: number;
  name: string;
  active: boolean;
  used: boolean;
}

/** Body for ``POST /classifiers``. */
export interface CreateClassifierRequest {
  name: string;
  description?: string | null;
}

/** Body for ``PATCH /classifiers/{id}``. */
export interface UpdateClassifierRequest {
  name?: string;
  description?: string | null;
  active?: boolean;
}

/** Body for ``POST /classifiers/{id}/labels``. */
export interface CreateLabelRequest {
  name: string;
}

/** Body for ``PATCH /labels/{id}``. */
export interface UpdateLabelRequest {
  name?: string;
  active?: boolean;
}

/** Result of creating a classifier and then its labels in sequence. */
export interface CreateClassifierWithLabelsResult {
  classifier: Classifier;
  createdLabels: Label[];
  failedLabel?: { name: string; error: unknown };
}
