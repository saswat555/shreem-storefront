import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <aside className="sticky top-28 flex flex-col-reverse gap-y-8 py-2 small:flex-col small:py-0">
      <div className="brand-card w-full px-5 py-6 small:px-6">
        <p className="brand-kicker">Order summary</p>
        <Heading
          level="h2"
          className="mt-3 flex flex-row items-baseline text-[2.1rem] leading-none text-[var(--shreem-ink)]"
        >
          In your Cart
        </Heading>
        <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
          Real-time totals, line items, and promotional adjustments stay visible while you move through checkout.
        </p>
        <div className="mt-5 grid gap-3 small:grid-cols-2">
          <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
              Items
            </p>
            <p className="mt-2 text-sm text-[var(--shreem-ink)]">
              {cart.items?.length || 0} product{(cart.items?.length || 0) === 1 ? "" : "s"} ready for checkout
            </p>
          </div>
          <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
              Currency
            </p>
            <p className="mt-2 text-sm uppercase text-[var(--shreem-ink)]">
              {cart.currency_code}
            </p>
          </div>
        </div>
        <Divider className="my-6" />
        <CartTotals totals={cart} />
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </aside>
  )
}

export default CheckoutSummary
