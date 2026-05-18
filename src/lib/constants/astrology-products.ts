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
    image_url: "/shreem-scenes/bilona-process.png",
  },
  {
    title: "Neem Dhoop Batti",
    handle: "neem-dhoop-batti",
    product_url: "/products/neem-dhoop-batti",
    image_url: "/shreem-scenes/neem-dhoop.png",
  },
  {
    title: "Cow Dung Cakes",
    handle: "cow-dung-cakes",
    product_url: "/products/cow-dung-cakes",
    image_url: "/shreem-scenes/postive-energy.png",
  },
  {
    title: "Jeevamrut",
    handle: "jeevamrut",
    product_url: "/products/jeevamrut",
    image_url: "/shreem-scenes/hero-scene.png",
  },
  {
    title: "30 min astrology consultation",
    handle: "shreem-astrology-30-minute-call",
    product_url: "/products/shreem-astrology-30-minute-call",
    image_url: "/mayur.png",
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
