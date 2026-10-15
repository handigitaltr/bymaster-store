import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Entegrasyon testleri için boş bir SQLite veritabanı hazırlar (prisma/vitest.db).
 * Yalnızca bu test dosyası silinip yeniden oluşturulur; geliştirme/üretim veritabanına dokunulmaz.
 */
export default function setup() {
  const prismaDir = fileURLToPath(new URL("../../prisma/", import.meta.url));
  for (const suffix of ["", "-journal"]) rmSync(`${prismaDir}vitest.db${suffix}`, { force: true });
  execSync("npx prisma migrate deploy", {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    env: { ...process.env, DATABASE_URL: "file:./vitest.db" },
    stdio: "pipe",
  });
}
