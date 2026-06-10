/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const artifact = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "bphs-rag.json"), "utf8"))
const utilSource = fs.readFileSync(path.join(ROOT, "src/lib/util/astrology-knowledge.ts"), "utf8")
const routeSource = fs.readFileSync(path.join(ROOT, "src/app/api/astrology/kundli/route.ts"), "utf8")

const STOP_WORDS = new Set([
  "about","after","again","also","among","and","are","because","been","being","bhava","brihat","can","chapter","could","from","grah","graha","has","have","his","hora","into","its","lord","may","not","parashara","rasi","said","shall","should","that","the","their","then","there","these","this","through","thus","when","where","which","while","will","with","would",
])

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value) =>
  normalize(value).split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const semanticExpansions = [
  [/personality|temperament|nature|mind|emotion|liking|habit|identity|confidence/, "lagna ascendant moon chandra sun surya first house mind temperament nature character mental disposition"],
  [/career|profession|work|job|business|status|authority|success/, "tenth house karma career profession saturn sun mercury jupiter authority status livelihood work"],
  [/money|wealth|income|saving|finance|profit|loss/, "second house eleventh house dhana labha wealth income gains venus jupiter mercury saturn"],
  [/marriage|relationship|spouse|partner|match|compatibility/, "seventh house venus jupiter mars mangal marriage spouse yoni gana nadi bhakoot relationship"],
  [/children|education|intelligence|study|creativity|mantra/, "fifth house putra vidya intelligence mantra purva punya jupiter mercury children education"],
  [/health|disease|illness|pain|body|injury|accident|surgery|major incident/, "sixth house eighth house twelfth house ari randhra vyaya disease injury accident arishta mars saturn rahu ketu"],
  [/dasha|period|timing|event|incident|phase|mahadasha|antardasha/, "vimshottari dasha mahadasha antardasha pratyantar period result timing phala bhukti"],
  [/remedy|pooja|puja|mantra|daan|stone|gem|upay|peace/, "upaya shanti mantra daan graha remedy worship deity vrata seva gemstone caution"],
]

const expandQuery = (query) => {
  const n = normalize(query)
  const extra = semanticExpansions.filter(([pattern]) => pattern.test(n)).map(([, expansion]) => expansion)
  return extra.length ? `${query} ${extra.join(" ")}` : query
}

const hashToken = (token) => {
  let hash = 2166136261
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const vectorize = (query) => {
  const vectorSize = artifact.vectorizer.vectorSize
  const counts = new Map()
  const vector = new Array(vectorSize).fill(0)

  for (const token of tokenize(query)) {
    counts.set(token, (counts.get(token) || 0) + 1)
  }

  for (const [token, count] of counts.entries()) {
    const weight = (1 + Math.log(count)) * (artifact.idf[token] || 1)
    const hash = hashToken(token)
    const index = hash % vectorSize
    const sign = hash & 1 ? -1 : 1
    vector[index] += sign * weight
  }

  const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0))
  return magnitude ? vector.map((item) => item / magnitude) : vector
}

const cosine = (a, b) => a.reduce((sum, item, index) => sum + item * (b[index] || 0), 0)

const keywordOverlapBoost = (queryTokens, chunk) => {
  const overlap = (chunk.keywords || []).reduce(
    (score, keyword) => (queryTokens.has(normalize(keyword)) ? score + 1 : score),
    0
  )
  return Math.min(overlap * 0.035, 0.28)
}

