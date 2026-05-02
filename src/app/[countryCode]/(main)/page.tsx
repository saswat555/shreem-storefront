import { Metadata } from "next"
import Image from "next/image"
import { ArrowUpRightMini } from "@medusajs/icons"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import {
  shreemCowBreeds,
  shreemMascots,
  shreemRituals,
} from "@lib/constants/shreem"
import MotionReveal from "@modules/common/components/motion-reveal"
import Hero from "@modules/home/components/hero"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export const metadata: Metadata = {
  title: "Shreem Cow Products",
  description:
    "Shop Shreem Cow Products for bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows.",
  openGraph: {
    title: "Shreem Cow Products",
    description:
      "Shop Shreem Cow Products for bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows.",
    images: ["/logo.jpeg"],
  },
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const latestProducts = await listProducts({
    countryCode,
    queryParams: {
      limit: 4,
      fields: "*variants.calculated_price",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

  const baseUrl = getBaseURL()
  const [bilonaGhee, neemDhoop, cowDungCakes, jeevamrut] = shreemRituals

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shreem Cow Products",
    url: baseUrl,
    description:
      "Shop bilona ghee, neem dhoop, cow dung cakes, and Jeevamrut from naturally grazing desi cows.",
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shreem Cow Products",
    url: baseUrl,
    logo: `${baseUrl}/logo.jpeg`,
    description:
      "A desi-cow D2C brand focused on bilona A2 ghee, dhoop batti, sacred home essentials, and natural-farming products.",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <MotionReveal>
        <Hero />
      </MotionReveal>

      {!!latestProducts.length && (
        <MotionReveal delayMs={70}>
        <section className="content-container py-8 small:py-10">
          <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
            <div className="flex flex-col gap-4 pb-6 small:flex-row small:items-end small:justify-between">
              <div>
                <p className="brand-kicker">Shop Shreem</p>
                <h2 className="mt-3 text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.2rem]">
                  Bring Shreem home
                </h2>
              </div>
              <div className="max-w-[34rem]">
                <p className="text-sm leading-6 text-[var(--shreem-muted)]">
                  Start with our featured Shreem essentials for the kitchen, the
                  prayer room, and the farm, all rooted in naturally grazing
                  desi cows.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {shreemCowBreeds.map((breed) => (
                    <span key={breed} className="brand-pill px-3 py-1.5 text-[11px]">
                      {breed}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 small:grid-cols-4 small:gap-x-5 small:gap-y-8">
              {latestProducts.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} region={region} isFeatured />
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-start">
              <LocalizedClientLink href="/store" className="brand-primary-button">
                View all products
              </LocalizedClientLink>
            </div>
          </div>
        </section>
        </MotionReveal>
      )}

      <MotionReveal delayMs={110}>
      <section className="content-container py-8 small:py-10">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr] xl:items-center">
            <div>
              <p className="brand-kicker">A simpler buying journey</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.2rem]">
                Not sure what helps? Start with Prakriti Guide.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                Upload up to three photos of a plant or animal, add a short note,
                and let the guide suggest a cautious natural-care direction.
                It only surfaces a Shreem product when that item is available in
                your region and genuinely fits the case.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LocalizedClientLink
                  href="/prakriti-guide"
                  className="brand-primary-button gap-2"
                >
                  Open Prakriti Guide
                  <ArrowUpRightMini />
                </LocalizedClientLink>
                <LocalizedClientLink href="/journal" className="brand-secondary-button">
                  Read Journal first
                </LocalizedClientLink>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <article className="brand-card px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  1. Upload photos
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  Clear leaf, stem, skin, eye, or shed images help the guide read the case.
                </p>
              </article>
              <article className="brand-card px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  2. Get a natural-care direction
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  The guide returns likely observations, home steps, and signs that need escalation.
                </p>
              </article>
              <article className="brand-card px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  3. See useful Shreem products
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  Only region-available items with a real fit are recommended.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
      </MotionReveal>

      <MotionReveal delayMs={140}>
      <section className="content-container py-8 small:py-10">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
            <div className="overflow-hidden rounded-[30px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] p-2 shadow-[0_24px_70px_rgba(15,49,70,0.1)]">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(251,242,222,0.85),rgba(255,252,246,0.95))] small:aspect-[16/11]">
                <Image
                  src="/shreem-scenes/bilona-process.png"
                  alt="Shreem bilona ghee process with Gauri, Mayur, and the curd-to-ghee journey"
                  fill
                  priority
                  sizes="(max-width: 1280px) 100vw, 760px"
                  className="object-contain p-2 small:p-4"
                />
              </div>
            </div>
            <div>
              <p className="brand-kicker">Our signature bilona ghee</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.2rem]">
                Slow-made from cultured curd and finished with a gentle smoky warmth
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                {bilonaGhee.description} In our kitchen finish, the ghee is
                brought to completion over gau-kasht heat, giving it the softly
                roasted, smoky note that makes Shreem instantly recognisable.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <article className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Curd-first bilona route
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Milk is first cultured into curd, then hand-churned into
                    makkhan before the ghee is slowly opened up.
                  </p>
                </article>
                <article className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Hand-churned patience
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    The slower bilona rhythm shapes the aroma and depth people
                    expect from a traditional ghee.
                  </p>
                </article>
                <article className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Gau-kasht smoky finish
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    The final heating over cow-dung-cake fuel adds the warm,
                    lightly smoky character that sets Shreem apart.
                  </p>
                </article>
              </div>
              <div className="mt-6 rounded-[28px] border border-[rgba(212,161,38,0.24)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] px-5 py-5 shadow-[0_18px_40px_rgba(156,105,18,0.08)]">
                <p className="brand-kicker">Shreem USP</p>
                <h3 className="mt-3 text-[1.9rem] leading-[1.04] text-[var(--shreem-ink)]">
                  Smoky flavour, earned slowly
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  Many ghee jars in the market stop at generic richness. Shreem
                  carries a deeper kitchen memory: the soft smoky warmth that
                  comes when bilona ghee is finished slowly over gau-kasht
                  heat, not rushed into a flat aroma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </MotionReveal>

      <MotionReveal delayMs={170}>
      <section className="content-container py-8 small:py-10">
        <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="brand-royal-surface px-5 py-6 text-white small:px-8 small:py-8">
            <div>
              <p className="brand-kicker">For a calmer home</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-white small:text-[3.2rem]">
                Evening prayer, gentler fragrance, and a more rooted home atmosphere
              </h2>
              <p className="mt-4 max-w-[36rem] text-sm leading-6 text-white/78">
                {neemDhoop.description} Neem has long been part of household
                care, and neem oil has also been studied for mosquito-repellent
                action, which is why this ritual sits naturally in the evening
                life of the home.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/12 bg-white/6 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[22px]">
                <Image
                  src="/shreem-scenes/neem-dhoop.png"
                  alt="Neem dhoop batti in an evening prayer courtyard with Gauri and Mayur"
                  fill
                  sizes="(max-width: 1280px) 100vw, 720px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <article className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{cowDungCakes.title}</p>
              <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                Sacred fire products with a practical place in the home
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {cowDungCakes.description} They are used in havan, dhooni, and
                slow ritual fire practices, and their earthy warmth also
                connects directly to the gau-kasht finish behind our ghee&apos;s
                signature aroma.
              </p>
            </article>
            <article className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{jeevamrut.title}</p>
              <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                For fields that want living soil, not chemical pressure
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {jeevamrut.description} It belongs to a natural-farming
                approach that respects soil biology and helps farmers step away
                from urea-heavy routines that leave the land more dependent over
                time.
              </p>
            </article>
            <article className="brand-surface px-5 py-5 small:px-6">
              <p className="brand-kicker">Why people come to Shreem</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Purer kitchen fats with the depth of bilona ghee.
                </div>
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Prayer rituals that feel calmer and less synthetic.
                </div>
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Soil care that values life in the field, not only yield.
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
      </MotionReveal>

      <MotionReveal delayMs={200}>
      <section className="content-container pb-16 pt-8 small:pb-20 small:pt-10">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-6 pb-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
            <div className="max-w-[36rem]">
              <p className="brand-kicker">From the Journal</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3.2rem]">
                Meet Gauri and Mayur
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
                Gauri carries the tenderness of the desi cow. Mayur carries the
                sacred color and festive radiance of the peacock. Together,
                they make Shreem feel rooted, personal, and unmistakably Indian.
              </p>
              <div className="mt-6">
                <LocalizedClientLink href="/journal" className="brand-primary-button">
                  Read the Journal
                </LocalizedClientLink>
              </div>
            </div>
            <div className="grid gap-4">
            {shreemMascots.map((mascot) => (
              <article key={mascot.name} className="brand-card overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                  <div className="relative min-h-[280px] border-b border-[var(--shreem-border)] bg-[radial-gradient(circle_at_top,rgba(212,161,38,0.22),transparent_40%),linear-gradient(180deg,rgba(248,241,226,0.96),rgba(239,246,242,0.92))] md:border-b-0 md:border-r">
                    <Image
                      src={mascot.imagePath}
                      alt={`${mascot.name}, one of the Shreem brand mascots`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 260px"
                      className="object-contain object-bottom p-4"
                    />
                  </div>
                  <div className="p-5 small:p-6">
                    <p className="brand-kicker">{mascot.role}</p>
                    <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                      {mascot.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                      {mascot.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>
      </MotionReveal>
    </>
  )
}
