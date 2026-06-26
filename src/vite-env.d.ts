/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When set to "0", the monitoring client hits the real backend even in dev. */
  readonly VITE_MONITORING_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
