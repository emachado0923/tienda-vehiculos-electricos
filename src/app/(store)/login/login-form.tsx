"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(loginAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/cuenta"} />
      <FormField label="Correo electrónico" name="email" type="email" autoComplete="email" required errors={state.fieldErrors?.email} />
      <FormField label="Contraseña" name="password" type="password" autoComplete="current-password" required errors={state.fieldErrors?.password} />
      {state.message && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{state.message}</p>}
      <button className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
