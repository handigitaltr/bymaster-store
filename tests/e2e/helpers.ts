import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "sayfa yatayda taşmamalı").toBeLessThanOrEqual(1);
}

/** Konsol hatalarını ve yakalanmamış istisnaları toplar */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function loginAs(page: Page, email: string, password: string, next = "/hesabim") {
  await page.goto(`/giris?sonra=${encodeURIComponent(next)}`);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL((url) => url.pathname.startsWith(next));
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, E2E_ADMIN.email, E2E_ADMIN.password, "/yonetim");
}

/** Ciddi ve kritik erişilebilirlik ihlallerini döndürür (WCAG 2.1 A/AA kuralları) */
export async function seriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({ id: violation.id, impact: violation.impact, help: violation.help, targets: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")) }));
}

export async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/urun/${slug}`);
  await page.getByRole("group", { name: "Satın alma seçenekleri" }).getByRole("button", { name: "Sepete ekle" }).click();
  const drawer = page.getByRole("dialog", { name: "Sepete eklendi" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Alışverişe devam et" }).click();
  await expect(drawer).toBeHidden();
}
