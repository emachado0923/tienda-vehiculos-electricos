import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis pedidos" };

/** Historial de pedidos del cliente: cada pedido lista sus productos con cantidad y precio. */
export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">Aún no tienes pedidos.</p>
        <Link href="/productos" className="btn-primary mt-4">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <article key={o.id} className="card overflow-hidden">
          <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <Link href={`/cuenta/pedidos/${o.id}`} className="font-semibold text-brand-700 hover:underline">
              Pedido #{o.number}
            </Link>
            <span className="text-slate-500">{formatDate(o.createdAt)}</span>
            <OrderStatusBadge status={o.status} />
            <span className="ml-auto font-bold">{formatPrice(Number(o.total))}</span>
          </header>

          <ul className="divide-y divide-slate-100">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {i.imageUrl && <Image src={i.imageUrl} alt={i.title} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-slate-500">
                    {i.quantity} × {formatPrice(Number(i.unitPrice))}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatPrice(Number(i.unitPrice) * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Subtotal {formatPrice(Number(o.subtotal))} · Envío{" "}
              {Number(o.shippingFee) === 0 ? "gratis" : formatPrice(Number(o.shippingFee))}
            </span>
            <Link href={`/cuenta/pedidos/${o.id}`} className="font-medium text-brand-700 hover:underline">
              Ver detalle →
            </Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
