"use client";

import { startTransition, useActionState } from "react";
import { updateSiteConfigAction } from "@/actions/site-config.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

type Config = Record<string, string | number | null | undefined>;

const SECTIONS: { title: string; fields: { name: string; label: string; type?: string }[] }[] = [
  {
    title: "General",
    fields: [
      { name: "storeName", label: "Nombre de la tienda" },
      { name: "logoUrl", label: "URL del logo", type: "url" },
    ],
  },
  {
    title: "Banner principal",
    fields: [
      { name: "heroTitle", label: "Título" },
      { name: "heroSubtitle", label: "Subtítulo" },
      { name: "heroImageUrl", label: "URL de imagen de fondo", type: "url" },
      { name: "heroCtaText", label: "Texto del botón" },
      { name: "heroCtaUrl", label: "Enlace del botón" },
    ],
  },
  {
    title: "Contacto",
    fields: [
      { name: "contactEmail", label: "Correo", type: "email" },
      { name: "contactPhone", label: "Teléfono" },
      { name: "whatsapp", label: "WhatsApp" },
      { name: "address", label: "Dirección física" },
    ],
  },
  {
    title: "Redes sociales",
    fields: [
      { name: "facebookUrl", label: "Facebook", type: "url" },
      { name: "instagramUrl", label: "Instagram", type: "url" },
      { name: "xUrl", label: "X (Twitter)", type: "url" },
      { name: "youtubeUrl", label: "YouTube", type: "url" },
      { name: "tiktokUrl", label: "TikTok", type: "url" },
      { name: "linkedinUrl", label: "LinkedIn", type: "url" },
    ],
  },
  {
    title: "Envíos",
    fields: [
      { name: "flatShippingFee", label: "Tarifa fija de envío (COP)", type: "number" },
      { name: "freeShippingThreshold", label: "Envío gratis desde (COP, vacío = nunca)", type: "number" },
    ],
  },
];

export function SiteConfigForm({ config }: { config: Config }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateSiteConfigAction, { ok: false });
  const errors = state.fieldErrors ?? {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault(); // evita el reset automático de React 19 si hay errores
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-6"
    >
      {SECTIONS.map((section) => (
        <section key={section.title} className="card p-6">
          <h2 className="mb-4 font-semibold">{section.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <FormField
                key={f.name}
                name={f.name}
                label={f.label}
                type={f.type ?? "text"}
                defaultValue={config[f.name] ?? ""}
                errors={errors[f.name]}
                {...(f.type === "number" ? { min: 0, step: "1" } : {})}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-4">
        <button className="btn-primary" disabled={isPending}>{isPending ? "Guardando…" : "Guardar configuración"}</button>
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-brand-700" : "text-rose-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
