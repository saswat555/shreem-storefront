"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

import { applyPromotions, retrieveCart } from "./cart"
import { getAuthHeaders } from "./cookies"

const DEFAULT_FIRST_ORDER_CODES = ["FIRST10", "FREESHIPFIRST"]

const getFirstOrderPromoCodes = () =>
  (process.env.FIRST_ORDER_PROMO_CODES || DEFAULT_FIRST_ORDER_CODES.join(","))
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))

const getPromotionCodes = (
  promotions?: Array<Pick<HttpTypes.StorePromotion, "code">>
) =>
  (promotions || [])
    .map((promotion) => promotion.code?.trim().toUpperCase())
    .filter(Boolean) as string[]

const hasCartItems = (cart: HttpTypes.StoreCart) =>
  Boolean(cart.items?.some((item) => Number(item.quantity || 0) > 0))

export async function syncFirstOrderOffer() {
  const cart = await retrieveCart()
  const codes = getFirstOrderPromoCodes()

  if (!cart || !hasCartItems(cart) || !codes.length) {
    return { changed: false, eligible: false, reason: "no_cart" }
  }

  const currentCodes = getPromotionCodes(
    (cart as HttpTypes.StoreCart & { promotions?: HttpTypes.StorePromotion[] })
      .promotions
  )
  const cartEmail = typeof cart.email === "string" ? cart.email.trim() : ""

  if (!cartEmail) {
    const nextCodes = currentCodes.filter((code) => !codes.includes(code))
    if (nextCodes.length !== currentCodes.length) {
      await applyPromotions(nextCodes)
      return { changed: true, eligible: false, reason: "needs_email" }
    }

    return { changed: false, eligible: false, reason: "needs_email" }
  }

  const headers = await getAuthHeaders()
  const eligibility = await sdk.client
    .fetch<{
      ok?: boolean
      eligible?: boolean
      reason?: string
    }>("/store/first-order-offer/eligibility", {
      method: "POST",
      headers,
      body: {
        email: cartEmail,
      },
      cache: "no-store",
    })
    .catch(() => ({
      ok: false,
      eligible: false,
      reason: "eligibility_unavailable",
    }))

  const eligible = Boolean(eligibility.eligible)
  const nextCodes = eligible
    ? unique([...currentCodes, ...codes])
    : currentCodes.filter((code) => !codes.includes(code))

  if (nextCodes.join("|") !== currentCodes.join("|")) {
    try {
      await applyPromotions(nextCodes)
      return {
        changed: true,
        eligible,
        reason:
          eligibility.reason || (eligible ? "first_order" : "not_first_order"),
      }
    } catch (error) {
      return {
        changed: false,
        eligible,
        reason: "promotion_not_ready",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return {
    changed: false,
    eligible,
    reason: eligibility.reason || (eligible ? "first_order" : "not_first_order"),
  }
}
