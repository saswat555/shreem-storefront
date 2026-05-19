import "server-only"

import bphsRagArtifact from "../../../data/bphs-rag.json"

import type { PrashnaChart } from "./astrology"

type BphsRagChunk = {
  id: string
  source: string
  chapterNumber: number
  chapterTitle: string
  chunkIndex: number
  citation: string
  text: string
  tokenCount: number
  keywords: string[]
  vector: number[]
}

type BphsRagArtifact = {
  version: number
  sourceTitle: string
  vectorizer: {
    kind: string
    vectorSize: number
  }
  idf: Record<string, number>
  chunks: BphsRagChunk[]
}

export type RetrievedAstrologyPassage = {
  id: string
  source: string
  section: string
  citation: string
  chapterNumber: number
  chapterTitle: string
  text: string
  keywords: string[]
  score: number
}

const rag = bphsRagArtifact as BphsRagArtifact
const VECTOR_SIZE = rag.vectorizer.vectorSize

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "among",
  "and",
  "are",
  "because",
  "been",
  "being",
  "bhava",
  "brihat",
  "can",
  "chapter",
  "could",
  "from",
  "grah",
  "graha",
  "has",
  "have",
  "his",
  "hora",
  "into",
  "its",
  "lord",
  "may",
  "not",
  "parashara",
  "rasi",
  "said",
  "shall",
  "should",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "this",
  "through",
  "thus",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "would",
])

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const hashToken = (token: string) => {
  let hash = 2166136261

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const vectorizeQuery = (value: string) => {
  const counts = new Map<string, number>()
  const vector = new Array<number>(VECTOR_SIZE).fill(0)

  tokenize(value).forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1)
  })

  counts.forEach((count, token) => {
    const weight = (1 + Math.log(count)) * (rag.idf[token] || 1)
    const hash = hashToken(token)
    const index = hash % VECTOR_SIZE
    const sign = hash & 1 ? -1 : 1

    vector[index] += sign * weight
  })

  const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0))

  return magnitude ? vector.map((item) => item / magnitude) : vector
}

const cosineSimilarity = (left: number[], right: number[]) =>
  left.reduce((sum, item, index) => sum + item * (right[index] || 0), 0)

const chartSearchText = (chart?: PrashnaChart) => {
  if (!chart) {
    return ""
  }

  return [
    `lagna ${chart.ascendant}`,
    `moon ${chart.moonSign} ${chart.nakshatra}`,
    `dasha ${chart.dasha?.mahadasha?.lord || ""} ${
      chart.dasha?.antardasha?.lord || ""
    } ${chart.dasha?.pratyantar?.lord || ""}`,
    chart.planets
      .map(
        (planet) =>
          `${planet.name} ${planet.sign} house ${planet.house} ${planet.nakshatra}`
      )
      .join(" "),
  ].join(" ")
}

const keywordOverlapBoost = (queryTokens: Set<string>, chunk: BphsRagChunk) => {
  const overlap = chunk.keywords.reduce(
    (score, keyword) => (queryTokens.has(keyword) ? score + 1 : score),
    0
  )

  return Math.min(overlap * 0.035, 0.28)
}

const specialCaseBoost = (normalizedQuery: string, chunk: BphsRagChunk) => {
  const haystack = normalizeText(
    `${chunk.chapterTitle} ${chunk.keywords.join(" ")} ${chunk.text.slice(0, 600)}`
  )
  const boosts: [RegExp, string[], number][] = [
    [/budh|mercury|budhaditya/, ["budh", "mercury", "surya", "sun"], 0.18],
    [/sarpa|kaal|kalsarp|rahu|ketu/, ["sarpa", "rahu", "ketu"], 0.2],
    [/manglik|mangal|mars|kuja/, ["mangal", "mars"], 0.18],
    [/health|disease|illness|rog|ari|sixth/, ["disease", "ari", "illness"], 0.22],
    [/marriage|match|nadi|bhakoot|yoni|gana/, ["marriage", "nadi", "bhakoot", "yoni"], 0.18],
    [/dasha|mahadasha|antardasha/, ["dasha", "vimshottari"], 0.18],
    [/remed|mantra|pooja|puja|gem|stone|daan/, ["remed", "mantra", "graha"], 0.18],
  ]

  return boosts.reduce((score, [pattern, terms, boost]) => {
    if (!pattern.test(normalizedQuery)) {
      return score
    }

    return terms.some((term) => haystack.includes(term))
      ? score + boost
      : score
  }, 0)
}

export const retrieveAstrologyKnowledge = ({
  query,
  chart,
  detectedCases = [],
  min = 3,
  max = 8,
}: {
  query: string
  chart?: PrashnaChart
  detectedCases?: string[]
  min?: number
  max?: number
}): RetrievedAstrologyPassage[] => {
  const boundedMin = Math.min(Math.max(min, 1), 10)
  const boundedMax = Math.min(Math.max(max, boundedMin), 10)
  const searchText = [
    query,
    chartSearchText(chart),
    detectedCases.join(" "),
  ].join(" ")
  const normalizedSearch = normalizeText(searchText)
  const queryTokens = new Set(tokenize(searchText))
  const queryVector = vectorizeQuery(searchText)

  return rag.chunks
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      section: `Chapter ${chunk.chapterNumber}: ${chunk.chapterTitle}`,
      citation: chunk.citation,
      chapterNumber: chunk.chapterNumber,
      chapterTitle: chunk.chapterTitle,
      text: chunk.text,
      keywords: chunk.keywords,
      score:
        cosineSimilarity(queryVector, chunk.vector) +
        keywordOverlapBoost(queryTokens, chunk) +
        specialCaseBoost(normalizedSearch, chunk),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, boundedMax)
    .filter((passage, index) => index < boundedMin || passage.score > 0.08)
}

export const formatAstrologyKnowledgeForPrompt = (
  passages: RetrievedAstrologyPassage[]
) =>
  passages
    .map(
      (passage, index) =>
        `${index + 1}. [${passage.id}] Citation: ${
          passage.citation
        }\nExcerpt: ${passage.text}`
    )
    .join("\n\n")

export const getKnowledgeIds = (passages: RetrievedAstrologyPassage[]) =>
  passages.map((passage) => passage.citation)
