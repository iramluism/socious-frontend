import { useState } from "react";
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Icon from "@cloudscape-design/components/icon";
import type { IconProps } from "@cloudscape-design/components/icon";
import { AuthProvider, useAuth } from "./AuthContext";
import { DemoProvider } from "./DemoContext";
import { OverviewPage } from "../features/memories/OverviewPage";
import { QueryPage } from "../features/query/QueryPage";
import {
  QualifierDetailPage,
  QualifiersPage,
} from "../features/qualifiers/QualifiersPage";
import { ModelsPage } from "../features/models/ModelsPage";
import { DataSourceDetailPage } from "../features/datasources/DataSourceDetailPage";
import { DataSourceWizardPage } from "../features/datasources/DataSourceWizardPage";
import { DatasourcesPage } from "../features/datasources/DatasourcesPage";
import {
  ConnectionsPage,
  ConnectionDetailPage,
} from "../features/connections/ConnectionsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AccountPage, usernameInitials } from "../features/auth/AccountPage";
import { LoginPage } from "../features/auth/LoginPage";
import { SignUpPage } from "../features/auth/SignUpPage";

const navigation: { path: string; label: string; icon: IconProps.Name }[] = [
  { path: "/", label: "Resumen", icon: "grid-view" },
  { path: "/query", label: "Query", icon: "search" },
  { path: "/calificadores", label: "Calificadores", icon: "check" },
  { path: "/modelos", label: "Modelos", icon: "gen-ai" },
  { path: "/datasources", label: "Fuentes de datos", icon: "multiscreen" },
  { path: "/conexiones", label: "Conexiones", icon: "share" },
  { path: "/configuracion", label: "Configuración", icon: "settings" },
];

/** Renders shared console navigation, global search and the active feature route. */
function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const title =
    location.pathname === "/login"
      ? "Iniciar sesión"
      : location.pathname === "/sign-up"
        ? "Crear cuenta"
        : location.pathname === "/cuenta"
          ? "My Account"
          : (navigation.find(
              (n) => n.path !== "/" && location.pathname.startsWith(n.path),
            )?.label ?? "Resumen");
  return (
    <>
      <a
        className="skip-link"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("content")?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="topbar">
        <button
          className="mobile-menu"
          aria-label="Abrir navegación"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Icon name="menu" />
        </button>
        <Link to="/" className="brand">
          Socious<span className="brand-dot">.</span>
        </Link>
        <span className="top-divider" />
        <ButtonDropdown
          items={[
            { id: "memo", text: "Memo · Memoria personal" },
            {
              id: "future",
              text: "Más aplicaciones · Próximamente",
              disabled: true,
            },
          ]}
          onItemClick={({ detail }) => {
            if (detail.id === "memo") navigate("/");
          }}
        >
          Memo
        </ButtonDropdown>
        <form
          className="global-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/query?q=${encodeURIComponent(search)}`);
            setMobileOpen(false);
          }}
        >
          <Icon name="search" />
          <input
            aria-label="Buscar en Socious"
            placeholder="Buscar en Socious"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>↵</kbd>
        </form>
        <span className="top-demo">DEMO</span>
        <ButtonDropdown
          className="avatar-dropdown"
          expandToViewport
          ariaLabel={user ? `Cuenta de ${user.username}` : "Cuenta"}
          items={
            user
              ? [
                  { id: "account", text: "My Account" },
                  { id: "logout", text: "Cerrar sesión" },
                ]
              : [
                  { id: "login", text: "Iniciar sesión" },
                  { id: "signup", text: "Crear cuenta" },
                ]
          }
          onItemClick={({ detail }) => {
            if (detail.id === "login") navigate("/login");
            if (detail.id === "signup") navigate("/sign-up");
            if (detail.id === "account") navigate("/cuenta");
            if (detail.id === "logout") logout();
          }}
        >
          <span className="avatar">
            {user ? usernameInitials(user.username) : "?"}
          </span>
        </ButtonDropdown>
      </header>
      <div className="app-body">
        <aside
          className={`sidebar ${mobileOpen ? "is-open" : ""} ${navCollapsed ? "is-collapsed" : ""}`}
        >
          <div className="service-title">
            <span className="service-icon">
              <Icon name="file" />
            </span>
            <div className="service-copy">
              <strong>Memo</strong>
              <small>Tu memoria personal</small>
            </div>
            <button
              className="nav-collapse"
              type="button"
              aria-label={
                navCollapsed ? "Expandir navegación" : "Contraer navegación"
              }
              aria-expanded={!navCollapsed}
              onClick={() => setNavCollapsed((value) => !value)}
            >
              <Icon name={navCollapsed ? "angle-right" : "angle-left"} />
            </button>
          </div>
          <p className="nav-caption">MEMORIA</p>
          <nav aria-label="Navegación de Memo">
            {navigation.map((item, index) => (
              <div
                key={item.path}
                className={index === 2 || index === 6 ? "nav-group-start" : ""}
              >
                {index === 2 && (
                  <p className="nav-caption">ESPACIO DE TRABAJO</p>
                )}
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  title={item.label}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name={item.icon} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="status-dot" />{" "}
            <span className="nav-label">Demo local</span>
            <small className="nav-label">Los cambios duran esta sesión</small>
          </div>
        </aside>
        {mobileOpen && (
          <button
            className="nav-backdrop"
            aria-label="Cerrar navegación"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main id="content" tabIndex={-1}>
          <div className="breadcrumb">
            <Link to="/">Socious</Link>
            <span>/</span>
            <Link to="/">Memo</Link>
            <span>/</span>
            <span>{title}</span>
          </div>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/calificadores" element={<QualifiersPage />} />
            <Route path="/calificadores/:id" element={<QualifierDetailPage />} />
            <Route path="/modelos/:id?" element={<ModelsPage />} />
            <Route path="/datasources" element={<DatasourcesPage />} />
            <Route path="/datasources/nueva" element={<DataSourceWizardPage />} />
            <Route path="/datasources/:id" element={<DataSourceDetailPage />} />
            <Route path="/conexiones" element={<ConnectionsPage />} />
            <Route path="/conexiones/:id" element={<ConnectionDetailPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/cuenta" element={<AccountPage />} />
            <Route
              path="*"
              element={
                <div className="panel empty">
                  <h1>Página no encontrada</h1>
                  <Link to="/">Volver al resumen</Link>
                </div>
              }
            />
          </Routes>
          <footer className="content-footer">
            <span>Socious / Memo</span>
            <span>Memo conectado a la API local</span>
          </footer>
        </main>
      </div>
    </>
  );
}

/** Composes session state and hash routing for standalone static hosting. */
export function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </DemoProvider>
    </AuthProvider>
  );
}
