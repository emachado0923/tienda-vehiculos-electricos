import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction } from "@/actions/order.actions";
import { OrderDetail } from "@/components/order/order-detail";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/pedidos" className="text-sm text-brand-700 hover:underline">← Volver a pedidos</Link>
      <p className="text-sm text-slate-500">Cliente: {order.user.name} ({order.user.email})</p>

      {/* Actualización de estado de envío */}
      <form action={updateOrderStatusAction} className="card grid gap-4 p-5 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="orderId" value={order.id} />
        <div>
          <label htmlFor="status" className="label">Estado</label>
          <select id="status" name="status" defaultValue={order.status} className="input">
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="carrier" className="label">Transportadora</label>
          <input id="carrier" name="carrier" defaultValue={order.carrier ?? ""} placeholder="Servientrega, Coordinadora…" className="input" />
        </div>
        <div>
          <label htmlFor="trackingNumber" className="label">N.º de guía</label>
          <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" />
        </div>
        <button className="btn-primary">Actualizar</button>
      </form>

      <OrderDetail order={order} />
    </div>
  );
}
