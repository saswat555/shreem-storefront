import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
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
  const title = "Store | Bilona Ghee, Neem Dhoop, Jeevamrut & Cow Products"
  const description =
    "Browse Shreem Cow Products including bilona A2 ghee, neem dhoop batti, cow dung cakes, Jeevamrut, and desi-cow inspired home and farm essentials."

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
