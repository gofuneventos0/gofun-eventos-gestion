import { db } from "./db";
import { verificarPassword } from "./password";

export interface UsuarioLocal {
  id: string;
  email: string;
  nombre: string;
}

interface FilaUsuario {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  creado_en: string;
}

function aUsuario(f: FilaUsuario): UsuarioLocal {
  return { id: f.id, email: f.email, nombre: f.nombre };
}

/** Usuario por email (para el login local), con su hash para verificar la contraseña. */
export function obtenerUsuarioPorEmail(email: string): FilaUsuario | null {
  const fila = db
    .prepare("select * from usuarios where lower(email) = lower(?)")
    .get(email) as FilaUsuario | undefined;
  return fila ?? null;
}

export function obtenerUsuarioPorId(id: string): UsuarioLocal | null {
  const fila = db
    .prepare("select * from usuarios where id = ?")
    .get(id) as FilaUsuario | undefined;
  return fila ? aUsuario(fila) : null;
}

/** Comprueba credenciales locales. Devuelve el UsuarioLocal o null. */
export function autenticarLocal(email: string, password: string): UsuarioLocal | null {
  const fila = obtenerUsuarioPorEmail(email);
  if (!fila || !verificarPassword(password, fila.password_hash)) return null;
  return aUsuario(fila);
}