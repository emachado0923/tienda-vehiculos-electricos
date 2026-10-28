import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { syncPendingPayment } from "@/lib/services/payments";
import { OrderDetail } from "@/components/order/order-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function CustomerOrderPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  // Filtrar por userId impide ver pedidos de otros clientes (IDOR)
  const find = () =>
    prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  let order = await find();
  if (!order) notFound();

  // Pago aún pendiente: verifica con la pasarela por si el webhook no llegó
  if (order.paymentStatus === "PENDING") {
    await syncPendingPayment(order.id);
    order = (await find()) ?? order;
  }

  return <OrderDetail order={order} />;
}
