// Ürün görseli yerleşim tespiti:
//  - "contain": ürün beyaz zemin üzerinde, kenarlarda boşluk var → karta sığdırılır, zemin kart rengine karışır
//  - "cover": ürün kadraja dayalı / zemin beyaz değil → kartı tamamen doldurur (kırpık kenar görünmez)
import sharp from "sharp";

export async function detectImageFit(input: Buffer | string): Promise<"contain" | "cover"> {
  const { data, info } = await sharp(input)
    .resize({ width: 200, height: 200, fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const band = 6;
  let total = 0;
  let white = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x >= band && x < info.width - band && y >= band && y < info.height - band) continue;
      const i = (y * info.width + x) * info.channels;
      total++;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= 236) white++;
    }
  }
  return white / total >= 0.9 ? "contain" : "cover";
}
