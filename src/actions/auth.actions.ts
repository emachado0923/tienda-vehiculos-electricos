"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { ActionState } from "@/types";

/** Solo permitimos redirecciones internas (evita open-redirect). */
const safeCallback = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/cuenta";
};

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Correo o contraseña incorrectos." };
    }
    throw error; // NEXT_REDIRECT debe propagarse
  }
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return { ok: false, fieldErrors: { email: ["Este correo ya está registrado."] } };
  }

  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  // Inicia sesión automáticamente tras el registro
  await signIn("credentials", { email, password, redirectTo: "/cuenta" });
  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
