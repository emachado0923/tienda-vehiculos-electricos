import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getSiteConfig } from "@/lib/queries/site-config";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser();
  const [addresses, config] = await Promise.all([
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
    getSiteConfig(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Finalizar compra</h1>
      <CheckoutForm
        savedAddresses={addresses.map(({ createdAt: _c, userId: _u, ...a }) => a)}
        shipping={{
          flatFee: Number(config.flatShippingFee),
          freeThreshold: config.freeShippingThreshold ? Number(config.freeShippingThreshold) : null,
        }}
      />
    </div>
  );
}
