import { Metadata } from "next"
import { listGemstones } from "@lib/data/gemstones"
import GemstoneMarketplace from "@modules/gemstones/templates/gemstone-marketplace"

export const metadata: Metadata = {
  title: "Gemstone Vendors | Shreem Farms Jyotish",
  description:
    "Shop astrology-guided gemstones from Shreem vendor substores with weight, metal, certification, treatment and vendor details.",
}

const GemstonesPage = async ({
  params,
  searchParams,
}: {
  params: { countryCode: string }
  searchParams?: { stone?: string }
}) => {
  const { vendors, products } = await listGemstones({
    stone: searchParams?.stone,
  })

  return (
    <GemstoneMarketplace
      countryCode={params.countryCode}
      vendors={vendors}
      products={products}
      stone={searchParams?.stone}
    />
  )
}

export default GemstonesPage
