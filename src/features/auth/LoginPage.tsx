import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { ApiError } from "../../shared/api/client";
import { AwsAuthLayout } from "./AwsAuthLayout";

/** Username and password sign-in (AWS console-style page). */
export function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    !(location.state as { from?: string }).from?.startsWith("/login") &&
    !(location.state as { from?: string }).from?.startsWith("/sign-up")
      ? (location.state as { from: string }).from
      : "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (ready && user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
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
    <AwsAuthLayout
      title="Sign in"
      footer={
        <p className="aws-auth-new">
          New to Socious? <Link to="/sign-up">Create an account</Link>
        </p>
      }
    >
      {error ? (
        <p className="aws-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="aws-auth-form">
        <label>
          Username
          <input
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-required="true"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required="true"
          />
        </label>
        <button
          className="aws-auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AwsAuthLayout>
  );
}
