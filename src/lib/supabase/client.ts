"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./env";

/**
 * Cliente de Supabase para Client Components (login, formularios con estado).
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado. Completa .env.local.");
  }
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
