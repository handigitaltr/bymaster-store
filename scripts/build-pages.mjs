/**
 * GitHub Pages için statik vitrin derlemesi:  npm run pages:build
 *
 * Tam site (sepet, ödeme, üyelik, yönetim) sunucu gerektirir ve GitHub Pages'te çalışamaz. Bu betik:
 *  1. Ürün ve içerik verisini ayrı bir tohum veritabanında (prisma/pages.db) hazırlar,
 *  2. Projeyi .pages-build/ klasörüne kopyalar ve kopyadan sunucu gerektiren yolları çıkarır,
 *  3. Sunucu işlemi (Server Action) modüllerini kopyada işlevsiz taslaklarla değiştirir
 *     (statik modda bu düğmeler zaten gösterilmez; bkz. src/lib/site-mode.ts),
 *  4. Next.js'i statik dışa aktarma modunda derler. Çıktı: .pages-build/out
 *
 * Kaynak kod değişmez. Ortam: PAGES_BASE_PATH (ör. /bymaster-store), PAGES_SITE_URL (tam adres).
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, ".pages-build");
const basePath = process.env.PAGES_BASE_PATH ?? "/bymaster-store";
const siteUrl = (process.env.PAGES_SITE_URL ?? `https://handigitaltr.github.io${basePath}`).replace(/\/$/, "");

// Statik vitrinde yer almayan yollar (src/app altında)
const SERVER_ONLY_ROUTES = [
  "api",
  "media",
  "yonetim",
  "(site)/arama",
  "(site)/bulten",
  "(site)/favoriler",
  "(site)/giris",
  "(site)/hesabim",
  "(site)/iletisim",
  "(site)/karsilastir",
  "(site)/kayit",
  "(site)/odeme",
  "(site)/profesyonel/teklif",
  "(site)/sepet",
  "(site)/sifre-sifirla",
  "(site)/sifremi-unuttum",
  "(site)/siparis",
  "(site)/siparis-takip",
];

// Statik modda kalan bileşenlerin içe aktardığı sunucu işlemi modülleri
const STUBBED_ACTIONS = ["cart", "forms"];

function run(command, env = {}) {
  execSync(command, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
}

// 1. Veri: tohum betiğiyle ayrı veritabanı (geliştirme veritabanındaki test kayıtları vitrine girmez)
const dbFile = path.join(root, "prisma", "pages.db");
for (const suffix of ["", "-journal"]) fs.rmSync(dbFile + suffix, { force: true });
run("npx prisma migrate deploy", { DATABASE_URL: "file:./pages.db" });
run("npx tsx prisma/seed.ts", { DATABASE_URL: "file:./pages.db" });

// 2. Kopya
fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });
for (const entry of ["src", "public", "tsconfig.json", "postcss.config.mjs", "next.config.ts"]) {
  fs.cpSync(path.join(root, entry), path.join(buildDir, entry), { recursive: true });
}
for (const route of SERVER_ONLY_ROUTES) {
  const target = path.join(buildDir, "src", "app", route);
  if (!fs.existsSync(target)) throw new Error(`Çıkarılacak yol bulunamadı: ${route}`);
  fs.rmSync(target, { recursive: true });
}

// Kategori sayfası tam sitede filtre parametrelerini okuduğu için istek anında üretilir (generateStaticParams'ı yoktur);
// statik vitrinde tüm kategoriler derleme anında üretilmelidir
fs.appendFileSync(
  path.join(buildDir, "src", "app", "(site)", "kategori", "[slug]", "page.tsx"),
  [
    "",
    "export async function generateStaticParams() {",
    "  const categories = await db.category.findMany({ where: { isActive: true }, select: { slug: true } });",
    "  return categories.map((category) => ({ slug: category.slug }));",
    "}",
    "",
  ].join("\n"),
);

// 3. Sunucu işlemi taslakları: tipler gerçek modülden (yalnızca tip olarak) alınır, çalışma anında yüklenmez
for (const name of STUBBED_ACTIONS) {
  const dir = path.join(buildDir, "src", "app", "actions");
  const realFile = path.join(dir, `${name}.real.ts`);
  fs.renameSync(path.join(dir, `${name}.ts`), realFile);
  const exported = [...fs.readFileSync(realFile, "utf8").matchAll(/^export async function (\w+)/gm)].map((m) => m[1]);
  const body = [
    "// Statik vitrin derlemesi: sunucu işlemleri yoktur (scripts/build-pages.mjs tarafından üretildi).",
    `export type * from "./${name}.real";`,
    "",
    "const unavailable = async (): Promise<never> => {",
    '  throw new Error("Bu işlem statik vitrinde kullanılamaz.");',
    "};",
    "",
    ...exported.map((fn) => `export const ${fn}: typeof import("./${name}.real").${fn} = unavailable;`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, `${name}.ts`), body);
}

// 4. Statik derleme
const result = spawnSync(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "build"], {
  cwd: buildDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_STATIC_SITE: "1",
    NEXT_PUBLIC_BASE_PATH: basePath,
    APP_URL: siteUrl,
    DATABASE_URL: `file:${dbFile.split(path.sep).join("/")}`,
    // Statik çıktıda oturum ve ödeme yoktur; ortam doğrulaması için gerekli yer tutucular
    SESSION_SECRET: "statik-vitrin-derlemesi-oturum-kullanilmaz-00000000",
    PAYMENT_PROVIDER: "none",
    PAYMENT_MODE: "test",
    NOINDEX: process.env.PAGES_NOINDEX ?? "true",
  },
});
if (result.status !== 0) process.exit(result.status ?? 1);

const outDir = path.join(buildDir, "out");

// Windows'ta Next.js, istemci yönlendiricisinin ön yükleme dosyalarını (__next.<segment>.txt) yol ayırıcısı
// farkı yüzünden iç içe klasörlere yazar; tarayıcı ise noktalarla birleşik tek dosya adı ister.
// Linux'taki (GitHub Actions) çıktıyla aynı olması için bu klasörler düzleştirilir.
if (process.platform === "win32") {
  const flatten = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (!entry.name.startsWith("__next.")) {
        flatten(full);
        continue;
      }
      const files = fs.readdirSync(full, { recursive: true, withFileTypes: true }).filter((item) => item.isFile());
      for (const file of files) {
        const relative = path.relative(full, path.join(file.parentPath, file.name));
        fs.renameSync(path.join(file.parentPath, file.name), path.join(dir, `${entry.name}.${relative.split(path.sep).join(".")}`));
      }
      fs.rmSync(full, { recursive: true });
    }
  };
  flatten(outDir);
}

fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log(`\n✓ Statik vitrin hazır: ${outDir}\n  Yayın adresi: ${siteUrl}/`);
