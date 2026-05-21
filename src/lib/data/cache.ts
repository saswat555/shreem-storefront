import "server-only"

import { getCacheOptions } from "./cookies"

const DEFAULT_CACHE_REVALIDATE_SECONDS = 30
const MIN_CACHE_REVALIDATE_SECONDS = 5

export const getStorefrontCacheRevalidateSeconds = () => {
  const configured = Number(
    process.env.PRODUCT_CACHE_REVALIDATE_SECONDS ||
      process.env.STOREFRONT_CACHE_REVALIDATE_SECONDS ||
      DEFAULT_CACHE_REVALIDATE_SECONDS
  )

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_CACHE_REVALIDATE_SECONDS
  }

  return Math.max(MIN_CACHE_REVALIDATE_SECONDS, Math.floor(configured))
}

export const getStorefrontCacheOptions = async (
  tag: string,
  extraTags: string[] = []
) => {
  const cookieOptions = await getCacheOptions(tag)
  const cookieTags = "tags" in cookieOptions ? cookieOptions.tags : []
  const tags = Array.from(
    new Set([tag, ...extraTags, ...cookieTags].filter(Boolean))
  )

  return {
    tags,
    revalidate: getStorefrontCacheRevalidateSeconds(),
  }
}
