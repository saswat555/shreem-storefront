import { MetadataRoute } from "next"

import { listBlogPosts } from "@lib/data/journal"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listAllProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { getIndexedCountryCodes, isSeoEnabled } from "@lib/seo/config"
import { toAbsoluteProductImageUrl, toAbsoluteUrl } from "@lib/util/absolute-url"
import { getBaseURL } from "@lib/util/env"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"

export const dynamic = "force-dynamic"

type SitemapEntry = MetadataRoute.Sitemap[number]

const PRODUCT_SITEMAP_PAGE_SIZE = 100
const PRODUCT_SITEMAP_MAX_PAGES = 500

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/store", priority: 0.86, changeFrequency: "daily" },
  { path: "/shreem-astrology", priority: 0.82, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/customer-service", priority: 0.68, changeFrequency: "monthly" },
  { path: "/gaatha", priority: 0.7, changeFrequency: "monthly" },
  { path: "/terms-and-conditions", priority: 0.45, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.45, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.45, changeFrequency: "yearly" },
  { path: "/return-policy", priority: 0.45, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.45, changeFrequency: "yearly" },
] as const

const optionalStaticRoutes = (prakritiEnabled: boolean) =>
  prakritiEnabled
    ? [
        {
          path: "/prakriti-guide",
          priority: 0.74,
          changeFrequency: "weekly",
        } as const,
      ]
    : []

const safeDate = (value?: string | Date | null): Date | undefined => {
  if (!value) {
    return undefined
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const joinUrl = (baseUrl: string, ...parts: string[]) => {
  const path = parts
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\//, "")

  return new URL(path, `${baseUrl}/`).toString()
}

const withOptionalLastModified = (
  entry: Omit<SitemapEntry, "lastModified">,
  lastModified?: Date
): SitemapEntry => ({
  ...entry,
  ...(lastModified ? { lastModified } : {}),
})

const withOptionalImages = (
  entry: Omit<SitemapEntry, "images">,
  images: string[]
): SitemapEntry => ({
  ...entry,
  ...(images.length ? { images } : {}),
})

const unwrapNextImageUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.pathname !== "/_next/image") {
      return value
    }

    return url.searchParams.get("url") || value
  } catch {
    return value
  }
}

const toSitemapImageUrl = (
  value?: string | null,
  options: { preferBackend?: boolean } = {}
) => {
  const absoluteUrl = options.preferBackend
    ? toAbsoluteProductImageUrl(value)
    : toAbsoluteUrl(value)
  const originalUrl = unwrapNextImageUrl(absoluteUrl)

  return options.preferBackend
    ? toAbsoluteProductImageUrl(originalUrl)
    : toAbsoluteUrl(originalUrl)
}

const dedupeByUrl = (entries: SitemapEntry[]) => {
  const seen = new Set<string>()

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false
    }

    seen.add(entry.url)
    return true
  })
}

const getStaticLastModified = () =>
  safeDate(process.env.NEXT_PUBLIC_SITE_LASTMOD || process.env.SITE_LASTMOD)

const getCountryCodes = async () => {
  const indexedCountryCodes = getIndexedCountryCodes()
  const regions = await listRegions().catch(() => [])
  const countryCodes = regions
    ?.flatMap((region) => region.countries?.map((country) => country.iso_2))
    .filter((code): code is string => Boolean(code))
    .map((code) => code.toLowerCase())

  if (!countryCodes?.length) {
    return indexedCountryCodes
  }

  const enabledCodes = new Set(countryCodes)
  const canonicalCodes = indexedCountryCodes.filter((code) =>
    enabledCodes.has(code)
  )

  return canonicalCodes.length ? canonicalCodes : indexedCountryCodes
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSeoEnabled()) {
    return []
  }

  const baseUrl = getBaseURL()
  const staticLastModified = getStaticLastModified()
  const countryCodes = await getCountryCodes()
  const prakritiEnabled = isPrakritiGuideEnabled()
  const blogPosts = await listBlogPosts().catch(() => [])
  const categories = await listCategories({
    limit: 1000,
    fields: "handle,updated_at,created_at",
  }).catch(() => [])
  const { collections } = await listCollections({
    fields: "handle,updated_at,created_at",
    limit: "1000",
  }).catch(() => ({ collections: [], count: 0 }))

  const staticEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) => {
    const routes = [...STATIC_ROUTES, ...optionalStaticRoutes(prakritiEnabled)]

    return routes.map((route) =>
      withOptionalLastModified(
        {
          url: joinUrl(baseUrl, countryCode, route.path),
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        },
        staticLastModified
      )
    )
  })

  const blogEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    blogPosts.map((post) =>
      withOptionalImages(
        withOptionalLastModified(
          {
            url: joinUrl(baseUrl, countryCode, "blog", post.slug),
            changeFrequency: "monthly" as const,
            priority: 0.74,
          },
          safeDate(post.publishedAt)
        ),
        post.image ? [toSitemapImageUrl(post.image)].filter(Boolean) : []
      )
    )
  )

  const categoryEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    categories
      .filter((category) => category.handle)
      .map((category) =>
        withOptionalLastModified(
          {
            url: joinUrl(baseUrl, countryCode, "categories", category.handle!),
            changeFrequency: "weekly" as const,
            priority: 0.72,
          },
          safeDate(category.updated_at || category.created_at)
        )
      )
  )

  const collectionEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    collections
      .filter((collection) => collection.handle)
      .map((collection) =>
        withOptionalLastModified(
          {
            url: joinUrl(baseUrl, countryCode, "collections", collection.handle!),
            changeFrequency: "weekly" as const,
            priority: 0.76,
          },
          safeDate(collection.updated_at || collection.created_at)
        )
      )
  )

  const productEntries = await Promise.all(
    countryCodes.map(async (countryCode) => {
      const products = await listAllProducts({
        countryCode,
        pageSize: PRODUCT_SITEMAP_PAGE_SIZE,
        maxPages: PRODUCT_SITEMAP_MAX_PAGES,
        queryParams: {
          fields: "handle,thumbnail,images.url,updated_at,created_at",
        },
      })
        .catch(() => [])

      return products
        .filter((product) => product.handle)
        .map((product) => {
          const imageUrls = [
            product.thumbnail,
            ...(product.images || []).map((image) => image.url),
          ]
            .map((image) => toSitemapImageUrl(image, { preferBackend: true }))
            .filter(Boolean) as string[]

          return withOptionalImages(
            withOptionalLastModified(
              {
                url: joinUrl(baseUrl, countryCode, "products", product.handle!),
                changeFrequency: "weekly" as const,
                priority: 0.9,
              },
              safeDate(product.updated_at || product.created_at)
            ),
            Array.from(new Set(imageUrls)).slice(0, 10)
          )
        })
    })
  )

  return dedupeByUrl([
    ...staticEntries,
    ...blogEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...productEntries.flat(),
  ])
}
