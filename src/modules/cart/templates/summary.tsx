"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import FirstOrderOffer from "@modules/checkout/components/first-order-offer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { isDigitalOnlyCart } from "@lib/util/digital-cart"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (!isDigitalOnlyCart(cart) && cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const itemCount =
    cart.items?.reduce((count, item) => count + item.quantity, 0) ?? 0

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">Checkout</p>
          <Heading
            level="h2"
            className="mt-2 text-[1.8rem] leading-[2.2rem] text-[var(--shreem-ink)]"
          >
            Summary
          </Heading>
        </div>
        <span className="brand-pill min-h-9 shrink-0 px-3 py-1.5 text-[11px]">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
      </div>
      <FirstOrderOffer cart={cart} />
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} digitalOnly={isDigitalOnlyCart(cart)} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="h-[52px] w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]">
          Go to checkout
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
