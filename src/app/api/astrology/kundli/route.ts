import { NextRequest, NextResponse } from "next/server"

import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import {
  HOUSE_THEMES,
  SIGN_LORDS,
  getCityById,
  type DashaPeriod,
  type PrashnaChart,
  type PrashnaPlanet,
} from "@lib/util/astrology"
import {
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

const KUNDLI_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    person_information: { type: "string" },
    temperament: { type: "string" },
    behavioral_traits: {
      type: "array",
      items: { type: "string" },
    },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    life_themes: {
      type: "array",
      items: { type: "string" },
    },
    career_direction: { type: "string" },
    relationship_pattern: { type: "string" },
    health_caution: { type: "string" },
    health_indicators: {
      type: "array",
      items: { type: "string" },
    },
    current_period_analysis: { type: "string" },
    dasha_predictions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          chart_basis: { type: "string" },
          classical_basis: { type: "string" },
          prediction: { type: "string" },
          action: { type: "string" },
        },
        required: [
          "period",
          "chart_basis",
          "classical_basis",
          "prediction",
          "action",
        ],
      },
    },
    risk_watch: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theme: { type: "string" },
          chart_basis: { type: "string" },
          dasha_trigger: { type: "string" },
          prevention: { type: "string" },
        },
        required: ["theme", "chart_basis", "dasha_trigger", "prevention"],
      },
    },
    prediction_table: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          chart_basis: { type: "string" },
          prediction: { type: "string" },
          advice: { type: "string" },
        },
        required: ["area", "chart_basis", "prediction", "advice"],
      },
    },
    special_case_readings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          case_name: { type: "string" },
          chart_basis: { type: "string" },
          classical_basis: { type: "string" },
          combined_effect: { type: "string" },
          timing: { type: "string" },
          solution: { type: "string" },
        },
        required: [
          "case_name",
          "chart_basis",
          "classical_basis",
          "combined_effect",
          "timing",
          "solution",
        ],
      },
    },
    planet_effects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          planet: { type: "string" },
          placement: { type: "string" },
          life_area: { type: "string" },
          activation_period: { type: "string" },
          effect: { type: "string" },
          likely_effect: { type: "string" },
          advice: { type: "string" },
        },
        required: [
          "planet",
          "placement",
          "life_area",
          "activation_period",
          "effect",
          "likely_effect",
          "advice",
        ],
      },
    },
    likely_challenges: {
      type: "array",
      items: { type: "string" },
    },
    issue_analysis: {
      type: "array",
      items: { type: "string" },
    },
    practical_solutions: {
      type: "array",
      items: { type: "string" },
    },
    spiritual_guidance: { type: "string" },
    sub_question_answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          chart_reason: { type: "string" },
        },
        required: ["question", "answer", "chart_reason"],
      },
    },
    special_cases: {
      type: "array",
      items: { type: "string" },
    },
    upaay: {
      type: "array",
      items: { type: "string" },
    },
    targeted_remedies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pain_point: { type: "string" },
          chart_basis: { type: "string" },
          mantra_or_pooja: { type: "string" },
          daily_practice: { type: "string" },
        },
        required: [
          "pain_point",
          "chart_basis",
          "mantra_or_pooja",
          "daily_practice",
        ],
      },
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
    "person_information",
    "temperament",
    "behavioral_traits",
    "strengths",
    "life_themes",
    "career_direction",
    "relationship_pattern",
    "health_caution",
    "health_indicators",
    "current_period_analysis",
    "dasha_predictions",
    "risk_watch",
    "prediction_table",
    "planet_effects",
    "special_case_readings",
    "likely_challenges",
    "issue_analysis",
    "practical_solutions",
    "spiritual_guidance",
    "sub_question_answers",
    "special_cases",
    "upaay",
    "targeted_remedies",
    "book_citations",
    "expert_call_recommended",
    "expert_call_reason",
  ],
} as const

const pickKundliSchema = (fields: readonly string[]) => ({
  type: "object",
  properties: fields.reduce<Record<string, unknown>>((selected, field) => {
    selected[field] =
      KUNDLI_SCHEMA.properties[
        field as keyof typeof KUNDLI_SCHEMA.properties
      ]

    return selected
  }, {}),
  required: fields,
})

const STANDARD_KUNDLI_FIELDS = [
  "summary",
  "person_information",
  "temperament",
  "behavioral_traits",
  "strengths",
  "life_themes",
  "career_direction",
  "relationship_pattern",
  "health_caution",
  "health_indicators",
  "current_period_analysis",
  "dasha_predictions",
  "prediction_table",
  "special_case_readings",
  "likely_challenges",
  "practical_solutions",
  "spiritual_guidance",
  "sub_question_answers",
  "targeted_remedies",
  "book_citations",
  "expert_call_recommended",
  "expert_call_reason",
] as const

const STANDARD_KUNDLI_SCHEMA = pickKundliSchema(STANDARD_KUNDLI_FIELDS)

type KundliPayload = {
  name?: unknown
  birthDate?: unknown
  birthTime?: unknown
  cityId?: unknown
  gender?: unknown
  language?: unknown
  panchangSystemId?: unknown
  subQuestions?: unknown
}

const GEMSTONES_BY_LORD: Record<
  string,
  { primary: string; alternatives: string[]; caution: string }
> = {
  Sun: {
    primary: "Ruby",
    alternatives: ["Manik"],
    caution: "Wear only after checking Sun strength and suitability.",
  },
  Moon: {
    primary: "Pearl",
    alternatives: ["Moti"],
    caution: "Best reviewed when emotional sensitivity or Moon affliction is present.",
  },
  Mars: {
    primary: "Red Coral",
    alternatives: ["Moonga"],
    caution: "Avoid casual use if Mars is highly aggressive or conflict-forming.",
  },
  Mercury: {
    primary: "Emerald",
    alternatives: ["Panna"],
    caution: "Check Mercury dignity and business/education relevance first.",
  },
  Jupiter: {
    primary: "Yellow Sapphire",
    alternatives: ["Pukhraj"],
    caution: "Confirm Jupiter strength, finances, and health suitability first.",
  },
  Venus: {
    primary: "Diamond",
    alternatives: ["Opal", "White Sapphire"],
    caution: "Confirm Venus suitability before luxury or relationship remedies.",
  },
  Saturn: {
    primary: "Blue Sapphire",
    alternatives: ["Amethyst", "Neelam"],
    caution: "Use strong caution; Saturn stones need expert review before wearing.",
  },
}

const HEALTH_TENDENCIES_BY_PLANET: Record<string, string> = {
  Sun: "heart vitality, eyes, blood-pressure heat, headaches, and pitta-type fatigue",
  Moon: "sleep quality, anxiety, fluid balance, digestion sensitivity, and emotional eating",
  Mars: "inflammation, feverish tendency, blood pressure spikes, injuries, cuts, burns, and accidents",
  Mercury: "nerves, skin, speech stress, allergies, respiratory sensitivity, and gut-brain imbalance",
  Jupiter: "liver, weight, sugar/metabolic balance, cholesterol tendency, and over-nourishment",
  Venus: "kidney, urinary, reproductive, hormonal, sugar cravings, and venous circulation sensitivity",
  Saturn: "bones, teeth, joints, chronic pain, stiffness, vata dryness, and slow recovery",
  Rahu: "toxins, allergies, anxiety loops, addictive habits, unusual symptoms, and sudden flare-ups",
  Ketu: "nerve pain, hidden inflammation, surgical indications, detachment from body signals, and sudden dips",
}

const PLANET_REMEDIES: Record<
  string,
  { mantra: string; practice: string; painPoint: string }
> = {
  Sun: {
    painPoint: "confidence, vitality, father/authority, and visibility pressure",
    mantra: "Offer water to Surya at sunrise and chant Om Suryaya Namah 108 times on Sundays.",
    practice: "Keep promises, wake early, respect fatherly figures, and donate wheat or jaggery when suitable.",
  },
  Moon: {
    painPoint: "sleep, anxiety, emotional steadiness, and mother/home comfort",
    mantra: "Do Shiva jal abhishek on Mondays and chant Om Som Somaya Namah 108 times.",
    practice: "Keep evening screen time low, support motherly figures, and donate rice or milk when suitable.",
  },
  Mars: {
    painPoint: "anger, conflict, inflammation, injury risk, and rushed decisions",
    mantra: "Read Hanuman Chalisa on Tuesdays and chant Om Angarakaya Namah 108 times.",
    practice: "Use disciplined exercise, avoid impulsive arguments, and donate red lentils when suitable.",
  },
  Mercury: {
    painPoint: "speech, overthinking, trade, study, skin/nerves, and decision clarity",
    mantra: "Chant Om Bum Budhaya Namah 108 times on Wednesdays and worship Vishnu or Ganesha.",
    practice: "Write decisions before acting, keep accounts clean, and donate green moong when suitable.",
  },
  Jupiter: {
    painPoint: "guidance, children, wisdom, digestion/metabolism, and dharmic judgment",
    mantra: "Chant Om Brim Brihaspataye Namah 108 times on Thursdays and honor Guru/Vishnu.",
    practice: "Study scripture, mentor someone, avoid excess sweets, and donate chana dal or turmeric.",
  },
  Venus: {
    painPoint: "relationship harmony, comfort, reproductive/urinary sensitivity, and indulgence",
    mantra: "Chant Om Shum Shukraya Namah 108 times on Fridays and worship Lakshmi-Narayana.",
    practice: "Practice cleanliness, artistic discipline, respectful partnership, and donate white sweets when suitable.",
  },
  Saturn: {
    painPoint: "delay, chronic stress, bones/joints, duty, debt, and fear",
    mantra: "Light a sesame-oil diya for Shani or Hanuman on Saturdays and chant Om Sham Shanicharaya Namah 108 times.",
    practice: "Serve workers, elders, or disabled people; keep strict sleep, debt, and work routines.",
  },
  Rahu: {
    painPoint: "obsession, anxiety loops, toxins, sudden reversals, foreign/unusual blocks",
    mantra: "Chant Om Rahave Namah 108 times on Saturdays and worship Durga or Bhairav with a sober mind.",
    practice: "Avoid intoxicants, misinformation, and shortcuts; donate dark sesame or blankets when suitable.",
  },
  Ketu: {
    painPoint: "detachment, hidden fear, nerve sensitivity, sudden breaks, and spiritual confusion",
    mantra: "Chant Om Ketave Namah 108 times on Tuesdays or Saturdays and offer prayers to Ganesha.",
    practice: "Simplify possessions, complete pending duties, feed stray dogs when appropriate, and maintain grounding routines.",
  },
}

const DEBILITATION_SIGNS: Record<string, string> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries",
}

const EXALTATION_SIGNS: Record<string, string> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
}

const TRINAL_HOUSES = [1, 5, 9]
const STONE_HOUSES = [1, 5, 9] as const
const KENDRA_HOUSES = [1, 4, 7, 10]
const DUSTHANA_HOUSES = [6, 8, 12]

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the complete reading in polished English.",
  hindi:
    "Write the complete reading in natural Hindi using Devanagari, keeping astrology terms understandable.",
  hinglish:
    "Write the complete reading in friendly Hinglish with common astrology words like lagna, rashi, dasha, upaay, and bhav.",
}

const clipCompleteText = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, " ").trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  const clipped = normalized.slice(0, maxLength)
  const sentenceEnd = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("!"),
    clipped.lastIndexOf("?"),
    clipped.lastIndexOf("।")
  )

  if (sentenceEnd > maxLength * 0.62) {
    return clipped.slice(0, sentenceEnd + 1).trim()
  }

  const lastSpace = clipped.lastIndexOf(" ")

  return (lastSpace > maxLength * 0.75 ? clipped.slice(0, lastSpace) : clipped)
    .trim()
}

const sanitizeString = (value: unknown, maxLength = 2400) =>
  typeof value === "string" ? clipCompleteText(value, maxLength) : ""

const compactPromptText = (value: unknown, maxLength = 680) =>
  sanitizeString(value, maxLength)

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
          relevance: sanitizeString(item?.relevance, 700),
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

const getPlanet = (chart: PrashnaChart, name: string) =>
  chart.planets.find((planet) => planet.name === name)

const getHouseDistance = (from: PrashnaPlanet, to: PrashnaPlanet) =>
  ((to.house - from.house + 12) % 12) + 1

const isKendraDistance = (distance: number) =>
  [1, 4, 7, 10].includes(distance)

const longitudeInArc = (start: number, end: number, value: number) => {
  const arc = (end - start + 360) % 360
  const distance = (value - start + 360) % 360

  return distance <= arc
}

type DetectedAstrologyCase = {
  key: string
  name: string
  category:
    | "yoga"
    | "dosha"
    | "dignity"
    | "cancellation"
    | "compound"
    | "health"
    | "dasha"
  status: "complete" | "partial" | "supportive" | "watch" | "compound"
  strength: "low" | "medium" | "high"
  subtype?: string
  planets: string[]
  houses: number[]
  chart_basis: string
  combined_effect: string
  retrieval_terms: string[]
  caution?: string
}

type MedicalWatchRule = {
  condition: string
  planets: string[]
  houses: number[]
  note: string
}

type MedicalWatchSignal = {
  condition: string
  severity: "low" | "medium" | "high"
  chart_basis: string
  dasha_trigger: string
  prevention: string
}

type CriticalPeriodAnalysis = {
  maraka_lords: string[]
  badhaka_house: number
  badhakesh: string
  active_triggers: string[]
  watch_periods: Array<{
    period: string
    lord: string
    role: string
    window: string
    caution: string
  }>
  medical_watchlist: MedicalWatchSignal[]
  safety_note: string
}

const KAAL_SARP_TYPES: Record<number, { name: string; theme: string }> = {
  1: { name: "Anant", theme: "identity, body, marriage and public dealings" },
  2: { name: "Kulik", theme: "family speech, finance, food and longevity fears" },
  3: { name: "Vasuki", theme: "courage, siblings, effort, dharma and fortune" },
  4: { name: "Shankhpal", theme: "home, mother, property, status and career" },
  5: { name: "Padma", theme: "education, children, creativity, gains and networks" },
  6: { name: "Mahapadma", theme: "disease, debts, disputes, loss and isolation" },
  7: { name: "Takshak", theme: "partnership, self-image and contractual pressure" },
  8: { name: "Karkotak", theme: "sudden change, inheritance, speech and family karma" },
  9: { name: "Shankhachur", theme: "fortune, father/guru, courage and belief" },
  10: { name: "Ghatak", theme: "career, authority, home and emotional security" },
  11: { name: "Vishdhar", theme: "income, friends, children and expectation pressure" },
  12: { name: "Sheshnag", theme: "sleep, foreign lands, expenses, disease and service" },
}

const formatDetectedCase = (detectedCase: DetectedAstrologyCase) =>
  [
    `${detectedCase.name}${detectedCase.subtype ? ` (${detectedCase.subtype})` : ""}`,
    `${detectedCase.status}, ${detectedCase.strength} strength`,
    detectedCase.chart_basis,
    detectedCase.combined_effect,
    detectedCase.caution ? `Caution: ${detectedCase.caution}` : "",
  ]
    .filter(Boolean)
    .join(". ")

const addDetectedCase = (
  cases: DetectedAstrologyCase[],
  detectedCase: DetectedAstrologyCase
) => {
  if (!cases.some((item) => item.key === detectedCase.key)) {
    cases.push(detectedCase)
  }
}

const getPlanetNames = (planets: Array<PrashnaPlanet | undefined>) =>
  planets.filter(Boolean).map((planet) => planet!.name)

const getCaseSearchTerms = (cases: DetectedAstrologyCase[]) =>
  cases.flatMap((detectedCase) => [
    detectedCase.name,
    detectedCase.subtype || "",
    detectedCase.category,
    detectedCase.chart_basis,
    detectedCase.combined_effect,
    ...detectedCase.retrieval_terms,
  ])

const detectKaalSarpCase = (chart: PrashnaChart) => {
  const rahu = getPlanet(chart, "Rahu")
  const ketu = getPlanet(chart, "Ketu")
  const classicalPlanets = chart.planets.filter(
    (planet) => !["Rahu", "Ketu"].includes(planet.name)
  )

  if (!rahu || !ketu || classicalPlanets.length < 7) {
    return null
  }

  const rahuToKetu = classicalPlanets.every((planet) =>
    longitudeInArc(rahu.longitude, ketu.longitude, planet.longitude)
  )
  const ketuToRahu = classicalPlanets.every((planet) =>
    longitudeInArc(ketu.longitude, rahu.longitude, planet.longitude)
  )
  const rahuToKetuOutside = classicalPlanets.filter(
    (planet) => !longitudeInArc(rahu.longitude, ketu.longitude, planet.longitude)
  )
  const ketuToRahuOutside = classicalPlanets.filter(
    (planet) => !longitudeInArc(ketu.longitude, rahu.longitude, planet.longitude)
  )
  const bestOutside =
    rahuToKetuOutside.length <= ketuToRahuOutside.length
      ? rahuToKetuOutside
      : ketuToRahuOutside
  const status =
    rahuToKetu || ketuToRahu
      ? "complete"
      : bestOutside.length <= 1
        ? "partial"
        : null

  if (!status) {
    return null
  }

  const subtype = KAAL_SARP_TYPES[rahu.house]
  const enclosedText =
    status === "complete"
      ? "all seven classical grahas are enclosed within the Rahu-Ketu axis"
      : `the Rahu-Ketu axis is near-complete; outside planets: ${bestOutside
          .map((planet) => planet.name)
          .join(", ")}`

  return {
    key: `kaal-sarp-${status}-${rahu.house}-${ketu.house}`,
    name: "Kaal Sarp pattern",
    category: "dosha",
    status,
    strength: status === "complete" ? "high" : "low",
    subtype: subtype
      ? `${subtype.name} type, Rahu in house ${rahu.house} and Ketu in house ${ketu.house}`
      : `Rahu house ${rahu.house} / Ketu house ${ketu.house}`,
    planets: ["Rahu", "Ketu", ...classicalPlanets.map((planet) => planet.name)],
    houses: [rahu.house, ketu.house],
    chart_basis: `${enclosedText}; Rahu is in house ${rahu.house}, Ketu is in house ${ketu.house}.`,
    combined_effect: subtype
      ? `Read the nodal pressure through ${subtype.theme}, then modify it by dasha, benefic protection, and any cancellation/supportive yogas.`
      : "Read the nodal pressure through the Rahu-Ketu house axis, then modify it by dasha and benefic protection.",
    retrieval_terms: [
      "kaal sarp",
      "rahu ketu axis",
      subtype?.name || "",
      "nodal pressure",
      "sudden reversals",
    ].filter(Boolean),
    caution:
      "Kaal Sarp is a later convention, so the reading must still be anchored in Rahu, Ketu, houses, strength, and dasha instead of fear.",
  } satisfies DetectedAstrologyCase
}

