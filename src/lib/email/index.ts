import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type EmailMessage = { subject: string; html: string; text: string };

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

/**
 * E-posta gönderimi "en iyi çaba" ilkesiyle çalışır: hata durumunda işlem akışını bozmaz,
 * sonuç EmailLog tablosuna yazılır. SMTP yapılandırılmamışsa gönderim yapılmaz (SKIPPED).
 */
export async function sendEmail(to: string, message: EmailMessage, template: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[e-posta atlandı: SMTP yok] ${template} → ${to}: ${message.subject}\n${message.text.slice(0, 600)}`);
    }
    await db.emailLog
      .create({ data: { to, subject: message.subject, template, status: "SKIPPED" } })
      .catch(() => undefined);
    return false;
  }
  try {
    await getTransporter().sendMail({ from: env.SMTP_FROM, to, subject: message.subject, html: message.html, text: message.text });
    await db.emailLog.create({ data: { to, subject: message.subject, template, status: "SENT" } }).catch(() => undefined);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 300) : "Bilinmeyen hata";
    console.error(`[e-posta hatası] ${template} → ${to}: ${reason}`);
    await db.emailLog
      .create({ data: { to, subject: message.subject, template, status: "FAILED", error: reason } })
      .catch(() => undefined);
    return false;
  }
}