const specialCaseBoost = (normalizedQuery, chunk) => {
  const haystack = normalize(`${chunk.chapterTitle} ${(chunk.keywords || []).join(" ")} ${String(chunk.text || "").slice(0, 800)}`)
  const boosts = [
    [/budh|mercury|budhaditya|बुध|बुधादित्य/, ["budh", "mercury", "surya", "sun", "बुध", "सूर्य"], 0.18],
    [/sarpa|kaal|kalsarp|rahu|ketu|राहु|केतु|सर्प|काल/, ["sarpa", "rahu", "ketu", "राहु", "केतु", "सर्प"], 0.2],
    [/neech|neechabhanga|debilitat|cancellation|नीच|भंग/, ["debilitat", "cancellation", "exaltation", "kendra", "नीच", "भंग"], 0.22],
    [/gajakesari|gaja|jupiter|guru|गज|गुरु|बृहस्पति/, ["gaja", "jupiter", "guru", "गुरु", "बृहस्पति"], 0.18],
    [/manglik|mangal|mars|kuja|मंगल/, ["mangal", "mars", "मंगल"], 0.18],
    [/health|disease|illness|rog|ari|sixth|रोग|अरिष्ट|षष्ठ/, ["disease", "ari", "illness", "रोग", "अरिष्ट", "षष्ठ"], 0.22],
    [/accident|incident|injury|sudden|eighth|randhr|twelfth|दुर्घटना|मृत्यु|आयु|अष्टम/, ["accident", "injury", "randhr", "eighth", "दुर्घटना", "अरिष्ट", "मृत्यु", "अष्टम"], 0.24],
    [/marriage|match|nadi|bhakoot|yoni|gana|विवाह|नाड़ी/, ["marriage", "nadi", "bhakoot", "yoni", "विवाह", "नाड़ी"], 0.18],
    [/dasha|mahadasha|antardasha|pratyantar|दशा|महादशा|अन्तर्दशा/, ["dasha", "vimshottari", "दशा", "महादशा"], 0.22],
    [/remed|mantra|pooja|puja|gem|stone|daan|उपाय|मंत्र|पूजा|दान/, ["remed", "mantra", "graha", "उपाय", "मंत्र", "दान"], 0.18],
    [/personality|temperament|nature|mind|emotion|लग्न|चन्द्र/, ["lagna", "moon", "chandra", "first", "mind", "लग्न", "चन्द्र"], 0.16],
    [/career|profession|karma|income|wealth|धन|कर्म/, ["karma", "tenth", "profession", "wealth", "dhana", "कर्म", "धन"], 0.16],
    [/children|education|intelligence|fifth|putra|विद्या|पुत्र/, ["fifth", "putra", "vidya", "jupiter", "विद्या", "पुत्र"], 0.14],
  ]

  return boosts.reduce((score, [pattern, terms, boost]) => {
    if (!pattern.test(normalizedQuery)) return score
    return terms.some((term) => haystack.includes(normalize(term))) ? score + boost : score
  }, 0)
}

const topicRelevanceBoost = (normalizedQuery, chunk) => {
  const haystack = normalize(`${chunk.chapterTitle} ${(chunk.keywords || []).join(" ")} ${String(chunk.text || "").slice(0, 1100)}`)

  const topicRules = [
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
    if (!rule.topic.test(normalizedQuery)) return score

    const mustHits = rule.must.filter((term) => haystack.includes(normalize(term))).length
    const shouldHits = rule.should.filter((term) => haystack.includes(normalize(term))).length

    if (!mustHits) return score

    return score + Math.min(rule.boost + mustHits * 0.035 + shouldHits * 0.018, 0.72)
  }, 0)
}

