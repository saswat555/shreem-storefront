import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getStorefrontCacheOptions } from "./cache"

const CATEGORIES_CACHE_TAG = "categories"

export const listCategories = async (query?: Record<string, any>) => {
  const next = await getStorefrontCacheOptions(CATEGORIES_CACHE_TAG)

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = await getStorefrontCacheOptions(CATEGORIES_CACHE_TAG, [
    `category:${handle}`,
  ])

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children, *products",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
