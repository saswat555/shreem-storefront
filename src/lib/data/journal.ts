"use server"

import { sdk } from "@lib/config"
import {
  ShreemJournalPost,
  shreemJournalPosts,
} from "@lib/constants/shreem-experience"

type StoreJournalPost = Partial<ShreemJournalPost> & {
  published_at?: string
  image_alt?: string
  read_time?: string
  status?: string
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
      "A Shreem Journal note on desi-cow products, ritual living, and natural care.",
    excerpt:
      post.excerpt ||
      post.description ||
      "A Shreem Journal note on desi-cow products, ritual living, and natural care.",
    image: post.image || "/shreem-scenes/hero-scene.png",
    imageAlt:
      post.imageAlt || post.image_alt || `${post.title} article image`,
    category: post.category || "Shreem Journal",
    readTime: post.readTime || post.read_time || "4 min read",
    publishedAt:
      post.publishedAt || post.published_at || new Date().toISOString().slice(0, 10),
    sections: Array.isArray(post.sections) && post.sections.length
      ? post.sections
      : [
          {
            heading: post.title,
            body: [
              post.description ||
                post.excerpt ||
                "This Shreem Journal note is being prepared by the team and will be expanded soon.",
            ],
          },
        ],
  }
}

export const listJournalPosts = async () => {
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

    return posts.length ? posts : shreemJournalPosts
  } catch {
    return shreemJournalPosts
  }
}

export const getJournalPost = async (slug: string) => {
  const posts = await listJournalPosts()

  return posts.find((post) => post.slug === slug) || null
}
