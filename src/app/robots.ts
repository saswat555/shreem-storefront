import { MetadataRoute } from "next"

import { isSeoEnabled } from "@lib/seo/config"
import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  if (!isSeoEnabled()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    }
  }

  const baseUrl = getBaseURL()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/account/",
          "/*/cart",
          "/*/checkout",
          "/*/order/",
          "/*/verify-email",
          "/*/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
