import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { shreemJournalPosts } from "@lib/constants/shreem-experience"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateStaticParams() {
  return shreemJournalPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const post = shreemJournalPosts.find((entry) => entry.slug === slug)

  if (!post) {
    return {
      title: "Journal",
    }
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/${countryCode}/journal/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/${countryCode}/journal/${post.slug}`,
      images: [post.image],
      type: "article",
    },
  }
}

export default async function JournalArticlePage(props: Props) {
  const { countryCode, slug } = await props.params
  const post = shreemJournalPosts.find((entry) => entry.slug === slug)

  if (!post) {
    notFound()
  }
  const baseUrl = getBaseURL()
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${baseUrl}${post.image}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Shreem Cow Products",
    },
    publisher: {
      "@type": "Organization",
      name: "Shreem Cow Products",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.jpeg`,
      },
    },
    mainEntityOfPage: `${baseUrl}/${countryCode}/journal/${post.slug}`,
  }

  return (
    <div className="content-container py-8 small:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="brand-surface overflow-hidden px-5 py-8 small:px-10 small:py-10">
        <div className="max-w-[52rem]">
          <p className="brand-pill w-fit">{post.category}</p>
          <h1 className="mt-5 text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--shreem-muted)]">
            <span className="brand-pill px-3 py-1.5">{post.readTime}</span>
            <span className="brand-pill px-3 py-1.5">{post.publishedAt}</span>
          </div>
          <p className="mt-6 text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
            {post.description}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] p-2 shadow-[0_24px_60px_rgba(15,49,70,0.08)]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[22px]">
            <Image
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
          {post.sections.map((section) => (
            <section key={section.heading} className="brand-card px-5 py-6 small:px-6">
              <h2 className="text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-[48rem] rounded-[28px] border border-[rgba(212,161,38,0.24)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] px-5 py-6 shadow-[0_18px_40px_rgba(156,105,18,0.08)] small:px-6">
          <p className="brand-kicker">Continue with Shreem</p>
          <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
            Explore the products behind the story
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
            Move from the Journal into the store and bring home the products
            behind the Shreem story of Gauri, Mayur, bilona, and ritual living.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink href="/store" className="brand-primary-button">
              Shop products
            </LocalizedClientLink>
          </div>
        </div>
      </article>
    </div>
  )
}
