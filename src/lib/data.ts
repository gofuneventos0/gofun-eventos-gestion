/**
 * Fachada de datos.
 *
 * Toda la persistencia pasa por libSQL (Turso en producción, archivo local en
 * desarrollo). Las funciones son asíncronas porque la conexión a Turso es HTTP.
 */
export * from "./local/repo";
