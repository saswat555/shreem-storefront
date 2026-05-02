"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <section className="brand-card px-5 py-6 small:px-6">
      <p className="brand-kicker">Step 4</p>
      <div className="mb-6 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <Heading
          level="h2"
          className={clx(
            "mt-3 flex flex-row items-center gap-x-3 text-[2rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-[24px] border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.9)] px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-2">
                Final confirmation
              </Text>
              <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
                Review your shipping, payment, and cart summary one last time.
                When you place the order, you also confirm the terms of sale,
                returns policy, and privacy policy.
              </Text>
            </div>
            <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-2">
                What happens next
              </Text>
              <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
                Your order is created immediately and the next screen will show the confirmation details.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </section>
  )
}

export default Review
