import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}) {
  return (
    <>
      <li>
        <section id="featured-collections" className="content-container">
          <div className="flex flex-col gap-3 px-1 pb-2 pt-4 small:pb-4">
            <p className="brand-kicker">Curated product stories</p>
            <div className="flex flex-col gap-3 small:flex-row small:items-end small:justify-between">
              <h2 className="max-w-[16ch] text-[2.4rem] leading-[1.02] text-balance text-[var(--shreem-ink)] small:text-[3.6rem]">
                Collections arranged with warmth, depth, and ceremony.
              </h2>
              <p className="max-w-[28rem] text-sm leading-6 text-[var(--shreem-muted)] small:text-base">
                Explore signature edits that feel expressive, elegant, and easy
                to shop wherever you are.
              </p>
            </div>
          </div>
        </section>
      </li>
      {collections.map((collection, index) => (
        <li key={collection.id}>
          <ProductRail collection={collection} region={region} index={index} />
        </li>
      ))}
    </>
  )
}