const getExaltationLordForSign = (sign: string) =>
  Object.entries(EXALTATION_SIGNS).find(([, exaltationSign]) => exaltationSign === sign)?.[0]

const isKendraFromMoon = (moon: PrashnaPlanet | undefined, planet: PrashnaPlanet) =>
  moon ? isKendraDistance(getHouseDistance(moon, planet)) : false

const getNeechabhangaCases = (chart: PrashnaChart) => {
  const moon = getPlanet(chart, "Moon")
  const cases: DetectedAstrologyCase[] = []

  chart.planets
    .filter((planet) => DEBILITATION_SIGNS[planet.name] === planet.sign)
    .forEach((planet) => {
      const signLordName = SIGN_LORDS[planet.sign]
      const signLord = getPlanet(chart, signLordName)
      const exaltationLordName = getExaltationLordForSign(planet.sign)
      const exaltationLord = exaltationLordName
        ? getPlanet(chart, exaltationLordName)
        : undefined
      const rules: string[] = []

      if (KENDRA_HOUSES.includes(planet.house)) {
        rules.push(`${planet.name} itself is in a kendra from Lagna`)
      }

      if (isKendraFromMoon(moon, planet)) {
        rules.push(`${planet.name} is in a kendra from Moon`)
      }

      if (signLord && KENDRA_HOUSES.includes(signLord.house)) {
        rules.push(`${signLord.name}, lord of ${planet.sign}, is in a kendra from Lagna`)
      }

      if (signLord && isKendraFromMoon(moon, signLord)) {
        rules.push(`${signLord.name}, lord of ${planet.sign}, is in a kendra from Moon`)
      }

      if (exaltationLord && KENDRA_HOUSES.includes(exaltationLord.house)) {
        rules.push(
          `${exaltationLord.name}, exaltation lord of ${planet.sign}, is in a kendra from Lagna`
        )
      }

      if (exaltationLord && isKendraFromMoon(moon, exaltationLord)) {
        rules.push(
          `${exaltationLord.name}, exaltation lord of ${planet.sign}, is in a kendra from Moon`
        )
      }

      if (
        signLord &&
        (signLord.sign === planet.sign ||
          Math.abs(getHouseDistance(planet, signLord) - 7) === 0)
      ) {
        rules.push(`${planet.name} is directly associated with ${signLord.name}, its dispositor`)
      }

      const strength =
        rules.length >= 3 ? "high" : rules.length >= 1 ? "medium" : "low"
      const status = rules.length ? "supportive" : "watch"

      cases.push({
        key: `neechabhanga-${planet.name.toLowerCase()}`,
        name: rules.length ? "Neechabhanga support" : "Debilitation watch",
        category: rules.length ? "cancellation" : "dignity",
        status,
        strength,
        subtype: `${planet.name} debilitated in ${planet.sign}`,
        planets: getPlanetNames([planet, signLord, exaltationLord]),
        houses: [planet.house, signLord?.house, exaltationLord?.house].filter(
          (house): house is number => typeof house === "number"
        ),
        chart_basis: `${planet.name} is debilitated in ${planet.sign}, house ${planet.house}.${
          rules.length ? ` Cancellation factors: ${rules.join("; ")}.` : ""
        }`,
        combined_effect: rules.length
          ? "The planet may begin with friction, insecurity, delay, or over-compensation, but can convert into maturity and visible rise when its dasha or supporting houses activate."
          : "Read this as a raw weak spot unless dasha, aspect, divisional charts, or human expert review shows support.",
        retrieval_terms: [
          "neechabhanga",
          "debilitation cancellation",
          planet.name,
          planet.sign,
          signLordName,
          exaltationLordName || "",
        ].filter(Boolean),
        caution:
          "Cancellation improves expression; it does not erase all weakness automatically.",
      })
    })

  if (cases.filter((item) => item.name === "Neechabhanga support").length >= 2) {
    const supported = cases.filter((item) => item.name === "Neechabhanga support")

    cases.push({
      key: "multiple-neechabhanga-cluster",
      name: "Multiple Neechabhanga cluster",
      category: "compound",
      status: "compound",
      strength: supported.some((item) => item.strength === "high")
        ? "high"
        : "medium",
      planets: supported.flatMap((item) => item.planets),
      houses: Array.from(new Set(supported.flatMap((item) => item.houses))),
      chart_basis: supported.map((item) => item.chart_basis).join(" | "),
      combined_effect:
        "Multiple cancellations should be read together: the native may feel repeated early pressure around the debilitated grahas, but the same areas can become engines of growth when dasha, work, discipline, and benefic support align.",
      retrieval_terms: [
        "multiple neechabhanga",
        "debilitation cancellation",
        "rise after struggle",
        ...supported.flatMap((item) => item.planets),
      ],
      caution:
        "Do not judge these as separate isolated placements; the shared houses, dasha lords, and yogas decide whether the cluster becomes rise, pressure, or both.",
    })
  }

  return cases
}

const detectAstrologyCases = (chart: PrashnaChart) => {
  const cases: DetectedAstrologyCase[] = []
  const moon = getPlanet(chart, "Moon")
  const jupiter = getPlanet(chart, "Jupiter")
  const sun = getPlanet(chart, "Sun")
  const mercury = getPlanet(chart, "Mercury")
  const mars = getPlanet(chart, "Mars")
  const venus = getPlanet(chart, "Venus")
  const saturn = getPlanet(chart, "Saturn")
  const rahu = getPlanet(chart, "Rahu")
  const ketu = getPlanet(chart, "Ketu")
  const planetsByHouse = chart.planets.reduce<Record<number, string[]>>(
    (acc, planet) => {
      acc[planet.house] = [...(acc[planet.house] || []), planet.name]
      return acc
    },
    {}
  )

  const kaalSarp = detectKaalSarpCase(chart)
  if (kaalSarp) {
    addDetectedCase(cases, kaalSarp)
  }

  if (moon && jupiter && isKendraDistance(getHouseDistance(moon, jupiter))) {
    addDetectedCase(cases, {
      key: "gajakesari-style",
      name: "Gajakesari-style support",
      category: "yoga",
      status: "supportive",
      strength: "medium",
      planets: ["Moon", "Jupiter"],
      houses: [moon.house, jupiter.house],
      chart_basis: `Jupiter is in house ${jupiter.house}, a kendra distance from Moon in house ${moon.house}.`,
      combined_effect:
        "Protective judgement, learning, guidance, and public goodwill improve when Moon and Jupiter dashas or their houses activate.",
      retrieval_terms: ["gajakesari", "moon jupiter", "kendra from moon"],
    })
  }

  if (sun && mercury && sun.sign === mercury.sign) {
    addDetectedCase(cases, {
      key: "budhaditya-style",
      name: "Budhaditya-style combination",
      category: "yoga",
      status: "supportive",
      strength: Math.abs(sun.longitude - mercury.longitude) < 8 ? "medium" : "low",
      planets: ["Sun", "Mercury"],
      houses: Array.from(new Set([sun.house, mercury.house])),
      chart_basis: `Sun and Mercury share ${sun.sign}; Sun house ${sun.house}, Mercury house ${mercury.house}.`,
      combined_effect:
        "Intellect, speech, administration, commerce, and authority blend; combustion distance and dasha decide whether it becomes clarity or ego-pressure.",
      retrieval_terms: ["budhaditya", "sun mercury", "intellect speech authority"],
    })
  }

  if (moon && mars && (moon.sign === mars.sign || isKendraDistance(getHouseDistance(moon, mars)))) {
    addDetectedCase(cases, {
      key: "chandra-mangal",
      name: "Chandra-Mangal influence",
      category: "yoga",
      status: "watch",
      strength: moon.sign === mars.sign ? "high" : "medium",
      planets: ["Moon", "Mars"],
      houses: Array.from(new Set([moon.house, mars.house])),
      chart_basis: `Moon and Mars are ${moon.sign === mars.sign ? `together in ${moon.sign}` : "in kendra relationship"}.`,
      combined_effect:
        "Drive, initiative, finance, courage, and emotional heat combine; strong dasha can bring action and earnings, but unmanaged anger or haste can create conflict.",
      retrieval_terms: ["chandra mangal", "moon mars", "finance emotion heat"],
    })
  }

  if (mars && [1, 4, 7, 8, 12].includes(mars.house)) {
    addDetectedCase(cases, {
      key: `manglik-house-${mars.house}`,
      name: "Manglik/Mars sensitivity",
      category: "dosha",
      status: "watch",
      strength: [7, 8].includes(mars.house) ? "high" : "medium",
      planets: ["Mars"],
      houses: [mars.house],
      chart_basis: `Mars occupies house ${mars.house}, one of the common Manglik-sensitive houses.`,
      combined_effect:
        "Relationship, heat, impatience, injury-risk, and conflict themes need review through 7th house, Venus/Jupiter, Moon, and current dasha.",
      retrieval_terms: ["manglik", "mangal dosha", "mars relationship conflict"],
      caution: "Final marriage judgement needs full matching, not this one factor alone.",
    })
  }

  if (moon) {
    const adjacentPlanets = chart.planets.filter(
      (planet) =>
        !["Moon", "Rahu", "Ketu"].includes(planet.name) &&
        [2, 12].includes(((planet.house - moon.house + 12) % 12) + 1)
    )

    if (!adjacentPlanets.length) {
      addDetectedCase(cases, {
        key: "kemadruma-style",
        name: "Kemadruma-style Moon isolation",
        category: "dosha",
        status: "watch",
        strength: "medium",
        planets: ["Moon"],
        houses: [moon.house],
        chart_basis: `No non-nodal graha is found in the 2nd or 12th from Moon by the automated first pass.`,
        combined_effect:
          "The mind may feel self-reliant, unsupported, or cyclically lonely; benefic aspects, kendras, and Moon dasha decide severity.",
        retrieval_terms: ["kemadruma", "moon isolation", "mind emotional support"],
      })
    }
  }

  if (moon && jupiter) {
    const distance = getHouseDistance(moon, jupiter)

    if ([6, 8, 12].includes(distance)) {
      addDetectedCase(cases, {
        key: "shakata-style",
        name: "Shakata-style Moon-Jupiter distance",
        category: "dosha",
        status: "watch",
        strength: "medium",
        planets: ["Moon", "Jupiter"],
        houses: [moon.house, jupiter.house],
        chart_basis: `Jupiter is ${distance} houses from Moon.`,
        combined_effect:
          "Confidence, fortune, and guidance can fluctuate; consistency and guru support matter most during Moon/Jupiter periods.",
        retrieval_terms: ["shakata", "moon jupiter sixth eighth twelfth"],
      })
    }
  }

  if (
    venus &&
    saturn &&
    (venus.sign === saturn.sign ||
      isKendraDistance(getHouseDistance(venus, saturn)))
  ) {
    addDetectedCase(cases, {
      key: "venus-saturn",
      name: "Venus-Saturn influence",
      category: "yoga",
      status: "watch",
      strength: venus.sign === saturn.sign ? "high" : "medium",
      planets: ["Venus", "Saturn"],
      houses: Array.from(new Set([venus.house, saturn.house])),
      chart_basis: `Venus and Saturn are ${venus.sign === saturn.sign ? `together in ${venus.sign}` : "in kendra relationship"}.`,
      combined_effect:
        "Love, comfort, art, money, and responsibility mix; maturity can create durable results after delay.",
      retrieval_terms: ["venus saturn", "relationship delay maturity"],
    })
  }

  if (rahu && mars && rahu.sign === mars.sign) {
    addDetectedCase(cases, {
      key: "angarak-style",
      name: "Angarak-style Rahu-Mars influence",
      category: "dosha",
      status: "watch",
      strength: "high",
      planets: ["Rahu", "Mars"],
      houses: Array.from(new Set([rahu.house, mars.house])),
      chart_basis: `Rahu and Mars share ${rahu.sign}.`,
      combined_effect:
        "Ambition, heat, conflict, cuts/burns/inflammation, and risky speed can intensify; disciplined action channels it better than suppression.",
      retrieval_terms: ["angarak", "rahu mars", "injury anger inflammation"],
    })
  }

  if (ketu && saturn && ketu.sign === saturn.sign) {
    addDetectedCase(cases, {
      key: "saturn-ketu",
      name: "Saturn-Ketu influence",
      category: "dosha",
      status: "watch",
      strength: "high",
      planets: ["Saturn", "Ketu"],
      houses: Array.from(new Set([saturn.house, ketu.house])),
      chart_basis: `Saturn and Ketu share ${saturn.sign}.`,
      combined_effect:
        "Duty, detachment, chronic pressure, boundaries, and health discipline become karmic themes, especially in Saturn/Ketu periods.",
      retrieval_terms: ["saturn ketu", "chronic pressure", "detachment duty"],
    })
  }

  Object.entries(planetsByHouse)
    .filter(
      ([, names]) =>
        names.filter((name) => !["Rahu", "Ketu"].includes(name)).length >= 3
    )
    .forEach(([house, names]) => {
      addDetectedCase(cases, {
        key: `graha-concentration-${house}`,
        name: "Graha concentration",
        category: "compound",
        status: "compound",
        strength: names.length >= 4 ? "high" : "medium",
        planets: names,
        houses: [Number(house)],
        chart_basis: `House ${house} contains ${names.join(", ")}.`,
        combined_effect:
          "This house becomes a dominant life arena; read all planets together and then time the result through their dashas.",
        retrieval_terms: ["graha concentration", `house ${house}`, ...names],
      })
    })

  chart.planets
    .filter((planet) => EXALTATION_SIGNS[planet.name] === planet.sign)
    .forEach((planet) => {
      addDetectedCase(cases, {
        key: `exaltation-${planet.name.toLowerCase()}`,
        name: "Exaltation strength",
        category: "dignity",
        status: "supportive",
        strength: "high",
        planets: [planet.name],
        houses: [planet.house],
        chart_basis: `${planet.name} is exalted in ${planet.sign}, house ${planet.house}.`,
        combined_effect:
          "Its natural significations become stronger, but final result depends on house ownership, affliction, and dasha.",
        retrieval_terms: ["exaltation", planet.name, planet.sign],
      })
    })

  getNeechabhangaCases(chart).forEach((detectedCase) =>
    addDetectedCase(cases, detectedCase)
  )

  const ninthSign = chart.houses[8]?.sign
  const tenthSign = chart.houses[9]?.sign
  const ninthLord = ninthSign ? getPlanet(chart, SIGN_LORDS[ninthSign]) : null
  const tenthLord = tenthSign ? getPlanet(chart, SIGN_LORDS[tenthSign]) : null

  if (
    ninthLord &&
    tenthLord &&
    (ninthLord.house === tenthLord.house ||
      TRINAL_HOUSES.includes(ninthLord.house) ||
      KENDRA_HOUSES.includes(tenthLord.house))
  ) {
    addDetectedCase(cases, {
      key: "dharma-karma-support",
      name: "Dharma-karma support",
      category: "yoga",
      status: "supportive",
      strength: "medium",
      planets: getPlanetNames([ninthLord, tenthLord]),
      houses: Array.from(new Set([ninthLord.house, tenthLord.house])),
      chart_basis: `9th lord ${ninthLord.name} and 10th lord ${tenthLord.name} show supportive linkage.`,
      combined_effect:
        "Career growth improves when ethics, skill, authority, and visible effort align, especially in 9th/10th lord periods.",
      retrieval_terms: ["dharma karma", "ninth tenth lord", "career status"],
    })
  }

  const dusthanaLordsInDusthana = [6, 8, 12].filter((houseNumber) => {
    const sign = chart.houses[houseNumber - 1]?.sign
    const lord = sign ? getPlanet(chart, SIGN_LORDS[sign]) : null

    return lord && DUSTHANA_HOUSES.includes(lord.house)
  })

  if (dusthanaLordsInDusthana.length) {
    addDetectedCase(cases, {
      key: `vipreet-raja-yoga-${dusthanaLordsInDusthana.join("-")}`,
      name: "Vipreet Raja Yoga-style support",
      category: "yoga",
      status: "supportive",
      strength: dusthanaLordsInDusthana.length >= 2 ? "high" : "medium",
      planets: dusthanaLordsInDusthana
        .map((houseNumber) => {
          const sign = chart.houses[houseNumber - 1]?.sign
          return sign ? getPlanet(chart, SIGN_LORDS[sign])?.name : ""
        })
        .filter((name): name is string => Boolean(name)),
      houses: dusthanaLordsInDusthana,
      chart_basis: `Lords of houses ${dusthanaLordsInDusthana.join(", ")} occupy dusthana houses.`,
      combined_effect:
        "Obstacles, disease/debt/enemies, sudden change, or losses can convert into growth through discipline, service, crisis handling, and dasha activation.",
      retrieval_terms: ["vipreet raja yoga", "dusthana lord", "sixth eighth twelfth"],
    })
  }

  if (cases.length >= 2) {
    const pressureCases = cases.filter((item) =>
      ["dosha", "health"].includes(item.category)
    )
    const supportCases = cases.filter((item) =>
      ["yoga", "cancellation", "dignity"].includes(item.category)
    )

    if (pressureCases.length && supportCases.length) {
      addDetectedCase(cases, {
        key: "mixed-support-pressure-synthesis",
        name: "Mixed support-pressure synthesis",
        category: "compound",
        status: "compound",
        strength: "medium",
        planets: Array.from(
          new Set([...pressureCases, ...supportCases].flatMap((item) => item.planets))
        ),
        houses: Array.from(
          new Set([...pressureCases, ...supportCases].flatMap((item) => item.houses))
        ),
        chart_basis: `Support cases: ${supportCases
          .map((item) => item.name)
          .join(", ")}. Pressure cases: ${pressureCases
          .map((item) => item.name)
          .join(", ")}.`,
        combined_effect:
          "The reading must synthesize protection and pressure together. Benefic/supportive yogas do not cancel every dosha; pressure cases do not erase growth. Dasha decides which layer becomes visible.",
        retrieval_terms: ["combined yoga dosha synthesis", "dasha strength", "mixed effects"],
      })
    }
  }

  return cases
}

const detectYogas = (chart: PrashnaChart) => {
  const cases = detectAstrologyCases(chart)

  return cases.length
    ? cases.map(formatDetectedCase)
    : [
        "No major Kaal Sarp, Manglik, Budhaditya, Gajakesari, Angarak, Kemadruma, Shakata, Vipreet Raja Yoga, or clear debilitation pattern was detected by the automated first pass.",
      ]
}

const pushUnique = (items: string[], value: string) => {
  if (!items.includes(value)) {
    items.push(value)
  }
}

const getHousePlanets = (chart: PrashnaChart, houseNumber: number) =>
  chart.planets.filter((planet) => planet.house === houseNumber)

const getPlanetHealthTendency = (planetName: string) =>
  HEALTH_TENDENCIES_BY_PLANET[planetName] || "general vitality and recovery"

