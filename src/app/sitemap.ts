import { MetadataRoute } from "next"

import { listJournalPosts } from "@lib/data/journal"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { isSeoEnabled } from "@lib/seo/config"
import { getBaseURL } from "@lib/util/env"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"

const getCountryCodes = async () => {
  const regions = await listRegions().catch(() => [])
  const countryCodes = regions
    ?.flatMap((region) => region.countries?.map((country) => country.iso_2))
    .filter((code): code is string => Boolean(code))

  return countryCodes?.length ? Array.from(new Set(countryCodes)) : ["in"]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSeoEnabled()) {
    return []
  }

  const baseUrl = getBaseURL()
  const now = new Date()
  const countryCodes = await getCountryCodes()
  const prakritiEnabled = isPrakritiGuideEnabled()
  const journalPosts = await listJournalPosts()

  const staticEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) => {
    const routes = [
      "",
      "/store",
      "/shreem-astrology",
      "/journal",
      "/customer-service",
      "/gaatha",
      ...(prakritiEnabled ? ["/prakriti-guide"] : []),
    ]

    return routes.map((route) => ({
      url: `${baseUrl}/${countryCode}${route}`,
      lastModified: now,
      changeFrequency: route ? "weekly" : "daily",
      priority: route ? 0.78 : 1,
    }))
  })

  const journalEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    journalPosts.map((post) => ({
      url: `${baseUrl}/${countryCode}/journal/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.74,
    }))
  )

  const productEntries = await Promise.all(
    countryCodes.map(async (countryCode) => {
      const products = await listProducts({
        countryCode,
        queryParams: {
          limit: 100,
          fields: "handle,updated_at,created_at",
        },
      })
        .then(({ response }) => response.products)
        .catch(() => [])

      return products
        .filter((product) => product.handle)
        .map((product) => ({
          url: `${baseUrl}/${countryCode}/products/${product.handle}`,
          lastModified: new Date(product.updated_at || product.created_at || now),
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }))
    })
  )

  return [...staticEntries, ...journalEntries, ...productEntries.flat()]
}
