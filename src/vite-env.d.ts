/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase. Sin ella, la telemetria no hace nada. */
  readonly VITE_SUPABASE_URL?: string
  /** Clave anonima. Solo puede INSERTAR eventos: la politica RLS no da mas. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
