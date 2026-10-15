import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ByMaster — Professional Pastry Products",
    short_name: "ByMaster",
    description: "Waffle sosları, süslemeler ve evde tatlı kitleri.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#351C16",
    lang: "tr",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
