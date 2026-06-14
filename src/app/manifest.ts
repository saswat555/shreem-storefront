import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shreem Cow Products",
    short_name: "Shreem",
    description:
      "Bilona A2 ghee, neem dhoop, cow dung cakes, and Jeevamrut from desi cows.",
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
