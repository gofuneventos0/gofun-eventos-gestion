import { get } from "./db";
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

/** Usuario por email (para el login), con su hash para verificar la contraseña. */
export async function obtenerUsuarioPorEmail(email: string): Promise<FilaUsuario | null> {
  return get<FilaUsuario>(
    "select * from usuarios where lower(email) = lower(?)",
    email
  );
}

export async function obtenerUsuarioPorId(id: string): Promise<UsuarioLocal | null> {
  const fila = await get<FilaUsuario>("select * from usuarios where id = ?", id);
  return fila ? aUsuario(fila) : null;
}

/** Comprueba credenciales locales. Devuelve el UsuarioLocal o null. */
export async function autenticarLocal(
  email: string,
  password: string
): Promise<UsuarioLocal | null> {
  const fila = await obtenerUsuarioPorEmail(email);
  if (!fila || !verificarPassword(password, fila.password_hash)) return null;
  return aUsuario(fila);
}
