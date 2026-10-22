"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

/** Cliente: elimina una dirección propia. */
export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  // deleteMany con userId evita borrar direcciones de otros usuarios
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/cuenta/direcciones");
}
