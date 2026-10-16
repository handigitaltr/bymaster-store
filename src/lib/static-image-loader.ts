// Statik vitrinde (output: "export") Next.js görsel optimizasyonu çalışmaz: görseller olduğu gibi,
// GitHub Pages alt yolu (basePath) eklenerek sunulur. next/image, basePath'i src'ye kendisi eklemez.
export default function staticImageLoader({ src }: { src: string; width: number; quality?: number }) {
  return src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;
}
