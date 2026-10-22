import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Extiende los tipos de Auth.js con `id` y `role`.
declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
