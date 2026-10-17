import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import type { TableProps } from "@cloudscape-design/components/table";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";
import {
  createClassifierWithLabels,
  createLabel,
  deleteClassifier,
  deleteLabel,
  listClassifiers,
  listLabels,
  updateClassifier,
  updateLabel,
} from "./api";
import { filterClassifiers } from "./filter";
import { LabelNameEditor } from "./LabelNameEditor";
import {
  MAX_CLASSIFIER_DESCRIPTION_LENGTH,
  MAX_REGISTRY_NAME_LENGTH,
  MIN_CREATE_LABELS,
  normalizeLabelName,
  validateCreateLabels,
} from "./labels";
import type { Classifier, Label } from "./types";

const PAGE_SIZE = 8;

type QualifierDetailLocationState = {
  labelWarning?: string;
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return error.message || "Ya existe un nombre igual.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error inesperado";
}

function CreateQualifierModal({
  visible,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onDismiss: () => void;
  onCreated: (classifier: Classifier, labelWarning?: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labelNames, setLabelNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName("");
    setDescription("");
    setLabelNames([]);
    setError("");
  }, [visible]);

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Escribe un nombre para el calificador.");
      return;
    }
    if (trimmedName.length > MAX_REGISTRY_NAME_LENGTH) {
      setError(
        `El nombre puede tener como máximo ${MAX_REGISTRY_NAME_LENGTH} caracteres.`,
      );
      return;
    }
    if (description.length > MAX_CLASSIFIER_DESCRIPTION_LENGTH) {
      setError(
        `La descripción puede tener como máximo ${MAX_CLASSIFIER_DESCRIPTION_LENGTH} caracteres.`,
      );
      return;
    }
    const labelsError = validateCreateLabels(labelNames);
    if (labelsError) {
      setError(labelsError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await createClassifierWithLabels(
        {
          name: trimmedName,
          description: description.trim() || null,
        },
        labelNames.map(normalizeLabelName),
      );
      const warning = result.failedLabel
        ? `El calificador se creó, pero falló el label «${result.failedLabel.name}»: ${errorMessage(result.failedLabel.error)}. Completa los labels desde el detalle.`
        : undefined;
      onCreated(result.classifier, warning);
      onDismiss();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={() => {
        if (!submitting) {
          onDismiss();
        }
      }}
      header="Nuevo calificador"
      closeAriaLabel="Cerrar nuevo calificador"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={() => void submit()}
            >
              Crear calificador
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error ? <Alert type="error">{error}</Alert> : null}
        <p className="demo-explainer">
          Los labels que añadas aquí son las opciones del modelo. La calificación
          se aplica a documentos y capturas nuevos; no se recalifican recuerdos
          ya indexados.
        </p>
        <div className="form-stack">
          <label>
            Nombre <span className="required">*</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-required="true"
              disabled={submitting}
              maxLength={MAX_REGISTRY_NAME_LENGTH}
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
              maxLength={MAX_CLASSIFIER_DESCRIPTION_LENGTH}
              rows={3}
            />
          </label>
          <LabelNameEditor
            names={labelNames}
            onChange={setLabelNames}
            disabled={submitting}
          />
        </div>
      </SpaceBetween>
    </Modal>
  );
}

/**
 * Detail view: classifier metadata and label management.
 */
