import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Wizard from "@cloudscape-design/components/wizard";
import type { WizardProps } from "@cloudscape-design/components/wizard";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";
import { listConnections, listKinds } from "../connections/api";
import { KindPickerGrid } from "../connections/KindPickerGrid";
import { KIND_PRESENTATION } from "../connections/kindPresentation";
import type { Connection, ConnectionKind, KindResponse } from "../connections/types";
import { createDataSource, syncDataSource } from "./api";
import { connectionSupportsKind } from "./connectionCompat";
import { defaultConfigForKind } from "./defaultConfig";
import type { DataSourceKind, DriveDataSourceConfig, GmailDataSourceConfig } from "./types";
import { DriveFolderPickerStep } from "./wizard/DriveFolderPickerStep";
import { GmailConfigStep } from "./wizard/GmailConfigStep";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error inesperado";
}

function asGmailConfig(config: Record<string, unknown>): GmailDataSourceConfig {
  return {
    label_ids: Array.isArray(config.label_ids)
      ? (config.label_ids as string[])
      : ["INBOX"],
    query: typeof config.query === "string" ? config.query : "",
    max_messages_per_sync:
      typeof config.max_messages_per_sync === "number"
        ? config.max_messages_per_sync
        : 50,
    include_body:
      config.include_body === "metadata" ||
      config.include_body === "full" ||
      config.include_body === "snippet"
        ? config.include_body
        : "snippet",
  };
}

function asDriveConfig(config: Record<string, unknown>): DriveDataSourceConfig {
  return {
    folder_ids: Array.isArray(config.folder_ids)
      ? (config.folder_ids as string[])
      : [],
    include_subfolders: Boolean(config.include_subfolders),
    max_files_per_sync:
      typeof config.max_files_per_sync === "number"
        ? config.max_files_per_sync
        : 100,
  };
}

function configIsValid(kind: DataSourceKind, config: Record<string, unknown>): boolean {
  if (kind === "google_drive") {
    const folderIds = config.folder_ids;
    return Array.isArray(folderIds) && folderIds.length > 0;
  }
  return true;
}

/**
 * Full-page wizard to create a new data source (kind → identity → connection → config).
 */
