# Socious · Memo

Demo navegable en React y TypeScript: una consola de memoria personal, inspirada en la estructura de AWS y en el tema grafito de PyCharm. Los datos son ficticios y viven únicamente en memoria. No hay APIs, inferencia, autenticación ni almacenamiento persistente.

## Arranque

Requisitos: Node.js 20.19+ o 22.12+ y npm 10+.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. El servidor escucha exclusivamente en loopback y falla si el puerto está ocupado. Para revisar la distribución: `npm run build` y `npm run preview` (http://127.0.0.1:4173). Los cambios desaparecen al recargar. No hay remoto Git ni despliegue configurado.

## Organización

- `src/app`: composición, rutas hash, shell de la consola y contexto del estado compartido.
- `src/features/memories`: datos y tipos de recuerdos, captura, listado, detalle y resumen.
- `src/features/query`: motor léxico puro y pantalla de consulta con historial.
- `src/features/collections`: listado de colecciones y enlace a sus recuerdos.
- `src/features/qualifiers`: catálogo ilustrativo de calificadores.
- `src/features/models`: catálogo ilustrativo de modelos (enlaces a Hugging Face).
- `src/features/datasources`: catálogo ilustrativo de fuentes.
- `src/features/registry`: inventario tipo AWS (tabla Cloudscape) de fuentes indexadas, esquemas e índices de memoria.
- `src/features/settings`: apariencia y comportamiento de la demo.
- `src/shared`: encabezados, catálogo reutilizable, formato de fecha y estilos propios.

Patrón: **página → componentes → estado/hooks → funciones puras/datos**. Las páginas consumen `useDemo`; `DemoProvider` permanece montado durante la navegación. La captura agrega un recuerdo al estado, y tanto el resumen como Query derivan sus resultados de ese mismo estado. El router hash permite enlaces directos en hosting estático y los botones Atrás/Adelante del navegador. No se usa Redux ni una capa artificial de repositorios.

### Flujo de datos

1. `main.tsx` aplica el tema Cloudscape (`applyTheme` + CSS propio) y monta `App`.
2. `DemoProvider` carga `initialMemories` y conserva recuerdos e historial de Query en memoria de React.
3. Las páginas leen y escriben ese estado mediante `useDemo`; la navegación hash no desmonta el proveedor.
4. Query ejecuta `searchMemories` (función pura) sobre los recuerdos activos de la sesión.

### Cómo añadir una sección

1. Crea una página en `src/features/<sección>` y documenta con TSDoc su contrato exportado.
2. Registra la ruta y la entrada de navegación en `src/app/App.tsx`.
3. Añade pruebas del comportamiento observable en `tests/`.
4. Eleva estado a `DemoProvider` solo si debe sobrevivir al cambio de página o compartirse entre funcionalidades.

## Qué se puede probar

1. Crea un recuerdo con título, contenido y colección opcional.
2. Navega a Query, busca una palabra del recuerdo y abre su fuente original.
3. Aplica filtros de colección/fuente y restaura una consulta del historial.
4. Busca desde la cabecera o Mis recuerdos, alterna lista/cuadrícula y abre colecciones.
5. Navega a los catálogos, abre sus detalles y revisa las limitaciones declaradas.
6. Abre Registry (`#/registry`), filtra la tabla, pagina y entra al detalle de un recurso; las acciones de mutación permanecen deshabilitadas.

Query divide el texto en palabras, elimina tildes y diferencias de mayúsculas, y encuentra recuerdos activos con al menos una palabra completa coincidente en título/contenido. Ordena por número de palabras distintas coincidentes, fecha descendente y finalmente ID. No aplica interpretación semántica ni genera respuestas. El historial guarda las diez últimas consultas diferentes de esta sesión con sus filtros. Los archivados no se incluyen en Query.

## Diseño y accesibilidad

Cloudscape aporta botones, menús, modales, fuente Open Sans e iconos oficiales del sistema de diseño creado por AWS. Los tokens se ajustan mediante `applyTheme`, la API pública; el CSS propio no depende de clases internas de Cloudscape. Tema oscuro fijo, acentos desaturados, foco visible, etiquetas de formularios y navegación plegable (escritorio y menú móvil). Los modelos son referencias ilustrativas y solo los enlaces explícitos a Hugging Face salen de la demo.

## Verificación

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest + Testing Library comprueban contratos de búsqueda, validación y creación, consulta de recuerdos nuevos, filtros, referencias, restauración de historial, enlaces directos y estados vacíos. La comprobación visual en navegador debe cubrir escritorio y móvil, foco/teclado, menú móvil, rutas y Atrás/Adelante.

No se admite edición, eliminación, archivado nuevo, CRUD de catálogos o del Registry, descarga de modelos ni conexiones externas. Las acciones futuras se muestran deshabilitadas. Un enlace a un recuerdo creado en otra sesión muestra un estado recuperable de recurso no disponible.

Registry usa componentes públicos de Cloudscape (`Table`, `Header`, `TextFilter`, `Pagination`) sobre datos de ejemplo en español. Actualizar solo relee el inventario local; no hay red.