const MEDICAL_WATCH_RULES: MedicalWatchRule[] = [
  { condition: "blood pressure and cardiovascular strain", planets: ["Sun", "Mars", "Saturn"], houses: [1, 6, 8, 12], note: "track BP, chest discomfort, heat, stress and family history" },
  { condition: "diabetes and sugar metabolism", planets: ["Jupiter", "Venus", "Moon"], houses: [2, 6, 8, 12], note: "track HbA1c, weight, cravings, family history and sedentary routine" },
  { condition: "thyroid and hormonal imbalance", planets: ["Moon", "Mercury", "Venus", "Rahu"], houses: [2, 6, 8], note: "track fatigue, weight change, mood, throat/neck symptoms and TSH when advised" },
  { condition: "arthritis, joints and chronic stiffness", planets: ["Saturn", "Mars", "Ketu"], houses: [1, 6, 8, 12], note: "track joint pain, inflammation, stiffness, vitamin D and mobility" },
  { condition: "cancer or abnormal growth screening", planets: ["Rahu", "Ketu", "Saturn", "Moon"], houses: [6, 8, 12], note: "use age-appropriate screening; never treat astrology as diagnosis" },
  { condition: "accident, cuts, burns and surgery risk", planets: ["Mars", "Rahu", "Ketu", "Saturn"], houses: [1, 6, 8, 12], note: "drive slowly, avoid risky tools/haste and treat injuries promptly" },
  { condition: "digestive acidity, liver and bile strain", planets: ["Mars", "Sun", "Jupiter"], houses: [2, 5, 6, 8], note: "watch acidity, liver enzymes, food timing and alcohol/spice excess" },
  { condition: "kidney, urinary and reproductive balance", planets: ["Venus", "Moon", "Rahu"], houses: [6, 7, 8, 12], note: "track hydration, urinary symptoms and reproductive health checkups" },
  { condition: "lungs, asthma and allergy sensitivity", planets: ["Moon", "Mercury", "Rahu", "Saturn"], houses: [3, 4, 6, 12], note: "watch breath, cough, dust/allergy triggers and pollution exposure" },
  { condition: "skin allergy and autoimmune flares", planets: ["Rahu", "Ketu", "Mercury", "Saturn"], houses: [1, 6, 8], note: "track rashes, triggers, immunity and dermatology care for persistent symptoms" },
  { condition: "mental stress, anxiety and sleep disturbance", planets: ["Moon", "Rahu", "Saturn", "Ketu"], houses: [4, 6, 8, 12], note: "protect sleep, therapy/doctor support and reduce stimulants" },
  { condition: "depression, isolation and low vitality", planets: ["Moon", "Saturn", "Ketu"], houses: [1, 4, 8, 12], note: "seek support early for persistent low mood or self-harm thoughts" },
  { condition: "neurology, tremors and nerve pain", planets: ["Mercury", "Saturn", "Rahu", "Ketu"], houses: [1, 6, 8, 12], note: "track numbness, tingling, headaches and neuro symptoms" },
  { condition: "eye strain and vision problems", planets: ["Sun", "Moon", "Venus"], houses: [2, 6, 8, 12], note: "schedule eye checks and avoid ignoring sudden vision changes" },
  { condition: "dental, mouth and speech/throat issues", planets: ["Mercury", "Venus", "Saturn"], houses: [2, 6, 8], note: "watch gums, teeth, throat and speech strain" },
  { condition: "bone density and spine issues", planets: ["Sun", "Saturn", "Mars"], houses: [1, 6, 8, 10], note: "monitor posture, calcium/vitamin D and chronic back pain" },
  { condition: "obesity and metabolic syndrome", planets: ["Jupiter", "Venus", "Moon"], houses: [2, 5, 6, 11], note: "track waist, weight, sugar, lipids and movement" },
  { condition: "cholesterol and lipid imbalance", planets: ["Jupiter", "Venus", "Saturn"], houses: [2, 6, 8], note: "track lipid profile and family cardiovascular risk" },
  { condition: "infection and fever tendency", planets: ["Mars", "Sun", "Rahu"], houses: [6, 8, 12], note: "do not delay care for high fever or recurring infection" },
  { condition: "blood disorders and inflammation", planets: ["Mars", "Rahu", "Ketu"], houses: [6, 8, 12], note: "track CBC/inflammation markers when medically advised" },
  { condition: "gynecological and fertility sensitivity", planets: ["Moon", "Venus", "Mars", "Rahu"], houses: [5, 6, 7, 8, 12], note: "track cycle changes, pain and reproductive screening" },
  { condition: "male reproductive and prostate sensitivity", planets: ["Venus", "Mars", "Saturn"], houses: [7, 8, 12], note: "screen urinary/reproductive symptoms early" },
  { condition: "pregnancy and childbirth caution periods", planets: ["Moon", "Jupiter", "Venus", "Mars"], houses: [5, 6, 8, 12], note: "use qualified obstetric care and avoid astrological certainty" },
  { condition: "stomach ulcer and gut inflammation", planets: ["Mars", "Moon", "Ketu"], houses: [2, 5, 6, 8], note: "watch pain, bleeding signs, acidity and stress-food patterns" },
  { condition: "IBS and nervous digestion", planets: ["Mercury", "Moon", "Rahu"], houses: [5, 6, 8, 12], note: "track food triggers, anxiety and gut symptoms" },
  { condition: "liver, pancreas and gallbladder issues", planets: ["Jupiter", "Sun", "Mars"], houses: [5, 6, 8, 12], note: "track enzymes, sugar, pain and digestion changes" },
  { condition: "ear, nose and sinus sensitivity", planets: ["Mercury", "Moon", "Rahu"], houses: [2, 3, 6, 12], note: "watch sinus/allergy patterns and chronic infection" },
  { condition: "migraine and recurring headaches", planets: ["Sun", "Mars", "Rahu", "Moon"], houses: [1, 6, 8, 12], note: "track triggers, vision symptoms and neurological red flags" },
  { condition: "varicose veins and circulation issues", planets: ["Saturn", "Venus"], houses: [6, 8, 12], note: "support circulation and check swelling/pain" },
  { condition: "autoimmune and hard-to-diagnose disorders", planets: ["Rahu", "Ketu", "Saturn"], houses: [6, 8, 12], note: "document symptoms and pursue medical follow-up" },
  { condition: "hospitalization or isolation periods", planets: ["Saturn", "Ketu", "Rahu"], houses: [8, 12], note: "prepare insurance, emergency contacts and health documents" },
  { condition: "addiction and toxic exposure", planets: ["Rahu", "Venus", "Moon"], houses: [6, 8, 12], note: "avoid intoxicants and seek support early" },
  { condition: "heat stroke and dehydration", planets: ["Sun", "Mars"], houses: [1, 6, 8, 12], note: "hydrate and avoid heat overexposure during intense periods" },
  { condition: "cold, weakness and slow recovery", planets: ["Saturn", "Moon", "Ketu"], houses: [1, 6, 8, 12], note: "protect nutrition, rest and recovery time" },
  { condition: "surgery and invasive treatment windows", planets: ["Mars", "Ketu", "Saturn"], houses: [6, 8, 12], note: "plan second opinions and post-care carefully" },
  { condition: "child health and immunity concerns", planets: ["Moon", "Jupiter", "Mercury"], houses: [5, 6, 8, 12], note: "use pediatric care and vaccination guidance" },
  { condition: "elder-care chronic disease caution", planets: ["Saturn", "Sun", "Ketu"], houses: [1, 6, 8, 12], note: "prioritize routine screening and fall prevention" },
  { condition: "speech, thyroid-throat and neck strain", planets: ["Mercury", "Venus", "Rahu"], houses: [2, 3, 6, 8], note: "watch voice/throat changes and thyroid labs when advised" },
  { condition: "inflammatory pain and muscle injury", planets: ["Mars", "Saturn"], houses: [1, 3, 6, 8], note: "warm up, avoid overtraining and treat injury early" },
  { condition: "hidden disease or delayed diagnosis caution", planets: ["Ketu", "Rahu", "Saturn"], houses: [8, 12], note: "do not ignore vague symptoms; keep records and follow up" },
]

const SIGN_MODALITY: Record<string, "movable" | "fixed" | "dual"> = {
  Aries: "movable",
  Cancer: "movable",
  Libra: "movable",
  Capricorn: "movable",
  Taurus: "fixed",
  Leo: "fixed",
  Scorpio: "fixed",
  Aquarius: "fixed",
  Gemini: "dual",
  Virgo: "dual",
  Sagittarius: "dual",
  Pisces: "dual",
}

const getHouse = (chart: PrashnaChart, houseNumber: number) =>
  chart.houses[houseNumber - 1]

const getHouseLord = (chart: PrashnaChart, houseNumber: number) => {
  const house = getHouse(chart, houseNumber)
  return house?.signLord || ""
}

const getBadhakaHouse = (ascendant: string) => {
  const modality = SIGN_MODALITY[ascendant]

  if (modality === "movable") {
    return 11
  }

  if (modality === "fixed") {
    return 9
  }

  return 7
}

const getActiveDashaPeriods = (chart: PrashnaChart) =>
  chart.dasha
    ? [chart.dasha.mahadasha, chart.dasha.antardasha, chart.dasha.pratyantar]
        .filter((period): period is DashaPeriod => Boolean(period))
    : []

const getPlanetRole = ({
  planet,
  marakaLords,
  badhakesh,
  dusthanaLords,
}: {
  planet: string
  marakaLords: string[]
  badhakesh: string
  dusthanaLords: string[]
}) =>
  [
    marakaLords.includes(planet) ? "maraka" : "",
    badhakesh === planet ? "badhakesh" : "",
    dusthanaLords.includes(planet) ? "6th/8th/12th lord" : "",
    ["Rahu", "Ketu"].includes(planet) ? "nodal karaka" : "",
    ["Mars", "Saturn"].includes(planet) ? "accident/chronic pressure karaka" : "",
  ]
    .filter(Boolean)
    .join(", ")

const buildCriticalPeriodAnalysis = (chart: PrashnaChart): CriticalPeriodAnalysis => {
  const marakaLords = Array.from(
    new Set([getHouseLord(chart, 2), getHouseLord(chart, 7)].filter(Boolean))
  )
  const badhakaHouse = getBadhakaHouse(chart.ascendant)
  const badhakesh = getHouseLord(chart, badhakaHouse)
  const dusthanaLords = [6, 8, 12]
    .map((house) => getHouseLord(chart, house))
    .filter(Boolean)
  const activePeriods = getActiveDashaPeriods(chart)
  const activeTriggers = activePeriods
    .map((period) => {
      const role = getPlanetRole({
        planet: period.lord,
        marakaLords,
        badhakesh,
        dusthanaLords,
      })

      return role ? `${period.lord} ${period.level}: ${role}` : ""
    })
    .filter(Boolean)
  const watchPeriods = activePeriods
    .map((period) => {
      const role = getPlanetRole({
        planet: period.lord,
        marakaLords,
        badhakesh,
        dusthanaLords,
      })

      if (!role) {
        return null
      }

      return {
        period: period.level,
        lord: period.lord,
        role,
        window: getPeriodWindow(period),
        caution:
          "Use this as a prevention and screening period, not a guaranteed event or medical diagnosis.",
      }
    })
    .filter(Boolean) as CriticalPeriodAnalysis["watch_periods"]

  const medical_watchlist = MEDICAL_WATCH_RULES.map((rule) => {
    let score = 0
    const basis: string[] = []

    rule.houses.forEach((houseNumber) => {
      const occupants = getHousePlanets(chart, houseNumber).filter((planet) =>
        rule.planets.includes(planet.name)
      )
      const lord = getHouseLord(chart, houseNumber)

      if (occupants.length) {
        score += houseNumber === 6 || houseNumber === 8 || houseNumber === 12 ? 2 : 1
        basis.push(
          `${occupants.map((planet) => planet.name).join(", ")} in house ${houseNumber}`
        )
      }

      if (rule.planets.includes(lord)) {
        score += houseNumber === 6 || houseNumber === 8 || houseNumber === 12 ? 2 : 1
        basis.push(`${lord} rules house ${houseNumber}`)
      }
    })

    activePeriods.forEach((period) => {
      if (rule.planets.includes(period.lord)) {
        score += period.level === "mahadasha" ? 3 : period.level === "antardasha" ? 2 : 1
        basis.push(`${period.lord} active as ${period.level}`)
      }
    })

    if (marakaLords.some((lord) => rule.planets.includes(lord))) {
      score += 1
      basis.push(`maraka lord connection: ${marakaLords.join(", ")}`)
    }

    if (rule.planets.includes(badhakesh)) {
      score += 1
      basis.push(`badhakesh connection: ${badhakesh}`)
    }

    if (score < 3) {
      return null
    }

    return {
      condition: rule.condition,
      severity: score >= 7 ? "high" : score >= 5 ? "medium" : "low",
      chart_basis: basis.slice(0, 5).join("; "),
      dasha_trigger: activeTriggers.join(" | ") || activeDashaText(chart),
      prevention: `${rule.note}. This is a Jyotish watch signal only; consult a qualified doctor for symptoms and routine screening.`,
    } satisfies MedicalWatchSignal
  })
    .filter((item): item is MedicalWatchSignal => Boolean(item))
    .sort((left, right) => {
      const rank = { high: 3, medium: 2, low: 1 }
      return rank[right.severity] - rank[left.severity]
    })
    .slice(0, 10)

  return {
    maraka_lords: marakaLords,
    badhaka_house: badhakaHouse,
    badhakesh,
    active_triggers: activeTriggers,
    watch_periods: watchPeriods,
    medical_watchlist,
    safety_note:
      "These are preventive Jyotish watch periods. They must never be used as diagnosis, certainty of disease, or replacement for medical care.",
  }
}

const buildHealthIndicators = (
  chart: PrashnaChart,
  detectedYogas: string[]
) => {
  const indicators: string[] = []
  const lagnaLord = getPlanet(chart, SIGN_LORDS[chart.ascendant])
  const moon = getPlanet(chart, "Moon")

  if (lagnaLord) {
    const dignity = getPlanetDignity(lagnaLord)

    if (DUSTHANA_HOUSES.includes(lagnaLord.house) || dignity === "debilitated") {
      pushUnique(
        indicators,
        `Vitality watch: Lagna lord ${lagnaLord.name} is in house ${lagnaLord.house} with ${dignity}; monitor ${getPlanetHealthTendency(lagnaLord.name)}. This is a tendency, not a diagnosis.`
      )
    }
  }

  if (moon) {
    const dignity = getPlanetDignity(moon)

    if (DUSTHANA_HOUSES.includes(moon.house) || dignity === "debilitated") {
      pushUnique(
        indicators,
        `Mind-body watch: Moon is in house ${moon.house} with ${dignity}; monitor ${getPlanetHealthTendency("Moon")} and seek medical help for persistent sleep, anxiety, or mood concerns.`
      )
    }
  }

  ;[6, 8, 12].forEach((houseNumber) => {
    const occupants = getHousePlanets(chart, houseNumber).filter(
      (planet) => planet.name !== "Ketu" || houseNumber !== 12
    )
    const house = chart.houses[houseNumber - 1]
    const houseLord = house?.signLord ? getPlanet(chart, house.signLord) : null
    const houseLabel =
      houseNumber === 6
        ? "disease and recovery"
        : houseNumber === 8
          ? "chronic/sudden vulnerability"
          : "sleep, isolation, and hospitalization"

    occupants.slice(0, 3).forEach((planet) => {
      pushUnique(
        indicators,
        `House ${houseNumber} ${houseLabel}: ${planet.name} placed here can show ${getPlanetHealthTendency(planet.name)}. Use this as a prevention checklist and consult a doctor for symptoms.`
      )
    })

    if (!occupants.length && houseLord) {
      pushUnique(
        indicators,
        `House ${houseNumber} ${houseLabel}: ${house.sign} is ruled by ${houseLord.name} in house ${houseLord.house}; watch ${getPlanetHealthTendency(houseLord.name)} during its dasha or heavy transits.`
      )
    }
  })

  const yogaText = detectedYogas.join(" ").toLowerCase()

  if (yogaText.includes("angarak") || yogaText.includes("chandra-mangal")) {
    pushUnique(
      indicators,
      "Heat and inflammation watch: Mars-linked combinations can correlate with anger spikes, blood-pressure heat, cuts, burns, infections, or accident-prone haste. Treat this as a caution to slow down and get medical checks for recurring symptoms."
    )
  }

  if (yogaText.includes("saturn-ketu") || yogaText.includes("kemadruma")) {
    pushUnique(
      indicators,
      "Chronic stress watch: Saturn/Ketu or isolated Moon patterns can correlate with low mood, sleep disruption, joints, nerves, stiffness, or slow recovery. Use steady routines and professional care for persistent symptoms."
    )
  }

  if (yogaText.includes("kaal sarp") || yogaText.includes("rahu")) {
    pushUnique(
      indicators,
      "Rahu-Ketu axis watch: stress, allergies, toxins, unusual flare-ups, obsessive worry, or sudden health swings can become more visible under nodal periods. Avoid fear and use preventive checkups."
    )
  }

  const criticalPeriod = buildCriticalPeriodAnalysis(chart)

  if (criticalPeriod.active_triggers.length) {
    pushUnique(
      indicators,
      `Marakesh/Badhakesh period watch: ${criticalPeriod.active_triggers.join(
        " | "
      )}. Treat this as a preventive screening period, not a prediction of harm.`
    )
  }

  criticalPeriod.medical_watchlist.slice(0, 5).forEach((signal) => {
    pushUnique(
      indicators,
      `${signal.severity.toUpperCase()} preventive watch for ${
        signal.condition
      }: ${signal.chart_basis}. ${signal.prevention}`
    )
  })

  pushUnique(
    indicators,
    "Medical safety: these are astrological prevention signals, not disease diagnosis. Emergency, severe, or persistent symptoms need a qualified doctor."
  )

  return indicators.slice(0, 12)
}

type TargetedRemedy = {
  pain_point: string
  chart_basis: string
  mantra_or_pooja: string
  daily_practice: string
}

