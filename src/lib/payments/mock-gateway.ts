import "server-only";
import type { PaymentMethod } from "@prisma/client";

/**
 * Pasarela de pagos SIMULADA.
 *
 * Mantiene la misma forma que tendría una integración real para que el
 * reemplazo sea directo:
 *  - CARD / STRIPE → Stripe Checkout / PaymentIntents (+ webhook)
 *  - PSE           → Wompi, ePayco o PayU (redirección al banco + webhook)
 *  - PAYPAL        → PayPal Orders API v2
 *
 * En producción el estado final del pago debe confirmarse por WEBHOOK,
 * no por la respuesta síncrona.
 */
export type PaymentRequest = {
  amount: number;
  method: PaymentMethod;
  reference: string;
};

export type PaymentResult = {
  approved: boolean;
  transactionId: string;
};

export async function processMockPayment(req: PaymentRequest): Promise<PaymentResult> {
  // Simula latencia de red de la pasarela
  await new Promise((r) => setTimeout(r, 600));

  // Regla de prueba: montos terminados en 13 pesos son rechazados
  const approved = Math.round(req.amount) % 100 !== 13;

  return {
    approved,
    transactionId: `MOCK-${req.method}-${Date.now().toString(36).toUpperCase()}`,
  };
}
