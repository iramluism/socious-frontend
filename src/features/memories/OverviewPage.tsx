import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";
import { createCapture } from "../captures/api";
import { uploadDocument } from "../documents/api";

const ACCEPTED_EXTENSIONS = ".txt,.md,.pdf,.docx";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail ? `${error.message}: ${error.detail}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "No se pudo guardar el recuerdo.";
}

/** Calendar date ``YYYY-MM-DD`` in the local timezone for capture reference. */
function todayReferenceAt(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Builds capture body with optional ``adjunts:`` file-name line. */
export function buildCaptureBody(text: string, files: File[]): string {
  const trimmed = text.trim();
  if (files.length === 0) return trimmed;
  const names = files.map((file) => file.name).join(", ");
  const attachments = `adjunts: ${names}`;
  return trimmed ? `${trimmed}\n\n${attachments}` : attachments;
}

/** Introduces Memo with inline capture and workspace shortcuts. */
export function OverviewPage() {
  const [capture, setCapture] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    const body = buildCaptureBody(capture, files);
    if (!body) {
      setError("Escribe algo que quieras recordar o adjunta un archivo.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createCapture({ body, reference_at: todayReferenceAt() });
      if (files.length > 0) {
        await Promise.all(files.map((file) => uploadDocument(file)));
      }
      setCapture("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Recuerdo guardado.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onFilesChosen = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    setError("");
    setSuccess("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <PageHeading
        title="Tu memoria, organizada"
        description="Guarda lo importante y retoma el contexto cuando lo necesites."
      />
      <form
        className="panel quick-capture"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          disabled={saving}
          onChange={(e) => {
            onFilesChosen(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="quick-capture-field grow">
          <label>
            <span className="sr-only">¿Qué quieres recordar?</span>
            <textarea
              rows={2}
              value={capture}
              onChange={(e) => setCapture(e.target.value)}
              placeholder="¿Qué quieres recordar?"
              disabled={saving}
            />
          </label>
          {files.length > 0 && (
            <ul className="quick-capture-files">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`}>
                  <Icon name="file" />
                  <span>{file.name}</span>
                  <Button
                    formAction="none"
                    variant="icon"
                    iconName="close"
                    ariaLabel={`Quitar ${file.name}`}
                    disabled={saving}
                    onClick={() => removeFile(index)}
                  />
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="quick-capture-attach"
            aria-label="Adjuntar archivos"
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon
              ariaLabel="Adjuntar"
              svg={
                <svg
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 8.5v-4a2.5 2.5 0 0 1 5 0v5.5a4 4 0 0 1-8 0V5.75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </button>
        </div>
        <Button formAction="submit" variant="primary" loading={saving}>
          Guardar recuerdo
        </Button>
      </form>
      {error && (
        <div className="overview-feedback">
          <Alert type="error" header="No se pudo guardar">
            {error}
          </Alert>
        </div>
      )}
      {success && (
        <div className="overview-feedback">
          <Alert type="success" header="Listo">
            {success}
          </Alert>
        </div>
      )}
      <div className="overview-columns">
        <section>
          <Link className="query-banner" to="/query">
            <span className="memory-icon">
              <Icon name="search" />
            </span>
            <span>
              <strong>Encuentra el hilo de tus ideas</strong>
              <small>Consulta tus recuerdos y filtra por labels.</small>
            </span>
            <Icon name="arrow-right" />
          </Link>
        </section>
        <aside className="overview-aside">
          <section className="panel resources">
            <h2>Tu espacio de trabajo</h2>
            {[
              ["calificadores", "Calificadores", "Criterios de evaluación"],
              ["modelos", "Modelos", "Catálogo de Hugging Face"],
              ["datasources", "Fuentes de datos", "Fuentes de información"],
              ["conexiones", "Conexiones", "Cuentas autorizadas"],
            ].map(([route, title, description]) => (
              <Link key={route} to={`/${route}`}>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <Icon name="angle-right" />
              </Link>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
