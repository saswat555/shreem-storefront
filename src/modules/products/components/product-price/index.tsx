import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return (
      <div className="block h-16 w-32 animate-pulse rounded-[20px] bg-[rgba(13,129,126,0.12)]" />
    )
  }

  return (
    <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.76))] px-4 py-4 text-ui-fg-base">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="brand-kicker mb-2 block">Price</span>
          <span
            className={clx("text-[2.2rem] leading-none text-[var(--shreem-ink)]", {
              "text-[var(--shreem-accent-dark)]":
                selectedPrice.price_type === "sale",
            })}
          >
            {!variant && "From "}
            <span
              data-testid="product-price"
              data-value={selectedPrice.calculated_price_number}
            >
              {selectedPrice.calculated_price}
            </span>
          </span>
        </div>
        <div className="rounded-full border border-[rgba(212,161,38,0.3)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--shreem-gold-deep)]">
          {variant ? "Selected variant" : "Best available"}
        </div>
      </div>
      {selectedPrice.price_type === "sale" ? (
        <>
          <p className="mt-3 text-sm text-[var(--shreem-muted)]">
            <span>Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="mt-1 inline-flex rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--shreem-accent-dark)]">
            Save {selectedPrice.percentage_diff}%
          </span>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
          Shipping and taxes are shown clearly during checkout before you place the order.
        </p>
      )}
    </div>
  )
}
