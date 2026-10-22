import { z } from "zod";
import { ConnectorType, InverterType, PanelType } from "@prisma/client";

/** Convierte "" / null en undefined (los <select>/<input> vacíos llegan como ""). */
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

/**
 * Esquema de validación compartido por:
 *  - Server Actions del dashboard (FormData)
 *  - API Route POST /api/products (JSON)
 */
export const productSchema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(191),
  sku: z
    .string()
    .trim()
    .min(2, "SKU requerido")
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guiones y guion bajo"),
  slug: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(/^[a-z0-9-]+$/, "Slug inválido (a-z, 0-9, -)").optional(),
  ),
  shortDescription: z.preprocess(emptyToUndefined, z.string().max(300).optional()),
  description: z.string().trim().min(10, "Mínimo 10 caracteres"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  compareAtPrice: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  brand: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // Atributos técnicos (opcionales según la categoría)
  connectorType: z.preprocess(emptyToUndefined, z.enum(ConnectorType).optional()),
  powerKw: z.preprocess(emptyToUndefined, z.coerce.number().positive().max(1000).optional()),
  panelType: z.preprocess(emptyToUndefined, z.enum(PanelType).optional()),
  inverterType: z.preprocess(emptyToUndefined, z.enum(InverterType).optional()),

  /** URLs de imágenes en orden (la primera es la principal). */
  images: z.array(z.string().url("URL de imagen inválida")).max(10).default([]),
  /** Especificaciones técnicas clave/valor. */
  specs: z.record(z.string(), z.string()).default({}),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Convierte el FormData del formulario del dashboard a un objeto plano
 * listo para `productSchema.safeParse`.
 *  - images: textarea con una URL por línea
 *  - specs:  pares de inputs specKey / specValue repetidos
 */
export function productFormDataToObject(formData: FormData) {
  const images = String(formData.get("images") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const keys = formData.getAll("specKey").map(String);
  const values = formData.getAll("specValue").map(String);
  const specs: Record<string, string> = {};
  keys.forEach((k, i) => {
    const key = k.trim();
    const value = (values[i] ?? "").trim();
    if (key && value) specs[key] = value;
  });

  return {
    title: formData.get("title"),
    sku: formData.get("sku"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
    brand: formData.get("brand"),
    // Los checkbox solo se envían cuando están marcados
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    connectorType: formData.get("connectorType"),
    powerKw: formData.get("powerKw"),
    panelType: formData.get("panelType"),
    inverterType: formData.get("inverterType"),
    images,
    specs,
  };
}
