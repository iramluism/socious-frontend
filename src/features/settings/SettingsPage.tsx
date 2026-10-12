import { PageHeading } from "../../shared/PageHeading";

/** Documents demo behavior and theme without exposing nonfunctional settings. */
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
        <h2>Acerca de esta demo</h2>
        <p>
          Los recuerdos y el historial se conservan al navegar y se reinician al
          recargar.
        </p>
        <p>
          No hay conexión con APIs, modelos, servicios externos ni
          autenticación. La información precargada es ficticia.
        </p>
        <p>
          Query busca coincidencias de palabras en el título y contenido, sin
          distinguir mayúsculas ni tildes. Ordena por número de palabras
          coincidentes y después por fecha. Los recuerdos archivados no aparecen
          en Query.
        </p>
        <p className="muted">Socious · Memo / Demo 0.1</p>
      </section>
    </>
  );
}