const topicEvidenceScore = (normalizedQuery, chunk) => {
  const haystack = normalize(`${chunk.chapterTitle} ${(chunk.keywords || []).join(" ")} ${String(chunk.text || "").slice(0, 1400)}`)

  const rules = [
    {
      topic: /career|profession|karma|tenth|10th|authority|livelihood|work|job|business|status|recognition|कर्म|दशम|पेशा|व्यवसाय/,
      evidence: ["tenth", "10th", "karma", "karm", "karm s lord", "profession", "livelihood", "work", "obstacles in work", "success in the desired ventures", "employment", "office", "authority", "governmental authority", "entrustment of governmental authority", "position", "status", "reputation", "name and fame", "raj yog", "राज", "कर्म", "दशम", "पेशा"],
    },
    {
      topic: /wealth|money|income|saving|finance|profit|gains|second|2nd|eleventh|11th|dhana|labha|धन|लाभ|आय|बचत/,
      evidence: ["second", "2nd", "eleventh", "11th", "dhana", "labha", "wealth", "money", "income", "gain of wealth", "gains", "profit", "grains", "cattle", "land", "property", "ornaments", "धन", "लाभ"],
    },
    {
      topic: /health|disease|illness|recovery|accident|injury|surgery|sixth|6th|eighth|8th|twelfth|12th|ari|randhra|vyaya|arishta|rog|रोग|अरिष्ट|दुर्घटना|अष्टम|षष्ठ/,
      evidence: ["sixth", "6th", "eighth", "8th", "twelfth", "12th", "ari", "randhr", "vyaya", "disease", "illness", "physical distress", "mental agony", "injury", "wounds", "accident", "fever", "heart disease", "headaches", "poison", "रोग", "अरिष्ट", "अष्टम", "षष्ठ"],
    },
    {
      topic: /marriage|relationship|spouse|partner|seventh|7th|public dealing|contracts|partnership|venus|विवाह|नाड़ी|भकूट/,
      evidence: ["seventh", "7th", "yuvati", "marriage", "wife", "spouse", "partner", "venus", "sukr", "relationship", "happiness from wife", "distress to wife", "विवाह"],
    },
  ]

  const matched = rules.find((rule) => rule.topic.test(normalizedQuery))
  if (!matched) return 1

  return matched.evidence.filter((term) => haystack.includes(normalize(term))).length
}

const exactTopicGatePenalty = (normalizedQuery, chunk) => {
  const isStrictLifeArea = /career|profession|karma|tenth|10th|wealth|money|income|second|2nd|eleventh|11th|health|disease|sixth|6th|eighth|8th|twelfth|12th|marriage|relationship|seventh|7th/.test(normalizedQuery)
  if (!isStrictLifeArea) return 0
  const evidence = topicEvidenceScore(normalizedQuery, chunk)
  const isCareerQuery = /career|profession|karma|tenth|10th|authority|livelihood|work|job|status|recognition|कर्म|दशम|पेशा/.test(normalizedQuery)
  if (evidence === 0) return isCareerQuery ? -1.8 : -1.25
  if (evidence === 1) return isCareerQuery ? -0.75 : -0.35
  return Math.min(evidence * 0.1, 0.4)
}

const genericDashaDominancePenalty = (normalizedQuery, chunk) => {
  const haystack = normalize(`${chunk.chapterTitle} ${(chunk.keywords || []).join(" ")} ${String(chunk.text || "").slice(0, 900)}`)

  const isLifeAreaQuery =
    /career|profession|karma|tenth|10th|wealth|money|income|second|2nd|eleventh|11th|health|disease|sixth|6th|eighth|8th|twelfth|12th|marriage|relationship|seventh|7th/.test(normalizedQuery)

  const isPureDashaChapter =
    /effects of .*dasha|antar dashas|dasha of/.test(haystack) || /dasha/.test(haystack)

  const hasLifeAreaSpecificEvidence =
    /tenth|10th|karma|profession|second|eleventh|dhana|labha|sixth|eighth|twelfth|ari|randhr|vyaya|seventh|yuvati|marriage|wife|spouse|career|wealth|disease|health/.test(haystack)

  if (isLifeAreaQuery && isPureDashaChapter && !hasLifeAreaSpecificEvidence) {
    return -0.45
  }

  return 0
}

const retrieve = (query, max = 8) => {
  const expanded = expandQuery(query)
  const queryTokens = new Set(tokenize(expanded))
  const queryVector = vectorize(expanded)
  const normalizedQuery = normalize(expanded)

  const scored = artifact.chunks
    .map((chunk) => {
      const score =
        cosine(queryVector, chunk.vector || []) +
        keywordOverlapBoost(queryTokens, chunk) +
        specialCaseBoost(normalizedQuery, chunk) +
        topicRelevanceBoost(normalizedQuery, chunk) +
        genericDashaDominancePenalty(normalizedQuery, chunk) +
        exactTopicGatePenalty(normalizedQuery, chunk)

      return {
        id: chunk.id,
        citation: chunk.citation,
        chapterNumber: chunk.chapterNumber,
        chapterTitle: chunk.chapterTitle,
        keywords: chunk.keywords || [],
        text: chunk.text || "",
        score,
      }
    })
    .sort((a, b) => b.score - a.score)

  const isLifeArea = /career|profession|karma|tenth|10th|wealth|money|income|second|2nd|eleventh|11th|health|disease|sixth|6th|eighth|8th|twelfth|12th|marriage|relationship|seventh|7th/.test(normalizedQuery)
  if (!isLifeArea) return scored.slice(0, max)

  const selected = []
  const chapters = new Map()
  for (const row of scored) {
    if (topicEvidenceScore(normalizedQuery, row) <= 0) continue
    const used = chapters.get(row.chapterNumber) || 0
    if (used >= 1) continue
    selected.push(row)
    chapters.set(row.chapterNumber, used + 1)
    if (selected.length >= max) return selected
  }

  for (const row of scored) {
    if (selected.some((x) => x.id === row.id)) continue
    const used = chapters.get(row.chapterNumber) || 0
    if (used >= 1) continue
    selected.push(row)
    chapters.set(row.chapterNumber, used + 1)
    if (selected.length >= max) break
  }

  return selected
}

