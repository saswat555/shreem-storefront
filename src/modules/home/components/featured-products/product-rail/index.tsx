import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
  index,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  index: number
}) {
  const pricedProducts = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

  if (!pricedProducts.length) {
    return null
  }

  const accentClass =
    index % 2 === 0
      ? "bg-[linear-gradient(180deg,rgba(255,251,245,0.92),rgba(239,248,245,0.88)),radial-gradient(circle_at_top_right,rgba(13,129,126,0.1),transparent_25%)]"
      : "bg-[linear-gradient(180deg,rgba(255,249,243,0.92),rgba(245,246,251,0.88)),radial-gradient(circle_at_top_right,rgba(212,161,38,0.14),transparent_25%)]"

  return (
    <section className="content-container py-8 small:py-12">
      <div className={`brand-surface px-5 py-6 small:px-8 small:py-8 ${accentClass}`}>
        <div className="mb-8 flex flex-col gap-3 small:flex-row small:items-end small:justify-between">
          <header>
            <p className="brand-kicker">Collection {`${index + 1}`.padStart(2, "0")}</p>
            <h2 className="mt-2 text-3xl text-[var(--shreem-ink)] small:text-[2.6rem]">
              {collection.title}
            </h2>
          </header>
          <p className="max-w-[28rem] text-sm leading-6 text-[var(--shreem-muted)]">
            A composed edit of pieces chosen for their warmth, richness, and
            effortless presence.
          </p>
        </div>
        <div className="mb-8 flex justify-end">
          <InteractiveLink href={`/collections/${collection.handle}`}>
            View collection
          </InteractiveLink>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 small:grid-cols-4 small:gap-x-5 small:gap-y-8">
          {pricedProducts.slice(0, 4).map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
