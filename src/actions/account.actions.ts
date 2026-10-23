"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { changePasswordSchema } from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email/mailer";
import { passwordChangedEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { addressSchema } from "@/lib/validations/checkout";
import type { ActionState } from "@/types";

/** Cliente: agrega una dirección de envío a su libreta. */
export async function addAddressAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const isDefault = raw.isDefault === "on";
  await prisma.$transaction(async (tx) => {
    // Solo puede haber una dirección predeterminada por usuario
    if (isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    await tx.address.create({ data: { ...parsed.data, isDefault, userId: user.id } });
  });

  revalidatePath("/cuenta/direcciones");
  return { ok: true, message: "Dirección guardada." };
}

/** Cualquier usuario: cambia su propia contraseña (requiere la actual). */
export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sessionUser = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, fieldErrors: { currentPassword: ["La contraseña actual no es correcta."] } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  after(() => sendEmail(passwordChangedEmail(user.email, user.name)));

  return { ok: true, message: "Contraseña actualizada correctamente." };
}

/** Cliente: elimina una dirección propia. */
export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  // deleteMany con userId evita borrar direcciones de otros usuarios
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/cuenta/direcciones");
}
