import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { fetchTransaction } from "@/lib/payments/wompi";
import { applyWompiTransaction, syncPendingPayment } from "@/lib/services/payments";

type PageProps = { searchParams: Promise<{ pedido?: string; id?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { pedido, id: transactionId } = await searchParams;

  let order = await prisma.order.findFirst({
    where: { number: Number(pedido) || -1, userId: user.id },
  });

  if (!order) {
    return <p className="mx-auto max-w-xl px-4 py-24 text-center">Pedido no encontrado.</p>;
  }

  // Wompi nos devuelve aquí con ?id=<transacción>. Si el webhook aún no llegó,
  // consultamos el estado directamente en Wompi (idempotente).
  if (order.paymentStatus === "PENDING") {
    const tx = transactionId ? await fetchTransaction(transactionId) : null;
    if (tx && tx.reference === order.id) await applyWompiTransaction(tx);
    else await syncPendingPayment(order.id); // sin ?id (redirect omitido en local)
    order = (await prisma.order.findUnique({ where: { id: order.id } })) ?? order;
  }

  const approved = order.paymentStatus === "APPROVED";
  const pending = order.paymentStatus === "PENDING";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl">{approved ? "✅" : pending ? "⏳" : "⚠️"}</span>
      <h1 className="text-3xl font-bold">{approved ? "¡Gracias por tu compra!" : pending ? "Pago en proceso" : "Pago rechazado"}</h1>
      <p className="text-slate-600">
        Pedido <b>#{order.number}</b> · {formatPrice(Number(order.total))} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
      </p>
      {pending && <p className="text-sm text-slate-600">Estamos esperando la confirmación de tu banco. Te avisaremos por correo cuando se apruebe.</p>}
      {!approved && !pending && <p className="text-sm text-rose-600">Tu pedido quedó pendiente. Contáctanos para completar el pago.</p>}
      <div className="flex gap-3">
        <Link href={`/cuenta/pedidos/${order.id}`} className="btn-primary">Ver pedido</Link>
        <Link href="/productos" className="btn-secondary">Seguir comprando</Link>
      </div>
    </div>
  );
}
