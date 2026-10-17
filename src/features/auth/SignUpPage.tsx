import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { ApiError } from "../../shared/api/client";
import { AwsAuthLayout } from "./AwsAuthLayout";

/** Username and password registration (AWS console-style page). */
export function SignUpPage() {
  const { user, ready, signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (ready && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp(username, password);
      navigate("/", { replace: true });
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
    <AwsAuthLayout
      title="Create account"
      footer={
        <p className="aws-auth-new">
          Already have an account? <Link to="/login">Sign in</Link>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required="true"
          />
        </label>
        <p className="aws-auth-hint">
          Username: 3–64 characters (letters, numbers, dot, hyphen or
          underscore). Password: at least 8 characters.
        </p>
        <button
          className="aws-auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
    </AwsAuthLayout>
  );
}
