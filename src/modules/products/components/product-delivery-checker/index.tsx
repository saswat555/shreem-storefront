"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  formatShiprocketAmount,
  getShiprocketAmountPaise,
  getShiprocketEtaLabel,
  normalizePincode,
  type ShiprocketRate,
} from "@lib/util/shiprocket"

const STORAGE_KEY = "shreem:preferred-delivery-pincode"

const getNumericWeight = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getNumericDimension = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const medusaWeightToKg = (value: unknown) => {
  const parsed = getNumericWeight(value)

  if (!parsed) {
    return 0
  }

  return parsed > 50 ? parsed / 1000 : parsed
}

const metadataNumber = (metadata: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = getNumericDimension(metadata[key])

    if (value > 0) {
      return value
    }
  }

  return 0
}

type StoreProductVariant = NonNullable<HttpTypes.StoreProduct["variants"]>[number]

const hasVariantPackageSignal = (variant: StoreProductVariant) => {
  const metadata = (variant.metadata || {}) as Record<string, unknown>

  return Boolean(
    getNumericWeight((variant as any).weight) ||
      getNumericWeight(metadata.weight_kg) ||
      getNumericWeight(metadata.package_weight_kg) ||
      metadataNumber(metadata, ["length_cm", "package_length_cm"]) ||
      metadataNumber(metadata, [
        "breadth_cm",
        "width_cm",
        "package_breadth_cm",
        "package_width_cm",
      ]) ||
      metadataNumber(metadata, ["height_cm", "package_height_cm"])
  )
}

const resolveRateVariant = (
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string | null
) => {
  const variants = product.variants || []

  if (selectedVariantId) {
    const selectedVariant = variants.find(
      (variant) => variant.id === selectedVariantId
    )

    if (selectedVariant) {
      return selectedVariant
    }
  }

  return variants.find(hasVariantPackageSignal) || variants[0]
}

const getProductWeightKg = (
  product: HttpTypes.StoreProduct,
  variant?: StoreProductVariant
) => {
  const packageVariant = variant || product.variants?.find(hasVariantPackageSignal)
  const variantMetadata = (packageVariant?.metadata || {}) as Record<
    string,
    unknown
  >
  const productMetadata = (product.metadata || {}) as Record<string, unknown>

  return (
    getNumericWeight(variantMetadata.weight_kg) ||
    getNumericWeight(variantMetadata.package_weight_kg) ||
    getNumericWeight(productMetadata.weight_kg) ||
    getNumericWeight(productMetadata.package_weight_kg) ||
    medusaWeightToKg((packageVariant as any)?.weight) ||
    medusaWeightToKg((product as any).weight) ||
    1
  )
}

const getProductPackage = (
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string | null
) => {
  const variant = resolveRateVariant(product, selectedVariantId)
  const variantMetadata = (variant?.metadata || {}) as Record<
    string,
    unknown
  >
  const productMetadata = (product.metadata || {}) as Record<string, unknown>

  return {
    variantTitle: variant?.title,
    weight: getProductWeightKg(product, variant),
    length:
      metadataNumber(variantMetadata, ["length_cm", "package_length_cm"]) ||
      metadataNumber(productMetadata, ["length_cm", "package_length_cm"]) ||
      getNumericDimension((variant as any)?.length) ||
      getNumericDimension((product as any).length) ||
      undefined,
    breadth:
      metadataNumber(variantMetadata, [
        "breadth_cm",
        "width_cm",
        "package_breadth_cm",
        "package_width_cm",
      ]) ||
      metadataNumber(productMetadata, [
        "breadth_cm",
        "width_cm",
        "package_breadth_cm",
        "package_width_cm",
      ]) ||
      getNumericDimension((variant as any)?.width) ||
      getNumericDimension((product as any).width) ||
      undefined,
    height:
      metadataNumber(variantMetadata, ["height_cm", "package_height_cm"]) ||
      metadataNumber(productMetadata, ["height_cm", "package_height_cm"]) ||
      getNumericDimension((variant as any)?.height) ||
      getNumericDimension((product as any).height) ||
      undefined,
  }
}

const savePincodeForCustomer = async (pincode: string) => {
  await fetch("/api/customer/delivery-pincode", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode }),
    cache: "no-store",
  }).catch(() => null)
}

