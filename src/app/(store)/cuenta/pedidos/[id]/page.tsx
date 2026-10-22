import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { OrderDetail } from "@/components/order/order-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function CustomerOrderPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  // Filtrar por userId impide ver pedidos de otros clientes (IDOR)
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return <OrderDetail order={order} />;
}
