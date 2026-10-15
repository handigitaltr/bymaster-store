import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { splitContent } from "@/lib/blog";
import { parseCatalogParams } from "@/lib/catalog-params";
import { csvCell, csvMoney, toCsv } from "@/lib/csv";
import { escapeMarkdown, renderTemplate, sellerVars } from "@/lib/legal";
import {
  iyzicoAuthHeaders,
  iyzicoResponseSignature,
  mockCallbackSignature,
  paytrBasket,
  paytrCallbackHash,
  paytrRequestToken,
} from "@/lib/payments/signatures";
import { safeEqual } from "@/lib/security/crypto";
import { safeJsonLd, safeRedirectPath } from "@/lib/utils";

describe("açık yönlendirme koruması", () => {
  it("yalnızca site içi göreli yollara izin verir", () => {
    expect(safeRedirectPath("/hesabim/siparisler")).toBe("/hesabim/siparisler");
    expect(safeRedirectPath("//kotu-site.com")).toBe("/");
    expect(safeRedirectPath("/\\kotu-site.com")).toBe("/");
    expect(safeRedirectPath("https://kotu-site.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)", "/giris")).toBe("/giris");
    expect(safeRedirectPath(null)).toBe("/");
  });
});

describe("JSON-LD gömme", () => {
  it("</script> ile betik kırılmasını engeller", () => {
    const output = safeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("<");
    expect(output).not.toContain(">");
    expect(JSON.parse(output).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("katalog parametreleri", () => {
  it("geçersiz değerleri güvenli varsayılanlara çevirir", () => {
    const params = parseCatalogParams({ sirala: "DROP TABLE", sayfa: "9999", lezzet: "<script>,antep-fistigi", ambalaj: "kova,varil", kategori: "../etc" });
    expect(params.sirala).toBe("onerilen");
    expect(params.sayfa).toBe(20);
    expect(params.lezzet).toEqual(["antep-fistigi"]);
    expect(params.ambalaj).toEqual(["kova"]);
    expect(params.kategori).toBe("");
  });
});

describe("CSV dışa aktarma", () => {
  it("formül enjeksiyonunu etkisizleştirir", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("+90 532")).toBe(`"'+90 532"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(csvCell("-1+2")).toBe(`"'-1+2"`);
  });
  it("sayıları, boş değerleri ve tırnakları doğru yazar", () => {
    expect(csvCell("-125,50")).toBe(`"-125,50"`);
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe(`"Evet"`);
    expect(csvMoney(123_456)).toBe("1234,56");
    const csv = toCsv(["A", "B"], [["x;y", 'say "merhaba"']]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain(`"x;y";"say ""merhaba"""`);
  });
});

describe("yasal metin şablonları", () => {
  it("eksik alanlar müşteriye '—', yöneticiye işaretli gösterilir", () => {
    const template = "Satıcı: {{SATICI_UNVAN}} / {{SATICI_MERSIS}}";
    const vars = { SATICI_UNVAN: "Örnek A.Ş." };
    expect(renderTemplate(template, vars)).toBe("Satıcı: Örnek A.Ş. / —");
    expect(renderTemplate(template, vars, { markMissing: true })).toContain("[SATICI_MERSIS — bilgi eksik]");
  });
  it("kullanıcı kaynaklı değerlerde Markdown/HTML etkisizleşir", () => {
    expect(escapeMarkdown("[tıkla](javascript:alert(1)) <b>")).toBe("\\[tıkla\\]\\(javascript:alert\\(1\\)\\) \\<b\\>");
    const vars = sellerVars(
      {
        companyLegalName: "**Kalın** Ltd.",
        companyAddress: null,
        companyPhone: null,
        companyEmail: null,
        companyMersis: null,
        companyTaxOffice: null,
        companyTaxNumber: null,
        companyKep: null,
        storeName: "ByMaster",
      },
      "https://ornek.com",
    );
    expect(vars.SATICI_UNVAN).toBe("\\*\\*Kalın\\*\\* Ltd\\.");
    expect(vars.SATICI_ADRES).toBeUndefined();
  });
});

describe("blog içerik blokları", () => {
  it("yalnızca kendi satırındaki ürün kartlarını ayırır", () => {
    const blocks = splitContent("Giriş\n\n[[urun:waffle-mix-1-kg]]\n\nmetin içinde [[urun:x]] kalır\n[[urun:GECERSIZ SLUG]]");
    expect(blocks).toEqual([
      { type: "markdown", content: "Giriş" },
      { type: "product", slug: "waffle-mix-1-kg" },
      { type: "markdown", content: "metin içinde [[urun:x]] kalır\n[[urun:GECERSIZ SLUG]]" },
    ]);
  });
});

describe("ödeme imzaları", () => {
  const key = "merchant-key";
  const salt = "merchant-salt";

  it("PayTR istek belirteci belgelenen alan sırasıyla üretilir", () => {
    const basket = paytrBasket([["Ürün", "18.00", 1]]);
    const fields = {
      merchantId: "123",
      userIp: "1.2.3.4",
      merchantOid: "BM1",
      email: "a@b.co",
      paymentAmount: 1800,
      userBasket: basket,
      noInstallment: 0 as const,
      maxInstallment: 0,
      currency: "TL",
      testMode: 1 as const,
    };
    const expected = createHmac("sha256", key)
      .update(`1231.2.3.4BM1a@b.co1800${basket}00TL1${salt}`)
      .digest("base64");
    expect(paytrRequestToken(fields, key, salt)).toBe(expected);
    expect(JSON.parse(Buffer.from(basket, "base64").toString("utf8"))).toEqual([["Ürün", "18.00", 1]]);
  });

  it("PayTR bildirim hash'i: tutar veya durum değişirse eşleşmez", () => {
    const hash = paytrCallbackHash("BM1", "success", "1800", key, salt);
    expect(hash).toBe(createHmac("sha256", key).update(`BM1${salt}success1800`).digest("base64"));
    expect(safeEqual(hash, paytrCallbackHash("BM1", "success", "1", key, salt))).toBe(false);
    expect(safeEqual(hash, paytrCallbackHash("BM1", "failed", "1800", key, salt))).toBe(false);
    expect(safeEqual(hash, paytrCallbackHash("BM1", "success", "1800", "baska-anahtar", salt))).toBe(false);
  });

  it("iyzico IYZWSv2 yetkilendirme başlığı", () => {
    const headers = iyzicoAuthHeaders("api-key", "secret", "/payment/x", '{"a":1}', "rnd123");
    const decoded = Buffer.from(headers.Authorization.replace("IYZWSv2 ", ""), "base64").toString("utf8");
    const signature = createHmac("sha256", "secret").update('rnd123/payment/x{"a":1}').digest("hex");
    expect(decoded).toBe(`apiKey:api-key&randomKey:rnd123&signature:${signature}`);
    expect(headers["x-iyzi-rnd"]).toBe("rnd123");
  });

  it("iyzico yanıt imzası alanları ':' ile birleştirir, boş alanlar boş metindir", () => {
    const expected = createHmac("sha256", "secret").update("success::tok:12.50").digest("hex");
    expect(iyzicoResponseSignature("secret", ["success", null, "tok", "12.50"])).toBe(expected);
  });

  it("test simülatörü imzası referansa, duruma ve tutara bağlıdır", () => {
    const a = mockCallbackSignature("s", "REF1", "SUCCEEDED", 1000);
    expect(a).toBe(mockCallbackSignature("s", "REF1", "SUCCEEDED", 1000));
    expect(a).not.toBe(mockCallbackSignature("s", "REF1", "SUCCEEDED", 1001));
    expect(a).not.toBe(mockCallbackSignature("s", "REF2", "SUCCEEDED", 1000));
  });
});
