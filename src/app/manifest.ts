import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shreem Farms",
    short_name: "Shreem Farms",
    description:
      "Shreem Farms bilona A2 ghee, neem dhoop, cow dung cakes, vermicompost, and desi-cow products.",
    start_url: "/in?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fffbf3",
    theme_color: "#0d817e",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      {
        src: "/icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
      {
        src: "/logo.jpeg",
        sizes: "1024x1024",
        type: "image/jpeg",
      },
    ],
  }
}
