import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Natural Neem Dhoop for Pooja and Evening Rituals",
  description:
    "Explore Shreem neem dhoop and cow dung cakes for simple pooja, havan, dhooni, and Indian home rituals.",
  alternates: {
    canonical: "/in/natural-pooja-dhoop",
  },
}

export default function NaturalPoojaDhoopPage() {
  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-12">
        <p className="brand-pill w-fit">Pooja essentials</p>
        <h1 className="brand-page-title mt-5">
          Natural Neem Dhoop for Pooja and Evening Rituals
        </h1>
        <p className="brand-page-copy mt-6 max-w-[54rem]">
          Shreem dhoop and cow dung cakes are made for homes that prefer rooted,
          practical ritual products without loud claims. Use them for pooja,
          havan, dhooni, and calm evening routines.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <LocalizedClientLink href="/products/organic-neem-dhoob" className="brand-primary-button">
            View Neem Dhoop
          </LocalizedClientLink>
          <LocalizedClientLink href="/products/cowdung-cake" className="brand-secondary-button">
            View Cow Dung Cakes
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
