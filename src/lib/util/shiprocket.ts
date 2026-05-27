import type { HttpTypes } from "@medusajs/types"

export type ShiprocketCourier = {
  courier_name?: string
  courier_company_id?: number
  estimated_delivery_days?: string
  etd?: string
  rate?: number
  freight_charge?: number
  provider?: "shiprocket" | "india_post" | string
  option_id?: string
}

export type ShipmentCarrier = "shiprocket" | "india_post"

export type ShipmentPackageLine = {
  line_id?: string
  variant_id?: string
  title: string
  quantity: number
}

export type ShipmentPackage = {
  id: string
  label: string
  carrier: ShipmentCarrier
  separate: boolean
  shipping_class: string
  line_items: ShipmentPackageLine[]
  weight: number
  length?: number
  breadth?: number
  height?: number
}

export type ShipmentPackageQuote = ShipmentPackage & {
  cheapest?: ShiprocketCourier | null
  selected_option?: ShiprocketCourier | null
  all_options: ShiprocketCourier[]
  amount?: number
  amount_paise?: number
  message?: string
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
  package_quotes?: ShipmentPackageQuote[]
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

const readMetadataString = (
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  for (const key of keys) {
    const value = metadata?.[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim().toLowerCase()
    }
  }

  return ""
}

const readMetadataBool = (
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  for (const key of keys) {
    const value = metadata?.[key]

    if (value === true || value === "true" || value === "yes" || value === "1") {
      return true
    }
  }

  return false
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

const getLineTitle = (line: HttpTypes.StoreCartLineItem & any) =>
  String(line.title || line.product?.title || line.variant?.title || "Item")

const getLineHandle = (line: HttpTypes.StoreCartLineItem & any) =>
  String(line.product?.handle || line.variant?.product?.handle || "")

const getShippingClass = (line: HttpTypes.StoreCartLineItem & any) => {
  const metadata = {
    ...(line.product?.metadata || {}),
    ...(line.variant?.metadata || {}),
    ...(line.metadata || {}),
  }
  const explicit = readMetadataString(metadata, [
    "shipping_class",
    "shipping_group",
    "shipment_group",
    "shipping_profile",
  ])

  if (explicit) {
    return explicit
  }

  const haystack = `${getLineTitle(line)} ${getLineHandle(line)}`.toLowerCase()

  if (/vermi|compost|bio\s*fertil|biofertil|fertilizer|cow\s*dung|dung\s*cake|gobar|upla/.test(haystack)) {
    return "heavy-farm"
  }

  if (/ghee|amchur|mango\s*powder|powder/.test(haystack)) {
    return "food-care"
  }

  return "standard"
}

const getPreferredCarrier = (line: HttpTypes.StoreCartLineItem & any): ShipmentCarrier => {
  const metadata = {
    ...(line.product?.metadata || {}),
    ...(line.variant?.metadata || {}),
    ...(line.metadata || {}),
  }
  const explicit = readMetadataString(metadata, [
    "preferred_carrier",
    "shipping_carrier",
    "carrier",
  ])

  if (explicit.includes("india") || explicit.includes("post")) {
    return "india_post"
  }

  if (explicit.includes("shiprocket")) {
    return "shiprocket"
  }

  return getShippingClass(line) === "heavy-farm" ? "india_post" : "shiprocket"
}

const shouldShipSeparately = (line: HttpTypes.StoreCartLineItem & any) => {
  const metadata = {
    ...(line.product?.metadata || {}),
    ...(line.variant?.metadata || {}),
    ...(line.metadata || {}),
  }

  return (
    readMetadataBool(metadata, [
      "ship_separately",
      "ships_separately",
      "separate_shipping",
      "separate_parcel",
    ]) || getShippingClass(line) === "heavy-farm"
  )
}

export function getCartShipmentPackages(cart: Pick<HttpTypes.StoreCart, "items">) {
  const grouped = new Map<string, ShipmentPackage>()

  cart.items?.forEach((item) => {
    const line = item as HttpTypes.StoreCartLineItem & {
      product?: {
        handle?: string | null
        weight?: number | null
        length?: number | null
        width?: number | null
        height?: number | null
        metadata?: Record<string, unknown> | null
      }
      variant?: HttpTypes.StoreProductVariant & {
        weight?: number | null
        length?: number | null
        width?: number | null
        height?: number | null
        metadata?: Record<string, unknown> | null
      }
      metadata?: Record<string, unknown> | null
    }
    const quantity = Math.max(1, Number(item.quantity || 1))
    const shippingClass = getShippingClass(line)
    const carrier = getPreferredCarrier(line)
    const separate = shouldShipSeparately(line)
    const key = separate
      ? `${carrier}:${shippingClass}:${item.id || line.variant_id || getLineTitle(line)}`
      : `${carrier}:${shippingClass}`
    const lineDims = getLineDimensionsCm(line)
    const lineWeight = getLineWeightKg(line)
    const existing = grouped.get(key) || {
      id: key.replace(/[^a-z0-9:_-]/gi, "-").toLowerCase(),
      label:
        shippingClass === "heavy-farm"
          ? "Heavy farm parcel"
          : shippingClass === "food-care"
            ? "Food and care parcel"
            : "Standard parcel",
      carrier,
      separate,
      shipping_class: shippingClass,
      line_items: [],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
    }

    existing.line_items.push({
      line_id: item.id,
      variant_id: line.variant_id || line.variant?.id,
      title: getLineTitle(line),
      quantity,
    })
    existing.weight += lineWeight * quantity
    existing.length = Math.max(existing.length || 0, lineDims.lengthCm)
    existing.breadth = Math.max(existing.breadth || 0, lineDims.breadthCm)
    existing.height = (existing.height || 0) + lineDims.heightCm * quantity
    grouped.set(key, existing)
  })

  const packages = Array.from(grouped.values()).map((pkg) => ({
    ...pkg,
    weight: Number((pkg.weight || fallbackWeightKg).toFixed(3)),
    length: pkg.length || undefined,
    breadth: pkg.breadth || undefined,
    height: pkg.height || undefined,
  }))

  return packages.length
    ? packages
    : [
        {
          id: "shiprocket:standard",
          label: "Standard parcel",
          carrier: "shiprocket" as ShipmentCarrier,
          separate: false,
          shipping_class: "standard",
          line_items: [],
          weight: fallbackWeightKg,
        },
      ]
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
          line.product?.metadata?.shipping_class,
          line.variant?.metadata?.shipping_class,
          line.product?.metadata?.preferred_carrier,
          line.variant?.metadata?.preferred_carrier,
          line.product?.metadata?.ship_separately,
          line.variant?.metadata?.ship_separately,
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

export function getShipmentPackageQuoteAmountPaise(
  quote?: ShipmentPackageQuote | null
) {
  if (!quote) {
    return 0
  }

  if (Number.isFinite(quote.selected_option?.rate)) {
    return getShiprocketCourierAmountPaise(quote.selected_option)
  }

  if (Number.isFinite(quote.amount_paise)) {
    return Number(quote.amount_paise)
  }

  if (Number.isFinite(quote.amount)) {
    return Math.round(Number(quote.amount) * 100)
  }

  return getShiprocketCourierAmountPaise(quote.cheapest)
}

export function getShiprocketCourierAmountPaise(courier?: ShiprocketCourier | null) {
  if (!courier) {
    return 0
  }

  return Math.round(
    Number(courier.rate ?? courier.freight_charge ?? 0) * 100
  )
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
  courier,
  packageQuotes,
  weightKg,
  postalCode,
  packageDetails,
}: {
  rate: ShiprocketRate | null
  courier?: ShiprocketCourier | null
  packageQuotes?: ShipmentPackageQuote[]
  weightKg: number
  postalCode: string
  packageDetails?: ReturnType<typeof getCartPackageDetails>
}) {
  if (!rate?.available) {
    return undefined
  }

  const selectedCourier = courier || rate.courier
  const selectedPackageQuotes = packageQuotes?.length
    ? packageQuotes
    : rate.package_quotes
  const packageAmountPaise = selectedPackageQuotes?.reduce(
    (sum, quote) => sum + getShipmentPackageQuoteAmountPaise(quote),
    0
  )
  const selectedAmountPaise =
    packageAmountPaise ||
    getShiprocketCourierAmountPaise(selectedCourier) ||
    getShiprocketAmountPaise(rate)

  return {
    provider: "shiprocket",
    pickup_postcode: rate.pickup_postcode || "486001",
    delivery_postcode: rate.delivery_postcode || postalCode,
    amount: selectedAmountPaise / 100,
    amount_paise: selectedAmountPaise,
    weight_kg: weightKg,
    length_cm: packageDetails?.lengthCm,
    breadth_cm: packageDetails?.breadthCm,
    height_cm: packageDetails?.heightCm,
    package_quotes: selectedPackageQuotes,
    courier: selectedCourier
      ? {
          courier_name: selectedCourier.courier_name,
          courier_company_id: selectedCourier.courier_company_id,
          estimated_delivery_days: selectedCourier.estimated_delivery_days,
          etd: selectedCourier.etd,
          rate: selectedCourier.rate,
          freight_charge: selectedCourier.freight_charge,
        }
      : undefined,
  }
}
