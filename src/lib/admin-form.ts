// Yönetim formu durum tipi ve yardımcıları (istemci ve sunucuda ortak)
export type AdminFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

export function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const num = Number(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

/** "Tarih-saat" girişini (yerel, Europe/Istanbul) Date'e çevirir */
export function parseLocalDateTime(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return null;
  // Türkiye UTC+3 (yaz saati uygulanmıyor)
  const date = new Date(`${text}:00+03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toLocalDateTimeInput(date: Date | null | undefined): string {
  if (!date) return "";
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}
