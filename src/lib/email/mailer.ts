import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { slugify } from "@/lib/utils";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Envío de correos transaccionales.
 *
 * - Con SMTP_HOST configurado: envía por SMTP (Gmail/Google Workspace,
 *   Outlook, Brevo, Resend SMTP, Amazon SES, Mailtrap…).
 * - Sin SMTP (desarrollo): no envía nada; guarda cada correo como HTML en
 *   storage/emails/ para poder abrirlo en el navegador y lo anuncia en consola.
 *
 * Nunca lanza: un fallo de correo no debe romper un pedido o un registro.
 */
let transporter: Transporter | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = TLS implícito; 587 = STARTTLS
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const from = process.env.MAIL_FROM ?? "EMC Positive Energy <no-reply@emc-positive.com>";
  try {
    const smtp = getTransporter();
    if (smtp) {
      await smtp.sendMail({ from, ...message });
      return;
    }

    // Modo desarrollo: vista previa en disco
    const dir = path.resolve(/*turbopackIgnore: true*/ "storage/emails");
    await mkdir(dir, { recursive: true });
    const slug = slugify(message.subject).slice(0, 50);
    const file = path.join(/*turbopackIgnore: true*/ dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug}.html`);
    await writeFile(file, message.html);
    console.info(`✉  [correo simulado] Para: ${message.to} · "${message.subject}" → ${file}`);
  } catch (error) {
    console.error(`✉  Error enviando correo a ${message.to}:`, error);
  }
}
