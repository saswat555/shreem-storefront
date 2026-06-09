"use client"

import { Heading } from "@medusajs/ui"
import PaymentButton from "@modules/checkout/components/payment-button"

const Review = ({ cart }: { cart: any }) => {
  const hasShipping =
    !cart?.shipping_address ||
    !Array.isArray(cart?.shipping_methods) ||
    cart.shipping_methods.length > 0

  const hasPayment =
    Array.isArray(cart?.payment_collection?.payment_sessions) &&
    cart.payment_collection.payment_sessions.length > 0

  return (
    <section className="brand-card px-4 py-5 small:px-6 small:py-6">
      <div className="mb-5 flex flex-row items-center justify-between">
        <div>
          <p className="brand-kicker">Final step</p>
          <Heading
            level="h2"
            className="mt-2 text-[1.8rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]"
          >
            Review & Pay
          </Heading>
        </div>
      </div>

      <div className="text-small-regular rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-[rgba(255,248,233,0.72)] px-4 py-4">
        <p className="mb-4 text-sm leading-6 text-[var(--shreem-muted)]">
          By placing the order, you confirm that your cart, address, shipping,
          and payment details are correct.
        </p>

        {!hasShipping && (
          <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            Please select a delivery option before placing the order.
          </div>
        )}

        {!hasPayment && (
          <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            Please select a payment method before placing the order.
          </div>
        )}

        <PaymentButton cart={cart} data-testid="submit-order-button" />
      </div>
    </section>
  )
}

export default Review
