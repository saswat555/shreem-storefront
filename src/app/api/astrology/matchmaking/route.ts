import { NextRequest, NextResponse } from "next/server"

import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import {
  SIGN_LORDS,
  getCityById,
  type PrashnaChart,
} from "@lib/util/astrology"
import {
  formatAstrologyKnowledgeForPrompt,
  getKnowledgeIds,
  retrieveAstrologyKnowledge,
  type RetrievedAstrologyPassage,
} from "@lib/util/astrology-knowledge"
import {
  checkAstrologyAccess,
  consumeChargeableAstrologyCredit,
  isAstrologyAccessBlocked,
} from "@lib/util/ai-quota"
import { generateGeminiJson } from "@lib/util/gemini"
import { buildDetailedPrashnaChart } from "@lib/util/vedic-astrology"
import { isGeminiEnabled } from "@lib/util/prakriti-config"

export const runtime = "nodejs"
export const maxDuration = 180

type MatchPersonPayload = {
  name?: unknown
  birthDate?: unknown
  birthTime?: unknown
  cityId?: unknown
  panchangSystemId?: unknown
}

type MatchmakingPayload = {
  girl?: MatchPersonPayload
  boy?: MatchPersonPayload
  language?: unknown
}

type KootaScore = {
  name: string
  score: number
  max: number
  reason: string
}

const MATCHMAKING_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    recommendation: {
      type: "string",
      enum: ["go", "caution", "avoid"],
    },
    percentage_suggestion: { type: "number" },
    decision_reason: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    concerns: {
      type: "array",
      items: { type: "string" },
    },
    family_discussion_points: {
      type: "array",
      items: { type: "string" },
    },
    marriage_timing_note: { type: "string" },
    remedies: {
      type: "array",
      items: { type: "string" },
    },
    book_citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          citation: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["citation", "relevance"],
      },
    },
    expert_call_recommended: { type: "boolean" },
    expert_call_reason: { type: "string" },
  },
  required: [
    "summary",
    "recommendation",
    "percentage_suggestion",
    "decision_reason",
    "strengths",
    "concerns",
    "family_discussion_points",
    "marriage_timing_note",
    "remedies",
    "book_citations",
    "expert_call_recommended",
    "expert_call_reason",
  ],
} as const

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
]

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
]

const NAKSHATRA_META: Record<
  string,
  { gana: "Deva" | "Manushya" | "Rakshasa"; nadi: "Adi" | "Madhya" | "Antya"; yoni: string }
> = {
  Ashwini: { gana: "Deva", nadi: "Adi", yoni: "Horse" },
  Bharani: { gana: "Manushya", nadi: "Madhya", yoni: "Elephant" },
  Krittika: { gana: "Rakshasa", nadi: "Antya", yoni: "Sheep" },
  Rohini: { gana: "Manushya", nadi: "Antya", yoni: "Serpent" },
  Mrigashira: { gana: "Deva", nadi: "Madhya", yoni: "Serpent" },
  Ardra: { gana: "Manushya", nadi: "Adi", yoni: "Dog" },
  Punarvasu: { gana: "Deva", nadi: "Adi", yoni: "Cat" },
  Pushya: { gana: "Deva", nadi: "Madhya", yoni: "Sheep" },
  Ashlesha: { gana: "Rakshasa", nadi: "Antya", yoni: "Cat" },
  Magha: { gana: "Rakshasa", nadi: "Antya", yoni: "Rat" },
  "Purva Phalguni": { gana: "Manushya", nadi: "Madhya", yoni: "Rat" },
  "Uttara Phalguni": { gana: "Manushya", nadi: "Adi", yoni: "Cow" },
  Hasta: { gana: "Deva", nadi: "Adi", yoni: "Buffalo" },
  Chitra: { gana: "Rakshasa", nadi: "Madhya", yoni: "Tiger" },
  Swati: { gana: "Deva", nadi: "Antya", yoni: "Buffalo" },
  Vishakha: { gana: "Rakshasa", nadi: "Antya", yoni: "Tiger" },
  Anuradha: { gana: "Deva", nadi: "Madhya", yoni: "Deer" },
  Jyeshtha: { gana: "Rakshasa", nadi: "Adi", yoni: "Deer" },
  Mula: { gana: "Rakshasa", nadi: "Adi", yoni: "Dog" },
  "Purva Ashadha": { gana: "Manushya", nadi: "Madhya", yoni: "Monkey" },
  "Uttara Ashadha": { gana: "Manushya", nadi: "Antya", yoni: "Mongoose" },
  Shravana: { gana: "Deva", nadi: "Antya", yoni: "Monkey" },
  Dhanishta: { gana: "Rakshasa", nadi: "Madhya", yoni: "Lion" },
  Shatabhisha: { gana: "Rakshasa", nadi: "Adi", yoni: "Horse" },
  "Purva Bhadrapada": { gana: "Manushya", nadi: "Adi", yoni: "Lion" },
  "Uttara Bhadrapada": { gana: "Manushya", nadi: "Madhya", yoni: "Cow" },
  Revati: { gana: "Deva", nadi: "Antya", yoni: "Elephant" },
}

