import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const highlights = [
    product.collection?.title,
    product.type?.value,
    product.material,
  ].filter(Boolean)

  return (
    <div id="product-info" className="brand-card p-6 small:p-7">
      <p className="brand-kicker">Shreem selection</p>
      <div className="mt-4 flex flex-col gap-y-4 lg:max-w-[500px]">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm font-medium text-[var(--shreem-muted)] hover:text-[var(--shreem-accent-dark)]"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-[2.4rem] leading-[1.02] text-[var(--shreem-ink)]"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {!!highlights.length && (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span key={highlight} className="brand-pill px-3 py-1.5">
                {highlight}
              </span>
            ))}
          </div>
        )}

        <Text
          className="whitespace-pre-line text-sm leading-7 text-[var(--shreem-muted)] small:text-base"
          data-testid="product-description"
        >
          {product.description ||
            "A Shreem product presented with a clearer focus on sourcing, process, and everyday use."}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
