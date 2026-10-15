/**
 * Uçtan uca (Playwright) testleri için AYRI bir test veritabanı hazırlar: prisma/e2e.db
 *
 * - Yalnızca DATABASE_URL="file:./e2e.db" iken çalışır; geliştirme veya üretim veritabanına dokunmaz.
 * - Katalog ve içerik normal tohumlama betiğiyle yüklenir.
 * - Sipariş akışını deneyebilmek için AÇIKÇA "TEST" olarak işaretlenmiş satıcı bilgileri, kargo ücreti ve
 *   yayınlanmış yasal metin taslakları eklenir. Bu değerler gerçek değildir ve yalnızca bu test dosyasında bulunur.
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const E2E_DATABASE_URL = "file:./e2e.db";

async function main() {
  if (process.env.DATABASE_URL !== E2E_DATABASE_URL) {
    console.error(`Bu betik yalnızca DATABASE_URL="${E2E_DATABASE_URL}" ile çalışır (şu an: ${process.env.DATABASE_URL ?? "tanımsız"}).`);
    process.exit(1);
  }
  const root = path.resolve(__dirname, "..");
  for (const suffix of ["", "-journal"]) rmSync(path.join(root, "prisma", `e2e.db${suffix}`), { force: true });
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync("npx prisma migrate deploy", { cwd: root, env, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { cwd: root, env, stdio: "inherit" });

  const db = new PrismaClient();
  try {
    await db.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
    await db.siteSettings.update({
      where: { id: 1 },
      data: {
        companyLegalName: "E2E TEST SATICI (gerçek değildir)",
        companyAddress: "Test Mahallesi, Test Sokak No:1, Kadıköy / İstanbul",
        companyPhone: "0212 000 00 00",
        companyEmail: "test-satici@example.test",
        companyTaxOffice: "Test",
        companyTaxNumber: "1234567890",
        shippingFeeKurus: 9_990,
        freeShippingThresholdKurus: 150_000,
        shippingCarrierName: "Test Kargo",
        dispatchTimeText: "Test ortamı — gerçek teslimat süresi değildir",
        bankTransferEnabled: true,
        bankAccountsJson: JSON.stringify([{ bankName: "Test Bankası", accountHolder: "E2E TEST SATICI", iban: "TR33 0006 1005 1978 6457 8413 26" }]),
      },
    });
    await db.page.updateMany({ where: { kind: "LEGAL" }, data: { status: "PUBLISHED", publishedAt: new Date() } });

    // Stok sınırı senaryosu: Waffle Mix 3 adet stokla takip edilir
    await db.productVariant.updateMany({ where: { product: { slug: "waffle-mix-1-kg" } }, data: { trackStock: true, stock: 3 } });

    await db.coupon.create({
      data: { code: "E2E10", description: "E2E test kuponu", type: "PERCENT", value: 10, isActive: true },
    });

    const password = process.env.E2E_ADMIN_PASSWORD ?? "E2e-Test-Parola-2026";
    await db.user.create({
      data: { email: "e2e-admin@example.test", name: "E2E Yönetici", role: "ADMIN", passwordHash: await hashPassword(password) },
    });
    console.log("✓ E2E test veritabanı hazır (prisma/e2e.db)");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
