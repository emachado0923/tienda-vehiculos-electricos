import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient.
 * En desarrollo, el hot-reload de Next.js re-evalúa los módulos; guardamos la
 * instancia en `globalThis` para no agotar las conexiones de MySQL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
