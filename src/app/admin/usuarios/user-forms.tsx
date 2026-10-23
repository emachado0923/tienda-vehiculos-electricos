"use client";

import { startTransition, useActionState, useRef } from "react";
import { createUserAction, setUserPasswordAction } from "@/actions/user.actions";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types";

/** Formulario para crear un cliente o administrador. */
export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await createUserAction(prev, fd);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    { ok: false },
  );
  const e = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start"
    >
      <FormField label="Nombre" name="name" required errors={e.name} />
      <FormField label="Correo" name="email" type="email" required errors={e.email} />
      <FormField label="Contraseña" name="password" type="password" autoComplete="new-password" required errors={e.password} hint="8+ caracteres, letras y números" />
      <div>
        <label htmlFor="role" className="label">Rol</label>
        <select id="role" name="role" defaultValue="CUSTOMER" className="input">
          <option value="CUSTOMER">Cliente</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button className="btn-primary" disabled={isPending}>{isPending ? "Creando…" : "Crear usuario"}</button>
        {state.message && <span className={`text-sm ${state.ok ? "text-brand-700" : "text-rose-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}

/** Formulario compacto para asignar una nueva contraseña a otro usuario. */
export function SetPasswordForm({ userId }: { userId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await setUserPasswordAction(prev, fd);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    { ok: false },
  );

  return (
    <form
      ref={formRef}
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="max-w-xs space-y-1"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex gap-2">
        <input name="password" type="password" autoComplete="new-password" placeholder="Nueva contraseña" required minLength={8} className="input py-1.5" aria-label="Nueva contraseña" />
        <button className="btn-secondary px-3 py-1.5 text-xs" disabled={isPending}>{isPending ? "…" : "Asignar"}</button>
      </div>
      {state.message && <p className={`text-xs ${state.ok ? "text-brand-700" : "text-rose-600"}`}>{state.message}</p>}
    </form>
  );
}
