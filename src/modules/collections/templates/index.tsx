import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container py-8 small:py-12">
      <div className="brand-surface mb-6 px-5 py-6 small:px-8 small:py-8">
        <p className="brand-kicker">Shreem collection</p>
        <h1 className="mt-3 text-[2.5rem] leading-none text-[var(--shreem-ink)] small:text-[3.6rem]">
          {collection.title}
        </h1>
        <p className="mt-4 max-w-[38rem] text-sm leading-6 text-[var(--shreem-muted)] small:text-base">
          Browse products grouped together for easier discovery and comparison.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        <RefinementList sortBy={sort} />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
