import { Metadata } from "next"
import Image from "next/image"

import { shreemMascots } from "@lib/constants/shreem"
import { listBlogPosts } from "@lib/data/journal"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-dynamic"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title = "Shreem Blog | Bilona Ghee, Neem Dhoop & Natural Farming"
  const description =
    "Read the Shreem Blog for notes on bilona A2 ghee, neem dhoop, desi-cow living, cow dung cakes, Jeevamrut, and natural-farming wisdom."

  return {
    title,
    description,
    alternates: {
      canonical: `/${countryCode}/blog`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}/blog`,
      images: ["/logo.jpeg"],
    },
  }
}

export default async function BlogPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const baseUrl = getBaseURL()
  const blogPosts = await listBlogPosts()
  const [featuredPost, ...posts] = blogPosts
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shreem Blog articles",
    itemListElement: blogPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: `${baseUrl}/${countryCode}/blog/${post.slug}`,
    })),
  }

  return (
    <div className="content-container py-8 small:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
          <div>
            <p className="brand-pill mb-5 w-fit">Blog</p>
            <h1 className="brand-page-title max-w-[17ch]">
              Field notes for the kitchen, prayer room, and soil.
            </h1>
            <p className="brand-page-copy mt-5 max-w-[42rem]">
              Read practical notes on bilona ghee, neem dhoop, desi-cow living,
              and the illustrated world that gives the store its warmth, color,
              and memory.
            </p>
          </div>
          <div className="grid gap-4">
            {shreemMascots.map((mascot) => (
              <article key={mascot.name} className="brand-card overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                  <div className="relative min-h-[260px] border-b border-[var(--shreem-border)] bg-[radial-gradient(circle_at_top,rgba(212,161,38,0.22),transparent_40%),linear-gradient(180deg,rgba(248,241,226,0.96),rgba(239,246,242,0.92))] md:border-b-0 md:border-r">
                    <Image
                      src={mascot.imagePath}
                      alt={`${mascot.name}, one of the Shreem mascots`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 240px"
                      className="object-contain object-bottom p-4"
                    />
                  </div>
                  <div className="p-5 small:p-6">
                    <p className="brand-kicker">{mascot.role}</p>
                    <h2 className="brand-card-title mt-3">{mascot.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                      {mascot.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 small:py-10">
        <LocalizedClientLink href={`/blog/${featuredPost.slug}`} className="block">
          <article className="brand-card overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[320px] border-b border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] lg:border-b-0 lg:border-r">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-contain p-4"
                />
              </div>
              <div className="p-6 small:p-8">
                <p className="brand-kicker">{featuredPost.category}</p>
                <h2 className="brand-section-title mt-3">{featuredPost.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                  {featuredPost.excerpt}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm text-[var(--shreem-muted)]">
                  <span className="brand-pill px-3 py-1.5">
                    {featuredPost.readTime}
                  </span>
                  <span className="brand-pill px-3 py-1.5">
                    {featuredPost.publishedAt}
                  </span>
                </div>
                <div className="mt-8">
                  <span className="brand-primary-button">Read featured post</span>
                </div>
              </div>
            </div>
          </article>
        </LocalizedClientLink>
      </section>

      <section className="pb-16 pt-2 small:pb-24">
        <div className="grid gap-4 xl:grid-cols-2">
          {posts.map((post) => (
            <LocalizedClientLink
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block"
            >
              <article className="brand-card h-full overflow-hidden">
                <div className="relative aspect-[16/10] border-b border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))]">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(max-width: 1280px) 100vw, 640px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5 small:p-6">
                  <p className="brand-kicker">{post.category}</p>
                  <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-sm text-[var(--shreem-muted)]">
                    <span>{post.readTime}</span>
                    <span>Read now</span>
                  </div>
                </div>
              </article>
            </LocalizedClientLink>
          ))}
        </div>
      </section>
    </div>
  )
}
