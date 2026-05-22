import { NextRequest, NextResponse } from "next/server"

import {
  astrologyProductCatalog,
  normalizeAstrologyProductSuggestions,
} from "@lib/constants/astrology-products"
import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import {
  HOUSE_THEMES,
  SIGN_LORDS,
  getCityById,
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
    planet_effects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          planet: { type: "string" },
          placement: { type: "string" },
          effect: { type: "string" },
          advice: { type: "string" },
        },
        required: ["planet", "placement", "effect", "advice"],
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
    shreem_product_suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          handle: { type: "string" },
          product_url: { type: "string" },
          image_url: { type: "string" },
          reason: { type: "string" },
        },
        required: ["title", "handle", "reason"],
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
    personality_markers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trait: { type: "string" },
          chart_basis: { type: "string" },
          lived_experience: { type: "string" },
        },
        required: ["trait", "chart_basis", "lived_experience"],
      },
    },
    deep_case_analysis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          case: { type: "string" },
          chart_basis: { type: "string" },
          book_basis: { type: "string" },
          prediction: { type: "string" },
          confidence: { type: "string" },
          caution: { type: "string" },
        },
        required: [
          "case",
          "chart_basis",
          "book_basis",
          "prediction",
          "confidence",
          "caution",
        ],
      },
    },
    life_event_windows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          likely_theme: { type: "string" },
          chart_basis: { type: "string" },
          book_basis: { type: "string" },
          guidance: { type: "string" },
        },
        required: [
          "period",
          "likely_theme",
          "chart_basis",
          "book_basis",
          "guidance",
        ],
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
    "likely_challenges",
    "issue_analysis",
    "practical_solutions",
    "spiritual_guidance",
    "sub_question_answers",
    "special_cases",
    "upaay",
    "targeted_remedies",
    "shreem_product_suggestions",
    "book_citations",
    "personality_markers",
    "deep_case_analysis",
    "life_event_windows",
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
  "likely_challenges",
  "practical_solutions",
  "spiritual_guidance",
  "sub_question_answers",
  "targeted_remedies",
  "book_citations",
  "expert_call_recommended",
  "expert_call_reason",
] as const

const DEEP_KUNDLI_FIELDS = [
  ...STANDARD_KUNDLI_FIELDS,
  "risk_watch",
  "issue_analysis",
  "special_cases",
  "personality_markers",
  "deep_case_analysis",
  "life_event_windows",
] as const

const STANDARD_KUNDLI_SCHEMA = pickKundliSchema(STANDARD_KUNDLI_FIELDS)
const DEEP_KUNDLI_SCHEMA = pickKundliSchema(DEEP_KUNDLI_FIELDS)

