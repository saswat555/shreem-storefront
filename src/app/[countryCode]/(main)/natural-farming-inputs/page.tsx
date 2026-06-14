import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Jeevamrut and Vermicompost for Natural Farming",
  description:
    "Understand how Shreem Jeevamrut and vermicompost support living soil for kitchen gardens, small farms, and natural farming routines.",
  alternates: {
    canonical: "/in/natural-farming-inputs",
  },
}

export default function NaturalFarmingInputsPage() {
  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-12">
        <p className="brand-pill w-fit">Living soil</p>
        <h1 className="brand-page-title mt-5">
          Jeevamrut and Vermicompost for Natural Farming
        </h1>
        <p className="brand-page-copy mt-6 max-w-[54rem]">
          For customers growing vegetables, flowers, or farm crops, Shreem soil
          inputs help explain the practical difference between feeding the plant
          and caring for the soil ecosystem.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <LocalizedClientLink href="/store" className="brand-primary-button">
            View farming products
          </LocalizedClientLink>
          <LocalizedClientLink href="/products/shreem-vermicompost" className="brand-secondary-button">
            View Vermicompost
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
