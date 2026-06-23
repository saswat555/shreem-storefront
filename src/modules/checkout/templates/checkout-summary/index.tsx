"use client"

import CartTotals from "@modules/common/components/cart-totals"
import { isDigitalOnlyCart } from "@lib/util/digital-cart"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="sticky top-0 flex flex-col gap-y-8 bg-white py-6">
      <CartTotals totals={cart} digitalOnly={isDigitalOnlyCart(cart)} />
    </div>
  )
}

export default CheckoutSummary
