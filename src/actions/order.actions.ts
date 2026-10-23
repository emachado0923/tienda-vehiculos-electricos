"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendEmail } from "@/lib/email/mailer";
import { NOTIFIABLE_STATUSES, orderConfirmationEmail, orderStatusEmail } from "@/lib/email/templates";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { getSiteConfig } from "@/lib/queries/site-config";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { processMockPayment } from "@/lib/payments/mock-gateway";

type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: number }
  | { ok: false; message: string };

class CheckoutError extends Error {}

/**
 * Crea un pedido a partir del carrito del cliente.
 *  1. Valida el input (nunca confiamos en precios enviados por el cliente).
 *  2. En una transacción: relee precios/stock de BD, descuenta stock y crea el pedido.
 *  3. Procesa el pago (mock) y actualiza el estado.
 */
export async function placeOrderAction(input: CheckoutInput): Promise<PlaceOrderResult> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { items, address, paymentMethod, saveAddress } = parsed.data;
  const config = await getSiteConfig();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) }, isActive: true },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      });

      let subtotal = new Prisma.Decimal(0);
      const orderItems = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new CheckoutError("Un producto del carrito ya no está disponible.");
        subtotal = subtotal.add(product.price.mul(item.quantity));
        return {
          productId: product.id,
          title: product.title,
          sku: product.sku,
          imageUrl: product.images[0]?.url ?? null,
          unitPrice: product.price,
          quantity: item.quantity,
        };
      });

      // Descuento atómico de stock: solo actualiza si hay unidades suficientes
      for (const item of items) {
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          const title = products.find((p) => p.id === item.productId)?.title;
          throw new CheckoutError(`Stock insuficiente para "${title}".`);
        }
      }

      const freeShipping =
        config.freeShippingThreshold && subtotal.gte(config.freeShippingThreshold);
      const shippingFee = freeShipping ? new Prisma.Decimal(0) : config.flatShippingFee;

      if (saveAddress) {
        await tx.address.create({ data: { ...address, userId: user.id } });
      }

      return tx.order.create({
        data: {
          userId: user.id,
          paymentMethod,
          subtotal,
          shippingFee,
          total: subtotal.add(shippingFee),
          shippingAddress: address,
          items: { create: orderItems },
        },
      });
    });
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "No se pudo crear el pedido. Intenta de nuevo." };
  }

  // Pago simulado (reemplazar por Stripe / PayPal / Wompi-PSE en producción)
  const payment = await processMockPayment({
    amount: Number(order.total),
    method: paymentMethod,
    reference: order.id,
  });

  const finalOrder = await prisma.order.update({
    where: { id: order.id },
    data: payment.approved
      ? { paymentStatus: PaymentStatus.APPROVED, status: OrderStatus.PAID, paymentRef: payment.transactionId }
      : { paymentStatus: PaymentStatus.DECLINED, paymentRef: payment.transactionId },
    include: { items: true },
  });

  // after(): el correo se envía DESPUÉS de responder, sin hacer esperar al cliente
  if (user.email) {
    const to = user.email;
    after(() => sendEmail(orderConfirmationEmail(to, finalOrder)));
  }

  revalidatePath("/cuenta");
  revalidatePath("/admin/pedidos");
  return { ok: true, orderId: order.id, orderNumber: order.number };
}

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(OrderStatus),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
});

/** Admin: actualiza el estado de envío de un pedido. */
export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { orderId, status, carrier, trackingNumber } = parsed.data;

  const { previousStatus, updated } = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    // Al cancelar, devolvemos el stock (solo una vez)
    const restock =
      status === OrderStatus.CANCELLED && current.status !== OrderStatus.CANCELLED;
    if (restock) {
      for (const item of current.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
      },
      include: { user: { select: { email: true } } },
    });
    return { previousStatus: current.status, updated };
  });

  // Notifica al cliente solo si el estado cambió y es relevante para él
  if (status !== previousStatus && NOTIFIABLE_STATUSES.includes(status)) {
    const email = orderStatusEmail(updated.user.email, updated);
    if (email) after(() => sendEmail(email));
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}
