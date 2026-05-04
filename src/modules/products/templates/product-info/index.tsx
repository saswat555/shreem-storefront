import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const subtitle = (product as HttpTypes.StoreProduct & { subtitle?: string | null })
    .subtitle
  const highlights = [
    product.collection?.title,
    product.type?.value,
    product.material,
  ].filter(Boolean)
  const detailCards = [
    {
      label: "Collection",
      value: product.collection?.title || "Shreem essential",
    },
    {
      label: "Type",
      value: product.type?.value || "Daily-use product",
    },
    {
      label: "Material",
      value: product.material || "Natural-use focus",
    },
  ]

  return (
    <div id="product-info" className="brand-card p-4 small:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="brand-kicker">Product details</p>
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="brand-pill min-h-9 px-3 py-1.5 text-[11px]"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-y-4">
        <Heading
          level="h2"
          className="text-[2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[2.8rem]"
        >
          About this product
        </Heading>

        {subtitle && (
          <p className="text-sm font-medium leading-6 text-[var(--shreem-accent-dark)] small:text-base small:leading-7">
            {subtitle}
          </p>
        )}

        {!!highlights.length && (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span key={highlight} className="brand-pill px-3 py-1.5 text-[11px]">
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

        <div className="grid grid-cols-3 gap-2">
          {detailCards.map((detail) => (
            <div
              key={detail.label}
              className="rounded-[16px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-3 py-3 small:rounded-[20px] small:px-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                {detail.label}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--shreem-ink)] small:text-sm small:leading-6">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
