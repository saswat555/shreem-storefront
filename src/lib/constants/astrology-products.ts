export type AstrologyProductSuggestion = {
  title: string
  handle: string
  product_url: string
  image_url: string
  reason: string
}

export const astrologyProductCatalog: Omit<
  AstrologyProductSuggestion,
  "reason"
>[] = [
  {
    title: "Bilona Ghee",
    handle: "ghee",
    product_url: "/products/ghee",
    image_url: "/shreem-scenes/bilona-process.jpg",
  },
  {
    title: "Neem Dhoop Batti",
    handle: "organic-neem-dhoob",
    product_url: "/products/organic-neem-dhoob",
    image_url: "/shreem-scenes/neem-dhoop.jpg",
  },
  {
    title: "Cow Dung Cakes",
    handle: "cowdung-cake",
    product_url: "/products/cowdung-cake",
    image_url: "/shreem-scenes/postive-energy.jpg",
  },
  {
    title: "Jeevamrut",
    handle: "shreem-vermicompost",
    product_url: "/products/shreem-vermicompost",
    image_url: "/shreem-scenes/hero-scene.jpg",
  },
  {
    title: "30 min astrology consultation",
    handle: "shreem-expert-jyotish-consultation",
    product_url: "/products/shreem-expert-jyotish-consultation",
    image_url: "/mayur.jpg",
  },
]

export const getAstrologyProductByHandle = (handle: string) =>
  astrologyProductCatalog.find((item) => item.handle === handle)

export const normalizeAstrologyProductSuggestions = (
  suggestions: unknown,
  maxItems = 3
): AstrologyProductSuggestion[] => {
  if (!Array.isArray(suggestions)) {
    return []
  }

  const seen = new Set<string>()

  return suggestions
    .map((item: any) => {
      const rawHandle =
        typeof item?.handle === "string"
          ? item.handle.trim().replace(/^\/products\//, "")
          : ""
      const product = getAstrologyProductByHandle(rawHandle)

      if (!product || seen.has(product.handle)) {
        return null
      }

      seen.add(product.handle)

      const reason =
        typeof item?.reason === "string"
          ? item.reason.trim().slice(0, 240)
          : "Suggested only if it fits your household practice and the reading."

      return {
        ...product,
        reason,
      }
    })
    .filter(Boolean)
    .slice(0, maxItems) as AstrologyProductSuggestion[]
}
