"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { adminCreateUserSchema, adminSetPasswordSchema } from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email/mailer";
import { passwordChangedEmail } from "@/lib/email/templates";
import type { ActionState } from "@/types";

/** Admin: crea un usuario (cliente o administrador). */
export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { name, email, password, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, fieldErrors: { email: ["Ya existe un usuario con ese correo."] } };
  }
  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 12) } });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: `Usuario ${email} creado.` };
}

/**
 * Admin: cambia el rol de un usuario.
 * Reglas: no puedes quitarte el rol a ti mismo y siempre debe quedar al
 * menos un administrador.
 */
export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "CUSTOMER";

  if (userId === admin.id && role !== "ADMIN") return; // no auto-degradarse
  if (role === "CUSTOMER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return;
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/usuarios");
}

/** Admin: asigna una nueva contraseña a un usuario (p. ej. si la olvidó). */
export async function setUserPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminSetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
    select: { email: true, name: true },
  });
  after(() => sendEmail(passwordChangedEmail(user.email, user.name)));

  return { ok: true, message: "Contraseña actualizada. Comunícasela al usuario por un canal seguro." };
}
