import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type PageProps = { searchParams: Promise<{ pedido?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { pedido } = await searchParams;

  const order = await prisma.order.findFirst({
    where: { number: Number(pedido) || -1, userId: user.id },
  });

  if (!order) {
    return <p className="mx-auto max-w-xl px-4 py-24 text-center">Pedido no encontrado.</p>;
  }

  const approved = order.paymentStatus === "APPROVED";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl">{approved ? "✅" : "⚠️"}</span>
      <h1 className="text-3xl font-bold">{approved ? "¡Gracias por tu compra!" : "Pago rechazado"}</h1>
      <p className="text-slate-600">
        Pedido <b>#{order.number}</b> · {formatPrice(Number(order.total))} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
      </p>
      {!approved && <p className="text-sm text-rose-600">Tu pedido quedó pendiente. Contáctanos para completar el pago.</p>}
      <div className="flex gap-3">
        <Link href={`/cuenta/pedidos/${order.id}`} className="btn-primary">Ver pedido</Link>
        <Link href="/productos" className="btn-secondary">Seguir comprando</Link>
      </div>
    </div>
  );
}
