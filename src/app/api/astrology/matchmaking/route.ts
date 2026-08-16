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
  getAstrologyBillingMetadata,
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

type DeepMatchScore = {
  name: string
  score: number
  max: number
  reason: string
  flags: string[]
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
    "Write in Roman Hindi/Hinglish using English alphabets only. Do not use Devanagari. Example style: 'yeh match sambhal kar aage badhne layak hai'. Keep common astrology words like kundli, guna, mangal, dasha, and upaay.",
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

const DUSTHANA_HOUSES = [6, 8, 12]
const KENDRA_HOUSES = [1, 4, 7, 10]
const TRIKONA_HOUSES = [1, 5, 9]
const MANGALIK_HOUSES = [1, 2, 4, 7, 8, 12]
const STRONG_MANGALIK_HOUSES = [7, 8]
const BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"]
const HARSH_RELATIONSHIP_PLANETS = ["Mars", "Saturn", "Rahu", "Ketu", "Sun"]

const getPlanet = (chart: PrashnaChart, name: string) =>
  chart.planets.find((planet) => planet.name === name)

const getHouse = (chart: PrashnaChart, houseNumber: number) =>
  chart.houses.find((house) => house.house === houseNumber)

const getHousePlanets = (chart: PrashnaChart, houseNumber: number) =>
  chart.planets.filter(
    (planet) => (planet.bhavaHouse || planet.house) === houseNumber
  )

const getAspectsToHouse = (chart: PrashnaChart, houseNumber: number) =>
  (chart.aspects || []).filter((aspect) => aspect.toHouse === houseNumber)

const getSignDistance = (fromSign: string, toSign: string) =>
  inclusiveDistance(signIndex(fromSign), signIndex(toSign), 12)

const getPlanetOwnedHouses = (chart: PrashnaChart, planetName: string) =>
  chart.houses
    .filter((house) => house.signLord === planetName)
    .map((house) => house.house)

const isKendraFromMoon = (chart: PrashnaChart, planet: ReturnType<typeof getPlanet>) => {
  const moon = getPlanet(chart, "Moon")

  return Boolean(
    moon &&
      planet &&
      KENDRA_HOUSES.includes(getSignDistance(moon.sign, planet.sign))
  )
}

const isFunctionalSupportPlanet = (chart: PrashnaChart, planetName: string) => {
  const ownedHouses = getPlanetOwnedHouses(chart, planetName)
  const ownsKendra = ownedHouses.some((house) => KENDRA_HOUSES.includes(house))
  const ownsTrikona = ownedHouses.some((house) => TRIKONA_HOUSES.includes(house))

  return ownsKendra && ownsTrikona
}

const getAspectsToPlanet = (chart: PrashnaChart, planet: ReturnType<typeof getPlanet>) =>
  planet
    ? (chart.aspects || []).filter(
        (aspect) => aspect.toHouse === (planet.bhavaHouse || planet.house)
      )
    : []

const getDebilityCancellationFactors = (
  chart: PrashnaChart,
  planet: ReturnType<typeof getPlanet>
) => {
  if (!planet || getPlanetDignity(planet) !== "debilitated") {
    return []
  }

  const signLord = getPlanet(chart, SIGN_LORDS[planet.sign])
  const factors = [
    signLord && KENDRA_HOUSES.includes(signLord.bhavaHouse || signLord.house)
      ? `${SIGN_LORDS[planet.sign]} lord of debilitation sign is in kendra from Lagna`
      : "",
    isKendraFromMoon(chart, signLord)
      ? `${SIGN_LORDS[planet.sign]} lord of debilitation sign is in kendra from Moon`
      : "",
    getAspectsToPlanet(chart, planet).some((aspect) =>
      BENEFICS.includes(aspect.fromPlanet)
    )
      ? `benefic drishti supports ${planet.name}`
      : "",
    getHousePlanets(chart, planet.bhavaHouse || planet.house).some((item) =>
      BENEFICS.includes(item.name)
    )
      ? `benefic association supports ${planet.name}`
      : "",
    planet.retrograde ? `${planet.name} is retrograde, requiring expert cancellation review` : "",
  ].filter(Boolean)

  return Array.from(new Set(factors))
}

const getRelationshipPressureWeight = (
  chart: PrashnaChart,
  planetName: string,
  placed = false
) => {
  if (isFunctionalSupportPlanet(chart, planetName)) {
    return placed ? 0.75 : 0.5
  }

  if (planetName === "Sun") {
    return 0.75
  }

  if (planetName === "Rahu" || planetName === "Ketu") {
    return placed ? 1.5 : 1.25
  }

  return placed ? 1.5 : 1
}

const getPlanetDignity = (planet: ReturnType<typeof getPlanet>) => {
  if (!planet) {
    return "unknown"
  }

  const ownSigns: Record<string, string[]> = {
    Sun: ["Leo"],
    Moon: ["Cancer"],
    Mars: ["Aries", "Scorpio"],
    Mercury: ["Gemini", "Virgo"],
    Jupiter: ["Sagittarius", "Pisces"],
    Venus: ["Taurus", "Libra"],
    Saturn: ["Capricorn", "Aquarius"],
  }
  const exaltationSigns: Record<string, string> = {
    Sun: "Aries",
    Moon: "Taurus",
    Mars: "Capricorn",
    Mercury: "Virgo",
    Jupiter: "Cancer",
    Venus: "Pisces",
    Saturn: "Libra",
  }
  const debilitationSigns: Record<string, string> = {
    Sun: "Libra",
    Moon: "Scorpio",
    Mars: "Cancer",
    Mercury: "Pisces",
    Jupiter: "Capricorn",
    Venus: "Virgo",
    Saturn: "Aries",
  }

  if (exaltationSigns[planet.name] === planet.sign) {
    return "exalted"
  }

  if ((ownSigns[planet.name] || []).includes(planet.sign)) {
    return "own"
  }

  if (debilitationSigns[planet.name] === planet.sign) {
    return "debilitated"
  }

  return "neutral"
}

const getMarsDistanceFromReference = ({
  chart,
  reference,
}: {
  chart: PrashnaChart
  reference: "Moon" | "Venus" | "Lagna"
}) => {
  const mars = getPlanet(chart, "Mars")

  if (!mars) {
    return null
  }

  if (reference === "Lagna") {
    return getSignDistance(chart.ascendant, mars.sign)
  }

  const referencePlanet = getPlanet(chart, reference)

  return referencePlanet ? getSignDistance(referencePlanet.sign, mars.sign) : null
}

const getManglikProfile = (chart: PrashnaChart, label: string) => {
  const mars = getPlanet(chart, "Mars")
  const references = (["Moon", "Venus", "Lagna"] as const)
    .map((reference) => ({
      reference,
      distance: getMarsDistanceFromReference({ chart, reference }),
    }))
    .filter(
      (item): item is { reference: "Moon" | "Venus" | "Lagna"; distance: number } =>
        typeof item.distance === "number"
    )
  const primaryHits = references.filter(
    (item) =>
      item.reference !== "Lagna" && MANGALIK_HOUSES.includes(item.distance)
  )
  const lagnaOnlyHit = references.some(
    (item) => item.reference === "Lagna" && MANGALIK_HOUSES.includes(item.distance)
  )
  const strongestHit = primaryHits.find((item) =>
    STRONG_MANGALIK_HOUSES.includes(item.distance)
  )
  const marsDignity = getPlanetDignity(mars)
  const cancellationFactors = [
    mars && ["own", "exalted"].includes(marsDignity)
      ? `Mars is ${marsDignity} in ${mars.sign}`
      : "",
    mars &&
    (chart.aspects || []).some(
      (aspect) =>
        aspect.fromPlanet === "Jupiter" &&
        aspect.toHouse === (mars.bhavaHouse || mars.house)
    )
      ? "Jupiter drishti protects Mars"
      : "",
    mars &&
    getHousePlanets(chart, mars.bhavaHouse || mars.house).some((planet) =>
      ["Jupiter", "Venus"].includes(planet.name)
    )
      ? "Benefic association softens Mars"
      : "",
  ].filter(Boolean)
  const severity =
    strongestHit
      ? cancellationFactors.length
        ? "medium"
        : "high"
      : primaryHits.length
        ? cancellationFactors.length
          ? "low"
          : "medium"
        : lagnaOnlyHit
          ? "low"
          : "none"

  return {
    label,
    severity,
    references,
    primary_hits: primaryHits,
    lagna_only_hit: lagnaOnlyHit && primaryHits.length === 0,
    cancellation_factors: cancellationFactors,
    reason:
      primaryHits.length > 0
        ? `${label}: Mars is in Manglik-sensitive distance from ${primaryHits
            .map((item) => `${item.reference} (${item.distance})`)
            .join(", ")}. Lagna is noted only as secondary support, not as the deciding factor.`
        : lagnaOnlyHit
          ? `${label}: Mars is sensitive only from Lagna; Moon/Venus do not confirm strong Manglik pressure.`
          : `${label}: No Manglik pressure from Moon or Venus by the deterministic check.`,
  }
}

const buildRelationshipAxisScore = (chart: PrashnaChart, label: string): DeepMatchScore => {
  const seventhHouse = getHouse(chart, 7)
  const seventhLord = seventhHouse?.signLord ? getPlanet(chart, seventhHouse.signLord) : undefined
  const seventhPlanets = getHousePlanets(chart, 7)
  const seventhAspects = getAspectsToHouse(chart, 7)
  const seventhLordAspects = getAspectsToPlanet(chart, seventhLord)
  const seventhLordCancellation = getDebilityCancellationFactors(chart, seventhLord)
  const seventhLordSupport = [
    ...seventhLordCancellation,
    ...seventhLordAspects
      .filter((aspect) => BENEFICS.includes(aspect.fromPlanet))
      .map((aspect) => `${aspect.fromPlanet} drishti protects 7th lord ${seventhLord?.name}`),
    seventhLord &&
    getHousePlanets(chart, seventhLord.bhavaHouse || seventhLord.house).some((planet) =>
      BENEFICS.includes(planet.name)
    )
      ? `benefic association protects 7th lord ${seventhLord.name}`
      : "",
  ].filter(Boolean)
  const flags: string[] = []
  const supports: string[] = []
  let score = 7

  if (seventhLord) {
    const dignity = getPlanetDignity(seventhLord)
    if (["own", "exalted"].includes(dignity)) score += 2
    if (dignity === "debilitated") {
      score -= seventhLordCancellation.length ? 1 : 3
      if (seventhLordCancellation.length) {
        supports.push(
          `${label}: 7th lord ${seventhLord.name} is debilitated but has cancellation/support: ${seventhLordCancellation.join("; ")}`
        )
      } else {
        flags.push(`${label}: 7th lord ${seventhLord.name} is debilitated without clear cancellation`)
      }
    }
    if (DUSTHANA_HOUSES.includes(seventhLord.bhavaHouse || seventhLord.house)) {
      score -= seventhLordSupport.length ? 1 : 2
      if (seventhLordSupport.length) {
        supports.push(
          `${label}: 7th lord ${seventhLord.name} is in dusthana house ${
            seventhLord.bhavaHouse || seventhLord.house
          } but protected by ${seventhLordSupport.join("; ")}`
        )
      } else {
        flags.push(`${label}: 7th lord ${seventhLord.name} is in dusthana house ${seventhLord.bhavaHouse || seventhLord.house}`)
      }
    }
  }

  const harshPlaced = seventhPlanets.filter((planet) =>
    HARSH_RELATIONSHIP_PLANETS.includes(planet.name)
  )
  const beneficPlaced = seventhPlanets.filter((planet) =>
    BENEFICS.includes(planet.name)
  )
  const harshAspects = seventhAspects.filter((aspect) =>
    HARSH_RELATIONSHIP_PLANETS.includes(aspect.fromPlanet)
  )
  const beneficAspects = seventhAspects.filter((aspect) =>
    BENEFICS.includes(aspect.fromPlanet)
  )

  const pressureWeight =
    harshPlaced.reduce(
      (total, planet) => total + getRelationshipPressureWeight(chart, planet.name, true),
      0
    ) +
    harshAspects.reduce(
      (total, aspect) =>
        total + getRelationshipPressureWeight(chart, aspect.fromPlanet),
      0
    )

  score += Math.min(beneficPlaced.length + beneficAspects.length + seventhLordSupport.length, 4)
  score -= Math.min(pressureWeight, 4)

  if (harshPlaced.length && pressureWeight >= 2.5) {
    flags.push(`${label}: ${harshPlaced.map((planet) => planet.name).join(", ")} placed in 7th house`)
  }
  if (harshAspects.length && pressureWeight >= 2.5) {
    flags.push(`${label}: 7th house receives drishti from ${harshAspects.map((aspect) => aspect.fromPlanet).join(", ")}`)
  }
  if (beneficPlaced.length || beneficAspects.length || seventhLordSupport.length) {
    supports.push(
      `${label}: support to marriage axis from ${[
        ...beneficPlaced.map((planet) => `${planet.name} placed`),
        ...beneficAspects.map((aspect) => `${aspect.fromPlanet} drishti`),
        ...seventhLordSupport,
      ].join("; ")}`
    )
  }

  return {
    name: `${label} 7th house/lord`,
    score: Math.max(0, Math.min(12, score)),
    max: 12,
    reason: `${label}: 7th house is ${seventhHouse?.sign || "unknown"}, lord ${seventhHouse?.signLord || "unknown"}${
      seventhLord ? ` placed in house ${seventhLord.bhavaHouse || seventhLord.house}` : ""
    }. Planets in 7th: ${seventhPlanets.map((planet) => planet.name).join(", ") || "none"}. Drishti to 7th: ${seventhAspects.map((aspect) => aspect.fromPlanet).join(", ") || "none"}. ${supports.join(" ")}`,
    flags,
  }
}

const buildVenusJupiterScore = (girl: PrashnaChart, boy: PrashnaChart): DeepMatchScore => {
  const girlJupiter = getPlanet(girl, "Jupiter")
  const girlVenus = getPlanet(girl, "Venus")
  const boyJupiter = getPlanet(boy, "Jupiter")
  const boyVenus = getPlanet(boy, "Venus")
  const flags: string[] = []
  let score = 8

  ;[
    ["Girl Jupiter", girlJupiter],
    ["Girl Venus", girlVenus],
    ["Boy Jupiter", boyJupiter],
    ["Boy Venus", boyVenus],
  ].forEach(([name, planet]) => {
    const planetName = String(name || "Planet")
    const safePlanet = planet || undefined
    const dignity = getPlanetDignity(safePlanet as ReturnType<typeof getPlanet>)
    const cancellation = getDebilityCancellationFactors(
      planetName.startsWith("Girl") ? girl : boy,
      safePlanet as ReturnType<typeof getPlanet>
    )
    if (["own", "exalted"].includes(dignity)) score += 1
    if (dignity === "debilitated") {
      score -= cancellation.length ? 0.5 : 2
      if (!cancellation.length) {
        flags.push(`${planetName} is debilitated without clear cancellation`)
      }
    }
    if (safePlanet && DUSTHANA_HOUSES.includes((safePlanet as any).bhavaHouse || (safePlanet as any).house)) {
      score -= 1
      flags.push(`${planetName} is in dusthana house ${(safePlanet as any).bhavaHouse || (safePlanet as any).house}`)
    }
  })

  return {
    name: "Venus-Jupiter marriage support",
    score: Math.max(0, Math.min(10, score)),
    max: 10,
    reason: `Girl Venus ${girlVenus?.sign || "unknown"} H${girlVenus?.bhavaHouse || girlVenus?.house || "-"}, Girl Jupiter ${girlJupiter?.sign || "unknown"} H${girlJupiter?.bhavaHouse || girlJupiter?.house || "-"}; Boy Venus ${boyVenus?.sign || "unknown"} H${boyVenus?.bhavaHouse || boyVenus?.house || "-"}, Boy Jupiter ${boyJupiter?.sign || "unknown"} H${boyJupiter?.bhavaHouse || boyJupiter?.house || "-"}.`,
    flags,
  }
}

const scoreSingleHouse = (chart: PrashnaChart, houseNumber: number) => {
  const house = getHouse(chart, houseNumber)
  const lord = house?.signLord ? getPlanet(chart, house.signLord) : undefined
  const placed = getHousePlanets(chart, houseNumber)
  const aspects = getAspectsToHouse(chart, houseNumber)
  const lordAspects = getAspectsToPlanet(chart, lord)
  const lordCancellation = getDebilityCancellationFactors(chart, lord)
  let score = 5
  const basis: string[] = []
  const flags: string[] = []

  if (lord) {
    const dignity = getPlanetDignity(lord)
    if (["own", "exalted"].includes(dignity)) score += 1.5
    if (dignity === "debilitated") {
      score -= lordCancellation.length ? 0.5 : 2
      if (!lordCancellation.length) {
        flags.push(`H${houseNumber} lord ${lord.name} debilitated`)
      }
    }
    if (DUSTHANA_HOUSES.includes(lord.bhavaHouse || lord.house)) {
      score -= lordAspects.some((aspect) => BENEFICS.includes(aspect.fromPlanet))
        ? 0.5
        : 1.5
    }
    basis.push(
      `H${houseNumber} lord ${lord.name} in H${lord.bhavaHouse || lord.house}, ${dignity}${
        lordCancellation.length ? `, cancellation: ${lordCancellation.join("; ")}` : ""
      }`
    )
  }

  placed.forEach((planet) => {
    if (BENEFICS.includes(planet.name)) score += 0.75
    if (HARSH_RELATIONSHIP_PLANETS.includes(planet.name)) {
      const weight = getRelationshipPressureWeight(chart, planet.name, true)
      score -= Math.min(weight, 1.25)
      if (weight >= 1.25) flags.push(`${planet.name} placed in H${houseNumber}`)
    }
  })

  aspects.forEach((aspect) => {
    if (BENEFICS.includes(aspect.fromPlanet)) score += 0.5
    if (HARSH_RELATIONSHIP_PLANETS.includes(aspect.fromPlanet)) {
      const weight = getRelationshipPressureWeight(chart, aspect.fromPlanet)
      score -= Math.min(weight, 1)
      if (weight >= 1.25) flags.push(`${aspect.fromPlanet} aspects H${houseNumber}`)
    }
  })

  basis.push(
    `placed ${placed.map((planet) => planet.name).join(", ") || "none"}; drishti ${
      aspects.map((aspect) => aspect.fromPlanet).join(", ") || "none"
    }`
  )

  return {
    score: Math.max(0, Math.min(8, score)),
    max: 8,
    basis: basis.join("; "),
    flags,
  }
}

const buildHouseClusterScore = ({
  girl,
  boy,
  name,
  houses,
}: {
  girl: PrashnaChart
  boy: PrashnaChart
  name: string
  houses: number[]
}): DeepMatchScore => {
  const girlScores = houses.map((house) => scoreSingleHouse(girl, house))
  const boyScores = houses.map((house) => scoreSingleHouse(boy, house))
  const score = Number(
    [...girlScores, ...boyScores].reduce((total, item) => total + item.score, 0).toFixed(1)
  )
  const max = [...girlScores, ...boyScores].reduce((total, item) => total + item.max, 0)
  const flags = [...girlScores, ...boyScores].flatMap((item) => item.flags)

  return {
    name,
    score: Math.max(0, Math.min(max, score)),
    max,
    reason: [
      `Girl: ${girlScores.map((item, index) => `H${houses[index]} ${item.basis}`).join(" | ")}`,
      `Boy: ${boyScores.map((item, index) => `H${houses[index]} ${item.basis}`).join(" | ")}`,
    ].join(" || "),
    flags: flags.slice(0, 4),
  }
}

const buildManglikBalanceScore = (girl: PrashnaChart, boy: PrashnaChart): DeepMatchScore => {
  const girlManglik = getManglikProfile(girl, "Girl")
  const boyManglik = getManglikProfile(boy, "Boy")
  const severityRank: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 }
  const difference = Math.abs(
    severityRank[girlManglik.severity] - severityRank[boyManglik.severity]
  )
  const baseScore = difference === 0 ? 12 : difference === 1 ? 8 : difference === 2 ? 4 : 1
  const flags = [girlManglik, boyManglik]
    .filter((item) => ["medium", "high"].includes(item.severity))
    .map((item) => item.reason)

  return {
    name: "Manglik balance from Moon/Venus",
    score: Math.max(0, Math.min(12, baseScore)),
    max: 12,
    reason: `${girlManglik.reason} ${girlManglik.cancellation_factors.length ? `Cancellation/support: ${girlManglik.cancellation_factors.join("; ")}.` : ""} ${boyManglik.reason} ${boyManglik.cancellation_factors.length ? `Cancellation/support: ${boyManglik.cancellation_factors.join("; ")}.` : ""}`,
    flags,
  }
}

