/**
 * Marka ikonlarını ve varsayılan paylaşım görselini üretir (tekrar çalıştırılabilir).
 * Not: Şef şapkası ikonu, kampanya görsellerindeki logodan yeniden çizilmiştir; resmi
 * vektör logo temin edildiğinde bu dosyalar onunla değiştirilmelidir.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const HAT = `<path d="M12 17.92A6 6 0 1 1 12.99 6.34A7.5 7.5 0 0 1 27.01 6.34A6 6 0 1 1 28 17.92V26H12Z" fill="none" stroke="#F7F0E6" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M12 20.2H28M17.4 20.2V26M22.6 20.2V26" stroke="#F7F0E6" stroke-width="1.8" stroke-linecap="round"/>`;

function iconSvg(size: number, rounded: boolean) {
  const radius = rounded ? size * 0.22 : size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#351C16"/>
  <g transform="translate(${size * 0.18} ${size * 0.2}) scale(${(size * 0.64) / 40})">${HAT}</g>
</svg>`;
}

async function main() {
  fs.mkdirSync(path.join(ROOT, "public", "brand"), { recursive: true });

  // Tarayıcı ikonu (SVG) — app/icon.svg dosya kuralı
  fs.writeFileSync(path.join(ROOT, "src", "app", "icon.svg"), iconSvg(64, true));
  await sharp(Buffer.from(iconSvg(512, true))).png().toFile(path.join(ROOT, "public", "brand", "icon-512.png"));
  await sharp(Buffer.from(iconSvg(180, false))).png().toFile(path.join(ROOT, "src", "app", "apple-icon.png"));

  // Varsayılan paylaşım görseli: sunum fotoğrafı + marka rengi geçişi (metin içermez)
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#1c0e0a" stop-opacity="0.92"/><stop offset="0.55" stop-color="#351C16" stop-opacity="0.45"/><stop offset="1" stop-color="#351C16" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <g transform="translate(80 210) scale(5)">${HAT}</g>
  </svg>`);
  await sharp(path.join(ROOT, "public", "images", "editorial", "hero-waffle.jpg"))
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .composite([{ input: overlay }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(ROOT, "public", "images", "og-default.jpg"));

  console.log("Marka varlıkları üretildi.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