const chartContext = `
Leo Lagna, Moon Virgo, Sun Libra 3rd debilitated, Venus Virgo debilitated with Bhava Chalit 1st,
Mercury Scorpio 4th retrograde, Mars Sagittarius 5th, Jupiter Aries 9th retrograde sandhi,
Saturn Aries 9th debilitated retrograde, Rahu Cancer 12th, Ketu Capricorn 6th.
Active Vimshottari: Rahu Mahadasha, Mercury Antardasha, Jupiter Pratyantar.
Detected cases: multiple neechabhanga cluster, shakata style Moon Jupiter distance, chandra mangal influence.
`

const scenarios = [
  { name: "Neechabhanga cluster", query: "Sun debilitated Libra, Venus debilitated Virgo, Saturn debilitated Aries, neechabhanga cancellation and rise after struggle", mustHaveAny: ["debilitat", "cancellation", "exalt", "kendra", "neecha", "bhanga", "नीच", "भंग"] },
  { name: "Rahu 12th and Ketu 6th", query: "Rahu in twelfth house Cancer, Ketu in sixth house Capricorn, foreign isolation sleep loss disease obstacles", mustHaveAny: ["rahu", "ketu", "twelfth", "vyaya", "sixth", "ari", "foreign", "loss", "disease", "राहु", "केतु"] },
  { name: "Career via 10th house", query: "Career profession success authority tenth house Taurus lord Venus debilitated Mercury aspect tenth house", mustHaveAny: ["tenth", "karma", "profession", "authority", "livelihood", "work", "ventures", "position", "status", "reputation", "governmental authority", "name and fame", "raj yog", "कर्म"] },
  { name: "Wealth via 2nd and 11th", query: "Money wealth income savings second house Virgo eleventh house Gemini Mercury gains dhana labha", mustHaveAny: ["wealth", "money", "second", "eleventh", "dhana", "labha", "income", "gains", "धन"] },
  { name: "Health via 6th 8th 12th", query: "Health disease recovery sixth house eighth house twelfth house Ketu Rahu arishta accident injury surgery", mustHaveAny: ["sixth", "eighth", "twelfth", "disease", "arishta", "injury", "accident", "ari", "randhra", "रोग", "अरिष्ट"] },
  { name: "Dasha timing Rahu Mercury Jupiter", query: "Vimshottari dasha Rahu Mahadasha Mercury Antardasha Jupiter Pratyantar timing results phala bhukti", mustHaveAny: ["dasha", "mahadasha", "antardasha", "bhukti", "vimshottari", "rahu", "mercury", "jupiter", "guru", "दशा"] },
  { name: "Marriage relationship", query: "Marriage spouse relationship seventh house Aquarius lord Saturn Venus aspect partnership public dealing", mustHaveAny: ["marriage", "spouse", "seventh", "relationship", "partner", "venus", "saturn", "विवाह"] },
  { name: "Moon Jupiter Shakata style", query: "Moon Jupiter distance fortune fluctuation confidence shakata yoga Moon in Virgo Jupiter in Aries", mustHaveAny: ["moon", "jupiter", "guru", "fortune", "mind", "confidence", "चन्द्र", "गुरु"] },
]