const buildLagnaMoonSynergyScore = (girl: PrashnaChart, boy: PrashnaChart): DeepMatchScore => {
  const lagnaDistance = getSignDistance(girl.ascendant, boy.ascendant)
  const moonDistance = getSignDistance(girl.moonSign, boy.moonSign)
  const flags: string[] = []
  let score = 6

  if ([1, 5, 7, 9, 11].includes(lagnaDistance)) score += 2
  if ([6, 8, 12].includes(lagnaDistance)) {
    score -= 2
    flags.push(`Lagna distance is ${lagnaDistance}, requiring adjustment in daily temperament`)
  }
  if ([1, 5, 7, 9, 11].includes(moonDistance)) score += 2
  if ([6, 8, 12].includes(moonDistance)) {
    score -= 3
    flags.push(`Moon distance is ${moonDistance}, emotional rhythm may need conscious handling`)
  }

  return {
    name: "Lagna-Moon temperament synergy",
    score: Math.max(0, Math.min(10, score)),
    max: 10,
    reason: `Lagna distance girl-to-boy ${lagnaDistance}; Moon sign distance girl-to-boy ${moonDistance}.`,
    flags,
  }
}

const buildDashaMarriageReadinessScore = (girl: PrashnaChart, boy: PrashnaChart): DeepMatchScore => {
  const flags: string[] = []
  let score = 6
  ;[
    ["Girl", girl],
    ["Boy", boy],
  ].forEach(([label, chart]) => {
    const dashaLords = [
      (chart as PrashnaChart).dasha?.mahadasha?.lord,
      (chart as PrashnaChart).dasha?.antardasha?.lord,
      (chart as PrashnaChart).dasha?.pratyantar?.lord,
    ].filter(Boolean) as string[]
    const seventhLord = getHouse(chart as PrashnaChart, 7)?.signLord
    const supportive = dashaLords.some((lord) =>
      [seventhLord, "Venus", "Jupiter", "Moon"].includes(lord)
    )
    const pressure = dashaLords.some((lord) =>
      ["Mars", "Saturn", "Rahu", "Ketu"].includes(lord)
    )

    if (supportive) score += 1
    if (pressure) {
      score -= 1
      flags.push(`${label}: current dasha has pressure lord ${dashaLords.join("/")}`)
    }
  })

  return {
    name: "Current dasha marriage readiness",
    score: Math.max(0, Math.min(8, score)),
    max: 8,
    reason: `Girl active dasha ${girl.dasha ? `${girl.dasha.mahadasha.lord}/${girl.dasha.antardasha.lord}/${girl.dasha.pratyantar.lord}` : "unavailable"}; Boy active dasha ${boy.dasha ? `${boy.dasha.mahadasha.lord}/${boy.dasha.antardasha.lord}/${boy.dasha.pratyantar.lord}` : "unavailable"}.`,
    flags,
  }
}

