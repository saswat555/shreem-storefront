"use client"

import {
  isIndianAddress,
  isShiprocketShippingOption,
  normalizePincode,
} from "@lib/util/shiprocket"
import { Heading, Text, clx } from "@medusajs/ui"
import { useShiprocketCheckout } from "@modules/checkout/context/shiprocket-context"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const shiprocket = useShiprocketCheckout()
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0
  const selectedShippingMethod = cart.shipping_methods?.at(-1)
  const isIndianDelivery = isIndianAddress(cart.shipping_address?.country_code)
  const deliveryPincode = normalizePincode(cart.shipping_address?.postal_code)
  const selectedIsShiprocket =
    isShiprocketShippingOption(selectedShippingMethod)
  const shiprocketQuoteReady =
    shiprocket.status === "available" &&
    Boolean(shiprocket.rate) &&
    shiprocket.postalCode === deliveryPincode
  const fallbackAllowed =
    shiprocket.status === "error" &&
    Boolean(selectedShippingMethod) &&
    !selectedIsShiprocket
  const shiprocketReady =
    !isIndianDelivery ||
    fallbackAllowed ||
    (shiprocketQuoteReady && selectedIsShiprocket)

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard) &&
    shiprocketReady

  return (
    <section className="brand-card px-4 py-5 small:px-6 small:py-6">
      <p className="brand-kicker">Step 4</p>
      <div className="mb-5 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <Heading
          level="h2"
          className={clx(
            "mt-2 flex flex-row items-center gap-x-3 text-[1.8rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]",
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
          <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-2">
                Final confirmation
              </Text>
              <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
                Review your shipping, payment, and cart summary one last time.
              </Text>
            </div>
            <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-2">
                Next
              </Text>
              <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
                The next screen shows the confirmation details.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
      {isOpen && !shiprocketReady && (
        <div className="rounded-[18px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] px-4 py-4 text-sm leading-6 text-[var(--shreem-ink)]">
          Shiprocket delivery must be calculated and synced before the order can
          be placed. Return to Delivery and select Shiprocket Delivery.
        </div>
      )}
    </section>
  )
}

export default Review
