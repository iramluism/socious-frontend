import { useState } from "react";
import Button from "@cloudscape-design/components/button";
import {
  labelNamesMatch,
  MAX_REGISTRY_NAME_LENGTH,
  normalizeLabelName,
} from "./labels";

/**
 * Draft list of free-text labels for the classifier create/detail forms.
 */
export function LabelNameEditor({
  names,
  onChange,
  disabled,
  addLabel = "Añadir label",
  showChips = true,
}: {
  names: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
  addLabel?: string;
  showChips?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");

  const addDraft = () => {
    const name = normalizeLabelName(draft);
    if (!name) {
      setLocalError("Escribe el nombre del label.");
      return;
    }
    if (name.length > MAX_REGISTRY_NAME_LENGTH) {
      setLocalError(
        `El label puede tener como máximo ${MAX_REGISTRY_NAME_LENGTH} caracteres.`,
      );
      return;
    }
    if (names.some((existing) => labelNamesMatch(existing, name))) {
      setLocalError("Ese label ya está en la lista.");
      return;
    }
    onChange([...names, name]);
    setDraft("");
    setLocalError("");
  };

  return (
    <div className="qualifier-label-editor">
      <span className="qualifier-label-legend">
        Labels <span className="required">*</span>
      </span>
      <p className="qualifier-label-hint muted">
        Añade los nombres que quieras. El modelo elige uno de ellos al calificar
        documentos y capturas nuevos.
      </p>
      {showChips ? (
        names.length > 0 ? (
          <ul className="qualifier-label-chips">
            {names.map((name) => (
              <li key={name.toLocaleLowerCase("es")}>
                <span>{name}</span>
                <button
                  type="button"
                  className="qualifier-label-remove"
                  aria-label={`Quitar label ${name}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      names.filter((entry) => !labelNamesMatch(entry, name)),
                    )
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="qualifier-label-empty">Todavía no hay labels.</p>
        )
      ) : null}
      <div className="qualifier-label-add">
        <label>
          Nuevo label
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setLocalError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addDraft();
              }
            }}
            disabled={disabled}
            maxLength={MAX_REGISTRY_NAME_LENGTH}
          />
        </label>
        <Button onClick={addDraft} disabled={disabled}>
          {addLabel}
        </Button>
      </div>
      {localError ? <p className="form-error">{localError}</p> : null}
    </div>
  );
}
