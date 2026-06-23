import type { MetadataRoute } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 3600

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.SITE_URL ||
  "https://www.shreemfarms.in"

const siteUrl = SITE_URL.replace(/\/+$/, "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/admin/",
          "/account/",
          "/cart/",
          "/checkout/",
          "/order/",
          "/reset-password/",
          "/verify-email/",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
