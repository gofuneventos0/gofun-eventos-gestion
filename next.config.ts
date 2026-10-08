import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esta app es privada y 100% dependiente de la sesión: todas las páginas
  // leen cookies y datos que cambian en cada petición, así que no hay nada que
  // prerenderizar. Se desactiva Cache Components (y Partial Prefetching, que lo
  // requiere) para usar renderizado dinámico clásico y evitar envolver cada
  // página en <Suspense> sin beneficio real.
  // Si en el futuro se quiere activar, la migración por ruta está documentada
  // en node_modules/next/dist/docs (guía "Authentication with Cache Components").
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
