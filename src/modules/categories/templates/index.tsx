import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div className="content-container py-8 small:py-12" data-testid="category-container">
      <div className="brand-surface mb-6 px-5 py-6 small:px-8 small:py-8">
        <p className="brand-kicker">Browse by purpose</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--shreem-muted)]">
          {parents.map((parent) => (
            <span key={parent.id} className="flex items-center gap-2">
              <LocalizedClientLink
                className="hover:text-[var(--shreem-accent-dark)]"
                href={`/categories/${parent.handle}`}
                data-testid="sort-by-link"
              >
                {parent.name}
              </LocalizedClientLink>
              <span>/</span>
            </span>
          ))}
        </div>
        <h1
          className="brand-page-title mt-3 max-w-[16ch]"
          data-testid="category-page-title"
        >
          {category.name}
        </h1>
        {category.description && (
          <div className="brand-page-copy mt-4 max-w-[38rem]">
            <p>{category.description}</p>
          </div>
        )}
        {!!category.category_children?.length && (
          <div className="mt-6">
            <ul className="flex flex-wrap gap-3">
              {category.category_children.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <RefinementList sortBy={sort} data-testid="sort-by-container" />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
