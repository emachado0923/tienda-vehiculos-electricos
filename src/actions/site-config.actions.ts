"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import type { ActionState } from "@/types";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();
const optionalUrl = z.union([z.literal("").transform(() => null), z.string().trim().url("URL inválida")]);

const siteConfigSchema = z.object({
  storeName: z.string().trim().min(2, "Nombre requerido"),
  logoUrl: optionalUrl,
  heroTitle: z.string().trim().min(3, "Título requerido"),
  heroSubtitle: optionalText,
  heroImageUrl: optionalUrl,
  heroCtaText: optionalText,
  heroCtaUrl: optionalText,
  contactEmail: z.union([z.literal("").transform(() => null), z.string().trim().email("Correo inválido")]),
  contactPhone: optionalText,
  whatsapp: optionalText,
  address: optionalText,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  xUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  freeShippingThreshold: z.union([
    z.literal("").transform(() => null),
    z.coerce.number().min(0),
  ]),
  flatShippingFee: z.coerce.number().min(0),
});

export async function updateSiteConfigAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = siteConfigSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  // La configuración se usa en el layout global (header/footer/hero)
  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada." };
}
