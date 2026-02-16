/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_BOARD_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
