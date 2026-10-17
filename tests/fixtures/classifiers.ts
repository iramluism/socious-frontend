import type { Classifier, Label } from "../../src/features/qualifiers/types";

export const classifiers: Classifier[] = [
  {
    id: 1,
    name: "Ámbito",
    description: "Contexto personal o laboral",
    active: true,
  },
  {
    id: 2,
    name: "Urgencia",
    description: null,
    active: false,
  },
];

export const ambitoLabels: Label[] = [
  {
    id: 11,
    classifier_id: 1,
    name: "Personal",
    active: true,
    used: false,
  },
  {
    id: 12,
    classifier_id: 1,
    name: "Laboral",
    active: true,
    used: true,
  },
];
