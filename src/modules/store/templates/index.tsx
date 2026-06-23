import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container py-8 small:py-12" data-testid="category-container">
      <section className="brand-surface mb-6 px-5 py-6 small:px-8 small:py-8">
        <p className="brand-kicker">The working shelf</p>
        <h1
          className="brand-page-title mt-3 max-w-[16ch]"
          data-testid="store-page-title"
        >
          Products for food, ritual, home, and soil.
        </h1>
        <p className="brand-page-copy mt-4 max-w-[42rem]">
          Compare the daily essentials with live pricing, clear use cases, and
          region-aware availability.
        </p>
      </section>
      <div className="flex flex-col gap-5">
        <RefinementList sortBy={sort} />
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