export function QualifierDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as QualifierDetailLocationState | null;
  const [item, setItem] = useState<Classifier | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [labelWarning, setLabelWarning] = useState(
    locationState?.labelWarning ?? "",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const classifierId = id ? Number(id) : Number.NaN;

  const load = useCallback(async () => {
    if (!Number.isInteger(classifierId) || classifierId <= 0) {
      setLoadError("Identificador de calificador no válido.");
      setItem(null);
      setLabels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [classifiers, classifierLabels] = await Promise.all([
        listClassifiers(),
        listLabels(classifierId),
      ]);
      const found = classifiers.find((entry) => entry.id === classifierId);
      if (!found) {
        setItem(null);
        setLabels([]);
        setLoadError("Este enlace no corresponde a un calificador registrado.");
        return;
      }
      setItem(found);
      setLabels(classifierLabels);
    } catch (err) {
      setItem(null);
      setLabels([]);
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classifierId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (locationState?.labelWarning) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, locationState?.labelWarning, navigate]);

  const handleToggleClassifier = async () => {
    if (!item) {
      return;
    }
    setBusy("toggle-classifier");
    setActionError("");
    try {
      setItem(await updateClassifier(item.id, { active: !item.active }));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleAddLabel = async (name: string) => {
    if (!item) {
      return;
    }
    setBusy("add-label");
    setActionError("");
    try {
      const created = await createLabel(item.id, { name });
      setLabels((current) => [...current, created]);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleToggleLabel = async (label: Label) => {
    setBusy(`toggle-label-${label.id}`);
    setActionError("");
    try {
      const updated = await updateLabel(label.id, { active: !label.active });
      setLabels((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteLabel = async (label: Label) => {
    setBusy(`delete-label-${label.id}`);
    setActionError("");
    try {
      await deleteLabel(label.id);
      setLabels((current) => current.filter((entry) => entry.id !== label.id));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteClassifier = async () => {
    if (!item) {
      return;
    }
    setBusy("delete-classifier");
    setActionError("");
    try {
      await deleteClassifier(item.id);
      navigate("/calificadores", { replace: true });
    } catch (err) {
      setActionError(errorMessage(err));
      setDeleteOpen(false);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <>
        <Link className="back-link" to="/calificadores">
          ← Volver a Calificadores
        </Link>
        <StatusIndicator type="loading">Cargando calificador…</StatusIndicator>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <PageHeading
          title="Calificador no encontrado"
          description={
            loadError || "El enlace no corresponde a un calificador registrado."
          }
        />
        <Link to="/calificadores">Volver al listado</Link>
      </>
    );
  }

  const activeLabels = labels.filter((label) => label.active);
  const usedLabels = labels.some((label) => label.used);

  return (
    <>
      <Link className="back-link" to="/calificadores">
        ← Volver a Calificadores
      </Link>
      <PageHeading
        title={item.name}
        description={
          item.description ||
          "Criterio zero-shot para calificar documentos y capturas nuevos."
        }
        action={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              loading={busy === "toggle-classifier"}
              onClick={() => void handleToggleClassifier()}
            >
              {item.active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              disabled={usedLabels}
              onClick={() => setDeleteOpen(true)}
            >
              Eliminar
            </Button>
          </SpaceBetween>
        }
      />
      {labelWarning ? (
        <Alert
          type="warning"
          dismissible
          onDismiss={() => setLabelWarning("")}
          header="Calificador creado con labels incompletos"
        >
          {labelWarning}
        </Alert>
      ) : null}
      {actionError ? (
        <Alert type="error" header="No se pudo completar la acción">
          {actionError}
        </Alert>
      ) : null}
      <article className="panel detail-content">
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="xs">
            <StatusIndicator type={item.active ? "success" : "stopped"}>
              {item.active ? "Activo" : "Inactivo"}
            </StatusIndicator>
            <Badge>{activeLabels.length} labels activos</Badge>
          </SpaceBetween>
          <dl className="connections-detail-meta">
            <div>
              <dt>ID</dt>
              <dd>
                <code>{item.id}</code>
              </dd>
            </div>
            <div>
              <dt>Descripción</dt>
              <dd>{item.description || "—"}</dd>
            </div>
          </dl>
          {activeLabels.length < MIN_CREATE_LABELS ? (
            <Alert type="info">
              Añade al menos {MIN_CREATE_LABELS} labels activos para que el
              modelo pueda calificar.
            </Alert>
          ) : (
            <p className="demo-explainer">
              La calificación se aplica automáticamente a documentos y capturas
              nuevos. No se recalifican recuerdos ya indexados.
            </p>
          )}
          <div>
            <h3 className="connections-section-title">Labels</h3>
            {labels.length === 0 ? (
              <p className="demo-explainer">Este calificador aún no tiene labels.</p>
            ) : (
              <ul className="qualifier-label-list">
                {labels.map((label) => (
                  <li key={label.id} className="qualifier-label-row">
                    <div>
                      <strong>{label.name}</strong>
                      <SpaceBetween direction="horizontal" size="xs">
                        <StatusIndicator
                          type={label.active ? "success" : "stopped"}
                        >
                          {label.active ? "Activo" : "Inactivo"}
                        </StatusIndicator>
                        {label.used ? <Badge color="blue">En uso</Badge> : null}
                      </SpaceBetween>
                    </div>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        loading={busy === `toggle-label-${label.id}`}
                        onClick={() => void handleToggleLabel(label)}
                      >
                        {label.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        disabled={label.used}
                        loading={busy === `delete-label-${label.id}`}
                        onClick={() => void handleDeleteLabel(label)}
                      >
                        Eliminar
                      </Button>
                    </SpaceBetween>
                  </li>
                ))}
              </ul>
            )}
            <LabelNameEditor
              names={labels.map((label) => label.name)}
              showChips={false}
              onChange={(next) => {
                const added = next[next.length - 1];
                if (added) {
                  void handleAddLabel(added);
                }
              }}
              disabled={busy !== null}
              addLabel="Añadir label"
            />
          </div>
        </SpaceBetween>
      </article>
      <Modal
        visible={deleteOpen}
        onDismiss={() => setDeleteOpen(false)}
        header="Eliminar calificador"
        closeAriaLabel="Cerrar confirmación de eliminación"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={busy === "delete-classifier"}
                onClick={() => void handleDeleteClassifier()}
              >
                Eliminar
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <p>
          ¿Eliminar <strong>{item.name}</strong>? Solo es posible si ningún label
          está en uso.
        </p>
      </Modal>
    </>
  );
}

const columnDefinitions: TableProps.ColumnDefinition<Classifier>[] = [
  {
    id: "name",
    header: "Nombre",
    cell: (item) => (
      <Link to={`/calificadores/${item.id}`} className="connections-name-link">
        {item.name}
      </Link>
    ),
    isRowHeader: true,
  },
  {
    id: "description",
    header: "Descripción",
    cell: (item) => item.description || "—",
  },
  {
    id: "active",
    header: "Estado",
    cell: (item) => (
      <StatusIndicator type={item.active ? "success" : "stopped"}>
        {item.active ? "Activo" : "Inactivo"}
      </StatusIndicator>
    ),
  },
];

/**
 * Lists Memo classifiers from the API and opens the create form.
 */
export function QualifiersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Classifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [filteringText, setFilteringText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      setItems(await listClassifiers());
    } catch (err) {
      setItems([]);
      setListError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filtered = useMemo(
    () => filterClassifiers(items, filteringText),
    [items, filteringText],
  );

  const pagesCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPageIndex, pagesCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [filteringText]);

  return (
    <>
      <PageHeading
        title="Calificadores"
        description="Criterios y labels para que Memo califique documentos y capturas nuevos."
      />
      {listError ? (
        <Alert type="error" header="No se pudo cargar el listado">
          {listError}
        </Alert>
      ) : null}
      <Table
        trackBy="id"
        columnDefinitions={columnDefinitions}
        items={pageItems}
        loading={loading}
        loadingText="Cargando calificadores"
        empty={
          filteringText
            ? "Ningún calificador coincide con el filtro."
            : "Aún no hay calificadores. Crea el primero con «Nuevo calificador»."
        }
        header={
          <Header
            counter={`(${filtered.length})`}
            description="Datos en vivo desde GET /classifiers. La calificación corre en la siguiente ingesta."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button iconName="refresh" onClick={() => void loadList()}>
                  Actualizar
                </Button>
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Nuevo calificador
                </Button>
              </SpaceBetween>
            }
          >
            Inventario
          </Header>
        }
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Buscar por nombre o descripción"
            filteringAriaLabel="Filtrar calificadores"
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={safePage}
            pagesCount={pagesCount}
            onChange={({ detail }) =>
              setCurrentPageIndex(detail.currentPageIndex)
            }
          />
        }
      />
      <CreateQualifierModal
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        onCreated={(classifier, labelWarning) => {
          navigate(`/calificadores/${classifier.id}`, {
            state: { labelWarning } satisfies QualifierDetailLocationState,
          });
        }}
      />
    </>
  );
}
