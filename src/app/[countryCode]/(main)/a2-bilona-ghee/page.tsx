import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "A2 Bilona Ghee Cooked on Cow Dung Cakes",
  description:
    "Learn what makes Shreem A2 bilona ghee different: curd-first bilona method, hand-churned makkhan, slow gau-kasht finishing, and India delivery.",
  alternates: {
    canonical: "/in/a2-bilona-ghee",
  },
}

export default function A2BilonaGheeLandingPage() {
  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-12">
        <div className="max-w-[58rem]">
          <p className="brand-pill w-fit">Traditional ghee</p>
          <h1 className="brand-page-title mt-5">
            A2 Bilona Ghee Cooked on Cow Dung Cakes
          </h1>
          <p className="brand-page-copy mt-6">
            Shreem ghee follows the patient curd-first bilona route: desi-cow
            milk is set into curd, hand-churned into makkhan, and slowly opened
            into ghee with a warm gau-kasht finish.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink
              href="/products/shreem-a2-bilona-ghee"
              className="brand-primary-button"
            >
              View A2 Bilona Ghee
            </LocalizedClientLink>
            <LocalizedClientLink href="/blog" className="brand-secondary-button">
              Read ghee guides
            </LocalizedClientLink>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [
              "Curd-first bilona",
              "The process begins with cultured curd, not shortcut cream separation.",
            ],
            [
              "Hand-churned makkhan",
              "Slow churning helps preserve the traditional texture and aroma families expect.",
            ],
            [
              "Gau-kasht finish",
              "The final heating is patient, giving Shreem ghee its rounded kitchen fragrance.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="brand-card px-5 py-5">
              <h2 className="text-xl font-semibold text-[var(--shreem-ink)]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
