import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis pedidos" };

/** Historial de pedidos del cliente autenticado. */
export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
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
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Productos</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">
                <Link href={`/cuenta/pedidos/${o.id}`} className="text-brand-700 hover:underline">#{o.number}</Link>
              </td>
              <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
              <td className="px-4 py-3">{o._count.items}</td>
              <td className="px-4 py-3">{formatPrice(Number(o.total))}</td>
              <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
