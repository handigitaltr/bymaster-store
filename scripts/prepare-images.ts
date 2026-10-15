/**
 * Görsel hazırlama betiği (tekrar çalıştırılabilir).
 *
 *  - assets/source/brand altındaki orijinal ByMaster görsellerini ürün kimliğini koruyarak
 *    (yalnızca kırpma/boyutlandırma, içerik değişikliği yok) public/images/products altına aktarır.
 *  - Kit posterlerinden fiyat etiketini İÇERMEYEN kırpmalar üretir (fiyat panelden değişebileceği için).
 *  - Unsplash Lisansı ile kullanılabilen editoryal fotoğrafları indirir (assets/CREDITS.md).
 *  - Görseli olmayan ürünler için açıkça illüstrasyon olan "temsili görsel"ler üretir.
 *
 * Kullanım: npm run images:prepare
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "assets", "source", "brand");
const OUT_PRODUCTS = path.join(ROOT, "public", "images", "products");
const OUT_EDITORIAL = path.join(ROOT, "public", "images", "editorial");
const OUT_PLACEHOLDER = path.join(ROOT, "public", "images", "placeholders");

for (const dir of [OUT_PRODUCTS, OUT_EDITORIAL, OUT_PLACEHOLDER]) fs.mkdirSync(dir, { recursive: true });

type Crop = { left: number; top: number; width: number; height: number };

async function exportProduct(source: string, out: string, crop?: Crop, maxSize = 1400) {
  let img = sharp(path.join(SRC, source));
  if (crop) img = img.extract(crop);
  await img
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(path.join(OUT_PRODUCTS, out));
  console.log("  ürün  ", out);
}

// ---------------------------------------------------------------------------
// 1) Ürün görselleri
// ---------------------------------------------------------------------------
const productImages: Array<[string, string, Crop?]> = [
  ["sutlu-waffle-sosu-kova.jpg", "sutlu-waffle-sosu-kova.webp"],
  ["beyaz-waffle-sosu-kova.jpg", "beyaz-waffle-sosu-kova.webp"],
  ["antep-fistikli-waffle-sosu-kova.jpg", "antep-fistikli-waffle-sosu-kova.webp"],
  ["frambuazli-waffle-sosu-kova.jpg", "frambuazli-waffle-sosu-kova.webp"],
  ["lotus-waffle-sosu-kova.jpg", "lotus-waffle-sosu-kova.webp"],
  ["waffle-mix-koli.jpg", "waffle-mix-koli.webp"],
  ["sutlu-cikolata-sos-300g.jpg", "sutlu-cikolata-sos-300g.webp"],
  ["krep-kirigi-sade.jpg", "krep-kirigi-sade.webp"],
  ["krep-kirigi-cilek.jpg", "krep-kirigi-cilek.webp"],
  ["krep-kirigi-karamel.jpg", "krep-kirigi-karamel.webp"],
  ["krep-kirigi-oreo.jpg", "krep-kirigi-oreo.webp"],
  ["krep-kirigi-antep-fistik.jpg", "krep-kirigi-antep-fistik.webp"],
  ["pirinc-patlagi-metalik-mor.jpg", "pirinc-patlagi-metalik-mor.webp"],
  ["pirinc-patlagi-metalik-kirmizi.jpg", "pirinc-patlagi-metalik-kirmizi.webp"],
  ["pirinc-patlagi-metalik-karisik.jpg", "pirinc-patlagi-metalik-karisik.webp"],
  ["pirinc-patlagi-kirmizi-mor.jpg", "pirinc-patlagi-kirmizi-mor.webp"],
  ["minibon.jpg", "minibon.webp"],
  ["cakiltasi.jpg", "cakiltasi.webp"],
  // Üç paketli fotoğraf: her paket ayrı ürüne ait olduğu için üçe bölünür
  ["pirinc-patlagi-sedef-yesil-sari.jpg", "pirinc-patlagi-metalik-sedef-beyaz.webp", { left: 0, top: 0, width: 341, height: 1024 }],
  ["pirinc-patlagi-sedef-yesil-sari.jpg", "pirinc-patlagi-metalik-yesil.webp", { left: 341, top: 0, width: 342, height: 1024 }],
  ["pirinc-patlagi-sedef-yesil-sari.jpg", "pirinc-patlagi-metalik-sari.webp", { left: 683, top: 0, width: 341, height: 1024 }],
  // Kit posterleri: fiyat etiketinin üstünde kalan kutu + içerik etiketi bölgesi
  ["churros-box-poster.jpg", "churros-box.webp", { left: 180, top: 330, width: 540, height: 528 }],
  ["churros-box-poster.jpg", "churros-box-ic.webp", { left: 200, top: 655, width: 500, height: 215 }],
  ["pankek-box-poster.jpg", "pankek-box.webp", { left: 185, top: 330, width: 530, height: 528 }],
  ["pankek-box-poster.jpg", "pankek-box-ic.webp", { left: 200, top: 655, width: 500, height: 215 }],
  // Waffle Box kolajı: metin içermeyen paneller
  ["waffle-box-kolaj.jpg", "waffle-box.webp", { left: 4, top: 4, width: 604, height: 390 }],
  ["waffle-box-kolaj.jpg", "waffle-box-ic.webp", { left: 4, top: 410, width: 604, height: 502 }],
  ["waffle-box-kolaj.jpg", "waffle-box-yan.webp", { left: 624, top: 4, width: 288, height: 390 }],
  ["waffle-box-kolaj.jpg", "waffle-box-soslar.webp", { left: 624, top: 578, width: 288, height: 158 }],
];

// ---------------------------------------------------------------------------
// 2) Editoryal fotoğraflar (Unsplash Lisansı — ticari kullanım serbest)
// ---------------------------------------------------------------------------
export const editorialPhotos: Array<{ file: string; id: string; page: string; credit: string }> = [
  { file: "hero-waffle.jpg", id: "photo-1506280679279-1553382399d6", page: "https://unsplash.com/photos/WBMi3TLZdZc", credit: "Calum Lewis" },
  { file: "sunum-waffle.jpg", id: "photo-1570690050322-26d6a2ec7f3a", page: "https://unsplash.com/photos/rxF0YH7sNTo", credit: "Saurav Rastogi" },
  { file: "sunum-krep.jpg", id: "photo-1565087170449-fa23854a6100", page: "https://unsplash.com/photos/1ZTccDpF71k", credit: "Austin P" },
  { file: "sunum-churros.jpg", id: "photo-1515579171902-e0c5f918b32b", page: "https://unsplash.com/photos/5CPn8_NE2Tc", credit: "Oscar Nord" },
  { file: "pankek.jpg", id: "photo-1694458557352-4b8ca744dea7", page: "https://unsplash.com/photos/UBvMCte4IIo", credit: "Stavros Papadimitriou" },
  { file: "dondurma-sos.jpg", id: "photo-1600239448128-917653c5bf77", page: "https://unsplash.com/photos/6hr5YZDjyHc", credit: "Abhishek Hajare" },
  { file: "profesyonel-bubble.jpg", id: "photo-1748765210113-2cd8b0ffc992", page: "https://unsplash.com/photos/fwELOD6uvKM", credit: "Raymond Okoro" },
  { file: "profesyonel-sef.jpg", id: "photo-1503453776591-b4548af666a2", page: "https://unsplash.com/photos/OwX4DzrAOq8", credit: "Unsplash" },
  { file: "doku-cikolata-akis.jpg", id: "photo-1760445528687-3528e6e5ea73", page: "https://unsplash.com/photos/5NoDogo8r9w", credit: "Unsplash" },
  { file: "doku-sutlu-cikolata.jpg", id: "photo-1676817167465-38a0fe938c53", page: "https://unsplash.com/photos/OLwCpJmzJOA", credit: "Unsplash" },
  { file: "doku-parlak-cikolata.jpg", id: "photo-1671059949904-affc44138b43", page: "https://unsplash.com/photos/EcnpwkMQb0o", credit: "Unsplash" },
  { file: "antep-tatli.jpg", id: "photo-1482930172332-2293d7138235", page: "https://unsplash.com/photos/bLV15ZhR-YU", credit: "Unsplash" },
  { file: "biskuvili-dondurma.jpg", id: "photo-1674335891384-fc78bbf38db1", page: "https://unsplash.com/photos/DUfcyQIDjdk", credit: "Unsplash" },
  { file: "karamel-akis.jpg", id: "photo-1551024506-0bccd828d307", page: "https://unsplash.com/photos/idTwDKt2j2o", credit: "Unsplash" },
  { file: "waffle-cikolata-sos.jpg", id: "photo-1721078917681-40f74d16d7b7", page: "https://unsplash.com/photos/LxHIG2Gl9MM", credit: "Unsplash" },
  { file: "waffle-cilek.jpg", id: "photo-1713774786593-b3885bb93a19", page: "https://unsplash.com/photos/ODcOMWZDEBc", credit: "Unsplash" },
  { file: "waffle-kase.jpg", id: "photo-1713774788176-e284185f58db", page: "https://unsplash.com/photos/94DeZCA9lAk", credit: "Unsplash" },
  { file: "waffle-meyveli.jpg", id: "photo-1695304781788-2ae3f1b02ccc", page: "https://unsplash.com/photos/O407leTHsJ8", credit: "Unsplash" },
  { file: "kurabiyeli-waffle.jpg", id: "photo-1685166836342-bfab63e8a095", page: "https://unsplash.com/photos/OK0hA3xNVeI", credit: "Unsplash" },
  { file: "pastane-krema.jpg", id: "photo-1519733870-f96bef9bc85f", page: "https://unsplash.com/photos/XTHa-47HjjI", credit: "Unsplash" },
  { file: "pastane-hamur.jpg", id: "photo-1597528662465-55ece5734101", page: "https://unsplash.com/photos/Ns2aJ5OXKds", credit: "Unsplash" },
];

async function downloadEditorial() {
  for (const photo of editorialPhotos) {
    const target = path.join(OUT_EDITORIAL, photo.file);
    if (fs.existsSync(target)) {
      console.log("  mevcut ", photo.file);
      continue;
    }
    const url = `https://images.unsplash.com/${photo.id}?fm=jpg&q=85&w=2200&fit=max`;
    const res = await fetch(url, { headers: { "User-Agent": "ByMaster-image-prep" } });
    if (!res.ok) throw new Error(`İndirilemedi: ${photo.file} (${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(target);
    console.log("  indirildi", photo.file);
  }
}

// ---------------------------------------------------------------------------
// 3) Temsili illüstrasyonlar (fotoğraf gibi görünmez; arayüzde "Temsili görsel" etiketi taşır)
// ---------------------------------------------------------------------------
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return `#${[r, g, b].map((c) => clamp((t - c) * p + c).toString(16).padStart(2, "0")).join("")}`;
}

// Basit, deterministik sözde rastgele sayı üreteci (aynı çıktı için)
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function beadPouchSvg(color: string, seed: number) {
  const rand = rng(seed);
  const light = shade(color, 0.55);
  const dark = shade(color, -0.35);
  let beads = "";
  const r = 15;
  for (let row = 0; row < 40; row++) {
    for (let col = 0; col < 26; col++) {
      const cx = 250 + col * r * 1.9 + (row % 2 ? r * 0.95 : 0) + (rand() - 0.5) * 6;
      const cy = 330 + row * r * 1.65 + (rand() - 0.5) * 6;
      beads += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r - 1 + rand() * 2).toFixed(1)}" fill="url(#bead)"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <radialGradient id="bead" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="0.18" stop-color="${light}"/>
      <stop offset="0.6" stop-color="${color}"/>
      <stop offset="1" stop-color="${dark}"/>
    </radialGradient>
    <linearGradient id="film" x1="0" x2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="0.2" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="0.75" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.9" stop-color="#ffffff" stop-opacity="0.35"/>
    </linearGradient>
    <clipPath id="pouch"><path d="M250 150 Q250 120 280 120 L720 120 Q750 120 750 150 L770 860 Q772 905 728 905 L272 905 Q228 905 230 860 Z"/></clipPath>
  </defs>
  <rect width="1000" height="1000" fill="#ffffff"/>
  <ellipse cx="500" cy="918" rx="300" ry="26" fill="#000" opacity="0.07"/>
  <g clip-path="url(#pouch)">
    <rect x="200" y="100" width="600" height="820" fill="#f4f4f4"/>
    ${beads}
    <rect x="200" y="100" width="600" height="820" fill="url(#film)"/>
  </g>
  <path d="M250 150 Q250 120 280 120 L720 120 Q750 120 750 150 L770 860 Q772 905 728 905 L272 905 Q228 905 230 860 Z" fill="none" stroke="#d6d6d6" stroke-width="4"/>
  <line x1="262" y1="190" x2="738" y2="190" stroke="#d0d0d0" stroke-width="5"/>
  <line x1="262" y1="204" x2="738" y2="204" stroke="#e2e2e2" stroke-width="3"/>
</svg>`;
}

function bucketSvg(sauce: string) {
  const light = shade(sauce, 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <linearGradient id="body" x1="0" x2="1">
      <stop offset="0" stop-color="#24120d"/>
      <stop offset="0.35" stop-color="#4a2a20"/>
      <stop offset="0.55" stop-color="#3b2019"/>
      <stop offset="1" stop-color="#1c0e0a"/>
    </linearGradient>
    <linearGradient id="lid" x1="0" x2="1">
      <stop offset="0" stop-color="#2c1711"/>
      <stop offset="0.4" stop-color="#5a3428"/>
      <stop offset="1" stop-color="#24120d"/>
    </linearGradient>
    <linearGradient id="label" x1="0" x2="1">
      <stop offset="0" stop-color="#e6d8c3"/>
      <stop offset="0.4" stop-color="#f7efe3"/>
      <stop offset="1" stop-color="#d9c8b0"/>
    </linearGradient>
    <clipPath id="labelClip"><path d="M268 430 L732 430 L716 700 L284 700 Z"/></clipPath>
  </defs>
  <rect width="1000" height="1000" fill="#ffffff"/>
  <ellipse cx="500" cy="905" rx="270" ry="28" fill="#000" opacity="0.1"/>
  <path d="M255 250 L745 250 L700 870 Q698 895 670 895 L330 895 Q302 895 300 870 Z" fill="url(#body)"/>
  <path d="M268 430 L732 430 L716 700 L284 700 Z" fill="url(#label)"/>
  <g clip-path="url(#labelClip)">
    <path d="M300 640 C380 520 470 700 560 560 C620 470 690 560 720 520 L730 720 L280 720 Z" fill="${sauce}"/>
    <path d="M330 600 C400 520 470 640 550 540" stroke="${light}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.6"/>
  </g>
  <rect x="236" y="205" width="528" height="58" rx="14" fill="url(#lid)"/>
  <ellipse cx="500" cy="208" rx="262" ry="34" fill="#3d2219"/>
  <ellipse cx="500" cy="204" rx="240" ry="24" fill="#4f2e23"/>
  <path d="M248 250 Q240 120 500 110 Q760 120 752 250" fill="none" stroke="#bfbfbf" stroke-width="10"/>
  <rect x="440" y="98" width="120" height="26" rx="8" fill="#d9d9d9"/>
</svg>`;
}

const beadPlaceholders: Array<[string, string]> = [
  ["pirinc-patlagi-metalik-gumus", "#aeb3ba"],
  ["pirinc-patlagi-metalik-bronz", "#a06a3c"],
  ["pirinc-patlagi-metalik-mavi", "#3a67a8"],
  ["pirinc-patlagi-metalik-turuncu", "#df7a2c"],
  ["pirinc-patlagi-metalik-lila", "#ad94c8"],
  ["pirinc-patlagi-metalik-altin", "#cfa23a"],
  ["pirinc-patlagi-bitter", "#3a2219"],
  ["pirinc-patlagi-sutlu", "#7a4a32"],
  ["pirinc-patlagi-fildisi", "#efe5cf"],
  ["pirinc-patlagi-frambuaz", "#bf3550"],
];

const bucketPlaceholders: Array<[string, string]> = [
  ["bitter-waffle-sosu-kova", "#2a1510"],
  ["premium-cikolata-bazi-kova", "#4b271b"],
];

async function generatePlaceholders() {
  let seed = 7;
  for (const [name, color] of beadPlaceholders) {
    await sharp(Buffer.from(beadPouchSvg(color, seed++ * 7919)))
      .webp({ quality: 88 })
      .toFile(path.join(OUT_PLACEHOLDER, `${name}.webp`));
    console.log("  temsili", `${name}.webp`);
  }
  for (const [name, color] of bucketPlaceholders) {
    await sharp(Buffer.from(bucketSvg(color)))
      .webp({ quality: 88 })
      .toFile(path.join(OUT_PLACEHOLDER, `${name}.webp`));
    console.log("  temsili", `${name}.webp`);
  }
}

async function main() {
  console.log("Ürün görselleri işleniyor…");
  for (const [source, out, crop] of productImages) await exportProduct(source, out, crop);
  console.log("Temsili görseller üretiliyor…");
  await generatePlaceholders();
  console.log("Editoryal fotoğraflar indiriliyor…");
  await downloadEditorial();
  console.log("Tamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
