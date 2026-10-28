import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook, type WompiEvent } from "@/lib/payments/wompi";
import { applyWompiTransaction } from "@/lib/services/payments";

/**
 * POST /api/webhooks/wompi
 * Wompi notifica aquí cada cambio de estado de una transacción.
 * Configura esta URL en el panel de Wompi → Desarrolladores → URL de eventos.
 * Es pública: la autenticidad se valida con el checksum del evento.
 */
export async function POST(request: NextRequest) {
  const event = (await request.json().catch(() => null)) as WompiEvent | null;
  if (!event || !verifyWebhook(event)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const tx = event.data.transaction;
  if (event.event === "transaction.updated" && tx) {
    try {
      await applyWompiTransaction(tx);
    } catch (error) {
      console.error("[wompi] error aplicando el evento", error);
      // 500 → Wompi reintenta la entrega
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
