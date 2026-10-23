import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Guards para Server Components, Server Actions y Route Handlers.
 * El proxy ya filtra rutas, pero las Server Actions son endpoints POST
 * públicos: SIEMPRE se debe re-validar la sesión dentro de ellas.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Lee el rol ACTUAL desde la base de datos (no solo el del JWT): si a un
 * usuario se le quita el rol ADMIN o se elimina, pierde el acceso al
 * instante, sin esperar a que caduque su sesión.
 */
async function currentAdmin() {
  const session = await auth();
  if (!session?.user) return { session: null, isAdmin: false } as const;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return { session, isAdmin: user?.role === "ADMIN" } as const;
}

export async function requireAdmin() {
  const { session, isAdmin } = await currentAdmin();
  if (!session) redirect("/login");
  if (!isAdmin) redirect("/");
  return session.user;
}

/** Variante para API Routes: devuelve null en lugar de redirigir. */
export async function getAdminOrNull() {
  const { session, isAdmin } = await currentAdmin();
  return isAdmin ? session.user : null;
}
