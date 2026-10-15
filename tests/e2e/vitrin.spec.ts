import { expect, test } from "@playwright/test";
import { collectErrors, expectNoHorizontalOverflow, seriousA11yViolations } from "./helpers";

test.describe("Vitrin", () => {
  test("ana sayfa: hero, bölümler ve hatasız yükleme", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tatlı Fikirlerin Profesyonel Dokunuşu");
    await expect(page.getByRole("link", { name: "Ürünleri Keşfet" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Tariflerden İlham Al" }).first()).toBeVisible();
    for (const heading of ["Tatlı Dünyanı Oluştur", "Öne Çıkanlar", "Bir Sos. Sayısız Sunum.", "Mutfağınız İçin Profesyonel Çözümler.", "ByMaster Lezzet Günlüğü"]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    // Gerçek satış verisi olmadan "çok satan" iddiası kullanılmaz
    await expect(page.getByText(/çok satan/i)).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  test("katalog: kategori filtresi, sıralama ve sayfa başlığı", async ({ page }) => {
    await page.goto("/urunler");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cards = page.locator('a[href^="/urun/"]');
    expect(await cards.count()).toBeGreaterThan(10);
    await page.goto("/kategori/waffle-soslari");
    await expect(page.locator('a[href="/urun/lotus-waffle-sosu-10-kg"]').first()).toBeVisible();
    await page.goto("/urunler?sirala=fiyat-artan");
    await expect(page).toHaveURL(/sirala=fiyat-artan/);
  });

  test("ürün detayı: kova ambalajı, KDV ve birim fiyat bilgisi, yapılandırılmış veri", async ({ page }) => {
    await page.goto("/urun/antep-fistikli-waffle-sosu-10-kg");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Antep");
    await expect(page.getByText(/KDV dahil/i).first()).toBeVisible();
    await expect(page.getByRole("group", { name: "Satın alma seçenekleri" }).getByText(/10 kg/i).first()).toBeVisible();
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = jsonLd.map((text) => JSON.parse(text)).find((data) => data["@type"] === "Product");
    expect(product?.offers?.priceCurrency).toBe("TRY");
    // Uydurma değerlendirme puanı olmamalı
    expect(product?.aggregateRating).toBeUndefined();
  });

  test("temsili görseller açıkça etiketlenir", async ({ page }) => {
    await page.goto("/urun/bitter-waffle-sosu-10-kg");
    await expect(page.getByText(/Temsili görsel/i).first()).toBeVisible();
  });

  test("yakında satışa çıkacak ürün sepete eklenemez, taslak ürün görünmez", async ({ page }) => {
    await page.goto("/urun/waffle-box");
    const panel = page.getByRole("group", { name: "Satın alma seçenekleri" });
    await expect(panel.getByRole("button", { name: "Sepete ekle" })).toHaveCount(0);
    await expect(panel.getByText(/Yakında satışta/i)).toBeVisible();
    const draft = await page.goto("/urun/sutlu-cikolata-sos-300-g");
    expect(draft?.status()).toBe(404);
  });

  test("arama sonuç döndürür", async ({ page }) => {
    await page.goto("/arama?q=lotus");
    await expect(page.locator('a[href="/urun/lotus-waffle-sosu-10-kg"]').first()).toBeVisible();
  });

  test("güvenlik başlıkları ve arama motoru dosyaları", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
    expect((await request.get("/robots.txt")).status()).toBe(200);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/urun/");
  });

  test("yetkisiz erişim: yönetim sayfaları ve dışa aktarma", async ({ page, request }) => {
    await page.goto("/yonetim");
    await expect(page).toHaveURL(/\/giris/);
    const csv = await request.get("/api/yonetim/disa-aktar/siparisler");
    expect(csv.status()).toBe(403);
    const upload = await request.post("/api/yonetim/yukle", { multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect(upload.status()).toBe(403);
  });

  test("erişilebilirlik: ana sayfa, katalog ve ürün sayfasında ciddi ihlal yok", async ({ page }) => {
    const report: Record<string, unknown> = {};
    for (const path of ["/", "/urunler", "/urun/lotus-waffle-sosu-10-kg", "/sepet", "/tarifler"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const violations = await seriousA11yViolations(page);
      if (violations.length) report[path] = violations;
    }
    expect(report).toEqual({});
  });
});
