"use client"

import { useMemo, useState, useTransition } from "react"

type ProductDeliveryCheckerProps = {
  initialPincode?: string
  productTitle?: string
  productHandle?: string
}

const sanitizePincode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6)

const getDeliveryPlan = ({
  pincode,
  productTitle,
  productHandle,
}: {
  pincode: string
  productTitle?: string
  productHandle?: string
}) => {
  const productText = `${productTitle || ""} ${productHandle || ""}`.toLowerCase()
  const isGhee = productText.includes("ghee")

  if (pincode.length !== 6) {
    return null
  }

  const zone = Number(pincode.slice(0, 2))
  const carrier = isGhee
    ? "Insured parcel service for ghee"
    : "India Post/manual dispatch"

  if (zone >= 11 && zone <= 28) {
    return {
      carrier,
      timeline: isGhee ? "Estimated delivery in 3-5 days" : "Estimated delivery in 2-4 days",
    }
  }

  if (zone >= 30 && zone <= 49) {
    return {
      carrier,
      timeline: isGhee ? "Estimated delivery in 4-6 days" : "Estimated delivery in 3-5 days",
    }
  }

  if (zone >= 50 && zone <= 85) {
    return {
      carrier,
      timeline: isGhee ? "Estimated delivery in 5-8 days" : "Estimated delivery in 4-7 days",
    }
  }

  return {
    carrier,
    timeline: isGhee ? "Estimated delivery in 6-9 days" : "Estimated delivery in 5-8 days",
  }
}

const ProductDeliveryChecker = ({
  initialPincode = "",
  productTitle,
  productHandle,
}: ProductDeliveryCheckerProps) => {
  const [pincode, setPincode] = useState(sanitizePincode(initialPincode))
  const [savedPincode, setSavedPincode] = useState(sanitizePincode(initialPincode))
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const deliveryPlan = useMemo(
    () =>
      getDeliveryPlan({
        pincode: savedPincode || pincode,
        productTitle,
        productHandle,
      }),
    [pincode, productHandle, productTitle, savedPincode]
  )
  const canCheck = pincode.length === 6

  const savePincode = () => {
    setMessage("")

    if (!canCheck) {
      setMessage("Enter a valid 6 digit pincode.")
      return
    }

    startTransition(async () => {
      const response = await fetch("/api/customer/delivery-pincode", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pincode }),
      }).catch(() => null)

      if (!response?.ok) {
        const body = await response?.json().catch(() => ({}))
        setSavedPincode(pincode)
        setMessage(
          body?.message ||
            "Delivery estimate shown. Sign in to save this pincode."
        )
        return
      }

      const body = await response.json().catch(() => ({}))
      setSavedPincode(sanitizePincode(body?.pincode || pincode))
      setMessage("Delivery pincode saved.")
    })
  }

  return (
    <section className="rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.88)] px-4 py-4 shadow-[0_12px_28px_rgba(15,49,70,0.06)] small:px-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">Delivery</p>
          <h2 className="mt-2 text-lg font-semibold leading-6 text-[var(--shreem-ink)]">
            Check serviceability
          </h2>
        </div>
        {deliveryPlan && (
          <span className="brand-pill shrink-0 px-3 py-1.5 text-[10px]">
            India
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 xsmall:flex-row">
        <input
          inputMode="numeric"
          autoComplete="postal-code"
          value={pincode}
          onChange={(event) => setPincode(sanitizePincode(event.target.value))}
          placeholder="Enter pincode"
          className="h-11 min-w-0 flex-1 rounded-full border border-[var(--shreem-border)] bg-white px-4 text-sm text-[var(--shreem-ink)] outline-none transition focus:border-[var(--shreem-teal)]"
        />
        <button
          type="button"
          onClick={savePincode}
          disabled={isPending}
          className="h-11 rounded-full bg-[var(--shreem-ink)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Checking..." : "Check"}
        </button>
      </div>

      <div className="mt-3 rounded-[14px] bg-white/70 px-3 py-3 text-sm leading-6 text-[var(--shreem-muted)]">
        {deliveryPlan ? (
          <>
            <span className="block font-semibold text-[var(--shreem-ink)]">
              {deliveryPlan.timeline}
            </span>
            <span className="block">
              {deliveryPlan.carrier}. Final dispatch timing is confirmed after
              packing and payment verification.
            </span>
          </>
        ) : (
          "Most Shreem products ship across India. Ghee is handled with insured dispatch where suitable."
        )}
      </div>

      {message && (
        <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
          {message}
        </p>
      )}
    </section>
  )
}

export default ProductDeliveryChecker
export { ProductDeliveryChecker }
