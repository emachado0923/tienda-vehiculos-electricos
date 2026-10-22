import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [productCount, lowStock, pendingOrders, revenue, recentOrders] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "APPROVED" } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true } } } }),
  ]);

  const stats = [
    { label: "Ventas aprobadas", value: formatPrice(Number(revenue._sum.total ?? 0)) },
    { label: "Pedidos por despachar", value: pendingOrders },
    { label: "Productos activos", value: productCount },
    { label: "Stock bajo (≤ 5)", value: lowStock },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Resumen</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-semibold">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm text-brand-700 hover:underline">Ver todos</Link>
        </div>
        <ul className="divide-y divide-slate-100 text-sm">
          {recentOrders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-4 p-4">
              <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand-700">#{o.number}</Link>
              <span className="flex-1 truncate text-slate-500">{o.user.email}</span>
              <span>{formatDate(o.createdAt)}</span>
              <span className="font-medium">{formatPrice(Number(o.total))}</span>
              <OrderStatusBadge status={o.status} />
            </li>
          ))}
          {recentOrders.length === 0 && <li className="p-4 text-slate-500">Sin pedidos todavía.</li>}
        </ul>
      </section>
    </div>
  );
}
