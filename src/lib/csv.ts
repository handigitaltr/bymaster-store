// CSV üretimi (Excel'in Türkçe yerel ayarıyla uyumlu: ";" ayırıcı, UTF-8 BOM)

export type CsvValue = string | number | boolean | Date | null | undefined;

/**
 * Hücreyi kaçışlar. "=", "+", "-", "@", sekme veya satır başıyla başlayan metinler tablo programlarında
 * formül olarak çalışabileceğinden (CSV/formül enjeksiyonu) başına tek tırnak eklenir.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (value instanceof Date) {
    text = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(value);
  } else if (typeof value === "boolean") {
    text = value ? "Evet" : "Hayır";
  } else {
    text = String(value);
  }
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(,\d+)?$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Kuruşu "1234,56" biçiminde (para birimi simgesi olmadan) yazar */
export function csvMoney(kurus: number): string {
  const sign = kurus < 0 ? "-" : "";
  const abs = Math.abs(kurus);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}
