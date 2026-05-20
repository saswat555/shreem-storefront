const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const ROOT = path.resolve(__dirname, "..")
const SOURCE_FILES = [
  {
    file: "data/MP-BPHS.txt",
    volume: "Volume 1",
    title: "Brihat Parashara Hora Shastra",
  },
  {
    file: "data/MP-BPHS-2.txt",
    volume: "Volume 2",
    title: "Brihat Parashara Hora Shastra Hindi Commentary",
    allowLooseBody: true,
  },
]
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
    .replace(/[^\p{L}\p{N}]+/gu, " ")
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

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex")

const getSourceFingerprints = () =>
  SOURCE_FILES.map((source) => {
    const sourcePath = path.join(ROOT, source.file)

    if (!fs.existsSync(sourcePath)) {
      return {
        file: source.file,
        volume: source.volume,
        missing: true,
        size: 0,
        sha256: "",
      }
    }

    const raw = fs.readFileSync(sourcePath)

    return {
      file: source.file,
      volume: source.volume,
      missing: false,
      size: raw.length,
      sha256: sha256(raw),
    }
  })

const shouldSkipBuild = (fingerprints) => {
  if (process.argv.includes("--force") || !fs.existsSync(OUTPUT_PATH)) {
    return false
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"))

    return (
      artifact?.version === 2 &&
      artifact?.vectorizer?.vectorSize === VECTOR_SIZE &&
      artifact?.vectorizer?.chunkWords === CHUNK_WORDS &&
      artifact?.vectorizer?.overlapWords === OVERLAP_WORDS &&
      JSON.stringify(artifact?.sourceFingerprints || []) ===
        JSON.stringify(fingerprints)
    )
  } catch {
    return false
  }
}

const extractBookBody = (raw, source) => {
  const normalized = normalizeSpaces(raw)
  const chapterOneMatches = [
    ...normalized.matchAll(/Ch\.\s*1\s*\.?\s*The\s+Creation/gi),
  ]
  const start =
    chapterOneMatches.length > 1
      ? chapterOneMatches[1].index
      : chapterOneMatches[0]?.index

  if (start && start > -1) {
    return normalized.slice(start)
  }

  if (source.allowLooseBody) {
    const looseStart = normalized.search(
      /अथ\s+|अध्याय|दशाध्याय|फलाध्याय|ग्रह|राहु|केतु|लग्न/
    )

    return looseStart > -1 ? normalized.slice(looseStart) : normalized
  }

  return normalized
}

const parseChapters = (body, source) => {
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
        sourceFile: source.file,
        sourceVolume: source.volume,
        sourceTitle: source.title,
        number: current.number,
        title: current.title || `Chapter ${current.number}`,
        text,
      })
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    const heading =
      trimmed.match(/^Ch\.\s*(\d+)\s*\.?\s*(.+)?$/i) ||
      trimmed.match(/^(\d{1,3})\.\s*(.+अध्याय.*)$/u) ||
      trimmed.match(/^\|\s*\|?\s*(.+अध्याय.*)$/u)

    if (heading) {
      pushCurrent()
      const number = Number(heading[1])
      current = {
        number: Number.isFinite(number) ? number : chapters.length + 1,
        title: normalizeSpaces(heading[2] || heading[1] || ""),
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

  if (!chapters.length) {
    chapters.push({
      sourceFile: source.file,
      sourceVolume: source.volume,
      sourceTitle: source.title,
      number: 1,
      title: source.volume,
      text: body,
    })
  }

  return chapters
}

const makeLooseChapters = (body, source) => {
  const words = normalizeSpaces(body)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([a-z])-\s+([a-z])/gi, "$1$2")
    .split(/\s+/)
    .filter(Boolean)
  const sectionWords = 3000
  const chapters = []

  for (let start = 0; start < words.length; start += sectionWords) {
    const slice = words.slice(start, start + sectionWords)

    if (slice.length < 120) {
      continue
    }

    chapters.push({
      sourceFile: source.file,
      sourceVolume: source.volume,
      sourceTitle: source.title,
      number: chapters.length + 1,
      title: `${source.volume} OCR section ${chapters.length + 1}`,
      text: slice.join(" "),
    })
  }

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
    const chapterText = normalizeSpaces(chapter.text)
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([a-z])-\s+([a-z])/gi, "$1$2")
    const words = chapterText.split(/\s+/).filter(Boolean)
    const step = CHUNK_WORDS - OVERLAP_WORDS

    for (let start = 0; start < words.length; start += step) {
      const slice = words.slice(start, start + CHUNK_WORDS)

      if (slice.length < 45) {
        continue
      }

      const chunkIndex =
        chunks.filter(
          (item) =>
            item.sourceFile === chapter.sourceFile &&
            item.chapterNumber === chapter.number
        ).length + 1
      const text = cleanChunkText(slice.join(" "))
      const tokens = tokenize(
        `${chapter.sourceVolume} ${chapter.title} chapter ${chapter.number} ${text}`
      )
      const sourcePrefix = chapter.sourceFile
        .replace(/^data\//, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()

      chunks.push({
        id: `bphs-${sourcePrefix}-ch${chapter.number}-${String(
          chunkIndex
        ).padStart(3, "0")}`,
        source: chapter.sourceTitle,
        sourceFile: chapter.sourceFile,
        sourceVolume: chapter.sourceVolume,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        chunkIndex,
        citation: `${chapter.sourceTitle}, ${chapter.sourceVolume}, Chapter ${chapter.number}: ${chapter.title}, passage ${chunkIndex}`,
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
  const fingerprints = getSourceFingerprints()
  const missingRequired = fingerprints.find(
    (fingerprint, index) => index === 0 && fingerprint.missing
  )

  if (missingRequired) {
    throw new Error(`Missing source file: ${missingRequired.file}`)
  }

  if (shouldSkipBuild(fingerprints)) {
    console.log(
      `BPHS RAG artifact is current; skipped rebuild -> ${path.relative(
        ROOT,
        OUTPUT_PATH
      )}`
    )
    return
  }

  const chapters = SOURCE_FILES.flatMap((source) => {
    const sourcePath = path.join(ROOT, source.file)

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skipping missing optional source: ${source.file}`)
      return []
    }

    const raw = fs.readFileSync(sourcePath, "utf8")
    const body = extractBookBody(raw, source)

    if (source.allowLooseBody) {
      return makeLooseChapters(body, source)
    }

    return parseChapters(body, source)
  })

  const rawChunks = makeChunks(chapters)
  const idf = buildIdf(rawChunks)
  const chunks = rawChunks.map(({ tokens, ...chunk }) => ({
    ...chunk,
    keywords: topKeywords(tokens, idf),
    vector: vectorize(tokens, idf),
  }))

  const artifact = {
    version: 2,
    generatedAt: new Date().toISOString(),
    sourceFiles: SOURCE_FILES.map((source) => source.file),
    sourceFingerprints: fingerprints,
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
    `Built BPHS RAG artifact: ${chunks.length} chunks from ${chapters.length} parsed sections across ${SOURCE_FILES.length} source files -> ${path.relative(
      ROOT,
      OUTPUT_PATH
    )}`
  )
}

main()
