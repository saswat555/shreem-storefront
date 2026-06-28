"use client"

import { addToCart } from "@lib/data/cart"
import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export type GemstoneCartOption = {
  id?: string
  label?: string
  medusa_variant_id?: string
  form?: string
  metal?: string
  size?: string
  quality_grade?: string
  weight_carats?: number
  weight_ratti?: number
  stone_price_inr?: number
  making_charge_inr?: number
  total_price_inr?: number
  inventory_quantity?: number
  active?: boolean
}

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const customerPrice = (vendorBase: unknown) =>
  Math.ceil(Number(vendorBase || 0) / 0.8)

const GemstoneAddToCart = ({
  options,
  countryCode,
  disabled,
}: {
  options: GemstoneCartOption[]
  countryCode: string
  disabled?: boolean
}) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const liveOptions = useMemo(
    () =>
      options.filter(
        (option) =>
          option.active !== false &&
          Boolean(option.medusa_variant_id) &&
          Number(option.inventory_quantity || 0) > 0
      ),
    [options]
  )
  const [selectedId, setSelectedId] = useState(liveOptions[0]?.id || "0")
  const selected =
    liveOptions.find((option) => String(option.id || "") === selectedId) ||
    liveOptions[0]

  const add = async () => {
    if (!selected?.medusa_variant_id) {
      return
    }

    setLoading(true)

    try {
      await addToCart({
        variantId: selected.medusa_variant_id,
        quantity: 1,
        countryCode,
      })
      router.push(`/${countryCode}/cart`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {liveOptions.length > 1 && (
        <label className="grid gap-2 text-sm font-semibold text-[var(--shreem-ink)]">
          Choose option
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="rounded-2xl border border-[rgba(18,63,99,0.14)] bg-white px-4 py-3 text-sm font-normal"
          >
            {liveOptions.map((option, index) => (
              <option key={option.id || index} value={String(option.id || index)}>
                {option.label || [option.form, option.metal, option.size].filter(Boolean).join(" · ")} - {money(customerPrice(option.total_price_inr))}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && (
        <div className="rounded-2xl border border-[rgba(18,63,99,0.1)] bg-[rgba(255,252,248,0.78)] px-4 py-3 text-sm text-[var(--shreem-ink)]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{selected.label || "Selected option"}</span>
            <span className="font-semibold">{money(customerPrice(selected.total_price_inr))}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
            {[selected.form, selected.metal, selected.size ? `size ${selected.size}` : "", selected.quality_grade]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
      <Button
        onClick={add}
        isLoading={loading}
        disabled={disabled || !selected?.medusa_variant_id || loading}
        className="w-full rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] text-white"
      >
        {selected?.medusa_variant_id ? "Add selected option" : "Variant mapping needed"}
      </Button>
    </div>
  )
}

export default GemstoneAddToCart
