import { Metadata } from "next"
import Image from "next/image"
import { notFound, permanentRedirect } from "next/navigation"

import { getBlogPost, listBlogPosts } from "@lib/data/journal"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

const archivedBlogRedirects: Record<string, string> = {
  "gau-kasht-bilona-ghee-what-careful-buyers-should-check-2026-06-23":
    "gau-kasht-bilona-ghee-what-careful-buyers-should-check-2026-06-23-2",
  "gau-kasht-bilona-ghee-monsoon-guide":
    "gau-kasht-bilona-ghee-what-careful-buyers-should-check-2026-06-23-2",
  "aroma-bilona-ghee-gau-kasht-cooking":
    "gau-kasht-bilona-ghee-what-careful-buyers-should-check-2026-06-23-2",
  "gau-kasht-bilona-ghee-monsoon-buying":
    "gau-kasht-bilona-ghee-what-careful-buyers-should-check-2026-06-23-2",
  "desi-ghee-a2-bilona-hand-churned-gau-kasht":
    "pure-bilona-ghee-traditional-hand-churned-ghee",
  "a2-bilona-ghee-cow-dung-aroma-trust":
    "ekadashi-parana-gau-kasht-ghee-purity",
  "a2-bilona-ghee-cow-dung-cooking-aroma-trust":
    "ekadashi-parana-gau-kasht-ghee-purity",
  "a2-bilona-ghee-gau-kasht-aroma-trust-2":
    "ekadashi-parana-gau-kasht-ghee-purity",
  "a2-bilona-ghee-gau-kasht-aroma-trust":
    "ekadashi-parana-gau-kasht-ghee-purity",
  "bilona-ghee-cooked-on-cow-dung-cakes":
    "pure-bilona-ghee-traditional-hand-churned-ghee",
  "how-to-identify-pure-ghee-before-buying":
    "ghee-labels-online-ekadashi-purity-checklist",
  "a2-bilona-ghee-monsoon-purity-checklist":
    "ghee-labels-online-ekadashi-purity-checklist",
  "monsoon-food-storage-pure-d2c-brands":
    "monsoon-purity-preservative-free-d2c-india",
  "monsoon-food-d2c-preservative-free":
    "monsoon-purity-preservative-free-d2c-india",
  "monsoon-preservative-free-d2c-food-india":
    "monsoon-purity-preservative-free-d2c-india",
  "sade-sati-dasha-calm-guide-planning": "sade-sati-dasha-calm-guide",
  "ai-kundli-expert-astrologer-monsoon-insights":
    "daily-panchang-muhurat-indian-households-weekly",
  "ai-kundli-expert-panchang-family-planning":
    "daily-panchang-muhurat-indian-households-weekly",
  "ai-kundli-expert-astrologer-guidance":
    "daily-panchang-muhurat-indian-households-weekly",
  "a-calm-indian-guide-to-panchang-kundli-and-better-timing-2026-06-16":
    "daily-panchang-muhurat-indian-households-weekly",
  "monsoon-soil-care-jeevamrut-vermicompost":
    "vermicompost-organic-soil-booster-kitchen-gardens",
  "neem-dhoop-cow-dung-cakes-natural-purifiers":
    "natural-neem-dhoop-monsoon-evening-pooja-fragrance",
  "pigeon-pea-benefits-desi-arhar-in-your-pantry": "blog",
  "stevia-powder-vs-sugar-natural-sweet-choice": "blog",
  "desi-cow-products-indian-homes":
    "from-farm-to-family-shreem-farms-honest-indian-food",
}

