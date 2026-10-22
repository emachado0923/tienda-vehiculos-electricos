import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve la configuración del sitio (registro único id=1).
 * Si aún no existe, la crea con los valores por defecto del esquema.
 * `cache` deduplica la consulta dentro de un mismo render.
 */
export const getSiteConfig = cache(async () => {
  return prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
});
