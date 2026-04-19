"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  useEffect(() => {
    if (!product.variants?.length || Object.keys(options).length > 0) {
      return
    }

    const firstPurchasableVariant = product.variants.find((variant) => {
      if (!variant.manage_inventory) {
        return true
      }

      if (variant.allow_backorder) {
        return true
      }

      return (variant.inventory_quantity || 0) > 0
    })

    if (firstPurchasableVariant) {
      const variantOptions = optionsAsKeymap(firstPurchasableVariant.options)
      setOptions(variantOptions ?? {})
    }
  }, [options, product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [pathname, router, searchParams, selectedVariant, isValidVariant])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    if (selectedVariant?.allow_backorder) {
      return true
    }

    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    return false
  }, [selectedVariant])

  const stockLabel = useMemo(() => {
    if (!selectedVariant) {
      return "Choose a variant"
    }

    if (selectedVariant.allow_backorder && !inStock) {
      return "Available on backorder"
    }

    return inStock ? "Ready to add to cart" : "Currently unavailable"
  }, [inStock, selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="brand-card flex flex-col gap-y-5 p-6" ref={actionsRef}>
        <div>
          <p className="brand-kicker">Purchase options</p>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            Choose your preferred size or variant, check the live price, and move straight into checkout.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="brand-pill px-3 py-1.5">{stockLabel}</span>
            {selectedVariant?.title && (
              <span className="brand-pill px-3 py-1.5">
                {selectedVariant.title}
              </span>
            )}
          </div>
        </div>

        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="h-12 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? `Select ${
                product.options?.[0]?.title?.toLowerCase() || "an option"
              }`
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <div className="grid gap-3">
          <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
            Secure checkout, region-aware pricing, and live cart updates keep the buying flow clean from product page to payment.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/76 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                Checkout clarity
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                Delivery, payment, and final review all stay visible before order placement.
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/76 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                Post-purchase trust
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                Approved customer feedback is shown on the product page with star ratings.
              </p>
            </div>
          </div>
        </div>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
