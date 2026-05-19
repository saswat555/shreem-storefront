const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const SOURCE_PATH = path.join(ROOT, "data", "MP-BPHS.txt")
const OUTPUT_PATH = path.join(ROOT, "data", "bphs-rag.json")

const VECTOR_SIZE = 512
const CHUNK_WORDS = 260
const OVERLAP_WORDS = 70

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
  "sasra",
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

const normalizeSpaces = (value) =>
  value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const hashToken = (token) => {
  let hash = 2166136261

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const vectorize = (tokens, idf) => {
  const counts = new Map()
  const vector = new Array(VECTOR_SIZE).fill(0)

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1)
  })

  counts.forEach((count, token) => {
    const weight = (1 + Math.log(count)) * (idf[token] || 1)
    const hash = hashToken(token)
    const index = hash % VECTOR_SIZE
    const sign = hash & 1 ? -1 : 1

    vector[index] += sign * weight
  })

  const magnitude = Math.sqrt(
    vector.reduce((sum, item) => sum + item * item, 0)
  )

  if (!magnitude) {
    return vector
  }

  return vector.map((item) => Number((item / magnitude).toFixed(6)))
}

const extractBookBody = (raw) => {
  const normalized = normalizeSpaces(raw)
  const chapterOneMatches = [
    ...normalized.matchAll(/Ch\.\s*1\s*\.?\s*The\s+Creation/gi),
  ]
  const start =
    chapterOneMatches.length > 1
      ? chapterOneMatches[1].index
      : chapterOneMatches[0]?.index

  return start && start > -1 ? normalized.slice(start) : normalized
}

const parseChapters = (body) => {
  const lines = body.split("\n")
  const chapters = []
  let current = null

  const pushCurrent = () => {
    if (!current) {
      return
    }

    const text = current.lines.join("\n").trim()

    if (text.length > 120) {
      chapters.push({
        number: current.number,
        title: current.title || `Chapter ${current.number}`,
        text,
      })
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    const heading = trimmed.match(/^Ch\.\s*(\d+)\s*\.?\s*(.+)?$/i)

    if (heading) {
      pushCurrent()
      current = {
        number: Number(heading[1]),
        title: normalizeSpaces(heading[2] || ""),
        lines: [],
      }
      return
    }

    if (!current) {
      return
    }

    current.lines.push(line)
  })

  pushCurrent()

  return chapters
}

const cleanChunkText = (value) =>
  normalizeSpaces(value)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([a-z])-\s+([a-z])/gi, "$1$2")
    .slice(0, 4200)

const makeChunks = (chapters) => {
  const chunks = []

  chapters.forEach((chapter) => {
    const words = cleanChunkText(chapter.text).split(/\s+/).filter(Boolean)
    const step = CHUNK_WORDS - OVERLAP_WORDS

    for (let start = 0; start < words.length; start += step) {
      const slice = words.slice(start, start + CHUNK_WORDS)

      if (slice.length < 45) {
        continue
      }

      const chunkIndex =
        chunks.filter((item) => item.chapterNumber === chapter.number).length + 1
      const text = cleanChunkText(slice.join(" "))
      const tokens = tokenize(
        `${chapter.title} chapter ${chapter.number} ${text}`
      )

      chunks.push({
        id: `bphs-ch${chapter.number}-${String(chunkIndex).padStart(3, "0")}`,
        source: "Brihat Parashara Hora Shastra",
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        chunkIndex,
        citation: `Brihat Parashara Hora Shastra, Chapter ${chapter.number}: ${chapter.title}, passage ${chunkIndex}`,
        text,
        tokenCount: tokens.length,
        tokens,
      })
    }
  })

  return chunks
}

const buildIdf = (chunks) => {
  const docFrequency = new Map()

  chunks.forEach((chunk) => {
    new Set(chunk.tokens).forEach((token) => {
      docFrequency.set(token, (docFrequency.get(token) || 0) + 1)
    })
  })

  const idf = {}
  const total = chunks.length

  docFrequency.forEach((count, token) => {
    idf[token] = Number((Math.log((1 + total) / (1 + count)) + 1).toFixed(6))
  })

  return idf
}

const topKeywords = (tokens, idf) => {
  const scores = new Map()

  tokens.forEach((token) => {
    scores.set(token, (scores.get(token) || 0) + (idf[token] || 1))
  })

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 14)
    .map(([token]) => token)
}

const main = () => {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`Missing source file: ${SOURCE_PATH}`)
  }

  const raw = fs.readFileSync(SOURCE_PATH, "utf8")
  const body = extractBookBody(raw)
  const chapters = parseChapters(body)
  const rawChunks = makeChunks(chapters)
  const idf = buildIdf(rawChunks)
  const chunks = rawChunks.map(({ tokens, ...chunk }) => ({
    ...chunk,
    keywords: topKeywords(tokens, idf),
    vector: vectorize(tokens, idf),
  }))

  const artifact = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceFile: "data/MP-BPHS.txt",
    sourceTitle: "Brihat Parashara Hora Shastra",
    vectorizer: {
      kind: "local-hashed-tfidf",
      vectorSize: VECTOR_SIZE,
      chunkWords: CHUNK_WORDS,
      overlapWords: OVERLAP_WORDS,
    },
    chapterCount: chapters.length,
    chunkCount: chunks.length,
    idf,
    chunks,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(artifact))
  console.log(
    `Built BPHS RAG artifact: ${chunks.length} chunks from ${chapters.length} chapters -> ${path.relative(
      ROOT,
      OUTPUT_PATH
    )}`
  )
}

main()
