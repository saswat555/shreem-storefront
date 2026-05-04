import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import {
  getPrakritiGuideModel,
  isPrakritiGuideEnabled,
} from "@lib/util/prakriti-config"
import { getBaseURL } from "@lib/util/env"
import { inferPrakritiTags } from "@lib/util/prakriti"
import MotionReveal from "@modules/common/components/motion-reveal"
import LoginTemplate from "@modules/account/templates/login-template"
import PrakritiGuide from "@modules/natural-care/components/prakriti-guide"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title = "GrowBuddy AI | Plant and Animal Care Assistant"
  const description =
    "Upload plant or animal photos, add context, and get a cautious AI care plan with region-aware Shreem product suggestions when useful."

  return {
    title,
    description,
    alternates: {
      canonical: `/${countryCode}/prakriti-guide`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}/prakriti-guide`,
      images: ["/logo.jpeg"],
    },
  }
}

export default async function PrakritiGuidePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  if (!isPrakritiGuideEnabled()) {
    return notFound()
  }

  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const model = getPrakritiGuideModel()
  const baseUrl = getBaseURL()
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GrowBuddy AI",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    url: `${baseUrl}/${countryCode}/prakriti-guide`,
    description:
      "Plant and animal photo-care assistant that gives cautious first-pass guidance and Shreem product suggestions only when relevant.",
    publisher: {
      "@type": "Organization",
      name: "Shreem Cow Products",
      url: baseUrl,
      logo: `${baseUrl}/logo.jpeg`,
    },
  }

  if (!customer) {
    return (
      <div className="content-container py-8 small:py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(applicationSchema),
          }}
        />
        <MotionReveal>
          <section className="brand-surface mb-8 px-5 py-8 small:px-10 small:py-10">
            <p className="brand-pill mb-5 w-fit">GrowBuddy AI</p>
            <h1 className="max-w-[12ch] text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
              Sign in to run GrowBuddy AI
            </h1>
            <p className="mt-5 max-w-[46rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
              GrowBuddy AI is Shreem&apos;s plant and animal care assistant for
              signed-in customers. It keeps the experience connected to your
              account and checks regional product availability before it
              recommends anything.
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

  const products = await listProducts({
    countryCode,
    queryParams: {
      limit: 50,
      fields: "*variants.calculated_price,+metadata,+tags",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <MotionReveal>
        <section className="brand-surface mb-8 px-5 py-8 small:px-10 small:py-10">
          <p className="brand-pill mb-5 w-fit">GrowBuddy AI</p>
          <h1 className="max-w-[13ch] text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
            Plant and animal care AI from your photos
          </h1>
          <p className="mt-5 max-w-[46rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
            Add up to three photos, tell us what is happening, and get a
            cautious first-pass care plan powered by Gemini. GrowBuddy only
            surfaces a Shreem product when that item is available in your region
            and genuinely useful for the situation.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="brand-pill px-3 py-1.5">Signed in as {customer.email}</span>
            <span className="brand-pill px-3 py-1.5">Gemini image analysis</span>
            <span className="brand-pill px-3 py-1.5">Region-aware product matching</span>
          </div>
        </section>
      </MotionReveal>

      <PrakritiGuide products={serializedProducts} model={model} />
    </div>
  )
}
