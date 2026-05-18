import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories().catch(() => [])

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  ).catch(() => [])

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name

    const description =
      productCategory.description ?? `Shop ${title} from Shreem.`

    return {
      title,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    return {
      title: "Category | Shreem",
      description: "Browse Shreem Cow Products categories.",
    }
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category).catch(
    () => null
  )

  if (!productCategory) {
    return <CategoryUnavailable category={params.category} />
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}

function CategoryUnavailable({ category }: { category: string[] }) {
  const label = category.join(" / ").replace(/-/g, " ")

  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
        <p className="brand-kicker">Category</p>
        <h1 className="brand-page-title mt-3 max-w-[16ch]">
          We are reconnecting to {label}.
        </h1>
        <p className="brand-page-copy mt-4 max-w-[40rem]">
          This category could not be reached just now. The store remains
          available while the category data refreshes.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LocalizedClientLink href="/store" className="brand-primary-button">
            Browse store
          </LocalizedClientLink>
          <LocalizedClientLink href="/" className="brand-secondary-button">
            Return home
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
