import "server-only"

import bphsRagArtifact from "../../../data/bphs-rag.json"

import type { PrashnaChart } from "./astrology"

type BphsRagChunk = {
  id: string
  source: string
  sourceFile?: string
  sourceVolume?: string
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
  sourceFile?: string
  sourceVolume?: string
  section: string
  citation: string
  chapterNumber: number
  chapterTitle: string
  text: string
  keywords: string[]
  score: number
}

export type AstrologyKnowledgeIntent =
  | "career"
  | "wealth"
  | "health"
  | "relationship"
  | "dasha"
  | "remedy"
  | "yoga"
  | "markesh"

const INTENT_EVIDENCE_TERMS: Record<AstrologyKnowledgeIntent, string[]> = {
  career: ["career", "profession", "karma", "karm", "tenth", "10th", "authority", "work", "livelihood", "राज", "कर्म"],
  wealth: ["wealth", "money", "income", "second", "2nd", "eleventh", "11th", "dhana", "labh", "gain", "finance", "धन", "लाभ"],
  health: ["health", "disease", "sixth", "6th", "eighth", "8th", "twelfth", "12th", "ari", "randhr", "vyaya", "रोग"],
  relationship: ["marriage", "wife", "spouse", "seventh", "7th", "yuvati", "venus", "relationship", "विवाह"],
  dasha: ["dasha", "vimshottari", "period", "mahadasha", "antardasha", "pratyantar", "दशा"],
  remedy: ["remedy", "mantra", "worship", "donation", "daan", "shanti", "pooja", "उपाय", "मंत्र", "दान"],
  yoga: ["yoga", "raja", "dhan", "gajakesari", "neecha", "combination", "योग"],
  markesh: ["maraka", "markesh", "second", "2nd", "seventh", "7th", "longevity", "death", "मारक"],
}

const INTENT_QUERY_EXPANSION: Record<AstrologyKnowledgeIntent, string> = {
  career: "career profession karma karm bhava tenth house authority work livelihood",
  wealth: "wealth dhan second house eleventh house labh gains income finance",
  health: "health disease ari randhra vyaya sixth eighth twelfth dusthana prevention",
  relationship: "marriage spouse wife yuvati seventh house venus jupiter relationship",
  dasha: "vimshottari dasha mahadasha antardasha pratyantar period results",
  remedy: "remedy mantra pooja daan shanti worship graha peace",
  yoga: "yoga raja yoga dhana yoga gajakesari neechabhanga planetary combination",
  markesh: "maraka markesh second seventh house longevity prevention dasha",
}

// Chapter gating is the precision boundary. Semantic similarity ranks passages
// only after the passage belongs to a BPHS chapter that can govern the intent.
const INTENT_CHAPTERS: Record<AstrologyKnowledgeIntent, Set<number>> = {
  career: new Set([11, 14, 20, 21, 22, 24, 26, 27, 32, 34, 39, 40]),
  wealth: new Set([11, 13, 16, 20, 21, 22, 24, 32, 34, 41, 42]),
  health: new Set([9, 10, 11, 12, 17, 19, 23, 24, 26, 27, 43, 44]),
  relationship: new Set([11, 13, 16, 18, 19, 23, 24, 30, 32, 80]),
  dasha: new Set(Array.from({ length: 18 }, (_, index) => 46 + index)),
  remedy: new Set([10, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96]),
  yoga: new Set([34, 35, 36, 37, 38, 39, 40, 41, 42, 75, 79, 83]),
  markesh: new Set([17, 19, 43, 44, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 71]),
}

const INTENT_PRIMARY_CHAPTERS: Record<AstrologyKnowledgeIntent, Set<number>> = {
  career: new Set([14, 20, 21, 22, 39, 40]),
  wealth: new Set([13, 22, 41, 42]),
  health: new Set([12, 17, 19, 23, 43, 44]),
  relationship: new Set([18, 30, 80]),
  dasha: new Set([46, 47, 48, 51, 61, 62, 63]),
  remedy: new Set([10, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96]),
  yoga: new Set([34, 35, 36, 37, 38, 39, 40, 41, 42]),
  markesh: new Set([43, 44, 71]),
}