const buildTargetedRemedySeeds = (
  chart: PrashnaChart,
  detectedYogas: string[],
  healthIndicators: string[]
): TargetedRemedy[] => {
  const remedies: TargetedRemedy[] = []
  const addRemedy = (remedy: TargetedRemedy) => {
    if (!remedies.some((item) => item.pain_point === remedy.pain_point)) {
      remedies.push(remedy)
    }
  }
  const yogaText = detectedYogas.join(" ").toLowerCase()

  if (yogaText.includes("kaal sarp")) {
    addRemedy({
      pain_point: "Rahu-Ketu pressure, sudden reversals, fear, and obsessive loops",
      chart_basis: "Detected Kaal Sarp-style enclosure by the Rahu-Ketu axis.",
      mantra_or_pooja:
        "Do Rahu-Ketu shanti only after expert review; meanwhile chant Om Rahave Namah and Om Ketave Namah 108 times on Saturdays.",
      daily_practice:
        "Avoid intoxicants, shortcuts, and fear-based decisions; keep a simple Saturday daan/service routine.",
    })
  }

  if (yogaText.includes("manglik") || yogaText.includes("angarak")) {
    addRemedy({
      pain_point: "conflict, anger, inflammation, haste, and relationship heat",
      chart_basis: "Mars sensitivity is detected through Manglik/Angarak-style indicators.",
      mantra_or_pooja:
        "Read Hanuman Chalisa on Tuesdays and chant Om Angarakaya Namah 108 times.",
      daily_practice:
        "Do disciplined physical exercise, pause before arguments, and donate red lentils when suitable.",
    })
  }

  if (yogaText.includes("kemadruma") || yogaText.includes("shakata")) {
    addRemedy({
      pain_point: "emotional isolation, fluctuating confidence, sleep, and mental steadiness",
      chart_basis: "Moon support appears sensitive by Kemadruma/Shakata-style indicators.",
      mantra_or_pooja:
        "Do Monday Shiva jal abhishek and chant Om Som Somaya Namah 108 times.",
      daily_practice:
        "Keep a fixed sleep routine, reduce late-night stimulation, and donate rice or milk when suitable.",
    })
  }

  if (yogaText.includes("saturn-ketu")) {
    addRemedy({
      pain_point: "chronic pressure, duty fatigue, detachment, joints/nerves, and delays",
      chart_basis: "Saturn-Ketu influence is detected in the chart.",
      mantra_or_pooja:
        "Light a sesame-oil diya for Shani or Hanuman on Saturdays and chant Om Sham Shanicharaya Namah 108 times.",
      daily_practice:
        "Serve elders/workers, keep debt and sleep discipline, and avoid isolation as a default response.",
    })
  }

  if (yogaText.includes("budhaditya")) {
    addRemedy({
      pain_point: "speech pressure, pride, overthinking, study/business decisions, and authority friction",
      chart_basis: "Sun and Mercury share a sign in the automated Budhaditya-style check.",
      mantra_or_pooja:
        "Offer Surya arghya at sunrise and chant Om Bum Budhaya Namah 108 times on Wednesdays.",
      daily_practice:
        "Write decisions before speaking, keep accounts clean, and avoid ego-driven communication.",
    })
  }

  const dashaLords = [
    chart.dasha?.mahadasha?.lord,
    chart.dasha?.antardasha?.lord,
    chart.dasha?.pratyantar?.lord,
  ].filter(Boolean) as string[]

  dashaLords.slice(0, 2).forEach((lord) => {
    const remedy = PLANET_REMEDIES[lord]

    if (remedy) {
      addRemedy({
        pain_point: remedy.painPoint,
        chart_basis: `${lord} is active in the current Vimshottari period sequence.`,
        mantra_or_pooja: remedy.mantra,
        daily_practice: remedy.practice,
      })
    }
  })

  const lagnaLord = getPlanet(chart, SIGN_LORDS[chart.ascendant])

  if (lagnaLord && remedies.length < 4) {
    const remedy = PLANET_REMEDIES[lagnaLord.name]

    if (remedy) {
      addRemedy({
        pain_point: remedy.painPoint,
        chart_basis: `${lagnaLord.name} rules the Lagna and therefore directly affects body, direction, and resilience.`,
        mantra_or_pooja: remedy.mantra,
        daily_practice: remedy.practice,
      })
    }
  }

  if (healthIndicators.length) {
    addRemedy({
      pain_point: "health prevention and recovery discipline",
      chart_basis: healthIndicators[0],
      mantra_or_pooja:
        "Chant Maha Mrityunjaya Mantra 108 times daily for 21 or 40 days, without skipping medical advice.",
      daily_practice:
        "Keep sleep, hydration, movement, and checkups steady; consult a qualified doctor for symptoms.",
    })
  }

  return remedies.slice(0, 6)
}

const getStoneRecommendations = (chart: PrashnaChart) => {
  const trinal = STONE_HOUSES.map((houseNumber) => {
    const house = chart.houses[houseNumber - 1]
    const sign = house?.sign || (houseNumber === 1 ? chart.ascendant : "")
    const lord = SIGN_LORDS[sign]
    const gemstone = lord ? GEMSTONES_BY_LORD[lord] : null

    if (!sign || !lord || !gemstone) {
      return null
    }

    return {
      house: houseNumber,
      label:
        houseNumber === 1
          ? "1st house / Lagna"
          : houseNumber === 5
            ? "5th house"
            : "9th house",
      sign,
      lord,
      chart_basis: `The ${houseNumber} house falls in ${sign}, ruled by ${lord}.`,
      ...gemstone,
    }
  }).filter(Boolean)

  return {
    trinal,
    caution:
      "Only 1st, 5th, and 9th house lord stones are shown. Do not wear gemstones without expert review of strength, affliction, dasha, health, and suitability.",
  }
}

const PLANET_MEANINGS: Record<string, string> = {
  Sun: "identity, confidence, authority, father figures, visibility",
  Moon: "mind, emotions, mother, comfort, public response",
  Mars: "courage, conflict, stamina, land, siblings, decisive action",
  Mercury: "speech, learning, trade, analysis, writing",
  Jupiter: "wisdom, teachers, children, ethics, expansion",
  Venus: "relationships, comforts, art, vehicles, luxuries",
  Saturn: "discipline, duty, delay, service, endurance",
  Rahu: "ambition, unusual desire, foreign influence, restlessness",
  Ketu: "detachment, spirituality, past karma, precision",
}

const VIMSHOTTARI_YEARS_BY_LORD: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
}

const TROPICAL_YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

const addDashaYears = (date: Date, years: number) =>
  new Date(date.getTime() + years * TROPICAL_YEAR_MS)

const getPeriodWindow = (period: Pick<DashaPeriod, "startIso" | "endIso">) => {
  const start = new Date(period.startIso)
  const end = new Date(period.endIso)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Timing unavailable"
  }

  return `${start.getFullYear()}-${end.getFullYear()}`
}

const getAgeRange = (
  period: Pick<DashaPeriod, "startIso" | "endIso">,
  birthDate: Date
) => {
  const start = new Date(period.startIso)
  const end = new Date(period.endIso)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Age unavailable"
  }

  const startAge = Math.max(
    0,
    Math.floor((start.getTime() - birthDate.getTime()) / TROPICAL_YEAR_MS)
  )
  const endAge = Math.max(
    startAge,
    Math.ceil((end.getTime() - birthDate.getTime()) / TROPICAL_YEAR_MS)
  )

  return `${startAge}-${endAge}`
}

const uniqueNumbers = (values: Array<number | undefined>) =>
  Array.from(
    new Set(values.filter((value): value is number => typeof value === "number"))
  )

const getPlanetOwnedHouses = (chart: PrashnaChart, planetName: string) =>
  chart.houses
    .filter((house) => house.signLord === planetName)
    .map((house) => house.house)

const getHouseTheme = (houseNumber: number) =>
  HOUSE_THEMES[houseNumber - 1] || "life direction"

const getPeriodStatus = (period: Pick<DashaPeriod, "startIso" | "endIso">, now: Date) => {
  const start = new Date(period.startIso)
  const end = new Date(period.endIso)

  if (now >= start && now < end) {
    return "current"
  }

  return end < now ? "past" : "future"
}

const getHouseEventSignal = (houses: number[]) => {
  const ordered = houses.filter(Boolean)
  const has = (house: number) => ordered.includes(house)
  const signals: string[] = []

  if (has(1)) signals.push("identity, body, confidence, and personal direction")
  if (has(2)) signals.push("family, speech, food habits, savings, and value system")
  if (has(3)) signals.push("skills, communication, siblings, courage, and short travel")
  if (has(4)) signals.push("home, education base, property, vehicles, and emotional security")
  if (has(5)) signals.push("study, creativity, romance, children, mantra, and past merit")
  if (has(6)) signals.push("competition, debt, disease prevention, service, and disputes")
  if (has(7)) signals.push("marriage, partnership, contracts, and public dealings")
  if (has(8)) signals.push("sudden change, research, inheritance, hidden matters, and risk")
  if (has(9)) signals.push("higher learning, father/guru, dharma, fortune, and long travel")
  if (has(10)) signals.push("career, status, authority, responsibility, and public work")
  if (has(11)) signals.push("income, networks, elder siblings, visibility, and gains")
  if (has(12)) signals.push("foreign links, expenses, sleep, retreat, hospitals, and moksha themes")

  return signals.slice(0, 3).join("; ") || "general life movement"
}

const getPlanetLifeArea = (chart: PrashnaChart, planet: PrashnaPlanet) => {
  const bhavaHouse = planet.bhavaHouse || planet.house
  const ownedHouses = getPlanetOwnedHouses(chart, planet.name)
  const houses = uniqueNumbers([bhavaHouse, planet.rashiHouse, ...ownedHouses])

  return houses
    .slice(0, 4)
    .map((house) => `${house}H ${getHouseTheme(house).toLowerCase()}`)
    .join("; ")
}

const buildMahadashaTimeline = (chart: PrashnaChart) => {
  if (!chart.dasha) {
    return []
  }

  const sequence = chart.dasha.sequence.length
    ? chart.dasha.sequence
    : ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
  const startLord = chart.dasha.balanceAtBirth.lord
  const startIndex = Math.max(sequence.indexOf(startLord), 0)
  const periods: DashaPeriod[] = [chart.dasha.balanceAtBirth]
  let cursor = new Date(chart.dasha.balanceAtBirth.endIso)

  for (let index = 1; index < 18; index += 1) {
    const lord = sequence[(startIndex + index) % sequence.length]
    const durationYears = VIMSHOTTARI_YEARS_BY_LORD[lord] || 0
    const end = addDashaYears(cursor, durationYears)

    periods.push({
      lord,
      level: "mahadasha",
      startIso: cursor.toISOString(),
      endIso: end.toISOString(),
      startLabel: String(cursor.getFullYear()),
      endLabel: String(end.getFullYear()),
      durationYears,
    })
    cursor = end
  }

  return periods
}



const findPlanetActivationWindow = (chart: PrashnaChart, planetName: string) => {
  const now = chart.dasha?.currentDateIso ? new Date(chart.dasha.currentDateIso) : new Date()
  const timeline = buildMahadashaTimeline(chart)
  const current = [
    chart.dasha?.mahadasha,
    chart.dasha?.antardasha,
    chart.dasha?.pratyantar,
  ].find((period) => period?.lord === planetName)

  if (current) {
    return `${current.lord} ${current.level} active now (${getPeriodWindow(current)})`
  }

  const next = timeline.find(
    (period) => period.lord === planetName && new Date(period.startIso) > now
  )
  if (next) {
    return `${planetName} Mahadasha ${getPeriodWindow(next)}`
  }

  const previous = [...timeline]
    .reverse()
    .find((period) => period.lord === planetName && new Date(period.endIso) <= now)

  return previous
    ? `${planetName} Mahadasha previously ${getPeriodWindow(previous)}; repeats through sub-periods and transits`
    : `${planetName} activates through its antardasha/pratyantar, transits, and house triggers`
}

const getPlanetDignity = (planet: PrashnaPlanet) => {
  if (EXALTATION_SIGNS[planet.name] === planet.sign) {
    return "exalted"
  }

  if (DEBILITATION_SIGNS[planet.name] === planet.sign) {
    return "debilitated"
  }

  if (SIGN_LORDS[planet.sign] === planet.name) {
    return "own sign"
  }

  return "neutral dignity"
}

const buildPlanetEffects = (chart: PrashnaChart) =>
  chart.planets
    .filter((planet) =>
      [
        "Sun",
        "Moon",
        "Mars",
        "Mercury",
        "Jupiter",
        "Venus",
        "Saturn",
        "Rahu",
        "Ketu",
      ].includes(planet.name)
    )
    .map((planet) => {
      const rashiHouse = planet.rashiHouse || planet.house
      const bhavaHouse = planet.bhavaHouse || planet.house
      const houseTheme = HOUSE_THEMES[bhavaHouse - 1] || "life matters"
      const ownedHouses = getPlanetOwnedHouses(chart, planet.name)
      const dignity = getPlanetDignity(planet)
      const impact =
        typeof planet.bhavaImpactPercent === "number"
          ? `${planet.bhavaImpactPercent}% ${planet.bhavaImpactState || "bhava"} bhava impact`
          : "bhava impact not measured"
      const placement =
        rashiHouse === bhavaHouse
          ? `${planet.name} in ${planet.sign}, Rashi/Bhava house ${bhavaHouse}, ${planet.nakshatra} pada ${planet.pada}, ${dignity}, ${impact}`
          : `${planet.name} in ${planet.sign}, Rashi house ${rashiHouse} but Bhava Chalit house ${bhavaHouse}, ${planet.nakshatra} pada ${planet.pada}, ${dignity}, ${impact}`

      return {
        planet: planet.name,
        placement,
        life_area: getPlanetLifeArea(chart, planet),
        activation_period: findPlanetActivationWindow(chart, planet.name),
        effect: `${planet.name} personally influences ${houseTheme.toLowerCase()} through ${PLANET_MEANINGS[planet.name] || "its natural significations"}; owned houses ${ownedHouses.join(", ") || "none"} add their agenda.`,
        likely_effect: `${getHouseEventSignal(
          uniqueNumbers([bhavaHouse, rashiHouse, ...ownedHouses])
        )} becomes more visible during ${findPlanetActivationWindow(
          chart,
          planet.name
        )}.`,
        advice:
          DUSTHANA_HOUSES.includes(bhavaHouse) ||
          dignity === "debilitated" ||
          planet.bhavaImpactState === "sandhi" ||
          planet.name === "Rahu" ||
          planet.name === "Ketu"
            ? "Use discipline, prayer, service, and expert review before strong remedies."
            : "Strengthen this placement through steady conduct, relevant skill-building, and simple daily worship.",
      }
    })

const planetPlacementText = (chart: PrashnaChart, names: string[]) =>
  names
    .map((name) => getPlanet(chart, name))
    .filter(Boolean)
    .map(
      (planet) =>
        `${planet!.name} in ${planet!.sign} house ${planet!.house} ${
          planet!.nakshatra
        } pada ${planet!.pada}`
    )
    .join("; ")

const activeDashaText = (chart: PrashnaChart) =>
  chart.dasha
    ? [
        `Mahadasha ${chart.dasha.mahadasha.lord} ${chart.dasha.mahadasha.startLabel} to ${chart.dasha.mahadasha.endLabel}`,
        `Antardasha ${chart.dasha.antardasha.lord} ${chart.dasha.antardasha.startLabel} to ${chart.dasha.antardasha.endLabel}`,
        `Pratyantar ${chart.dasha.pratyantar.lord} ${chart.dasha.pratyantar.startLabel} to ${chart.dasha.pratyantar.endLabel}`,
        `Moon nakshatra lord ${chart.dasha.moonNakshatraLord}`,
        planetPlacementText(chart, [
          chart.dasha.mahadasha.lord,
          chart.dasha.antardasha.lord,
          chart.dasha.pratyantar.lord,
        ]),
      ].join("; ")
    : "Vimshottari dasha unavailable"

const mergeKnowledgePassages = (
  limit: number,
  ...groups: RetrievedAstrologyPassage[][]
): RetrievedAstrologyPassage[] => {
  const seen = new Set<string>()

  return groups
    .flat()
    .sort((left, right) => right.score - left.score)
    .filter((passage) => {
      if (seen.has(passage.id)) {
        return false
      }

      seen.add(passage.id)
      return true
    })
    .slice(0, Math.min(Math.max(limit, 1), 24))
}

const knowledgeTrace = (passages: RetrievedAstrologyPassage[]) =>
  passages.map((passage) => ({
    id: passage.id,
    citation: passage.citation,
    score: Number(passage.score.toFixed(4)),
    keywords: passage.keywords.slice(0, 8),
  }))

const retrieveKnowledgeSafely = (
  args: Parameters<typeof retrieveAstrologyKnowledge>[0]
) => {
  try {
    return retrieveAstrologyKnowledge(args)
  } catch (error) {
    console.error("Astrology RAG retrieval failed", error)
    return []
  }
}

const casePriority = (detectedCase: DetectedAstrologyCase) => {
  const categoryScore =
    detectedCase.category === "compound"
      ? 50
      : detectedCase.category === "dosha"
        ? 42
        : detectedCase.category === "cancellation"
          ? 38
          : detectedCase.category === "dasha"
            ? 34
            : detectedCase.category === "health"
              ? 30
              : 20
  const strengthScore =
    detectedCase.strength === "high"
      ? 15
      : detectedCase.strength === "medium"
        ? 8
        : 2

  return categoryScore + strengthScore
}

const selectPriorityCases = (detectedCases: DetectedAstrologyCase[]) =>
  [...detectedCases]
    .sort((left, right) => casePriority(right) - casePriority(left))
    .slice(0, 4)

const getImportantHouseBasis = (chart: PrashnaChart, houses: number[]) =>
  houses
    .map((houseNumber) => {
      const house = chart.houses.find((item) => item.house === houseNumber)
      const planets = chart.planets
        .filter((planet) => planet.house === houseNumber)
        .map(
          (planet) =>
            `${planet.name} in ${planet.sign} ${planet.nakshatra} pada ${planet.pada}`
        )

      if (!house) {
        return ""
      }

      return `House ${houseNumber}: ${house.sign}, lord ${house.signLord}, ${
        house.theme
      }${planets.length ? `, planets ${planets.join("; ")}` : ""}`
    })
    .filter(Boolean)
    .join(" | ")


const createCuratedKundliPassage = ({
  id,
  section,
  citation,
  text,
  keywords,
  score = 9.5,
}: {
  id: string
  section: string
  citation: string
  text: string
  keywords: string[]
  score?: number
}): RetrievedAstrologyPassage => ({
  id,
  source: "Shreem curated Parashari rules",
  sourceFile: "shreem-curated-parashari-rules",
  sourceVolume: "Curated classical interpretation layer",
  section,
  citation,
  chapterNumber: 0,
  chapterTitle: section,
  text,
  keywords,
  score,
})