type KundliPayload = {
  name?: unknown
  birthDate?: unknown
  birthTime?: unknown
  cityId?: unknown
  gender?: unknown
  language?: unknown
  panchangSystemId?: unknown
  deepMode?: unknown
  analysisMode?: unknown
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

  pushUnique(
    indicators,
    "Medical safety: these are astrological prevention signals, not disease diagnosis. Emergency, severe, or persistent symptoms need a qualified doctor."
  )

  return indicators.slice(0, 7)
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
      const houseTheme = HOUSE_THEMES[planet.house - 1] || "life matters"
      const dignity = getPlanetDignity(planet)

      return {
        planet: planet.name,
        placement: `${planet.name} in ${planet.sign}, house ${planet.house}, ${planet.nakshatra} pada ${planet.pada}, ${dignity}`,
        effect: `${planet.name} influences ${houseTheme.toLowerCase()} through ${PLANET_MEANINGS[planet.name] || "its natural significations"}.`,
        advice:
          DUSTHANA_HOUSES.includes(planet.house) ||
          dignity === "debilitated" ||
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

type KundliCaseReferencePack = {
  case_name: string
  chart_basis: string
  query: string
  passages: RetrievedAstrologyPassage[]
}

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

const casePackTrace = (packs: KundliCaseReferencePack[]) =>
  packs.map((pack) => ({
    case_name: pack.case_name,
    chart_basis: pack.chart_basis,
    references: knowledgeTrace(pack.passages),
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

const deepCasePriority = (detectedCase: DetectedAstrologyCase) => {
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

const selectDeepReferenceCases = (detectedCases: DetectedAstrologyCase[]) =>
  [...detectedCases]
    .sort((left, right) => deepCasePriority(right) - deepCasePriority(left))
    .slice(0, 6)

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

const buildKundliCaseReferencePacks = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  targetedRemedySeeds,
  subQuestions,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  targetedRemedySeeds: TargetedRemedy[]
  subQuestions: string[]
}): KundliCaseReferencePack[] => {
  const packs: KundliCaseReferencePack[] = []

  const addPack = ({
    caseName,
    chartBasis,
    query,
    detectedCases = [],
    min = 2,
    max = 4,
  }: {
    caseName: string
    chartBasis: string
    query: string
    detectedCases?: string[]
    min?: number
    max?: number
  }) => {
    const passages = retrieveKnowledgeSafely({
      query: `${query} ${chartBasis}`,
      chart,
      detectedCases,
      min,
      max,
    })

    if (passages.length) {
      packs.push({
        case_name: caseName,
        chart_basis: chartBasis,
        query,
        passages,
      })
    }
  }

  addPack({
    caseName: "Vimshottari dasha timing and life-event windows",
    chartBasis: activeDashaText(chart),
    query:
      "BPHS vimshottari dasha mahadasha antardasha pratyantar dasha lord result timing event phala",
    detectedCases: chart.dasha
      ? [
          chart.dasha.mahadasha.lord,
          chart.dasha.antardasha.lord,
          chart.dasha.pratyantar.lord,
        ]
      : [],
    min: 2,
    max: 3,
  })

  addPack({
    caseName: "Personality, temperament, inner experience, and liking",
    chartBasis: [
      getImportantHouseBasis(chart, [1, 4, 5]),
      planetPlacementText(chart, ["Sun", "Moon", "Mercury", "Venus"]),
      `Moon ${chart.moonSign} ${chart.nakshatra} pada ${chart.nakshatraPada}`,
    ].join(" | "),
    query:
      "BPHS lagna moon first house fourth house fifth house temperament mind personality habits likes emotions nature",
    detectedCases: ["lagna", chart.ascendant, chart.moonSign, chart.nakshatra],
    min: 2,
    max: 3,
  })

  addPack({
    caseName: "Career, money, status, and work pattern",
    chartBasis: [
      getImportantHouseBasis(chart, [2, 10, 11]),
      planetPlacementText(chart, ["Sun", "Mercury", "Jupiter", "Saturn"]),
    ].join(" | "),
    query:
      "BPHS career profession tenth house wealth second house income eleventh house status karma dhan labha",
    detectedCases: ["career", "wealth", "profession"],
    min: 1,
    max: 2,
  })

  addPack({
    caseName: "Relationship, marriage, and emotional compatibility pattern",
    chartBasis: [
      getImportantHouseBasis(chart, [7, 2, 4]),
      planetPlacementText(chart, ["Venus", "Jupiter", "Mars", "Moon"]),
    ].join(" | "),
    query:
      "BPHS marriage spouse seventh house venus jupiter mars relationship partner harmony conflict",
    detectedCases: ["marriage", "relationship", "spouse"],
    min: 1,
    max: 2,
  })

  selectDeepReferenceCases(detectedCases).forEach((detectedCase) => {
    addPack({
      caseName: `Special case: ${detectedCase.name}${
        detectedCase.subtype ? ` - ${detectedCase.subtype}` : ""
      }`,
      chartBasis: [
        detectedCase.chart_basis,
        detectedCase.combined_effect,
        detectedCase.caution || "",
        planetPlacementText(chart, detectedCase.planets),
      ].join(" | "),
      query:
        [
          "BPHS yoga special combination conjunction aspect cancellation strength result dasha",
          detectedCase.name,
          detectedCase.subtype || "",
          detectedCase.retrieval_terms.join(" "),
        ].join(" "),
      detectedCases: [
        detectedCase.name,
        detectedCase.subtype || "",
        detectedCase.chart_basis,
        ...detectedCase.retrieval_terms,
      ],
      min: detectedCase.category === "compound" ? 2 : 1,
      max: detectedCase.category === "compound" ? 3 : 2,
    })
  })

  addPack({
    caseName: "Health, disease tendency, accident watch, and prevention",
    chartBasis: [
      getImportantHouseBasis(chart, [6, 8, 12]),
      healthIndicators.join(" | "),
      planetPlacementText(chart, ["Mars", "Saturn", "Rahu", "Ketu", "Moon"]),
      activeDashaText(chart),
    ].join(" | "),
    query:
      "BPHS disease illness health sixth eighth twelfth ari randhra arishta accident injury mars saturn rahu ketu prevention",
    detectedCases: healthIndicators,
    min: 2,
    max: 3,
  })

  addPack({
    caseName: "Remedy, mantra, pooja, daan, and gemstone caution",
    chartBasis: targetedRemedySeeds
      .map(
        (item) =>
          `${item.pain_point}: ${item.chart_basis}; ${item.mantra_or_pooja}`
      )
      .join(" | "),
    query:
      "BPHS remedy upaya graha shanti mantra pooja daan gemstone worship deity vrata seva",
    detectedCases: targetedRemedySeeds.map((item) => item.pain_point),
    min: 1,
    max: 2,
  })

  subQuestions.slice(0, 2).forEach((question, index) => {
    addPack({
      caseName: `User question ${index + 1}`,
      chartBasis: `${question} | ${activeDashaText(chart)} | ${getImportantHouseBasis(
        chart,
        [1, 5, 7, 10]
      )}`,
      query: `BPHS specific question prediction ${question}`,
      detectedCases: [question],
      min: 1,
      max: 2,
    })
  })

  return packs
}

const buildKundliKnowledgePassages = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  targetedRemedySeeds,
  subQuestions,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
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

  return mergeKnowledgePassages(
    10,
    retrieveKnowledgeSafely({
      query: [
        "vimshottari dasha mahadasha antardasha pratyantar dasha lord effects दशा महादशा अन्तर्दशा",
        activeDashaText(chart),
      ].join(" "),
      chart,
      detectedCases: dashaLords,
      min: 2,
      max: 4,
    }),
    retrieveKnowledgeSafely({
      query: [
        "parashari yoga special combination gajakesari budhaditya kaal sarp rahu ketu conjunction aspect result",
        detectedYogas.join(" "),
        getCaseSearchTerms(detectedCases).join(" "),
        planetPlacementText(chart, [
          "Moon",
          "Jupiter",
          "Sun",
          "Mercury",
          "Mars",
          "Rahu",
          "Ketu",
        ]),
      ].join(" "),
      chart,
      detectedCases: [...detectedYogas, ...getCaseSearchTerms(detectedCases)],
      min: detectedYogas.length ? 3 : 2,
      max: 5,
    }),
    retrieveKnowledgeSafely({
      query: [
        "health disease accident injury ari randhra sixth eighth twelfth mars saturn rahu ketu रोग अरिष्ट दुर्घटना अष्टम षष्ठ",
        healthIndicators.join(" "),
        afflictedRiskPlanets.join(" "),
        activeDashaText(chart),
      ].join(" "),
      chart,
      detectedCases: healthIndicators,
      min: 2,
      max: 4,
    }),
    retrieveKnowledgeSafely({
      query: [
        "remedy mantra pooja daan graha shanti upaya mantra deity gemstone सावधानी उपाय मंत्र दान पूजा",
        targetedRemedySeeds
          .map(
            (item) =>
              `${item.pain_point} ${item.chart_basis} ${item.mantra_or_pooja}`
          )
          .join(" "),
      ].join(" "),
      chart,
      detectedCases: targetedRemedySeeds.map((item) => item.pain_point),
      min: 2,
      max: 4,
    }),
    subQuestions.length
      ? retrieveKnowledgeSafely({
          query: [
            "specific question parashari prediction chart result",
            subQuestions.join(" "),
            activeDashaText(chart),
          ].join(" "),
          chart,
          detectedCases: subQuestions,
          min: 1,
          max: 3,
        })
      : []
  )
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
            `${index + 1}. [${passage.id}] Citation: ${
              passage.citation
            }\nExcerpt: ${compactPromptText(passage.text, excerptLength)}`
        )
        .join("\n\n")
    : "No BPHS passages retrieved."

const formatCaseReferencePacksForPrompt = (
  packs: KundliCaseReferencePack[],
  packLimit = 6,
  passageLimit = 2
) => {
  const selectedPacks = packs.slice(0, packLimit)

  return selectedPacks.length
    ? selectedPacks
        .map(
          (pack, index) =>
            `Case pack ${index + 1}: ${pack.case_name}\nChart basis: ${
              compactPromptText(pack.chart_basis, 520)
            }\nRetrieved BPHS passages:\n${formatCompactPassagesForPrompt(
              pack.passages,
              passageLimit,
              520
            )}`
        )
        .join("\n\n")
    : "No deep case packs requested."
}

const buildPrompt = ({
  name,
  chart,
  detectedYogas,
  detectedCases,
  stones,
  healthIndicators,
  targetedRemedySeeds,
  subQuestions,
  language,
  knowledgePassages,
  caseReferencePacks,
  deepMode,
}: {
  name: string
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  stones: ReturnType<typeof getStoneRecommendations>
  healthIndicators: string[]
  targetedRemedySeeds: TargetedRemedy[]
  subQuestions: string[]
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
  caseReferencePacks: KundliCaseReferencePack[]
  deepMode: boolean
}) =>
  [
    "You are Shreem Astrology's Vedic Kundli analysis assistant.",
    "Use only the calculated chart data and deterministic yoga detections below. Do not invent yogas that are not present.",
    "The chart calculation layer is authoritative. Do not move planets into different houses, do not alter Lagna, and do not infer chart facts that are absent.",
    "If rashi_house and bhava_house differ, explain the difference plainly and use the selected house as the main house for this panchang mode.",
    "Use the retrieved Brihat Parashara Hora Shastra reference pack as the interpretive base for dasha, yoga, health-risk, and remedy judgement. It is not decorative citation. Apply it only after checking the calculated chart facts.",
    "First read Vimshottari timing: Mahadasha, Antardasha, and Pratyantar lord placement by house, sign, dignity, association, and relevant houses. Then explain how the BPHS reference pack modifies timing and outcomes.",
    "When two strong combinations coexist, synthesize them rather than listing them separately. Example: if Gajakesari support and Kaal Sarp/Rahu-Ketu pressure both appear, judge which dominates by dasha, house relevance, and afflicted/protective grahas.",
    "When a retrieved note identifies a later convention such as Kaal Sarp, say so plainly and judge it through Rahu/Ketu, houses, dignity, and dasha.",
    "Use detected_structured_cases as the main special-case audit. For Kaal Sarp include exact type/status; for Neechabhanga include whether it is raw debility, partial cancellation, or a multi-planet cluster. For all cases, judge the combined effect, not isolated planet snippets.",
    "Follow calculation-first discipline: if a combination is partial, call it partial and explain what supports or weakens it.",
    "Cover special astrological cases when indicated, including Kaal Sarp, Manglik/Mars sensitivity, debilitation, possible Neechabhanga, Gajakesari, Budhaditya, and Chandra-Mangal.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    deepMode
      ? "DEEP MODE is active: do a case-by-case astrological audit internally before writing the final JSON. For each detected yoga, dasha signal, health/risk indication, relationship/career signal, and remedy need, use the matching BPHS case pack as the base text and then synthesize through the calculated chart."
      : "STANDARD MODE is active: do not write a long report. Keep risk_watch, sub_question_answers, personality_markers, deep_case_analysis, and life_event_windows empty unless absolutely needed.",
    deepMode
      ? "In DEEP MODE, predict lived-experience markers that build user confidence: likely temperament, emotional patterns, likes/dislikes, repeated inner issues, confidence blocks, family/work tendencies, and event windows. Ground every strong claim in dasha, house, graha placement, and a BPHS citation. Phrase uncertain items as tendencies, not guarantees."
      : "Avoid over-extending event predictions in standard mode.",
    "Also consider period timing from Vimshottari Mahadasha, Antardasha, and Pratyantar Dasha. Keep period analysis grounded in the dasha lords and their houses/signs.",
    "Give a detailed reading with these sections: who the person is, behavioral traits, strengths, life themes, likely challenges/issues, practical solutions, Vedic remedies, and cautious spiritual guidance.",
    "Health analysis must be deeper than generic caution: name likely vulnerability areas and possible disease tendencies from chart indicators, but use cautious language like tendency/watch/monitor. Do not diagnose. Tell the user to consult a qualified doctor for symptoms, emergencies, or persistent issues.",
    "Accident or major-incident analysis must be framed only as watch periods and preventive care. Mention it only when 6th/8th/12th houses, Mars/Saturn/Rahu/Ketu, and active dasha signals support it. Never guarantee harm or use frightening certainty.",
    deepMode
      ? "Return health_indicators with 4 to 7 specific watchlist items. Each item must include chart basis and a practical prevention note."
      : "Return health_indicators with 3 to 5 specific watchlist items. Each item must be one complete sentence.",
    "Return dasha_predictions with one row each for Mahadasha, Antardasha, and Pratyantar. Each row must include chart_basis, classical_basis from the retrieved pack, prediction, and action.",
    deepMode
      ? "Return risk_watch with 2 to 5 practical watch areas only when supported by chart and dasha; include prevention, not fear."
      : "Return risk_watch as an empty array unless there is a clear 6th/8th/12th plus dasha trigger.",
    deepMode
      ? "Return personality_markers with 4 to 8 lived-experience markers. Each must connect trait -> chart_basis -> what the person may feel or repeatedly notice in life."
      : "Return personality_markers as an empty array in standard mode.",
    deepMode
      ? "Return deep_case_analysis with 4 to 6 rows for the highest-priority detected cases. Each row must include chart_basis, book_basis using BPHS citation language, prediction, confidence, and caution."
      : "Do not return deep_case_analysis in standard mode.",
    deepMode
      ? "Return life_event_windows with 3 to 5 dasha-based windows. Each row must be cautious and explain likely_theme, chart_basis, book_basis, and guidance."
      : "Do not return life_event_windows in standard mode.",
    "Return prediction_table with rows for Personality, Career, Money, Marriage, Health, Current period, and Remedies. Each row must include chart_basis, prediction, and advice.",
    "Do not return planet_effects; the server generates graha-by-graha rows from the calculated chart.",
    "Answer at most three sub-questions. If no sub-questions are provided, return an empty sub_question_answers array.",
    "Every sub-question answer must cite a chart reason using Lagna, Moon sign/nakshatra, houses, or graha placement. Do not answer from generic intuition.",
    "If a yoga is not detected, do not claim it exists. Mention uncertainty clearly.",
    "Give remedies as Vedic practices: mantra, daan, vrata, worship, discipline, and seva.",
    "Return targeted_remedies with 3 to 6 exact pain-point remedies. Each row must map pain_point -> chart_basis -> mantra_or_pooja -> daily_practice. Avoid generic advice like simply do pooja; name the graha, day, mantra or deity, and the pain point it addresses.",
    "Gemstone guidance must only use the provided 1st, 5th, and 9th house lord stone indicators. Do not recommend a separate rashi/Moon stone unless it is already one of those trinal house indicators.",
    "Do not return shreem_product_suggestions or extra product fields in this JSON.",
    "Keep every string complete and self-contained. Do not end mid-sentence, do not use trailing ellipses, and prefer fewer complete rows over many unfinished rows.",
    deepMode
      ? "Keep each row compact: chart basis in 1 sentence, book basis in 1 sentence, prediction in 2 to 3 complete sentences, and advice in 1 to 2 complete sentences."
      : "Hard cap for standard mode: summary/person_information/temperament/current_period_analysis max 70 words each; every array item max 28 words; every table field max 35 words.",
    "Never give medical, legal, or financial certainty. Gemstones must always redirect to expert review before wearing.",
    "If strong dosha, gemstone, pooja, marriage, health, or career-defining guidance appears, set expert_call_recommended true and recommend Sanjay Kumar Pandey.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only. Return only the fields allowed by the response schema.",
    `Analysis mode: ${deepMode ? "deep" : "standard"}`,
    `Native name: ${name || "Not provided"}`,
    `Sub-questions: ${JSON.stringify(subQuestions)}`,
    `Retrieved classical reference pack: ${formatCompactPassagesForPrompt(
      knowledgePassages,
      deepMode ? 10 : 8,
      deepMode ? 720 : 620
    )}`,
    `Deep case reference packs: ${formatCaseReferencePacksForPrompt(
      caseReferencePacks,
      deepMode ? 6 : 0,
      2
    )}`,
    `Active dasha discipline: ${activeDashaText(chart)}`,
    `Deterministic health watchlist: ${JSON.stringify(healthIndicators)}`,
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
        house_note: planet.houseNote,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        retrograde: Boolean(planet.retrograde),
      })),
      houses: chart.houses.map((house) => ({
        ...house,
        planets: chart.planets
          .filter((planet) => planet.house === house.house)
          .map((planet) => planet.name),
      })),
    })}`,
    `Detected cases: ${JSON.stringify(detectedYogas)}`,
    `Detected structured cases: ${JSON.stringify(detectedCases)}`,
    `Trinal stone indicators: ${JSON.stringify(stones)}`,
    `available_ritual_support: ${JSON.stringify(
      astrologyProductCatalog.map((item) => ({
        title: item.title,
        handle: item.handle,
        product_url: item.product_url,
        image_url: item.image_url,
      }))
    )}`,
  ].join("\n")

const buildFallbackKundliAnalysis = ({
  chart,
  detectedYogas,
  detectedCases,
  healthIndicators,
  targetedRemedySeeds,
  knowledgePassages,
  deepMode,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  targetedRemedySeeds: TargetedRemedy[]
  knowledgePassages: RetrievedAstrologyPassage[]
  deepMode: boolean
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
  const mainCases = selectDeepReferenceCases(detectedCases).slice(
    0,
    deepMode ? 6 : 4
  )

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
    risk_watch: healthIndicators.slice(0, 4).map((indicator) => ({
      theme: "Preventive health watch",
      chart_basis: indicator,
      dasha_trigger: activeDashaText(chart),
      prevention:
        "Use medical checkups, sleep discipline, hydration, and moderation; retry for the detailed BPHS reading.",
    })),
    prediction_table: [
      {
        area: "Current period",
        chart_basis: activeDashaText(chart),
        prediction:
          "The dasha sequence is calculated and ready for interpretation.",
        advice: "Retry the AI explanation to continue from this same chart.",
      },
    ],
    planet_effects: buildPlanetEffects(chart),
    likely_challenges: detectedYogas.slice(0, 5),
    issue_analysis: mainCases.map((item) => item.combined_effect),
    practical_solutions: targetedRemedySeeds.map((item) => item.daily_practice),
    spiritual_guidance:
      "Use simple mantra, daan, discipline, and expert review for strong dosha, gemstone, health, or marriage decisions.",
    sub_question_answers: [],
    special_cases: detectedYogas,
    upaay: targetedRemedySeeds.map((item) => item.mantra_or_pooja),
    targeted_remedies: targetedRemedySeeds,
    shreem_product_suggestions: [],
    book_citations: knowledgePassages.slice(0, 6).map((passage) => ({
      citation: passage.citation,
      relevance: "Retrieved for the failed AI interpretation retry context.",
    })),
    personality_markers: [],
    deep_case_analysis: mainCases.map((item) => ({
      case: `${item.name}${item.subtype ? ` (${item.subtype})` : ""}`,
      chart_basis: item.chart_basis,
      book_basis:
        knowledgePassages[0]?.citation ||
        "BPHS reference retrieval was prepared for this chart.",
      prediction: item.combined_effect,
      confidence: `${item.status}, ${item.strength} strength`,
      caution: item.caution || "Use retry or expert review before conclusions.",
    })),
    life_event_windows: dashaRows.map((row) => ({
      period: row.period,
      likely_theme: "Dasha-based watch window",
      chart_basis: row.chart_basis,
      book_basis: row.classical_basis,
      guidance: row.action,
    })),
    expert_call_recommended: true,
    expert_call_reason:
      "The AI interpretation failed after retries, so strong guidance should be reviewed by Sanjay Kumar Pandey rather than inferred from a partial answer.",
  }
}

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
  const rawAnalysisMode = sanitizeString(payload.analysisMode, 20)
  const rawDeepMode = sanitizeString(payload.deepMode, 12)
  const deepMode =
    payload.deepMode === true ||
    rawAnalysisMode === "deep" ||
    rawDeepMode === "true"
  const usageUnits = deepMode ? 2 : 1
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
  const targetedRemedySeeds = buildTargetedRemedySeeds(
    chart,
    detectedYogas,
    healthIndicators
  )
  const baseKnowledgePassages = buildKundliKnowledgePassages({
    chart,
    detectedYogas,
    detectedCases,
    healthIndicators,
    targetedRemedySeeds,
    subQuestions,
  })
  const caseReferencePacks = deepMode
    ? buildKundliCaseReferencePacks({
        chart,
        detectedYogas,
        detectedCases,
        healthIndicators,
        targetedRemedySeeds,
        subQuestions,
      })
    : []
  const knowledgePassages = deepMode
    ? mergeKnowledgePassages(
        12,
        baseKnowledgePassages,
        ...caseReferencePacks.map((pack) => pack.passages)
      )
    : baseKnowledgePassages

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
          analysis_mode: deepMode ? "deep" : "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        targeted_remedies: targetedRemedySeeds,
        analysis_mode: deepMode ? "deep" : "standard",
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
        message:
          deepMode
            ? `Deep Kundli uses ${usageUnits} AI turns. You need ${usageUnits} free turns or paid credits available. Buy credits or upgrade to Premium to continue.`
            : `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        profile: {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          city: `${city.name}, ${city.region}`,
          panchang_system_id: chart.panchangSystem?.id,
          language,
          sub_questions: subQuestions,
          analysis_mode: deepMode ? "deep" : "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        targeted_remedies: targetedRemedySeeds,
        targeted_remedy_seeds: targetedRemedySeeds,
        analysis_mode: deepMode ? "deep" : "standard",
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
    targetedRemedySeeds,
    subQuestions,
    language,
    knowledgePassages,
    caseReferencePacks,
    deepMode,
  })
  const gemini = await generateGeminiJson({
    prompt,
    responseSchema: deepMode ? DEEP_KUNDLI_SCHEMA : STANDARD_KUNDLI_SCHEMA,
    temperature: deepMode ? 0.2 : 0.22,
    timeoutMs: deepMode ? 120_000 : undefined,
    maxAttempts: deepMode ? 3 : undefined,
    maxOutputTokens: 12288,
    label: deepMode ? "Deep Kundli API" : "Kundli API",
  })

  if (!gemini.ok) {
    const fallbackAnalysis = buildFallbackKundliAnalysis({
      chart,
      detectedYogas,
      detectedCases,
      healthIndicators,
      targetedRemedySeeds,
      knowledgePassages,
      deepMode,
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
          analysis_mode: deepMode ? "deep" : "standard",
          usage_units: usageUnits,
        },
        chart,
        detected_yogas: detectedYogas,
        detected_cases: detectedCases,
        stones,
        health_indicators: healthIndicators,
        targeted_remedy_seeds: targetedRemedySeeds,
        knowledge_references: getKnowledgeIds(knowledgePassages),
        knowledge_case_packs: casePackTrace(caseReferencePacks),
        analysis: fallbackAnalysis,
        analysis_mode: deepMode ? "deep" : "standard",
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
    summary: sanitizeString(parsed?.summary, 1800),
    person_information: sanitizeString(parsed?.person_information, 1800),
    temperament: sanitizeString(parsed?.temperament, 1400),
    behavioral_traits: sanitizeStringArray(parsed?.behavioral_traits, 8, 520),
    strengths: sanitizeStringArray(parsed?.strengths, 8, 520),
    life_themes: sanitizeStringArray(parsed?.life_themes, 8, 520),
    career_direction: sanitizeString(parsed?.career_direction, 1600),
    relationship_pattern: sanitizeString(parsed?.relationship_pattern, 1600),
    health_caution: sanitizeString(parsed?.health_caution, 1800),
    health_indicators:
      sanitizeStringArray(parsed?.health_indicators, 7, 700).length > 0
        ? sanitizeStringArray(parsed?.health_indicators, 7, 700)
        : healthIndicators,
    current_period_analysis: sanitizeString(
      parsed?.current_period_analysis,
      1800
    ),
    dasha_predictions: Array.isArray(parsed?.dasha_predictions)
      ? parsed.dasha_predictions
          .map((item: any) => ({
            period: sanitizeString(item?.period, 80),
            chart_basis: sanitizeString(item?.chart_basis, 900),
            classical_basis: sanitizeString(item?.classical_basis, 900),
            prediction: sanitizeString(item?.prediction, 1400),
            action: sanitizeString(item?.action, 700),
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
          .slice(0, 4)
      : [],
    risk_watch: Array.isArray(parsed?.risk_watch)
      ? parsed.risk_watch
          .map((item: any) => ({
            theme: sanitizeString(item?.theme, 120),
            chart_basis: sanitizeString(item?.chart_basis, 800),
            dasha_trigger: sanitizeString(item?.dasha_trigger, 700),
            prevention: sanitizeString(item?.prevention, 700),
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
          .slice(0, 5)
      : [],
    prediction_table: Array.isArray(parsed?.prediction_table)
      ? parsed.prediction_table
          .map((item: any) => ({
            area: sanitizeString(item?.area, 80),
            chart_basis: sanitizeString(item?.chart_basis, 800),
            prediction: sanitizeString(item?.prediction, 1200),
            advice: sanitizeString(item?.advice, 700),
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
          .slice(0, 8)
      : [],
    planet_effects: Array.isArray(parsed?.planet_effects)
      ? parsed.planet_effects
          .map((item: any) => ({
            planet: sanitizeString(item?.planet, 40),
            placement: sanitizeString(item?.placement, 520),
            effect: sanitizeString(item?.effect, 1000),
            advice: sanitizeString(item?.advice, 700),
          }))
          .filter(
            (item: {
              planet: string
              placement: string
              effect: string
              advice: string
            }) => Boolean(item.planet && item.effect)
          )
          .slice(0, 9)
      : buildPlanetEffects(chart),
    likely_challenges: sanitizeStringArray(parsed?.likely_challenges, 8, 520),
    issue_analysis: sanitizeStringArray(parsed?.issue_analysis, 8, 700),
    practical_solutions: sanitizeStringArray(parsed?.practical_solutions, 8, 700),
    spiritual_guidance: sanitizeString(parsed?.spiritual_guidance, 1400),
    sub_question_answers: Array.isArray(parsed?.sub_question_answers)
      ? parsed.sub_question_answers
          .map((item: any) => ({
            question: sanitizeString(item?.question, 220),
            answer: sanitizeString(item?.answer, 1400),
            chart_reason: sanitizeString(item?.chart_reason, 900),
          }))
          .filter(
            (item: { question: string; answer: string; chart_reason: string }) =>
              Boolean(item.question && item.answer)
          )
          .slice(0, 3)
      : [],
    special_cases: Array.isArray(parsed?.special_cases)
      ? parsed.special_cases
          .map((item: unknown) => sanitizeString(item, 520))
          .filter(Boolean)
          .slice(0, 8)
      : detectedYogas,
    upaay: Array.isArray(parsed?.upaay)
      ? parsed.upaay
          .map((item: unknown) => sanitizeString(item, 520))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    targeted_remedies: Array.isArray(parsed?.targeted_remedies)
      ? parsed.targeted_remedies
          .map((item: any) => ({
            pain_point: sanitizeString(item?.pain_point, 180),
            chart_basis: sanitizeString(item?.chart_basis, 700),
            mantra_or_pooja: sanitizeString(item?.mantra_or_pooja, 900),
            daily_practice: sanitizeString(item?.daily_practice, 700),
          }))
          .filter((item: TargetedRemedy) =>
            Boolean(
              item.pain_point &&
                item.chart_basis &&
                item.mantra_or_pooja &&
                item.daily_practice
            )
          )
          .slice(0, 6)
      : targetedRemedySeeds,
    shreem_product_suggestions: normalizeAstrologyProductSuggestions(
      parsed?.shreem_product_suggestions
    ),
    book_citations: sanitizeBookCitations(parsed?.book_citations),
    personality_markers: Array.isArray(parsed?.personality_markers)
      ? parsed.personality_markers
          .map((item: any) => ({
            trait: sanitizeString(item?.trait, 160),
            chart_basis: sanitizeString(item?.chart_basis, 800),
            lived_experience: sanitizeString(item?.lived_experience, 1000),
          }))
          .filter(
            (item: {
              trait: string
              chart_basis: string
              lived_experience: string
            }) => Boolean(item.trait && item.chart_basis && item.lived_experience)
          )
          .slice(0, deepMode ? 8 : 4)
      : [],
    deep_case_analysis: Array.isArray(parsed?.deep_case_analysis)
      ? parsed.deep_case_analysis
          .map((item: any) => ({
            case: sanitizeString(item?.case, 180),
            chart_basis: sanitizeString(item?.chart_basis, 1000),
            book_basis: sanitizeString(item?.book_basis, 1000),
            prediction: sanitizeString(item?.prediction, 1600),
            confidence: sanitizeString(item?.confidence, 360),
            caution: sanitizeString(item?.caution, 800),
          }))
          .filter(
            (item: {
              case: string
              chart_basis: string
              book_basis: string
              prediction: string
              confidence: string
              caution: string
            }) =>
              Boolean(
                item.case &&
                  item.chart_basis &&
                  item.book_basis &&
                  item.prediction
              )
          )
          .slice(0, deepMode ? 10 : 4)
      : [],
    life_event_windows: Array.isArray(parsed?.life_event_windows)
      ? parsed.life_event_windows
          .map((item: any) => ({
            period: sanitizeString(item?.period, 120),
            likely_theme: sanitizeString(item?.likely_theme, 500),
            chart_basis: sanitizeString(item?.chart_basis, 1000),
            book_basis: sanitizeString(item?.book_basis, 1000),
            guidance: sanitizeString(item?.guidance, 1000),
          }))
          .filter(
            (item: {
              period: string
              likely_theme: string
              chart_basis: string
              book_basis: string
              guidance: string
            }) =>
              Boolean(
                item.period &&
                  item.likely_theme &&
                  item.chart_basis &&
                  item.guidance
              )
          )
          .slice(0, deepMode ? 6 : 3)
      : [],
    expert_call_recommended: Boolean(parsed?.expert_call_recommended),
    expert_call_reason: sanitizeString(parsed?.expert_call_reason, 1200),
  }
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
      analysis_mode: deepMode ? "deep" : "standard",
      usage_units: usageUnits,
    },
    chart,
    detected_yogas: detectedYogas,
    detected_cases: detectedCases,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    knowledge_case_packs: casePackTrace(caseReferencePacks),
    stones,
    health_indicators: healthIndicators,
    targeted_remedy_seeds: targetedRemedySeeds,
    analysis,
    analysis_mode: deepMode ? "deep" : "standard",
    usage_units: usageUnits,
    model: gemini.model,
  }

  const usage = await recordAiUsage({
    tool: "astrology_kundli",
    input: result.profile,
    response: result,
    metadata: {
      customer_email: customer.email,
      analysis_mode: deepMode ? "deep" : "standard",
      usage_units: usageUnits,
      chart,
      panchangSystem: chart.panchangSystem,
      houseSystem: chart.houseSystem,
      dasha: chart.dasha,
      knowledge_references: getKnowledgeIds(knowledgePassages),
      knowledge_context: knowledgeTrace(knowledgePassages),
      knowledge_case_packs: casePackTrace(caseReferencePacks),
      detected_cases: detectedCases,
      health_indicators: healthIndicators,
      targeted_remedy_seeds: targetedRemedySeeds,
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended: analysis.expert_call_recommended,
  })
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