const absoluteImageUrl = (baseUrl: string, image: string) => {
  if (/^https?:\/\//i.test(image)) {
    return image
  }

  return `${baseUrl}${image.startsWith("/") ? image : `/${image}`}`
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: "Blog",
    }
  }

  return {
    title: post.metaTitle || post.seoTitle || post.title,
    description: post.metaDescription || post.description,
    alternates: {
      canonical: `/${countryCode}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.description,
      url: `/${countryCode}/blog/${post.slug}`,
      images: [post.image],
      type: "article",
    },
  }
}

export default async function BlogArticlePage(props: Props) {
  const { countryCode, slug } = await props.params
  const post = await getBlogPost(slug)

  if (!post) {
    const redirectedSlug = archivedBlogRedirects[slug]

    if (redirectedSlug) {
      permanentRedirect(
        redirectedSlug === "blog"
          ? `/${countryCode}/blog`
          : `/${countryCode}/blog/${redirectedSlug}`
      )
    }

    notFound()
  }
  const baseUrl = getBaseURL()
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: absoluteImageUrl(baseUrl, post.image),
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Shreem Farms",
    },
    publisher: {
      "@type": "Organization",
      name: "Shreem Farms",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.jpeg`,
      },
    },
    mainEntityOfPage: `${baseUrl}/${countryCode}/blog/${post.slug}`,
  }
  const faqSchema =
    post.faq?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

  return (
    <div className="content-container py-8 small:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <article className="brand-surface overflow-hidden px-5 py-8 small:px-10 small:py-10">
        <div className="max-w-[52rem]">
          <p className="brand-pill w-fit">{post.category}</p>
          <h1 className="brand-page-title mt-5">{post.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--shreem-muted)]">
            <span className="brand-pill px-3 py-1.5">{post.readTime}</span>
            <span className="brand-pill px-3 py-1.5">{post.publishedAt}</span>
            {post.targetKeyword && (
              <span className="brand-pill px-3 py-1.5">
                {post.targetKeyword}
              </span>
            )}
          </div>
          <p className="brand-page-copy mt-6">{post.description}</p>
          {!!post.relatedKeywords?.length && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.relatedKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[var(--shreem-border)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--shreem-muted)]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] p-2 shadow-[0_24px_60px_rgba(15,49,70,0.08)]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[22px]">
            <Image
                  unoptimized
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className={
                post.slug === "bilona-a2-ghee-made-slowly"
                  ? "object-contain p-4"
                  : "object-cover"
              }
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[48rem] space-y-8">
          {post.sections.map((section, index) => (
            <div key={section.heading} className="space-y-8">
              <section className="brand-card px-5 py-6 small:px-6">
                <h2 className="text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
              {index === 1 && post.productCta?.midArticle && post.focusedProduct && (
                <section className="rounded-[24px] border border-[rgba(13,129,126,0.2)] bg-[linear-gradient(135deg,rgba(239,249,246,0.96),rgba(255,249,238,0.9))] px-5 py-6 small:px-6">
                  <p className="brand-kicker">From Shreem</p>
                  <h2 className="mt-2 text-[1.7rem] leading-[1.08] text-[var(--shreem-ink)]">
                    {post.focusedProduct.name}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                    {post.productCta.midArticle}
                  </p>
                  <LocalizedClientLink
                    href={post.focusedProduct.href}
                    className="brand-primary-button mt-5 w-fit"
                  >
                    View {post.focusedProduct.name}
                  </LocalizedClientLink>
                </section>
              )}
            </div>
          ))}
        </div>

        {!!post.faq?.length && (
          <section className="mx-auto mt-10 max-w-[48rem] rounded-[24px] border border-[var(--shreem-border)] bg-white/80 px-5 py-6 small:px-6">
            <p className="brand-kicker">Buyer questions</p>
            <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
              Quick answers before you decide
            </h2>
            <div className="mt-5 divide-y divide-[var(--shreem-border)]">
              {post.faq.map((faq) => (
                <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="text-base font-semibold text-[var(--shreem-ink)]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {Boolean(post.relatedLinks?.length) && (
          <div className="mx-auto mt-10 max-w-[48rem] rounded-[24px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.78)] px-5 py-6 small:px-6">
            <p className="brand-kicker">Related Shreem pages</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {post.relatedLinks?.slice(0, 4).map((link) => (
                <LocalizedClientLink
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="rounded-[18px] border border-[var(--shreem-border)] bg-white/76 px-4 py-4 transition hover:border-[rgba(13,129,126,0.34)]"
                >
                  <span className="block text-sm font-semibold text-[var(--shreem-ink)]">
                    {link.label}
                  </span>
                  {link.reason && (
                    <span className="mt-2 block text-xs leading-5 text-[var(--shreem-muted)]">
                      {link.reason}
                    </span>
                  )}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto mt-10 max-w-[48rem] rounded-[28px] border border-[rgba(212,161,38,0.24)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] px-5 py-6 shadow-[0_18px_40px_rgba(156,105,18,0.08)] small:px-6">
          <p className="brand-kicker">Continue with Shreem</p>
          <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
            Explore the products behind the story
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
            {post.productCta?.final ||
              "Move from the blog into the store and bring home the products behind the Shreem story of Gauri, Mayur, bilona, and ritual living."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink
              href={post.focusedProduct?.href || "/store"}
              className="brand-primary-button"
            >
              {post.focusedProduct
                ? `View ${post.focusedProduct.name}`
                : "Shop products"}
            </LocalizedClientLink>
            <LocalizedClientLink href="/store" className="brand-secondary-button">
              Browse all Shreem products
            </LocalizedClientLink>
          </div>
        </div>
      </article>
    </div>
  )
}
