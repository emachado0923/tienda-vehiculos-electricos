"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

/** Icono del carrito con contador para el header. */
export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/carrito"
      className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100"
      aria-label={`Carrito (${count} productos)`}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
