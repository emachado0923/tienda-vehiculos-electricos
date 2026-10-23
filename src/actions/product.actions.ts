"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { productFormDataToObject, productSchema } from "@/lib/validations/product";
import { createProduct, productErrorMessage, updateProduct } from "@/lib/services/products";
import { findInvalidImageUrl } from "@/lib/services/image-check";
import type { ActionState } from "@/types";

/** Invalida las páginas que muestran productos. */
function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/productos", "layout");
  revalidatePath("/admin/productos");
}

/**
 * Crea o actualiza un producto desde el formulario del dashboard.
 * Firma compatible con `useActionState(action, initialState)`.
 * Si el FormData trae `id`, se actualiza; si no, se crea.
 */
export async function saveProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse(productFormDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const imageError = await findInvalidImageUrl(parsed.data.images);
  if (imageError) {
    return { ok: false, message: imageError, fieldErrors: { images: [imageError] } };
  }

  const id = formData.get("id")?.toString();
  try {
    if (id) await updateProduct(id, parsed.data);
    else await createProduct(parsed.data);
  } catch (error) {
    return { ok: false, message: productErrorMessage(error) };
  }

  revalidateCatalog();
  // redirect() lanza una excepción controlada: debe ir fuera del try/catch
  redirect("/admin/productos?saved=1");
}

/** Elimina un producto. Si tiene pedidos asociados, lo desactiva en su lugar. */
export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const hasOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (hasOrders > 0) {
    // Conservamos el histórico de pedidos: soft-delete
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  revalidateCatalog();
}

/** Activa/desactiva un producto desde el listado. */
export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
  if (!product) return;
  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  revalidateCatalog();
}
