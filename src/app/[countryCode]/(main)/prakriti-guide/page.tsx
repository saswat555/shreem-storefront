import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import { inferPrakritiTags } from "@lib/util/prakriti"
import MotionReveal from "@modules/common/components/motion-reveal"
import LoginTemplate from "@modules/account/templates/login-template"
import PrakritiGuide from "@modules/natural-care/components/prakriti-guide"

export const metadata: Metadata = {
  title: "Prakriti Guide",
  description:
    "Upload plant or animal photos and get a natural-care direction plus region-aware Shreem product suggestions when useful.",
}

export default async function PrakritiGuidePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return (
      <div className="content-container py-8 small:py-12">
        <MotionReveal>
          <section className="brand-surface mb-8 px-5 py-8 small:px-10 small:py-10">
            <p className="brand-pill mb-5 w-fit">Shreem Prakriti Guide</p>
            <h1 className="max-w-[12ch] text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
              Sign in to use the natural-care image guide
            </h1>
            <p className="mt-5 max-w-[46rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
              The guide is available only to signed-in customers. That keeps the
              experience tied to your Shreem account and lets the assistant stay
              region-aware when it decides whether a product is actually
              available and relevant for your case.
            </p>
          </section>
        </MotionReveal>

        <MotionReveal delayMs={70}>
          <section className="brand-card px-4 py-4 small:px-8 small:py-8">
            <LoginTemplate />
          </section>
        </MotionReveal>
      </div>
    )
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: 50,
      fields: "*variants.calculated_price,+metadata,+tags",
    },
  })

  const serializedProducts = products.map((product) => ({
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description || product.subtitle || "",
    thumbnail: product.thumbnail,
    tags: inferPrakritiTags({
      title: product.title,
      description: `${product.description || ""} ${product.subtitle || ""}`,
      tags: product.tags || [],
    }),
  }))

  return (
    <div className="content-container py-8 small:py-12">
      <MotionReveal>
        <section className="brand-surface mb-8 px-5 py-8 small:px-10 small:py-10">
          <p className="brand-pill mb-5 w-fit">Shreem Prakriti Guide</p>
          <h1 className="max-w-[13ch] text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
            A natural-care guide for plants, animals, and region-aware remedies
          </h1>
          <p className="mt-5 max-w-[46rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
            Use the guide when you want a first-pass natural-care direction from
            photos. It checks up to three images, reads symptoms, and only
            surfaces a Shreem product when that item is available in your region
            and genuinely useful for the situation.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="brand-pill px-3 py-1.5">Signed in as {customer.email}</span>
            <span className="brand-pill px-3 py-1.5">Region-aware product matching</span>
          </div>
        </section>
      </MotionReveal>

      <PrakritiGuide products={serializedProducts} />
    </div>
  )
}
