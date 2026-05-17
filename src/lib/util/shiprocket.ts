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

const getNumericWeight = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function getCartWeightKg(cart: Pick<HttpTypes.StoreCart, "items">) {
  const total = cart.items?.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1)
    const line = item as HttpTypes.StoreCartLineItem & {
      product?: { metadata?: Record<string, unknown> | null }
      variant?: HttpTypes.StoreProductVariant & {
        weight?: number | null
        metadata?: Record<string, unknown> | null
      }
    }

    const weight =
      getNumericWeight(line.variant?.weight) ||
      getNumericWeight(line.variant?.metadata?.weight_kg) ||
      getNumericWeight(line.product?.metadata?.weight_kg) ||
      fallbackWeightKg

    return sum + quantity * weight
  }, 0)

  return total && total > 0 ? total : fallbackWeightKg
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
          line.product?.metadata?.weight_kg,
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
}: {
  rate: ShiprocketRate | null
  weightKg: number
  postalCode: string
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
