// Türkçe metin yardımcıları (slug, arama normalizasyonu, okuma süresi)

const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i̇: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

function transliterate(value: string): string {
  return value.replace(/[çğıöşüâîû]|i̇/g, (char) => TR_MAP[char] ?? char);
}

/** "Antep Fıstıklı Waffle Sosu" → "antep-fistikli-waffle-sosu" */
export function slugify(value: string): string {
  return transliterate(value.toLocaleLowerCase("tr-TR"))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Arama için: küçük harf (Türkçe kurallarıyla), aksansız, tek boşluklu */
export function normalizeForSearch(value: string): string {
  return transliterate(value.toLocaleLowerCase("tr-TR"))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function searchTerms(query: string): string[] {
  return normalizeForSearch(query)
    .split(" ")
    .filter((term) => term.length >= 2)
    .slice(0, 6);
}

/** Okuma süresi: Türkçe metinlerde dakikada ~160 kelime varsayımı (sondan eklemeli dil, uzun kelimeler) */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/\[\[urun:[^\]]+\]\]/g, "")
    .replace(/[#>*_`~\-[\]()!|]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 160));
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Markdown'dan düz metin (meta açıklama vb. için) */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/\[\[urun:[^\]]+\]\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Satır başına bir öğe girilen alanları listeye çevirir */
export function lines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    // Yalnızca liste işaretlerini ("- ", "• ", "1. ", "2) ") temizler; "3 adet" gibi içerikleri korur
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/** Telefonu "+90XXXXXXXXXX" biçimine getirir; geçersizse null */
export function normalizeTurkishPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national = digits;
  if (national.startsWith("90") && national.length === 12) national = national.slice(2);
  if (national.startsWith("0") && national.length === 11) national = national.slice(1);
  // 2xx-4xx sabit hat, 5xx mobil, 850 kurumsal numaralar
  if (national.length !== 10 || !/^[2-58]/.test(national)) return null;
  return `+90${national}`;
}

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const match = phone.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  return `0${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

/** Ad Soyad ayrımı (ödeme sağlayıcıları için) */
export function splitFullName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  const surname = parts.pop() as string;
  return { name: parts.join(" "), surname };
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** IBAN'ı boşluksuz büyük harfe çevirir; TR IBAN biçimi ve mod-97 kontrolü geçerse "TR00 0000 ..." biçiminde döner */
export function normalizeTrIban(input: string): string | null {
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(iban)) return null;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  if (remainder !== 1) return null;
  return iban.replace(/(.{4})/g, "$1 ").trim();
}
