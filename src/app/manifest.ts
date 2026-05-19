import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shreem Cow Products",
    short_name: "Shreem",
    description:
      "Bilona A2 ghee, neem dhoop, cow dung cakes, and Jeevamrut from desi cows.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbf3",
    theme_color: "#0d817e",
    icons: [
      {
        src: "/icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
      {
        src: "/apple-icon.jpg",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  }
}