const SIGN_VARNA: Record<string, string> = {
  Aries: "Kshatriya",
  Leo: "Kshatriya",
  Sagittarius: "Kshatriya",
  Taurus: "Vaishya",
  Virgo: "Vaishya",
  Capricorn: "Vaishya",
  Gemini: "Shudra",
  Libra: "Shudra",
  Aquarius: "Shudra",
  Cancer: "Brahmin",
  Scorpio: "Brahmin",
  Pisces: "Brahmin",
}

const VARNA_RANK: Record<string, number> = {
  Shudra: 1,
  Vaishya: 2,
  Kshatriya: 3,
  Brahmin: 4,
}

const SIGN_VASHYA: Record<string, string> = {
  Aries: "Chatushpada",
  Taurus: "Chatushpada",
  Gemini: "Manav",
  Cancer: "Jalchar",
  Leo: "Vanchar",
  Virgo: "Manav",
  Libra: "Manav",
  Scorpio: "Keet",
  Sagittarius: "Chatushpada",
  Capricorn: "Chatushpada",
  Aquarius: "Manav",
  Pisces: "Jalchar",
}

const PLANET_FRIENDS: Record<string, string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
}

const PLANET_ENEMIES: Record<string, string[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
}

const YONI_ENEMY_PAIRS = new Set([
  "Cow:Tiger",
  "Tiger:Cow",
  "Elephant:Lion",
  "Lion:Elephant",
  "Horse:Buffalo",
  "Buffalo:Horse",
  "Serpent:Mongoose",
  "Mongoose:Serpent",
  "Cat:Rat",
  "Rat:Cat",
  "Dog:Deer",
  "Deer:Dog",
  "Monkey:Sheep",
  "Sheep:Monkey",
])

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write in polished English.",
  hindi:
    "Write in natural Hindi using Devanagari, keeping astrology terms understandable.",
  hinglish:
    "Write in friendly Hinglish with common astrology words like kundli, guna, mangal, dasha, and upaay.",
}

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const sanitizeStringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number
) =>
  Array.isArray(value)
    ? value
        .map((item) => sanitizeString(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : []

const sanitizeBookCitations = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item: any) => ({
          citation: sanitizeString(item?.citation, 240),
          relevance: sanitizeString(item?.relevance, 320),
        }))
        .filter((item) => item.citation && item.relevance)
        .slice(0, 8)
    : []

const parseBirthDateInput = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const indianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!indianDate) {
    return null
  }

  const [, day, month, year] = indianDate

  return `${year}-${month}-${day}`
}

const getLocalBirthDate = ({
  birthDate,
  birthTime,
  offsetHours,
}: {
  birthDate: string
  birthTime: string
  offsetHours: number
}) => {
  const normalizedDate = parseBirthDateInput(birthDate)

  if (!normalizedDate) {
    return null
  }

  const [year, month, day] = normalizedDate.split("-").map(Number)
  const [hours, minutes] = birthTime.split(":").map(Number)
  const utcMs =
    Date.UTC(year, month - 1, day, hours, minutes || 0) -
    offsetHours * 60 * 60 * 1000

  return new Date(utcMs)
}

