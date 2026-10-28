import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireAbandonedOrders } from "@/lib/services/orders";

/**
 * POST /api/cron/expire-orders
 * Cancela pedidos sin pagar y devuelve su stock. Lo invoca Cloud Scheduler
 * (ver README → "Pedidos abandonados") con `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";

  const a = Buffer.from(given);
  const b = Buffer.from(secret ?? "");
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(await expireAbandonedOrders());
}
