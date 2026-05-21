"use client"

import { Text } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useTransition } from "react"

import { syncFirstOrderOffer } from "@lib/data/first-order-offer"
import { HttpTypes } from "@medusajs/types"

const FIRST_ORDER_CODES = new Set(["FIRST10", "FREESHIPFIRST"])

type FirstOrderOfferProps = {
  cart: HttpTypes.StoreCart & {
    promotions?: HttpTypes.StorePromotion[]
  }
}

const getPromotionCodes = (cart: FirstOrderOfferProps["cart"]) =>
  (cart.promotions || [])
    .map((promotion) => promotion.code?.trim().toUpperCase())
    .filter(Boolean) as string[]

const FirstOrderOffer = ({ cart }: FirstOrderOfferProps) => {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const ranForKey = useRef("")
  const promotionCodes = getPromotionCodes(cart)
  const firstOrderCodes = promotionCodes.filter((code) =>
    FIRST_ORDER_CODES.has(code)
  )
  const key = useMemo(
    () =>
      [
        cart.id,
        cart.email || "",
        cart.items?.map((item) => `${item.id}:${item.quantity}`).join(",") || "",
        promotionCodes.join(","),
      ].join("|"),
    [cart.email, cart.id, cart.items, promotionCodes]
  )

  useEffect(() => {
    if (!cart.items?.length || ranForKey.current === key) {
      return
    }

    ranForKey.current = key
    startTransition(async () => {
      const result = await syncFirstOrderOffer()
      if (result.changed) {
        router.refresh()
      }
    })
  }, [cart.items?.length, key, router])

  if (!firstOrderCodes.length) {
    return null
  }

  return (
    <div className="rounded-[16px] border border-[rgba(13,129,126,0.2)] bg-[rgba(240,248,246,0.86)] px-4 py-3">
      <Text className="text-sm font-semibold text-[var(--shreem-ink)]">
        First order offer applied
      </Text>
      <Text className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
        Your welcome discount and free delivery coupon are active on this bag.
      </Text>
    </div>
  )
}

export default FirstOrderOffer
