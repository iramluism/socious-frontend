import Badge from "@cloudscape-design/components/badge";
import { KindIcon } from "./KindIcons";
import { KIND_PRESENTATION } from "./kindPresentation";
import type { ConnectionKind, KindResponse } from "./types";

/**
 * Selectable grid of OAuth kinds with product icons and short descriptions.
 */
export function KindPickerGrid({
  kinds,
  selected,
  disabled,
  isKindDisabled,
  onToggle,
}: {
  kinds: KindResponse[];
  selected: ConnectionKind[];
  disabled?: boolean;
  /** When true, the kind tile cannot be selected (e.g. extractor not implemented). */
  isKindDisabled?: (entry: KindResponse) => boolean;
  onToggle: (kind: ConnectionKind) => void;
}) {
  return (
    <div className="connections-kind-grid" role="group" aria-label="Kinds de Google">
      {kinds.map((entry) => {
        const isSelected = selected.includes(entry.kind);
        const tileDisabled = disabled || (isKindDisabled?.(entry) ?? false);
        const meta = KIND_PRESENTATION[entry.kind];
        return (
          <button
            key={entry.kind}
            type="button"
            className={`connections-kind-tile${isSelected ? " is-selected" : ""}${
              tileDisabled ? " is-disabled" : ""
            }`}
            aria-pressed={isSelected}
            disabled={tileDisabled}
            onClick={() => onToggle(entry.kind)}
          >
            <span className="connections-kind-tile-icon">
              <KindIcon kind={entry.kind} />
            </span>
            <span className="connections-kind-tile-body">
              <span className="connections-kind-tile-title">{meta.title}</span>
              <span className="connections-kind-tile-desc">{meta.description}</span>
              <span className="connections-kind-tile-meta">
                <code>{entry.kind}</code>
                {!entry.implemented ? (
                  <Badge color="grey">Sin extractor</Badge>
                ) : (
                  <Badge color="green">Disponible</Badge>
                )}
              </span>
            </span>
            <span className="connections-kind-tile-check" aria-hidden="true">
              {isSelected ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
