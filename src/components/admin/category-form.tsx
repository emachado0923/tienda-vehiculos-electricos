"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { CategoryKind } from "@prisma/client";
import { saveCategoryAction } from "@/actions/category.actions";
import { FieldError, FormField } from "@/components/ui/form-field";
import { CATEGORY_KIND_LABELS } from "@/lib/constants";
import type { ActionState } from "@/types";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  kind: CategoryKind;
  description: string;
  imageUrl: string;
  parentId: string;
};

type Props = {
  initial?: CategoryFormValues;
  /** Categorías principales disponibles como madre (sin la propia). */
  parents: { id: string; name: string; kind: CategoryKind }[];
};

/** Formulario de creación/edición de categorías del dashboard. */
export function CategoryForm({ initial, parents }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(saveCategoryAction, { ok: false });
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? "EV_ACCESSORY");
  const e = state.fieldErrors ?? {};

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault(); // evita el reset automático de React 19 si hay errores
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="card max-w-2xl space-y-5 p-6"
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombre" name="name" defaultValue={initial?.name} required errors={e.name} />
        <FormField label="Slug (URL)" name="slug" defaultValue={initial?.slug} errors={e.slug} hint="Vacío = se genera del nombre" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="label">Línea</label>
          <select id="kind" name="kind" value={kind} onChange={(ev) => setKind(ev.target.value as CategoryKind)} className="input">
            {Object.entries(CATEGORY_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <FieldError errors={e.kind} />
        </div>
        <div>
          <label htmlFor="parentId" className="label">Categoría madre (opcional)</label>
          <select id="parentId" name="parentId" defaultValue={initial?.parentId ?? ""} className="input">
            <option value="">— Ninguna (principal) —</option>
            {parents.filter((p) => p.kind === kind).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <FieldError errors={e.parentId} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Descripción</label>
        <textarea id="description" name="description" rows={3} defaultValue={initial?.description} className="input" />
        <FieldError errors={e.description} />
      </div>

      <FormField
        label="Imagen (opcional)"
        name="imageUrl"
        defaultValue={initial?.imageUrl}
        errors={e.imageUrl}
        hint="URL https:// o ruta local, ej. /products/wallbox-trifasico-22kw.svg"
      />

      {state.message && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{state.message}</p>}

      <div className="flex gap-3">
        <button className="btn-primary" disabled={isPending}>
          {isPending ? "Guardando…" : initial?.id ? "Guardar cambios" : "Crear categoría"}
        </button>
        <Link href="/admin/categorias" className="btn-secondary">Cancelar</Link>
      </div>
    </form>
  );
}
