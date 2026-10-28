import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Integración con Wompi (Bancolombia) — Web Checkout alojado.
 *
 * Flujo:
 *  1. Creamos el pedido (PENDING) y redirigimos al cliente a checkout.wompi.co
 *     con una firma de integridad (el monto no puede alterarse en el navegador).
 *  2. Wompi cobra (tarjeta, PSE, Nequi…) y notifica por WEBHOOK → /api/webhooks/wompi.
 *  3. Al volver a la tienda, `/checkout/exito` consulta la transacción por si el
 *     webhook aún no llegó.
 *
 * Variables: WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET, WOMPI_EVENTS_SECRET.
 * El ambiente (sandbox/producción) se deduce del prefijo de la llave pública.
 */

export type WompiTransaction = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  reference: string;
  amount_in_cents: number;
  payment_method_type?: string;
};

/** Hay pasarela real solo si están las llaves; si no, se usa el mock. */
export function isWompiEnabled(): boolean {
  return !!process.env.WOMPI_PUBLIC_KEY && !!process.env.WOMPI_INTEGRITY_SECRET;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const apiBase = () =>
  process.env.WOMPI_PUBLIC_KEY?.startsWith("pub_prod_")
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

/** Wompi trabaja en centavos: COP × 100. */
export const toCents = (amount: number) => Math.round(amount * 100);

/** URL del Web Checkout con la firma de integridad SHA-256. */
export function buildCheckoutUrl(params: {
  reference: string;
  amount: number;
  /** Wompi rechaza (403) redirecciones a localhost: en local se omite. */
  redirectUrl: string;
  email: string;
  fullName: string;
}): string {
  const cents = toCents(params.amount);
  const signature = sha256(`${params.reference}${cents}COP${process.env.WOMPI_INTEGRITY_SECRET}`);

  const url = new URL("https://checkout.wompi.co/p/");
  url.searchParams.set("public-key", process.env.WOMPI_PUBLIC_KEY!);
  url.searchParams.set("currency", "COP");
  url.searchParams.set("amount-in-cents", String(cents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("signature:integrity", signature);
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(params.redirectUrl)) {
    url.searchParams.set("redirect-url", params.redirectUrl);
  }
  url.searchParams.set("customer-data:email", params.email);
  url.searchParams.set("customer-data:full-name", params.fullName);
  return url.toString();
}

/** Consulta una transacción directamente en Wompi (fuente de verdad, no el query string). */
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${apiBase()}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: WompiTransaction };
  return json.data ?? null;
}

/** Última transacción asociada a un pedido (reference = order.id). */
export async function fetchLatestTransactionByReference(reference: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${apiBase()}/transactions?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: WompiTransaction[] };
  const txs = json.data ?? [];
  // Si hubo reintentos, preferimos una aprobada; si no, la primera (más reciente)
  return txs.find((t) => t.status === "APPROVED") ?? txs[0] ?? null;
}

type WompiEvent = {
  event: string;
  data: { transaction?: WompiTransaction } & Record<string, unknown>;
  signature?: { properties: string[]; checksum: string };
  timestamp: number;
};

/**
 * Verifica la autenticidad del webhook: SHA-256 de los valores listados en
 * `signature.properties` + timestamp + secreto de eventos.
 */
export function verifyWebhook(event: WompiEvent): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret || !event.signature) return false;

  const values = event.signature.properties.map((path) =>
    path.split(".").reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], event.data),
  );
  const expected = sha256(values.join("") + event.timestamp + secret);

  const a = Buffer.from(expected);
  const b = Buffer.from(event.signature.checksum.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export type { WompiEvent };
