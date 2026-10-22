"use client";

import { useActionState } from "react";
import { addAddressAction } from "@/actions/account.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

export function AddressForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addAddressAction, { ok: false });
  const e = state.fieldErrors ?? {};

  return (
    // `key` reinicia el formulario después de guardar con éxito
    <form key={state.ok ? Date.now() : "form"} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <FormField label="Etiqueta (Casa, Oficina…)" name="label" errors={e.label} />
      <FormField label="Nombre completo" name="fullName" required errors={e.fullName} />
      <FormField label="Teléfono" name="phone" type="tel" required errors={e.phone} />
      <FormField label="Dirección" name="line1" required errors={e.line1} />
      <FormField label="Complemento (opcional)" name="line2" errors={e.line2} />
      <FormField label="Ciudad" name="city" required errors={e.city} />
      <FormField label="Departamento" name="state" required errors={e.state} />
      <FormField label="Código postal" name="postalCode" errors={e.postalCode} />
      <input type="hidden" name="country" value="CO" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" className="accent-brand-600" /> Predeterminada
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={isPending}>{isPending ? "Guardando…" : "Guardar dirección"}</button>
        {state.ok && state.message && <span className="text-sm text-brand-700">{state.message}</span>}
      </div>
    </form>
  );
}
