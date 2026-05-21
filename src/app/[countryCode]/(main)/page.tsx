import { Metadata } from "next"
import Image from "next/image"
import { ArrowUpRightMini } from "@medusajs/icons"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"
import {
  shreemCowBreeds,
  shreemMascots,
  shreemRituals,
} from "@lib/constants/shreem"
import MotionReveal from "@modules/common/components/motion-reveal"
import Hero from "@modules/home/components/hero"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title =
    "Shreem Cow Products | Bilona A2 Ghee, Neem Dhoop & Natural Farming"
  const description =
    "Shop Shreem Cow Products for bilona A2 ghee, neem dhoop batti, cow-dung cakes, Jeevamrut, and desi-cow inspired ritual essentials."

  return {
    title,
    description,
    alternates: {
      canonical: `/${countryCode}`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}`,
      images: [
        {
          url: "/logo.jpeg",
          alt: "Shreem Cow Products logo with peacock-feather colors",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.jpeg"],
    },
  }
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
  const prakritiGuideEnabled = isPrakritiGuideEnabled()
  const [bilonaGhee, neemDhoop, cowDungCakes, jeevamrut] = shreemRituals

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shreem Cow Products",
    url: baseUrl,
    description:
      "Shop bilona A2 ghee, neem dhoop batti, cow-dung cakes, and Jeevamrut farm input from desi-cow sources.",
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shreem Cow Products",
    url: baseUrl,
    logo: `${baseUrl}/logo.jpeg`,
    description:
      "A desi-cow D2C brand focused on bilona A2 ghee, neem dhoop batti, cow-dung cakes, and Jeevamrut for natural-farming routines.",
  }
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Shreem Cow Products",
    url: `${baseUrl}/${countryCode}`,
    image: `${baseUrl}/logo.jpeg`,
    description:
      "Shop bilona A2 ghee, neem dhoop batti, cow-dung cakes, Jeevamrut, and desi-cow inspired products for home, ritual, and natural farming.",
    brand: {
      "@type": "Brand",
      name: "Shreem",
    },
  }
  const productItemListSchema = latestProducts.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Featured Shreem Cow Products",
        itemListElement: latestProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${baseUrl}/${countryCode}/products/${product.handle}`,
          name: product.title,
        })),
      }
    : null

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      {productItemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productItemListSchema),
          }}
        />
      )}
      <MotionReveal>
        <Hero prakritiGuideEnabled={prakritiGuideEnabled} />
      </MotionReveal>

      {!!latestProducts.length && (
        <MotionReveal delayMs={70}>
        <section className="content-container py-8 small:py-10">
          <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
            <div className="flex flex-col gap-4 pb-6 small:flex-row small:items-end small:justify-between">
              <div>
                <p className="brand-kicker">From the store shelf</p>
                <h2 className="brand-section-title mt-3">
                  Start with the everyday quartet
                </h2>
              </div>
              <div className="max-w-[34rem]">
                <p className="text-sm leading-6 text-[var(--shreem-muted)]">
                  Ghee, dhoop, havan fuel, and soil care sit together here with
                  live pricing, real product pages, and checkout-ready detail.
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

      {prakritiGuideEnabled && (
        <MotionReveal delayMs={110}>
        <section className="content-container py-8 small:py-10">
          <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
            <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr] xl:items-center">
              <div>
                <p className="brand-kicker">Ask before you guess</p>
                <h2 className="brand-section-title mt-3">
                  GrowBuddy turns photos into a cautious care plan.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                  Upload up to three photos of a plant or animal, add a short note,
                  and get a cautious first-pass care plan. It only surfaces a
                  product when that item is available in your region and
                  genuinely fits the case.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <LocalizedClientLink
                    href="/prakriti-guide"
                    className="brand-primary-button gap-2"
                  >
                    Open GrowBuddy AI
                    <ArrowUpRightMini />
                  </LocalizedClientLink>
                  <LocalizedClientLink href="/blog" className="brand-secondary-button">
                    Read the Blog first
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
                    2. Get a care plan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    GrowBuddy returns likely observations, home steps, monitoring tips, and escalation signs.
                  </p>
                </article>
                <article className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    3. See useful products
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
      )}

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
              <p className="brand-kicker">Bilona, without shortcuts</p>
              <h2 className="brand-section-title mt-3">
                Curd-first ghee with a warm, patient finish.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                {bilonaGhee.description} The final heating is handled slowly so
                the aroma stays rounded, warm, and recognisably Shreem.
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
                    Warm finishing character
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    The final stage is kept patient so the ghee develops a
                    rounded aroma instead of tasting rushed or flat.
                  </p>
                </article>
              </div>
              <div className="mt-6 rounded-[28px] border border-[rgba(212,161,38,0.24)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] px-5 py-5 shadow-[0_18px_40px_rgba(156,105,18,0.08)]">
                <p className="brand-kicker">What makes the jar memorable</p>
                <h3 className="brand-card-title mt-3">
                  Aroma that comes from patience.
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  Many ghee jars in the market stop at generic richness. This
                  one is built around a slower curd-first route, careful heating,
                  and a finished aroma that feels closer to an everyday Indian
                  kitchen than a generic shelf product.
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
              <h2 className="brand-section-title mt-3 text-white">
                Evening prayer with a gentler, grounded fragrance.
              </h2>
              <p className="mt-4 max-w-[36rem] text-sm leading-6 text-white/78">
                {neemDhoop.description} Neem has long been part of household
                routines, and the product is positioned for fragrance and
                familiar evening use rather than as a medical promise.
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
              <h3 className="brand-card-title mt-3">
                Cow-dung cakes for havan, dhooni, and traditional fire use.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {cowDungCakes.description} They are used in havan, dhooni, and
                traditional household fire practices where people want a simple,
                familiar material.
              </p>
            </article>
            <article className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{jeevamrut.title}</p>
              <h3 className="brand-card-title mt-3">
                Soil-care routines built around biological support.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {jeevamrut.description} It belongs to a natural-farming
                approach that focuses on soil biology, observation, and
                input-conscious farm routines.
              </p>
            </article>
            <article className="brand-surface px-5 py-5 small:px-6">
              <p className="brand-kicker">Why people return</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Traditional kitchen ghee with a curd-first bilona method.
                </div>
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Home rituals with a calmer, less synthetic fragrance.
                </div>
                <div className="rounded-[22px] bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  Farm inputs made for living-soil routines.
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
              <p className="brand-kicker">From the Blog</p>
              <h2 className="brand-section-title mt-3">
                The story world behind the products.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
                Gauri and Mayur give the store a consistent visual world while
                the product pages stay grounded in what customers actually need:
                ingredients, use cases, pricing, checkout, and support.
              </p>
              <div className="mt-6">
                <LocalizedClientLink href="/blog" className="brand-primary-button">
                  Read the Blog
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
                    <h3 className="brand-card-title mt-3">
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
