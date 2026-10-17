import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { PageHeading, formatDate } from "../../shared/PageHeading";

/** Signed-in profile: id, username, created_at. */
export function AccountPage() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="muted">Cargando cuenta…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <PageHeading
        title="My Account"
        description="Tus datos de cuenta en Socious."
      />
      <section className="panel settings">
        <h2>Perfil</h2>
        <dl className="account-fields">
          <dt>Usuario</dt>
          <dd>{user.username}</dd>
          <dt>Identificador</dt>
          <dd>
            <code>{user.id}</code>
          </dd>
          <dt>Creada</dt>
          <dd>{formatDate(user.created_at)}</dd>
        </dl>
      </section>
    </>
  );
}

/** Two-letter initials from a username. */
export function usernameInitials(username: string): string {
  const parts = username.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase() || "?";
}
