import "server-only";
import { after } from "next/server";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import { orderConfirmationEmail } from "@/lib/email/templates";
import { fetchLatestTransactionByReference, isWompiEnabled, toCents, type WompiTransaction } from "@/lib/payments/wompi";

const METHOD_BY_WOMPI: Record<string, PaymentMethod> = { CARD: "CARD", PSE: "PSE" };

/**
 * Aplica el resultado de una transacción de Wompi al pedido (`reference` = order.id).
 * Idempotente: el webhook y la página de retorno pueden llamarla varias veces.
 *
 * - APPROVED → pedido PAID + correo de confirmación (una sola vez).
 * - DECLINED/VOIDED/ERROR → pago DECLINED; el stock sigue reservado para que el
 *   cliente pueda reintentar. El admin puede cancelar el pedido (devuelve stock).
 */
export async function applyWompiTransaction(tx: WompiTransaction): Promise<void> {
  if (tx.status === "PENDING") return;

  const order = await prisma.order.findUnique({
    where: { id: tx.reference },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) return;

  // Defensa: el monto de la transacción debe coincidir con el del pedido
  if (tx.amount_in_cents !== toCents(Number(order.total))) {
    console.error(`[wompi] monto no coincide para el pedido ${order.id}`);
    return;
  }

  const method = METHOD_BY_WOMPI[tx.payment_method_type ?? ""] ?? order.paymentMethod;

  if (tx.status === "APPROVED") {
    // Solo la primera llamada cambia el estado (count = 1) y envía el correo
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: PaymentStatus.APPROVED } },
      data: {
        paymentStatus: PaymentStatus.APPROVED,
        status: order.status === OrderStatus.PENDING ? OrderStatus.PAID : order.status,
        paymentMethod: method,
        paymentRef: tx.id,
      },
    });
    if (count > 0) {
      const confirmed = { ...order, paymentStatus: PaymentStatus.APPROVED, paymentMethod: method };
      after(() => sendEmail(orderConfirmationEmail(order.user.email, confirmed)));
    }
    return;
  }

  await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: PaymentStatus.PENDING },
    data: { paymentStatus: PaymentStatus.DECLINED, paymentMethod: method, paymentRef: tx.id },
  });
}

/**
 * Sincroniza un pedido con PAGO PENDIENTE consultando a Wompi por su referencia.
 * Cubre el caso en que el webhook no llega (p. ej. desarrollo local sin túnel).
 */
export async function syncPendingPayment(orderId: string): Promise<void> {
  if (!isWompiEnabled()) return;
  const tx = await fetchLatestTransactionByReference(orderId);
  if (tx) await applyWompiTransaction(tx);
}
