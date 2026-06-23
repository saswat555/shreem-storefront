import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

const LOW_STORE_PRIORITY_TERMS = [
  "jyotish",
  "astrology",
  "kundli",
  "consultation",
  "credits",
  "monthly",
]

const getStorePriority = (product: HttpTypes.StoreProduct) => {
  const haystack = [
    product.handle,
    product.title,
    product.subtitle,
    product.description,
    product.type?.value,
    ...(product.tags || []).map((tag) => tag.value),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return LOW_STORE_PRIORITY_TERMS.some((term) => haystack.includes(term))
    ? 1
    : 0
}

const sortByStorePriority = (products: HttpTypes.StoreProduct[]) =>
  products.sort((a, b) => {
    const priorityDiff = getStorePriority(a) - getStorePriority(b)

    if (priorityDiff !== 0) {
      return priorityDiff
    }

    return 0
  })

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  let sortedProducts = products as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const priorityDiff = getStorePriority(a) - getStorePriority(b)

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      const priorityDiff = getStorePriority(a) - getStorePriority(b)

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortByStorePriority(sortedProducts)
}
