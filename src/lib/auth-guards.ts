import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Guards para Server Components y Server Actions.
 * El proxy ya filtra rutas, pero las Server Actions son endpoints POST
 * públicos: SIEMPRE se debe re-validar la sesión dentro de ellas.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}

/** Variante para API Routes: devuelve null en lugar de redirigir. */
export async function getAdminOrNull() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session.user : null;
}
