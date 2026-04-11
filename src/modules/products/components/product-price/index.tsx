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
    <div className="flex flex-col text-ui-fg-base">
      <span className="brand-kicker mb-2">Price</span>
      <span
        className={clx("text-[2.1rem] leading-none text-[var(--shreem-ink)]", {
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
      {selectedPrice.price_type === "sale" && (
        <>
          <p className="mt-2 text-sm text-[var(--shreem-muted)]">
            <span>Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="mt-1 text-sm font-semibold text-[var(--shreem-accent-dark)]">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
