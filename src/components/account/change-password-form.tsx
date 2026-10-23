"use client";

import { startTransition, useActionState, useRef } from "react";
import { changePasswordAction } from "@/actions/account.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

/** Formulario de cambio de contraseña (reutilizado en /cuenta y /admin). */
export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await changePasswordAction(prev, formData);
      if (result.ok) formRef.current?.reset(); // limpiar solo si salió bien
      return result;
    },
    { ok: false },
  );
  const e = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      onSubmit={(ev) => {
        ev.preventDefault(); // evita el reset automático de React 19 si hay errores
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="max-w-md space-y-4"
    >
      <FormField label="Contraseña actual" name="currentPassword" type="password" autoComplete="current-password" required errors={e.currentPassword} />
      <FormField
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={e.newPassword}
        hint="Mínimo 8 caracteres, con letras y números."
      />
      <FormField label="Confirmar nueva contraseña" name="confirmPassword" type="password" autoComplete="new-password" required errors={e.confirmPassword} />
      {state.message && (
        <p className={`rounded-lg p-3 text-sm ${state.ok ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-700"}`} role="status">
          {state.message}
        </p>
      )}
      <button className="btn-primary" disabled={isPending}>{isPending ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