const buildCuratedKundliKnowledgePassages = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  subQuestions,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  subQuestions: string[]
}): RetrievedAstrologyPassage[] => {
  const activeDasha = activeDashaText(chart)
  const priorityCases = selectPriorityCases(detectedCases)
    .map((item) => `${item.name}: ${item.combined_effect}`)
    .join(" | ")

  const lagnaBasis = getImportantHouseBasis(chart, [1])
  const careerBasis = getImportantHouseBasis(chart, [1, 3, 6, 9, 10, 11])
  const wealthBasis = getImportantHouseBasis(chart, [2, 5, 8, 9, 11, 12])
  const healthBasis = getImportantHouseBasis(chart, [1, 6, 8, 12])
  const relationshipBasis = getImportantHouseBasis(chart, [1, 2, 5, 7, 8, 11])
  const propertyBasis = getImportantHouseBasis(chart, [4, 9, 10, 11, 12])
  const spiritualBasis = getImportantHouseBasis(chart, [5, 8, 9, 12])

  const careerPlanets = planetPlacementText(chart, [
    "Sun",
    "Mercury",
    "Venus",
    "Saturn",
    "Mars",
    "Rahu",
  ])
  const wealthPlanets = planetPlacementText(chart, [
    "Moon",
    "Mercury",
    "Venus",
    "Jupiter",
    "Saturn",
    "Rahu",
  ])
  const healthPlanets = planetPlacementText(chart, [
    "Sun",
    "Moon",
    "Mars",
    "Saturn",
    "Rahu",
    "Ketu",
  ])
  const relationshipPlanets = planetPlacementText(chart, [
    "Venus",
    "Jupiter",
    "Saturn",
    "Mars",
    "Moon",
    "Rahu",
    "Ketu",
  ])

  return [
    createCuratedKundliPassage({
      id: "shreem-curated-direct-question",
      section:
        "question_pack: User question evidence. Use only for the direct answer at the top.",
      citation:
        "Shreem curated Parashari synthesis: exact question answer using Lagna, Moon, dasha, relevant houses and detected yogas",
      keywords: ["question", "direct answer", "timing", "dasha", "action"],
      text: [
        "Answer the user's exact question once. First identify the houses relevant to the question, then judge their lords, occupants, dignity, drishti, Bhava Chalit delivery, Moon condition and current Mahadasha-Antardasha-Pratyantar.",
        `User question(s): ${subQuestions.join(" | ") || "general Kundli reading"}.`,
        `Current dasha basis: ${activeDasha}.`,
        `Lagna basis: ${lagnaBasis}.`,
        `Important cases: ${priorityCases || detectedYogas.join(", ") || "none detected"}.`,
        "Do not repeat this direct answer in summary or life-area rows.",
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-career",
      section:
        "career_pack: Career, work, authority, profession, recognition, business visibility and 10th-house judgement.",
      citation:
        "Shreem curated Parashari synthesis: career judged from 1st, 3rd, 6th, 9th, 10th and 11th houses, their lords, Sun, Mercury, Saturn, Mars, Venus, Rahu and active dasha",
      keywords: [
        "career",
        "profession",
        "karma",
        "10th house",
        "authority",
        "work",
        "business",
        "recognition",
      ],
      text: [
        "Career judgement must not be made from dasha passages alone. Use 10th house and 10th lord for profession and public role; 6th for employment/service/competition; 3rd for effort, sales, communication and courage; 9th for fortune, mentors and dharma; 11th for gains and network; Lagna for ability to execute.",
        "Sun shows authority and leadership; Mercury shows analytics, trade, communication and technology; Saturn shows structure, delay and responsibility; Mars shows engineering, operations and courage; Venus shows design, commerce and comforts; Rahu shows technology, foreign systems, unconventional rise and obsession.",
        "If 10th lord is weak/debilitated but receives cancellation, support from Lagna/lords, benefic aspect or dasha activation, predict rise after struggle rather than denial.",
        `Career house basis: ${careerBasis}.`,
        `Career planet basis: ${careerPlanets}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-wealth",
      section:
        "wealth_pack: Money, income, savings, assets, gains, losses and wealth-building judgement.",
      citation:
        "Shreem curated Parashari synthesis: wealth judged from 2nd, 5th, 8th, 9th, 11th and 12th houses, dhana/labha lords, Jupiter, Venus, Mercury and active dasha",
      keywords: [
        "wealth",
        "income",
        "savings",
        "2nd house",
        "11th house",
        "dhana",
        "labha",
        "assets",
      ],
      text: [
        "Wealth judgement must separate income, savings, assets and leakage. 2nd house shows savings, speech and family resources; 11th shows gains, network and fulfilment; 5th shows speculation/intelligence; 8th shows sudden events, inheritance, risk and hidden money; 9th shows fortune; 12th shows expenses and foreign/spiritual outflow.",
        "Jupiter gives expansion and wisdom; Venus gives luxury/commerce; Mercury gives trade/data/business; Saturn gives slow accumulation; Rahu gives spikes and foreign/tech income but volatility.",
        "If wealth houses are connected with dusthana or Rahu/Ketu, advise disciplined cash management and avoid speculative overreach during weak sub-periods.",
        `Wealth house basis: ${wealthBasis}.`,
        `Wealth planet basis: ${wealthPlanets}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-health",
      section:
        "health_pack: Health, disease tendency, recovery, accident risk, mental pressure, sleep and chronic issues.",
      citation:
        "Shreem curated Parashari synthesis: health judged from Lagna, Moon, 6th, 8th, 12th houses, Mars, Saturn, Rahu, Ketu and active dasha",
      keywords: [
        "health",
        "disease",
        "6th house",
        "8th house",
        "12th house",
        "accident",
        "sleep",
        "mental wellbeing",
      ],
      text: [
        "Health judgement must be careful and non-medical. Lagna and Lagna lord show vitality; Moon shows mind and emotional stability; 6th shows disease and recovery; 8th shows chronic/sudden risk; 12th shows sleep, hospitalization, isolation and expenses.",
        "Mars indicates inflammation, injury, blood/heat and accidents; Saturn indicates chronicity, bones, nerves and delay; Rahu indicates unusual, allergic, toxic, anxiety or misdiagnosed patterns; Ketu indicates hidden, sudden or difficult-to-pinpoint issues.",
        "Give practical watch areas and advise medical checkups when risk appears. Do not make fatalistic claims.",
        `Health house basis: ${healthBasis}.`,
        `Health planet basis: ${healthPlanets}.`,
        `Health indicators: ${healthIndicators.join(" | ") || "none flagged"}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-relationship",
      section:
        "relationship_pack: Marriage, spouse, partnership, public dealing, contracts and emotional relationship pattern.",
      citation:
        "Shreem curated Parashari synthesis: relationship judged from 7th house/lord, Venus, Jupiter, Moon, Mars, Saturn, Rahu-Ketu, 2nd/5th/8th/11th and active dasha",
      keywords: [
        "relationship",
        "marriage",
        "spouse",
        "7th house",
        "partnership",
        "public dealing",
      ],
      text: [
        "Relationship judgement must separate marriage potential, partner quality, timing and conflict pattern. 7th house/lord shows spouse and partnership; Venus shows affection and attraction; Jupiter gives wisdom/support; Moon gives emotional bonding; Mars gives passion/conflict; Saturn gives delay/responsibility; Rahu/Ketu give unconventional or karmic patterns.",
        "2nd supports family continuity; 5th supports romance; 8th shows intimacy, trust and shocks; 11th shows fulfilment of desire.",
        `Relationship house basis: ${relationshipBasis}.`,
        `Relationship planet basis: ${relationshipPlanets}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-property-home",
      section:
        "property_pack: Home, land, vehicles, mother, domestic peace and settlement.",
      citation:
        "Shreem curated Parashari synthesis: property judged from 4th, 9th, 10th, 11th, 12th houses, Moon, Venus, Mars, Saturn and active dasha",
      keywords: ["property", "home", "land", "vehicle", "4th house", "settlement"],
      text: [
        "Property and home judgement uses 4th house/lord for home, land, mother and inner peace; Mars for land/construction; Venus for vehicles/comforts; Moon for home happiness; Saturn for long-term property, delay and responsibility; 11th for fulfilment; 12th for foreign residence or expenses.",
        `Property basis: ${propertyBasis}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
    createCuratedKundliPassage({
      id: "shreem-curated-spiritual-foreign",
      section:
        "foreign_spiritual_pack: Foreign travel, isolation, spiritual growth, inner transformation and moksha tendencies.",
      citation:
        "Shreem curated Parashari synthesis: foreign/spiritual judged from 5th, 8th, 9th, 12th, Rahu, Ketu, Jupiter, Saturn and active dasha",
      keywords: [
        "foreign",
        "spiritual",
        "12th house",
        "9th house",
        "Rahu",
        "Ketu",
        "moksha",
      ],
      text: [
        "Foreign and spiritual judgement uses 9th for fortune/dharma/long travel, 12th for foreign stay/isolation/moksha/expenses, 8th for occult and transformation, 5th for mantra/purva punya. Rahu gives foreign/unconventional environments; Ketu gives detachment and spiritualization; Jupiter gives dharma; Saturn gives discipline and isolation.",
        `Foreign/spiritual basis: ${spiritualBasis}.`,
        `Active dasha: ${activeDasha}.`,
      ].join("\n"),
    }),
  ]
}


const buildKundliKnowledgePassages = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  criticalPeriod,
  targetedRemedySeeds,
  subQuestions,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  targetedRemedySeeds: TargetedRemedy[]
  subQuestions: string[]
}) => {
  const dashaLords = chart.dasha
    ? [
        chart.dasha.mahadasha.lord,
        chart.dasha.antardasha.lord,
        chart.dasha.pratyantar.lord,
      ]
    : []

  const activeDasha = activeDashaText(chart)
  const caseTerms = getCaseSearchTerms(detectedCases)
  const selectedCases = selectPriorityCases(detectedCases)

  const afflictedRiskPlanets = chart.planets
    .filter(
      (planet) =>
        DUSTHANA_HOUSES.includes(planet.house) ||
        ["Mars", "Saturn", "Rahu", "Ketu"].includes(planet.name)
    )
    .map(
      (planet) =>
        `${planet.name} ${planet.sign} house ${planet.house} ${planet.nakshatra}`
    )

  const topicQueries: {
    label: string
    purpose: string
    query: string
    detectedCases?: string[]
    min: number
    max: number
  }[] = [
    {
      label: "dasha_pack",
      purpose:
        "Use only for Vimshottari Mahadasha, Antardasha, Pratyantar, timing, past/future dasha flow, and event timing.",
      query: [
        "vimshottari dasha mahadasha antardasha pratyantar bhukti dasha lord effects phala timing दशा महादशा अन्तर्दशा",
        activeDasha,
        dashaLords.join(" "),
      ].join(" "),
      detectedCases: dashaLords,
      min: 2,
      max: 4,
    },
    {
      label: "career_pack",
      purpose:
        "Use only for career, profession, authority, work, recognition, karma, job, business visibility, and 10th-house judgement.",
      query: [
        "career profession karma tenth house 10th house authority livelihood work status recognition government business success कर्म दशम भाव पेशा व्यवसाय",
        getImportantHouseBasis(chart, [1, 3, 6, 9, 10, 11]),
        planetPlacementText(chart, ["Sun", "Mercury", "Venus", "Saturn", "Mars", "Rahu"]),
      ].join(" "),
      detectedCases: ["career", "profession", "karma", "tenth house", "10th house"],
      min: 2,
      max: 4,
    },
    {
      label: "wealth_pack",
      purpose:
        "Use only for money, income, savings, wealth, gains, family resources, assets, losses, and 2nd/11th-house judgement.",
      query: [
        "money wealth income savings finance profit gains second house 2nd house eleventh house 11th house dhana labha assets loss धन लाभ आय बचत",
        getImportantHouseBasis(chart, [2, 5, 8, 9, 11, 12]),
        planetPlacementText(chart, ["Moon", "Mercury", "Venus", "Jupiter", "Saturn", "Rahu"]),
      ].join(" "),
      detectedCases: ["wealth", "income", "dhana", "labha", "second house", "eleventh house"],
      min: 2,
      max: 4,
    },
    {
      label: "health_pack",
      purpose:
        "Use only for health, disease tendency, recovery, chronic issues, accident risk, inflammation, surgery, sleep, and 6th/8th/12th-house judgement.",
      query: [
        "health disease illness recovery accident injury surgery sixth house 6th eighth house 8th twelfth house 12th ari randhra vyaya arishta rog रोग अरिष्ट दुर्घटना अष्टम षष्ठ व्यय",
        healthIndicators.join(" "),
        afflictedRiskPlanets.join(" "),
        getImportantHouseBasis(chart, [1, 6, 8, 12]),
      ].join(" "),
      detectedCases: healthIndicators.length
        ? healthIndicators
        : ["health", "disease", "sixth house", "eighth house", "twelfth house"],
      min: 2,
      max: 4,
    },
    {
      label: "relationship_pack",
      purpose:
        "Use only for marriage, spouse, relationship pattern, public dealing, contracts, partnership, and 7th-house judgement.",
      query: [
        "marriage spouse relationship partner seventh house 7th house public dealing agreements contracts venus jupiter saturn mars mangal विवाह युति नाड़ी भकूट",
        getImportantHouseBasis(chart, [1, 2, 5, 7, 8, 11]),
        planetPlacementText(chart, ["Venus", "Jupiter", "Saturn", "Mars", "Moon", "Rahu", "Ketu"]),
      ].join(" "),
      detectedCases: ["marriage", "relationship", "seventh house", "spouse", "partnership"],
      min: 2,
      max: 4,
    },
    {
      label: "yoga_pack",
      purpose:
        "Use only for yogas, dosha, neechabhanga, cancellation, special combinations, Rahu-Ketu patterns, and Moon-Jupiter patterns.",
      query: [
        "parashari yoga special combination neechabhanga debilitation cancellation gajakesari shakata budhaditya kaal sarp rahu ketu conjunction aspect result योग नीचभंग राजयोग",
        detectedYogas.join(" "),
        caseTerms.join(" "),
        selectedCases.map((item) => `${item.name} ${item.combined_effect}`).join(" "),
        planetPlacementText(chart, [
          "Sun",
          "Moon",
          "Jupiter",
          "Venus",
          "Saturn",
          "Mercury",
          "Mars",
          "Rahu",
          "Ketu",
        ]),
      ].join(" "),
      detectedCases: [...detectedYogas, ...caseTerms],
      min: detectedYogas.length ? 2 : 1,
      max: 4,
    },
    {
      label: "remedy_pack",
      purpose:
        "Use only for remedies, mantra, daan, pooja, graha shanti, practical discipline, and gemstone caution.",
      query: [
        "remedy mantra pooja daan graha shanti upaya deity gemstone सावधानी उपाय मंत्र दान पूजा ग्रह शांति",
        targetedRemedySeeds
          .map(
            (item) =>
              `${item.pain_point} ${item.chart_basis} ${item.mantra_or_pooja}`
          )
          .join(" "),
      ].join(" "),
      detectedCases: targetedRemedySeeds.map((item) => item.pain_point),
      min: 1,
      max: 3,
    },
    ...(subQuestions.length
      ? [
          {
            label: "question_pack",
            purpose:
              "Use only for answering the user's exact question once at the top. Do not reuse this answer in other report sections.",
            query: [
              "specific user question parashari prediction chart result timing action",
              subQuestions.join(" "),
              activeDasha,
              getImportantHouseBasis(chart, [1, 2, 6, 9, 10, 11, 12]),
            ].join(" "),
            detectedCases: subQuestions,
            min: 1,
            max: 3,
          },
        ]
      : []),
  ]

  const seen = new Set<string>()
  const selected: RetrievedAstrologyPassage[] = []

  topicQueries.forEach((topic) => {
    const passages = retrieveKnowledgeSafely({
      query: topic.query,
      // Deliberately do not pass full chart here.
      // Each topic query already carries focused chart basis.
      detectedCases: topic.detectedCases || [],
      min: topic.min,
      max: topic.max,
    })

    let topicCount = 0

    passages.forEach((passage) => {
      if (topicCount >= topic.max || seen.has(passage.id)) {
        return
      }

      seen.add(passage.id)
      topicCount += 1

      selected.push({
        ...passage,
        section: `${topic.label}: ${topic.purpose} | ${passage.section}`,
      })
    })
  })

  if (selected.length < 10) {
    mergeKnowledgePassages(
      12,
      retrieveKnowledgeSafely({
        query: [
          "vimshottari dasha yoga health remedy parashari classical judgement",
          activeDasha,
          detectedYogas.join(" "),
          caseTerms.join(" "),
        ].join(" "),
        detectedCases: [...dashaLords, ...detectedYogas, ...caseTerms],
        min: 4,
        max: 8,
      })
    ).forEach((passage) => {
      if (!seen.has(passage.id) && selected.length < 16) {
        seen.add(passage.id)
        selected.push({
          ...passage,
          section: `fallback_pack: Classical support only if a specific topic pack is weak | ${passage.section}`,
        })
      }
    })
  }

  const curatedPassages = buildCuratedKundliKnowledgePassages({
    chart,
    detectedYogas,
    detectedCases,
    healthIndicators,
    subQuestions,
  })

  // Curated section-specific rules come first. BPHS passages then provide
  // classical dasha/yoga/remedy backing. This prevents generic dasha passages
  // from becoming the only evidence for career/wealth/health/marriage.
  return mergeKnowledgePassages(32, curatedPassages, selected).slice(0, 32)
}

const formatCompactPassagesForPrompt = (
  passages: RetrievedAstrologyPassage[],
  limit = 8,
  excerptLength = 650
) =>
  passages.length
    ? passages
        .slice(0, limit)
        .map(
          (passage, index) =>
            `${index + 1}. [${passage.id}] Topic: ${passage.section}\nCitation: ${
              passage.citation
            }\nExcerpt: ${compactPromptText(passage.text, excerptLength)}`
        )
        .join("\n\n")
    : "No BPHS passages retrieved."

const buildDrishtiPromptPack = (chart: PrashnaChart) => {
  const aspects = Array.isArray(chart.aspects) ? chart.aspects : []
  const houseSynthesis = Array.isArray(chart.houseSynthesis)
    ? chart.houseSynthesis
    : []

  return JSON.stringify(
    {
      instruction:
        "Use this deterministic drishti table. Do not invent drishti. Every major prediction should combine house lord, placed grahas, drishti received, dignity, and current dasha.",
      graha_drishti: aspects.map((aspect) => ({
        from: `${aspect.fromPlanet} H${aspect.fromHouse} ${aspect.fromSign}`,
        to: `H${aspect.toHouse} ${aspect.toSign}`,
        type: aspect.aspectType,
        theme: aspect.theme,
        interpretation: aspect.interpretation,
      })),
      house_synthesis: houseSynthesis.map((house) => ({
        house: house.house,
        sign: house.sign,
        lord: house.signLord,
        theme: house.theme,
        planets: (house as any).planetsPlacedPlaced,
        drishti_from: house.aspectsReceived.map((aspect) => aspect.fromPlanet),
        synthesis: house.synthesis,
      })),
    },
    null,
    2
  )
}

const buildPrompt = ({
  name,
  chart,
  detectedYogas,
  detectedCases,
  stones,
  healthIndicators,
  criticalPeriod,
  targetedRemedySeeds,
  subQuestions,
  language,
  knowledgePassages,
}: {
  name: string
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  stones: ReturnType<typeof getStoneRecommendations>
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  targetedRemedySeeds: TargetedRemedy[]
  subQuestions: string[]
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  [
    "You are Shreem Astrology's Vedic Kundli analysis assistant.",
    "Start by answering the user's exact question directly. This answer must appear only in sub_question_answers[0] and in the first prediction_table row with area User question. Do not copy the same wording into summary, current_period_analysis, dasha_predictions, or any other row.",
    "The final page order is: direct user answer, current dasha, detailed life-area predictions, action plan, risk/health/remedies, then technical chart proof. Write the JSON so the frontend can render in that order.",
    "Make prediction_table highly detailed and user-facing. Required useful rows after User question are: Current dasha, Career and Professional Growth, Money and Wealth Building, Business and Entrepreneurship, Health and Mental Wellbeing, Relationship and Marriage/Public Dealing, Family Home Land and Vehicles, Foreign Travel Spiritual Growth and Isolation, Education Skills Intelligence, Next 30 Days, Next 3 Months, Next 12 Months. Each row must have precise chart_basis, prediction, and advice.",
    "For career, wealth, business, health, and relationship, give high-precision synthesis using Lagna, Moon, 2nd/6th/7th/8th/9th/10th/11th/12th houses, house lords, placed grahas, drishti, dignity, Bhava Chalit delivery, and active Mahadasha-Antardasha-Pratyantar. Avoid generic motivational text.",
    "The summary must be a short 4 to 6 line overview of the whole chart, not a repeat of the user question answer.",
    "current_period_analysis must explain Rahu/Mercury/Jupiter or the active dasha sequence only, not repeat the direct user question answer.",
    "dasha_predictions must discuss Mahadasha, Antardasha and Pratyantar separately, not repeat the direct user question answer.",
    "Never answer the same user question more than once. If sub_question_answers has the answer, other sections should refer to wider life areas and timing without repeating the same paragraph.",
    "Disclaimer: All insights are AI-generated based on astrological principles.",
    "Use only the calculated chart data and deterministic yoga detections below. Do not invent yogas that are not present.",
    "The chart calculation layer is authoritative. Do not move planets into different houses, do not alter Lagna, and do not infer chart facts that are absent.",
    "Graha drishti discipline: use deterministic_drishti_pack. For each key area, explain placed grahas + house lord + drishti received + dasha. Do not give isolated planet-in-house results.",
    "Use the Rashi/Lagna chart for sign dignity, graha ownership, yogas, debility/exaltation, conjunctions, and classical combinations. Use Bhava Chalit for practical house impact, lived results, timing delivery, health-risk house activation, and real-world manifestation.",
    "Bhava Chalit is calculated from Sripati bhava madhya and sandhi boundaries. Use bhava_impact_percent to judge delivery strength: strong planets near bhava madhya deliver clearly; sandhi/weak planets deliver mixed, delayed, or transitional effects.",
    "If rashi_house and bhava_house differ, explain the difference plainly: Rashi shows the graha's sign/yoga condition, while Bhava Chalit shows where its result is likely delivered. Do not ignore Bhava Chalit even when the selected panchang mode is whole-sign.",
    "Use the retrieved evidence as a two-layer RAG system. First use Shreem curated Parashari rules for section structure and exact life-area judgement. Then use BPHS passages for classical dasha, yoga, remedy and supporting language. Do not let a generic dasha passage override a section-specific curated rule.",
    "For career, wealth, health, relationship, property and foreign/spiritual rows, use the matching curated pack first. BPHS dasha passages may adjust timing but must not become the whole prediction.",
    "Every prediction_table row must mention a concrete chart basis: house/lord/planet/dignity/drishti/Bhava Chalit/dasha. Avoid generic results even if BPHS passage is broad.",
    "If BPHS passage is dasha-focused, use it only for timing and dasha effects unless the row itself is Current dasha or dasha_predictions.",
    "First read Vimshottari timing: Mahadasha, Antardasha, and Pratyantar lord placement by house, sign, dignity, association, and relevant houses. Then explain how the BPHS reference pack modifies timing and outcomes.",
    "For past windows, phrase as 'you may have seen' or 'often shows' so the person can validate. For current/future windows, phrase as preparation and watch periods.",
    "When two strong combinations coexist, synthesize them rather than listing them separately. Example: if Gajakesari support and Kaal Sarp/Rahu-Ketu pressure both appear, judge which dominates by dasha, house relevance, and afflicted/protective grahas.",
    "When a retrieved note identifies a later convention such as Kaal Sarp, say so plainly and judge it through Rahu/Ketu, houses, dignity, and dasha.",
    "Use detected_structured_cases as the main special-case audit. For Kaal Sarp include exact type/status; for Neechabhanga include whether it is raw debility, partial cancellation, or a multi-planet cluster. For all cases, judge the combined effect, not isolated planet snippets.",
    "Return special_case_readings from detected_structured_cases. Each solution must connect the user's pain point to the detected case, active dasha, and BPHS reference pack; do not give generic pooja advice.",
    "Follow calculation-first discipline: if a combination is partial, call it partial and explain what supports or weakens it.",
    "Cover special astrological cases when indicated, including Kaal Sarp, Manglik/Mars sensitivity, debilitation, possible Neechabhanga, Gajakesari, Budhaditya, and Chandra-Mangal.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Do not duplicate content: if an idea is already in sub_question_answers, do not repeat it again in summary, special_case_readings, and prediction_table with the same wording.",
    "Keep special_case_readings concise. Return at most 5 cases. Each combined_effect must be one focused sentence, timing one short phrase, and solution one practical line.",
    "For special_cases, return short labels only, not long explanations. Put explanations in special_case_readings only when truly relevant to the user's question.",
    "Write one focused Kundli reading. Do not run a separate deep audit, do not create case packs, and do not over-extend event predictions.",
    "Also consider period timing from Vimshottari Mahadasha, Antardasha, and Pratyantar Dasha. Keep period analysis grounded in the dasha lords and their houses/signs.",
    "Organize the reading in this order: direct answer to the asked question, active Vimshottari dasha judgement, chart proof, BPHS/RAG proof, timing, caution, remedies, then only the detailed sections that are relevant to the user question. Avoid repeating the same idea across summary, prediction_table, dasha_predictions, and sub_question_answers.",
    "Health analysis must be deeper than generic caution: name likely vulnerability areas and possible disease tendencies from chart indicators, but use cautious language like tendency/watch/monitor. Do not diagnose. Tell the user to consult a qualified doctor for symptoms, emergencies, or persistent issues.",
    "Medical astrology safety rule: never say someone will get cancer, diabetes, accident, or serious disease. Say 'watch period', 'screening signal', 'higher preventive attention', or 'consult a doctor' only. Do not create fear.",
    "Use deterministic_critical_period_analysis for Marakesh, Badhakesh, Rahu/Ketu, 6th/8th/12th, accident, chronic, and medical watch timing. Explain it as a prevention calendar.",
    "Include a Markesh/Badhakesh row in prediction_table when active_triggers or watch_periods exist. Include a Bad Period / Preventive Health Watch row when medical_watchlist has items.",
    "Accident or major-incident analysis must be framed only as watch periods and preventive care. Mention it only when 6th/8th/12th houses, Mars/Saturn/Rahu/Ketu, and active dasha signals support it. Never guarantee harm or use frightening certainty.",
    "Return health_indicators with 3 to 5 specific watchlist items. Each item must include chart basis and a practical prevention note in one complete sentence.",
    "Return dasha_predictions with one row each for Mahadasha, Antardasha, and Pratyantar. Use dasha_pack as the main classical basis, and do not let dasha_pack replace career_pack, wealth_pack, health_pack, or relationship_pack in their own sections.",
    "Return special_case_readings with the 3 to 5 most important detected cases. If BPHS does not directly name a modern case such as Kaal Sarp, say the classical basis is Rahu-Ketu, house, dasha, and affliction logic from the retrieved pack.",
    "Do not return risk_watch unless there is a clear 6th/8th/12th plus active dasha trigger.",
    "Return prediction_table with non-duplicate rows only. If user_questions are present, the first row must be area: User question and must answer the first user question once. Then include Current dasha plus detailed life-area rows for career, wealth, business, health, relationship, family/home/property, foreign/spiritual, education/skills, and practical timing. Each row must include chart_basis, prediction, and advice.",
    "Do not return planet_effects; the server generates graha-by-graha rows from the calculated chart.",
    "Answer at most three sub-questions. If no sub-questions are provided, return an empty sub_question_answers array.",
    "Every sub-question answer must be a direct standalone answer to the exact question asked. Start the answer with yes/no/likely/unlikely/mixed when the question asks for an outcome. Then cite chart reason using Lagna, Moon sign/nakshatra, house/lord, graha placement, and active Mahadasha/Antardasha/Pratyantar where relevant. Do not answer from generic intuition.",
    "If a yoga is not detected, do not claim it exists. Mention uncertainty clearly.",
    "Give remedies as Vedic practices: mantra, daan, vrata, worship, discipline, and seva.",
    "Return targeted_remedies with 3 to 6 exact pain-point remedies. Each row must map pain_point -> chart_basis -> mantra_or_pooja -> daily_practice. Avoid generic advice like simply do pooja; name the graha, day, mantra or deity, and the pain point it addresses.",
    "Gemstone guidance must only use the provided 1st, 5th, and 9th house lord stone indicators. Do not recommend a separate rashi/Moon stone unless it is already one of those trinal house indicators.",
    "Keep every string complete and self-contained. Do not end mid-sentence, do not use trailing ellipses, and prefer fewer complete rows over many unfinished rows.",
    "Never give medical, legal, or financial certainty. Gemstones must always redirect to expert review before wearing.",
    "If strong dosha, gemstone, pooja, marriage, health, or career-defining guidance appears, set expert_call_recommended true and recommend Sanjay Kumar Pandey.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only. Return only the fields allowed by the response schema.",
    "Analysis mode: standard",
    `Native name: ${name || "Not provided"}`,
    `Sub-questions: ${JSON.stringify(subQuestions)}`,
    `Retrieved classical reference pack: ${formatCompactPassagesForPrompt(
      knowledgePassages,
      6,
      520
    )}`,
    `Active dasha discipline: ${activeDashaText(chart)}`,
    `Deterministic health watchlist: ${JSON.stringify(healthIndicators)}`,
    `Deterministic critical period analysis: ${JSON.stringify(criticalPeriod)}`,
    `Deterministic targeted remedy seeds: ${JSON.stringify(
      targetedRemedySeeds
    )}`,
    `Chart: ${JSON.stringify({
      generated_at: chart.generatedAtLocal,
      city: `${chart.city.name}, ${chart.city.region}`,
      panchang: chart.panchangSystem,
      house_system: chart.houseSystem,
      calculation_system: chart.calculationSystem,
      lagna: chart.ascendant,
      moon_sign: chart.moonSign,
      tithi: chart.tithi,
      nakshatra: `${chart.nakshatra} pada ${chart.nakshatraPada}`,
      dasha: chart.dasha,
      planets: chart.planets.map((planet) => ({
        graha: planet.name,
        sign: planet.sign,
        degree: planet.signDegree,
        house: planet.house,
        rashi_house: planet.rashiHouse,
        bhava_house: planet.bhavaHouse,
        bhava_cusp_degree: planet.bhavaCuspDegree,
        bhava_distance_from_cusp: planet.bhavaDistanceFromCusp,
        bhava_impact_percent: planet.bhavaImpactPercent,
        bhava_impact_state: planet.bhavaImpactState,
        house_note: planet.houseNote,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        retrograde: Boolean(planet.retrograde),
      })),
      houses: chart.houses.map((house) => ({
        ...house,
        selected_planets: chart.planets
          .filter((planet) => planet.house === house.house)
          .map((planet) => planet.name),
        rashi_planets: chart.planets
          .filter((planet) => (planet.rashiHouse || planet.house) === house.house)
          .map((planet) => planet.name),
        bhava_chalit_planets: chart.planets
          .filter((planet) => (planet.bhavaHouse || planet.house) === house.house)
          .map((planet) => planet.name),
      })),
      bhava_chalit_shift_summary: chart.planets
        .filter(
          (planet) =>
            typeof planet.rashiHouse === "number" &&
            typeof planet.bhavaHouse === "number" &&
            planet.rashiHouse !== planet.bhavaHouse
        )
        .map((planet) => ({
          graha: planet.name,
          rashi_house: planet.rashiHouse,
          bhava_house: planet.bhavaHouse,
          bhava_impact_percent: planet.bhavaImpactPercent,
          bhava_impact_state: planet.bhavaImpactState,
          bhava_distance_from_cusp: planet.bhavaDistanceFromCusp,
          reading_rule:
            "Judge dignity/yoga by sign and Rashi house; judge lived house result through Bhava Chalit house and its impact percent from bhava madhya.",
        })),
    })}`,
    `Detected cases: ${JSON.stringify(detectedYogas)}`,
    `Detected structured cases: ${JSON.stringify(detectedCases)}`,
    `Trinal stone indicators: ${JSON.stringify(stones)}`,
  ].join("\n")

const buildSpecialCaseReadings = ({
  chart,
  detectedCases,
  targetedRemedySeeds,
  knowledgePassages,
}: {
  chart: PrashnaChart
  detectedCases: DetectedAstrologyCase[]
  targetedRemedySeeds: TargetedRemedy[]
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  selectPriorityCases(detectedCases)
    .slice(0, 5)
    .map((detectedCase, index) => {
      const activePeriod = chart.dasha
        ? [
            chart.dasha.mahadasha,
            chart.dasha.antardasha,
            chart.dasha.pratyantar,
          ]
            .filter((period): period is DashaPeriod => Boolean(period))
            .find((period) => detectedCase.planets.includes(period.lord))
        : undefined
      const remedy = targetedRemedySeeds.find((item) =>
        detectedCase.planets.some((planet) =>
          item.chart_basis.toLowerCase().includes(planet.toLowerCase())
        )
      )
      const passage = knowledgePassages[index] || knowledgePassages[0]

      return {
        case_name: detectedCase.subtype
          ? `${detectedCase.name}: ${detectedCase.subtype}`
          : detectedCase.name,
        chart_basis: detectedCase.chart_basis,
        classical_basis: passage?.citation
          ? `${passage.citation}. Applied through chart facts, dasha lordship, and house impact.`
          : "BPHS retrieval was prepared; apply the case through graha, house, dignity, and dasha logic.",
        combined_effect: detectedCase.combined_effect,
        timing: activePeriod
          ? `${activePeriod.lord} ${activePeriod.level} is active (${getPeriodWindow(activePeriod)}), so this case is more visible now.`
          : `More visible during ${detectedCase.planets
              .map((planet) => findPlanetActivationWindow(chart, planet))
              .slice(0, 2)
              .join("; ")}.`,
        solution: remedy
          ? `${remedy.mantra_or_pooja} ${remedy.daily_practice}`
          : "Use steady discipline, daan, mantra, and expert review before strong gemstone or pooja decisions.",
      }
    })

const buildFallbackKundliAnalysis = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  criticalPeriod,
  targetedRemedySeeds,
  knowledgePassages,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  targetedRemedySeeds: TargetedRemedy[]
  knowledgePassages: RetrievedAstrologyPassage[]
}) => {
  const dashaRows = chart.dasha
    ? [
        chart.dasha.mahadasha,
        chart.dasha.antardasha,
        chart.dasha.pratyantar,
      ].map((period) => ({
        period: `${period.lord}: ${period.startLabel} to ${period.endLabel}`,
        chart_basis:
          planetPlacementText(chart, [period.lord]) ||
          `${period.lord} is active in the Vimshottari sequence.`,
        classical_basis:
          knowledgePassages[0]?.citation ||
          "BPHS reference retrieval was prepared for dasha interpretation.",
        prediction:
          "The period should be judged from the active lord's house, sign, dignity, association, and the houses it owns. Retry the AI interpretation to expand this into a full BPHS synthesis.",
        action:
          "Use this as a watch window, keep practical discipline, and avoid fear-based conclusions without a full expert reading.",
      }))
    : []
  const mainCases = selectPriorityCases(detectedCases).slice(0, 4)

  return {
    summary:
      "The chart calculation completed, but the AI interpretation did not finish cleanly. This fallback keeps the calculated Kundli, dasha, yogas, health watchlist, and remedies visible so the session is not lost; use Retry same Kundli for the full BPHS narrative.",
    person_information: `${chart.ascendant} Lagna, Moon in ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}. ${activeDashaText(
      chart
    )}`,
    temperament:
      "Temperament should be read through Lagna, Moon, Sun, and Mercury placements. The chart facts are preserved below for retry and expert review.",
    behavioral_traits: [
      `Lagna: ${chart.ascendant}`,
      `Moon: ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}`,
      `Current dasha: ${
        chart.dasha
          ? `${chart.dasha.mahadasha.lord}-${chart.dasha.antardasha.lord}-${chart.dasha.pratyantar.lord}`
          : "unavailable"
      }`,
    ],
    strengths: detectedYogas.slice(0, 4),
    life_themes: chart.houses
      .slice(0, 4)
      .map((house) => `House ${house.house}: ${house.sign} for ${house.theme}`),
    career_direction:
      getImportantHouseBasis(chart, [10, 11, 2]) ||
      "Career needs the 10th, 11th, and 2nd house synthesis.",
    relationship_pattern:
      getImportantHouseBasis(chart, [7, 2, 4]) ||
      "Relationship needs the 7th house, Venus/Jupiter, and Moon synthesis.",
    health_caution:
      healthIndicators[0] ||
      "No deterministic health watchlist was produced; medical concerns still need qualified care.",
    health_indicators: healthIndicators,
    current_period_analysis: activeDashaText(chart),
    dasha_predictions: dashaRows,
    risk_watch: [
      ...criticalPeriod.watch_periods.map((period) => ({
        theme: `Marakesh/Badhakesh watch: ${period.lord}`,
        chart_basis: `${period.lord} is active as ${period.period}; role: ${period.role}.`,
        dasha_trigger: period.window,
        prevention: period.caution,
      })),
      ...criticalPeriod.medical_watchlist.slice(0, 6).map((signal) => ({
        theme: `Preventive watch: ${signal.condition}`,
        chart_basis: signal.chart_basis,
        dasha_trigger: signal.dasha_trigger,
        prevention: signal.prevention,
      })),
      ...healthIndicators.slice(0, 2).map((indicator) => ({
        theme: "Preventive health watch",
        chart_basis: indicator,
        dasha_trigger: activeDashaText(chart),
        prevention:
          "Use medical checkups, sleep discipline, hydration, and moderation; retry for the detailed BPHS reading.",
      })),
    ].slice(0, 10),
    prediction_table: [
      {
        area: "Marakesh and Badhakesh calculator",
        chart_basis: `Maraka lords: ${criticalPeriod.maraka_lords.join(
          ", "
        ) || "not available"}; Badhaka house: ${
          criticalPeriod.badhaka_house
        }; Badhakesh: ${criticalPeriod.badhakesh || "not available"}.`,
        prediction:
          criticalPeriod.active_triggers.join(" | ") ||
          "No active Marakesh/Badhakesh trigger is prominent in the current Mahadasha-Antardasha-Pratyantar.",
        advice:
          "Use this as a prevention calendar and screening reminder, not as a fatalistic prediction.",
      },
      {
        area: "Bad period and medical watch calculator",
        chart_basis:
          criticalPeriod.medical_watchlist
            .slice(0, 5)
            .map((signal) => `${signal.condition}: ${signal.chart_basis}`)
            .join(" | ") || "No strong medical watch signal crossed the threshold.",
        prediction:
          "The watchlist highlights periods for extra caution, health screening, safe driving, and disciplined routines.",
        advice:
          "Astrology cannot diagnose cancer or any disease. Consult a qualified doctor for symptoms, screening, or emergency care.",
      },
      {
        area: "Current period",
        chart_basis: activeDashaText(chart),
        prediction:
          "The dasha sequence is calculated and ready for interpretation.",
        advice: "Retry the AI explanation to continue from this same chart.",
      },
    ],
    planet_effects: buildPlanetEffects(chart),
    special_case_readings: buildSpecialCaseReadings({
      chart,
      detectedCases,
      targetedRemedySeeds,
      knowledgePassages,
    }),
    likely_challenges: detectedYogas.slice(0, 5),
    issue_analysis: mainCases.map((item) => item.combined_effect),
    practical_solutions: targetedRemedySeeds.map((item) => item.daily_practice),
    spiritual_guidance:
      "Use simple mantra, daan, discipline, and expert review for strong dosha, gemstone, health, or marriage decisions.",
    sub_question_answers: [],
    special_cases: detectedYogas,
    upaay: targetedRemedySeeds.map((item) => item.mantra_or_pooja),
    targeted_remedies: targetedRemedySeeds,
    book_citations: knowledgePassages.slice(0, 6).map((passage) => ({
      citation: passage.citation,
      relevance: "Retrieved for the failed AI interpretation retry context.",
    })),
    expert_call_recommended: true,
    expert_call_reason:
      "The AI interpretation failed after retries, so strong guidance should be reviewed by Sanjay Kumar Pandey rather than inferred from a partial answer.",
  }
}


const compactUsageText = (value: unknown, max = 2200) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

const compactUsageArray = (value: unknown, limit = 12, maxItem = 1200) =>
  Array.isArray(value)
    ? value
        .slice(0, limit)
        .map((item) =>
          typeof item === "string"
            ? item.trim().slice(0, maxItem)
            : item && typeof item === "object"
            ? item
            : String(item || "").slice(0, maxItem)
        )
        .filter(Boolean)
    : []

const compactChartForUsage = (chart: PrashnaChart) => ({
  ascendant: chart.ascendant,
  moonSign: chart.moonSign,
  nakshatra: chart.nakshatra,
  nakshatraPada: chart.nakshatraPada,
  panchangSystem: chart.panchangSystem,
  houseSystem: chart.houseSystem,
  dasha: chart.dasha,
  planets: chart.planets.map((planet) => ({
    name: planet.name,
    sign: planet.sign,
    house: planet.house,
    rashiHouse: planet.rashiHouse,
    bhavaHouse: planet.bhavaHouse,
    nakshatra: planet.nakshatra,
    pada: planet.pada,
    dignity: getPlanetDignity(planet),
    retrograde: planet.retrograde,
  })),
  houses: chart.houses.map((house) => ({
    house: house.house,
    sign: house.sign,
    signLord: house.signLord,
    theme: house.theme,
  })),
})

const compactKnowledgeTraceForUsage = (
  passages: RetrievedAstrologyPassage[]
) =>
  passages.slice(0, 14).map((passage) => ({
    id: passage.id,
    source: passage.source,
    section: passage.section,
    citation: passage.citation,
    score: Number(passage.score.toFixed(4)),
    excerpt: compactUsageText(passage.text, 700),
  }))

const compactKundliAnalysisForUsage = (analysis: any) => ({
  summary: compactUsageText(analysis?.summary, 3500),
  person_information: compactUsageText(analysis?.person_information, 2500),
  temperament: compactUsageText(analysis?.temperament, 2200),
  behavioral_traits: compactUsageArray(analysis?.behavioral_traits, 12, 700),
  strengths: compactUsageArray(analysis?.strengths, 12, 700),
  life_themes: compactUsageArray(analysis?.life_themes, 12, 700),
  career_direction: compactUsageText(analysis?.career_direction, 3000),
  relationship_pattern: compactUsageText(analysis?.relationship_pattern, 3000),
  health_caution: compactUsageText(analysis?.health_caution, 3000),
  current_period_analysis: compactUsageText(
    analysis?.current_period_analysis,
    3500
  ),
  prediction_table: Array.isArray(analysis?.prediction_table)
    ? analysis.prediction_table.slice(0, 18).map((row: any) => ({
        area: compactUsageText(row?.area, 180),
        chart_basis: compactUsageText(row?.chart_basis, 1600),
        prediction: compactUsageText(row?.prediction, 2200),
        advice: compactUsageText(row?.advice, 1200),
      }))
    : [],
  dasha_predictions: Array.isArray(analysis?.dasha_predictions)
    ? analysis.dasha_predictions.slice(0, 8).map((row: any) => ({
        period: compactUsageText(row?.period, 180),
        chart_basis: compactUsageText(row?.chart_basis, 1200),
        classical_basis: compactUsageText(row?.classical_basis, 1200),
        prediction: compactUsageText(row?.prediction, 1800),
        action: compactUsageText(row?.action, 1000),
      }))
    : [],
  sub_question_answers: Array.isArray(analysis?.sub_question_answers)
    ? analysis.sub_question_answers.slice(0, 3).map((row: any) => ({
        question: compactUsageText(row?.question, 1000),
        answer: compactUsageText(row?.answer, 3000),
        chart_reason: compactUsageText(row?.chart_reason, 2200),
      }))
    : [],
  special_case_readings: Array.isArray(analysis?.special_case_readings)
    ? analysis.special_case_readings.slice(0, 8).map((row: any) => ({
        name: compactUsageText(row?.name, 220),
        chart_basis: compactUsageText(row?.chart_basis, 1200),
        classical_basis: compactUsageText(row?.classical_basis, 1200),
        prediction: compactUsageText(row?.prediction, 1800),
      }))
    : [],
  targeted_remedies: Array.isArray(analysis?.targeted_remedies)
    ? analysis.targeted_remedies.slice(0, 8)
    : [],
  expert_call_recommended: Boolean(analysis?.expert_call_recommended),
  expert_call_reason: compactUsageText(analysis?.expert_call_reason, 1500),
})

const buildKundliUsageRecordPayload = ({
  result,
  chart,
  knowledgePassages,
  detectedCases,
  healthIndicators,
  criticalPeriod,
  targetedRemedySeeds,
}: {
  result: any
  chart: PrashnaChart
  knowledgePassages: RetrievedAstrologyPassage[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  targetedRemedySeeds: TargetedRemedy[]
}) => ({
  profile: result.profile,
  chart: compactChartForUsage(chart),
  detected_yogas: compactUsageArray(result.detected_yogas, 20, 1200),
  detected_cases: detectedCases.slice(0, 14),
  knowledge_references: getKnowledgeIds(knowledgePassages).slice(0, 20),
  knowledge_context: compactKnowledgeTraceForUsage(knowledgePassages),
  stones: Array.isArray(result.stones) ? result.stones.slice(0, 12) : result.stones,
  health_indicators: healthIndicators.slice(0, 20),
  critical_period_analysis: criticalPeriod,
  targeted_remedy_seeds: targetedRemedySeeds.slice(0, 12),
  analysis: compactKundliAnalysisForUsage(result.analysis),
  analysis_mode: result.analysis_mode,
  usage_units: result.usage_units,
  model: result.model,
})


export async function POST(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to generate a Kundli." },
      { status: 401 }
    )
  }

  const payload = (await request.json().catch(() => null)) as KundliPayload | null

  if (!payload) {
    return NextResponse.json(
      { message: "We could not read the Kundli request." },
      { status: 400 }
    )
  }

  const name = sanitizeString(payload.name, 120)
  const birthDate = sanitizeString(payload.birthDate, 20)
  const birthTime = sanitizeString(payload.birthTime, 20)
  const gender = sanitizeString(payload.gender, 40)
  const rawLanguage = sanitizeString(payload.language, 20)
  const language =
    rawLanguage === "hindi" || rawLanguage === "hinglish"
      ? rawLanguage
      : "english"
  const usageUnits = 1
  const city = getCityById(sanitizeString(payload.cityId, 80))
  const subQuestions = sanitizeStringArray(payload.subQuestions, 3, 220)
  const panchangSystemId = sanitizeString(payload.panchangSystemId, 40)
  const normalizedBirthDate = parseBirthDateInput(birthDate)

  if (!normalizedBirthDate || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return NextResponse.json(
      {
        message:
          "Add a valid birth date and time. Indian dates can be DD/MM/YYYY.",
      },
      { status: 400 }
    )
  }

  const birthDateTime = getLocalBirthDate({
    birthDate: normalizedBirthDate,
    birthTime,
    offsetHours: city.utcOffsetHours,
  })

  if (!birthDateTime) {
    return NextResponse.json(
      { message: "Add a valid birth date and time." },
      { status: 400 }
    )
  }

  const chart = buildDetailedPrashnaChart({
    city,
    date: birthDateTime,
    panchangSystemId,
  })
  const detectedCases = detectAstrologyCases(chart)
  const detectedYogas = detectedCases.length
    ? detectedCases.map(formatDetectedCase)
    : detectYogas(chart)
  const stones = getStoneRecommendations(chart)
  const healthIndicators = buildHealthIndicators(chart, detectedYogas)
  const criticalPeriod = buildCriticalPeriodAnalysis(chart)
  const targetedRemedySeeds = buildTargetedRemedySeeds(
    chart,
    detectedYogas,
    healthIndicators
  )
  const knowledgePassages = buildKundliKnowledgePassages({
    chart,
    detectedYogas,
    detectedCases,
    healthIndicators,
    criticalPeriod,
    targetedRemedySeeds,
    subQuestions,
  })

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        message: "Kundli AI is not enabled on this server yet.",
        profile: {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          city: `${city.name}, ${city.region}`,
          panchang_system_id: chart.panchangSystem?.id,
          language,
          sub_questions: subQuestions,
          analysis_mode: "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        critical_period_analysis: criticalPeriod,
        targeted_remedies: targetedRemedySeeds,
        analysis_mode: "standard",
        usage_units: usageUnits,
        retryable: true,
      },
      { status: 503 }
    )
  }

  const access = await checkAstrologyAccess({ requestedUnits: usageUnits })

  if (isAstrologyAccessBlocked(access)) {
    return NextResponse.json(
      {
        message: `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        profile: {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          city: `${city.name}, ${city.region}`,
          panchang_system_id: chart.panchangSystem?.id,
          language,
          sub_questions: subQuestions,
          analysis_mode: "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        critical_period_analysis: criticalPeriod,
        targeted_remedies: targetedRemedySeeds,
        targeted_remedy_seeds: targetedRemedySeeds,
        analysis_mode: "standard",
        usage_units: usageUnits,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
      },
      { status: 429 }
    )
  }

  const prompt = buildPrompt({
    name,
    chart,
    detectedYogas,
    detectedCases,
    stones,
    healthIndicators,
    criticalPeriod,
    targetedRemedySeeds,
    subQuestions,
    language,
    knowledgePassages,
  })
  const gemini = await generateGeminiJson({
    prompt,
    responseSchema: STANDARD_KUNDLI_SCHEMA,
    temperature: 0.22,
    maxOutputTokens: Number(process.env.ASTROLOGY_KUNDLI_MAX_OUTPUT_TOKENS || 12000),
    label: "Kundli API",
  })

  if (!gemini.ok) {
    const fallbackAnalysis = buildFallbackKundliAnalysis({
      chart,
      detectedYogas,
      detectedCases,
      healthIndicators,
      criticalPeriod,
      targetedRemedySeeds,
      knowledgePassages,
    })
    await recordAiUsage({
      tool: "astrology_kundli",
      input: {
        name,
        gender,
        birth_date: birthDate,
        birth_time: birthTime,
        city: `${city.name}, ${city.region}`,
        panchang_system_id: chart.panchangSystem?.id,
        language,
        analysis_mode: "standard",
      },
      response: {
        profile: {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          city: `${city.name}, ${city.region}`,
          panchang_system_id: chart.panchangSystem?.id,
          language,
          sub_questions: subQuestions,
          analysis_mode: "standard",
          usage_units: 0,
        },
        message: "Kundli AI generation failed; deterministic fallback shown.",
        error: gemini.error || "generation_failed",
        retryable: true,
        chart: compactChartForUsage(chart),
        analysis: compactKundliAnalysisForUsage(fallbackAnalysis),
      },
      metadata: {
        customer_email: customer.email,
        analysis_mode: "standard",
        ...getAstrologyBillingMetadata(access),
        billable: false,
        usage_units: 0,
        failed_ai_generation: true,
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
        message:
          "Kundli AI could not finish the full reading right now. The calculated chart and deterministic fallback are preserved below; retry will reuse the same birth details without consuming a successful-reading credit.",
        profile: {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          city: `${city.name}, ${city.region}`,
          panchang_system_id: chart.panchangSystem?.id,
          language,
          sub_questions: subQuestions,
          analysis_mode: "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        critical_period_analysis: criticalPeriod,
        targeted_remedy_seeds: targetedRemedySeeds,
        knowledge_references: getKnowledgeIds(knowledgePassages),
        analysis: fallbackAnalysis,
        analysis_mode: "standard",
        usage_units: usageUnits,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
        retryable: true,
      },
      { status: 200 }
    )
  }

  const parsed = gemini.parsed
  const analysis = {
    summary: sanitizeString(parsed?.summary, 4000),
    person_information: sanitizeString(parsed?.person_information, 4000),
    temperament: sanitizeString(parsed?.temperament, 4000),
    behavioral_traits: sanitizeStringArray(parsed?.behavioral_traits, 20, 2000),
    strengths: sanitizeStringArray(parsed?.strengths, 20, 2000),
    life_themes: sanitizeStringArray(parsed?.life_themes, 20, 2000),
    career_direction: sanitizeString(parsed?.career_direction, 4000),
    relationship_pattern: sanitizeString(parsed?.relationship_pattern, 4000),
    health_caution: sanitizeString(parsed?.health_caution, 4000),
    health_indicators:
      sanitizeStringArray(parsed?.health_indicators, 20, 2000).length > 0
        ? sanitizeStringArray(parsed?.health_indicators, 20, 2000)
        : healthIndicators,
    current_period_analysis: sanitizeString(
      parsed?.current_period_analysis,
      4000
    ),
    dasha_predictions: Array.isArray(parsed?.dasha_predictions)
      ? parsed.dasha_predictions
          .map((item: any) => ({
            period: sanitizeString(item?.period, 500),
            chart_basis: sanitizeString(item?.chart_basis, 2000),
            classical_basis: sanitizeString(item?.classical_basis, 2000),
            prediction: sanitizeString(item?.prediction, 4000),
            action: sanitizeString(item?.action, 2000),
          }))
          .filter(
            (item: {
              period: string
              chart_basis: string
              classical_basis: string
              prediction: string
              action: string
            }) =>
              Boolean(
                item.period &&
                  item.chart_basis &&
                  item.classical_basis &&
                  item.prediction &&
                  item.action
              )
          )
          .slice(0, 10)
      : [],
    risk_watch: Array.isArray(parsed?.risk_watch)
      ? parsed.risk_watch
          .map((item: any) => ({
            theme: sanitizeString(item?.theme, 500),
            chart_basis: sanitizeString(item?.chart_basis, 2000),
            dasha_trigger: sanitizeString(item?.dasha_trigger, 2000),
            prevention: sanitizeString(item?.prevention, 2000),
          }))
          .filter(
            (item: {
              theme: string
              chart_basis: string
              dasha_trigger: string
              prevention: string
            }) =>
              Boolean(
                item.theme &&
                  item.chart_basis &&
                  item.dasha_trigger &&
                  item.prevention
              )
          )
          .slice(0, 10)
      : [],
    prediction_table: Array.isArray(parsed?.prediction_table)
      ? parsed.prediction_table
          .map((item: any) => ({
            area: sanitizeString(item?.area, 500),
            chart_basis: sanitizeString(item?.chart_basis, 2000),
            prediction: sanitizeString(item?.prediction, 4000),
            advice: sanitizeString(item?.advice, 2000),
          }))
          .filter(
            (item: {
              area: string
              chart_basis: string
              prediction: string
              advice: string
            }) =>
              Boolean(
                item.area &&
                  item.chart_basis &&
                  item.prediction &&
                  item.advice
              )
          )
          .slice(0, 20)
      : [],
    special_case_readings: Array.isArray(parsed?.special_case_readings)
      ? parsed.special_case_readings
          .map((item: any) => ({
            case_name: sanitizeString(item?.case_name, 500),
            chart_basis: sanitizeString(item?.chart_basis, 2000),
            classical_basis: sanitizeString(item?.classical_basis, 2000),
            combined_effect: sanitizeString(item?.combined_effect, 4000),
            timing: sanitizeString(item?.timing, 2000),
            solution: sanitizeString(item?.solution, 2000),
          }))
          .filter(
            (item: {
              case_name: string
              chart_basis: string
              combined_effect: string
              solution: string
            }) =>
              Boolean(
                item.case_name &&
                  item.chart_basis &&
                  item.combined_effect &&
                  item.solution
              )
          )
          .slice(0, 10)
      : buildSpecialCaseReadings({
          chart,
          detectedCases,
          targetedRemedySeeds,
          knowledgePassages,
        }),
    planet_effects: Array.isArray(parsed?.planet_effects)
      ? parsed.planet_effects
          .map((item: any) => ({
            planet: sanitizeString(item?.planet, 100),
            placement: sanitizeString(item?.placement, 1000),
            life_area: sanitizeString(item?.life_area, 1000),
            activation_period: sanitizeString(item?.activation_period, 500),
            effect: sanitizeString(item?.effect, 2000),
            likely_effect: sanitizeString(item?.likely_effect, 2000),
            advice: sanitizeString(item?.advice, 2000),
          }))
          .filter(
            (item: {
              planet: string
              placement: string
              effect: string
              advice: string
            }) => Boolean(item.planet && item.effect)
          )
          .slice(0, 20)
      : buildPlanetEffects(chart),
    likely_challenges: sanitizeStringArray(parsed?.likely_challenges, 20, 2000),
    issue_analysis: sanitizeStringArray(parsed?.issue_analysis, 20, 2000),
    practical_solutions: sanitizeStringArray(parsed?.practical_solutions, 20, 2000),
    spiritual_guidance: sanitizeString(parsed?.spiritual_guidance, 4000),
    sub_question_answers: Array.isArray(parsed?.sub_question_answers)
      ? parsed.sub_question_answers
          .map((item: any) => ({
            question: sanitizeString(item?.question, 1000),
            answer: sanitizeString(item?.answer, 4000),
            chart_reason: sanitizeString(item?.chart_reason, 2000),
          }))
          .filter(
            (item: { question: string; answer: string; chart_reason: string }) =>
              Boolean(item.question && item.answer)
          )
          .slice(0, 10)
      : [],
    special_cases: Array.isArray(parsed?.special_cases)
      ? parsed.special_cases
          .map((item: unknown) => sanitizeString(item, 2000))
          .filter(Boolean)
          .slice(0, 20)
      : detectedYogas,
    upaay: Array.isArray(parsed?.upaay)
      ? parsed.upaay
          .map((item: unknown) => sanitizeString(item, 2000))
          .filter(Boolean)
          .slice(0, 20)
      : [],
    targeted_remedies: Array.isArray(parsed?.targeted_remedies)
      ? parsed.targeted_remedies
          .map((item: any) => ({
            pain_point: sanitizeString(item?.pain_point, 500),
            chart_basis: sanitizeString(item?.chart_basis, 2000),
            mantra_or_pooja: sanitizeString(item?.mantra_or_pooja, 2000),
            daily_practice: sanitizeString(item?.daily_practice, 2000),
          }))
          .filter((item: TargetedRemedy) =>
            Boolean(
              item.pain_point &&
                item.chart_basis &&
                item.mantra_or_pooja &&
                item.daily_practice
            )
          )
          .slice(0, 15)
      : targetedRemedySeeds,
    book_citations: sanitizeBookCitations(parsed?.book_citations),
    expert_call_recommended: Boolean(parsed?.expert_call_recommended),
    expert_call_reason: sanitizeString(parsed?.expert_call_reason, 4000),
  }

  const deterministicRiskWatch = [
    ...criticalPeriod.watch_periods.map((period) => ({
      theme: `Marakesh/Badhakesh watch: ${period.lord}`,
      chart_basis: `${period.lord} is active as ${period.period}; role: ${period.role}.`,
      dasha_trigger: period.window,
      prevention: period.caution,
    })),
    ...criticalPeriod.medical_watchlist.map((signal) => ({
      theme: `Preventive watch: ${signal.condition}`,
      chart_basis: signal.chart_basis,
      dasha_trigger: signal.dasha_trigger,
      prevention: signal.prevention,
    })),
  ]

  analysis.risk_watch = [
    ...deterministicRiskWatch,
    ...analysis.risk_watch,
  ]
    .filter(
      (item, index, items) =>
        item.theme &&
        items.findIndex(
          (candidate) =>
            candidate.theme === item.theme &&
            candidate.chart_basis === item.chart_basis
        ) === index
    )
    .slice(0, 10)

  const deterministicPredictionRows = [
    {
      area: "Marakesh and Badhakesh calculator",
      chart_basis: `Maraka lords: ${criticalPeriod.maraka_lords.join(
        ", "
      ) || "not available"}; Badhaka house: ${
        criticalPeriod.badhaka_house
      }; Badhakesh: ${criticalPeriod.badhakesh || "not available"}.`,
      prediction:
        criticalPeriod.active_triggers.join(" | ") ||
        "No active Marakesh/Badhakesh trigger is prominent in the current Mahadasha-Antardasha-Pratyantar.",
      advice:
        "Use this as a prevention calendar and screening reminder, not as a fatalistic prediction.",
    },
    {
      area: "Bad period and medical watch calculator",
      chart_basis:
        criticalPeriod.medical_watchlist
          .slice(0, 5)
          .map((signal) => `${signal.condition}: ${signal.chart_basis}`)
          .join(" | ") || "No strong medical watch signal crossed the threshold.",
      prediction:
        "The watchlist highlights periods for extra caution, health screening, safe driving, and disciplined routines.",
      advice:
        "Astrology cannot diagnose cancer or any disease. Consult a qualified doctor for symptoms, screening, or emergency care.",
    },
  ]

  analysis.prediction_table = [
    ...deterministicPredictionRows,
    ...analysis.prediction_table,
  ]
    .filter(
      (item, index, items) =>
        item.area &&
        items.findIndex((candidate) => candidate.area === item.area) === index
    )
    .slice(0, 22)

  analysis.health_indicators = [
    ...healthIndicators,
    ...analysis.health_indicators,
  ]
    .filter((item, index, items) => item && items.indexOf(item) === index)
    .slice(0, 20)

  const ensuredSubQuestionAnswers =
    analysis.sub_question_answers.length > 0
      ? analysis.sub_question_answers
      : subQuestions.filter(Boolean).slice(0, 3).map((question) => {
          const currentDasha = chart.dasha
            ? `${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar`
            : "Vimshottari dasha unavailable"
          const bestPrediction =
            analysis.prediction_table.find((row: any) =>
              ["user question", "current dasha", "current period"].some((term) =>
                row.area.toLowerCase().includes(term)
              )
            )?.prediction ||
            analysis.dasha_predictions[0]?.prediction ||
            analysis.summary ||
            analysis.current_period_analysis ||
            "The calculated chart is available, but the AI did not return a focused answer for this question."

          const bestReason =
            analysis.prediction_table[0]?.chart_basis ||
            analysis.dasha_predictions[0]?.chart_basis ||
            `${chart.ascendant} Lagna, Moon in ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}; active period: ${currentDasha}.`

          return {
            question,
            answer: bestPrediction,
            chart_reason: bestReason,
          }
        })

  analysis.sub_question_answers = ensuredSubQuestionAnswers


  const normalizeQuestionText = (value: unknown, maxLength = 3000) =>
    typeof value === "string" ? value.trim().slice(0, maxLength) : ""

  const normalizeQuestionSearchText = (value: unknown) =>
    normalizeQuestionText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim()

  const isWeakQuestionAnswer = (value: unknown) => {
    const normalized = normalizeQuestionSearchText(value)

    return (
      !normalized ||
      normalized.length < 80 ||
      normalized.includes("ai did not return") ||
      normalized.includes("did not directly answer") ||
      normalized.includes("chart is available") ||
      normalized.includes("calculated chart is available") ||
      normalized.includes("generic reading") ||
      normalized.includes("retry the ai") ||
      normalized.includes("could not finish")
    )
  }

  const buildFocusedQuestionContext = () => {
    const usefulHouses = [1, 2, 5, 6, 7, 8, 9, 10, 11, 12]
    const houseText = chart.houses
      ?.filter((house) => usefulHouses.includes(house.house))
      .map(
        (house) =>
          `House ${house.house}: ${house.sign}, lord ${house.signLord}, planets ${
            Array.isArray((house as any).planetsPlaced) && (house as any).planetsPlaced.length
              ? (house as any).planetsPlaced.join(", ")
              : "none"
          }, theme ${house.theme}`
      )
      .join("\n")

    const planetText = chart.planets
      .map(
        (planet) =>
          `${planet.name}: ${planet.sign} ${planet.signDegree?.toFixed?.(2) ?? planet.signDegree}°, house ${
            planet.house
          }, bhava house ${planet.bhavaHouse || planet.house}, nakshatra ${
            planet.nakshatra
          } pada ${planet.pada}, dignity ${getPlanetDignity(planet)}, ${
            planet.retrograde ? "retrograde" : "direct"
          }`
      )
      .join("\n")

    const dashaText = chart.dasha
      ? [
          `Mahadasha: ${chart.dasha.mahadasha.lord}, ${chart.dasha.mahadasha.startLabel} to ${chart.dasha.mahadasha.endLabel}`,
          `Antardasha: ${chart.dasha.antardasha.lord}, ${chart.dasha.antardasha.startLabel} to ${chart.dasha.antardasha.endLabel}`,
          `Pratyantar: ${chart.dasha.pratyantar.lord}, ${chart.dasha.pratyantar.startLabel} to ${chart.dasha.pratyantar.endLabel}`,
          `Moon nakshatra lord: ${chart.dasha.moonNakshatraLord}`,
          `Balance at birth: ${chart.dasha.balanceAtBirth}`,
        ].join("\n")
      : "Vimshottari dasha unavailable"

    const bphsText = knowledgePassages
      .slice(0, 10)
      .map(
        (passage, index) =>
          `${index + 1}. ${passage.citation}: ${compactPromptText(
            passage.text,
            700
          )}`
      )
      .join("\n\n")

    return [
      `Native: ${name}`,
      `Lagna: ${chart.ascendant} ${chart.ascendantDegree?.toFixed?.(2) ?? ""}°, ${chart.ascendantNakshatra} pada ${chart.ascendantPada}`,
      `Moon: ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}`,
      `Panchang: ${chart.paksha} ${chart.tithi}, yoga ${chart.yoga}, karana ${chart.karana}`,
      "",
      "CURRENT DASHA",
      dashaText,
      "",
      "IMPORTANT HOUSES",
      houseText || "No house data",
      "",
      "PLANETS",
      planetText,
      "",
      "DETECTED YOGAS",
      JSON.stringify(detectedYogas || [], null, 2),
      "",
      "DETECTED SPECIAL CASES",
      JSON.stringify(detectedCases || [], null, 2),
      "",
      "FIRST GEMINI READING SUMMARY",
      JSON.stringify(
        {
          summary: analysis.summary,
          current_period_analysis: analysis.current_period_analysis,
          dasha_predictions: analysis.dasha_predictions,
          prediction_table: analysis.prediction_table,
          special_case_readings: analysis.special_case_readings,
          risk_watch: analysis.risk_watch,
          targeted_remedies: analysis.targeted_remedies,
          book_citations: analysis.book_citations,
        },
        null,
        2
      ),
      "",
      "BPHS / CLASSICAL REFERENCE PACK",
      bphsText || "No BPHS passages retrieved",
    ].join("\n")
  }

  const focusedQuestionSchema = {
    type: "object",
    properties: {
      sub_question_answers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            chart_reason: { type: "string" },
            timing: { type: "string" },
            action: { type: "string" },
          },
          required: ["question", "answer", "chart_reason", "timing", "action"],
        },
      },
    },
    required: ["sub_question_answers"],
  } as const

  const getDeterministicQuestionFallback = (question: string) => {
    const q = normalizeQuestionSearchText(question)
    const dashaText = chart.dasha
      ? `${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar`
      : "current dasha unavailable"

    const house = (n: number) => chart.houses?.find((item) => item.house === n)
    const h2 = house(2)
    const h5 = house(5)
    const h9 = house(9)
    const h10 = house(10)
    const h11 = house(11)

    if (
      q.includes("billionaire") ||
      q.includes("arabpati") ||
      q.includes("arabpatti") ||
      q.includes("crorepati") ||
      q.includes("rich") ||
      q.includes("wealth") ||
      q.includes("money")
    ) {
      return {
        question,
        answer:
          "Mixed: the chart can support wealth growth, ambition, unusual opportunities and scale-building, but it does not give a simple guaranteed billionaire promise. Billionaire-level wealth needs exceptional execution, leverage, capital, team, market timing and risk control. The practical reading is that strong financial rise is possible through scalable business, digital/foreign channels, communication, commerce, systems and network effects, especially while Rahu is active and Mercury supports trade, analysis and communication. Avoid treating this as destiny; treat it as a high-effort wealth-building signal.",
        chart_reason:
          `Wealth axis checked through 2nd house ${h2?.sign || "-"} lord ${h2?.signLord || "-"}, 5th house ${h5?.sign || "-"} lord ${h5?.signLord || "-"}, 9th house ${h9?.sign || "-"} lord ${h9?.signLord || "-"}, 10th house ${h10?.sign || "-"} lord ${h10?.signLord || "-"}, 11th house ${h11?.sign || "-"} lord ${h11?.signLord || "-"}, with active ${dashaText}.`,
        timing:
          chart.dasha
            ? `${chart.dasha.antardasha.lord} Antardasha and ${chart.dasha.pratyantar.lord} Pratyantar should be used for near-term execution, not blind speculation.`
            : "Timing should be judged after dasha review.",
        action:
          "Build one scalable income engine, track cash flow weekly, avoid debt-heavy shortcuts, and use Mercury themes: sales, systems, content, data, technology and negotiation.",
      }
    }

    return {
      question,
      answer:
        "Mixed result: the chart shows possibility, but the outcome depends on disciplined action during the active dasha. The reading should be used as timing and risk guidance, not as an automatic guarantee.",
      chart_reason:
        `${chart.ascendant} Lagna, Moon in ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}; active period: ${dashaText}.`,
      timing: dashaText,
      action:
        "Convert this into a practical plan and judge the next step through the active Mahadasha, Antardasha and Pratyantar.",
    }
  }

  const enhanceQuestionAnswersWithGemini = async () => {
    // Production single-call mode:
    // Do not call Gemini again for sub-questions. The main Kundli Gemini call must
    // generate both full Kundli analysis and exact question answering in one response.
    const questions = (Array.isArray(subQuestions) ? subQuestions : [])
      .map((item) => normalizeQuestionText(item, 1000))
      .filter(Boolean)
      .slice(0, 3)

    if (!questions.length) {
      analysis.sub_question_answers = []
      return
    }

    const existingAnswers = Array.isArray(analysis.sub_question_answers)
      ? analysis.sub_question_answers
      : []

    const predictionRows = Array.isArray(analysis.prediction_table)
      ? analysis.prediction_table
      : []

    const finalAnswers = questions.map((question, index) => {
      const normalizedQuestion = normalizeQuestionSearchText(question)

      const existing =
        existingAnswers.find(
          (row: any) =>
            normalizeQuestionSearchText(row?.question) === normalizedQuestion
        ) || existingAnswers[index]

      if (existing && !isWeakQuestionAnswer(existing.answer)) {
        return {
          question,
          answer: normalizeQuestionText(existing.answer, 3200),
          chart_reason:
            normalizeQuestionText(existing.chart_reason, 2200) ||
            getDeterministicQuestionFallback(question).chart_reason,
        }
      }

      const userQuestionRow =
        predictionRows.find((row: any) =>
          normalizeQuestionSearchText(row?.area).includes("user question")
        ) || predictionRows[index]

      if (userQuestionRow && !isWeakQuestionAnswer(userQuestionRow.prediction)) {
        return {
          question,
          answer: normalizeQuestionText(userQuestionRow.prediction, 3200),
          chart_reason:
            normalizeQuestionText(userQuestionRow.chart_basis, 2200) ||
            getDeterministicQuestionFallback(question).chart_reason,
        }
      }

      const fallback = getDeterministicQuestionFallback(question)

      return {
        question,
        answer: `${fallback.answer} Timing: ${fallback.timing} Action: ${fallback.action}`,
        chart_reason: fallback.chart_reason,
      }
    })

    analysis.sub_question_answers = finalAnswers

    const firstFallback = getDeterministicQuestionFallback(finalAnswers[0].question)
    const directAnswer = normalizeQuestionSearchText(finalAnswers[0].answer)

    const firstUserRow = {
      area: "User question",
      chart_basis: finalAnswers[0].chart_reason,
      prediction: finalAnswers[0].answer,
      advice: firstFallback.action,
    }

    analysis.prediction_table = [
      firstUserRow,
      ...predictionRows.filter((row: any) => {
        const area = normalizeQuestionSearchText(row?.area)
        const prediction = normalizeQuestionSearchText(row?.prediction)

        return (
          !area.includes("user question") &&
          !area.includes("question") &&
          prediction !== directAnswer &&
          !prediction.includes("ai did not return") &&
          !prediction.includes("calculated chart is available") &&
          !prediction.includes("retry the ai")
        )
      }),
    ].slice(0, 18)

    if (
      normalizeQuestionSearchText(analysis.summary) === directAnswer ||
      normalizeQuestionSearchText(analysis.summary).includes(directAnswer.slice(0, 120))
    ) {
      analysis.summary =
        analysis.current_period_analysis ||
        analysis.prediction_table.find((row: any) =>
          normalizeQuestionSearchText(row?.area).includes("career")
        )?.prediction ||
        "This Kundli shows a mixed but growth-oriented life pattern where dasha timing, disciplined effort, and correct direction matter more than quick results."
    }
  }

  await enhanceQuestionAnswersWithGemini()

  const result = {
    profile: {
      name,
      gender,
      birth_date: birthDate,
      birth_time: birthTime,
      city: `${city.name}, ${city.region}`,
      panchang_system_id: chart.panchangSystem?.id,
      language,
      sub_questions: subQuestions,
      analysis_mode: "standard",
      usage_units: usageUnits,
    },
    chart,
    detected_yogas: detectedYogas,
    detected_cases: detectedCases,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    stones,
    health_indicators: healthIndicators,
    critical_period_analysis: criticalPeriod,
    targeted_remedy_seeds: targetedRemedySeeds,
    analysis,
    analysis_mode: "standard",
    usage_units: usageUnits,
    model: gemini.model,
  }

  const usageRecordPayload = buildKundliUsageRecordPayload({
    result,
    chart,
    knowledgePassages,
    detectedCases,
    healthIndicators,
    criticalPeriod,
    targetedRemedySeeds,
  })

  const usage = await recordAiUsage({
    tool: "astrology_kundli",
    input: result.profile,
    response: usageRecordPayload,
    metadata: {
      customer_email: customer.email,
      analysis_mode: "standard",
      ...getAstrologyBillingMetadata(access),
      usage_units: usageUnits,
      chart_summary: {
        ascendant: chart.ascendant,
        moonSign: chart.moonSign,
        nakshatra: chart.nakshatra,
        dasha: chart.dasha,
        panchangSystem: chart.panchangSystem,
        houseSystem: chart.houseSystem,
      },
      knowledge_references: getKnowledgeIds(knowledgePassages).slice(0, 20),
      knowledge_context: compactKnowledgeTraceForUsage(knowledgePassages),
      detected_cases_count: detectedCases.length,
      health_indicators: healthIndicators.slice(0, 20),
      critical_period_analysis: criticalPeriod,
      targeted_remedy_count: targetedRemedySeeds.length,
    },
    model: gemini.model,
    ...gemini.usage,
    provider: gemini.provider,
    attempts: gemini.attempts,
    attempt_logs: gemini.attempt_logs,
    expert_recommended: analysis.expert_call_recommended,
    tags: ["kundli", "history_record"],
  })

  if (!usage.synced) {
    console.error("[Kundli history] AI usage was not saved", {
      reason: usage.reason,
      name,
      birthDate,
      birthTime,
      city: `${city.name}, ${city.region}`,
    })
  }

  const credit = await consumeChargeableAstrologyCredit({
    access,
    tool: "astrology_kundli",
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
