import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Shreem",
    template: "%s | Shreem",
  },
  icons: {
    icon: [
      { url: "/icon.jpg", type: "image/jpeg", sizes: "512x512" },
      { url: "/logo.jpeg", type: "image/jpeg", sizes: "1024x1024" },
    ],
    shortcut: [{ url: "/icon.jpg", type: "image/jpeg" }],
    apple: [{ url: "/apple-icon.jpg", type: "image/jpeg", sizes: "180x180" }],
  },
  description:
    "Shop Shreem Cow Products for bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows.",
  keywords: [
    "Shreem",
    "Shreem Cow Products",
    "bilona ghee",
    "neem dhoop",
    "cow dung cake",
    "Jeevamrut",
    "A2 desi cow products",
  ],
  openGraph: {
    title: "Shreem",
    description:
      "Shop Shreem Cow Products for bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows.",
    url: getBaseURL(),
    siteName: "Shreem",
    images: [{ url: "/logo.jpeg", alt: "Shreem peacock-feather inspired logo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shreem",
    description:
      "Shop bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from Shreem.",
    images: ["/logo.jpeg"],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <main className="relative isolate min-h-screen">
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top,rgba(13,129,126,0.22),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(212,161,38,0.24),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(18,63,99,0.14),transparent_30%)]" />
          {props.children}
        </main>
      </body>
    </html>
  )
}
