import { MetadataRoute } from "next"

import { listBlogPosts } from "@lib/data/journal"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listAllProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { isSeoEnabled } from "@lib/seo/config"
import { getBaseURL } from "@lib/util/env"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"

export const dynamic = "force-dynamic"

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
  const blogPosts = await listBlogPosts()
  const categories = await listCategories().catch(() => [])
  const { collections } = await listCollections({
    fields: "handle,updated_at,created_at",
  }).catch(() => ({ collections: [], count: 0 }))

  const staticEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) => {
    const routes = [
      "",
      "/store",
      "/shreem-astrology",
      "/blog",
      "/customer-service",
      "/gaatha",
      "/terms-and-conditions",
      "/privacy-policy",
      "/refund-policy",
      "/return-policy",
      "/shipping-policy",
      ...(prakritiEnabled ? ["/prakriti-guide"] : []),
    ]

    return routes.map((route) => ({
      url: `${baseUrl}/${countryCode}${route}`,
      lastModified: now,
      changeFrequency: route ? "weekly" : "daily",
      priority: route ? 0.78 : 1,
    }))
  })

  const blogEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    blogPosts.map((post) => ({
      url: `${baseUrl}/${countryCode}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.74,
    }))
  )

  const categoryEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    categories
      .filter((category) => category.handle)
      .map((category) => ({
        url: `${baseUrl}/${countryCode}/categories/${category.handle}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      }))
  )

  const collectionEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    collections
      .filter((collection) => collection.handle)
      .map((collection) => ({
        url: `${baseUrl}/${countryCode}/collections/${collection.handle}`,
        lastModified: new Date(
          collection.updated_at || collection.created_at || now
        ),
        changeFrequency: "weekly" as const,
        priority: 0.76,
      }))
  )

  const productEntries = await Promise.all(
    countryCodes.map(async (countryCode) => {
      const products = await listAllProducts({
        countryCode,
        queryParams: {
          fields: "handle,updated_at,created_at",
        },
      })
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

  return [
    ...staticEntries,
    ...blogEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...productEntries.flat(),
  ]
}
