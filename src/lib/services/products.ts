import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { ProductInput } from "@/lib/validations/product";

/**
 * Lógica de negocio de productos, compartida por las Server Actions del
 * dashboard y por la API REST (/api/products). Recibe datos YA validados.
 */

/** Mapea el input validado a los campos escalares de Prisma. */
function toProductData(input: ProductInput) {
  return {
    title: input.title,
    sku: input.sku.toUpperCase(),
    slug: input.slug ?? slugify(`${input.title}-${input.sku}`),
    shortDescription: input.shortDescription ?? null,
    description: input.description,
    price: new Prisma.Decimal(input.price),
    compareAtPrice: input.compareAtPrice ? new Prisma.Decimal(input.compareAtPrice) : null,
    stock: input.stock,
    brand: input.brand ?? null,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    connectorType: input.connectorType ?? null,
    powerKw: input.powerKw ? new Prisma.Decimal(input.powerKw) : null,
    panelType: input.panelType ?? null,
    inverterType: input.inverterType ?? null,
    specs: input.specs as Prisma.InputJsonValue,
  };
}

const toImages = (urls: string[], title: string) =>
  urls.map((url, position) => ({ url, position, alt: title }));

export async function createProduct(input: ProductInput) {
  const { categoryId, images } = input;
  return prisma.product.create({
    data: {
      ...toProductData(input),
      category: { connect: { id: categoryId } },
      images: { create: toImages(images, input.title) },
    },
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  const { categoryId, images } = input;
  // Reemplazamos la galería completa en una transacción
  return prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    return tx.product.update({
      where: { id },
      data: {
        ...toProductData(input),
        category: { connect: { id: categoryId } },
        images: { create: toImages(images, input.title) },
      },
    });
  });
}

/**
 * Traduce errores conocidos de Prisma a mensajes de usuario.
 * P2002 = violación de índice único (SKU o slug duplicado).
 */
export function productErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      if (target.includes("sku")) return "Ya existe un producto con ese SKU.";
      if (target.includes("slug")) return "Ya existe un producto con ese slug.";
      return "Registro duplicado.";
    }
    if (error.code === "P2025") return "La categoría o el producto no existe.";
  }
  console.error(error);
  return "Error inesperado al guardar el producto.";
}
