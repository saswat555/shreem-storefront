import type { MetadataRoute } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 3600

type Region = {
  countries?: {
    iso_2?: string
  }[]
}

type Product = {
  handle?: string
  updated_at?: string
  created_at?: string
}

type Category = {
  handle?: string
  updated_at?: string
  created_at?: string
}

type Collection = {
  handle?: string
  updated_at?: string
  created_at?: string
}

type BlogPost = {
  slug?: string
  status?: string
  updated_at?: string
  updatedAt?: string
  created_at?: string
  createdAt?: string
  publishedAt?: string
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.SITE_URL ||
  "https://www.shreemfarms.in"

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://www.shreemfarms.in"

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  ""

const cleanBase = (url: string) => url.replace(/\/+$/, "")

const siteUrl = cleanBase(SITE_URL)
const backendUrl = cleanBase(BACKEND_URL)

const joinUrl = (...parts: Array<string | undefined | null>) =>
  parts
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? String(part).replace(/\/+$/, "")
        : String(part).replace(/^\/+|\/+$/g, "")
    )
    .join("/")

const lastModified = (value?: string) => {
  if (!value) {
    return new Date()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

const uniqByUrl = (entries: MetadataRoute.Sitemap) => {
  const seen = new Set<string>()

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false
    }

    seen.add(entry.url)
    return true
  })
}

async function fetchStore<T>(path: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {}

    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }

    const res = await fetch(`${backendUrl}${path}`, {
      headers,
      next: {
        revalidate: 3600,
      },
    })

    if (!res.ok) {
      return null
    }

    return (await res.json()) as T
  } catch {
    return null
  }
}

async function getCountryCodes() {
  const data = await fetchStore<{ regions?: Region[] }>("/store/regions")

  const countries =
    data?.regions
      ?.flatMap((region) => region.countries || [])
      ?.map((country) => country.iso_2?.toLowerCase())
      ?.filter(Boolean) || []

  return Array.from(new Set(countries.length ? countries : ["in"]))
}

async function getProducts() {
  const data = await fetchStore<{ products?: Product[] }>(
    "/store/products?limit=1000&fields=handle,updated_at,created_at"
  )

  return (data?.products || []).filter((product) => product.handle)
}

async function getCategories() {
  const data = await fetchStore<{ product_categories?: Category[] }>(
    "/store/product-categories?limit=1000&fields=handle,updated_at,created_at"
  )

  return (data?.product_categories || []).filter((category) => category.handle)
}

async function getCollections() {
  const data = await fetchStore<{ collections?: Collection[] }>(
    "/store/collections?limit=1000&fields=handle,updated_at,created_at"
  )

  return (data?.collections || []).filter((collection) => collection.handle)
}

async function getBlogPosts() {
  const data = await fetchStore<{ posts?: BlogPost[] }>("/store/blog")

  return (data?.posts || []).filter(
    (post) => post.slug && (!post.status || post.status === "published")
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countryCodes, products, categories, collections, blogPosts] =
    await Promise.all([
      getCountryCodes(),
      getProducts(),
      getCategories(),
      getCollections(),
      getBlogPosts(),
    ])

  const now = new Date()

  const staticPaths = [
    "",
    "store",
    "gemstones",
    "blog",
    "a2-bilona-ghee",
    "natural-pooja-dhoop",
    "natural-farming-inputs",
    "customer-service",
    "prakriti-guide",
    "privacy-policy",
    "shipping-policy",
    "refund-policy",
    "return-policy",
    "terms-and-conditions",
  ]

  const staticEntries: MetadataRoute.Sitemap = countryCodes.flatMap(
    (countryCode) =>
      staticPaths.map((path) => ({
        url: joinUrl(siteUrl, countryCode, path),
        lastModified: now,
        changeFrequency:
          path === "" || path === "store" ? "daily" : path === "blog" ? "weekly" : "monthly",
        priority:
          path === ""
            ? 1
            : path === "store"
              ? 0.95
              : path === "blog"
                ? 0.85
                : 0.55,
      }))
  )
  const rootEntry: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  const productEntries: MetadataRoute.Sitemap = countryCodes.flatMap(
    (countryCode) =>
      products.map((product) => ({
        url: joinUrl(siteUrl, countryCode, "products", product.handle),
        lastModified: lastModified(product.updated_at || product.created_at),
        changeFrequency: "weekly",
        priority: 0.9,
      }))
  )

  const categoryEntries: MetadataRoute.Sitemap = countryCodes.flatMap(
    (countryCode) =>
      categories.map((category) => ({
        url: joinUrl(siteUrl, countryCode, "categories", category.handle),
        lastModified: lastModified(category.updated_at || category.created_at),
        changeFrequency: "weekly",
        priority: 0.8,
      }))
  )

  const collectionEntries: MetadataRoute.Sitemap = countryCodes.flatMap(
    (countryCode) =>
      collections.map((collection) => ({
        url: joinUrl(siteUrl, countryCode, "collections", collection.handle),
        lastModified: lastModified(collection.updated_at || collection.created_at),
        changeFrequency: "weekly",
        priority: 0.75,
      }))
  )

  const blogEntries: MetadataRoute.Sitemap = countryCodes.flatMap((countryCode) =>
    blogPosts.map((post) => ({
      url: joinUrl(siteUrl, countryCode, "blog", post.slug),
      lastModified: lastModified(
        post.updated_at || post.updatedAt || post.publishedAt || post.created_at || post.createdAt
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    }))
  )

  return uniqByUrl([
    ...rootEntry,
    ...staticEntries,
    ...productEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...blogEntries,
  ])
}