const buildDeepMatchScores = (girl: PrashnaChart, boy: PrashnaChart) => {
  const deepScores = [
    buildRelationshipAxisScore(girl, "Girl"),
    buildRelationshipAxisScore(boy, "Boy"),
    buildHouseClusterScore({
      girl,
      boy,
      name: "Family continuity and domestic support",
      houses: [2, 4],
    }),
    buildHouseClusterScore({
      girl,
      boy,
      name: "Romance, children and emotional creativity",
      houses: [5],
    }),
    buildHouseClusterScore({
      girl,
      boy,
      name: "Intimacy, longevity and shared transformation",
      houses: [8],
    }),
    buildHouseClusterScore({
      girl,
      boy,
      name: "Dharma, values and family guidance",
      houses: [9],
    }),
    buildHouseClusterScore({
      girl,
      boy,
      name: "Communication, effort and conflict handling",
      houses: [3, 6],
    }),
    buildManglikBalanceScore(girl, boy),
    buildVenusJupiterScore(girl, boy),
    buildLagnaMoonSynergyScore(girl, boy),
    buildDashaMarriageReadinessScore(girl, boy),
  ]
  const total = Number(
    deepScores.reduce((sum, score) => sum + score.score, 0).toFixed(1)
  )
  const max = deepScores.reduce((sum, score) => sum + score.max, 0)
  const redFlags = deepScores
    .filter((score) => score.score / score.max < 0.52)
    .flatMap((score) => score.flags)
  const caseRegistry = [
    ...deepScores.flatMap((score) =>
      score.flags.map((flag) => ({
        case_name: score.name,
        status: score.score / score.max < 0.45 ? "strong concern" : "watch",
        chart_basis: flag,
      }))
    ),
  ]

  return {
    scores: deepScores,
    total,
    max,
    red_flags: redFlags,
    case_registry: caseRegistry,
  }
}

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
  const gunaTotal = Number(scores.reduce((sum, score) => sum + score.score, 0).toFixed(1))
  const deepCompatibility = buildDeepMatchScores(girl, boy)
  const total = Number((gunaTotal + deepCompatibility.total).toFixed(1))
  const max = 36 + deepCompatibility.max
  const percentage = Math.round((total / max) * 100)
  const strongRedFlags = deepCompatibility.red_flags.length
  const deterministicRecommendation =
    (gunaTotal < 16 && strongRedFlags >= 4) || percentage < 45
      ? "avoid"
      : strongRedFlags >= 3 || percentage < 66
        ? "caution"
        : "go"

  return {
    scores,
    deep_scores: deepCompatibility.scores,
    case_registry: deepCompatibility.case_registry,
    red_flags: deepCompatibility.red_flags,
    ashtakoota_total: gunaTotal,
    ashtakoota_max: 36,
    deep_total: deepCompatibility.total,
    deep_max: deepCompatibility.max,
    total,
    max,
    percentage,
    deterministicRecommendation,
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
    "Use only the calculated chart data, deterministic Ashtakoota score, and deterministic deep relationship audit below. Do not change chart facts or invent missing placements.",
    "The final judgment must not be based only on guna. Use Nadi, Bhakoot, Manglik/Mars sensitivity from Moon and Venus, 7th house/lord, family houses 2/4, romance and children house 5, intimacy/shared vulnerability house 8, dharma/value house 9, communication/conflict houses 3/6, Venus, Jupiter, Moon, Saturn, Rahu/Ketu, drishti, and dasha readiness.",
    "Use the retrieved classical reference pack below for marriage judgment. Do not quote it verbatim.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Follow calculation-first discipline: if a compatibility issue is partial or has cancellation, explain the support and weakness plainly.",
    "Give a clear marriage suitability percentage. Use the deterministic percentage unless a chart red flag justifies a small cautious adjustment, and explain it.",
    "Recommendation must be one of: go, caution, avoid.",
    "Avoid is only for severe combined failure. If deterministicRecommendation is caution, write a constructive caution reading with support/cancellation factors; do not downgrade to avoid.",
    "Do not guarantee marriage outcomes. Keep the answer realistic, respectful, and useful for families.",
    "Consider Moon sign/nakshatra, lagna, 7th house, 7th lord, Venus, Jupiter, Mars/Manglik sensitivity, Rahu/Ketu, Saturn pressure, current dasha, drishti, and the Ashtakoota breakdown.",
    "Never claim Manglik dosha from Lagna alone. Moon and Venus confirmation must drive Manglik severity; Lagna may be mentioned only as secondary support.",
    "Only mention special cases that are present in deterministic case_registry or directly proven from the chart data. Do not invent Kaal Sarp, Manglik, Nadi, Bhakoot, Shakata, Gajakesari, or other cases.",
    "When a planet is debilitated but the deterministic audit shows cancellation/support, call it mitigated rather than raw failure.",
    "Never use fatalistic BPHS wording such as premature death, guaranteed divorce, guaranteed discord, or certain harm. Convert classical risk language into practical family discussion points and expert-review advice.",
    "Strengths must include real support factors from the deterministic deep audit, not only Nadi/Gana.",
    "The reading must clearly cover: overall verdict, Ashtakoota meaning, deep 7th-house marriage promise, Moon/Venus-based Manglik balance, family/value compatibility, dasha readiness, special cases actually present, practical remedies, and whether expert review is needed.",
    "If no major special case is proven, say that no major special-case blocker is strongly proven instead of leaving the section vague.",
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

const normalizeAnalysis = (parsed: any, fallbackPercentage: number, fallbackRecommendation: string) => {
  const rawRecommendation = ["go", "caution", "avoid"].includes(parsed?.recommendation)
    ? parsed.recommendation
    : fallbackRecommendation
  const recommendationRank: Record<string, number> = { go: 2, caution: 1, avoid: 0 }
  const maxDrop =
    fallbackRecommendation === "go"
      ? "caution"
      : fallbackRecommendation === "caution"
        ? "caution"
        : "avoid"
  const recommendation =
    recommendationRank[rawRecommendation] < recommendationRank[maxDrop]
      ? maxDrop
      : rawRecommendation
  const rawPercentage =
    typeof parsed?.percentage_suggestion === "number"
      ? Math.min(100, Math.max(0, Math.round(parsed.percentage_suggestion)))
      : fallbackPercentage
  const percentage = Math.min(
    100,
    Math.max(0, Math.max(fallbackPercentage - 5, Math.min(fallbackPercentage + 5, rawPercentage)))
  )

  return {
    summary: sanitizeString(parsed?.summary, 900),
    recommendation,
    percentage_suggestion: percentage,
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
  }
}

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
  const compatibilityFlags = [
    ...compatibility.scores
      .filter((score) => score.score < score.max)
      .map((score) => `${score.name}: ${score.reason}`),
    ...compatibility.deep_scores
      .filter((score) => score.score < score.max)
      .map((score) => `${score.name}: ${score.reason}`),
    ...compatibility.red_flags,
  ]
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
    await recordAiUsage({
      tool: "astrology_matchmaking",
      input: {
        girl: girl.profile,
        boy: boy.profile,
        language,
      },
      response: {
        message: "Matchmaking AI generation failed.",
        error: gemini.error || "generation_failed",
        retryable: true,
      },
      metadata: {
        customer_email: customer.email,
        usage_units: 0,
        billable: false,
        failed_ai_generation: true,
        ...getAstrologyBillingMetadata(access),
      },
      model: gemini.model,
      ...gemini.usage,
      provider: gemini.provider,
      attempts: gemini.attempts,
      attempt_logs: gemini.attempt_logs,
      expert_recommended: true,
      tags: ["failed_ai_generation", "retryable"],
    })

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
      usage_units: 1,
      ...getAstrologyBillingMetadata(access),
      compatibility,
      panchangSystems: {
        girl: girl.chart.panchangSystem,
        boy: boy.chart.panchangSystem,
      },
      knowledge_references: getKnowledgeIds(knowledgePassages),
    },
    model: gemini.model,
    ...gemini.usage,
    provider: gemini.provider,
    attempts: gemini.attempts,
    attempt_logs: gemini.attempt_logs,
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