const INTENT_HOUSES: Record<AstrologyKnowledgeIntent, number[]> = {
  career: [1, 3, 6, 9, 10, 11],
  wealth: [2, 5, 8, 9, 11, 12],
  health: [1, 6, 8, 12],
  relationship: [2, 5, 7, 8, 11, 12],
  dasha: [],
  remedy: [1, 6, 8, 9, 12],
  yoga: [1, 4, 5, 7, 9, 10, 11],
  markesh: [2, 7, 8, 12],
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
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

export const getAstrologyIntentEvidenceScore = (
  intent: AstrologyKnowledgeIntent | undefined,
  passage: { text?: string; keywords?: string[]; chapterTitle?: string }
) => {
  if (!intent) {
    return 1
  }

  const haystack = normalizeText(
    `${passage.chapterTitle || ""} ${passage.keywords?.join(" ") || ""} ${
      passage.text || ""
    }`
  )

  return INTENT_EVIDENCE_TERMS[intent].filter((term) =>
    haystack.includes(normalizeText(term))
  ).length
}

const SEMANTIC_EXPANSIONS: [RegExp, string][] = [
  [
    /personality|temperament|nature|mind|emotion|liking|habit|identity|confidence/,
    "lagna ascendant moon chandra sun surya first house mind temperament nature character mental disposition",
  ],
  [
    /career|profession|work|job|business|status|authority|success/,
    "tenth house karma career profession saturn sun mercury jupiter authority status livelihood work",
  ],
  [
    /money|wealth|income|saving|finance|profit|loss/,
    "second house eleventh house dhana labha wealth income gains venus jupiter mercury saturn",
  ],
  [
    /marriage|relationship|spouse|partner|match|compatibility/,
    "seventh house venus jupiter mars mangal marriage spouse yoni gana nadi bhakoot relationship",
  ],
  [
    /children|education|intelligence|study|creativity|mantra/,
    "fifth house putra vidya intelligence mantra purva punya jupiter mercury children education",
  ],
  [
    /health|disease|illness|pain|body|injury|accident|surgery|major incident/,
    "sixth house eighth house twelfth house ari randhra vyaya disease injury accident arishta mars saturn rahu ketu",
  ],
  [
    /dasha|period|timing|event|incident|phase|mahadasha|antardasha/,
    "vimshottari dasha mahadasha antardasha pratyantar period result timing phala bhukti",
  ],
  [
    /remedy|pooja|puja|mantra|daan|stone|gem|upay|peace/,
    "upaya shanti mantra daan graha remedy worship deity vrata seva gemstone caution",
  ],
]

const expandSemanticQuery = (value: string) => {
  const normalized = normalizeText(value)
  const additions = SEMANTIC_EXPANSIONS.flatMap(([pattern, expansion]) =>
    pattern.test(normalized) ? [expansion] : []
  )

  return additions.length ? `${value} ${additions.join(" ")}` : value
}

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

const chartSearchText = (
  chart?: PrashnaChart,
  intent?: AstrologyKnowledgeIntent
) => {
  if (!chart) {
    return ""
  }

  const relevantHouses = intent ? INTENT_HOUSES[intent] : []
  const houseRows = relevantHouses.length
    ? chart.houses.filter((house) => relevantHouses.includes(house.house))
    : []
  const relevantPlanets = new Set<string>()
  houseRows.forEach((house) => relevantPlanets.add(house.signLord))
  chart.planets.forEach((planet) => {
    if (relevantHouses.includes(planet.bhavaHouse || planet.house)) {
      relevantPlanets.add(planet.name)
    }
  })

  return [
    `lagna ${chart.ascendant}`,
    `moon ${chart.moonSign} ${chart.nakshatra}`,
    `dasha ${chart.dasha?.mahadasha?.lord || ""} ${
      chart.dasha?.antardasha?.lord || ""
    } ${chart.dasha?.pratyantar?.lord || ""}`,
    chart.planets
      .filter((planet) => !intent || relevantPlanets.has(planet.name))
      .map(
        (planet) =>
          `${planet.name} ${planet.sign} house ${planet.house} rashi house ${
            planet.rashiHouse || planet.house
          } bhava house ${planet.bhavaHouse || planet.house} ${planet.nakshatra}`
      )
      .join(" "),
    houseRows
      .map(
        (house) =>
          `house ${house.house} ${house.sign} ${house.signLord} ${house.theme}`
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
    [
      /budh|mercury|budhaditya|बुध|बुधादित्य/,
      ["budh", "mercury", "surya", "sun", "बुध", "सूर्य"],
      0.18,
    ],
  [
    /sarpa|kaal|kalsarp|rahu|ketu|राहु|केतु|सर्प|काल/,
    ["sarpa", "rahu", "ketu", "राहु", "केतु", "सर्प"],
    0.2,
  ],
  [
    /neech|neechabhanga|debilitat|cancellation|नीच|भंग/,
    ["debilitat", "cancellation", "exaltation", "kendra", "नीच", "भंग"],
    0.22,
  ],
    [
      /gajakesari|gaja|jupiter|guru|गज|गुरु|बृहस्पति/,
      ["gaja", "jupiter", "guru", "गुरु", "बृहस्पति"],
      0.18,
    ],
    [/manglik|mangal|mars|kuja|मंगल/, ["mangal", "mars", "मंगल"], 0.18],
    [
      /health|disease|illness|rog|ari|sixth|रोग|अरिष्ट|षष्ठ/,
      ["disease", "ari", "illness", "रोग", "अरिष्ट", "षष्ठ"],
      0.22,
    ],
    [
      /accident|incident|injury|sudden|eighth|randhr|twelfth|दुर्घटना|मृत्यु|आयु|अष्टम/,
      [
        "accident",
        "injury",
        "randhr",
        "eighth",
        "दुर्घटना",
        "अरिष्ट",
        "मृत्यु",
        "अष्टम",
      ],
      0.24,
    ],
    [
      /marriage|match|nadi|bhakoot|yoni|gana|विवाह|नाड़ी/,
      ["marriage", "nadi", "bhakoot", "yoni", "विवाह", "नाड़ी"],
      0.18,
    ],
    [
      /dasha|mahadasha|antardasha|pratyantar|दशा|महादशा|अन्तर्दशा/,
      ["dasha", "vimshottari", "दशा", "महादशा"],
      0.22,
    ],
    [
      /remed|mantra|pooja|puja|gem|stone|daan|उपाय|मंत्र|पूजा|दान/,
      ["remed", "mantra", "graha", "उपाय", "मंत्र", "दान"],
      0.18,
    ],
    [
      /personality|temperament|nature|mind|emotion|लग्न|चन्द्र/,
      ["lagna", "moon", "chandra", "first", "mind", "लग्न", "चन्द्र"],
      0.16,
    ],
    [
      /career|profession|karma|income|wealth|धन|कर्म/,
      ["karma", "tenth", "profession", "wealth", "dhana", "कर्म", "धन"],
      0.16,
    ],
    [
      /children|education|intelligence|fifth|putra|विद्या|पुत्र/,
      ["fifth", "putra", "vidya", "jupiter", "विद्या", "पुत्र"],
      0.14,
    ],
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

const topicRelevanceBoost = (normalizedQuery: string, chunk: BphsRagChunk) => {
  const haystack = normalizeText(
    `${chunk.chapterTitle} ${chunk.keywords.join(" ")} ${chunk.text.slice(0, 1100)}`
  )

  const topicRules: {
    topic: RegExp
    must: string[]
    should: string[]
    boost: number
  }[] = [
    {
      topic: /career|profession|karma|tenth|10th|authority|livelihood|work|job|business|status|recognition|कर्म|दशम|पेशा|व्यवसाय/,
      must: ["karma", "profession", "work", "tenth", "10th", "livelihood", "authority", "business", "government", "success", "कर्म", "दशम"],
      should: ["king", "status", "position", "reputation", "ventures", "employment", "office", "राज", "व्यवसाय"],
      boost: 0.42,
    },
    {
      topic: /wealth|money|income|saving|finance|profit|gains|second|2nd|eleventh|11th|dhana|labha|धन|लाभ|आय|बचत/,
      must: ["wealth", "money", "income", "gains", "gain", "dhana", "labha", "second", "eleventh", "profit", "grains", "cattle", "land", "धन", "लाभ"],
      should: ["ornaments", "village", "property", "resources", "savings"],
      boost: 0.36,
    },
    {
      topic: /health|disease|illness|recovery|accident|injury|surgery|sixth|6th|eighth|8th|twelfth|12th|ari|randhra|vyaya|arishta|rog|रोग|अरिष्ट|दुर्घटना|अष्टम|षष्ठ/,
      must: ["disease", "illness", "ari", "randhr", "vyaya", "sixth", "eighth", "twelfth", "injury", "accident", "wounds", "fever", "physical distress", "रोग", "अरिष्ट", "अष्टम", "षष्ठ"],
      should: ["headaches", "heart", "poison", "snakes", "surgery", "danger", "hospital"],
      boost: 0.38,
    },
    {
      topic: /marriage|relationship|spouse|partner|seventh|7th|public dealing|contracts|partnership|venus|विवाह|नाड़ी|भकूट/,
      must: ["marriage", "wife", "spouse", "seventh", "yuvati", "venus", "sukr", "partner", "relationship", "विवाह"],
      should: ["children", "family", "kinsmen", "happiness from wife", "distress to wife"],
      boost: 0.38,
    },
    {
      topic: /neech|neechabhanga|debilitat|cancellation|exaltation|नीच|भंग/,
      must: ["debilitation", "debilitated", "exaltation", "exalted", "own rasi", "kendr", "trikon", "नीच", "भंग"],
      should: ["strength", "benefic", "malefic", "own navahs"],
      boost: 0.34,
    },
    {
      topic: /dasha|mahadasha|antardasha|pratyantar|bhukti|vimshottari|दशा|महादशा|अन्तर्दशा/,
      must: ["dasha", "antar", "bhukti", "mahadasha", "vimshottari", "period", "दशा"],
      should: ["effects", "results", "commencement", "later"],
      boost: 0.26,
    },
  ]

  return topicRules.reduce((score, rule) => {
    if (!rule.topic.test(normalizedQuery)) {
      return score
    }

    const mustHits = rule.must.filter((term) => haystack.includes(normalizeText(term))).length
    const shouldHits = rule.should.filter((term) => haystack.includes(normalizeText(term))).length

    if (!mustHits) {
      return score
    }

    return score + Math.min(rule.boost + mustHits * 0.035 + shouldHits * 0.018, 0.72)
  }, 0)
}

const genericDashaDominancePenalty = (
  normalizedQuery: string,
  chunk: BphsRagChunk
) => {
  const haystack = normalizeText(
    `${chunk.chapterTitle} ${chunk.keywords.join(" ")} ${chunk.text.slice(0, 900)}`
  )

  const isLifeAreaQuery =
    /career|profession|karma|tenth|10th|wealth|money|income|second|2nd|eleventh|11th|health|disease|sixth|6th|eighth|8th|twelfth|12th|marriage|relationship|seventh|7th/.test(
      normalizedQuery
    )

  const isPureDashaChapter =
    /effects of .*dasha|antar dashas|dasha of/.test(haystack) ||
    /dasha/.test(haystack)

  const hasLifeAreaSpecificEvidence =
    /tenth|10th|karma|profession|second|eleventh|dhana|labha|sixth|eighth|twelfth|ari|randhr|vyaya|seventh|yuvati|marriage|wife|spouse|career|wealth|disease|health/.test(
      haystack
    )

  if (isLifeAreaQuery && isPureDashaChapter && !hasLifeAreaSpecificEvidence) {
    return -0.45
  }

  return 0
}



const topicEvidenceScore = (normalizedQuery: string, chunk: BphsRagChunk) => {
  const haystack = normalizeText(
    `${chunk.chapterTitle} ${chunk.keywords.join(" ")} ${chunk.text.slice(0, 1400)}`
  )

  const rules: { topic: RegExp; evidence: string[] }[] = [
    {
      topic: /career|profession|karma|tenth|10th|authority|livelihood|work|job|business|status|recognition|कर्म|दशम|पेशा|व्यवसाय/,
      evidence: [
        "tenth",
        "10th",
        "karma",
        "karm",
        "karm s lord",
        "profession",
        "livelihood",
        "work",
        "obstacles in work",
        "success in the desired ventures",
        "employment",
        "office",
        "authority",
        "governmental authority",
        "entrustment of governmental authority",
        "position",
        "status",
        "reputation",
        "name and fame",
        "raj yog",
        "राज",
        "कर्म",
        "दशम",
        "पेशा",
      ],
    },
    {
      topic: /wealth|money|income|saving|finance|profit|gains|second|2nd|eleventh|11th|dhana|labha|धन|लाभ|आय|बचत/,
      evidence: [
        "second",
        "2nd",
        "eleventh",
        "11th",
        "dhana",
        "labha",
        "wealth",
        "money",
        "income",
        "gain of wealth",
        "gains",
        "profit",
        "grains",
        "cattle",
        "land",
        "property",
        "ornaments",
        "धन",
        "लाभ",
      ],
    },
    {
      topic: /health|disease|illness|recovery|accident|injury|surgery|sixth|6th|eighth|8th|twelfth|12th|ari|randhra|vyaya|arishta|rog|रोग|अरिष्ट|दुर्घटना|अष्टम|षष्ठ/,
      evidence: [
        "sixth",
        "6th",
        "eighth",
        "8th",
        "twelfth",
        "12th",
        "ari",
        "randhr",
        "vyaya",
        "disease",
        "illness",
        "physical distress",
        "mental agony",
        "injury",
        "wounds",
        "accident",
        "fever",
        "heart disease",
        "headaches",
        "poison",
        "रोग",
        "अरिष्ट",
        "अष्टम",
        "षष्ठ",
      ],
    },
    {
      topic: /marriage|relationship|spouse|partner|seventh|7th|public dealing|contracts|partnership|venus|विवाह|नाड़ी|भकूट/,
      evidence: [
        "seventh",
        "7th",
        "yuvati",
        "marriage",
        "wife",
        "spouse",
        "partner",
        "venus",
        "sukr",
        "relationship",
        "happiness from wife",
        "distress to wife",
        "विवाह",
      ],
    },
  ]

  const matchedRule = rules.find((rule) => rule.topic.test(normalizedQuery))

  if (!matchedRule) {
    return 1
  }

  const hits = matchedRule.evidence.filter((term) =>
    haystack.includes(normalizeText(term))
  ).length

  return hits
}

const exactTopicGatePenalty = (
  normalizedQuery: string,
  chunk: BphsRagChunk
) => {
  const isStrictLifeArea =
    /career|profession|karma|tenth|10th|wealth|money|income|second|2nd|eleventh|11th|health|disease|sixth|6th|eighth|8th|twelfth|12th|marriage|relationship|seventh|7th/.test(
      normalizedQuery
    )

  if (!isStrictLifeArea) {
    return 0
  }

  const evidence = topicEvidenceScore(normalizedQuery, chunk)

  const isCareerQuery =
    /career|profession|karma|tenth|10th|authority|livelihood|work|job|status|recognition|कर्म|दशम|पेशा/.test(
      normalizedQuery
    )

  if (evidence === 0) {
    return isCareerQuery ? -1.8 : -1.25
  }

  if (evidence === 1) {
    return isCareerQuery ? -0.75 : -0.35
  }

  return Math.min(evidence * 0.1, 0.4)
}

const selectDiverseAstrologyPassages = (
  normalizedQuery: string,
  passages: RetrievedAstrologyPassage[],
  max: number
) => {
  const chapterLimit = 1
  const selected: RetrievedAstrologyPassage[] = []
  const chapterCounts = new Map<number, number>()

  const strong = passages.filter((passage) => {
    const chunkLike = passage as unknown as BphsRagChunk

    return topicEvidenceScore(normalizedQuery, chunkLike) > 0
  })

  for (const passage of strong) {
    const used = chapterCounts.get(passage.chapterNumber) || 0

    if (used >= chapterLimit) {
      continue
    }

    selected.push(passage)
    chapterCounts.set(passage.chapterNumber, used + 1)

    if (selected.length >= max) {
      return selected
    }
  }

  for (const passage of passages) {
    if (selected.some((item) => item.id === passage.id)) {
      continue
    }

    const used = chapterCounts.get(passage.chapterNumber) || 0

    if (used >= chapterLimit) {
      continue
    }

    selected.push(passage)
    chapterCounts.set(passage.chapterNumber, used + 1)

    if (selected.length >= max) {
      break
    }
  }

  return selected
}


export const retrieveAstrologyKnowledge = ({
  query,
  chart,
  detectedCases = [],
  min = 3,
  max = 8,
  intent,
}: {
  query: string
  chart?: PrashnaChart
  detectedCases?: string[]
  min?: number
  max?: number
  intent?: AstrologyKnowledgeIntent
}): RetrievedAstrologyPassage[] => {
  const boundedMin = Math.min(Math.max(min, 1), 10)
  const boundedMax = Math.min(Math.max(max, boundedMin), 10)
  const searchText = [
    query,
    intent ? INTENT_QUERY_EXPANSION[intent] : "",
    chartSearchText(chart, intent),
    detectedCases.join(" "),
  ].join(" ")
  const expandedSearchText = expandSemanticQuery(searchText)
  const normalizedSearch = normalizeText(expandedSearchText)
  const queryTokens = new Set(tokenize(expandedSearchText))
  const queryVector = vectorizeQuery(expandedSearchText)

  const scoredPassages = rag.chunks
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      sourceFile: chunk.sourceFile,
      sourceVolume: chunk.sourceVolume,
      section: `Chapter ${chunk.chapterNumber}: ${chunk.chapterTitle}`,
      citation: chunk.citation,
      chapterNumber: chunk.chapterNumber,
      chapterTitle: chunk.chapterTitle,
      text: chunk.text,
      keywords: chunk.keywords,
      score:
        cosineSimilarity(queryVector, chunk.vector) +
        keywordOverlapBoost(queryTokens, chunk) +
        specialCaseBoost(normalizedSearch, chunk) +
        topicRelevanceBoost(normalizedSearch, chunk) +
        genericDashaDominancePenalty(normalizedSearch, chunk) +
        exactTopicGatePenalty(normalizedSearch, chunk) +
        (intent
          ? Math.min(getAstrologyIntentEvidenceScore(intent, chunk) * 0.35, 1.4)
          : 0) +
        (intent && INTENT_PRIMARY_CHAPTERS[intent].has(chunk.chapterNumber)
          ? 1.2
          : 0),
      intentEvidence: getAstrologyIntentEvidenceScore(intent, chunk),
    }))
    .filter(
      (chunk) =>
        !intent ||
        (chunk.intentEvidence > 0 && INTENT_CHAPTERS[intent].has(chunk.chapterNumber))
    )
    .sort((left, right) => right.score - left.score)

  return selectDiverseAstrologyPassages(
    normalizedSearch,
    scoredPassages,
    boundedMax
  ).filter((passage, index) => index < boundedMin || passage.score > 0.08)
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
