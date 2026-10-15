import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, seriousA11yViolations } from "./helpers";

test.describe("Mobil", () => {
  for (const path of ["/", "/urunler", "/urun/lotus-waffle-sosu-10-kg", "/urun/churros-box", "/sepet", "/tarifler", "/profesyonel", "/lezzet-dunyasi", "/iletisim", "/sss"]) {
    test(`yatay taşma yok: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalOverflow(page);
    });
  }

  test("mobil menü açılır ve kategorilere gidilir", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Menü/ }).first().click();
    const menu = page.getByRole("dialog", { name: "Menü" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: /Ürünler|Tüm ürünler/ }).first().click();
    await expect(page).toHaveURL(/\/urunler|\/kategori\//);
  });

  test("ürün sayfasında kaydırınca yapışkan satın alma çubuğu görünür", async ({ page }) => {
    await page.goto("/urun/lotus-waffle-sosu-10-kg");
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(500);
    await expect(page.getByRole("button", { name: "Sepete ekle" }).last()).toBeVisible();
  });
});

test.describe("Mobil erişilebilirlik", () => {
  test("ürün sayfası ve ana sayfa: ciddi ihlal yok", async ({ page }) => {
    for (const path of ["/", "/urun/lotus-waffle-sosu-10-kg"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await seriousA11yViolations(page), path).toEqual([]);
    }
  });
});
