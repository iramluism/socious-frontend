/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEMO_API_BASE?: string;
  readonly VITE_AUTH_API_BASE?: string;
  readonly VITE_OAUTH_AUTHORIZE_ACTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
