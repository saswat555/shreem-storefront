"use client"

import { Heading } from "@medusajs/ui"

import {
  formatShiprocketAmount,
  getShiprocketAmountMajor,
  getShiprocketAmountPaise,
  getShiprocketEtaLabel,
  isIndianAddress,
  isShiprocketShippingOption,
  normalizePincode,
} from "@lib/util/shiprocket"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import FirstOrderOffer from "@modules/checkout/components/first-order-offer"
import { useShiprocketCheckout } from "@modules/checkout/context/shiprocket-context"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { useMemo } from "react"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const shiprocket = useShiprocketCheckout()
  const itemCount =
    cart.items?.reduce((count: number, item: any) => count + item.quantity, 0) ??
    0
  const isIndianDelivery = isIndianAddress(cart.shipping_address?.country_code)
  const deliveryPincode = normalizePincode(cart.shipping_address?.postal_code)
  const shiprocketFresh =
    shiprocket.status === "available" &&
    Boolean(shiprocket.rate) &&
    shiprocket.postalCode === deliveryPincode
  const shiprocketAmountPaise = getShiprocketAmountPaise(shiprocket.rate)
  const shiprocketEta = getShiprocketEtaLabel(shiprocket.rate)
  const selectedShippingMethod = cart.shipping_methods?.at(-1)
  const shiprocketSynced = isShiprocketShippingOption(selectedShippingMethod)
  const hasFirstOrderFreeShipping = Boolean(
    cart.promotions?.some(
      (promotion: any) => promotion.code?.toUpperCase() === "FREESHIPFIRST"
    )
  )
  const totals = useMemo(() => {
    if (!isIndianDelivery || !shiprocketFresh) {
      return cart
    }

    const shippingAmount = hasFirstOrderFreeShipping
      ? 0
      : getShiprocketAmountMajor(shiprocket.rate)
    const existingShipping = Number(cart.shipping_subtotal || 0)
    const total = Number(cart.total || 0) - existingShipping + shippingAmount

    return {
      ...cart,
      shipping_subtotal: shippingAmount,
      total,
    }
  }, [
    cart,
    hasFirstOrderFreeShipping,
    isIndianDelivery,
    shiprocket.rate,
    shiprocketFresh,
  ])

  return (
    <aside className="flex flex-col-reverse gap-y-4 py-0 small:flex-col xl:sticky xl:top-28">
      <div className="brand-card w-full px-4 py-5 small:px-6 small:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="brand-kicker">Order summary</p>
            <Heading
              level="h2"
              className="mt-2 flex flex-row items-baseline text-[1.8rem] leading-none text-[var(--shreem-ink)]"
            >
              Your order
            </Heading>
          </div>
          <span className="brand-pill min-h-9 shrink-0 px-3 py-1.5 text-[11px]">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>
        <Divider className="my-5" />
        <CartTotals totals={totals} />
        <div className="mt-4">
          <FirstOrderOffer cart={cart} />
        </div>
        {isIndianDelivery && shiprocketFresh && (
          <div className="mt-4 rounded-[16px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.82)] px-4 py-3 text-sm leading-6 text-[var(--shreem-muted)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--shreem-ink)]">
                  Shiprocket Delivery
                </p>
                {shiprocket.rate?.courier?.courier_name && (
                  <p>{shiprocket.rate.courier.courier_name}</p>
                )}
                {shiprocketEta && <p>{shiprocketEta}</p>}
              </div>
              <span className="shrink-0 font-semibold text-[var(--shreem-ink)]">
                {hasFirstOrderFreeShipping
                  ? "Free"
                  : formatShiprocketAmount(
                      shiprocketAmountPaise,
                      cart.currency_code
                    )}
              </span>
            </div>
            {!shiprocketSynced && (
              <p className="mt-2 font-medium text-amber-800">
                Payment is paused until this live rate is synced into checkout.
              </p>
            )}
          </div>
        )}
        <ItemsPreviewTemplate cart={cart} />
        <div className="mt-5">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </aside>
  )
}

export default CheckoutSummary