const buildPersonChart = (payload: MatchPersonPayload | undefined) => {
  const name = sanitizeString(payload?.name, 120)
  const birthDate = sanitizeString(payload?.birthDate, 20)
  const birthTime = sanitizeString(payload?.birthTime, 20)
  const city = getCityById(sanitizeString(payload?.cityId, 80))
  const panchangSystemId = sanitizeString(payload?.panchangSystemId, 40)
  const normalizedBirthDate = parseBirthDateInput(birthDate)

  if (!name || !normalizedBirthDate || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return null
  }

  const date = getLocalBirthDate({
    birthDate: normalizedBirthDate,
    birthTime,
    offsetHours: city.utcOffsetHours,
  })

  if (!date) {
    return null
  }

  return {
    profile: {
      name,
      birth_date: birthDate,
      birth_time: birthTime,
      city: `${city.name}, ${city.region}`,
      panchang_system_id: panchangSystemId,
    },
    chart: buildDetailedPrashnaChart({ city, date, panchangSystemId }),
  }
}

const nakshatraIndex = (name: string) => Math.max(NAKSHATRAS.indexOf(name), 0)
const signIndex = (name: string) => Math.max(SIGNS.indexOf(name), 0)

const inclusiveDistance = (fromIndex: number, toIndex: number, max: number) =>
  ((toIndex - fromIndex + max) % max) + 1

const getTaraScore = (girlNakshatra: string, boyNakshatra: string): KootaScore => {
  const girlToBoy = inclusiveDistance(
    nakshatraIndex(girlNakshatra),
    nakshatraIndex(boyNakshatra),
    27
  )
  const boyToGirl = inclusiveDistance(
    nakshatraIndex(boyNakshatra),
    nakshatraIndex(girlNakshatra),
    27
  )
  const isGood = (count: number) => ![3, 5, 7].includes(count % 9 || 9)
  const score = (isGood(girlToBoy) ? 1.5 : 0) + (isGood(boyToGirl) ? 1.5 : 0)

  return {
    name: "Tara",
    score,
    max: 3,
    reason: `Girl-to-boy tara count ${girlToBoy}, boy-to-girl tara count ${boyToGirl}.`,
  }
}

const getGanaScore = (girlGana: string, boyGana: string): KootaScore => {
  const key = `${girlGana}:${boyGana}`
  const scoreMap: Record<string, number> = {
    "Deva:Deva": 6,
    "Manushya:Manushya": 6,
    "Rakshasa:Rakshasa": 6,
    "Deva:Manushya": 5,
    "Manushya:Deva": 5,
    "Deva:Rakshasa": 1,
    "Rakshasa:Deva": 1,
    "Manushya:Rakshasa": 0,
    "Rakshasa:Manushya": 0,
  }

  return {
    name: "Gana",
    score: scoreMap[key] ?? 3,
    max: 6,
    reason: `Girl gana ${girlGana}, boy gana ${boyGana}.`,
  }
}

const getGrahaMaitriScore = (girlLord: string, boyLord: string): KootaScore => {
  const friendly =
    girlLord === boyLord ||
    (PLANET_FRIENDS[girlLord] || []).includes(boyLord) ||
    (PLANET_FRIENDS[boyLord] || []).includes(girlLord)
  const enemy =
    (PLANET_ENEMIES[girlLord] || []).includes(boyLord) ||
    (PLANET_ENEMIES[boyLord] || []).includes(girlLord)
  const score = friendly ? 5 : enemy ? 0 : 3

  return {
    name: "Graha Maitri",
    score,
    max: 5,
    reason: `Moon sign lords are ${girlLord} and ${boyLord}.`,
  }
}

