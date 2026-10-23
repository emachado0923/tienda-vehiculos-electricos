import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = { title: "Seguridad" };

export default function SecurityPage() {
  return (
    <section className="card p-6">
      <h2 className="mb-1 text-lg font-semibold">Cambiar contraseña</h2>
      <p className="mb-6 text-sm text-slate-500">Te enviaremos un correo confirmando el cambio.</p>
      <ChangePasswordForm />
    </section>
  );
}
