import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";
import { createCapture } from "../captures/api";

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

/** Introduces Memo with inline capture and workspace shortcuts. */
export function OverviewPage() {
  const [capture, setCapture] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const save = async () => {
    const body = capture.trim();
    if (!body) {
      setError("Escribe algo que quieras recordar.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createCapture({ body, reference_at: todayReferenceAt() });
      setCapture("");
      setSuccess("Recuerdo guardado.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
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
        <Icon name="edit" />
        <label className="grow">
          <span className="sr-only">¿Qué quieres recordar?</span>
          <textarea
            rows={2}
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder="¿Qué quieres recordar?"
            disabled={saving}
          />
        </label>
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
