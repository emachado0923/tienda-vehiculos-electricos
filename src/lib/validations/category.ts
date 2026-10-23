import { z } from "zod";
import { CategoryKind } from "@prisma/client";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  slug: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().trim().regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones").optional(),
  ),
  kind: z.enum(CategoryKind, "Selecciona la línea"),
  description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
  imageUrl: z.preprocess(
    emptyToNull,
    z
      .string()
      .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("https://"), "Usa https:// o una ruta local")
      .nullable(),
  ),
  parentId: z.preprocess(emptyToNull, z.string().nullable()),
});

export type CategoryInput = z.infer<typeof categorySchema>;
