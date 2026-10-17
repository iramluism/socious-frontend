import type { GmailDataSourceConfig } from "../types";

/**
 * Gmail-specific data source configuration fields.
 */
export function GmailConfigStep({
  config,
  disabled,
  onChange,
}: {
  config: GmailDataSourceConfig;
  disabled?: boolean;
  onChange: (next: GmailDataSourceConfig) => void;
}) {
  const labelText = config.label_ids.join(", ");

  return (
    <div className="form-stack">
      <label>
        Etiquetas Gmail (ids, separadas por coma)
        <input
          value={labelText}
          disabled={disabled}
          onChange={(event) => {
            const ids = event.target.value
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean);
            onChange({
              ...config,
              label_ids: ids.length > 0 ? ids : ["INBOX"],
            });
          }}
        />
      </label>
      <label>
        Consulta Gmail (opcional)
        <input
          value={config.query}
          disabled={disabled}
          placeholder="p. ej. newer_than:30d"
          onChange={(event) =>
            onChange({ ...config, query: event.target.value })
          }
        />
      </label>
      <label>
        Máximo de mensajes por sincronización
        <input
          type="number"
          min={1}
          max={500}
          value={config.max_messages_per_sync}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...config,
              max_messages_per_sync: Number(event.target.value) || 50,
            })
          }
        />
      </label>
      <label>
        Contenido del mensaje
        <select
          value={config.include_body}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...config,
              include_body: event.target.value as GmailDataSourceConfig["include_body"],
            })
          }
        >
          <option value="metadata">Solo metadatos</option>
          <option value="snippet">Fragmento</option>
          <option value="full">Completo</option>
        </select>
      </label>
    </div>
  );
}
