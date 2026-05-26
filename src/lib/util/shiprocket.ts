import type { HttpTypes } from "@medusajs/types"

export type ShiprocketCourier = {
  courier_name?: string
  courier_company_id?: number
  estimated_delivery_days?: string
  etd?: string
  rate?: number
  freight_charge?: number
}

export type ShiprocketRate = {
  ok: boolean
  available: boolean
  provider?: "shiprocket" | string
  pickup_postcode?: string
  delivery_postcode?: string
  amount?: number
  amount_paise?: number
  courier?: ShiprocketCourier
  all_options?: ShiprocketCourier[]
  message?: string
  error?: string
}

export type ShiprocketStatus =
  | "idle"
  | "waiting"
  | "loading"
  | "available"
  | "unavailable"
  | "error"

const fallbackWeightKg = 1
const fallbackDimensionCm = 0

const getNumericWeight = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getNumericDimension = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const readMetadataNumber = (
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  for (const key of keys) {
    const value = getNumericDimension(metadata?.[key])

    if (value > 0) {
      return value
    }
  }

  return 0
}

const medusaWeightToKg = (value: unknown) => {
  const parsed = getNumericWeight(value)

  if (!parsed) {
    return 0
  }

  // Medusa native product/variant weight is conventionally grams.
  // Explicit metadata like weight_kg remains kilograms.
  return parsed > 50 ? parsed / 1000 : parsed
}

const getLineWeightKg = (
  line: HttpTypes.StoreCartLineItem & {
    product?: { weight?: number | null; metadata?: Record<string, unknown> | null }
    variant?: HttpTypes.StoreProductVariant & {
      weight?: number | null
      metadata?: Record<string, unknown> | null
    }
  }
) =>
  getNumericWeight(line.variant?.metadata?.weight_kg) ||
  getNumericWeight(line.variant?.metadata?.package_weight_kg) ||
  getNumericWeight(line.product?.metadata?.weight_kg) ||
  getNumericWeight(line.product?.metadata?.package_weight_kg) ||
  medusaWeightToKg(line.variant?.weight) ||
  medusaWeightToKg(line.product?.weight) ||
  fallbackWeightKg

const getLineDimensionsCm = (
  line: HttpTypes.StoreCartLineItem & {
    product?: {
      length?: number | null
      width?: number | null
      height?: number | null
      metadata?: Record<string, unknown> | null
    }
    variant?: HttpTypes.StoreProductVariant & {
      length?: number | null
      width?: number | null
      height?: number | null
      metadata?: Record<string, unknown> | null
    }
  }
) => {
  const variantMetadata = line.variant?.metadata || {}
  const productMetadata = line.product?.metadata || {}
  const lengthCm =
    readMetadataNumber(variantMetadata, ["length_cm", "package_length_cm"]) ||
    readMetadataNumber(productMetadata, ["length_cm", "package_length_cm"]) ||
    getNumericDimension((line.variant as any)?.length) ||
    getNumericDimension(line.product?.length) ||
    fallbackDimensionCm
  const breadthCm =
    readMetadataNumber(variantMetadata, [
      "breadth_cm",
      "width_cm",
      "package_breadth_cm",
      "package_width_cm",
    ]) ||
    readMetadataNumber(productMetadata, [
      "breadth_cm",
      "width_cm",
      "package_breadth_cm",
      "package_width_cm",
    ]) ||
    getNumericDimension((line.variant as any)?.width) ||
    getNumericDimension(line.product?.width) ||
    fallbackDimensionCm
  const heightCm =
    readMetadataNumber(variantMetadata, ["height_cm", "package_height_cm"]) ||
    readMetadataNumber(productMetadata, ["height_cm", "package_height_cm"]) ||
    getNumericDimension((line.variant as any)?.height) ||
    getNumericDimension(line.product?.height) ||
    fallbackDimensionCm

  return {
    lengthCm,
    breadthCm,
    heightCm,
  }
}

export function getCartWeightKg(cart: Pick<HttpTypes.StoreCart, "items">) {
  const total = cart.items?.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1)
    const line = item as HttpTypes.StoreCartLineItem & {
      product?: { weight?: number | null; metadata?: Record<string, unknown> | null }
      variant?: HttpTypes.StoreProductVariant & {
        weight?: number | null
        metadata?: Record<string, unknown> | null
      }
    }

    return sum + quantity * getLineWeightKg(line)
  }, 0)

  return total && total > 0 ? total : fallbackWeightKg
}

