"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(registerAction, { ok: false });
  const e = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">Guarda tus direcciones y sigue tus pedidos.</p>
        <form action={formAction} className="space-y-4">
          <FormField label="Nombre" name="name" autoComplete="name" required errors={e.name} />
          <FormField label="Correo electrónico" name="email" type="email" autoComplete="email" required errors={e.email} />
          <FormField label="Contraseña" name="password" type="password" autoComplete="new-password" required minLength={8} errors={e.password} />
          <FormField label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" required errors={e.confirmPassword} />
          {state.message && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p>}
          <button className="btn-primary w-full" disabled={isPending}>
            {isPending ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">Ingresa</Link>
        </p>
      </div>
    </div>
  );
}