const genericBaseline = retrieve("general astrology reading personality success health wealth marriage dasha", 8).map((x) => x.id)

const jaccard = (a, b) => {
  const A = new Set(a)
  const B = new Set(b)
  const intersection = [...A].filter((x) => B.has(x)).length
  const union = new Set([...A, ...B]).size
  return union ? intersection / union : 0
}

const scoreScenario = (scenario, rows) => {
  const terms = scenario.mustHaveAny.map(normalize)
  let hitRows = 0
  const hitTerms = new Set()

  for (const row of rows) {
    const haystack = normalize(`${row.chapterTitle} ${row.keywords.join(" ")} ${row.text}`)
    const matched = terms.filter((term) => haystack.includes(term))
    if (matched.length) {
      hitRows += 1
      matched.forEach((term) => hitTerms.add(term))
    }
  }

  const topScore = rows[0]?.score || 0
  const hitRatio = hitRows / Math.max(rows.length, 1)
  const termCoverage = hitTerms.size / Math.max(terms.length, 1)

  let grade = "POOR"
  if (topScore >= 0.42 && hitRatio >= 0.5 && termCoverage >= 0.25) grade = "GOOD"
  else if (topScore >= 0.25 && hitRatio >= 0.35) grade = "OK"

  return { topScore, hitRows, hitRatio, termCoverage, grade, hitTerms: [...hitTerms] }
}

const results = scenarios.map((scenario) => {
  const rows = retrieve(`${scenario.query}\n${chartContext}`, 8)
  const quality = scoreScenario(scenario, rows)
  const overlapWithGeneric = jaccard(rows.map((x) => x.id), genericBaseline)

  return {
    scenario,
    rows,
    quality,
    overlapWithGeneric,
    genericRisk: overlapWithGeneric >= 0.5 ? "HIGH" : overlapWithGeneric >= 0.3 ? "MEDIUM" : "LOW",
  }
})

const averageTopScore = results.reduce((sum, item) => sum + item.quality.topScore, 0) / results.length
const goodCount = results.filter((item) => item.quality.grade === "GOOD").length
const okCount = results.filter((item) => item.quality.grade === "OK").length
const poorCount = results.filter((item) => item.quality.grade === "POOR").length
const highGenericRisk = results.filter((item) => item.genericRisk === "HIGH").length

let overall = "POOR"
if (goodCount >= 5 && poorCount <= 1 && highGenericRisk <= 2) overall = "GOOD"
else if (goodCount + okCount >= 5 && poorCount <= 3) overall = "OK"

const outDir = path.join("/tmp", `astrology-rag-audit-${new Date().toISOString().replace(/[:.]/g, "-")}`)
fs.mkdirSync(outDir, { recursive: true })

const md = []
md.push("# Astrology RAG Audit")
md.push("")
md.push(`Generated: ${new Date().toISOString()}`)
md.push("")
md.push(`## Overall grade: ${overall}`)
md.push("")
md.push(`- Chunks: ${artifact.chunks.length}`)
md.push(`- Vectorizer: ${artifact.vectorizer.kind}, size ${artifact.vectorizer.vectorSize}`)
md.push(`- Average top score: ${averageTopScore.toFixed(4)}`)
md.push(`- Good / OK / Poor: ${goodCount} / ${okCount} / ${poorCount}`)
md.push(`- High generic-overlap scenarios: ${highGenericRisk}`)
md.push("")
md.push("## Production source checks")
md.push("")
md.push(`- ${utilSource.includes("topicRelevanceBoost(normalizedSearch, chunk)") ? "✅" : "❌"} current util has topicRelevanceBoost in score`)
md.push(`- ${utilSource.includes("genericDashaDominancePenalty(normalizedSearch, chunk)") ? "✅" : "❌"} current util has genericDashaDominancePenalty in score`)
md.push(`- ${routeSource.includes("career_pack") ? "✅" : "❌"} current Kundli route has career_pack`)
md.push(`- ${!routeSource.includes("Kundli focused question Gemini") ? "✅" : "❌"} current Kundli route has no focused-question Gemini label`)
md.push("")
md.push("## Scenario results")
md.push("")
md.push("| Scenario | Grade | Top score | Hit rows | Term coverage | Generic risk | Top citation |")
md.push("|---|---:|---:|---:|---:|---:|---|")
for (const item of results) {
  md.push(`| ${item.scenario.name} | ${item.quality.grade} | ${item.quality.topScore.toFixed(4)} | ${item.quality.hitRows}/8 | ${(item.quality.termCoverage * 100).toFixed(0)}% | ${item.genericRisk} | ${item.rows[0]?.citation || "-"} |`)
}

