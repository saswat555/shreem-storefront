import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listGemstones } from "@lib/data/gemstones"
import GemstoneMarketplace from "@modules/gemstones/templates/gemstone-marketplace"

export const metadata: Metadata = {
  title: "Gemstone Vendor | Shreem Farms Jyotish",
  description:
    "Browse verified gemstone vendor listings connected to Shreem Jyotish recommendations.",
}

const VendorGemstonesPage = async ({
  params,
  searchParams,
}: {
  params: { countryCode: string; vendor: string }
  searchParams?: { stone?: string }
}) => {
  const { vendors, products } = await listGemstones({
    vendor: params.vendor,
    stone: searchParams?.stone,
  })
  const activeVendor = vendors.find((vendor) => vendor.handle === params.vendor)

  if (!activeVendor) {
    return notFound()
  }

  return (
    <GemstoneMarketplace
      countryCode={params.countryCode}
      vendors={vendors}
      products={products}
      activeVendor={activeVendor}
      stone={searchParams?.stone}
    />
  )
}

export default VendorGemstonesPage
