/**
 * Variables de entorno de Supabase.
 * Se leen en tiempo de ejecución para poder arrancar el proyecto
 * antes de tener el proyecto de Supabase creado.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const PLACEHOLDER = "https://TU-PROYECTO.supabase.co";

export function supabaseUrl(): string {
  return URL_;
}

export function supabaseAnonKey(): string {
  return ANON_;
}

/** ¿Ya tenemos credenciales reales, o sigue con el placeholder? */
export function isSupabaseConfigured(): boolean {
  return (
    URL_.length > 0 &&
    ANON_.length > 0 &&
    !URL_.includes("TU-PROYECTO") &&
    !ANON_.includes("TU-ANON-KEY") &&
    URL_ !== PLACEHOLDER
  );
}

/**
 * Modo local: se usa cuando NO hay credenciales de Supabase reales.
 * En ese caso la app funciona con una base SQLite local y una sesión propia
 * (usuario por defecto: admin / admin). Al rellenar .env.local con
 * credenciales reales y reiniciar, la app vuelve a Supabase automáticamente.
 */
export function esModoLocal(): boolean {
  return !isSupabaseConfigured();
}

export function missingEnvMessage(): string {
  return (
    "Faltan las credenciales de Supabase en .env.local: " +
    "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}
