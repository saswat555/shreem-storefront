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
    <div id="product-info" className="brand-card p-6 small:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <p className="brand-kicker">Shreem selection</p>
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="brand-pill px-3 py-1.5"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-y-5 lg:max-w-[500px]">
        <Heading
          level="h2"
          className="text-[2.6rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.2rem]"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {subtitle && (
          <p className="max-w-[36rem] text-base leading-7 text-[var(--shreem-accent-dark)]">
            {subtitle}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
              Everyday use
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              Designed to be understandable, giftable, and easy to reorder.
            </p>
          </div>
          <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
              Product clarity
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              Key details, variant choices, and reviews are visible before checkout.
            </p>
          </div>
          <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
              Checkout ready
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              Pricing stays aligned with the same cart and payment flow used across the store.
            </p>
          </div>
        </div>

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

        <div className="grid gap-3 sm:grid-cols-3">
          {detailCards.map((detail) => (
            <div
              key={detail.label}
              className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                {detail.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-ink)]">
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