export function DataSourceWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKind = searchParams.get("kind") as DataSourceKind | null;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [kinds, setKinds] = useState<KindResponse[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState("");

  const [kind, setKind] = useState<DataSourceKind | null>(initialKind);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [connectionId, setConnectionId] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [syncAfterCreate, setSyncAfterCreate] = useState(true);

  useEffect(() => {
    setLoadingMeta(true);
    setMetaError("");
    Promise.all([listKinds(), listConnections()])
      .then(([kindEntries, connectionEntries]) => {
        setKinds(kindEntries);
        setConnections(connectionEntries);
      })
      .catch((err) => setMetaError(errorMessage(err)))
      .finally(() => setLoadingMeta(false));
  }, []);

  const kindSpec = useMemo(
    () => kinds.find((entry) => entry.kind === kind) ?? null,
    [kinds, kind],
  );

  const compatibleConnections = useMemo(() => {
    if (!kindSpec) {
      return [];
    }
    return connections.filter((item) => connectionSupportsKind(item, kindSpec));
  }, [connections, kindSpec]);

  useEffect(() => {
    if (initialKind) {
      setConfig(defaultConfigForKind(initialKind));
    }
  }, [initialKind]);

  const selectKind = (next: ConnectionKind) => {
    const selected = kind === next ? null : next;
    setKind(selected);
    if (selected) {
      setConfig(defaultConfigForKind(selected));
      setConnectionId("");
    }
  };

  const validateStep = (index: number): string | null => {
    switch (index) {
      case 0:
        if (!kind) {
          return "Selecciona un tipo de fuente.";
        }
        if (!kindSpec?.implemented) {
          return "Este tipo aún no tiene extractor implementado.";
        }
        return null;
      case 1:
        if (!name.trim()) {
          return "Escribe un nombre para la fuente.";
        }
        return null;
      case 2:
        if (!connectionId) {
          return "Selecciona una conexión activa compatible.";
        }
        return null;
      case 3:
        if (!kind) {
          return "Tipo de fuente no definido.";
        }
        if (!configIsValid(kind, config)) {
          return "Completa la configuración requerida para este tipo.";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNavigate = ({ detail }: { detail: WizardProps.NavigateDetail }) => {
    if (detail.requestedStepIndex > activeStepIndex) {
      const error = validateStep(activeStepIndex);
      if (error) {
        setSubmitError(error);
        return;
      }
    }
    setSubmitError("");
    setActiveStepIndex(detail.requestedStepIndex);
  };

  const handleSubmit = async () => {
    for (let step = 0; step <= 3; step += 1) {
      const error = validateStep(step);
      if (error) {
        setSubmitError(error);
        setActiveStepIndex(step);
        return;
      }
    }
    if (!kind) {
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await createDataSource({
        name: name.trim(),
        kind,
        connection_id: connectionId,
        config,
        active,
      });
      if (syncAfterCreate && created.active) {
        try {
          await syncDataSource(created.id);
        } catch {
          // Creation succeeded; sync can be retried from detail.
        }
      }
      navigate(`/datasources/${created.id}`, { replace: true });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reviewKindLabel = kind ? KIND_PRESENTATION[kind].title : "—";
  const selectedConnection = connections.find((item) => item.id === connectionId);

  const steps: WizardProps.Step[] = [
    {
      title: "Tipo de fuente",
      description: "Elige qué datos extraerá Memo.",
      content: (
        <SpaceBetween size="m">
          {loadingMeta ? (
            <StatusIndicator type="loading">Cargando catálogo…</StatusIndicator>
          ) : (
            <KindPickerGrid
              kinds={kinds}
              selected={kind ? [kind] : []}
              disabled={submitting}
              isKindDisabled={(entry) => !entry.implemented}
              onToggle={selectKind}
            />
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Identidad",
      description: "Nombre visible y si la fuente está activa.",
      content: (
        <div className="form-stack">
          <label>
            Nombre <span className="required">*</span>
            <input
              value={name}
              disabled={submitting}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <Checkbox
            checked={active}
            disabled={submitting}
            onChange={({ detail }) => setActive(detail.checked)}
          >
            Fuente activa (permite sincronizar)
          </Checkbox>
        </div>
      ),
    },
    {
      title: "Conexión",
      description: "Cuenta con credenciales y scopes para este tipo.",
      content: (
        <SpaceBetween size="m">
          {compatibleConnections.length === 0 ? (
            <Alert type="warning" header="No hay conexiones compatibles">
              Crea una conexión activa con los scopes necesarios.{" "}
              <Link to="/conexiones">Ir a Conexiones</Link>
            </Alert>
          ) : (
            <fieldset className="connections-kind-fieldset">
              <legend className="connections-kind-legend">Conexiones disponibles</legend>
              <ul className="drive-browse-list">
                {compatibleConnections.map((item) => (
                  <li key={item.id} className="drive-browse-row">
                    <label className="ds-connection-option">
                      <input
                        type="radio"
                        name="connection"
                        checked={connectionId === item.id}
                        disabled={submitting}
                        onChange={() => setConnectionId(item.id)}
                      />
                      <span>
                        <strong>{item.display_name}</strong>
                        <br />
                        <span className="muted">
                          {item.external_account_id ?? item.id}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Configuración",
      description: "Parámetros según el tipo de fuente.",
      content: !kind ? (
        <p className="demo-explainer">Selecciona un tipo en el primer paso.</p>
      ) : kind === "google_gmail" ? (
        <GmailConfigStep
          config={asGmailConfig(config)}
          disabled={submitting}
          onChange={(next) => setConfig({ ...next })}
        />
      ) : kind === "google_drive" ? (
        connectionId ? (
          <DriveFolderPickerStep
            connectionId={connectionId}
            config={asDriveConfig(config)}
            disabled={submitting}
            onChange={(next) => setConfig({ ...next })}
          />
        ) : (
          <Alert type="info">Selecciona una conexión en el paso anterior.</Alert>
        )
      ) : (
        <Alert type="warning">
          No hay editor visual para <code>{kind}</code>. Usa la API directamente.
        </Alert>
      ),
    },
    {
      title: "Revisar y crear",
      description: "Comprueba los datos antes de guardar.",
      content: (
        <SpaceBetween size="m">
          <dl className="connections-detail-meta">
            <div>
              <dt>Tipo</dt>
              <dd>{reviewKindLabel} (<code>{kind}</code>)</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{name.trim() || "—"}</dd>
            </div>
            <div>
              <dt>Activa</dt>
              <dd>{active ? "Sí" : "No"}</dd>
            </div>
            <div>
              <dt>Conexión</dt>
              <dd>{selectedConnection?.display_name ?? connectionId}</dd>
            </div>
          </dl>
          <Box variant="code">
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </Box>
          <Checkbox
            checked={syncAfterCreate}
            disabled={submitting || !active}
            onChange={({ detail }) => setSyncAfterCreate(detail.checked)}
          >
            Sincronizar inmediatamente después de crear
          </Checkbox>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <>
      <Link className="back-link" to="/datasources">
        ← Volver a Fuentes de datos
      </Link>
      <PageHeading
        title="Nueva fuente de datos"
        description="Asistente para vincular una conexión y definir qué extraer."
      />
      {metaError ? <Alert type="error">{metaError}</Alert> : null}
      {submitError ? <Alert type="error">{submitError}</Alert> : null}
      <Wizard
        activeStepIndex={activeStepIndex}
        onNavigate={handleNavigate}
        onSubmit={() => void handleSubmit()}
        steps={steps}
        i18nStrings={{
          stepNumberLabel: (stepNumber) => `Paso ${stepNumber}`,
          collapsedStepsLabel: (stepNumber, stepsCount) =>
            `Paso ${stepNumber} de ${stepsCount}`,
          skipToButtonLabel: (step) => `Ir al paso ${step.title}`,
          navigationAriaLabel: "Pasos del asistente",
          cancelButton: "Cancelar",
          previousButton: "Anterior",
          nextButton: "Siguiente",
          submitButton: "Crear fuente",
          optional: "opcional",
        }}
        isLoadingNextStep={submitting}
        onCancel={() => navigate("/datasources")}
      />
    </>
  );
}