const getCompatibilityScores = (girl: PrashnaChart, boy: PrashnaChart) => {
  const girlMeta = NAKSHATRA_META[girl.nakshatra]
  const boyMeta = NAKSHATRA_META[boy.nakshatra]
  const girlSignIndex = signIndex(girl.moonSign)
  const boySignIndex = signIndex(boy.moonSign)
  const girlToBoySign = inclusiveDistance(girlSignIndex, boySignIndex, 12)
  const boyToGirlSign = inclusiveDistance(boySignIndex, girlSignIndex, 12)
  const girlLord = SIGN_LORDS[girl.moonSign]
  const boyLord = SIGN_LORDS[boy.moonSign]
  const girlVarna = SIGN_VARNA[girl.moonSign]
  const boyVarna = SIGN_VARNA[boy.moonSign]
  const girlVashya = SIGN_VASHYA[girl.moonSign]
  const boyVashya = SIGN_VASHYA[boy.moonSign]
  const yoniPair = `${girlMeta?.yoni}:${boyMeta?.yoni}`

  const scores: KootaScore[] = [
    {
      name: "Varna",
      score: VARNA_RANK[boyVarna] >= VARNA_RANK[girlVarna] ? 1 : 0,
      max: 1,
      reason: `Girl varna ${girlVarna}, boy varna ${boyVarna}.`,
    },
    {
      name: "Vashya",
      score: girlVashya === boyVashya ? 2 : girlVashya === "Manav" || boyVashya === "Manav" ? 1 : 0.5,
      max: 2,
      reason: `Moon signs map to ${girlVashya} and ${boyVashya}.`,
    },
    getTaraScore(girl.nakshatra, boy.nakshatra),
    {
      name: "Yoni",
      score:
        girlMeta?.yoni === boyMeta?.yoni
          ? 4
          : YONI_ENEMY_PAIRS.has(yoniPair)
          ? 0
          : 2.5,
      max: 4,
      reason: `Yoni factors are ${girlMeta?.yoni || "unknown"} and ${boyMeta?.yoni || "unknown"}.`,
    },
    getGrahaMaitriScore(girlLord, boyLord),
    getGanaScore(girlMeta?.gana || "Manushya", boyMeta?.gana || "Manushya"),
    {
      name: "Bhakoot",
      score: ["2:12", "12:2", "5:9", "9:5", "6:8", "8:6"].includes(
        `${girlToBoySign}:${boyToGirlSign}`
      )
        ? 0
        : 7,
      max: 7,
      reason: `Moon sign distance is ${girlToBoySign}/${boyToGirlSign}.`,
    },
    {
      name: "Nadi",
      score: girlMeta?.nadi && boyMeta?.nadi && girlMeta.nadi !== boyMeta.nadi ? 8 : 0,
      max: 8,
      reason: `Nadi factors are ${girlMeta?.nadi || "unknown"} and ${boyMeta?.nadi || "unknown"}.`,
    },
  ]
  const total = Number(scores.reduce((sum, score) => sum + score.score, 0).toFixed(1))
  const percentage = Math.round((total / 36) * 100)

  return {
    scores,
    total,
    max: 36,
    percentage,
    deterministicRecommendation:
      total >= 26 ? "go" : total >= 18 ? "caution" : "avoid",
  }
}