md.push("")
md.push("## Detailed top 3")
for (const item of results) {
  md.push("")
  md.push(`### ${item.scenario.name}`)
  md.push("")
  md.push(`Grade: ${item.quality.grade}; Generic overlap: ${(item.overlapWithGeneric * 100).toFixed(0)}% (${item.genericRisk})`)
  item.rows.slice(0, 3).forEach((row, index) => {
    md.push(`${index + 1}. score=${row.score.toFixed(4)} · ${row.citation}`)
    md.push(`   ${row.chapterTitle}`)
    md.push(`   ${String(row.text || "").replace(/\s+/g, " ").slice(0, 320)}`)
  })
}

const mdPath = path.join(outDir, "rag-audit.md")
const jsonPath = path.join(outDir, "rag-audit.json")
fs.writeFileSync(mdPath, md.join("\n"))
fs.writeFileSync(jsonPath, JSON.stringify({
  overall,
  summary: { averageTopScore, goodCount, okCount, poorCount, highGenericRisk },
  sourceChecks: {
    topicRelevanceBoost: utilSource.includes("topicRelevanceBoost(normalizedSearch, chunk)"),
    genericPenalty: utilSource.includes("genericDashaDominancePenalty(normalizedSearch, chunk)"),
    careerPack: routeSource.includes("career_pack"),
    noFocusedQuestionGeminiLabel: !routeSource.includes("Kundli focused question Gemini"),
  },
  results: results.map((item) => ({
    scenario: item.scenario.name,
    grade: item.quality.grade,
    topScore: item.quality.topScore,
    hitRows: item.quality.hitRows,
    termCoverage: item.quality.termCoverage,
    genericRisk: item.genericRisk,
    top: item.rows.slice(0, 8).map((row) => ({
      id: row.id,
      citation: row.citation,
      score: row.score,
      chapterTitle: row.chapterTitle,
      keywords: row.keywords.slice(0, 16),
      excerpt: row.text.slice(0, 800),
    })),
  })),
}, null, 2))

console.log("\n=== ASTROLOGY RAG AUDIT SUMMARY ===")
console.log(`Overall grade: ${overall}`)
console.log(`Average top score: ${averageTopScore.toFixed(4)}`)
console.log(`Good / OK / Poor: ${goodCount} / ${okCount} / ${poorCount}`)
console.log(`High generic-overlap scenarios: ${highGenericRisk}`)
console.log("\n=== SOURCE CHECKS ===")
console.log("topicRelevanceBoost in util:", utilSource.includes("topicRelevanceBoost(normalizedSearch, chunk)"))
console.log("genericDashaDominancePenalty in util:", utilSource.includes("genericDashaDominancePenalty(normalizedSearch, chunk)"))
console.log("career_pack in route:", routeSource.includes("career_pack"))
console.log("no focused Gemini label:", !routeSource.includes("Kundli focused question Gemini"))
console.log("\n=== SCENARIO TABLE ===")
console.table(results.map((item) => ({
  scenario: item.scenario.name,
  grade: item.quality.grade,
  topScore: Number(item.quality.topScore.toFixed(4)),
  hitRows: `${item.quality.hitRows}/8`,
  termCoverage: `${(item.quality.termCoverage * 100).toFixed(0)}%`,
  genericRisk: item.genericRisk,
  topCitation: item.rows[0]?.citation || "-",
})))
console.log("\nReport files:")
console.log(mdPath)
console.log(jsonPath)

try {
  require("child_process").execSync(`echo ${JSON.stringify(mdPath)} | pbcopy`)
  console.log("\nMarkdown report path copied to clipboard.")
} catch {}
