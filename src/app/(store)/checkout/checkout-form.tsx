"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Address, PaymentMethod } from "@prisma/client";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrderAction } from "@/actions/order.actions";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type SavedAddress = Omit<Address, "createdAt" | "userId">;

type Props = {
  savedAddresses: SavedAddress[];
  shipping: { flatFee: number; freeThreshold: number | null };
  /** "wompi" = pago real en checkout alojado; "mock" = demostración */
  gateway: "wompi" | "mock";
};

const EMPTY_ADDRESS = {
  fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "CO",
};

export function CheckoutForm({ savedAddresses, shipping, gateway }: Props) {
  const router = useRouter();
  const { items, subtotal, clear, ready } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultAddr = savedAddresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddr?.id ?? "new");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");

  // Estimación en cliente; el servidor recalcula el total definitivo
  const shippingFee =
    shipping.freeThreshold !== null && subtotal >= shipping.freeThreshold ? 0 : shipping.flatFee;

  if (ready && items.length === 0) {
    return <p className="text-slate-600">Tu carrito está vacío.</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selected = savedAddresses.find((a) => a.id === addressId);
    const shippingAddress = selected
      ? {
          fullName: selected.fullName, phone: selected.phone, line1: selected.line1,
          line2: selected.line2 ?? undefined, city: selected.city, state: selected.state,
          postalCode: selected.postalCode ?? undefined, country: selected.country,
        }
      : address;

    startTransition(async () => {
      const result = await placeOrderAction({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: shippingAddress,
        paymentMethod,
        saveAddress: !selected && saveAddress,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      clear();
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl); // checkout de Wompi
        return;
      }
      router.push(`/checkout/exito?pedido=${result.orderNumber}`);
    });
  }

  const field = (name: keyof typeof EMPTY_ADDRESS, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name}
        className="input"
        value={address[name]}
        onChange={(e) => setAddress((a) => ({ ...a, [name]: e.target.value }))}
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* 1. Dirección */}
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">1. Dirección de envío</h2>
          {savedAddresses.length > 0 && (
            <div className="mb-4 space-y-2">
              {savedAddresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 has-checked:border-brand-500 has-checked:bg-brand-50">
                  <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="accent-brand-600" />
                  <span className="text-sm">
                    <b>{a.label ?? a.fullName}</b> — {a.line1}, {a.city}, {a.state}
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 has-checked:border-brand-500 has-checked:bg-brand-50">
                <input type="radio" name="addr" checked={addressId === "new"} onChange={() => setAddressId("new")} className="accent-brand-600" />
                <span className="text-sm font-medium">Usar una nueva dirección</span>
              </label>
            </div>
          )}

          {addressId === "new" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("fullName", "Nombre completo", { required: true, autoComplete: "name" })}
              {field("phone", "Teléfono", { required: true, type: "tel", autoComplete: "tel" })}
              <div className="sm:col-span-2">{field("line1", "Dirección", { required: true, autoComplete: "address-line1" })}</div>
              <div className="sm:col-span-2">{field("line2", "Apto / Torre / Referencia (opcional)")}</div>
              {field("city", "Ciudad", { required: true })}
              {field("state", "Departamento", { required: true })}
              {field("postalCode", "Código postal (opcional)")}
              <label className="flex items-center gap-2 self-end text-sm">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-brand-600" />
                Guardar en mi libreta de direcciones
              </label>
            </div>
          )}
        </section>

        {/* 2. Pago (simulado) */}
        <section className="card p-6">
          <h2 className="mb-1 text-lg font-semibold">2. Método de pago</h2>
          {gateway === "wompi" ? (
            <p className="text-sm text-slate-600">
              Al continuar te llevaremos al pago seguro de Wompi, donde podrás pagar con tarjeta de
              crédito/débito, PSE o Nequi. No almacenamos datos de tu tarjeta.
            </p>
          ) : (
            <p className="mb-4 text-xs text-amber-700">
              Modo demostración: no se realiza ningún cobro real.
            </p>
          )}
          <div className={gateway === "wompi" ? "hidden" : "grid gap-3 sm:grid-cols-2"}>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <label key={m} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 has-checked:border-brand-500 has-checked:bg-brand-50">
                <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-brand-600" />
                <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[m]}</span>
              </label>
            ))}
          </div>
          {gateway === "mock" && paymentMethod === "CARD" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input className="input sm:col-span-3" placeholder="4242 4242 4242 4242" inputMode="numeric" aria-label="Número de tarjeta (demo)" />
              <input className="input" placeholder="MM/AA" aria-label="Vencimiento (demo)" />
              <input className="input" placeholder="CVC" aria-label="CVC (demo)" />
            </div>
          )}
          {gateway === "mock" && paymentMethod === "PSE" && (
            <select className="input mt-4" aria-label="Banco (demo)" defaultValue="">
              <option value="" disabled>Selecciona tu banco</option>
              <option>Bancolombia</option><option>Banco de Bogotá</option><option>Davivienda</option><option>BBVA</option><option>Nequi</option>
            </select>
          )}
        </section>
      </div>

      {/* Resumen */}
      <aside className="card h-fit space-y-3 p-6">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2">
              <span className="text-slate-600">{i.quantity} × {i.title}</span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span>Envío</span><span>{shippingFee === 0 ? "Gratis" : formatPrice(shippingFee)}</span></div>
          <div className="flex justify-between pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(subtotal + shippingFee)}</span></div>
        </div>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
        <button type="submit" disabled={isPending || !ready} className="btn-primary w-full">
          {isPending ? "Procesando…" : gateway === "wompi" ? "Continuar al pago" : "Pagar ahora"}
        </button>
      </aside>
    </form>
  );
}
