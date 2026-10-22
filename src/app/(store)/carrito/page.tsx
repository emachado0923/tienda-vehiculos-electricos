"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, ready, updateQuantity, removeItem } = useCart();

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Cargando carrito…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <Link href="/productos" className="btn-primary">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Carrito</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="card divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/productos/${item.slug}`} className="font-semibold hover:text-brand-700">{item.title}</Link>
                <span className="text-xs text-slate-500">SKU {item.sku}</span>
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 1)}
                    className="input w-20"
                    aria-label={`Cantidad de ${item.title}`}
                  />
                  <button onClick={() => removeItem(item.productId)} className="text-sm text-rose-600 hover:underline">
                    Quitar
                  </button>
                </div>
              </div>
              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-4 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-slate-500">El envío se calcula en el checkout.</p>
          <Link href="/checkout" className="btn-primary w-full">Ir a pagar</Link>
        </aside>
      </div>
    </div>
  );
}
