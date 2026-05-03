import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const itemCount =
    cart.items?.reduce((count: number, item: any) => count + item.quantity, 0) ??
    0

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
        <CartTotals totals={cart} />
        <ItemsPreviewTemplate cart={cart} />
        <div className="mt-5">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </aside>
  )
}

export default CheckoutSummary
