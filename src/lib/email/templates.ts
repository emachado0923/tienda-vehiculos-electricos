import "server-only";
import type { Order, OrderItem, OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { EmailMessage } from "./mailer";

/**
 * Plantillas de correo. HTML con estilos en línea y tablas: es lo que
 * soportan de forma fiable Gmail, Outlook y los clientes móviles.
 */

const APP_URL = () => (process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Escapa texto de usuario (nombres, títulos) antes de insertarlo en HTML. */
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f1ec;font-family:Segoe UI,Arial,sans-serif;color:#1b1f3b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#1b1f3b;padding:20px 28px">
          <span style="color:#ffffff;font-weight:900;letter-spacing:1px;font-size:24px">EMC</span>
          <span style="color:#cbd5e1;font-weight:500;letter-spacing:4px;font-size:11px;margin-left:8px">POSITIVE ENERGY</span>
        </td></tr>
        <tr><td style="padding:28px">${body}</td></tr>
        <tr><td style="padding:18px 28px;background:#faf8f5;color:#64748b;font-size:12px">
          Accesorios para vehículos eléctricos — <a href="${APP_URL()}" style="color:#bb3512">${APP_URL().replace(/^https?:\/\//, "")}</a><br>
          Recibes este correo por una acción en tu cuenta de EMC Positive Energy.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f4572b;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px">${esc(label)}</a>`;

type ShippingAddress = { fullName: string; line1: string; line2?: string; city: string; state: string; phone: string };
type OrderWithItems = Order & { items: OrderItem[] };

// ---------------------------------------------------------------------------

export function welcomeEmail(to: string, name: string): EmailMessage {
  return {
    to,
    subject: "¡Bienvenido a EMC Positive Energy!",
    text: `Hola ${name}, tu cuenta en EMC Positive Energy está lista. Explora el catálogo en ${APP_URL()}/productos`,
    html: layout(
      "Bienvenido",
      `<h1 style="margin:0 0 12px;font-size:22px">¡Hola, ${esc(name)}! ⚡</h1>
       <p style="line-height:1.6">Tu cuenta está lista. Ya puedes comprar cargadores, adaptadores, cables y soluciones solares, guardar tus direcciones y seguir tus pedidos.</p>
       <p style="margin:24px 0">${button(`${APP_URL()}/productos`, "Ver catálogo")}</p>`,
    ),
  };
}

export function passwordChangedEmail(to: string, name: string | null): EmailMessage {
  return {
    to,
    subject: "Tu contraseña fue cambiada",
    text: `Hola ${name ?? ""}, la contraseña de tu cuenta EMC Positive Energy fue cambiada. Si no fuiste tú, contáctanos de inmediato.`,
    html: layout(
      "Contraseña cambiada",
      `<h1 style="margin:0 0 12px;font-size:22px">Tu contraseña fue cambiada</h1>
       <p style="line-height:1.6">Hola ${esc(name ?? "")}, te confirmamos que la contraseña de tu cuenta se cambió el ${new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" })}.</p>
       <p style="line-height:1.6;color:#b91c1c"><b>¿No fuiste tú?</b> Responde a este correo o contáctanos de inmediato.</p>`,
    ),
  };
}

export function orderConfirmationEmail(to: string, order: OrderWithItems): EmailMessage {
  const addr = order.shippingAddress as ShippingAddress;
  const approved = order.paymentStatus === "APPROVED";
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)}<br><span style="color:#64748b;font-size:12px">SKU ${esc(i.sku)} · ${i.quantity} × ${formatPrice(Number(i.unitPrice))}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatPrice(Number(i.unitPrice) * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  return {
    to,
    subject: approved ? `Pedido #${order.number} confirmado` : `Pedido #${order.number} recibido — pago pendiente`,
    text: `Pedido #${order.number}. Total ${formatPrice(Number(order.total))}. ${approved ? "Pago aprobado." : "El pago no fue aprobado; contáctanos para completarlo."} Detalle: ${APP_URL()}/cuenta/pedidos/${order.id}`,
    html: layout(
      `Pedido #${order.number}`,
      `<h1 style="margin:0 0 6px;font-size:22px">${approved ? "¡Gracias por tu compra!" : "Recibimos tu pedido"}</h1>
       <p style="margin:0 0 18px;color:#64748b">Pedido <b>#${order.number}</b> · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
       ${approved ? "" : `<p style="background:#fef2f2;color:#b91c1c;padding:12px;border-radius:8px">El pago no fue aprobado. Tu pedido quedó pendiente: contáctanos para completarlo.</p>`}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
         <tr><td style="padding:6px 0;color:#64748b">Subtotal</td><td style="text-align:right">${formatPrice(Number(order.subtotal))}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b">Envío</td><td style="text-align:right">${Number(order.shippingFee) === 0 ? "Gratis" : formatPrice(Number(order.shippingFee))}</td></tr>
         <tr><td style="padding:6px 0;font-weight:800">Total</td><td style="text-align:right;font-weight:800">${formatPrice(Number(order.total))}</td></tr>
       </table>
       <h2 style="font-size:15px;margin:24px 0 6px">Enviaremos a</h2>
       <p style="margin:0;line-height:1.5">${esc(addr.fullName)} · ${esc(addr.phone)}<br>${esc(addr.line1)}${addr.line2 ? `, ${esc(addr.line2)}` : ""}<br>${esc(addr.city)}, ${esc(addr.state)}</p>
       <p style="margin:24px 0 0">${button(`${APP_URL()}/cuenta/pedidos/${order.id}`, "Ver mi pedido")}</p>`,
    ),
  };
}

/** Mensajes por estado; solo se notifican los estados relevantes para el cliente. */
const STATUS_COPY: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  PROCESSING: { title: "Estamos preparando tu pedido", body: "Tu pedido está en bodega y pronto será despachado." },
  SHIPPED: { title: "¡Tu pedido va en camino! 🚚", body: "Entregamos tu pedido a la transportadora." },
  DELIVERED: { title: "Tu pedido fue entregado ✅", body: "Esperamos que disfrutes tu compra. ¡Gracias por confiar en EMC Positive Energy!" },
  CANCELLED: { title: "Tu pedido fue cancelado", body: "Tu pedido fue cancelado. Si tienes dudas o se realizó un cobro, contáctanos." },
  REFUNDED: { title: "Procesamos tu reembolso", body: "El reembolso fue emitido; puede tardar algunos días hábiles en reflejarse." },
};

export const NOTIFIABLE_STATUSES = Object.keys(STATUS_COPY) as OrderStatus[];

export function orderStatusEmail(to: string, order: Order): EmailMessage | null {
  const copy = STATUS_COPY[order.status];
  if (!copy) return null;
  const tracking =
    order.status === "SHIPPED" && order.trackingNumber
      ? `<p style="background:#fff8eb;padding:12px;border-radius:8px;margin:16px 0">Transportadora: <b>${esc(order.carrier ?? "—")}</b><br>Número de guía: <b>${esc(order.trackingNumber)}</b></p>`
      : "";

  return {
    to,
    subject: `Pedido #${order.number}: ${ORDER_STATUS_LABELS[order.status]}`,
    text: `${copy.title}. ${copy.body} ${order.trackingNumber ? `Guía: ${order.carrier ?? ""} ${order.trackingNumber}.` : ""} ${APP_URL()}/cuenta/pedidos/${order.id}`,
    html: layout(
      copy.title,
      `<h1 style="margin:0 0 6px;font-size:22px">${copy.title}</h1>
       <p style="margin:0 0 6px;color:#64748b">Pedido <b>#${order.number}</b></p>
       <p style="line-height:1.6">${copy.body}</p>${tracking}
       <p style="margin:24px 0 0">${button(`${APP_URL()}/cuenta/pedidos/${order.id}`, "Ver mi pedido")}</p>`,
    ),
  };
}