const ProductDeliveryChecker = ({
  product,
  initialPincode,
}: {
  product: HttpTypes.StoreProduct
  initialPincode?: string
}) => {
  const searchParams = useSearchParams()
  const selectedVariantId = searchParams.get("v_id")
  const [pincode, setPincode] = useState("")
  const [status, setStatus] = useState<
    "idle" | "loading" | "available" | "unavailable" | "error"
  >("idle")
  const [message, setMessage] = useState("")
  const [rate, setRate] = useState<ShiprocketRate | null>(null)
  const packageDetails = useMemo(
    () => getProductPackage(product, selectedVariantId),
    [product, selectedVariantId]
  )

  useEffect(() => {
    setStatus("idle")
    setMessage("")
    setRate(null)
  }, [
    packageDetails.variantTitle,
    packageDetails.weight,
    packageDetails.length,
    packageDetails.breadth,
    packageDetails.height,
  ])

  useEffect(() => {
    const localPincode =
      typeof window !== "undefined"
        ? normalizePincode(window.localStorage.getItem(STORAGE_KEY))
        : ""
    const seed = localPincode || normalizePincode(initialPincode)

    if (seed) {
      setPincode(seed)
    }

    fetch("/api/customer/delivery-pincode", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const saved = normalizePincode(data?.pincode)

        if (saved) {
          setPincode(saved)
          window.localStorage.setItem(STORAGE_KEY, saved)
        }
      })
      .catch(() => null)
  }, [initialPincode])

  const checkDelivery = async (nextPincode = pincode) => {
    const normalized = normalizePincode(nextPincode)

    setPincode(normalized)
    setRate(null)

    if (normalized.length !== 6) {
      setStatus("error")
      setMessage("Enter a valid 6 digit Indian pincode.")
      return
    }

    setStatus("loading")
    setMessage("")

    const response = await fetch("/api/shiprocket/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postal_code: normalized,
        weight: packageDetails.weight,
        length: packageDetails.length,
        breadth: packageDetails.breadth,
        height: packageDetails.height,
      }),
      cache: "no-store",
    }).catch(() => null)

    const data = (await response?.json().catch(() => null)) as
      | ShiprocketRate
      | null

    if (!response?.ok || !data?.available) {
      setStatus(data?.available === false ? "unavailable" : "error")
      setMessage(
        data?.message ||
          data?.error ||
          "Delivery is not available for this pincode right now."
      )
      return
    }

    setRate(data)
    setStatus("available")
    setMessage("Delivery is available for this pincode.")

    window.localStorage.setItem(STORAGE_KEY, normalized)
    savePincodeForCustomer(normalized)
  }

  const amount = getShiprocketAmountPaise(rate)
  const eta = getShiprocketEtaLabel(rate)

  return (
    <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.82)] px-4 py-4">
      <p className="brand-kicker">Delivery</p>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        Check Shiprocket serviceability and live delivery cost before checkout.
      </p>
      {packageDetails.variantTitle && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
          Variant: {packageDetails.variantTitle}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 small:flex-row">
        <input
          inputMode="numeric"
          autoComplete="postal-code"
          value={pincode}
          onChange={(event) => {
            setPincode(normalizePincode(event.target.value))
            setStatus("idle")
            setMessage("")
            setRate(null)
          }}
          placeholder="Enter pincode"
          className="h-12 min-w-0 flex-1 rounded-full border border-[var(--shreem-border)] bg-white/82 px-4 text-sm text-[var(--shreem-ink)] outline-none"
        />
        <button
          type="button"
          onClick={() => checkDelivery()}
          disabled={status === "loading"}
          className="rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_58%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === "loading" ? "Checking..." : "Check"}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-[16px] border px-3 py-3 text-sm leading-6 ${
            status === "available"
              ? "border-[rgba(13,129,126,0.2)] bg-[rgba(240,248,246,0.86)] text-[var(--shreem-ink)]"
              : "border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.8)] text-[var(--shreem-muted)]"
          }`}
        >
          <p className="font-semibold">{message}</p>
          {status === "available" && (
            <div className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {amount > 0 && <p>Shipping: {formatShiprocketAmount(amount)}</p>}
              {rate?.courier?.courier_name && (
                <p>Courier: {rate.courier.courier_name}</p>
              )}
              {eta && <p>{eta}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDeliveryChecker
