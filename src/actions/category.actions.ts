"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { categorySchema } from "@/lib/validations/category";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types";

function revalidateCategories() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos", "layout");
  revalidatePath("/productos", "layout");
  revalidatePath("/");
}

/**
 * Crea o actualiza una categoría (si el FormData trae `id`, actualiza).
 * Jerarquía de máximo 2 niveles: el padre debe ser una categoría raíz de la
 * misma línea, y una categoría con subcategorías no puede volverse hija.
 */
export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const id = formData.get("id")?.toString() || null;
  const data = { ...parsed.data, slug: parsed.data.slug ?? slugify(parsed.data.name) };

  if (data.parentId) {
    if (data.parentId === id) {
      return { ok: false, fieldErrors: { parentId: ["Una categoría no puede ser su propia madre."] } };
    }
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent || parent.parentId) {
      return { ok: false, fieldErrors: { parentId: ["Elige una categoría principal (sin categoría madre)."] } };
    }
    if (parent.kind !== data.kind) {
      return { ok: false, fieldErrors: { parentId: ["La categoría madre debe ser de la misma línea."] } };
    }
    if (id && (await prisma.category.count({ where: { parentId: id } })) > 0) {
      return { ok: false, fieldErrors: { parentId: ["Esta categoría tiene subcategorías; no puede volverse subcategoría."] } };
    }
  }

  try {
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, fieldErrors: { slug: ["Ya existe una categoría con ese slug."] } };
    }
    console.error(error);
    return { ok: false, message: "No se pudo guardar la categoría." };
  }

  revalidateCategories();
  redirect("/admin/categorias?saved=1");
}

/**
 * Elimina una categoría solo si no tiene productos (la relación es
 * Restrict para no dejar productos huérfanos). Sus subcategorías pasan a
 * ser categorías principales (onDelete: SetNull).
 */
export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) redirect(`/admin/categorias?error=${encodeURIComponent("No se puede eliminar: la categoría tiene productos. Muévelos a otra categoría primero.")}`);

  await prisma.category.delete({ where: { id } });
  revalidateCategories();
  redirect("/admin/categorias?deleted=1");
}
