import { expect, test } from "@playwright/test";

test.describe("B2B teklif", () => {
  test("profesyonel sayfası ve teklif talebi gönderimi", async ({ page }) => {
    await page.goto("/profesyonel");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/profesyonel/teklif");
    await page.locator("#q-product-1").selectOption({ index: 1 });
    await page.locator("#q-qty-1").fill("12");
    await page.locator("#q-companyName").fill("E2E Test Kafe");
    await page.locator("#q-contactName").fill("Deneme Yetkili");
    await page.locator("#q-phone").fill("0532 123 45 67");
    await page.locator("#q-email").fill("kafe-e2e@example.test");
    await page.locator("#q-kvkk").check();
    await page.getByRole("button", { name: "Teklif talebini gönder" }).click();
    await expect(page.getByRole("heading", { name: "Talebiniz alındı" })).toBeVisible();
    await expect(page.getByText(/Referans numaranız: TKF-/)).toBeVisible();
  });

  test("eksik bilgiyle teklif gönderilemez", async ({ page }) => {
    await page.goto("/profesyonel/teklif");
    await page.getByRole("button", { name: "Teklif talebini gönder" }).click();
    await expect(page.locator(".field-error").first()).toBeVisible();
  });
});
