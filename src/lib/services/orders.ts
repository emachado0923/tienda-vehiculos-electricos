import "server-only";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncPendingPayment } from "@/lib/services/payments";

/** Horas que un pedido sin pagar conserva el stock reservado. */
export const ORDER_HOLD_HOURS = 2;

/**
 * Cancela los pedidos sin pagar tras `ORDER_HOLD_HOURS` y devuelve su stock.
 * Antes de cancelar consulta a la pasarela: si el pago llegó tarde (webhook perdido),
 * el pedido se marca como pagado y no se cancela.
 */
export async function expireAbandonedOrders(): Promise<{ checked: number; cancelled: number }> {
  const cutoff = new Date(Date.now() - ORDER_HOLD_HOURS * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING, paymentStatus: { not: PaymentStatus.APPROVED }, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 200,
  });

  let cancelled = 0;
  for (const { id } of stale) {
    await syncPendingPayment(id);

    const didCancel = await prisma.$transaction(async (tx) => {
      // updateMany condicional: si el pago se aprobó entre tanto, count = 0 y no se toca nada
      const { count } = await tx.order.updateMany({
        where: { id, status: OrderStatus.PENDING, paymentStatus: { not: PaymentStatus.APPROVED } },
        data: { status: OrderStatus.CANCELLED },
      });
      if (count === 0) return false;

      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return true;
    });
    if (didCancel) cancelled++;
  }
  return { checked: stale.length, cancelled };
}
