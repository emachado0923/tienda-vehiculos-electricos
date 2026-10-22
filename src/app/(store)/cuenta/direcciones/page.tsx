import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { deleteAddressAction } from "@/actions/account.actions";
import { AddressForm } from "./address-form";

export const metadata: Metadata = { title: "Mis direcciones" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        {addresses.length === 0 && <p className="text-sm text-slate-500">No tienes direcciones guardadas.</p>}
        {addresses.map((a) => (
          <div key={a.id} className="card p-5 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <b>{a.label ?? "Dirección"}</b>
              {a.isDefault && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Predeterminada</span>}
            </div>
            <p>{a.fullName} · {a.phone}</p>
            <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
            <p>{a.city}, {a.state}</p>
            <form action={deleteAddressAction} className="mt-3">
              <input type="hidden" name="id" value={a.id} />
              <button className="text-xs text-rose-600 hover:underline">Eliminar</button>
            </form>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Agregar dirección</h2>
        <AddressForm />
      </section>
    </div>
  );
}
