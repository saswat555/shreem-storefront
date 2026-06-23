import { HttpTypes } from "@medusajs/types"

const AI_DIGITAL_HANDLES = new Set([
  "shreem-ai-jyotish-credits",
  "shreem-ai-jyotish-monthly",
])

const DIGITAL_PRODUCT_KEYS = [
  "digital",
  "is_digital",
  "digital_product",
  "no_shipping",
  "requires_shipping",
]

const truthyMetadata = (value: unknown) =>
  value === true ||
  value === "true" ||
  value === "yes" ||
  value === "1" ||
  value === 1

const falseyMetadata = (value: unknown) =>
  value === false || value === "false" || value === "0" || value === 0

const metadataMarksDigital = (metadata?: Record<string, unknown> | null) => {
  if (!metadata) {
    return false
  }

  if (truthyMetadata(metadata.digital_product_type)) {
    return true
  }

  return DIGITAL_PRODUCT_KEYS.some((key) => {
    if (key === "requires_shipping") {
      return falseyMetadata(metadata[key])
    }

    return truthyMetadata(metadata[key])
  })
}

export const isDigitalAiLineItem = (
  item?: Partial<HttpTypes.StoreCartLineItem> | null
) => {
  const line = item as any
  const product = line?.product || line?.variant?.product || {}
  const variant = line?.variant || {}
  const handle = String(product?.handle || line?.product_handle || "").toLowerCase()
  const sku = String(variant?.sku || line?.variant_sku || "").toLowerCase()
  const title = [
    line?.title,
    line?.product_title,
    product?.title,
    variant?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (AI_DIGITAL_HANDLES.has(handle)) {
    return true
  }

  if (
    metadataMarksDigital(line?.metadata) ||
    metadataMarksDigital(product?.metadata) ||
    metadataMarksDigital(variant?.metadata)
  ) {
    return true
  }

  return (
    sku.startsWith("shreem-ai-") ||
    title.includes("ai jyotish credit") ||
    title.includes("ai credit") ||
    title.includes("jyotish monthly")
  )
}

export const isDigitalOnlyCart = (cart?: Partial<HttpTypes.StoreCart> | null) => {
  const items = cart?.items || []

  return items.length > 0 && items.every((item) => isDigitalAiLineItem(item))
}