const buildPrompt = ({
  girl,
  boy,
  compatibility,
  language,
  knowledgePassages,
}: {
  girl: NonNullable<ReturnType<typeof buildPersonChart>>
  boy: NonNullable<ReturnType<typeof buildPersonChart>>
  compatibility: ReturnType<typeof getCompatibilityScores>
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  [
    "You are Shreem Astrology's Kundli matchmaking assistant.",
    "Use only the calculated chart data and deterministic Ashtakoota-style score below. Do not change chart facts or invent missing placements.",
    "Use the retrieved classical reference pack below for marriage judgment, especially Nadi, Bhakoot, Manglik/Mars sensitivity, 7th house, Venus, Moon, Saturn, Rahu/Ketu, and dasha. Do not quote it verbatim.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Follow calculation-first discipline: if a compatibility issue is partial or has cancellation, explain the support and weakness plainly.",
    "Give a clear marriage suitability percentage. Use the deterministic percentage unless a chart red flag justifies a small cautious adjustment, and explain it.",
    "Recommendation must be one of: go, caution, avoid.",
    "Do not guarantee marriage outcomes. Keep the answer realistic, respectful, and useful for families.",
    "Consider Moon sign/nakshatra, lagna, 7th house, Venus, Mars/Manglik sensitivity, Rahu/Ketu, Saturn pressure, current dasha, and the Ashtakoota breakdown.",
    "If Nadi, Bhakoot, Manglik, severe 7th house, Venus/Mars, Saturn/Rahu/Ketu, health, or family concerns appear, recommend an expert call with Sanjay Kumar Pandey before final decision.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only.",
    `Retrieved classical reference pack: ${formatAstrologyKnowledgeForPrompt(
      knowledgePassages
    )}`,
    `Girl: ${JSON.stringify({
      profile: girl.profile,
      lagna: girl.chart.ascendant,
      moon_sign: girl.chart.moonSign,
      moon_nakshatra: `${girl.chart.nakshatra} pada ${girl.chart.nakshatraPada}`,
      dasha: girl.chart.dasha,
      planets: girl.chart.planets.map((planet) => ({
        name: planet.name,
        sign: planet.sign,
        house: planet.house,
        degree: planet.signDegree,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        retrograde: Boolean(planet.retrograde),
      })),
      houses: girl.chart.houses,
    })}`,
    `Boy: ${JSON.stringify({
      profile: boy.profile,
      lagna: boy.chart.ascendant,
      moon_sign: boy.chart.moonSign,
      moon_nakshatra: `${boy.chart.nakshatra} pada ${boy.chart.nakshatraPada}`,
      dasha: boy.chart.dasha,
      planets: boy.chart.planets.map((planet) => ({
        name: planet.name,
        sign: planet.sign,
        house: planet.house,
        degree: planet.signDegree,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        retrograde: Boolean(planet.retrograde),
      })),
      houses: boy.chart.houses,
    })}`,
    `Compatibility score: ${JSON.stringify(compatibility)}`,
  ].join("\n")

const normalizeAnalysis = (parsed: any, fallbackPercentage: number, fallbackRecommendation: string) => ({
  summary: sanitizeString(parsed?.summary, 900),
  recommendation: ["go", "caution", "avoid"].includes(parsed?.recommendation)
    ? parsed.recommendation
    : fallbackRecommendation,
  percentage_suggestion:
    typeof parsed?.percentage_suggestion === "number"
      ? Math.min(100, Math.max(0, Math.round(parsed.percentage_suggestion)))
      : fallbackPercentage,
  decision_reason: sanitizeString(parsed?.decision_reason, 900),
  strengths: sanitizeStringArray(parsed?.strengths, 8, 240),
  concerns: sanitizeStringArray(parsed?.concerns, 8, 240),
  family_discussion_points: sanitizeStringArray(
    parsed?.family_discussion_points,
    8,
    240
  ),
  marriage_timing_note: sanitizeString(parsed?.marriage_timing_note, 700),
  remedies: sanitizeStringArray(parsed?.remedies, 8, 240),
  book_citations: sanitizeBookCitations(parsed?.book_citations),
  expert_call_recommended: Boolean(parsed?.expert_call_recommended),
  expert_call_reason: sanitizeString(parsed?.expert_call_reason, 600),
})

export async function POST(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to generate Kundli matchmaking." },
      { status: 401 }
    )
  }

  const payload = (await request.json().catch(() => null)) as
    | MatchmakingPayload
    | null

  if (!payload) {
    return NextResponse.json(
      { message: "We could not read the matchmaking request." },
      { status: 400 }
    )
  }

  const girl = buildPersonChart(payload.girl)
  const boy = buildPersonChart(payload.boy)
  const rawLanguage = sanitizeString(payload.language, 20)
  const language =
    rawLanguage === "hindi" || rawLanguage === "hinglish"
      ? rawLanguage
      : "english"

  if (!girl || !boy) {
    return NextResponse.json(
      {
        message:
          "Add valid names, birth dates, birth times, and cities for both people.",
      },
      { status: 400 }
    )
  }

  const compatibility = getCompatibilityScores(girl.chart, boy.chart)
  const compatibilityFlags = compatibility.scores
    .filter((score) => score.score < score.max)
    .map((score) => `${score.name}: ${score.reason}`)
  const knowledgePassages = retrieveAstrologyKnowledge({
    query: [
      "kundli matchmaking marriage compatibility ashtakoota nadi bhakoot manglik",
      compatibilityFlags.join(" "),
      `girl ${girl.chart.ascendant} lagna ${girl.chart.moonSign} moon ${girl.chart.nakshatra}`,
      `boy ${boy.chart.ascendant} lagna ${boy.chart.moonSign} moon ${boy.chart.nakshatra}`,
      girl.chart.planets
        .map((planet) => `${planet.name} ${planet.sign} house ${planet.house}`)
        .join(" "),
      boy.chart.planets
        .map((planet) => `${planet.name} ${planet.sign} house ${planet.house}`)
        .join(" "),
    ].join(" "),
    chart: girl.chart,
    detectedCases: compatibilityFlags,
    min: 3,
    max: 7,
  })
  const baseResult = {
    girl: {
      profile: girl.profile,
      chart: girl.chart,
    },
    boy: {
      profile: boy.profile,
      chart: boy.chart,
    },
    compatibility,
  }

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        ...baseResult,
        analysis: normalizeAnalysis(
          {
            summary: "AI interpretation is not enabled on this server yet.",
            decision_reason:
              "The deterministic compatibility score has been calculated, but the LLM reading is unavailable.",
            expert_call_recommended: true,
            expert_call_reason:
              "Expert review is recommended before final marriage decisions.",
          },
          compatibility.percentage,
          compatibility.deterministicRecommendation
        ),
      },
      { status: 503 }
    )
  }

  const access = await checkAstrologyAccess()

  if (isAstrologyAccessBlocked(access)) {
    return NextResponse.json(
      {
        ...baseResult,
        message:
          `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
      },
      { status: 429 }
    )
  }

  const gemini = await generateGeminiJson({
    prompt: buildPrompt({
      girl,
      boy,
      compatibility,
      language,
      knowledgePassages,
    }),
    responseSchema: MATCHMAKING_SCHEMA,
    temperature: 0.2,
    label: "Matchmaking API",
  })

  if (!gemini.ok) {
    return NextResponse.json(
      {
        ...baseResult,
        message:
          "Matchmaking AI could not generate the interpretation right now. The calculated score is still shown.",
        retryable: true,
        analysis: normalizeAnalysis(
          {
            summary:
              "The charts were calculated, but AI interpretation could not be completed.",
            decision_reason:
              "Use the deterministic score as a first-pass indicator and consult Sanjay Kumar Pandey before deciding.",
            expert_call_recommended: true,
            expert_call_reason:
              "Marriage matching should be reviewed by an expert when AI interpretation is unavailable.",
          },
          compatibility.percentage,
          compatibility.deterministicRecommendation
        ),
      },
      { status: 502 }
    )
  }

  const parsed = gemini.parsed
  const analysis = normalizeAnalysis(
    parsed,
    compatibility.percentage,
    compatibility.deterministicRecommendation
  )
  const result = {
    ...baseResult,
    analysis,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    model: gemini.model,
  }
  const usage = await recordAiUsage({
    tool: "astrology_matchmaking",
    input: {
      girl: girl.profile,
      boy: boy.profile,
      language,
    },
    response: result,
    metadata: {
      customer_email: customer.email,
      compatibility,
      panchangSystems: {
        girl: girl.chart.panchangSystem,
        boy: boy.chart.panchangSystem,
      },
      knowledge_references: getKnowledgeIds(knowledgePassages),
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended: analysis.expert_call_recommended,
  })
  const credit = await consumeChargeableAstrologyCredit({
    access,
    tool: "astrology_matchmaking",
    usageId: usage.synced ? usage.usage?.id : undefined,
  })

  return NextResponse.json({
    ...result,
    usage_synced: usage.synced,
    credit,
    wallet: "wallet" in credit ? credit.wallet : access.wallet,
    quota: access.quota,
  })
}
