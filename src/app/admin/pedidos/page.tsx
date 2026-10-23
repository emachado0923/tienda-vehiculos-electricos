import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos" };

type PageProps = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;
  const filter = status && status in OrderStatus ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: {
      ...(filter ? { status: filter } : {}),
      ...(q ? { user: { OR: [{ email: { contains: q } }, { name: { contains: q } }] } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <form>
          {filter && <input type="hidden" name="status" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Buscar por cliente (nombre o correo)" className="input" />
        </form>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/pedidos" className={`rounded-full px-3 py-1 text-sm ${!filter ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}>
          Todos
        </Link>
        {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
          <Link key={value} href={`/admin/pedidos?status=${value}`} className={`rounded-full px-3 py-1 text-sm ${filter === value ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand-700 hover:underline">#{o.number}</Link>
                </td>
                <td className="px-4 py-3">{o.user.name ?? o.user.email}</td>
                <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">{PAYMENT_METHOD_LABELS[o.paymentMethod]} · {o.paymentStatus}</td>
                <td className="px-4 py-3">{formatPrice(Number(o.total))}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
