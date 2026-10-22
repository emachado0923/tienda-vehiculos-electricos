import type { NextAuthConfig } from "next-auth";

/**
 * Configuración "ligera" de Auth.js (sin Prisma ni bcrypt) para poder
 * usarla en `proxy.ts`. Los providers con acceso a BD se añaden en `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    /** Control de acceso por ruta, evaluado en el proxy (middleware). */
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const path = nextUrl.pathname;

      if (path.startsWith("/admin")) {
        if (!user) return false; // -> redirige a /login
        return user.role === "ADMIN" ? true : Response.redirect(new URL("/", nextUrl));
      }
      if (path.startsWith("/cuenta") || path.startsWith("/checkout")) {
        return !!user;
      }
      return true;
    },
    /** Persistimos id y rol en el JWT... */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    /** ...y los exponemos en la sesión. */
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
