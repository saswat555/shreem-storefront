"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const totalItems =
    cartState?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <LocalizedClientLink
      aria-label={`Open bag with ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[rgba(245,199,96,0.32)] bg-[rgba(255,248,233,0.12)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] small:h-auto small:w-auto small:min-h-11 small:min-w-[96px] small:px-5 small:py-3 small:text-xs"
      href="/cart"
      data-testid="nav-cart-link"
    >
      <span className="small:hidden" aria-hidden="true">
        Bag
      </span>
      <span className="hidden whitespace-nowrap small:inline">
        {`Bag (${totalItems})`}
      </span>
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f3d37f,#d6a63a)] px-1 text-[10px] font-bold leading-none text-[var(--shreem-ink)] shadow-[0_8px_16px_rgba(11,39,53,0.18)] small:hidden">
        {totalItems}
      </span>
    </LocalizedClientLink>
  )
}

export default CartDropdown
