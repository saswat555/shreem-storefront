import { Metadata } from "next"

import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title = "Store | Bilona Ghee, Neem Dhoop & Cow Products"
  const description =
    "Browse live Shreem products including bilona A2 ghee, neem dhoop batti, cow dung cakes, vermicompost, natural foods, and Jyotish services."

  return {
    title,
    description,
    alternates: {
      canonical: `/${countryCode}/store`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}/store`,
      images: ["/logo.jpeg"],
    },
  }
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
