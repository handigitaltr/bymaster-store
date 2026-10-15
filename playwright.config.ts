import { defineConfig, devices } from "@playwright/test";

/**
 * Uçtan uca testler üretim derlemesi üzerinde, AYRI bir test veritabanıyla (prisma/e2e.db) ve
 * yalnızca test modunda çalışan ödeme simülatörüyle koşar. Gerçek ödeme sağlayıcısına istek gitmez.
 */
const PORT = 3100;
export const E2E_ADMIN = { email: "e2e-admin@example.test", password: process.env.E2E_ADMIN_PASSWORD ?? "E2e-Test-Parola-2026" };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "masaustu", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobil\.spec\.ts/ },
    { name: "mobil", use: { ...devices["Pixel 7"] }, testMatch: /mobil\.spec\.ts/ },
  ],
  webServer: {
    command: "npx tsx scripts/prepare-e2e.ts && npx next build && npx next start --port 3100",
    url: `http://localhost:${PORT}/robots.txt`,
    timeout: 900_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      DATABASE_URL: "file:./e2e.db",
      APP_URL: `http://localhost:${PORT}`,
      SESSION_SECRET: "e2e-session-secret-yalnizca-test-icin-0123456789",
      UPLOAD_DIR: "./storage/e2e-uploads",
      PAYMENT_PROVIDER: "mock",
      PAYMENT_MODE: "test",
      SMTP_HOST: "",
      NOINDEX: "true",
      E2E_ADMIN_PASSWORD: E2E_ADMIN.password,
    },
  },
});
