import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import MascotSprites from "@modules/common/components/mascot-sprites"
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
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col gap-y-8 max-w-[1240px] h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <section className="brand-surface relative overflow-hidden px-5 py-8 small:px-8 small:py-10">
          <MascotSprites className="opacity-70" />
          <div
            className="relative z-[1] grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end"
            data-testid="order-complete-container"
          >
            <div>
              <p className="brand-kicker">Order confirmed</p>
              <Heading
                level="h1"
                className="mt-3 max-w-[14ch] text-[2.7rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.1rem]"
              >
                Thank you. Your order was placed successfully.
              </Heading>
              <div className="mt-5">
                <OrderDetails order={order} showStatus />
              </div>
            </div>

            <div className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">What happens next</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Confirmation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    A confirmation has been sent to your email with the main order details.
                  </p>
                </div>
                <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Support
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    If you need help, use the support page and include this order number for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_360px]">
          <section className="brand-card px-5 py-6 small:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="brand-kicker">Order summary</p>
                <Heading
                  level="h2"
                  className="mt-3 text-[2.2rem] leading-none text-[var(--shreem-ink)]"
                >
                  Everything in this order
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
