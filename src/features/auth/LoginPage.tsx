import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import { useAuth } from "../../app/AuthContext";
import { ApiError } from "../../shared/api/client";
import { PageHeading } from "../../shared/PageHeading";

/** Username and password sign-in. */
export function LoginPage() {
  const { user, ready, login } = useAuth();
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
      await login(username, password);
      navigate("/cuenta");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Iniciar sesión"
        description="Entra con tu usuario y contraseña."
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
            />
          </label>
          <div className="actions">
            <Button variant="primary" formAction="submit" loading={submitting}>
              Entrar
            </Button>
          </div>
        </form>
        <p className="muted">
          ¿No tienes cuenta? <Link to="/sign-up">Crear cuenta</Link>
        </p>
      </section>
    </>
  );
}
