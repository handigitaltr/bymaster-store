// E-posta şablonları. Kullanıcıdan gelen tüm değerler HTML'e kaçışlanarak eklenir.
import { formatTRY } from "@/lib/money";
import type { EmailMessage } from "./index";

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string, storeName: string): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#F7F0E6;font-family:Arial,Helvetica,sans-serif;color:#2B1611">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF9;border:1px solid #E8DCCB">
<tr><td style="background:#351C16;padding:22px 28px;color:#F7F0E6;font-size:20px;font-weight:bold;letter-spacing:2px">${esc(storeName.toUpperCase())}</td></tr>
<tr><td style="padding:28px">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #E8DCCB;font-size:12px;color:#6E5248">Bu e-posta ${esc(storeName)} tarafından otomatik olarak gönderilmiştir.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#781F2B;color:#ffffff;text-decoration:none;padding:12px 22px;display:inline-block;font-weight:bold">${esc(label)}</a></p>`;
}

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  items: Array<{ productName: string; variantName: string; quantity: number; lineTotalKurus: number }>;
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
  shipFullName: string;
  shipAddressLine: string;
  shipDistrict: string;
  shipCity: string;
};

function orderTable(order: OrderEmailData) {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #EFE4D4">${esc(item.productName)}<br><span style="color:#6E5248;font-size:12px">${esc(item.variantName)} × ${item.quantity}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #EFE4D4">${formatTRY(item.lineTotalKurus)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
${line("Ara toplam", formatTRY(order.subtotalKurus))}
${order.discountKurus > 0 ? line("İndirim", `−${formatTRY(order.discountKurus)}`) : ""}
${line("Kargo", order.shippingKurus === 0 ? "Ücretsiz" : formatTRY(order.shippingKurus))}
${line("Toplam (KDV dahil)", formatTRY(order.totalKurus), true)}</table>
<p style="font-size:13px;color:#6E5248;margin-top:16px">Teslimat adresi: ${esc(order.shipFullName)}, ${esc(order.shipAddressLine)}, ${esc(order.shipDistrict)} / ${esc(order.shipCity)}</p>`;
}

function textItems(order: OrderEmailData) {
  return order.items.map((i) => `- ${i.productName} (${i.variantName}) × ${i.quantity}: ${formatTRY(i.lineTotalKurus)}`).join("\n");
}

export function orderPaidEmail(order: OrderEmailData, orderUrl: string, storeName: string): EmailMessage {
  const subject = `Siparişiniz alındı — ${order.orderNumber}`;
  const html = layout(
    subject,
    `<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Teşekkürler, ${esc(order.customerName)}!</h1>
<p>Ödemeniz onaylandı ve <strong>${esc(order.orderNumber)}</strong> numaralı siparişiniz hazırlanmak üzere sıraya alındı.</p>
${orderTable(order)}${button(orderUrl, "Siparişimi görüntüle")}`,
    storeName,
  );
  const text = `Teşekkürler ${order.customerName}!\nÖdemeniz onaylandı. Sipariş no: ${order.orderNumber}\n\n${textItems(order)}\nToplam: ${formatTRY(order.totalKurus)}\n\nSipariş: ${orderUrl}`;
  return { subject, html, text };
}

export function bankTransferEmail(
  order: OrderEmailData,
  accounts: Array<{ bankName: string; accountHolder: string; iban: string }>,
  holdHours: number,
  orderUrl: string,
  storeName: string,
): EmailMessage {
  const subject = `Havale/EFT bilgileri — ${order.orderNumber}`;
  const accountsHtml = accounts
    .map(
      (a) =>
        `<p style="margin:8px 0;padding:12px;background:#F7F0E6"><strong>${esc(a.bankName)}</strong><br>Alıcı: ${esc(a.accountHolder)}<br>IBAN: <span style="font-family:monospace">${esc(a.iban)}</span></p>`,
    )
    .join("");
  const html = layout(
    subject,
    `<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Siparişiniz oluşturuldu</h1>
<p><strong>${esc(order.orderNumber)}</strong> numaralı siparişiniz için ${formatTRY(order.totalKurus)} tutarındaki ödemeyi aşağıdaki hesaba gönderebilirsiniz. Açıklama alanına <strong>sipariş numaranızı</strong> yazmayı unutmayın.</p>
${accountsHtml}
<p style="font-size:13px;color:#6E5248">Ödeme ${holdHours} saat içinde ulaşmazsa sipariş otomatik olarak iptal edilir ve ürünler yeniden satışa açılır.</p>
${orderTable(order)}${button(orderUrl, "Siparişimi görüntüle")}`,
    storeName,
  );
  const text = `Sipariş no: ${order.orderNumber}\nTutar: ${formatTRY(order.totalKurus)}\n\n${accounts
    .map((a) => `${a.bankName} — ${a.accountHolder} — ${a.iban}`)
    .join("\n")}\n\nAçıklamaya sipariş numaranızı yazınız. Ödeme ${holdHours} saat içinde ulaşmazsa sipariş iptal edilir.\n${orderUrl}`;
  return { subject, html, text };
}

export function orderShippedEmail(
  order: OrderEmailData & { shippingCarrier: string | null; trackingNumber: string | null; trackingUrl: string | null },
  orderUrl: string,
  storeName: string,
): EmailMessage {
  const subject = `Siparişiniz kargoya verildi — ${order.orderNumber}`;
  const tracking = order.trackingNumber
    ? `<p>Kargo firması: <strong>${esc(order.shippingCarrier ?? "-")}</strong><br>Takip numarası: <strong>${esc(order.trackingNumber)}</strong></p>${order.trackingUrl ? button(order.trackingUrl, "Kargoyu takip et") : ""}`
    : "";
  const html = layout(
    subject,
    `<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Siparişiniz yolda</h1><p><strong>${esc(order.orderNumber)}</strong> numaralı siparişiniz kargoya verildi.</p>${tracking}${button(orderUrl, "Sipariş detayları")}`,
    storeName,
  );
  const text = `Siparişiniz kargoya verildi: ${order.orderNumber}\n${order.trackingNumber ? `Takip no: ${order.trackingNumber} (${order.shippingCarrier ?? ""})` : ""}\n${orderUrl}`;
  return { subject, html, text };
}

export function orderCancelledEmail(order: OrderEmailData, reason: string, storeName: string): EmailMessage {
  const subject = `Siparişiniz iptal edildi — ${order.orderNumber}`;
  const html = layout(
    subject,
    `<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Siparişiniz iptal edildi</h1><p><strong>${esc(order.orderNumber)}</strong> numaralı siparişiniz iptal edildi.</p><p>${esc(reason)}</p>`,
    storeName,
  );
  return { subject, html, text: `Siparişiniz iptal edildi: ${order.orderNumber}\n${reason}` };
}

export function adminNewOrderEmail(order: OrderEmailData & { paymentLabel: string }, adminUrl: string, storeName: string): EmailMessage {
  const subject = `Yeni sipariş: ${order.orderNumber} (${formatTRY(order.totalKurus)})`;
  const html = layout(subject, `<p>Yeni bir sipariş var. Ödeme: <strong>${esc(order.paymentLabel)}</strong></p>${orderTable(order)}${button(adminUrl, "Yönetim panelinde aç")}`, storeName);
  return { subject, html, text: `${subject}\n${textItems(order)}\n${adminUrl}` };
}

export function quoteReceivedEmail(quote: { referenceNo: string; contactName: string; companyName: string }, storeName: string): EmailMessage {
  const subject = `Teklif talebiniz alındı — ${quote.referenceNo}`;
  const html = layout(
    subject,
    `<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Talebiniz bize ulaştı</h1><p>Sayın ${esc(quote.contactName)}, ${esc(quote.companyName)} adına ilettiğiniz toplu alım talebi kaydedildi. Referans numaranız: <strong>${esc(quote.referenceNo)}</strong>.</p><p>Ekibimiz talebinizi inceleyerek sizinle iletişime geçecektir.</p>`,
    storeName,
  );
  return { subject, html, text: `Teklif talebiniz alındı. Referans: ${quote.referenceNo}` };
}

export function adminNewQuoteEmail(
  quote: { referenceNo: string; companyName: string; contactName: string; email: string; phone: string; message: string | null; items: Array<{ productName: string; variantName: string | null; quantity: number; unit: string }> },
  adminUrl: string,
  storeName: string,
): EmailMessage {
  const subject = `Yeni teklif talebi: ${quote.companyName} (${quote.referenceNo})`;
  const items = quote.items.map((i) => `<li>${esc(i.productName)} ${i.variantName ? `(${esc(i.variantName)})` : ""} — ${i.quantity} ${esc(i.unit)}</li>`).join("");
  const html = layout(
    subject,
    `<p><strong>${esc(quote.companyName)}</strong><br>${esc(quote.contactName)} · ${esc(quote.email)} · ${esc(quote.phone)}</p><ul>${items}</ul>${quote.message ? `<p style="white-space:pre-wrap">${esc(quote.message)}</p>` : ""}${button(adminUrl, "Talebi incele")}`,
    storeName,
  );
  return { subject, html, text: `${subject}\n${quote.contactName} ${quote.email} ${quote.phone}\n${adminUrl}` };
}

export function quoteReplyEmail(quote: { referenceNo: string; contactName: string }, message: string, storeName: string): EmailMessage {
  const subject = `Teklif talebiniz hakkında — ${quote.referenceNo}`;
  const html = layout(subject, `<p>Sayın ${esc(quote.contactName)},</p><p style="white-space:pre-wrap">${esc(message)}</p>`, storeName);
  return { subject, html, text: `Sayın ${quote.contactName},\n\n${message}` };
}

export function passwordResetEmail(resetUrl: string, storeName: string): EmailMessage {
  const subject = "Şifre sıfırlama bağlantınız";
  const html = layout(
    subject,
    `<p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Bağlantı 1 saat geçerlidir.</p>${button(resetUrl, "Yeni şifre belirle")}<p style="font-size:13px;color:#6E5248">Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`,
    storeName,
  );
  return { subject, html, text: `Şifre sıfırlama bağlantınız (1 saat geçerli): ${resetUrl}` };
}

export function backInStockEmail(productName: string, productUrl: string, storeName: string): EmailMessage {
  const subject = `${productName} yeniden stokta`;
  const html = layout(subject, `<p>Haber vermemizi istediğiniz <strong>${esc(productName)}</strong> yeniden satışta.</p>${button(productUrl, "Ürünü incele")}`, storeName);
  return { subject, html, text: `${productName} yeniden stokta: ${productUrl}` };
}

export function adminContactEmail(
  message: { name: string; email: string; phone: string | null; subject: string; message: string },
  adminUrl: string,
  storeName: string,
): EmailMessage {
  const subject = `İletişim formu: ${message.subject}`;
  const html = layout(
    subject,
    `<p><strong>${esc(message.name)}</strong> · ${esc(message.email)} ${message.phone ? `· ${esc(message.phone)}` : ""}</p><p style="white-space:pre-wrap">${esc(message.message)}</p>${button(adminUrl, "Mesajlar")}`,
    storeName,
  );
  return { subject, html, text: `${message.name} <${message.email}>\n${message.message}` };
}

export function newsletterWelcomeEmail(unsubscribeUrl: string, storeName: string): EmailMessage {
  const subject = `${storeName} Lezzet Günlüğü'ne hoş geldiniz`;
  const html = layout(
    subject,
    `<p>Bültenimize abone olduğunuz için teşekkürler. Yeni tarifler, sunum fikirleri ve kampanyalardan haberdar olacaksınız.</p><p style="font-size:12px;color:#6E5248">Aboneliğinizi dilediğiniz zaman <a href="${esc(unsubscribeUrl)}" style="color:#781F2B">buradan</a> sonlandırabilirsiniz.</p>`,
    storeName,
  );
  return { subject, html, text: `Bültenimize hoş geldiniz. Abonelikten çıkmak için: ${unsubscribeUrl}` };
}

export function returnRequestEmail(ref: string, orderNumber: string, storeName: string): EmailMessage {
  const subject = `İade/sorun talebiniz alındı — ${ref}`;
  const html = layout(subject, `<p><strong>${esc(orderNumber)}</strong> numaralı siparişiniz için talebiniz kaydedildi (referans: ${esc(ref)}). İnceleme sonrasında sizinle iletişime geçeceğiz.</p>`, storeName);
  return { subject, html, text: `${orderNumber} için talebiniz alındı. Referans: ${ref}` };
}
