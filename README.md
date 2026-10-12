# Socious · Memo

Demo navegable en React y TypeScript: consola de memoria personal inspirada en AWS y tema grafito PyCharm. Recuerdos, Query y catálogos usan datos en memoria de sesión. **Conexiones** consume la API real de Memo en Socius (OAuth Google).

## Arranque

Requisitos: Node.js 20.19+ o 22.12+ y npm 10+.

### Solo demo (recuerdos / Query)

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. El servidor escucha en loopback con `--strictPort`.

### Conexiones contra Socius

1. Arranca el backend en **http://127.0.0.1:8000** (p. ej. `deploy/compose` o `uvicorn` en el repo `socius`).
2. Configura en el entorno del backend (ver `memo/README.md` en socius):
   - `MEMO_GOOGLE_OAUTH_CLIENT_ID` / `MEMO_GOOGLE_OAUTH_CLIENT_SECRET`
   - `MEMO_PUBLIC_BASE_URL` (origen público del callback)
   - `MEMO_SECRETS_KEY` (cifrado de tokens)
3. En Google Cloud Console, URI de redirección autorizada:

   `{MEMO_PUBLIC_BASE_URL}/api/v1/memo/oauth/google/callback`

4. Frontend:

```sh
cp .env.example .env   # opcional; por defecto VITE_MEMO_API_BASE=/api/v1/memo
npm ci
npm run dev
```

Vite hace proxy de `/api` → `http://127.0.0.1:8000`, así el SPA llama rutas relativas sin CORS.

Abre http://127.0.0.1:5173/#/conexiones para listar, crear conexión Google, abrir consentimiento y ver el detalle (sondeo hasta `active`).

Si `npm run dev` falla con `ENOSPC` (límite de watchers):

```sh
CHOKIDAR_USEPOLLING=1 WATCHPACK_POLLING=true npm run dev
```

Distribución: `npm run build` y `npm run preview` (http://127.0.0.1:4173).

## Organización

- `src/app`: rutas hash, shell, `DemoProvider` (recuerdos + historial Query).
- `src/features/memories`, `query`, `collections`, `qualifiers`, `models`, `datasources`, `settings`: demo local.
- `src/features/connections`: tabla Cloudscape + detalle; cliente en `api.ts` y `src/shared/api/client.ts`.
- `src/shared`: estilos, encabezados, cliente HTTP Memo.

Patrón: página → componentes → hooks/estado → funciones puras o API. Sin Redux.

### Flujo Conexiones (API)

1. `GET /connections` al cargar la lista; Actualizar repite la petición.
2. Nueva conexión: `GET /oauth-apps/google_oauth2` (bloquea si `configured: false`), `GET /kinds` para multi-select, `POST /connections`.
3. Tras crear: navegación al detalle, apertura de `consent_url` en nueva pestaña, sondeo `GET /connections/{id}` cada 2 s hasta `active` / `error` / timeout.
4. Reautorizar: `POST /connections/{id}/consent`; Revocar: confirmación + `POST /connections/{id}/revoke`.

Los tokens nunca se muestran en la UI.

## Verificación

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest cubre búsqueda de recuerdos, filtros de conexiones, cliente HTTP (`ApiError`, create/consent/revoke) y navegación a Conexiones con `fetch` mockeado.

## Limitaciones

- Sin autenticación de usuario en Socious; API Memo pensada para loopback.
- Recuerdos y catálogos siguen siendo demo en memoria (recarga = reset).
- Familia `api_key` no se crea desde la UI (solo Google OAuth en el MVP).
- Acciones masivas en la tabla de conexiones: próximamente.
- Sin remoto Git obligatorio ni despliegue incluido en este repo.
