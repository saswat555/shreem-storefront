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
        <p className="brand-kicker">Curated shelf</p>
        <h1 className="brand-page-title mt-3 max-w-[16ch]">
          {collection.title}
        </h1>
        <p className="brand-page-copy mt-4 max-w-[38rem]">
          Browse a focused set of products grouped for easier discovery,
          comparison, and checkout.
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
