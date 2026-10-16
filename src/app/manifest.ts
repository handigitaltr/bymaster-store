import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/site-mode";

// Derleme anında üretilir (statik vitrin dışa aktarımı da bunu gerektirir)
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ByMaster — Professional Pastry Products",
    short_name: "ByMaster",
    description: "Waffle sosları, süslemeler ve evde tatlı kitleri.",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#351C16",
    lang: "tr",
    icons: [
      { src: `${BASE_PATH}/icon.svg`, type: "image/svg+xml", sizes: "any" },
      { src: `${BASE_PATH}/brand/icon-512.png`, type: "image/png", sizes: "512x512" },
    ],
  };
}
