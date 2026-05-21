import { getProductPrice } from "@lib/util/get-product-price"
import { toAbsoluteProductImageUrl } from "@lib/util/absolute-url"
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
      <div className="space-y-2 small:space-y-4" data-testid="product-wrapper">
        <Thumbnail
          thumbnail={toAbsoluteProductImageUrl(product.thumbnail)}
          images={product.images?.map((image) => ({
            ...image,
            url: toAbsoluteProductImageUrl(image.url),
          }))}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="brand-card px-3 py-3 small:px-4 small:py-4">
          <div className="mb-2 flex min-w-0 flex-col gap-2 xsmall:flex-row xsmall:items-center xsmall:justify-between small:mb-3">
            <span className="brand-pill hidden px-3 py-1.5 text-[10px] xsmall:inline-flex">
              Shreem product
            </span>
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-[var(--shreem-ink)] small:text-base" data-testid="product-title">
            {product.title}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--shreem-muted)] small:mt-3 small:text-sm">
            <span>View</span>
            <span className="truncate transition-transform duration-300 group-hover:translate-x-1">
              Explore
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
