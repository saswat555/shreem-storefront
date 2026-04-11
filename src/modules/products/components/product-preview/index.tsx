import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <div className="space-y-4" data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="brand-card px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="brand-pill px-3 py-1.5 text-[10px]">
              Shreem product
            </span>
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
          <h3 className="text-base font-semibold text-[var(--shreem-ink)]" data-testid="product-title">
            {product.title}
          </h3>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[var(--shreem-muted)]">
            <span>View details</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              Explore
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
