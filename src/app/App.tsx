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
import { DemoProvider } from "./DemoContext";
import { OverviewPage } from "../features/memories/OverviewPage";
import {
  MemoriesPage,
  MemoryDetailPage,
} from "../features/memories/MemoriesPage";
import { QueryPage } from "../features/query/QueryPage";
import { CollectionsPage } from "../features/collections/CollectionsPage";
import { QualifiersPage } from "../features/qualifiers/QualifiersPage";
import { ModelsPage } from "../features/models/ModelsPage";
import { DatasourcesPage } from "../features/datasources/DatasourcesPage";
import {
  ConnectionsPage,
  ConnectionDetailPage,
} from "../features/connections/ConnectionsPage";
import { SettingsPage } from "../features/settings/SettingsPage";

const navigation: { path: string; label: string; icon: IconProps.Name }[] = [
  { path: "/", label: "Resumen", icon: "grid-view" },
  { path: "/recuerdos", label: "Mis recuerdos", icon: "file" },
  { path: "/query", label: "Query", icon: "search" },
  { path: "/colecciones", label: "Colecciones", icon: "folder" },
  { path: "/archivados", label: "Archivados", icon: "folder" },
  { path: "/calificadores", label: "Calificadores", icon: "check" },
  { path: "/modelos", label: "Modelos", icon: "gen-ai" },
  { path: "/datasources", label: "Datasources", icon: "multiscreen" },
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
  const title =
    navigation.find(
      (n) => n.path !== "/" && location.pathname.startsWith(n.path),
    )?.label ?? "Resumen";
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
            navigate(`/recuerdos?q=${encodeURIComponent(search)}`);
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
        <span className="avatar" aria-label="Perfil de demostración IL">
          IL
        </span>
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
                className={index === 5 || index === 9 ? "nav-group-start" : ""}
              >
                {index === 5 && (
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
            <Route path="/recuerdos" element={<MemoriesPage />} />
            <Route path="/recuerdos/:id" element={<MemoryDetailPage />} />
            <Route path="/archivados" element={<MemoriesPage archived />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/colecciones" element={<CollectionsPage />} />
            <Route path="/calificadores/:id?" element={<QualifiersPage />} />
            <Route path="/modelos/:id?" element={<ModelsPage />} />
            <Route path="/datasources/:id?" element={<DatasourcesPage />} />
            <Route path="/conexiones" element={<ConnectionsPage />} />
            <Route path="/conexiones/:id" element={<ConnectionDetailPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
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
            <span>Demo navegable · Sin conexión a servicios</span>
          </footer>
        </main>
      </div>
    </>
  );
}

/** Composes session state and hash routing for standalone static hosting. */
export function App() {
  return (
    <DemoProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </DemoProvider>
  );
}
