import { expect, test, type Page } from "@playwright/test";
import { addProductToCart, collectErrors, seriousA11yViolations } from "./helpers";

async function fillCheckout(page: Page, email: string) {
  await page.locator("#co-fullName").fill("Deneme Müşteri");
  await page.locator("#co-email").fill(email);
  await page.locator("#co-phone").fill("0532 123 45 67");
  await page.locator("#co-shipFullName").fill("Deneme Müşteri");
  await page.locator("#co-shipPhone").fill("0532 123 45 67");
  await page.locator("#co-shipCity").selectOption("İstanbul");
  await page.locator("#co-shipDistrict").fill("Kadıköy");
  await page.locator("#co-shipAddressLine").fill("Test Mahallesi, Deneme Sokak No: 5 Daire: 3");
}

test.describe("Sepet ve sipariş", () => {
  test("misafir: kupon, kartla ödeme (test simülatörü) ve sipariş takibi", async ({ page }) => {
    const errors = collectErrors(page);
    await addProductToCart(page, "lotus-waffle-sosu-10-kg");
    await page.goto("/sepet");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.locator('input[name="code"]').fill("e2e10");
    await page.getByRole("button", { name: "Uygula" }).click();
    await expect(page.getByText("E2E10").first()).toBeVisible();

    await page.getByRole("link", { name: /Ödemeye geç/ }).first().click();
    await expect(page).toHaveURL(/\/odeme$/);
    expect(await seriousA11yViolations(page)).toEqual([]);
    await fillCheckout(page, "misafir-kart@example.test");

    // Sözleşme onayı olmadan sipariş oluşturulamaz; hata sonrası girilen bilgiler (seçim kutuları dahil) korunur
    await page.getByRole("button", { name: /Siparişi onayla/ }).click();
    await expect(page.locator(".field-error").first()).toBeVisible();
    await expect(page.locator("#co-shipCity")).toHaveValue("İstanbul");
    await expect(page.locator("#co-shipAddressLine")).not.toHaveValue("");

    await page.locator("#co-accept").check();
    await page.getByRole("button", { name: /Siparişi onayla/ }).click();
    await page.waitForURL(/\/odeme\/BM[0-9A-Z]+/);
    await expect(page.getByText(/Test/).first()).toBeVisible();

    // Sipariş oluşunca ödeme oturumu başlatılır; test modunda ödeme sayfası simülatöre yönlendirir
    await page.getByRole("link", { name: "Test ödeme sayfasını aç" }).click();
    await page.waitForURL(/\/odeme\/test\//);
    await expect(page.getByRole("heading", { name: "Gerçek tahsilat yapılmaz" })).toBeVisible();
    await page.getByRole("button", { name: "Başarılı ödeme gönder" }).click();

    await page.waitForURL(/\/siparis\/BM[0-9A-Z]+/);
    await expect(page.getByRole("heading", { name: "Teşekkürler, siparişiniz alındı" })).toBeVisible();
    await expect(page.getByText("Test siparişi")).toBeVisible();
    expect(errors.filter((e) => !e.includes("Failed to load resource"))).toEqual([]);

    // Sepet boşaltılmış olmalı
    await page.goto("/sepet");
    await expect(page.getByText(/Sepetiniz boş/i)).toBeVisible();
  });

  test("başarısız ödeme siparişi ödenmemiş bırakır ve yeniden denemeye izin verir", async ({ page }) => {
    await addProductToCart(page, "churros-box");
    await page.goto("/odeme");
    await fillCheckout(page, "misafir-hata@example.test");
    await page.locator("#co-accept").check();
    await page.getByRole("button", { name: /Siparişi onayla/ }).click();
    await page.waitForURL(/\/odeme\/BM[0-9A-Z]+/);
    await page.getByRole("link", { name: "Test ödeme sayfasını aç" }).click();
    await page.waitForURL(/\/odeme\/test\//);
    await page.getByRole("button", { name: "Başarısız ödeme gönder" }).click();
    await page.waitForURL(/\/siparis\/BM[0-9A-Z]+\?odeme=hata/);
    // Başarısız denemeden sonra ödeme sayfası yeni deneme başlatma düğmesini gösterir
    await page.getByRole("link", { name: "Ödeme sayfasına git" }).click();
    await expect(page.getByRole("button", { name: /Ödemeyi tekrar dene/ })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Ödemeniz bekleniyor" })).toBeVisible();
    await expect(page.getByText(/Ödeme tamamlanamadı/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Ödeme sayfasına git" })).toBeVisible();
  });

  test("havale/EFT siparişi banka bilgilerini gösterir", async ({ page }) => {
    await addProductToCart(page, "minibon-1-kg");
    await page.goto("/odeme");
    await fillCheckout(page, "misafir-havale@example.test");
    await page.locator('input[name="paymentMethod"][value="BANK_TRANSFER"]').check();
    await page.locator("#co-accept").check();
    await page.getByRole("button", { name: /Siparişi onayla/ }).click();
    await page.waitForURL(/\/siparis\/BM[0-9A-Z]+/);
    await expect(page.getByRole("heading", { name: /havale\/EFT bekleniyor/ })).toBeVisible();
    await expect(page.getByText("TR33 0006 1005 1978 6457 8413 26")).toBeVisible();
  });

  test("stok sınırı aşılamaz", async ({ page }) => {
    await page.goto("/urun/waffle-mix-1-kg");
    const stepperInput = page.getByRole("group", { name: "Satın alma seçenekleri" }).getByRole("spinbutton");
    await stepperInput.fill("5");
    await page.getByRole("group", { name: "Satın alma seçenekleri" }).getByRole("button", { name: "Sepete ekle" }).click();
    // Sunucu ya adedi sınırlar ya da hata mesajı verir; sepette 3'ten fazla olamaz
    await page.goto("/sepet");
    const quantities = await page.getByRole("spinbutton").evaluateAll((inputs) => inputs.map((input) => Number((input as HTMLInputElement).value)));
    expect(Math.max(0, ...quantities)).toBeLessThanOrEqual(3);
  });

  test("sahte ödeme bildirimi reddedilir", async ({ request }) => {
    const response = await request.post("/api/odeme/test/bildirim", {
      form: { reference: "PAY-SAHTE", status: "success", amount: "100", signature: "gecersiz-imza" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(400);
    const paytr = await request.post("/api/odeme/paytr/bildirim", {
      form: { merchant_oid: "X", status: "success", total_amount: "100", hash: "gecersiz" },
    });
    // PayTR yapılandırılmadığında uç nokta yok sayılır; yapılandırıldığında imza doğrulanır
    expect([400, 403, 404]).toContain(paytr.status());
  });
});
