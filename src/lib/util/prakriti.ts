export type PrakritiSubject = "plant" | "animal"

export type PrakritiProduct = {
  id: string
  handle: string
  title: string
  description: string
  thumbnail?: string | null
  tags: string[]
}

const normalize = (value: string) => value.toLowerCase()

export const inferPrakritiTags = (product: {
  title?: string | null
  description?: string | null
  tags?: { value?: string | null }[] | string[]
}) => {
  const title = normalize(product.title ?? "")
  const description = normalize(product.description ?? "")
  const sourceTags = Array.isArray(product.tags)
    ? product.tags
        .map((tag) => (typeof tag === "string" ? tag : tag?.value ?? ""))
        .join(" ")
        .toLowerCase()
    : ""

  const haystack = `${title} ${description} ${sourceTags}`
  const inferred = new Set<string>()

  if (/jeevamrut|jeevamrit|bio[\s-]?fert|fertili|soil|farm|garden|plant/.test(haystack)) {
    inferred.add("plant")
    inferred.add("soil")
    inferred.add("farm")
    inferred.add("garden")
  }

  if (/neem/.test(haystack)) {
    inferred.add("mosquito")
    inferred.add("animal-environment")
    inferred.add("home")
  }

  if (/dhoop|dhup|dhooni|repellent|mosquito/.test(haystack)) {
    inferred.add("home")
    inferred.add("mosquito")
  }

  if (/gobar|cow dung|gau kasht|gau-kasht|dung cake/.test(haystack)) {
    inferred.add("ritual")
    inferred.add("fuel")
    inferred.add("compost")
  }

  if (/ghee|bilona/.test(haystack)) {
    inferred.add("food")
    inferred.add("kitchen")
  }

  return Array.from(inferred)
}

export const getRelevantPrakritiProducts = (
  products: PrakritiProduct[],
  subject: PrakritiSubject
) => {
  if (subject === "plant") {
    return products.filter((product) =>
      product.tags.some((tag) =>
        ["plant", "soil", "farm", "garden", "compost"].includes(tag)
      )
    )
  }

  return products.filter((product) =>
    product.tags.some((tag) =>
      ["animal-environment", "mosquito", "home"].includes(tag)
    )
  )
}

export const matchRecommendedProduct = (
  products: PrakritiProduct[],
  recommendation: { handle?: string; title?: string }
) => {
  const handle = normalize(recommendation.handle ?? "")
  const title = normalize(recommendation.title ?? "")

  return (
    products.find((product) => normalize(product.handle) === handle) ||
    products.find((product) => normalize(product.title) === title) ||
    products.find((product) => title && normalize(product.title).includes(title))
  )
}
