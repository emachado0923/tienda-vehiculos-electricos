"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { CategoryKind, ConnectorType, InverterType, PanelType } from "@prisma/client";
import { saveProductAction } from "@/actions/product.actions";
import { FieldError, FormField } from "@/components/ui/form-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { CONNECTOR_LABELS, INVERTER_LABELS, PANEL_LABELS } from "@/lib/constants";
import type { ActionState } from "@/types";

/** Valores planos (serializables) para precargar el formulario en modo edición. */
export type ProductFormValues = {
  id?: string;
  title: string;
  sku: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  connectorType: ConnectorType | null;
  powerKw: number | null;
  panelType: PanelType | null;
  inverterType: InverterType | null;
  images: string[];
  specs: Record<string, string>;
};

type Props = {
  categories: { id: string; name: string; kind: CategoryKind }[];
  initial?: ProductFormValues;
};

type SpecRow = { key: string; value: string };

/**
 * Formulario de creación/edición de productos del dashboard.
 * - Server Action `saveProductAction` vía useActionState (validación Zod en servidor).
 * - Los campos técnicos se muestran según la línea de la categoría elegida.
 * - Especificaciones técnicas dinámicas (clave/valor).
 */
export function ProductForm({ categories, initial }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(saveProductAction, { ok: false });
  const errors = state.fieldErrors ?? {};

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [specs, setSpecs] = useState<SpecRow[]>(() => {
    const rows = Object.entries(initial?.specs ?? {}).map(([key, value]) => ({ key, value }));
    return rows.length ? rows : [{ key: "", value: "" }];
  });

  const kind = categories.find((c) => c.id === categoryId)?.kind;

  /**
   * Enviamos manualmente (preventDefault) para que React 19 NO resetee los
   * campos no controlados cuando el servidor devuelve errores de validación.
   */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      {/* -------- Columna principal -------- */}
      <div className="space-y-6 lg:col-span-2">
        <Section title="Información general">
          <FormField label="Título" name="title" defaultValue={initial?.title} required errors={errors.title} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="SKU" name="sku" defaultValue={initial?.sku} required errors={errors.sku} hint="Ej: EVC-T2-7KW" />
            <FormField label="Slug (URL)" name="slug" defaultValue={initial?.slug} errors={errors.slug} hint="Vacío = se genera automáticamente" />
          </div>
          <FormField label="Marca" name="brand" defaultValue={initial?.brand} errors={errors.brand} />
          <div>
            <label htmlFor="shortDescription" className="label">Descripción corta</label>
            <input id="shortDescription" name="shortDescription" maxLength={300} defaultValue={initial?.shortDescription} className="input" />
            <FieldError errors={errors.shortDescription} />
          </div>
          <div>
            <label htmlFor="description" className="label">Descripción completa</label>
            <textarea id="description" name="description" rows={6} required defaultValue={initial?.description} className="input" />
            <FieldError errors={errors.description} />
          </div>
        </Section>

        <Section title="Imágenes">
          <ImageUploader name="images" defaultValue={initial?.images} error={errors.images?.[0]} />
        </Section>

        <Section title="Especificaciones técnicas">
          {/* Atributos indexados que alimentan los filtros del catálogo */}
          {kind !== "RENEWABLE_ENERGY" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tipo de conector" name="connectorType" defaultValue={initial?.connectorType ?? ""} options={CONNECTOR_LABELS} errors={errors.connectorType} />
              <FormField label="Potencia (kW)" name="powerKw" type="number" step="0.01" min="0" defaultValue={initial?.powerKw ?? ""} errors={errors.powerKw} />
            </div>
          )}
          {kind !== "EV_ACCESSORY" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tipo de panel" name="panelType" defaultValue={initial?.panelType ?? ""} options={PANEL_LABELS} errors={errors.panelType} />
              <Select label="Tipo de inversor" name="inverterType" defaultValue={initial?.inverterType ?? ""} options={INVERTER_LABELS} errors={errors.inverterType} />
              {kind === "RENEWABLE_ENERGY" && (
                <FormField label="Potencia nominal (kW)" name="powerKw" type="number" step="0.01" min="0" defaultValue={initial?.powerKw ?? ""} errors={errors.powerKw} />
              )}
            </div>
          )}

          {/* Especificaciones libres clave/valor */}
          <div className="space-y-2">
            <p className="label">Otras especificaciones</p>
            {specs.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="specKey"
                  placeholder="Ej: Longitud del cable"
                  value={row.key}
                  onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                  className="input"
                />
                <input
                  name="specValue"
                  placeholder="Ej: 5 m"
                  value={row.value}
                  onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setSpecs((s) => (s.length > 1 ? s.filter((_, j) => j !== i) : [{ key: "", value: "" }]))}
                  className="btn-secondary px-3"
                  aria-label="Quitar especificación"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])} className="text-sm font-medium text-brand-700 hover:underline">
              + Agregar especificación
            </button>
          </div>
        </Section>
      </div>

      {/* -------- Columna lateral -------- */}
      <div className="space-y-6">
        <Section title="Organización">
          <div>
            <label htmlFor="categoryId" className="label">Categoría</label>
            <select id="categoryId" name="categoryId" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="" disabled>Selecciona…</option>
              <optgroup label="Accesorios EV">
                {categories.filter((c) => c.kind === "EV_ACCESSORY").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Energía renovable">
                {categories.filter((c) => c.kind === "RENEWABLE_ENERGY").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            </select>
            <FieldError errors={errors.categoryId} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4 accent-brand-600" />
            Visible en la tienda
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured ?? false} className="h-4 w-4 accent-brand-600" />
            Destacado en la portada
          </label>
        </Section>

        <Section title="Precio e inventario">
          <FormField label="Precio (COP)" name="price" type="number" step="0.01" min="0" required defaultValue={initial?.price} errors={errors.price} />
          <FormField label="Precio anterior (opcional)" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={initial?.compareAtPrice ?? ""} errors={errors.compareAtPrice} hint="Se muestra tachado como descuento" />
          <FormField label="Stock" name="stock" type="number" min="0" step="1" required defaultValue={initial?.stock ?? 0} errors={errors.stock} />
        </Section>

        {state.message && (
          <p className={`rounded-lg p-3 text-sm ${state.ok ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-700"}`} role="alert">
            {state.message}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={isPending} className="btn-primary flex-1">
            {isPending ? "Guardando…" : initial?.id ? "Guardar cambios" : "Crear producto"}
          </button>
          <Link href="/admin/productos" className="btn-secondary">Cancelar</Link>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Select({
  label, name, options, defaultValue, errors,
}: { label: string; name: string; options: Record<string, string>; defaultValue: string; errors?: string[] }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue} className="input">
        <option value="">— No aplica —</option>
        {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      <FieldError errors={errors} />
    </div>
  );
}
