import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="min-h-[calc(100vh-64px)] py-4 pb-10 small:py-8">
      <div className="content-container flex h-full w-full max-w-[1240px] flex-col gap-y-5 small:gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <section className="brand-surface relative overflow-hidden px-4 py-6 small:px-8 small:py-10">
          <div
            className="relative z-[1] grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end"
            data-testid="order-complete-container"
          >
            <div>
              <p className="brand-kicker">Order confirmed</p>
              <Heading
                level="h1"
                className="mt-2 max-w-[14ch] text-[2.35rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.1rem]"
              >
                Order placed.
              </Heading>
              <div className="mt-5">
                <OrderDetails order={order} showStatus />
              </div>
            </div>

            <div className="brand-card px-4 py-5 small:px-6">
              <p className="brand-kicker">Next</p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--shreem-muted)]">
                <p>
                  A confirmation has been sent to your email with the order details.
                </p>
                <p>
                  Keep order #{order.display_id} handy if you contact support.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_360px] xl:gap-6">
          <section className="brand-card px-4 py-5 small:px-6 small:py-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="brand-kicker">Order summary</p>
                <Heading
                  level="h2"
                  className="mt-2 text-[1.9rem] leading-none text-[var(--shreem-ink)] small:text-[2.2rem]"
                >
                  Items ordered
                </Heading>
              </div>
            </div>
            <Items order={order} />
            <CartTotals totals={order} />
          </section>

          <div className="grid gap-6">
            <ShippingDetails order={order} />
            <PaymentDetails order={order} />
            <Help />
          </div>
        </div>
      </div>
    </div>
  )
}