export function getCartPackageDetails(cart: Pick<HttpTypes.StoreCart, "items">) {
  const weightKg = getCartWeightKg(cart)
  const dimensions =
    cart.items?.reduce(
      (acc, item) => {
        const quantity = Math.max(1, Number(item.quantity || 1))
        const line = item as HttpTypes.StoreCartLineItem & {
          product?: {
            length?: number | null
            width?: number | null
            height?: number | null
            metadata?: Record<string, unknown> | null
          }
          variant?: HttpTypes.StoreProductVariant & {
            length?: number | null
            width?: number | null
            height?: number | null
            metadata?: Record<string, unknown> | null
          }
        }
        const lineDims = getLineDimensionsCm(line)

        return {
          lengthCm: Math.max(acc.lengthCm, lineDims.lengthCm),
          breadthCm: Math.max(acc.breadthCm, lineDims.breadthCm),
          heightCm: acc.heightCm + lineDims.heightCm * quantity,
        }
      },
      { lengthCm: 0, breadthCm: 0, heightCm: 0 }
    ) || { lengthCm: 0, breadthCm: 0, heightCm: 0 }

  return {
    weightKg,
    lengthCm: dimensions.lengthCm || undefined,
    breadthCm: dimensions.breadthCm || undefined,
    heightCm: dimensions.heightCm || undefined,
  }
}

export function getCartShiprocketSignature(
  cart: Pick<HttpTypes.StoreCart, "items">
) {
  return (
    cart.items
      ?.map((item) => {
        const line = item as HttpTypes.StoreCartLineItem & {
          variant?: HttpTypes.StoreProductVariant & {
            weight?: number | null
            metadata?: Record<string, unknown> | null
          }
          product?: { metadata?: Record<string, unknown> | null }
        }

        return [
          item.id,
          item.variant_id || line.variant?.id,
          item.quantity,
          line.variant?.weight,
          line.variant?.metadata?.weight_kg,
          line.variant?.metadata?.package_weight_kg,
          line.product?.metadata?.weight_kg,
          line.product?.metadata?.package_weight_kg,
          line.variant?.metadata?.length_cm,
          line.variant?.metadata?.breadth_cm,
          line.variant?.metadata?.width_cm,
          line.variant?.metadata?.height_cm,
          line.product?.metadata?.length_cm,
          line.product?.metadata?.breadth_cm,
          line.product?.metadata?.width_cm,
          line.product?.metadata?.height_cm,
        ].join(":")
      })
      .join("|") || "empty"
  )
}

export function isIndianAddress(countryCode?: string | null) {
  return countryCode?.toLowerCase() === "in"
}

export function normalizePincode(value?: string | null) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6)
}

export function isCompleteIndianPincode(value?: string | null) {
  return normalizePincode(value).length === 6
}

export function getShiprocketSessionKey(cartId?: string) {
  return cartId ? `shreem:shiprocket-rate:${cartId}` : "shreem:shiprocket-rate"
}

export function getShiprocketEtaLabel(rate?: ShiprocketRate | null) {
  if (!rate?.courier) {
    return ""
  }

  if (rate.courier.etd) {
    return `Estimated delivery: ${rate.courier.etd}`
  }

  if (rate.courier.estimated_delivery_days) {
    return `Estimated delivery: ${rate.courier.estimated_delivery_days} day${
      rate.courier.estimated_delivery_days === "1" ? "" : "s"
    }`
  }

  return ""
}

export function getShiprocketAmountPaise(rate?: ShiprocketRate | null) {
  if (!rate?.available) {
    return 0
  }

  if (Number.isFinite(rate.amount_paise)) {
    return Number(rate.amount_paise)
  }

  return Math.round(Number(rate.amount || 0) * 100)
}

export function getShiprocketAmountMajor(rate?: ShiprocketRate | null) {
  return getShiprocketAmountPaise(rate) / 100
}

export function formatShiprocketAmount(
  amountPaise: number,
  currencyCode = "inr"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100)
}

export function isShiprocketShippingOption(option?: unknown) {
  if (!option || typeof option !== "object") {
    return false
  }

  const record = option as Record<string, any>
  const haystack = [
    record.name,
    record.description,
    record.provider_id,
    record.shipping_option_id,
    record.data?.provider,
    record.data?.provider_id,
    record.data?.courier_name,
    record.metadata?.provider,
    record.metadata?.provider_id,
    record.metadata?.shipping_provider,
    record.metadata?.courier_name,
  ]

  return haystack.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes("shiprocket")
  )
}

export function buildShiprocketShippingData({
  rate,
  weightKg,
  postalCode,
  packageDetails,
}: {
  rate: ShiprocketRate | null
  weightKg: number
  postalCode: string
  packageDetails?: ReturnType<typeof getCartPackageDetails>
}) {
  if (!rate?.available) {
    return undefined
  }

  return {
    provider: "shiprocket",
    pickup_postcode: rate.pickup_postcode || "486001",
    delivery_postcode: rate.delivery_postcode || postalCode,
    amount: rate.amount,
    amount_paise: getShiprocketAmountPaise(rate),
    weight_kg: weightKg,
    length_cm: packageDetails?.lengthCm,
    breadth_cm: packageDetails?.breadthCm,
    height_cm: packageDetails?.heightCm,
    courier: rate.courier
      ? {
          courier_name: rate.courier.courier_name,
          courier_company_id: rate.courier.courier_company_id,
          estimated_delivery_days: rate.courier.estimated_delivery_days,
          etd: rate.courier.etd,
          rate: rate.courier.rate,
          freight_charge: rate.courier.freight_charge,
        }
      : undefined,
  }
}
