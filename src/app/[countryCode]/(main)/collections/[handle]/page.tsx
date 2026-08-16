import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  const { collections } = await listCollections({
    fields: "*products",
  }).catch(() => ({ collections: [], count: 0 }))

  if (!collections) {
    return []
  }

  const countryCodes = await listRegions().then(
    (regions: StoreRegion[]) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  ).catch(() => [])

  const collectionHandles = collections.map(
    (collection: StoreCollection) => collection.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string) =>
      collectionHandles.map((handle: string | undefined) => ({
        countryCode,
        handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle).catch(
    () => null
  )

  if (!collection) {
    return {
      title: "Collection | Shreem",
      description: "Browse Shreem Farms collections.",
    }
  }

  const metadata = {
    title: collection.title,
    description: `Shop the ${collection.title} collection from Shreem.`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  ).catch(() => null)

  if (!collection) {
    return <CollectionUnavailable handle={params.handle} />
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}

function CollectionUnavailable({ handle }: { handle: string }) {
  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
        <p className="brand-kicker">Collection</p>
        <h1 className="brand-page-title mt-3 max-w-[16ch]">
          We are reconnecting to {handle.replace(/-/g, " ")}.
        </h1>
        <p className="brand-page-copy mt-4 max-w-[40rem]">
          This collection could not be reached just now. The store remains
          available while the collection data refreshes.
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
