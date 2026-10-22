import type { Order, OrderItem } from "@prisma/client";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/utils";

type ShippingAddress = {
  fullName: string; phone: string; line1: string; line2?: string;
  city: string; state: string; postalCode?: string; country: string;
};

/** Detalle de pedido reutilizado en el panel de cliente y en el admin. */
export function OrderDetail({ order }: { order: Order & { items: OrderItem[] } }) {
  const addr = order.shippingAddress as ShippingAddress;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">Pedido #{order.number}</h2>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-slate-500">{formatDate(order.createdAt)}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5 text-sm">
          <h3 className="mb-2 font-semibold">Envío</h3>
          <p>{addr.fullName} · {addr.phone}</p>
          <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
          <p>{addr.city}, {addr.state} {addr.postalCode} — {addr.country}</p>
          {order.trackingNumber && (
            <p className="mt-2 font-medium">Guía: {order.carrier} {order.trackingNumber}</p>
          )}
        </div>
        <div className="card p-5 text-sm">
          <h3 className="mb-2 font-semibold">Pago</h3>
          <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          <p>Estado: {order.paymentStatus}</p>
          {order.paymentRef && <p className="text-xs text-slate-500">Ref: {order.paymentRef}</p>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Cant.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{i.title}</p>
                  <p className="text-xs text-slate-500">SKU {i.sku}</p>
                </td>
                <td className="px-4 py-3">{formatPrice(Number(i.unitPrice))}</td>
                <td className="px-4 py-3">{i.quantity}</td>
                <td className="px-4 py-3 text-right">{formatPrice(Number(i.unitPrice) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr><td colSpan={3} className="px-4 pt-3 text-right text-slate-500">Subtotal</td><td className="px-4 pt-3 text-right">{formatPrice(Number(order.subtotal))}</td></tr>
            <tr><td colSpan={3} className="px-4 text-right text-slate-500">Envío</td><td className="px-4 text-right">{formatPrice(Number(order.shippingFee))}</td></tr>
            <tr className="font-bold"><td colSpan={3} className="px-4 pb-3 text-right">Total</td><td className="px-4 pb-3 text-right">{formatPrice(Number(order.total))}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
