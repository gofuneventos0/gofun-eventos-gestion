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

export function missingEnvMessage(): string {
  return (
    "Faltan las credenciales de Supabase en .env.local: " +
    "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}
