import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Proxy (antes "middleware" en Next.js ≤15).
 * Protege /admin (solo ADMIN), /cuenta y /checkout (usuario autenticado).
 * Las reglas viven en el callback `authorized` de auth.config.ts; aquí solo
 * envolvemos la petición con `auth` para que se evalúen.
 */
const { auth } = NextAuth(authConfig);

export default auth(function proxy() {
  // Sin lógica adicional: `authorized` ya redirige cuando corresponde.
});

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/checkout/:path*"],
};
