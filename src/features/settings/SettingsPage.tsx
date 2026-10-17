import { PageHeading } from "../../shared/PageHeading";

/** Documents app behavior and theme without exposing nonfunctional settings. */
export function SettingsPage() {
  return (
    <>
      <PageHeading
        title="Configuración"
        description="Tu espacio, con claridad y sin distracciones."
      />
      <section className="panel settings">
        <h2>Apariencia</h2>
        <p>Tema oscuro · Grafito</p>
        <p className="muted">
          Inspirado en PyCharm, con tipografía Open Sans e iconos de Cloudscape.
        </p>
        <hr />
        <h2>Acerca de Memo</h2>
        <p>
          Desde Resumen puedes guardar un recuerdo con{" "}
          <code>POST /captures</code>. Query usa búsqueda semántica (
          <code>POST /query</code>) y permite filtrar por labels de los
          calificadores activos.
        </p>
        <p className="muted">Socious · Memo / 0.1</p>
      </section>
    </>
  );
}
