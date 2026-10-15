/**
 * Yönetici hesabı oluşturur veya mevcut bir hesabı yönetici yapar.
 *
 *   npm run admin:create -- --email siz@alanadiniz.com --name "Ad Soyad"
 *
 * Parola komut satırı geçmişine düşmemesi için ADMIN_PASSWORD ortam değişkeninden okunur;
 * verilmezse güçlü, rastgele bir parola üretilir ve yalnızca bir kez ekrana yazdırılır.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Yönetici";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Kullanım: npm run admin:create -- --email siz@alanadiniz.com --name "Ad Soyad"');
    process.exit(1);
  }
  const provided = process.env.ADMIN_PASSWORD;
  if (provided && provided.length < 12) {
    console.error("ADMIN_PASSWORD en az 12 karakter olmalıdır.");
    process.exit(1);
  }
  const password = provided ?? randomBytes(15).toString("base64url");
  const passwordHash = await hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "ADMIN", passwordHash, isActive: true } });
    await db.session.deleteMany({ where: { userId: existing.id } });
    console.log(`✓ ${email} yönetici yapıldı ve parolası güncellendi.`);
  } else {
    await db.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });
    console.log(`✓ Yönetici oluşturuldu: ${email}`);
  }
  if (!provided) {
    console.log(`\n  Geçici parola: ${password}\n  Giriş yaptıktan sonra Hesabım > Profil bölümünden değiştirin.\n`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
