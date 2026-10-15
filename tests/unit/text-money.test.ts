import { describe, expect, it } from "vitest";
import { formatTRY, includedVat, kurusToDecimalString, kurusToInput, parseTRYToKurus, unitPricePerKg } from "@/lib/money";
import {
  formatPhoneForDisplay,
  lines,
  normalizeForSearch,
  normalizeTrIban,
  normalizeTurkishPhone,
  readingMinutes,
  searchTerms,
  slugify,
} from "@/lib/text";

describe("para birimi", () => {
  it("Türkçe ve noktalı tutar girişlerini kuruşa çevirir", () => {
    expect(parseTRYToKurus("1.234,56")).toBe(123_456);
    expect(parseTRYToKurus("1234.5")).toBe(123_450);
    expect(parseTRYToKurus("₺ 99,90")).toBe(9_990);
    expect(parseTRYToKurus("250 TL")).toBe(25_000);
    expect(parseTRYToKurus("0")).toBe(0);
  });

  it("geçersiz tutarları reddeder", () => {
    expect(parseTRYToKurus("")).toBeNull();
    expect(parseTRYToKurus("abc")).toBeNull();
    expect(parseTRYToKurus("12,345")).toBeNull();
    expect(parseTRYToKurus("-5")).toBeNull();
  });

  it("form ve sağlayıcı biçimleri", () => {
    expect(kurusToInput(123_450)).toBe("1234,50");
    expect(kurusToInput(25_000)).toBe("250");
    expect(kurusToInput(null)).toBe("");
    expect(kurusToDecimalString(9_905)).toBe("99.05");
    expect(formatTRY(123_456)).toContain("1.234,56");
  });

  it("KDV dahil tutarın içindeki KDV", () => {
    expect(includedVat(12_000, 20)).toBe(2_000);
    expect(includedVat(10_100, 1)).toBe(100);
    expect(includedVat(5_000, 0)).toBe(0);
  });

  it("kilogram birim fiyatı", () => {
    expect(unitPricePerKg(220_000, 10_000)).toBe(22_000);
    expect(unitPricePerKg(86_000, 2_500)).toBe(34_400);
    expect(unitPricePerKg(10_000, null)).toBeNull();
  });
});

describe("Türkçe metin", () => {
  it("slug üretimi", () => {
    expect(slugify("Antep Fıstıklı Waffle Sosu")).toBe("antep-fistikli-waffle-sosu");
    expect(slugify("İÇECEK ŞURUBU — Çilek & Ğ")).toBe("icecek-surubu-cilek-g");
    expect(slugify("  --Krep Kırığı 2,5 kg--  ")).toBe("krep-kirigi-2-5-kg");
  });

  it("arama normalizasyonu Türkçe büyük/küçük harf kurallarını uygular", () => {
    expect(normalizeForSearch("ÇİKOLATALI   Sos")).toBe("cikolatali sos");
    expect(normalizeForSearch("IŞIK")).toBe("isik");
    expect(searchTerms("a fıstık  sos")).toEqual(["fistik", "sos"]);
  });

  it("telefon numarası doğrulama", () => {
    expect(normalizeTurkishPhone("0532 123 45 67")).toBe("+905321234567");
    expect(normalizeTurkishPhone("+90 (532) 123-45-67")).toBe("+905321234567");
    expect(normalizeTurkishPhone("5321234567")).toBe("+905321234567");
    expect(normalizeTurkishPhone("0850 123 45 67")).toBe("+908501234567");
    expect(normalizeTurkishPhone("123")).toBeNull();
    expect(normalizeTurkishPhone("0932 123 45 67")).toBeNull();
    expect(formatPhoneForDisplay("+905321234567")).toBe("0532 123 45 67");
  });

  it("IBAN doğrulama (TR, mod-97)", () => {
    expect(normalizeTrIban("tr33 0006 1005 1978 6457 8413 26")).toBe("TR33 0006 1005 1978 6457 8413 26");
    expect(normalizeTrIban("TR330006100519786457841327")).toBeNull();
    expect(normalizeTrIban("DE89370400440532013000")).toBeNull();
    expect(normalizeTrIban("TR33")).toBeNull();
  });

  it("satır listeleri madde işaretlerini temizler ama rakamla başlayan içeriği korur", () => {
    expect(lines("- Süt\n* Yumurta\n1. Un\n2) Şeker\n3 adet yumurta\n\n")).toEqual(["Süt", "Yumurta", "Un", "Şeker", "3 adet yumurta"]);
  });

  it("okuma süresi en az 1 dakikadır ve ürün kartı satırlarını saymaz", () => {
    expect(readingMinutes("kısa")).toBe(1);
    expect(readingMinutes(Array(321).fill("kelime").join(" "))).toBe(3);
    expect(readingMinutes("[[urun:waffle-mix-1-kg]]")).toBe(1);
  });
});
