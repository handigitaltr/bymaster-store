import { expect, test } from "@playwright/test";
import { collectErrors, loginAs, loginAsAdmin } from "./helpers";

test.describe("Yönetim paneli", () => {
  test("müşteri hesabı yönetim paneline erişemez", async ({ page }) => {
    await page.goto("/kayit");
    await page.locator("#register-name").fill("Deneme Müşteri");
    await page.locator("#register-email").fill("musteri-e2e@example.test");
    await page.locator("#register-password").fill("Musteri-Parola-2026");
    await page.locator("#register-password2").fill("Musteri-Parola-2026");
    await page.locator("#register-kvkk").check();
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/kayit"));
    const response = await page.goto("/yonetim");
    expect(response?.status()).toBe(404);
    const csv = await page.request.get("/api/yonetim/disa-aktar/bulten");
    expect(csv.status()).toBe(403);
  });

  test("yönetici girişi ve tüm yönetim sayfaları hatasız açılır", async ({ page }) => {
    const errors = collectErrors(page);
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
    for (const path of [
      "/yonetim/siparisler",
      "/yonetim/urunler",
      "/yonetim/urunler/yeni",
      "/yonetim/kategoriler",
      "/yonetim/stok",
      "/yonetim/kuponlar",
      "/yonetim/duyurular",
      "/yonetim/blog",
      "/yonetim/blog/yeni",
      "/yonetim/sayfalar",
      "/yonetim/sayfalar/sss",
      "/yonetim/teklifler",
      "/yonetim/iadeler",
      "/yonetim/mesajlar",
      "/yonetim/bulten",
      "/yonetim/musteriler",
      "/yonetim/fiyat-listeleri",
      "/yonetim/medya",
      "/yonetim/raporlar",
      "/yonetim/ayarlar",
      "/yonetim/denetim",
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("taslak blog yazısı sitede görünmez, yayınlanınca görünür", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/yonetim/blog/yeni");
    await page.locator("#b-title").fill("E2E Deneme Tarifi Başlığı");
    await page.locator("#b-slug").fill("e2e-deneme-tarifi");
    await page.locator("#b-excerpt").fill("Bu yazı uçtan uca testler tarafından oluşturulan bir deneme yazısıdır.");
    await page.locator("#b-content").fill("## Hazırlık\n\nBu içerik otomatik test tarafından yazıldı ve yalnızca test veritabanında bulunur.\n\n[[urun:lotus-waffle-sosu-10-kg]]\n");
    await page.getByRole("button", { name: "Taslağı kaydet" }).click();
    await page.waitForURL(/\/yonetim\/blog\/[a-z0-9]+\?kaydedildi=1/);

    const draft = await page.request.get("/tarifler/e2e-deneme-tarifi");
    expect(draft.status()).toBe(404);

    await page.locator("#b-status").selectOption("PUBLISHED");
    await page.getByRole("button", { name: "Kaydet ve yayınla" }).click();
    await expect(page.getByText("Yazı kaydedildi ve yayında.")).toBeVisible();
    // Kayıttan sonra seçim kutuları ekranda da yeni değerini korur; ikinci kayıt yazıyı taslağa çekmez
    await expect(page.locator("#b-status")).toHaveValue("PUBLISHED");
    await page.locator("#b-excerpt").fill("Bu yazı uçtan uca testler tarafından oluşturulan ve ikinci kez kaydedilen bir deneme yazısıdır.");
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/yonetim/blog/")),
      page.getByRole("button", { name: "Kaydet ve yayınla" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Kaydet ve yayınla" })).toBeEnabled();
    await expect(page.locator("#b-status")).toHaveValue("PUBLISHED");
    await expect(page.locator("#b-content")).not.toHaveValue("");

    await page.goto("/tarifler/e2e-deneme-tarifi");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Deneme Tarifi Başlığı");
    await expect(page.locator('a[href="/urun/lotus-waffle-sosu-10-kg"]').first()).toBeVisible();
  });

  test("ayarlar sunucuda doğrulanır: geçersiz IBAN ve analiz kimliği reddedilir", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/yonetim/ayarlar");
    const payment = page.locator("#odeme");
    await payment.getByLabel("1. hesap IBAN").fill("TR00 0000 0000 0000 0000 0000 00");
    await payment.getByRole("button", { name: "Kaydet" }).click();
    await expect(payment.getByText(/IBAN geçersiz/)).toBeVisible();

    const analytics = page.locator("#analiz");
    await analytics.getByLabel("Google Analytics 4 ölçüm kimliği").fill("');alert(1);//");
    await analytics.getByRole("button", { name: "Kaydet" }).click();
    await expect(analytics.getByText(/G-XXXXXXX/)).toBeVisible();
  });

  test("havale siparişi yönetici tarafından ödendi işaretlenebilir", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/yonetim/siparisler?durum=AWAITING_TRANSFER");
    const first = page.locator('a[href^="/yonetim/siparisler/"]').first();
    test.skip((await first.count()) === 0, "Havale bekleyen sipariş yok (sipariş testleri önce çalışmalı)");
    await first.click();
    await page.locator("#to").selectOption("PAID");
    await page.locator('textarea[name="note"], input[name="note"]').first().fill("Havale referansı E2E-123");
    await page.getByRole("button", { name: "Durumu güncelle" }).click();
    await expect(page.getByText("Ödeme alındı").first()).toBeVisible();
  });

  test("yanlış parola ile giriş yapılamaz", async ({ page }) => {
    await page.goto("/giris");
    await page.locator("#login-email").fill("e2e-admin@example.test");
    await page.locator("#login-password").fill("yanlis-parola-123");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.getByText(/hatalı|eşleşmiyor|geçersiz/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/giris/);
  });

  test("oturum açmış müşteri kendi hesabını görür", async ({ page }) => {
    await loginAs(page, "musteri-e2e@example.test", "Musteri-Parola-2026");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
