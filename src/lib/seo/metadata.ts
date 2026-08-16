import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"

import {
  isSeoEnabled,
  SEO_DISABLED_ROBOTS,
  SEO_ENABLED_ROBOTS,
} from "./config"

const SITE_NAME = "Shreem Farms"
const DEFAULT_TITLE =
  "Shreem Farms | Bilona A2 Ghee, Neem Dhoop, Cow Dung Cakes"
const DEFAULT_DESCRIPTION =
  "Shop Shreem Farms for bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows."
const DEFAULT_KEYWORDS = [
  "Shreem Farms",
  "Shreem",
  "shreemfarms",
  "shreemfarms.in",
  "Shree Farms",
  "shreem farns",
  "bilona ghee",
  "neem dhoop",
  "cow dung cake",
  "Jeevamrut",
  "A2 desi cow products",
]

function getVerificationMetadata(): Metadata["verification"] {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim()

  if (!google && !bing) {
    return undefined
  }

  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  }
}

export function buildRootMetadata(): Metadata {
  const baseUrl = getBaseURL()
  const indexable = isSeoEnabled()

  return {
    metadataBase: new URL(baseUrl),
    applicationName: SITE_NAME,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Shreem",
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: true,
      address: true,
      email: true,
    },
    title: {
      default: DEFAULT_TITLE,
      template: "%s | Shreem Farms",
    },
    icons: {
      icon: [
        { url: "/icon.jpg", type: "image/jpeg", sizes: "512x512" },
        { url: "/logo.jpeg", type: "image/jpeg", sizes: "1024x1024" },
      ],
      shortcut: [{ url: "/icon.jpg", type: "image/jpeg" }],
      apple: [{ url: "/icon.jpg", type: "image/jpeg", sizes: "512x512" }],
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: baseUrl,
      siteName: "Shreem Farms",
      images: [{ url: "/logo.jpeg", alt: "Shreem peacock-feather inspired logo" }],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description:
        "Shop bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from Shreem Farms.",
      images: ["/logo.jpeg"],
    },
    robots: indexable ? SEO_ENABLED_ROBOTS : SEO_DISABLED_ROBOTS,
    verification: indexable ? getVerificationMetadata() : undefined,
    category: "Ecommerce",
  }
}

export const privatePageMetadata: Metadata = {
  robots: SEO_DISABLED_ROBOTS,
}

export function buildPageMetadata({
  title,
  description,
  canonicalPath,
  images = ["/logo.jpeg"],
  openGraphType = "website",
}: {
  title: string
  description: string
  canonicalPath: string
  images?: string[] | { url: string; alt?: string }[]
  openGraphType?: "website" | "article"
}): Metadata {
  const normalizedImages = images.map((image) =>
    typeof image === "string" ? { url: image } : image
  )

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: openGraphType,
      images: normalizedImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: normalizedImages.map((image) => image.url),
    },
    robots: isSeoEnabled() ? SEO_ENABLED_ROBOTS : SEO_DISABLED_ROBOTS,
  }
}
