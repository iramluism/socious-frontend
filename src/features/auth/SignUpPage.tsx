import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import { useAuth } from "../../app/AuthContext";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";

/** Username and password registration. */
export function SignUpPage() {
  const { user, ready, signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (ready && user) {
    return <Navigate to="/cuenta" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp(username, password);
      navigate("/cuenta");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Crear cuenta"
        description="Elige un usuario y una contraseña para registrarte."
      />
      <section className="panel auth-panel">
        {error ? (
          <Alert type="error" statusIconAriaLabel="Error">
            {error}
          </Alert>
        ) : null}
        <form onSubmit={onSubmit} noValidate className="form-stack">
          <label>
            Usuario <span className="required">*</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-required="true"
            />
          </label>
          <label>
            Contraseña <span className="required">*</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
            />
          </label>
          <p className="muted">
            Usuario: 3–64 caracteres (letras, números, punto, guion o
            guion bajo). Contraseña: mínimo 8 caracteres.
          </p>
          <div className="actions">
            <Button variant="primary" formAction="submit" loading={submitting}>
              Crear cuenta
            </Button>
          </div>
        </form>
        <p className="muted">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </>
  );
}
