"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <p className="brand-kicker">Checkout</p>
      <Heading
        level="h2"
        className="text-[2rem] leading-[2.5rem] text-[var(--shreem-ink)]"
      >
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="h-12 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]">
          Go to checkout
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
