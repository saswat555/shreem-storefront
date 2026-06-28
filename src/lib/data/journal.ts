"use server"

import { sdk } from "@lib/config"
import {
  ShreemJournalPost,
  shreemJournalPosts,
} from "@lib/constants/shreem-experience"

type StoreJournalPost = Partial<ShreemJournalPost> & {
  published_at?: string
  image_alt?: string
  image_url?: string
  imageUrl?: string
  read_time?: string
  status?: string
  focusedProduct?: ShreemJournalPost["focusedProduct"]
  focused_product?: ShreemJournalPost["focusedProduct"]
  productCta?: ShreemJournalPost["productCta"]
  product_cta?: ShreemJournalPost["productCta"]
  relatedKeywords?: string[]
  related_keywords?: string[]
  targetKeyword?: string
  target_keyword?: string
  searchIntent?: string
  search_intent?: string
  metaTitle?: string
  meta_title?: string
  metaDescription?: string
  meta_description?: string
}

export type BlogPostListResult = {
  posts: ShreemJournalPost[]
  count: number
  limit: number
  offset: number
  hasMore: boolean
}

const normalizeImage = (post: StoreJournalPost) => {
  const image = post.image || post.imageUrl || post.image_url || ""

  return image &&
    image !== "/shreem-scenes/hero-scene.png" &&
    image !== "/shreem-scenes/hero-scene.jpg"
    ? image
    : "/logo.jpeg"
}

const normalizePost = (post: StoreJournalPost): ShreemJournalPost | null => {
  if (!post.slug || !post.title) {
    return null
  }

  return {
    slug: post.slug,
    title: post.title,
    description:
      post.description ||
      post.excerpt ||
      "A Shreem Blog note on desi-cow products, ritual living, and natural care.",
    excerpt:
      post.excerpt ||
      post.description ||
      "A Shreem Blog note on desi-cow products, ritual living, and natural care.",
    image: normalizeImage(post),
    imageAlt:
      post.imageAlt || post.image_alt || `${post.title} article image`,
    category: post.category || "Shreem Blog",
    readTime: post.readTime || post.read_time || "4 min read",
    publishedAt:
      post.publishedAt || post.published_at || new Date().toISOString().slice(0, 10),
    seoTitle: post.seoTitle || (post as any).seo_title,
    metaTitle: post.metaTitle || post.meta_title,
    metaDescription: post.metaDescription || post.meta_description,
    targetKeyword: post.targetKeyword || post.target_keyword,
    relatedKeywords: Array.isArray(post.relatedKeywords)
      ? post.relatedKeywords
      : Array.isArray(post.related_keywords)
      ? post.related_keywords
      : [],
    searchIntent: post.searchIntent || post.search_intent,
    focusedProduct: post.focusedProduct || post.focused_product,
    productCta: post.productCta || post.product_cta,
    faq: Array.isArray(post.faq) ? post.faq : [],
    socialCaption: post.socialCaption || (post as any).social_caption,
    suggestedNextTopics: Array.isArray(post.suggestedNextTopics)
      ? post.suggestedNextTopics
      : Array.isArray((post as any).suggested_next_topics)
      ? (post as any).suggested_next_topics
      : [],
    sections: Array.isArray(post.sections) && post.sections.length
      ? post.sections
      : [
          {
            heading: post.title,
            body: [
              post.description ||
                post.excerpt ||
                "This Shreem Blog note is being prepared by the team and will be expanded soon.",
            ],
          },
        ],
    relatedLinks: Array.isArray(post.relatedLinks)
      ? post.relatedLinks
      : Array.isArray((post as any).related_links)
      ? (post as any).related_links
      : [],
  }
}

export const getJournalPost = async (slug: string) => {
  try {
    const response = await sdk.client.fetch<{ posts: StoreJournalPost[] }>(
      "/store/journal",
      {
        method: "GET",
        cache: "no-store",
      }
    )
    const posts = (response.posts || [])
      .map(normalizePost)
      .filter(Boolean) as ShreemJournalPost[]

    return posts.find((post) => post.slug === slug) || null
  } catch {
    const posts = await listJournalPosts()

    return posts.find((post) => post.slug === slug) || null
  }
}

export const listJournalPosts = async ({
  limit,
  offset,
}: {
  limit?: number
  offset?: number
} = {}): Promise<ShreemJournalPost[]> => {
  const result = await listJournalPostsPage({
    limit: limit || 50,
    offset: offset || 0,
  })

  return result.posts
}

export const listJournalPostsPage = async ({
  limit = 12,
  offset = 0,
}: {
  limit?: number
  offset?: number
} = {}): Promise<BlogPostListResult> => {
  try {
    const response = await sdk.client
      .fetch<{
        posts: StoreJournalPost[]
        count?: number
        limit?: number
        offset?: number
        has_more?: boolean
      }>("/store/blog", {
        method: "GET",
        query: {
          limit,
          offset,
        },
        cache: "no-store",
      })
      .catch(() =>
        sdk.client.fetch<{
          posts: StoreJournalPost[]
          count?: number
          limit?: number
          offset?: number
          has_more?: boolean
        }>("/store/journal", {
          method: "GET",
          cache: "no-store",
        })
      )
    const posts = (response.posts || [])
      .map(normalizePost)
      .filter(Boolean) as ShreemJournalPost[]

    const fallbackPosts = shreemJournalPosts.slice(offset, offset + limit)

    return {
      posts: posts.length ? posts : fallbackPosts,
      count: Number(response.count || posts.length || shreemJournalPosts.length),
      limit: Number(response.limit || limit),
      offset: Number(response.offset || offset),
      hasMore:
        typeof response.has_more === "boolean"
          ? response.has_more
          : offset + limit < Number(response.count || posts.length),
    }
  } catch {
    return {
      posts: shreemJournalPosts.slice(offset, offset + limit),
      count: shreemJournalPosts.length,
      limit,
      offset,
      hasMore: offset + limit < shreemJournalPosts.length,
    }
  }
}

export const listBlogPosts = listJournalPosts
export const listBlogPostsPage = listJournalPostsPage
export const getBlogPost = getJournalPost
