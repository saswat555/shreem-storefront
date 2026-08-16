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
  type AstrologyKnowledgeIntent,
  type RetrievedAstrologyPassage,
} from "@lib/util/astrology-knowledge"
import {
  evaluateBphsRules,
  type BphsRuleProof,
} from "@lib/util/bphs-rules"
import {
  buildLongevityAssessment,
  type LongevityAssessment,
} from "@lib/util/longevity-rules"
import {
  buildKundliEvidencePack,
  type KundliEvidencePack,
} from "@lib/util/astrology-evidence"
import {
  checkAstrologyAccess,
  consumeChargeableAstrologyCredit,
  getAstrologyBillingMetadata,
  isAstrologyAccessBlocked,
} from "@lib/util/ai-quota"
import {
  emptyGeminiUsage,
  generateGeminiJson,
  type GeminiAttemptLog,
  type GeminiUsage,
} from "@lib/util/gemini"
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
    opening_profile: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 2,
    },
    deterministic_review: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          deterministic_basis_used: { type: "string" },
          missing_or_weak_point: { type: "string" },
          final_decision: { type: "string" },
          needs_more_bphs: { type: "boolean" },
        },
        required: [
          "area",
          "deterministic_basis_used",
          "missing_or_weak_point",
          "final_decision",
          "needs_more_bphs",
        ],
      },
    },
    dasha_decision_tree: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          prevailing_factor: { type: "string" },
          score: { type: "number" },
          decision_rule: { type: "string" },
          expected_outcome: { type: "string" },
        },
      },
    },
    house_outcomes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          house: { type: "number" },
          theme: { type: "string" },
          prevailing_impact: { type: "string" },
          user_meaning: { type: "string" },
          outcome: { type: "string" },
          practical_use: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
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
  "deterministic_review",
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
  "opening_profile",
  "career_direction",
  "relationship_pattern",
  "health_caution",
  "current_period_analysis",
  "deterministic_review",
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
  question?: unknown
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
  Sun: "heart vitality, eyes, heat tendency, headaches, and pitta-type fatigue",
  Moon: "sleep quality, anxiety, fluid balance, digestion sensitivity, and emotional eating",
  Mars: "inflammation, feverish tendency, heat spikes, injuries, cuts, burns, and safe-travel caution",
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
    mantra: "Sunday sunrise Surya arghya: face east, offer clean water from a copper lota with red flower or akshat, then chant Om Suryaya Namah 108 times. Keep a simple sankalp for health, clarity and right authority.",
    practice: "Wake early, keep promises, respect fatherly figures, avoid ego battles, and donate wheat, jaggery or copper-colored food when suitable.",
  },
  Moon: {
    painPoint: "sleep, anxiety, emotional steadiness, and mother/home comfort",
    mantra: "Monday Shiva-Chandra shanti: offer water or milk-water to Shivling, sit quietly for 5 minutes, then chant Om Som Somaya Namah 108 times.",
    practice: "Protect sleep, reduce late-night screen stimulation, support motherly figures, keep the home calm, and donate rice or milk when suitable.",
  },
  Mars: {
    painPoint: "anger, conflict, inflammation, injury risk, and rushed decisions",
    mantra: "Tuesday Mangal-Hanuman remedy: read Hanuman Chalisa, offer sindoor/chameli oil where appropriate, then chant Om Angarakaya Namah 108 times.",
    practice: "Use disciplined exercise, pause before arguments, avoid speed/risky tools in watch windows, and donate red lentils when suitable.",
  },
  Mercury: {
    painPoint: "speech, overthinking, trade, study, skin/nerves, and decision clarity",
    mantra: "Wednesday Budh remedy: worship Ganesha or Vishnu, read a short Vishnu/Ganesha stotra, then chant Om Bum Budhaya Namah 108 times.",
    practice: "Write decisions before acting, keep accounts clean, avoid harsh speech, study daily, and donate green moong when suitable.",
  },
  Jupiter: {
    painPoint: "guidance, children, wisdom, digestion/metabolism, and dharmic judgment",
    mantra: "Thursday Brihaspati remedy: offer yellow flowers or turmeric to Vishnu/Guru, chant Om Brim Brihaspataye Namah 108 times, and take guidance from a teacher/elder before major vows.",
    practice: "Study scripture, mentor someone, avoid excess sweets, speak truthfully, and donate chana dal, turmeric or yellow food.",
  },
  Venus: {
    painPoint: "relationship harmony, comfort, reproductive/urinary sensitivity, and indulgence",
    mantra: "Friday Shukra remedy: worship Lakshmi-Narayana with cleanliness, fragrance and white flowers, then chant Om Shum Shukraya Namah 108 times.",
    practice: "Practice cleanliness, artistic discipline, respectful partnership, control indulgence, and donate white sweets or clothes when suitable.",
  },
  Saturn: {
    painPoint: "delay, chronic stress, bones/joints, duty, debt, and fear",
    mantra: "Saturday Shani remedy: light a sesame-oil diya for Shani/Hanuman, recite Hanuman Chalisa or Shani mantra, then chant Om Sham Shanicharaya Namah 108 times.",
    practice: "Serve workers, elders or disabled people; avoid cruelty and shortcuts; keep strict sleep, debt, and work routines.",
  },
  Rahu: {
    painPoint: "obsession, anxiety loops, toxins, sudden reversals, foreign/unusual blocks",
    mantra: "Saturday Rahu shanti: worship Durga/Bhairav with a sober mind, avoid fear-based tantra, then chant Om Rahave Namah 108 times.",
    practice: "Avoid intoxicants, misinformation, shortcuts and obsession loops; donate dark sesame, blankets or support to marginalized people when suitable.",
  },
  Ketu: {
    painPoint: "detachment, hidden fear, nerve sensitivity, sudden breaks, and spiritual confusion",
    mantra: "Ketu-Ganesha remedy: worship Ganesha first, chant Om Ketave Namah 108 times on Tuesday or Saturday, and keep the practice simple without fear.",
    practice: "Simplify possessions, complete pending duties, feed dogs when appropriate, ground the body through routine, and avoid escapist isolation.",
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

const SIGN_SEQUENCE = [
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

const getSignDistance = (fromSign?: string | null, toSign?: string | null) => {
  const fromIndex = SIGN_SEQUENCE.indexOf(String(fromSign || ""))
  const toIndex = SIGN_SEQUENCE.indexOf(String(toSign || ""))

  if (fromIndex < 0 || toIndex < 0) {
    return 0
  }

  return ((toIndex - fromIndex + 12) % 12) + 1
}

const getEnvGocharSign = (planet: string, fallback: string) => {
  const raw = process.env[`ASTROLOGY_GOCHAR_${planet.toUpperCase()}_SIGN`]
  const sign = SIGN_SEQUENCE.find(
    (item) => item.toLowerCase() === String(raw || "").trim().toLowerCase()
  )

  return sign || fallback
}

const TRINAL_HOUSES = [1, 5, 9]
const STONE_HOUSES = [1, 5, 9] as const
const KENDRA_HOUSES = [1, 4, 7, 10]
const DUSTHANA_HOUSES = [6, 8, 12]
const BENEFIC_PLANETS = ["Jupiter", "Venus", "Mercury", "Moon"]
const PRESSURE_PLANETS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"]

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the complete reading in polished English.",
  hindi:
    "Write the complete reading in natural Hindi using Devanagari, keeping astrology terms understandable.",
  hinglish:
    "Write the complete reading in Roman Hindi/Hinglish using English alphabets only. Do not use Devanagari. Example style: 'aap ka lagna strong hai'. Keep common astrology words like lagna, rashi, dasha, upaay, and bhav.",
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

const normalizeSubQuestions = (items: string[]) => {
  const questions: string[] = []

  items.forEach((item) => {
    const parts = item
      .split(/(?:\?\s+|\?\n+|\n+|[;।]\s*)/g)
      .map((part) => part.trim())
      .filter(Boolean)

    ;(parts.length ? parts : [item]).forEach((part) => {
      const cleaned = part
        .replace(/^(q\s*\d+[:.)-]\s*)/i, "")
        .replace(/\s+/g, " ")
        .trim()

      if (cleaned && !questions.includes(cleaned)) {
        questions.push(cleaned.endsWith("?") ? cleaned : `${cleaned}?`)
      }
    })
  })

  return questions.slice(0, 3)
}

const normalizePayloadSubQuestions = (payload: KundliPayload) =>
  normalizeSubQuestions([
    ...sanitizeStringArray(payload.subQuestions, 3, 320),
    sanitizeString(payload.question, 1200),
  ].filter(Boolean))

const sanitizeSpecificHealthClaims = (value: string) => {
  const protectedCancerSign = "__SHREEM_ZODIAC_CANCER__"
  const protectedValue = value
    .replace(
      /\b(in|from|to|through|sign of|lord of|rashi of)\s+Cancer\b/g,
      (match) => match.replace(/\bCancer\b/g, protectedCancerSign)
    )
    .replace(
      /\bCancer\b(?=\s*(Lagna|Ascendant|Rashi|rashi|sign|house|zodiac|rising|Moon|moon|Sun|sun|:|,|;|\)|$))/g,
      protectedCancerSign
    )

  return protectedValue
    .replace(/\b(cancer|cancerous)\s+(diagnosis|disease|risk|prediction|illness|condition)\b/gi, "serious health concern")
    .replace(/\b(diagnosis|disease|risk|prediction|illness|condition)\s+(of\s+)?cancer\b/gi, "serious health concern")
    .replace(/\bcancer\b/g, "serious health concern")
    .replace(/\btumou?rs?\b/gi, "abnormal health concern")
    .replace(/\bdiabetes\b/gi, "metabolic imbalance")
    .replace(/\bthyroid\b/gi, "hormonal and throat-region")
    .replace(/\b(bp|blood pressure)\b/gi, "cardio-metabolic")
    .replace(/\barthritis\b/gi, "joint and mobility")
    .replace(/\bsurger(y|ies)\b/gi, "medical procedure")
    .replace(/\bhospitali[sz]ation(s)?\b/gi, "medical care")
    .replace(/\baccident(s)?\b/gi, "safe-travel caution")
    .replace(new RegExp(protectedCancerSign, "g"), "Cancer")
}

const sanitizeKundliLanguage = <T,>(value: T): T => {
  if (typeof value === "string") {
    return sanitizeSpecificHealthClaims(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeKundliLanguage(item)) as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeKundliLanguage(item),
      ])
    ) as T
  }

  return value
}

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
  naturalPlanets?: string[]
}

type MedicalWatchSignal = {
  condition: string
  severity: "low" | "medium" | "high"
  chart_basis: string
  dasha_trigger: string
  prevention: string
}

type DashaTimingPeriod = DashaPeriod & {
  depth: number
  parentPath?: string
  role?: string
  score?: number
  focus?: string
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
    score?: number
    confidence?: "low" | "medium" | "high"
    caution: string
  }>
  exact_timing_windows: Array<{
    period: string
    lord: string
    role: string
    window: string
    score: number
    confidence: "low" | "medium" | "high"
    basis: string
    avoid: string
    do: string
  }>
  retrospective_timing_windows: CriticalPeriodAnalysis["exact_timing_windows"]
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
  if (!rahuToKetu && !ketuToRahu) {
    return null
  }

  const subtype = KAAL_SARP_TYPES[rahu.house]
  const arcDirection = rahuToKetu ? "Rahu to Ketu" : "Ketu to Rahu"

  return {
    key: `kaal-sarp-complete-${rahu.house}-${ketu.house}`,
    name: "Kaal Sarp Yoga",
    category: "dosha",
    status: "complete",
    strength: "high",
    subtype: subtype
      ? `${subtype.name} type, Rahu in house ${rahu.house} and Ketu in house ${ketu.house}`
      : `Rahu house ${rahu.house} / Ketu house ${ketu.house}`,
    planets: ["Rahu", "Ketu", ...classicalPlanets.map((planet) => planet.name)],
    houses: [rahu.house, ketu.house],
    chart_basis: `All seven classical grahas are enclosed within the ${arcDirection} Rahu-Ketu axis; Rahu is in house ${rahu.house}, Ketu is in house ${ketu.house}. If even one classical graha falls outside this axis, this detector returns no Kaal Sarp Yoga.`,
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
    const moonDignity = getPlanetDignity(moon)
    const jupiterDignity = getPlanetDignity(jupiter)
    const moonDistance = getHouseDistance(moon, jupiter)
    const weakeningFactors = [
      DUSTHANA_HOUSES.includes(moon.house)
        ? `Moon is in dusthana house ${moon.house}`
        : "",
      DUSTHANA_HOUSES.includes(jupiter.house)
        ? `Jupiter is in dusthana house ${jupiter.house}`
        : "",
      moonDignity === "debilitated" ? "Moon is debilitated" : "",
      jupiterDignity === "debilitated" ? "Jupiter is debilitated" : "",
      rahu && (rahu.sign === moon.sign || rahu.sign === jupiter.sign)
        ? "Rahu conjoins the Moon-Jupiter sign field"
        : "",
      ketu && (ketu.sign === moon.sign || ketu.sign === jupiter.sign)
        ? "Ketu conjoins the Moon-Jupiter sign field"
        : "",
      saturn && (saturn.sign === moon.sign || saturn.sign === jupiter.sign)
        ? "Saturn adds delay/pressure to the Moon-Jupiter field"
        : "",
      mars && (mars.sign === moon.sign || mars.sign === jupiter.sign)
        ? "Mars adds heat to the Moon-Jupiter field"
        : "",
    ].filter(Boolean)
    const strength =
      weakeningFactors.length === 0 &&
      !["debilitated"].includes(moonDignity) &&
      !["debilitated"].includes(jupiterDignity)
        ? "high"
        : weakeningFactors.length <= 2
          ? "medium"
          : "low"

    addDetectedCase(cases, {
      key: "gajakesari-yoga",
      name: "Gajakesari Yoga",
      category: "yoga",
      status: "complete",
      strength,
      planets: ["Moon", "Jupiter"],
      houses: [moon.house, jupiter.house],
      chart_basis: `Jupiter is ${moonDistance} houses from Moon, forming a kendra relation. Moon: ${moon.sign} house ${moon.house}, dignity ${moonDignity}. Jupiter: ${jupiter.sign} house ${jupiter.house}, dignity ${jupiterDignity}.${
        weakeningFactors.length
          ? ` Weakening factors checked: ${weakeningFactors.join("; ")}.`
          : " No major dusthana, debility, or nodal conjunction weakening was found in the automated first pass."
      }`,
      combined_effect:
        strength === "low"
          ? "The classical Moon-Jupiter kendra exists, but its output needs caution because weakening factors reduce easy protection. It can still improve judgement when dasha and conduct support it."
          : "Protective judgement, learning, guidance, counsel, and public goodwill improve when Moon/Jupiter dashas, their houses, or supportive gochar activate.",
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
  { condition: "cardio-metabolic prevention", planets: ["Sun", "Mars", "Saturn", "Jupiter", "Venus", "Moon"], houses: [1, 2, 6, 8, 12], note: "track routine vitals, sleep, stress, food discipline and family-risk screening when medically advised" },
  { condition: "hormonal and throat-region vigilance", planets: ["Moon", "Mercury", "Venus", "Rahu"], houses: [2, 3, 6, 8], note: "watch energy, weight, mood, throat/neck symptoms and use medical tests only when advised" },
  { condition: "joints, bones and mobility care", planets: ["Saturn", "Mars", "Ketu", "Sun"], houses: [1, 6, 8, 10, 12], note: "protect posture, mobility, strength, recovery time and injury prevention" },
  { condition: "sudden injury and safe-travel caution", planets: ["Mars", "Rahu", "Ketu", "Saturn"], houses: [1, 3, 6, 8, 12], note: "drive slowly, avoid risky tools/haste and treat injuries promptly" },
  { condition: "digestion and liver-region routine", planets: ["Mars", "Sun", "Jupiter", "Moon", "Ketu"], houses: [2, 5, 6, 8], note: "keep food timing, hydration, moderation and medical follow-up for persistent symptoms" },
  { condition: "urinary, reproductive and tissue-balance wellness", planets: ["Venus", "Moon", "Mars", "Rahu", "Saturn"], houses: [5, 6, 7, 8, 12], note: "track hydration, reproductive/urinary symptoms, tissue changes and hormonal balance through qualified care", naturalPlanets: ["Venus"] },
  { condition: "respiratory, allergy and skin sensitivity", planets: ["Moon", "Mercury", "Rahu", "Ketu", "Saturn"], houses: [1, 3, 4, 6, 12], note: "watch environmental triggers, recurring irritation and persistent respiratory or skin symptoms" },
  { condition: "mind, sleep and nervous-system pressure", planets: ["Moon", "Rahu", "Saturn", "Ketu", "Mercury"], houses: [1, 4, 6, 8, 12], note: "protect sleep, reduce stimulants and seek support early for persistent distress" },
  { condition: "recovery, isolation and hospital-expense caution", planets: ["Saturn", "Ketu", "Rahu"], houses: [6, 8, 12], note: "keep health records, insurance, emergency contacts and follow-up discipline" },
  { condition: "heat, inflammation and overexertion caution", planets: ["Sun", "Mars", "Rahu"], houses: [1, 3, 6, 8, 12], note: "hydrate, avoid overtraining and do not ignore fever, pain or exhaustion" },
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

const isAssociatedWithAny = (
  chart: PrashnaChart | undefined,
  planetName: string,
  targetPlanets: string[]
) => {
  if (!chart || !targetPlanets.length || targetPlanets.includes(planetName)) {
    return false
  }

  const planet = getPlanet(chart, planetName)
  if (!planet) {
    return false
  }

  const house = planet.bhavaHouse || planet.house

  return targetPlanets.some((targetName) => {
    const target = getPlanet(chart, targetName)

    if (!target) {
      return false
    }

    const targetHouse = target.bhavaHouse || target.house
    const sameHouse = house === targetHouse
    const aspectConnection = Boolean(
      chart.aspects?.some(
        (aspect) =>
          (aspect.fromPlanet === planetName && aspect.toHouse === targetHouse) ||
          (aspect.fromPlanet === targetName && aspect.toHouse === house)
      )
    )

    return sameHouse || aspectConnection
  })
}

const getPlanetRole = ({
  planet,
  marakaLords,
  badhakesh,
  dusthanaLords,
  chart,
}: {
  planet: string
  marakaLords: string[]
  badhakesh: string
  dusthanaLords: string[]
  chart?: PrashnaChart
}) => {
  const associatedWithMaraka = isAssociatedWithAny(chart, planet, marakaLords)
  const associatedWithBadhakesh = badhakesh
    ? isAssociatedWithAny(chart, planet, [badhakesh])
    : false
  const associatedWithDusthana = isAssociatedWithAny(chart, planet, dusthanaLords)

  return [
    marakaLords.includes(planet) ? "maraka" : "",
    associatedWithMaraka ? "associated with maraka lord" : "",
    badhakesh === planet ? "badhakesh" : "",
    associatedWithBadhakesh ? "associated with badhakesh" : "",
    dusthanaLords.includes(planet) ? "6th/8th/12th lord" : "",
    associatedWithDusthana ? "associated with 6th/8th/12th lord" : "",
    ["Rahu", "Ketu"].includes(planet) ? "nodal karaka" : "",
    ["Mars", "Saturn"].includes(planet) ? "accident/chronic pressure karaka" : "",
  ]
    .filter(Boolean)
    .join(", ")
}

const getCriticalTimingScore = ({
  period,
  role,
  parentPath,
  activePeriods = [],
}: {
  period: DashaTimingPeriod
  role: string
  parentPath: string
  activePeriods?: DashaPeriod[]
}) => {
  const roleParts = Array.from(
    new Set(
      role
        .split(/[,;]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
  const hasRole = (pattern: RegExp) => roleParts.some((item) => pattern.test(item))
  const start = new Date(period.startIso).getTime()
  const end = new Date(period.endIso).getTime()
  const durationDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24))
  let score =
    period.level === "antardasha"
      ? 8
      : period.level === "pratyantar"
      ? 6
      : period.level === "sookshma"
      ? 4
      : 2

  if (hasRole(/\bmaraka\b/)) score += 8
  if (hasRole(/associated with maraka/)) score += 3
  if (hasRole(/\bbadhakesh\b/)) score += 7
  if (hasRole(/associated with badhakesh/)) score += 3
  if (hasRole(/6th\/8th\/12th lord/)) score += 5
  if (hasRole(/associated with 6th\/8th\/12th lord/)) score += 2
  if (hasRole(/nodal/)) score += 3
  if (hasRole(/accident\/chronic/)) score += 2

  score += Math.min(roleParts.length, 6)
  score += Math.min(parentPath.split("/").filter(Boolean).length * 2, 6)

  if (durationDays < 14) score -= 3
  else if (durationDays < 45) score -= 1
  else if (durationDays > 365 * 3) score -= 2
  else if (durationDays > 90 && durationDays <= 365 * 2) score += 2

  activePeriods.forEach((activePeriod) => {
    if (activePeriod.lord === period.lord) {
      score += activePeriod.level === "antardasha" ? 4 : 2
    }
    if (parentPath.split("/").includes(activePeriod.lord)) {
      score += 2
    }
  })

  return Math.max(0, Math.round(score))
}

const countCriticalRoleFamilies = (role: string) => {
  const families = new Set<string>()

  if (/\bmaraka\b|associated with maraka/.test(role)) families.add("maraka")
  if (/\bbadhakesh\b|associated with badhakesh/.test(role)) families.add("badhaka")
  if (/6th\/8th\/12th/.test(role)) families.add("dusthana")
  if (/nodal/.test(role)) families.add("node")
  if (/accident\/chronic/.test(role)) families.add("hard-karaka")

  return families.size
}

const overlapsPeriod = (
  period: Pick<DashaPeriod, "startIso" | "endIso">,
  from: Date,
  to: Date
) => new Date(period.endIso) >= from && new Date(period.startIso) <= to

const getCriticalTimingBasis = (
  level: DashaPeriod["level"],
  scope: "retrospective" | "prospective"
) =>
  `${scope === "retrospective" ? "Birth-to-current" : "Next-30-year"} Vimshottari scan: ${
  level === "antardasha"
    ? "Mahadasha and Antardasha lord roles filtered by Maraka, Badhakesh, Dusthana, Rahu/Ketu, Mars and Saturn."
  : level === "pratyantar"
    ? "Pratyantar narrowed inside high-risk Mahadasha/Antardasha combinations."
    : "Sookshma retained only when the parent chain repeats multiple independent pressure factors."
  }`

const getCriticalWindowGuidance = (role: string) => ({
  avoid: [
    /nodal|badhakesh/.test(role) ? "intoxicants, shortcuts, obsession-driven decisions" : "avoidable haste",
    /accident\/chronic/.test(role) ? "speeding, risky tools, aggressive conflict and sleep-deprived travel" : "unnecessary conflict",
    /6th\/8th\/12th/.test(role) ? "ignoring persistent symptoms, unmanaged debt and prolonged overwork" : "overexertion",
  ].join("; "),
  do: "Keep sleep and medication routines stable, use safer travel margins, complete routine health checks, review insurance/emergency contacts, and seek qualified medical help for symptoms.",
})

const buildCriticalTimingWindows = ({
  chart,
  marakaLords,
  badhakesh,
  dusthanaLords,
  from,
  to,
  scope,
}: {
  chart: PrashnaChart
  marakaLords: string[]
  badhakesh: string
  dusthanaLords: string[]
  from: Date
  to: Date
  scope: "retrospective" | "prospective"
}) => {
  const activePeriods = getActiveDashaPeriods(chart)
  const timeline = buildDashaTimeline(chart)
  const sequence = chart.dasha?.sequence?.length
    ? chart.dasha.sequence
    : ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
  const addCandidate = (
    period: DashaTimingPeriod,
    ancestry: string[],
    includeCurrentBoost = false
  ) => {
    if (!overlapsPeriod(period, from, to)) {
      return null
    }

    const role = getPlanetRole({
      planet: period.lord,
      marakaLords,
      badhakesh,
      dusthanaLords,
      chart,
    })
    const parentRoles = ancestry
      .map((lord) =>
        getPlanetRole({
          planet: lord,
          marakaLords,
          badhakesh,
          dusthanaLords,
          chart,
        })
      )
      .filter(Boolean)
    const combinedRole = Array.from(
      new Set(
        [role, ...parentRoles]
          .flatMap((item) => item.split(/[,;]/))
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ).join("; ")

    if (!combinedRole) {
      return null
    }

    const hasMarakaOrBadhakesh =
      combinedRole.includes("maraka") || combinedRole.includes("badhakesh")
    const hasPressureTrigger =
      combinedRole.includes("6th/8th/12th") ||
      combinedRole.includes("nodal") ||
      combinedRole.includes("accident/chronic")
    const roleFamilyCount = countCriticalRoleFamilies(combinedRole)

    if (!hasMarakaOrBadhakesh || !hasPressureTrigger || roleFamilyCount < 3) {
      return null
    }

    const parentPath = ancestry.join("/")
    const score = getCriticalTimingScore({
      period,
      role: combinedRole,
      parentPath,
      activePeriods: includeCurrentBoost ? activePeriods : [],
    }) + Math.min(parentRoles.length * 2, 6)

    const guidance = getCriticalWindowGuidance(combinedRole)

    return {
      period: `${parentPath ? `${parentPath}/` : ""}${period.lord} ${period.level}`,
      lord: period.lord,
      role: combinedRole,
      window: getPeriodWindow(period),
      score,
      confidence:
        score >= 24 && roleFamilyCount >= 4
          ? "high"
          : score >= 20 && roleFamilyCount >= 3
          ? "medium"
          : "low",
      basis: getCriticalTimingBasis(period.level, scope),
      avoid: guidance.avoid,
      do: guidance.do,
    } satisfies CriticalPeriodAnalysis["exact_timing_windows"][number]
  }
  const candidates: CriticalPeriodAnalysis["exact_timing_windows"] = []

  timeline.mahadashas.forEach((mahadasha) => {
    if (!overlapsPeriod(mahadasha, from, to)) {
      return
    }

    const antardashas = expandDashaChildren({
      parent: mahadasha,
      childLevel: "antardasha",
      sequence,
    })

    antardashas.forEach((antardasha) => {
      const antardashaCandidate = addCandidate(antardasha, [mahadasha.lord])

      if (
        antardashaCandidate &&
        antardashaCandidate.score >= 22 &&
        antardashaCandidate.confidence !== "low"
      ) {
        candidates.push(antardashaCandidate)
      }

      const pratyantars = expandDashaChildren({
        parent: antardasha,
        childLevel: "pratyantar",
        sequence,
      })

      pratyantars.forEach((pratyantar) => {
        const pratyantarCandidate = addCandidate(pratyantar, [
          mahadasha.lord,
          antardasha.lord,
        ])

        if (
          pratyantarCandidate &&
          pratyantarCandidate.score >= 24 &&
          pratyantarCandidate.confidence === "high" &&
          (new Date(pratyantar.endIso).getTime() - new Date(pratyantar.startIso).getTime()) /
            (1000 * 60 * 60 * 24) <=
            45
        ) {
          candidates.push(pratyantarCandidate)
        }

        const sookshmas = expandDashaChildren({
          parent: pratyantar,
          childLevel: "sookshma",
          sequence,
        })

        sookshmas.forEach((sookshma) => {
          const sookshmaCandidate = addCandidate(sookshma, [
            mahadasha.lord,
            antardasha.lord,
            pratyantar.lord,
          ])

          if (
            sookshmaCandidate &&
            sookshmaCandidate.score >= 26 &&
            sookshmaCandidate.confidence !== "low"
          ) {
            candidates.push({
              ...sookshmaCandidate,
              basis:
                getCriticalTimingBasis("sookshma", scope),
            })
          }
        })
      })
    })
  })

  const deduped = new Map<string, CriticalPeriodAnalysis["exact_timing_windows"][number]>()

  candidates.forEach((candidate) => {
    const key = `${candidate.period}-${candidate.window}`
    const existing = deduped.get(key)

    if (!existing || candidate.score > existing.score) {
      deduped.set(key, candidate)
    }
  })

  const ranked = Array.from(deduped.values())
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return (
        new Date(left.window.split(" to ")[0]).getTime() -
        new Date(right.window.split(" to ")[0]).getTime()
      )
    })
  const selected: CriticalPeriodAnalysis["exact_timing_windows"] = []

  ranked.forEach((candidate) => {
    const start = new Date(candidate.window.split(" to ")[0]).getTime()
    const isTooCloseToSelected = selected.some((existing) => {
      const existingStart = new Date(existing.window.split(" to ")[0]).getTime()
      return Math.abs(existingStart - start) < 1000 * 60 * 60 * 24 * 90
    })

    if (!isTooCloseToSelected) {
      selected.push(candidate)
    }
  })

  return selected
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return (
        new Date(left.window.split(" to ")[0]).getTime() -
        new Date(right.window.split(" to ")[0]).getTime()
      )
    })
    .slice(0, scope === "retrospective" ? 4 : 8)
}

const buildCriticalPeriodAnalysis = (
  chart: PrashnaChart,
  birthDate?: Date
): CriticalPeriodAnalysis => {
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
        chart,
      })

      return role ? `${period.lord} ${period.level}: ${role}` : ""
    })
    .filter(Boolean)
  const currentDate = new Date(chart.dasha?.currentDateIso || chart.generatedAtIso || Date.now())
  const exactTimingWindows = buildCriticalTimingWindows({
    chart,
    marakaLords,
    badhakesh,
    dusthanaLords,
    from: currentDate,
    to: addDashaYears(currentDate, 30),
    scope: "prospective",
  })
  const retrospectiveTimingWindows = birthDate
    ? buildCriticalTimingWindows({
        chart,
        marakaLords,
        badhakesh,
        dusthanaLords,
        from: birthDate,
        to: currentDate,
        scope: "retrospective",
      }).sort(
        (left, right) =>
          new Date(left.window.split(" to ")[0]).getTime() -
          new Date(right.window.split(" to ")[0]).getTime()
      )
    : []
  const watchPeriods = exactTimingWindows.map((period) => ({
    period: period.period,
    lord: period.lord,
    role: period.role,
    window: period.window,
    score: period.score,
    confidence: period.confidence,
    caution:
      "Use this short prevention window for careful routine, safe travel, screening reminders, and avoiding haste. It is not a guaranteed event or medical diagnosis.",
  }))

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

      if (rule.naturalPlanets?.includes(period.lord)) {
        score += period.level === "mahadasha" ? 2 : period.level === "antardasha" ? 2 : 1
        basis.push(`${period.lord} natural significator active as ${period.level}`)
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

    if (score < 6) {
      return null
    }

    return {
      condition: rule.condition,
      severity: score >= 7 ? "high" : score >= 5 ? "medium" : "low",
      chart_basis: basis.slice(0, 5).join("; "),
      dasha_trigger: activeTriggers.join(" | ") || activeDashaText(chart),
      prevention: `${rule.note}. This is a Jyotish prevention signal only, not a disease prediction; consult a qualified doctor for symptoms and routine screening.`,
    } satisfies MedicalWatchSignal
  })
    .filter((item): item is MedicalWatchSignal => Boolean(item))
    .sort((left, right) => {
      const rank = { high: 3, medium: 2, low: 1 }
      return rank[right.severity] - rank[left.severity]
    })
    .slice(0, 4)

  return {
    maraka_lords: marakaLords,
    badhaka_house: badhakaHouse,
    badhakesh,
    active_triggers: activeTriggers,
    watch_periods: watchPeriods,
    exact_timing_windows: exactTimingWindows,
    retrospective_timing_windows: retrospectiveTimingWindows,
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
      "Heat and overexertion watch: Mars-linked combinations can correlate with anger spikes, heat, cuts, burns, infections, or haste. Treat this as a caution to slow down and get medical checks for recurring symptoms."
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

  criticalPeriod.medical_watchlist
    .filter((signal) => signal.severity !== "low")
    .slice(0, 3)
    .forEach((signal) => {
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

const buildGocharImpactPack = (chart: PrashnaChart) => {
  const transits = [
    {
      planet: "Saturn",
      sign: getEnvGocharSign("SATURN", "Pisces"),
      nature: "discipline, delay-management, karmic duty, maturity and pressure-testing",
    },
    {
      planet: "Jupiter",
      sign: getEnvGocharSign("JUPITER", "Cancer"),
      nature: "growth, guidance, protection, learning, counsel and expansion",
    },
    {
      planet: "Rahu",
      sign: getEnvGocharSign("RAHU", "Aquarius"),
      nature: "desire, technology, unusual opportunity, foreign/digital pull and restlessness",
    },
    {
      planet: "Ketu",
      sign: getEnvGocharSign("KETU", "Leo"),
      nature: "detachment, simplification, spiritual correction and ego-cutting",
    },
  ]

  return transits.map((transit) => {
    const fromLagna = getSignDistance(chart.ascendant, transit.sign)
    const fromMoon = getSignDistance(chart.moonSign, transit.sign)
    const lagnaTheme = HOUSE_THEMES[fromLagna - 1] || "life direction"
    const moonTheme = HOUSE_THEMES[fromMoon - 1] || "mind and experience"
    const natalHouse = chart.houses.find((house) => house.sign === transit.sign)
    const natalPlanets = chart.planets
      .filter((planet) => planet.sign === transit.sign)
      .map((planet) => planet.name)

    return {
      planet: transit.planet,
      sign: transit.sign,
      from_lagna: fromLagna,
      from_moon: fromMoon,
      lagna_theme: lagnaTheme,
      moon_theme: moonTheme,
      natal_house: natalHouse?.house || fromLagna,
      natal_house_theme: natalHouse?.theme || lagnaTheme,
      natal_planets: natalPlanets,
      reading: `${transit.planet} gochar in ${transit.sign} activates house ${fromLagna} from Lagna (${lagnaTheme}) and house ${fromMoon} from Moon (${moonTheme}). It works as ${transit.nature}.`,
    }
  })
}

const buildGocharImpactRow = (chart: PrashnaChart) => {
  const pack = buildGocharImpactPack(chart)
  const focus = pack
    .map(
      (item) =>
        `${item.planet} in ${item.sign}: H${item.from_lagna} from Lagna / H${item.from_moon} from Moon (${item.lagna_theme}; ${item.moon_theme})`
    )
    .join(" | ")
  const dashaOverlay = chart.dasha
    ? `Active dasha overlay: ${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar.`
    : "Active dasha overlay unavailable."

  return {
    area: "Gochar impact",
    chart_basis: `Gochar is judged from Lagna ${chart.ascendant} and Moon ${chart.moonSign}, then filtered through Vimshottari. ${focus}. ${dashaOverlay}`,
    prediction:
      "Current Gochar is a trigger layer: Saturn shows where sustained responsibility is required, Jupiter shows where support or growth can open, Rahu shows where desire and digital/foreign pull increase, and Ketu shows where simplification is needed. The strongest results come only when the transit house also matches the active dasha lord, natal house promise, or repeated chart theme.",
    advice:
      "Use Gochar for near-term planning: act faster where Jupiter supports the relevant house, slow down where Saturn/Rahu pressurize decisions, and treat Ketu areas as clean-up or detachment zones. Do not override dasha with transit alone.",
  }
}

const getHouseSummary = (chart: PrashnaChart, houseNumber: number) => {
  const house = chart.houses[houseNumber - 1]
  const lord = house?.signLord ? getPlanet(chart, house.signLord) : null
  const occupants = getHousePlanets(chart, houseNumber)
  const aspects = (chart.aspects || []).filter((aspect) => aspect.toHouse === houseNumber)
  const lordText = lord
    ? `${lord.name} in H${lord.bhavaHouse || lord.house} ${lord.sign}`
    : `${house?.signLord || "lord"} placement unavailable`
  const lordImpact =
    lord && typeof lord.bhavaImpactPercent === "number"
      ? `${lord.bhavaImpactPercent}% ${lord.bhavaImpactState || "bhava"} impact`
      : "impact not measured"

  return {
    house,
    lord,
    occupants,
    aspects,
    basis: `H${houseNumber} ${house?.sign || "-"} ruled by ${
      house?.signLord || "-"
    }; lord ${lordText} (${lord ? getPlanetDignity(lord) : "unknown dignity"}, ${lordImpact}); occupants ${
      occupants.map((planet) => planet.name).join(", ") || "none"
    }; drishti from ${aspects.map((aspect) => aspect.fromPlanet).join(", ") || "none"}.`,
  }
}

const getDignityTilt = (planet?: PrashnaPlanet | null) => {
  if (!planet) {
    return 0
  }

  const dignity = getPlanetDignity(planet).toLowerCase()
  if (/exalted|own sign|moolatrikona|friendly/.test(dignity)) {
    return 2
  }
  if (/debilitated|enemy|combust/.test(dignity)) {
    return -2
  }
  return 0
}

const getBhavaTilt = (planet?: PrashnaPlanet | null) => {
  if (!planet || typeof planet.bhavaImpactPercent !== "number") {
    return 0
  }
  if (planet.bhavaImpactPercent >= 75) {
    return 2
  }
  if (planet.bhavaImpactPercent >= 45) {
    return 1
  }
  if (planet.bhavaImpactState === "sandhi" || planet.bhavaImpactPercent < 25) {
    return -2
  }
  return 0
}

const buildLifeAreaNet = (
  chart: PrashnaChart,
  area: string,
  summaries: ReturnType<typeof getHouseSummary>[]
) => {
  const activePeriods = getActiveDashaPeriods(chart)
  let support = 0
  let pressure = 0
  const causes: string[] = []
  const protections: string[] = []
  const cautions: string[] = []
  const activeLinks: string[] = []

  summaries.forEach((summary) => {
    const houseNumber = summary.house?.house
    const lord = summary.lord
    const occupants = summary.occupants
    const aspects = summary.aspects
    const lordTilt = getDignityTilt(lord) + getBhavaTilt(lord)
    const houseLabel = houseNumber ? `H${houseNumber}` : "this house"

    if (lord) {
      const lordHouse = lord.bhavaHouse || lord.house
      const effect = PLANET_PLAIN_EFFECT[lord.name] || lord.name
      causes.push(
        `${houseLabel} lord ${lord.name} works from H${lordHouse} with ${getPlanetDignity(lord)} dignity and ${lord.bhavaImpactPercent ?? "-"}% Chalit delivery, so ${area.toLowerCase()} expresses through ${getHouseEventSignal(uniqueNumbers([lordHouse, ...getPlanetOwnedHouses(chart, lord.name)]))}`
      )
      if (lordTilt > 0) {
        support += lordTilt
        protections.push(`${lord.name} supports through ${effect}`)
      } else if (lordTilt < 0) {
        pressure += Math.abs(lordTilt)
        cautions.push(`${lord.name} needs correction because its dignity/Chalit strength is weak or unstable`)
      }
    }

    occupants.forEach((planet) => {
      const effect = PLANET_PLAIN_EFFECT[planet.name] || planet.name
      const occupantTilt =
        (BENEFIC_PLANETS.includes(planet.name) ? 1 : 0) +
        getDignityTilt(planet) +
        getBhavaTilt(planet)
      if (occupantTilt >= 1) {
        support += occupantTilt
        protections.push(`${planet.name} placed in ${houseLabel} adds ${effect}`)
      } else {
        const pressureTilt =
          (PRESSURE_PLANETS.includes(planet.name) ? 1 : 0) +
          Math.abs(Math.min(0, occupantTilt))
        pressure += pressureTilt
        if (pressureTilt > 0) {
          cautions.push(`${planet.name} in ${houseLabel} brings ${effect}, so this area needs discipline`)
        }
      }
    })

    aspects.forEach((aspect) => {
      const effect = PLANET_PLAIN_EFFECT[aspect.fromPlanet] || aspect.fromPlanet
      if (BENEFIC_PLANETS.includes(aspect.fromPlanet)) {
        support += aspect.aspectType === "special" || aspect.aspectType === "node-special" ? 2 : 1
        protections.push(`${aspect.fromPlanet} drishti protects ${houseLabel} through ${effect}`)
      }
      if (PRESSURE_PLANETS.includes(aspect.fromPlanet)) {
        pressure += aspect.aspectType === "special" || aspect.aspectType === "node-special" ? 2 : 1
        cautions.push(`${aspect.fromPlanet} drishti pressures ${houseLabel} through ${effect}`)
      }
    })

    activePeriods.forEach((period) => {
      const periodPlanet = getPlanet(chart, period.lord)
      const periodHouse = periodPlanet?.bhavaHouse || periodPlanet?.house
      const ownedHouses = getPlanetOwnedHouses(chart, period.lord)
      if (
        houseNumber &&
        (periodHouse === houseNumber ||
          ownedHouses.includes(houseNumber) ||
          occupants.some((planet) => planet.name === period.lord) ||
          aspects.some((aspect) => aspect.fromPlanet === period.lord))
      ) {
        const tilt = getDignityTilt(periodPlanet) + getBhavaTilt(periodPlanet)
        if (tilt >= 0) {
          support += 1 + tilt
        } else {
          pressure += 1 + Math.abs(tilt)
        }
        activeLinks.push(`${period.lord} ${period.level} activates H${houseNumber} during ${getPeriodWindow(period)}`)
      }
    })
  })

  const net =
    support >= pressure + 3
      ? "supportive"
      : pressure >= support + 3
      ? "challenging"
      : "mixed but usable"
  const strongestCause = uniqueStrings(causes).slice(0, 2).join(" ")
  const strongestProtection = uniqueStrings(protections).slice(0, 2).join("; ")
  const strongestCaution = uniqueStrings(cautions).slice(0, 2).join("; ")
  const timing = uniqueStrings(activeLinks).slice(0, 2).join("; ")

  return {
    net,
    support,
    pressure,
    prediction: [
      `${area} is ${net} in this chart after combining lordship, occupants, drishti, dignity and Bhava Chalit delivery.`,
      strongestCause,
      strongestProtection ? `Support: ${strongestProtection}.` : "",
      strongestCaution ? `Caution: ${strongestCaution}.` : "",
      timing ? `Timing: ${timing}.` : "Timing: this area is more background now and becomes stronger when its lord or occupied house enters dasha.",
    ].filter(Boolean).join(" "),
  }
}

const buildLifeAreaPredictionRows = (chart: PrashnaChart) => {
  const dashaText = chart.dasha
    ? `${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar`
    : "Vimshottari dasha unavailable"
  const row = ({
    area,
    houses,
    advice,
  }: {
    area: string
    houses: number[]
    advice: string
  }) => {
    const summaries = houses.map((house) => getHouseSummary(chart, house))
    const net = buildLifeAreaNet(chart, area, summaries)
    const planets = uniqueStrings(
      summaries.flatMap((summary) => [
        summary.house?.signLord || "",
        summary.lord?.name || "",
        ...summary.occupants.map((planet) => planet.name),
        ...summary.aspects.map((aspect) => aspect.fromPlanet),
      ])
    ).filter(Boolean)

    return {
      area,
      chart_basis: `${summaries.map((summary) => summary.basis).join(" ")} Active period: ${dashaText}.`,
      prediction: net.prediction,
      advice: `${advice} Watch ${planets.slice(0, 5).join(", ") || "relevant lords"} periods for timing. Net score support ${net.support}, pressure ${net.pressure}; use Gochar only as a trigger after dasha agrees.`,
    }
  }

  return [
    row({
      area: "Life path, personality and decision style",
      houses: [1, 3, 5, 9],
      advice:
        "Make big decisions through the strongest supported house in this group and avoid reacting from the pressured house.",
    }),
    row({
      area: "Current dasha and life direction",
      houses: [1, 6, 8, 10],
      advice:
        "Use the current Antardasha for main decisions and the Pratyantar for short execution windows.",
    }),
    row({
      area: "Career and professional growth",
      houses: [10, 6, 11, 3],
      advice:
        "Build measurable skill, public proof, delivery discipline and network reach during supportive dasha windows; reduce career risk when 6th/8th/12th pressure dominates.",
    }),
    row({
      area: "Money, savings and wealth building",
      houses: [2, 5, 9, 11],
      advice:
        "Separate income, savings, risk capital and debt; avoid speculation when 6th/8th/12th pressure dominates.",
    }),
    row({
      area: "Business and entrepreneurship",
      houses: [3, 6, 7, 10, 11],
      advice:
        "Use a weekly sales pipeline, clear contracts, and proof of demand before scaling expenses.",
    }),
    row({
      area: "Marriage, relationship and public dealing",
      houses: [2, 7, 8, 11],
      advice:
        "For improvement, strengthen Venus/Jupiter conduct: respect, cleanliness, counsel, family transparency and patience before gemstones.",
    }),
    row({
      area: "Family, home, property and emotional base",
      houses: [2, 4, 8, 12],
      advice:
        "Keep documents, family communication, property decisions and home expenses structured.",
    }),
    row({
      area: "Education, children, creativity and guidance",
      houses: [5, 9, 3, 11],
      advice:
        "Choose one learning track and convert it into visible work, teaching, content or a useful skill.",
    }),
    row({
      area: "Status, reputation and public visibility",
      houses: [1, 7, 10, 11],
      advice:
        "Avoid reputation shortcuts. Publish proof of work, keep commitments visible, and use supportive 10th/11th periods for launches or public moves.",
    }),
    row({
      area: "Health, routine and mental wellbeing",
      houses: [1, 6, 8, 12],
      advice:
        "Use watch periods for sleep discipline, screening reminders, safer travel and doctor consultation for symptoms.",
    }),
    row({
      area: "Foreign links, spirituality, isolation and expenses",
      houses: [9, 12, 4, 10],
      advice:
        "Plan travel and expenses deliberately, and use spiritual practice as grounding rather than escapism.",
    }),
    row({
      area: "Remedies, conduct and improvement path",
      houses: [1, 5, 9, 12],
      advice:
        "Start with conduct, daan, mantra, seva, cleanliness and routine; use gemstones or major pooja only after expert review confirms the exact graha is safe to strengthen.",
    }),
  ]
}

type TargetedRemedy = {
  pain_point: string
  chart_basis: string
  mantra_or_pooja: string
  daily_practice: string
}

const getGrahaPressureScore = (
  chart: PrashnaChart,
  planetName: string,
  relatedHouses: number[] = []
) => {
  const planet = getPlanet(chart, planetName)

  if (!planet) {
    return 0
  }

  const dignity = getPlanetDignity(planet)
  const bhavaHouse = planet.bhavaHouse || planet.house
  const ownedHouses = getPlanetOwnedHouses(chart, planetName)
  const receivedPressure = chart.aspects?.filter(
    (aspect) =>
      aspect.toHouse === bhavaHouse && PRESSURE_PLANETS.includes(aspect.fromPlanet)
  ).length || 0
  const receivedSupport = chart.aspects?.filter(
    (aspect) =>
      aspect.toHouse === bhavaHouse && BENEFIC_PLANETS.includes(aspect.fromPlanet)
  ).length || 0
  const activeBoost = getActiveDashaPeriods(chart).some(
    (period) => period.lord === planetName
  )
    ? 3
    : 0
  const relatedHouseBoost = relatedHouses.some(
    (house) => house === bhavaHouse || ownedHouses.includes(house)
  )
    ? 2
    : 0

  return Math.max(
    0,
    (DUSTHANA_HOUSES.includes(bhavaHouse) ? 3 : 0) +
      (dignity === "debilitated" ? 3 : 0) +
      (["Rahu", "Ketu", "Mars", "Saturn"].includes(planetName) ? 2 : 0) +
      receivedPressure * 2 -
      receivedSupport +
      activeBoost +
      relatedHouseBoost
  )
}

const getRemedyIntensity = (score: number) =>
  score >= 9 ? "high" : score >= 5 ? "medium" : "gentle"

const grahaCalculationLine = ({
  chart,
  planets,
  houses,
}: {
  chart: PrashnaChart
  planets: string[]
  houses: number[]
}) => {
  const scored = planets.map((planet) => ({
    planet,
    score: getGrahaPressureScore(chart, planet, houses),
  }))
  const total = scored.reduce((sum, item) => sum + item.score, 0)
  const intensity = getRemedyIntensity(total)

  return {
    total,
    intensity,
    line: `Remedy calculation: ${scored
      .map((item) => `${item.planet} pressure ${item.score}`)
      .join(", ")}; combined score ${total}, intensity ${intensity}.`,
  }
}

const protocolLine = ({
  intensity,
  gentle,
  medium,
  high,
}: {
  intensity: string
  gentle: string
  medium: string
  high: string
}) => {
  if (intensity === "high") {
    return high
  }

  if (intensity === "medium") {
    return medium
  }

  return gentle
}

const buildTargetedRemedySeeds = (
  chart: PrashnaChart,
  detectedYogas: string[],
  healthIndicators: string[]
): TargetedRemedy[] => {
  const remedies: TargetedRemedy[] = []
  const expertStoneLine = (lord?: string) => {
    const stone = lord ? GEMSTONES_BY_LORD[lord] : null

    return stone
      ? ` Gemstone support only after expert review: ${stone.primary}${
          stone.alternatives.length ? `, alternatives ${stone.alternatives.join(", ")}` : ""
        }. ${stone.caution}`
      : " Gemstone support should be decided only after expert review; do not wear a stone casually."
  }
  const completePractice = ({
    daan,
    conduct,
    stoneLord,
  }: {
    daan: string
    conduct: string
    stoneLord?: string
  }) => `${conduct} Daan/seva: ${daan}.${expertStoneLine(stoneLord)}`
  const addRemedy = (remedy: TargetedRemedy) => {
    if (!remedies.some((item) => item.pain_point === remedy.pain_point)) {
      remedies.push(remedy)
    }
  }
  const yogaText = detectedYogas.join(" ").toLowerCase()

  if (yogaText.includes("kaal sarp")) {
    const calc = grahaCalculationLine({
      chart,
      planets: ["Rahu", "Ketu"],
      houses: [1, 2, 6, 7, 8, 12],
    })
    addRemedy({
      pain_point: "Rahu-Ketu pressure, sudden reversals, fear, and obsessive loops",
      chart_basis: `Detected Kaal Sarp-style enclosure by the Rahu-Ketu axis. ${calc.line} The aim is not to strengthen Rahu/Ketu; it is to pacify and reduce their disruptive grip while strengthening Ganesh/Durga discipline and the Lagna lord.`,
      mantra_or_pooja:
        `Pooja: ${protocolLine({
          intensity: calc.intensity,
          gentle:
            "for 21 Saturdays, begin with Ganesh vandana, light a sesame-oil diya, chant Om Rahave Namah and Om Ketave Namah 108 times each, and close with Durga prayer.",
          medium:
            "perform a 40-day Rahu-Ketu shanti sankalp with Ganesh pujan first, Durga Saptashati kavach/Argala/Kilak reading where possible, and Saturday Rahu-Ketu mantra 108 or 324 times.",
          high:
            "take expert-guided Rahu-Ketu shanti with Ganesh pujan, Navagraha shanti, Durga/Bhairav upasana and Kalash sankalp; avoid fear-based tantra. This weakens the yoga by pacifying nodes and strengthening sattvic discipline, not by amplifying Rahu.",
        })}`,
      daily_practice: completePractice({
        conduct:
          "Avoid intoxicants, shortcuts, misinformation, obsessive scrolling and fear-based decisions; keep Saturday discipline simple and sober.",
        daan: "donate dark sesame, blankets, coconut, black urad or food to needy people, and serve people who are socially ignored",
      }),
    })
  }

  if (yogaText.includes("manglik") || yogaText.includes("angarak")) {
    const calc = grahaCalculationLine({
      chart,
      planets: yogaText.includes("angarak") ? ["Mars", "Rahu"] : ["Mars"],
      houses: [1, 4, 6, 7, 8, 12],
    })
    addRemedy({
      pain_point: "conflict, anger, inflammation, haste, and relationship heat",
      chart_basis: `Mars sensitivity is detected through Manglik/Angarak-style indicators. ${calc.line} The aim is to discipline Mars and pacify Rahu heat if Angarak is present, not blindly strengthen aggression.`,
      mantra_or_pooja:
        `Pooja: ${protocolLine({
          intensity: calc.intensity,
          gentle:
            "read Hanuman Chalisa every Tuesday, offer sindoor/chameli oil where appropriate, and chant Om Angarakaya Namah 108 times.",
          medium:
            "do 21 Tuesday Hanuman-Mangal shanti: Hanuman Chalisa, Mangal beej mantra 108/324 times, red-flower offering, and anger-control sankalp.",
          high:
            "take expert-guided Mangal shanti or Angarak shanti: Hanuman puja first, Mangal mantra japa, Rahu pacification if Rahu joins/aspects Mars, and Navagraha shanti. The correction is controlled Mars, not more heat.",
        })}`,
      daily_practice: completePractice({
        conduct:
          "Do disciplined physical exercise, pause before arguments, avoid speed and sharp tools in watch periods, and reduce heat in speech.",
        daan: "donate red lentils, jaggery or red cloth when suitable",
        stoneLord: "Mars",
      }),
    })
  }

  if (yogaText.includes("kemadruma") || yogaText.includes("shakata")) {
    const calc = grahaCalculationLine({
      chart,
      planets: ["Moon", "Jupiter"],
      houses: [1, 4, 5, 8, 12],
    })
    addRemedy({
      pain_point: "emotional isolation, fluctuating confidence, sleep, and mental steadiness",
      chart_basis: `Moon/Jupiter support appears sensitive by Kemadruma/Shakata-style indicators. ${calc.line}`,
      mantra_or_pooja:
        `Pooja: ${protocolLine({
          intensity: calc.intensity,
          gentle:
            "do Monday Shiva jal abhishek with calm sankalp and chant Om Som Somaya Namah 108 times.",
          medium:
            "keep 16 Monday Shiva-Chandra shanti, offer water/milk-water to Shivling, chant Chandra mantra 108 times and Guru mantra on Thursdays.",
          high:
            "take expert-guided Chandra shanti with Shiva abhishek and Guru strengthening through Vishnu/Guru puja; stabilize Moon first before any gemstone.",
        })}`,
      daily_practice: completePractice({
        conduct:
          "Keep fixed sleep, reduce late-night stimulation, support motherly figures, and keep the home emotionally clean.",
        daan: "donate rice, milk or white food when suitable",
        stoneLord: "Moon",
      }),
    })
  }

  if (yogaText.includes("saturn-ketu")) {
    const calc = grahaCalculationLine({
      chart,
      planets: ["Saturn", "Ketu"],
      houses: [1, 6, 8, 10, 12],
    })
    addRemedy({
      pain_point: "chronic pressure, duty fatigue, detachment, joints/nerves, and delays",
      chart_basis: `Saturn-Ketu influence is detected in the chart. ${calc.line}`,
      mantra_or_pooja:
        `Pooja: ${protocolLine({
          intensity: calc.intensity,
          gentle:
            "light a sesame-oil diya for Shani or Hanuman on Saturday and chant Om Sham Shanicharaya Namah 108 times.",
          medium:
            "keep 21 Saturdays of Shani-Hanuman discipline: Hanuman Chalisa, Shani stotra, sesame-oil diya and service to workers/elders.",
          high:
            "take expert-guided Shani-Ketu shanti with Hanuman worship, Shani mantra japa, Ganesh/Ketu pacification and service sankalp. Do not use harsh tantra or fear-driven rites.",
        })}`,
      daily_practice: completePractice({
        conduct:
          "Serve elders/workers, keep debt and sleep discipline, finish duties slowly, and avoid isolation as the default response.",
        daan: "donate black sesame, mustard oil, footwear or blankets to workers/needy people",
        stoneLord: "Saturn",
      }),
    })
  }

  if (yogaText.includes("budhaditya")) {
    addRemedy({
      pain_point: "speech pressure, pride, overthinking, study/business decisions, and authority friction",
      chart_basis: "Sun and Mercury share a sign in the automated Budhaditya-style check.",
      mantra_or_pooja:
        "Pooja: offer Surya arghya at sunrise and worship Ganesha/Vishnu on Wednesday. Mantra: chant Om Suryaya Namah on Sunday and Om Bum Budhaya Namah 108 times on Wednesday.",
      daily_practice: completePractice({
        conduct:
          "Write decisions before speaking, keep accounts clean, speak truthfully, and avoid ego-driven communication.",
        daan: "donate wheat/jaggery on Sunday or green moong/books on Wednesday when suitable",
        stoneLord: "Mercury",
      }),
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
        daily_practice: completePractice({
          conduct: remedy.practice,
          daan:
            lord === "Sun"
              ? "donate wheat, jaggery or copper-colored food on Sunday"
              : lord === "Moon"
              ? "donate rice, milk or white food on Monday"
              : lord === "Mars"
              ? "donate red lentils or jaggery on Tuesday"
              : lord === "Mercury"
              ? "donate green moong, stationery or books on Wednesday"
              : lord === "Jupiter"
              ? "donate chana dal, turmeric or yellow food on Thursday"
              : lord === "Venus"
              ? "donate white sweets, curd, perfume or clean clothes on Friday"
              : lord === "Saturn"
              ? "donate black sesame, mustard oil, footwear or blankets on Saturday"
              : "do food daan or seva with humility",
          stoneLord: lord,
        }),
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
        daily_practice: completePractice({
          conduct: remedy.practice,
          daan: "perform weekly food daan or seva connected to the Lagna lord's day",
          stoneLord: lagnaLord.name,
        }),
      })
    }
  }

  if (healthIndicators.length) {
    addRemedy({
      pain_point: "health prevention and recovery discipline",
      chart_basis: healthIndicators[0],
      mantra_or_pooja:
        "Pooja: do Shiva jal abhishek on Monday or Pradosh when possible. Mantra: chant Maha Mrityunjaya Mantra 108 times daily for 21 or 40 days, without skipping medical advice.",
      daily_practice: completePractice({
        conduct:
          "Keep sleep, hydration, movement, and checkups steady; consult a qualified doctor for symptoms.",
        daan: "donate medicines, food, water or support to patients/needy people when possible",
      }),
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

const formatDashaDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)

const getPeriodWindow = (period: Pick<DashaPeriod, "startIso" | "endIso">) => {
  const start = new Date(period.startIso)
  const end = new Date(period.endIso)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Timing unavailable"
  }

  return `${formatDashaDate(start)} to ${formatDashaDate(end)}`
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

const uniqueStrings = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  )

const getPlanetOwnedHouses = (chart: PrashnaChart, planetName: string) =>
  chart.houses
    .filter((house) => house.signLord === planetName)
    .map((house) => house.house)

const getHouseTheme = (houseNumber: number) =>
  HOUSE_THEMES[houseNumber - 1] || "life direction"

const getDashaOrderFromLord = (lord: string, sequence: string[]) => {
  const startIndex = Math.max(sequence.indexOf(lord), 0)

  return Array.from({ length: sequence.length }, (_, index) => {
    return sequence[(startIndex + index) % sequence.length]
  })
}

const createTimingPeriod = ({
  lord,
  level,
  start,
  durationYears,
  depth,
  parentPath,
}: {
  lord: string
  level: DashaPeriod["level"]
  start: Date
  durationYears: number
  depth: number
  parentPath?: string
}): DashaTimingPeriod => {
  const end = addDashaYears(start, durationYears)

  return {
    lord,
    level,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startLabel: formatDashaDate(start),
    endLabel: formatDashaDate(end),
    durationYears: Number(durationYears.toFixed(5)),
    depth,
    parentPath,
  }
}

const expandDashaChildren = ({
  parent,
  childLevel,
  sequence,
}: {
  parent: Pick<DashaPeriod, "lord" | "startIso" | "durationYears">
  childLevel: DashaPeriod["level"]
  sequence: string[]
}) => {
  const order = getDashaOrderFromLord(parent.lord, sequence)
  let cursor = new Date(parent.startIso)

  return order.map((lord) => {
    const durationYears =
      (parent.durationYears * (VIMSHOTTARI_YEARS_BY_LORD[lord] || 0)) / 120
    const period = createTimingPeriod({
      lord,
      level: childLevel,
      start: cursor,
      durationYears,
      depth:
        childLevel === "antardasha"
          ? 2
          : childLevel === "pratyantar"
          ? 3
          : childLevel === "sookshma"
          ? 4
          : 5,
      parentPath: `${parent.lord}`,
    })

    cursor = new Date(period.endIso)
    return period
  })
}

const findActivePeriod = <T extends Pick<DashaPeriod, "startIso" | "endIso">>(
  periods: T[],
  target: Date
) =>
  periods.find(
    (period) =>
      target >= new Date(period.startIso) && target < new Date(period.endIso)
  )

const buildMahadashaTimeline = (chart: PrashnaChart) => {
  if (!chart.dasha) {
    return []
  }

  const sequence = chart.dasha.sequence.length
    ? chart.dasha.sequence
    : ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
  const startLord = chart.dasha.balanceAtBirth.lord
  const startIndex = Math.max(sequence.indexOf(startLord), 0)
  const birthStart = new Date(chart.dasha.balanceAtBirth.startIso)
  const fullLordYears = VIMSHOTTARI_YEARS_BY_LORD[startLord] || 0
  const elapsedBeforeBirth = Math.max(
    0,
    fullLordYears - chart.dasha.balanceAtBirth.durationYears
  )
  let cursor = addDashaYears(birthStart, -elapsedBeforeBirth)
  const periods: DashaTimingPeriod[] = []

  for (let index = 0; index < 24; index += 1) {
    const lord = sequence[(startIndex + index) % sequence.length]
    const durationYears = VIMSHOTTARI_YEARS_BY_LORD[lord] || 0
    const period = createTimingPeriod({
      lord,
      level: "mahadasha",
      start: cursor,
      durationYears,
      depth: 1,
    })

    periods.push(period)
    cursor = new Date(period.endIso)
  }

  const from = addDashaYears(birthStart, -50)
  const to = addDashaYears(birthStart, 80)

  return periods.filter(
    (period) => new Date(period.endIso) >= from && new Date(period.startIso) <= to
  )
}

const buildDashaTimeline = (chart: PrashnaChart) => {
  if (!chart.dasha) {
    return {
      range: "Unavailable",
      mahadashas: [] as DashaTimingPeriod[],
      lifetime_antardashas: [] as DashaTimingPeriod[],
      current_antardashas: [] as DashaTimingPeriod[],
      current_pratyantars: [] as DashaTimingPeriod[],
      current_sookshmas: [] as DashaTimingPeriod[],
      current_pranas: [] as DashaTimingPeriod[],
    }
  }

  const sequence = chart.dasha.sequence.length
    ? chart.dasha.sequence
    : ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
  const target = new Date(chart.dasha.currentDateIso)
  const mahadashas = buildMahadashaTimeline(chart)
  const lifetime_antardashas = mahadashas.flatMap((mahadasha) =>
    expandDashaChildren({
      parent: mahadasha,
      childLevel: "antardasha",
      sequence,
    }).map((period) => ({
      ...period,
      parentPath: mahadasha.lord,
    }))
  )
  const currentMahadasha =
    findActivePeriod(mahadashas, target) ||
    ({
      ...chart.dasha.mahadasha,
      depth: 1,
    } satisfies DashaTimingPeriod)
  const current_antardashas = expandDashaChildren({
    parent: currentMahadasha,
    childLevel: "antardasha",
    sequence,
  }).map((period) => ({
    ...period,
    parentPath: currentMahadasha.lord,
  }))
  const currentAntardasha =
    findActivePeriod(current_antardashas, target) ||
    ({
      ...chart.dasha.antardasha,
      depth: 2,
      parentPath: currentMahadasha.lord,
    } satisfies DashaTimingPeriod)
  const current_pratyantars = expandDashaChildren({
    parent: currentAntardasha,
    childLevel: "pratyantar",
    sequence,
  }).map((period) => ({
    ...period,
    parentPath: `${currentMahadasha.lord}/${currentAntardasha.lord}`,
  }))
  const currentPratyantar =
    findActivePeriod(current_pratyantars, target) ||
    ({
      ...chart.dasha.pratyantar,
      depth: 3,
      parentPath: `${currentMahadasha.lord}/${currentAntardasha.lord}`,
    } satisfies DashaTimingPeriod)
  const current_sookshmas = expandDashaChildren({
    parent: currentPratyantar,
    childLevel: "sookshma",
    sequence,
  }).map((period) => ({
    ...period,
    parentPath: `${currentMahadasha.lord}/${currentAntardasha.lord}/${currentPratyantar.lord}`,
  }))
  const currentSookshma = findActivePeriod(current_sookshmas, target)
  const current_pranas = currentSookshma
    ? expandDashaChildren({
        parent: currentSookshma,
        childLevel: "prana",
        sequence,
      }).map((period) => ({
        ...period,
        parentPath: `${currentSookshma.parentPath}/${currentSookshma.lord}`,
      }))
    : []

  return {
    range: "50 years before birth to 80 years after birth, including Mahadasha and Antardasha coverage.",
    mahadashas,
    lifetime_antardashas,
    current_antardashas,
    current_pratyantars,
    current_sookshmas,
    current_pranas,
  }
}

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

const getDashaPriorityScore = ({
  period,
  chart,
  criticalPeriod,
}: {
  period: DashaPeriod
  chart: PrashnaChart
  criticalPeriod: CriticalPeriodAnalysis
}) => {
  const planet = getPlanet(chart, period.lord)
  const ownedHouses = getPlanetOwnedHouses(chart, period.lord)
  const bhavaHouse = planet?.bhavaHouse || planet?.house
  const levelWeight =
    period.level === "mahadasha" ? 40 : period.level === "antardasha" ? 28 : 18
  const dignityWeight =
    planet && getPlanetDignity(planet) === "exalted"
      ? 14
      : planet && getPlanetDignity(planet) === "own sign"
      ? 10
      : planet && getPlanetDignity(planet) === "debilitated"
      ? -12
      : 0
  const houseWeight = ownedHouses.reduce((total, house) => {
    if ([1, 5, 9, 10, 11].includes(house)) return total + 8
    if ([6, 8, 12].includes(house)) return total - 6
    return total + 2
  }, 0)
  const placementWeight = bhavaHouse
    ? [1, 5, 9, 10, 11].includes(bhavaHouse)
      ? 10
      : [6, 8, 12].includes(bhavaHouse)
      ? -8
      : 3
    : 0
  const riskWeight =
    criticalPeriod.maraka_lords.includes(period.lord) ||
    criticalPeriod.badhakesh === period.lord
      ? -8
      : 0

  return levelWeight + dignityWeight + houseWeight + placementWeight + riskWeight
}

const buildDashaDecisionTree = ({
  chart,
  criticalPeriod,
}: {
  chart: PrashnaChart
  criticalPeriod: CriticalPeriodAnalysis
}) => {
  const timeline = buildDashaTimeline(chart)
  const activePeriods = getActiveDashaPeriods(chart)
  const decisionPeriods = [
    ...activePeriods.map((period) => ({
      ...period,
      decisionGroup: "Active period",
    })),
    ...timeline.current_antardashas.map((period) => ({
      ...period,
      decisionGroup: "Current Mahadasha branch",
    })),
    ...timeline.current_pratyantars.map((period) => ({
      ...period,
      decisionGroup: "Current Antardasha branch",
    })),
  ]
  const uniquePeriods = decisionPeriods.filter(
    (period, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.level === period.level &&
          candidate.lord === period.lord &&
          candidate.startIso === period.startIso
      ) === index
  )

  return uniquePeriods
    .map((period) => {
      const planet = getPlanet(chart, period.lord)
      const ownedHouses = getPlanetOwnedHouses(chart, period.lord)
      const bhavaHouse = planet?.bhavaHouse || planet?.house
      const dignity = planet ? getPlanetDignity(planet) : "not placed"
      const riskRole = getPlanetRole({
        planet: period.lord,
        marakaLords: criticalPeriod.maraka_lords,
        badhakesh: criticalPeriod.badhakesh,
        dusthanaLords: [6, 8, 12].map((house) => getHouseLord(chart, house)),
        chart,
      })
      const score = getDashaPriorityScore({ period, chart, criticalPeriod })
      const houses = uniqueNumbers([bhavaHouse, ...(ownedHouses || [])])
      const positiveHouses = houses.filter((house) =>
        [1, 5, 9, 10, 11].includes(house)
      )
      const cautionHouses = houses.filter((house) => [6, 8, 12].includes(house))
      const prevailing =
        score >= 52
          ? "supportive growth factor"
          : score >= 36
          ? "mixed but usable factor"
          : "caution and discipline factor"

      return {
        period: `${period.lord} ${period.level} (${getPeriodWindow(period)})`,
        prevailing_factor: `${prevailing}; ${period.lord} is ${dignity}${
          bhavaHouse ? ` in bhava ${bhavaHouse}` : ""
        } and owns ${ownedHouses.join(", ") || "no houses"}${
          riskRole ? `; risk role: ${riskRole}` : ""
        }; branch: ${period.decisionGroup}`,
        score,
        decision_rule:
          "Mahadasha sets the main life weather, Antardasha decides the active area, Pratyantar triggers short events. Benefic trikona/kendra/10th/11th ownership and dignity raise results; 6th/8th/12th, maraka, badhakesh, debility and harsh drishti reduce or delay results.",
        expected_outcome:
          positiveHouses.length && !cautionHouses.length
            ? `Results are more likely through ${getHouseEventSignal(positiveHouses)}.`
            : positiveHouses.length && cautionHouses.length
            ? `Growth can come with pressure: ${getHouseEventSignal(
                positiveHouses
              )}; manage ${getHouseEventSignal(cautionHouses)} carefully.`
            : cautionHouses.length
            ? `This period needs prevention and discipline around ${getHouseEventSignal(
                cautionHouses
              )}.`
            : `Judge results through ${getHouseEventSignal(houses)}.`,
      }
    })
    .sort((left, right) => {
      const activeLeft = left.prevailing_factor.includes("branch: Active period")
      const activeRight = right.prevailing_factor.includes("branch: Active period")

      if (activeLeft !== activeRight) {
        return activeLeft ? -1 : 1
      }

      return right.score - left.score
    })
    .slice(0, 24)
}

const getHouseQualityLabel = ({
  activeDasha,
  beneficHits,
  pressureHits,
  lordPlanet,
}: {
  activeDasha?: DashaPeriod
  beneficHits: number
  pressureHits: number
  lordPlanet?: PrashnaPlanet
}) => {
  const dignity = lordPlanet ? getPlanetDignity(lordPlanet) : "neutral dignity"

  if (activeDasha && beneficHits >= pressureHits && dignity !== "debilitated") {
    return "active and usable"
  }

  if (activeDasha && pressureHits > beneficHits) {
    return "active but pressure-bearing"
  }

  if (beneficHits > pressureHits + 1 || dignity === "exalted" || dignity === "own sign") {
    return "supportive"
  }

  if (pressureHits > beneficHits + 1 || dignity === "debilitated") {
    return "needs discipline"
  }

  return "mixed/steady"
}

const HOUSE_CUSTOMER_RESULTS: Record<number, { meaning: string; action: string }> = {
  1: {
    meaning: "Identity, confidence and health need disciplined routines, calm decisions and steady self-belief.",
    action: "Protect sleep, body rhythm and speech; avoid impulsive reactions.",
  },
  2: {
    meaning: "Money, family values and speech improve when savings, food habits and communication stay controlled.",
    action: "Keep accounts clean, speak carefully and avoid emotional spending.",
  },
  3: {
    meaning: "Growth comes through courage, marketing, writing, skills and consistent daily effort.",
    action: "Build one visible skill channel and use communication without haste.",
  },
  4: {
    meaning: "Home, property, vehicles and emotional peace improve through stability and practical family decisions.",
    action: "Avoid rushed property/home decisions and keep domestic routines peaceful.",
  },
  5: {
    meaning: "Learning, creativity, children and mantra practice work best with patience and focused study.",
    action: "Strengthen education, mantra and creative discipline; avoid risky speculation.",
  },
  6: {
    meaning: "Obstacles, debt, disputes and health routines can be managed through discipline and service.",
    action: "Keep fitness, paperwork, debt control and conflict handling clean.",
  },
  7: {
    meaning: "Marriage, customers and agreements need fairness, clarity and patience before commitment.",
    action: "Write expectations clearly and avoid ego or hurried promises.",
  },
  8: {
    meaning: "Sudden change, secrets, research and vulnerability need prevention, documentation and expert guidance.",
    action: "Avoid risky shortcuts; keep insurance, records and health checks disciplined.",
  },
  9: {
    meaning: "Fortune grows through teachers, fatherly blessings, dharma, learning and long-distance opportunity.",
    action: "Respect mentors, continue study and avoid rejecting guidance out of pride.",
  },
  10: {
    meaning: "Career and public reputation improve through consistent output, responsibility and visible work.",
    action: "Choose measurable work goals and show progress every week.",
  },
  11: {
    meaning: "Gains come through networks, repeat customers, elder support and practical income systems.",
    action: "Track sales, referrals and collections instead of relying only on hope.",
  },
  12: {
    meaning: "Expenses, sleep, isolation and foreign links need boundaries and spiritual grounding.",
    action: "Control leaks in money/time, improve sleep and keep a simple spiritual routine.",
  },
}

const PLANET_PLAIN_EFFECT: Record<string, string> = {
  Sun: "leadership, visibility and authority",
  Moon: "emotional involvement, family needs and public response",
  Mars: "initiative, technical execution and haste",
  Mercury: "analysis, trade, communication and planning",
  Jupiter: "judgement, learning, guidance and expansion",
  Venus: "relationships, commercial appeal, comfort and refinement",
  Saturn: "responsibility, delay, endurance and long-term structure",
  Rahu: "ambition, technology, foreign links and volatility",
  Ketu: "detachment, specialization, irregularity and simplification",
}

const getCaseWeight = (item: DetectedAstrologyCase) =>
  item.strength === "high" ? 2 : item.strength === "medium" ? 1 : 0

const isSupportiveCase = (item: DetectedAstrologyCase) =>
  item.category === "yoga" ||
  item.category === "cancellation" ||
  item.status === "supportive"

const isPressureCase = (item: DetectedAstrologyCase) =>
  item.category === "dosha" ||
  item.category === "health" ||
  item.status === "watch"

const getCaseHouseEffect = (item: DetectedAstrologyCase, theme: string) => {
  if (item.key.startsWith("kaal-sarp")) {
    return `${item.name} (${item.strength}) concentrates nodal ambition and recurring pressure around ${theme.toLowerCase()}, so progress can come in sharp rises and corrections rather than a smooth line.`
  }
  if (item.key.startsWith("graha-concentration")) {
    return `${item.name} (${item.strength}) makes ${theme.toLowerCase()} a dominant life arena where several duties and events cluster together.`
  }

  const effect = sanitizeSpecificHealthClaims(item.combined_effect)
    .replace(/\b(read|judge|assess|analyse|analyze|modify|filter)\b[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  const direction = isSupportiveCase(item)
    ? "strengthens"
    : isPressureCase(item)
    ? "adds pressure to"
    : "modifies"

  return `${item.name} (${item.strength}) ${direction} ${theme.toLowerCase()}${
    effect ? `: ${effect}` : "."
  }`
}

const getHouseFinalAnalysis = ({
  chart,
  houseNumber,
  theme,
  lord,
  lordPlanet,
  planetsPlaced,
  aspectsReceived,
  activeDasha,
  beneficHits,
  pressureHits,
  specialCases,
}: {
  chart: PrashnaChart
  houseNumber: number
  theme: string
  lord: string
  lordPlanet?: PrashnaPlanet
  planetsPlaced: string[]
  aspectsReceived: Array<{ fromPlanet: string; aspectType?: string }>
  activeDasha?: DashaPeriod
  beneficHits: number
  pressureHits: number
  specialCases: DetectedAstrologyCase[]
}) => {
  const lordDignity = lordPlanet ? getPlanetDignity(lordPlanet) : "unknown dignity"
  const lordHouse = lordPlanet ? lordPlanet.bhavaHouse || lordPlanet.house : undefined
  const ownedHouses = getPlanetOwnedHouses(chart, lord)
  const eventSignal = getHouseEventSignal(uniqueNumbers([lordHouse, ...ownedHouses]))
  const activeText = activeDasha
    ? `${activeDasha.lord} ${activeDasha.level} is currently activating this house by lordship, placement or drishti, so results can show during ${getPeriodWindow(activeDasha)}.`
    : "Current Mahadasha-Antardasha-Pratyantar gives this house a slower background role; results mature through steady choices and later matching sub-periods."
  const aspectText = aspectsReceived.length
    ? `Received drishti from ${aspectsReceived
        .slice(0, 5)
        .map((aspect) => `${aspect.fromPlanet}${aspect.aspectType ? ` ${aspect.aspectType}` : ""}`)
        .join(", ")} modifies the house.`
    : "The house depends more on its lord, occupants and dasha timing than on outside graha pressure."
  const placementText = planetsPlaced.length
    ? `Placed graha ${planetsPlaced.join(", ")} make this house visible in lived events.`
    : "The house expresses through its lord, timing and supporting links rather than a directly placed graha."
  const lordText = lordPlanet
    ? `Its lord ${lord} is ${lordDignity} in bhava ${lordHouse}, connecting ${theme.toLowerCase()} with ${eventSignal}.`
    : `Its lord ${lord || "is unavailable"} is not available in the calculated graha list, so the sign, occupants and drishti carry more weight.`
  const quality = getHouseQualityLabel({
    activeDasha,
    beneficHits,
    pressureHits,
    lordPlanet,
  })
  const finalImpact =
    quality === "active and usable"
      ? `Final impact: ${theme} can give workable progress now because activation and support are both present.`
      : quality === "active but pressure-bearing"
      ? `Final impact: ${theme} is active now, but results need discipline, patience and prevention before they become clean.`
      : quality === "supportive"
      ? `Final impact: ${theme} is a support area of the chart and should improve when its lord, placed planets or benefic gochar become active.`
      : quality === "needs discipline"
      ? `Final impact: ${theme} needs repair, boundaries and consistent routine; avoid forcing this area during weak timing.`
      : `Final impact: ${theme} gives mixed results; dasha timing decides when this area becomes stronger or needs extra care.`
  const houseAction =
    houseNumber === 1
      ? "Build health, confidence and a stable identity; this house tells how the native should lead life."
      : houseNumber === 2
      ? "Manage speech, food habits, savings and family values carefully; this house shows wealth retention and family support."
      : houseNumber === 3
      ? "Use communication, courage, marketing, writing and skill-building; this house improves through daily effort."
      : houseNumber === 4
      ? "Stabilize home, land, vehicles, motherly support and emotional security before taking major risks."
      : houseNumber === 5
      ? "Use education, mantra, creativity, children-related duties and intelligent speculation with discipline."
      : houseNumber === 6
      ? "Win through routine, service, debt control, fitness, legal discipline and clean conflict management."
      : houseNumber === 7
      ? "Handle marriage, agreements, customers and public dealing through clarity, fairness and patience."
      : houseNumber === 8
      ? "Treat sudden change, inheritance, secrets, research and vulnerability with prevention and expert guidance."
      : houseNumber === 9
      ? "Strengthen dharma, teachers, fatherly guidance, higher learning and long-distance opportunity."
      : houseNumber === 10
      ? "Focus on career visibility, responsibility, authority and consistent public output."
      : houseNumber === 11
      ? "Convert network, audience, elder support and repeat gains into measurable income."
      : "Balance sleep, expenses, isolation, foreign links, spiritual practice and recovery."
  const customerResult = HOUSE_CUSTOMER_RESULTS[houseNumber]
  const supportivePlanets = aspectsReceived
    .map((aspect) => aspect.fromPlanet)
    .filter((planet) => BENEFIC_PLANETS.includes(planet))
  const pressurePlanets = aspectsReceived
    .map((aspect) => aspect.fromPlanet)
    .filter((planet) => PRESSURE_PLANETS.includes(planet))
  const deliverySentence = lordPlanet
    ? `Because ${lord}, its lord, is in house ${lordHouse}, results are delivered through ${eventSignal}.`
    : "Its lord could not be resolved, so no lord-placement conclusion is added."
  const placedSentence = planetsPlaced.length
    ? `${planetsPlaced.join(" and ")} directly emphasize ${planetsPlaced
        .map((planet) => PLANET_PLAIN_EFFECT[planet] || planet)
        .join("; ")} in this area.`
    : "No planet is placed here directly; the lord and received drishti decide most of the result."
  const aspectSentence = [
    supportivePlanets.length
      ? `${supportivePlanets.join(" and ")} support this house through ${supportivePlanets
          .map((planet) => PLANET_PLAIN_EFFECT[planet] || planet)
          .join("; ")}.`
      : "",
    pressurePlanets.length
      ? `${pressurePlanets.join(" and ")} add pressure through ${pressurePlanets
          .map((planet) => PLANET_PLAIN_EFFECT[planet] || planet)
          .join("; ")}.`
      : "",
  ].filter(Boolean).join(" ")
  const netSentence =
    quality === "active and usable"
      ? `Net result: this is currently a favorable, usable area${activeDasha ? ` during ${getPeriodWindow(activeDasha)}` : ""}.`
      : quality === "active but pressure-bearing"
      ? `Net result: this area is active now, but pressure is stronger than support; expect progress with delay or correction${activeDasha ? ` during ${getPeriodWindow(activeDasha)}` : ""}.`
      : quality === "supportive"
      ? "Net result: this is a naturally supportive area, although its strongest results wait for matching dasha activation."
      : quality === "needs discipline"
      ? "Net result: this is a vulnerable area; avoid irreversible decisions made under haste and strengthen the basics first."
      : "Net result: this area is mixed; neither denial nor easy success is justified without matching dasha activation."
  const specialCaseSentence = specialCases.length
    ? specialCases
        .slice(0, 3)
        .map((item) => getCaseHouseEffect(item, theme))
        .join(" ")
    : ""
  const supportCaseNames = specialCases
    .filter(isSupportiveCase)
    .map((item) => item.name)
  const pressureCaseNames = specialCases
    .filter(isPressureCase)
    .map((item) => item.name)
  const resolvedCaseSentence = specialCases.length
    ? supportCaseNames.length && pressureCaseNames.length
      ? `Combined judgement: ${supportCaseNames.join(", ")} provides protection, while ${pressureCaseNames.join(", ")} creates friction; the ${quality} result above is the balance after both are counted.`
      : supportCaseNames.length
      ? `Combined judgement: ${supportCaseNames.join(", ")} reinforces the supportive side of this house.`
      : pressureCaseNames.length
      ? `Combined judgement: ${pressureCaseNames.join(", ")} makes discipline and timing essential in this house.`
      : "Combined judgement: the detected compound condition changes expression, but does not independently promise success or denial."
    : ""
  const userMeaning = [
    customerResult?.meaning || `${theme} needs balanced attention.`,
    deliverySentence,
    placedSentence,
    aspectSentence,
    specialCaseSentence,
    netSentence,
    resolvedCaseSentence,
  ].filter(Boolean).join(" ")
  const practicalUse = customerResult?.action || houseAction

  return {
    quality,
    analysis: `${lordText} ${placementText} ${aspectText} ${activeText} ${finalImpact}`,
    userMeaning,
    practicalUse,
  }
}

const buildHouseOutcomes = (
  chart: PrashnaChart,
  detectedCases: DetectedAstrologyCase[]
) =>
  (chart.houseSynthesis || chart.houses).map((house: any) => {
    const planetsPlaced = Array.isArray(house.planetsPlaced)
      ? house.planetsPlaced
      : getHousePlanets(chart, house.house).map((planet) => planet.name)
    const aspectsReceived = Array.isArray(house.aspectsReceived)
      ? house.aspectsReceived
      : []
    const lord = getHouseLord(chart, house.house)
    const lordPlanet = lord ? getPlanet(chart, lord) : undefined
    const activeDasha = getActiveDashaPeriods(chart).find(
      (period) =>
        period.lord === lord ||
        planetsPlaced.includes(period.lord) ||
        aspectsReceived.some((aspect: any) => aspect.fromPlanet === period.lord)
    )
    const specialCases = detectedCases.filter(
      (item) =>
        item.houses.includes(house.house) &&
        item.key !== "mixed-support-pressure-synthesis" &&
        item.status !== "partial" &&
        item.strength !== "low"
    )
    const supportiveCaseWeight = specialCases
      .filter(isSupportiveCase)
      .reduce((total, item) => total + getCaseWeight(item), 0)
    const pressureCaseWeight = specialCases
      .filter(isPressureCase)
      .reduce((total, item) => total + getCaseWeight(item), 0)
    const beneficHits = [...planetsPlaced, ...aspectsReceived.map((aspect: any) => aspect.fromPlanet)].filter((planet) =>
      BENEFIC_PLANETS.includes(planet)
    ).length + supportiveCaseWeight
    const pressureHits = [...planetsPlaced, ...aspectsReceived.map((aspect: any) => aspect.fromPlanet)].filter((planet) =>
      PRESSURE_PLANETS.includes(planet)
    ).length + pressureCaseWeight
    const finalAnalysis = getHouseFinalAnalysis({
      chart,
      houseNumber: house.house,
      theme: house.theme || getHouseTheme(house.house),
      lord,
      lordPlanet,
      planetsPlaced,
      aspectsReceived,
      activeDasha,
      beneficHits,
      pressureHits,
      specialCases,
    })
    const prevailing =
      activeDasha
        ? `${activeDasha.lord} dasha is activating this house; ${finalAnalysis.quality}`
        : `${finalAnalysis.quality}; ${
            beneficHits > pressureHits
              ? "benefic support is stronger"
              : pressureHits > beneficHits
              ? "discipline/pressure influence is stronger"
              : "lordship and steady effort are the main influence"
          }`

    return {
      house: house.house,
      theme: house.theme || getHouseTheme(house.house),
      prevailing_impact: prevailing,
      user_meaning: finalAnalysis.userMeaning,
      outcome: finalAnalysis.analysis,
      practical_use: finalAnalysis.practicalUse,
      evidence: [
        `Lord: ${lord || "unknown"}${
          lordPlanet
            ? ` in bhava ${lordPlanet.bhavaHouse || lordPlanet.house}, ${getPlanetDignity(lordPlanet)}`
            : ""
        }`,
        `Placed: ${planetsPlaced.join(", ") || "none"}`,
        `Drishti: ${
          aspectsReceived.map((aspect: any) => aspect.fromPlanet).join(", ") ||
          "none"
        }`,
        `Special cases: ${specialCases.map((item) => `${item.name} (${item.strength})`).join(", ") || "none"}`,
      ].join("; "),
    }
  })

const buildCareerDirectionSeed = (chart: PrashnaChart) => {
  const careerHouses = [10, 6, 2, 11, 5, 9]
  const planets = careerHouses.flatMap((house) => [
    ...getHousePlanets(chart, house).map((planet) => planet.name),
    getHouseLord(chart, house),
  ])
  const uniquePlanets = Array.from(new Set(planets.filter(Boolean)))
  const fields = new Set<string>()

  uniquePlanets.forEach((planet) => {
    if (["Mercury", "Rahu"].includes(planet)) {
      fields.add("technology, analytics, digital marketing, trading, commerce, writing or systems work")
    }
    if (["Sun", "Mars"].includes(planet)) {
      fields.add("leadership, operations, government-linked work, engineering, land, defence, machinery or decisive execution roles")
    }
    if (["Jupiter"].includes(planet)) {
      fields.add("teaching, consulting, finance, law, advisory, spiritual or knowledge-led work")
    }
    if (["Venus", "Moon"].includes(planet)) {
      fields.add("food, wellness, design, hospitality, luxury, dairy, care, public-facing brand or creative work")
    }
    if (["Saturn", "Ketu"].includes(planet)) {
      fields.add("research, compliance, manufacturing, agriculture, healing, audits, process, service or deep technical specialization")
    }
  })

  return {
    chart_basis: getImportantHouseBasis(chart, careerHouses),
    fields: Array.from(fields).slice(0, 4),
  }
}

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
        "Answer each submitted user question separately. For every question, first identify the houses relevant to that question, then judge their lords, occupants, dignity, drishti, Bhava Chalit delivery, Moon condition and current Mahadasha-Antardasha-Pratyantar.",
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
    intent?: AstrologyKnowledgeIntent
    detectedCases?: string[]
    min: number
    max: number
  }[] = [
    {
      label: "dasha_pack",
      intent: "dasha",
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
      intent: "career",
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
      intent: "wealth",
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
      intent: "health",
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
      intent: "relationship",
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
      intent: "yoga",
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
      intent: "remedy",
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
              "Use only for answering each exact user question at the top. Do not merge multiple questions into one answer and do not reuse this answer in other report sections.",
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
      intent: topic.intent,
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
        planets: house.planetsPlaced,
        drishti_from: house.aspectsReceived.map((aspect) => aspect.fromPlanet),
        synthesis: house.synthesis,
      })),
    },
    null,
    2
  )
}

const compactDossierText = (value: unknown, maxLength = 420) =>
  compactPromptText(value, maxLength)

const compactDashaDossierRow = (row: any) => ({
  period: compactDossierText(row?.period, 120),
  prevailing_factor: compactDossierText(row?.prevailing_factor, 220),
  score: row?.score,
  outcome: compactDossierText(row?.outcome, 320),
})

const buildKundliAiDossier = ({
  name,
  chart,
  detectedYogas,
  detectedCases,
  stones,
  healthIndicators,
  criticalPeriod,
  dashaTimeline,
  dashaDecisionTree,
  houseOutcomes,
  careerDirectionSeed,
  targetedRemedySeeds,
  bphsRuleProofs,
  longevityAssessment,
  evidencePack,
  subQuestions,
  knowledgePassages,
}: {
  name: string
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  stones: ReturnType<typeof getStoneRecommendations>
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  dashaTimeline: ReturnType<typeof buildDashaTimeline>
  dashaDecisionTree: ReturnType<typeof buildDashaDecisionTree>
  houseOutcomes: ReturnType<typeof buildHouseOutcomes>
  careerDirectionSeed: ReturnType<typeof buildCareerDirectionSeed>
  targetedRemedySeeds: TargetedRemedy[]
  bphsRuleProofs: BphsRuleProof[]
  longevityAssessment: LongevityAssessment
  evidencePack: KundliEvidencePack
  subQuestions: string[]
  knowledgePassages: RetrievedAstrologyPassage[]
}) => {
  const activeDasha = chart.dasha
    ? {
        mahadasha: `${chart.dasha.mahadasha.lord} ${chart.dasha.mahadasha.startLabel} to ${chart.dasha.mahadasha.endLabel}`,
        antardasha: `${chart.dasha.antardasha.lord} ${chart.dasha.antardasha.startLabel} to ${chart.dasha.antardasha.endLabel}`,
        pratyantar: `${chart.dasha.pratyantar.lord} ${chart.dasha.pratyantar.startLabel} to ${chart.dasha.pratyantar.endLabel}`,
        moon_nakshatra_lord: chart.dasha.moonNakshatraLord,
      }
    : null

  const priorityCases = selectPriorityCases(detectedCases).slice(0, 6)
  const lifeRows = buildLifeAreaPredictionRows(chart).slice(0, 14)

  return {
    native: {
      name: name || "Not provided",
      questions: subQuestions.filter(Boolean).slice(0, 3),
      city: `${chart.city.name}, ${chart.city.region}`,
      generated_at: chart.generatedAtLocal,
      lagna: `${chart.ascendant} ${chart.ascendantDegree?.toFixed?.(2) ?? ""}`,
      moon: `${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}`,
      panchang: `${chart.paksha} ${chart.tithi}; ${chart.yoga} yoga; ${chart.karana} karana`,
      panchang_system: chart.panchangSystem,
      house_system: chart.houseSystem,
    },
    active_dasha: activeDasha,
    dasha_scope: {
      available_range: dashaTimeline.range,
      active_nested_periods:
        "Server has full Vimshottari timeline; AI should judge only from the supplied active and ranked decision rows.",
      ranked_rows: dashaDecisionTree.slice(0, 12).map(compactDashaDossierRow),
    },
    planets: chart.planets.map((planet) => ({
      graha: planet.name,
      sign: planet.sign,
      degree: Number(planet.signDegree?.toFixed?.(2) ?? planet.signDegree ?? 0),
      rashi_house: planet.rashiHouse || planet.house,
      bhava_house: planet.bhavaHouse || planet.house,
      dignity: getPlanetDignity(planet),
      nakshatra: `${planet.nakshatra} pada ${planet.pada}`,
      impact: `${planet.bhavaImpactPercent ?? "-"}% ${planet.bhavaImpactState || ""}`,
      owns: getPlanetOwnedHouses(chart, planet.name),
      retrograde: Boolean(planet.retrograde),
    })),
    house_outcomes: houseOutcomes.slice(0, 12).map((row: any) => ({
      house: row.house,
      theme: row.theme,
      prevailing_impact: compactDossierText(row.prevailing_impact, 220),
      outcome: compactDossierText(row.outcome, 320),
      evidence: compactDossierText(row.evidence, 280),
    })),
    life_area_rows: lifeRows.map((row: any) => ({
      area: compactDossierText(row.area, 80),
      chart_basis: compactDossierText(row.chart_basis, 280),
      prediction: compactDossierText(row.prediction, 320),
      advice: compactDossierText(row.advice, 260),
    })),
    drishti_summary: (chart.houseSynthesis || chart.houses).slice(0, 12).map((house: any) => {
      const aspectsReceived = Array.isArray(house.aspectsReceived)
        ? house.aspectsReceived.map((aspect: any) => aspect.fromPlanet).join(", ")
        : ""
      const planetsPlaced = Array.isArray(house.planetsPlaced)
        ? house.planetsPlaced.join(", ")
        : getHousePlanets(chart, house.house).map((planet) => planet.name).join(", ")

      return compactDossierText(
        `H${house.house} ${house.theme || getHouseTheme(house.house)}: ${house.sign}, lord ${house.signLord || getHouseLord(chart, house.house)}, placed ${planetsPlaced || "none"}, drishti from ${aspectsReceived || "none"}. ${house.synthesis || ""}`,
        260
      )
    }),
    gochar_triggers: buildGocharImpactPack(chart).map((item) => ({
      planet: item.planet,
      sign: item.sign,
      from_lagna: item.from_lagna,
      from_moon: item.from_moon,
      natal_house: item.natal_house,
      reading: compactDossierText(item.reading, 260),
    })),
    special_cases: {
      labels: detectedYogas.slice(0, 10).map((item) => compactDossierText(item, 120)),
      structured: priorityCases.map((item) => ({
        name: item.subtype ? `${item.name}: ${item.subtype}` : item.name,
        status: item.status,
        strength: item.strength,
        chart_basis: compactDossierText(item.chart_basis, 260),
        effect: compactDossierText(item.combined_effect, 260),
        planets: item.planets,
      })),
    },
    health_and_longevity_audit: {
      health_watchlist: healthIndicators.slice(0, 6).map((item) =>
        compactDossierText(item, 260)
      ),
      maraka_lords: criticalPeriod.maraka_lords,
      badhakesh: criticalPeriod.badhakesh,
      next_windows: criticalPeriod.exact_timing_windows.slice(0, 5).map((item) => ({
        period: item.period,
        window: item.window,
        confidence: item.confidence,
        score: item.score,
        role: compactDossierText(item.role, 220),
        avoid: compactDossierText(item.avoid, 220),
        do: compactDossierText(item.do, 220),
      })),
      longevity_classification: longevityAssessment.classification,
      longevity_confidence: longevityAssessment.confidence,
      safety_note: longevityAssessment.safety_note,
    },
    career_seed: careerDirectionSeed,
    remedy_seeds: targetedRemedySeeds.slice(0, 8).map((item) => ({
      pain_point: compactDossierText(item.pain_point, 120),
      chart_basis: compactDossierText(item.chart_basis, 260),
      mantra_or_pooja: compactDossierText(item.mantra_or_pooja, 360),
      daily_practice: compactDossierText(item.daily_practice, 360),
    })),
    bphs_rule_proofs: bphsRuleProofs.slice(0, 8).map((item: any) => ({
      rule: compactDossierText(item.rule || item.title || item.area, 180),
      chart_match: compactDossierText(item.chart_match || item.chart_basis, 260),
      conclusion: compactDossierText(item.conclusion || item.effect, 260),
      citation: compactDossierText(item.citation, 180),
    })),
    reference_pack: knowledgePassages.slice(0, 5).map((passage, index) => ({
      id: passage.id || String(index + 1),
      topic: passage.section,
      citation: passage.citation,
      excerpt: compactDossierText(passage.text, 360),
    })),
    trinal_stone_indicators: stones,
  }
}

const buildPrompt = ({
  name,
  chart,
  detectedYogas,
  detectedCases,
  stones,
  healthIndicators,
  criticalPeriod,
  dashaTimeline,
  dashaDecisionTree,
  houseOutcomes,
  careerDirectionSeed,
  targetedRemedySeeds,
  bphsRuleProofs,
  longevityAssessment,
  evidencePack,
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
  dashaTimeline: ReturnType<typeof buildDashaTimeline>
  dashaDecisionTree: ReturnType<typeof buildDashaDecisionTree>
  houseOutcomes: ReturnType<typeof buildHouseOutcomes>
  careerDirectionSeed: ReturnType<typeof buildCareerDirectionSeed>
  targetedRemedySeeds: TargetedRemedy[]
  bphsRuleProofs: BphsRuleProof[]
  longevityAssessment: LongevityAssessment
  evidencePack: KundliEvidencePack
  subQuestions: string[]
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) => {
  const fullDossier = buildKundliAiDossier({
    name,
    chart,
    detectedYogas,
    detectedCases,
    stones,
    healthIndicators,
    criticalPeriod,
    dashaTimeline,
    dashaDecisionTree,
    houseOutcomes,
    careerDirectionSeed,
    targetedRemedySeeds,
    bphsRuleProofs,
    longevityAssessment,
    evidencePack,
    subQuestions,
    knowledgePassages,
  })
  const dossier = {
    native: {
      name: fullDossier.native.name,
      lagna: fullDossier.native.lagna,
      moon: fullDossier.native.moon,
      panchang: fullDossier.native.panchang,
    },
    active_dasha: fullDossier.active_dasha,
    planets: fullDossier.planets.map((planet) => ({
      graha: planet.graha,
      sign: planet.sign,
      bhava_house: planet.bhava_house,
      dignity: planet.dignity,
      owns: planet.owns,
    })),
    house_outcomes: fullDossier.house_outcomes.map((row) => ({
      house: row.house,
      theme: row.theme,
      prevailing_impact: compactDossierText(row.prevailing_impact, 150),
      outcome: compactDossierText(row.outcome, 220),
      evidence: compactDossierText(row.evidence, 150),
    })),
    life_area_rows: fullDossier.life_area_rows,
    priority_special_cases: fullDossier.special_cases.structured.slice(0, 4),
    career_seed: fullDossier.career_seed,
    bphs_rule_proofs: fullDossier.bphs_rule_proofs.slice(0, 5),
  }

  return [
    "You are Shreem Astrology's senior Jyotish evidence reviewer. The server supplies calculated chart facts and fallible rule hypotheses; you are the final interpreter.",
    "Treat longitude, sign, house ownership, calculated drishti and dasha dates as immutable raw inputs. Treat every score, polarity, yoga effect, house outcome and deterministic label as a hypothesis that may be wrong.",
    "Challenge those hypotheses against the complete chart, applicable BPHS passages, cancellation/protection, dasha hierarchy and empirical calibration evidence when supplied. Do not copy rule-engine conclusions as templates.",
    "Prediction discipline: natal promise + house/lord/placed graha + drishti + Bhava Chalit delivery + Vimshottari dasha decide truth. Gochar is only a trigger, never the main promise.",
    "BPHS discipline: use the reference pack only when it matches the life area. Generic dasha passages may support timing, not replace house judgement.",
    "Output shape: concise summary; exactly 2 opening_profile paragraphs; career_direction; relationship_pattern; health_caution; current_period_analysis; exactly 6 deterministic_review rows; expert recommendation fields.",
    "opening_profile paragraph 1 must address the native by name and give a precise personality portrait: thinking style, temperament, likes, dislikes, work style, social pattern, and strongest natural ability. Judge from Lagna/Lagna lord, Moon, 1st, 3rd and 5th houses plus drishti.",
    "opening_profile paragraph 2 must give concrete career aptitude and likely work environment: technical, analytical, management, commerce, creative, public-service, entrepreneurial, MNC/large organization, independent work, digital/AI or other fields only when supported. Judge from 3rd, 6th, 9th, 10th and 11th houses, their lords, dignity, dasha and relevant gochar. State strongest fit, secondary fit, and key limitation without vague praise.",
    "The 6 review areas must be exactly: Career and business direction; Money and wealth building; Marriage and relationships; Education, creativity and children; Home, property and family; Health, routine, foreign links and spiritual growth.",
    "For every review row, final_decision must contain: a clear positive/mixed/negative direction, the concrete real-life manifestation, and the relevant active-dasha timing when supplied. missing_or_weak_point must be one specific next action or limitation, not generic discipline advice and not a request for the customer to interpret data.",
    "Reject empty praise such as 'you can succeed', 'there is a strong foundation', or 'careful planning is needed' unless the same sentence names the exact field, mechanism, obstacle and timing. Write for a normal customer; technical proof is stored separately.",
    "Length discipline: each opening_profile paragraph is 3 to 5 complete sentences; summary 2 sentences; career/relationship/health/current period 2 to 3 sentences each; each deterministic review field one concise sentence. The server already owns tables, timing, remedies and citations, so do not recreate them.",
    "Health safety: never predict death, accident certainty, cancer, diabetes, thyroid, BP, arthritis, or any named disease. Use prevention, routine, screening, and expert-review language only. Do not mention Markesh, Maraka, Badhakesh, longevity, death timing, or whole-life danger windows in customer-facing output.",
    "If evidence is weak, say so in deterministic_review and keep the user-facing answer cautious. Prefer fewer complete rows over long unfinished output.",
    "Set expert_call_recommended true for strong dosha, gemstone, marriage, health, serious remedy, or career-defining guidance, and recommend Sanjay Kumar Pandey in expert_call_reason.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only. Return only fields allowed by the response schema.",
    `DETERMINISTIC_DOSSIER=${JSON.stringify(dossier)}`,
  ].join("\n")
}

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
  dashaDecisionTree,
  houseOutcomes,
  careerDirectionSeed,
  targetedRemedySeeds,
  knowledgePassages,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  dashaDecisionTree: ReturnType<typeof buildDashaDecisionTree>
  houseOutcomes: ReturnType<typeof buildHouseOutcomes>
  careerDirectionSeed: ReturnType<typeof buildCareerDirectionSeed>
  targetedRemedySeeds: TargetedRemedy[]
  knowledgePassages: RetrievedAstrologyPassage[]
}) => {
  const dashaRows = chart.dasha
    ? [
        chart.dasha.mahadasha,
        chart.dasha.antardasha,
        chart.dasha.pratyantar,
      ].map((period) => {
        const planet = getPlanet(chart, period.lord)
        const ownedHouses = getPlanetOwnedHouses(chart, period.lord)
        const bhavaHouse = planet?.bhavaHouse || planet?.house
        const receivedAspects = (chart.aspects || []).filter(
          (aspect) => bhavaHouse && aspect.toHouse === bhavaHouse
        )
        const dignity = planet ? getPlanetDignity(planet) : "unknown dignity"
        const tilt = getDignityTilt(planet) + getBhavaTilt(planet)
        const supportAspects = receivedAspects
          .filter((aspect) => BENEFIC_PLANETS.includes(aspect.fromPlanet))
          .map((aspect) => aspect.fromPlanet)
        const pressureAspects = receivedAspects
          .filter((aspect) => PRESSURE_PLANETS.includes(aspect.fromPlanet))
          .map((aspect) => aspect.fromPlanet)
        const eventSignal = getHouseEventSignal(uniqueNumbers([bhavaHouse, ...ownedHouses]))
        const pressureHouses = uniqueNumbers([bhavaHouse, ...ownedHouses]).filter((house) =>
          DUSTHANA_HOUSES.includes(house)
        )
        const net =
          tilt >= 2 && supportAspects.length >= pressureAspects.length
            ? "supportive"
            : tilt <= -2 || pressureAspects.length > supportAspects.length || pressureHouses.length
            ? "pressure-bearing"
            : "mixed but workable"

        return {
          period: `${period.lord}: ${period.startLabel} to ${period.endLabel}`,
          chart_basis:
            planetPlacementText(chart, [period.lord]) ||
            `${period.lord} is active in the Vimshottari sequence.`,
          classical_basis:
            knowledgePassages.find((passage) =>
              passage.keywords.some((tag) => /dasha|period|antar/i.test(tag))
            )?.citation ||
            knowledgePassages[0]?.citation ||
            "BPHS reference retrieval was prepared for dasha interpretation.",
          prediction:
            `${period.lord} ${period.level} is ${net}: ${dignity}${
              planet?.bhavaImpactPercent
                ? ` with ${planet.bhavaImpactPercent}% ${planet.bhavaImpactState || "bhava"} Chalit delivery`
                : ""
            } in H${bhavaHouse || "-"}. It activates ${eventSignal}. ${
              supportAspects.length
                ? `Protection comes from ${supportAspects.join(", ")} drishti. `
                : ""
            }${
              pressureAspects.length || pressureHouses.length
                ? `Pressure comes from ${pressureAspects.join(", ") || "dusthana ownership/placement"}, so results need discipline and timing.`
                : "This period can be used for planned action when the relevant house matters are handled cleanly."
            }`,
          action:
            `Use ${getPeriodWindow(period)} for ${eventSignal}; strengthen ${period.lord} through conduct, mantra and daan only in ways that do not amplify existing pressure.`,
        }
      })
    : []
  const mainCases = selectPriorityCases(detectedCases).slice(0, 4)

  return {
    summary:
      `${chart.ascendant} Lagna with Moon in ${chart.moonSign} shows a chart where dasha timing and house activation decide the strongest results. The reading below is based on calculated houses, grahas, drishti, dasha, yogas, health watchlist and remedies.`,
    person_information: `${chart.ascendant} Lagna, Moon in ${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}. ${activeDashaText(
      chart
    )}`,
    temperament:
      `${chart.ascendant} Lagna gives the outer direction, Moon in ${chart.moonSign} shows emotional style, and the current dasha shows where effort and pressure are concentrated now.`,
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
      careerDirectionSeed.fields.length > 0
        ? `${careerDirectionSeed.fields.join("; ")}. Basis: ${
            careerDirectionSeed.chart_basis ||
            getImportantHouseBasis(chart, [10, 11, 2])
          }`
        : getImportantHouseBasis(chart, [10, 11, 2]) ||
          "Career is linked with public output, gains, savings and service discipline in this chart.",
    relationship_pattern:
      getImportantHouseBasis(chart, [7, 2, 4]) ||
      "Relationship results depend on partnership handling, family support, emotional steadiness and the active dasha.",
    health_caution:
      healthIndicators[0] ||
      "No deterministic health watchlist was produced; medical concerns still need qualified care.",
    health_indicators: healthIndicators,
    current_period_analysis: activeDashaText(chart),
    deterministic_review: buildLifeAreaPredictionRows(chart).slice(0, 10).map((row) => ({
      area: row.area,
      deterministic_basis_used: row.chart_basis,
      missing_or_weak_point:
        "Deterministic chart evidence is sufficient for a cautious customer-facing judgement.",
      final_decision: row.prediction,
      needs_more_bphs: false,
    })),
    dasha_decision_tree: dashaDecisionTree,
    house_outcomes: houseOutcomes,
    dasha_predictions: dashaRows,
    risk_watch: [
      ...criticalPeriod.medical_watchlist
        .filter((signal) => signal.severity === "high")
        .slice(0, 4)
        .map((signal) => ({
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
          "Use medical checkups, sleep discipline, hydration, moderation, mantra and daan as preventive support.",
      })),
    ].slice(0, 10),
    prediction_table: [...buildLifeAreaPredictionRows(chart), buildGocharImpactRow(chart)],
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

const getIntentFromPredictionArea = (area: string) => {
  const normalized = area.toLowerCase()

  if (/career|profession|job|work/.test(normalized)) return "career"
  if (/wealth|money|income|business|gain/.test(normalized)) return "wealth"
  if (/health|risk|wellbeing|wellness/.test(normalized)) return "health"
  if (/relationship|marriage|partner|spouse|public/.test(normalized)) return "relationship"
  if (/dasha|period|timing|current/.test(normalized)) return "dasha"
  if (/remedy|pooja|mantra|upaay/.test(normalized)) return "remedy"
  if (/yoga|special/.test(normalized)) return "yoga"
  if (/markesh|maraka|badhak/.test(normalized)) return "markesh"

  return "dasha"
}

const enrichPredictionRowsWithEvidence = ({
  rows,
  evidencePack,
}: {
  rows: Array<{
    area: string
    chart_basis: string
    prediction: string
    advice: string
    [key: string]: any
  }>
  evidencePack: KundliEvidencePack
}) =>
  rows
    .map((row) => {
      const intent = getIntentFromPredictionArea(row.area)
      const bphsTrace = evidencePack.bphs_traces.find(
        (trace) => trace.intent === intent && trace.confidence !== "low"
      ) || evidencePack.bphs_traces.find((trace) => trace.intent === intent)
      const dasha = evidencePack.dasha_evidence[0]
      const intentHouses: Record<string, number[]> = {
        career: [10, 6, 3, 9, 11],
        wealth: [2, 5, 9, 10, 11],
        health: [1, 6, 8, 12],
        relationship: [2, 5, 7, 8, 11],
        dasha: [1, 5, 6, 8, 9, 10, 11, 12],
        remedy: [1, 5, 6, 8, 9, 12],
        yoga: [1, 4, 5, 7, 9, 10, 11],
        markesh: [2, 7, 8, 12],
      }
      const drishti = evidencePack.drishti_summary.find((item) =>
        (intentHouses[intent] || []).includes(item.house)
      )
      const gochar =
        evidencePack.gochar_evidence.find(
          (item) => item.intent === intent && item.applies
        ) ||
        evidencePack.gochar_evidence.find(
          (item) => item.intent === intent && item.strength === "medium"
        )
      const bphsBasis = bphsTrace
        ? `${bphsTrace.citation}: ${bphsTrace.reason}`
        : "No high-confidence BPHS passage selected for this exact row."
      const dashaBasis = dasha
        ? `${dasha.period}; ${dasha.basis}; ${dasha.prevailing} score ${dasha.score}.`
        : "Dasha evidence unavailable."
      const drishtiBasis = drishti
        ? drishti.basis
        : "No section-specific drishti summary selected."
      const gocharBasis = gochar
        ? `${gochar.transit}: ${gochar.basis}`
        : "No matching gochar trigger; natal promise and dasha remain primary."

      return {
        ...row,
        bphs_basis: bphsBasis,
        dasha_basis: dashaBasis,
        drishti_basis: drishtiBasis,
        gochar_basis: gocharBasis,
        evidence_confidence: bphsTrace?.confidence || "low",
        chart_basis: [
          row.chart_basis,
          `BPHS: ${bphsBasis}`,
          `Dasha: ${dashaBasis}`,
          `Drishti: ${drishtiBasis}`,
          `Gochar: ${gocharBasis}`,
        ]
          .filter(Boolean)
          .join(" | ")
          .slice(0, 3500),
      }
    })
    .filter((row) => {
      const text = `${row.area} ${row.chart_basis} ${row.prediction}`.toLowerCase()

      if (/cancer|diabetes|thyroid|arthritis|blood pressure|bp disease/.test(text)) {
        return false
      }

      return row.chart_basis.length > 40 && row.prediction.length > 30
    })

const normalizeAreaKey = (area: string) =>
  area
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const isMethodOnlyPrediction = (value: string) =>
  /this row explains|must be judged|should be judged|good .* prediction must|read the promise|judge results through|use this deterministic|refer to|analyse using|analyze using/i.test(
    value
  )

const mergeRequiredPredictionRows = ({
  aiRows,
  chart,
}: {
  aiRows: Array<{
    area: string
    chart_basis: string
    prediction: string
    advice: string
    [key: string]: any
  }>
  chart: PrashnaChart
}) => {
  const requiredRows = [...buildLifeAreaPredictionRows(chart), buildGocharImpactRow(chart)]
  const selected: typeof aiRows = []

  requiredRows.forEach((required) => {
    const requiredKey = normalizeAreaKey(required.area)
    const existing = aiRows.find((row) => {
      const key = normalizeAreaKey(row.area)
      return key === requiredKey || key.includes(requiredKey.slice(0, 12)) || requiredKey.includes(key.slice(0, 12))
    })

    if (
      existing &&
      existing.chart_basis.length > 40 &&
      existing.prediction.length > 80 &&
      !isMethodOnlyPrediction(existing.prediction)
    ) {
      selected.push(existing)
      return
    }

    selected.push(required)
  })

  aiRows.forEach((row) => {
    const key = normalizeAreaKey(row.area)
    if (
      row.area &&
      row.prediction &&
      !selected.some((item) => normalizeAreaKey(item.area) === key) &&
      !isMethodOnlyPrediction(row.prediction)
    ) {
      selected.push(row)
    }
  })

  return selected.slice(0, 18)
}

const mergeTargetedRemedies = (
  aiRows: TargetedRemedy[],
  seedRows: TargetedRemedy[]
) => {
  const rows: TargetedRemedy[] = []

  ;[...aiRows, ...seedRows].forEach((row) => {
    const key = `${row.pain_point} ${row.chart_basis}`.toLowerCase()

    if (
      row.pain_point &&
      row.chart_basis &&
      row.mantra_or_pooja &&
      row.daily_practice &&
      !rows.some((existing) =>
        `${existing.pain_point} ${existing.chart_basis}`.toLowerCase() === key
      )
    ) {
      rows.push(row)
    }
  })

  return rows.slice(0, 6)
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
  opening_profile: compactUsageArray(analysis?.opening_profile, 2, 1800),
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
  deterministic_review: Array.isArray(analysis?.deterministic_review)
    ? analysis.deterministic_review.slice(0, 12).map((row: any) => ({
        area: compactUsageText(row?.area, 180),
        deterministic_basis_used: compactUsageText(row?.deterministic_basis_used, 1200),
        missing_or_weak_point: compactUsageText(row?.missing_or_weak_point, 1200),
        final_decision: compactUsageText(row?.final_decision, 1400),
        needs_more_bphs: Boolean(row?.needs_more_bphs),
      }))
    : [],
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
  bphsRuleProofs,
  longevityAssessment,
}: {
  result: any
  chart: PrashnaChart
  knowledgePassages: RetrievedAstrologyPassage[]
  detectedCases: DetectedAstrologyCase[]
  healthIndicators: string[]
  criticalPeriod: CriticalPeriodAnalysis
  targetedRemedySeeds: TargetedRemedy[]
  bphsRuleProofs: BphsRuleProof[]
  longevityAssessment: LongevityAssessment
}) => ({
  profile: result.profile,
  chart: compactChartForUsage(chart),
  detected_yogas: compactUsageArray(result.detected_yogas, 12, 800),
  detected_cases: detectedCases.slice(0, 8).map((item) => ({
    name: item.name,
    status: item.status,
    strength: item.strength,
    planets: item.planets,
    houses: item.houses,
    chart_basis: compactUsageText(item.chart_basis, 700),
    combined_effect: compactUsageText(item.combined_effect, 700),
  })),
  knowledge_references: getKnowledgeIds(knowledgePassages).slice(0, 20),
  knowledge_context: compactKnowledgeTraceForUsage(knowledgePassages).slice(0, 8),
  stones: Array.isArray(result.stones) ? result.stones.slice(0, 12) : result.stones,
  health_indicators: healthIndicators.slice(0, 10),
  critical_period_analysis: {
    maraka_lords: [],
    badhaka_house: 0,
    badhakesh: "",
    exact_timing_windows: [],
    retrospective_timing_windows: [],
    medical_watchlist: [],
    safety_note: criticalPeriod.safety_note,
  },
  targeted_remedy_seeds: targetedRemedySeeds.slice(0, 8),
  bphs_rule_proofs: bphsRuleProofs.slice(0, 12),
  longevity_assessment: undefined,
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
  const subQuestions = normalizePayloadSubQuestions(payload)
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
  const bphsRuleProofs = evaluateBphsRules(chart)
  const longevityAssessment = buildLongevityAssessment(chart)
  const detectedCases = detectAstrologyCases(chart)
  const detectedYogas = detectedCases.length
    ? detectedCases.map(formatDetectedCase)
    : detectYogas(chart)
  const evidencePack = buildKundliEvidencePack({
    chart,
    bphsRuleProofs,
    detectedCases: detectedYogas,
    subQuestions,
  })
  const stones = getStoneRecommendations(chart)
  const healthIndicators = buildHealthIndicators(chart, detectedYogas)
  const criticalPeriod = buildCriticalPeriodAnalysis(chart, birthDateTime)
  const publicCriticalPeriod: CriticalPeriodAnalysis = {
    ...criticalPeriod,
    maraka_lords: [],
    badhaka_house: 0,
    badhakesh: "",
    active_triggers: [],
    watch_periods: [],
    exact_timing_windows: [],
    retrospective_timing_windows: [],
    medical_watchlist: [],
    safety_note:
      "Whole-life Markesh and longevity windows are intentionally not shown because broad danger calendars are not reliable customer guidance.",
  }
  const dashaTimeline = buildDashaTimeline(chart)
  const dashaDecisionTree = buildDashaDecisionTree({ chart, criticalPeriod })
  const houseOutcomes = buildHouseOutcomes(chart, detectedCases)
  const careerDirectionSeed = buildCareerDirectionSeed(chart)
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
        critical_period_analysis: publicCriticalPeriod,
        longevity_assessment: undefined,
        dasha_timeline: dashaTimeline,
        targeted_remedies: targetedRemedySeeds,
        bphs_rule_proofs: bphsRuleProofs,
        evidence_stack: evidencePack,
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
        critical_period_analysis: publicCriticalPeriod,
        longevity_assessment: undefined,
        dasha_timeline: dashaTimeline,
        targeted_remedies: targetedRemedySeeds,
        targeted_remedy_seeds: targetedRemedySeeds,
        bphs_rule_proofs: bphsRuleProofs,
        evidence_stack: evidencePack,
        analysis_mode: "standard",
        usage_units: usageUnits,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
      },
      { status: 429 }
    )
  }

  const deterministicAnalysis = buildFallbackKundliAnalysis({
    chart,
    detectedYogas,
    detectedCases,
    healthIndicators,
    criticalPeriod,
    dashaDecisionTree,
    houseOutcomes,
    careerDirectionSeed,
    targetedRemedySeeds,
    knowledgePassages,
  })
  const prompt = buildPrompt({
    name,
    chart,
    detectedYogas,
    detectedCases,
    stones,
    healthIndicators,
    criticalPeriod,
    dashaTimeline,
    dashaDecisionTree,
    houseOutcomes,
    careerDirectionSeed,
    targetedRemedySeeds,
    bphsRuleProofs,
    longevityAssessment,
    evidencePack,
    subQuestions,
    language,
    knowledgePassages,
  })
  const isBaseSynthesisValid = (value: any) => {
    const profile = Array.isArray(value?.opening_profile)
      ? value.opening_profile.filter(
          (item: unknown) => sanitizeString(item, 1600).length >= 180
        )
      : []
    const reviews = Array.isArray(value?.deterministic_review)
      ? value.deterministic_review.filter(
          (item: any) =>
            sanitizeString(item?.area, 120) &&
            sanitizeString(item?.final_decision, 900).length >= 100
        )
      : []

    return Boolean(
      sanitizeString(value?.summary, 1400).length >= 120 &&
      profile.length === 2 &&
      reviews.length >= 6
    )
  }

  let priorSynthesisUsage: GeminiUsage = emptyGeminiUsage()
  let priorSynthesisAttempts: GeminiAttemptLog[] = []
  let gemini = await generateGeminiJson({
    prompt,
    responseSchema: STANDARD_KUNDLI_SCHEMA,
    temperature: 0.12,
    maxAttempts: 2,
    maxOutputTokens: 3200,
    thinkingBudget: 0,
    label: "kundli-profile-draft-agent",
    model:
      process.env.ASTROLOGY_KUNDLI_DRAFT_MODEL || "gemini-2.5-flash-lite",
  })

  if (gemini.ok && !isBaseSynthesisValid(gemini.parsed)) {
    priorSynthesisUsage = gemini.usage
    priorSynthesisAttempts = gemini.attempt_logs || []
    gemini = await generateGeminiJson({
      prompt: `${prompt}\n\nQUALITY_REPAIR: The low-cost draft failed completeness. Return two substantial profile paragraphs and all six concrete life-area decisions without generic templates.`,
      responseSchema: STANDARD_KUNDLI_SCHEMA,
      temperature: 0.1,
      maxAttempts: 3,
      maxOutputTokens: 3600,
      thinkingBudget: 0,
      label: "kundli-profile-repair-agent",
      model: process.env.ASTROLOGY_KUNDLI_MODEL || "gemini-2.5-flash",
    })
  }

  if (!gemini.ok || !isBaseSynthesisValid(gemini.parsed)) {
    const fallbackAnalysis = deterministicAnalysis
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
        bphs_rule_proofs: bphsRuleProofs.slice(0, 20),
        longevity_assessment: {
          ...longevityAssessment,
          rule_proofs: longevityAssessment.rule_proofs.slice(0, 12),
        },
        evidence_stack: evidencePack,
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
          "Kundli AI could not pass the final quality gate. Retry will reuse the same birth details without consuming a successful-reading credit.",
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
        critical_period_analysis: publicCriticalPeriod,
        longevity_assessment: undefined,
        dasha_timeline: dashaTimeline,
        targeted_remedy_seeds: targetedRemedySeeds,
        bphs_rule_proofs: bphsRuleProofs,
        evidence_stack: evidencePack,
        knowledge_references: getKnowledgeIds(knowledgePassages),
        analysis: fallbackAnalysis,
        analysis_mode: "standard",
        usage_units: usageUnits,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
        retryable: true,
      },
      { status: 503 }
    )
  }

  let supplementalGeminiUsage: GeminiUsage = emptyGeminiUsage()
  let supplementalAttemptLogs: GeminiAttemptLog[] = []
  const parsed = {
    ...deterministicAnalysis,
    ...gemini.parsed,
  }
  const analysis = {
    summary: sanitizeString(parsed?.summary, 1400),
    opening_profile: sanitizeStringArray(parsed?.opening_profile, 2, 1600).slice(0, 2),
    person_information: sanitizeString(parsed?.person_information, 1200),
    temperament: sanitizeString(parsed?.temperament, 1200),
    behavioral_traits: sanitizeStringArray(parsed?.behavioral_traits, 8, 450),
    strengths: sanitizeStringArray(parsed?.strengths, 8, 450),
    life_themes: sanitizeStringArray(parsed?.life_themes, 8, 450),
    career_direction:
      sanitizeString(parsed?.career_direction, 1800) ||
      (careerDirectionSeed.fields.length
        ? `${careerDirectionSeed.fields.join("; ")}. Basis: ${
            careerDirectionSeed.chart_basis ||
            getImportantHouseBasis(chart, [10, 11, 2])
          }`
        : ""),
    relationship_pattern: sanitizeString(parsed?.relationship_pattern, 1800),
    health_caution: sanitizeString(parsed?.health_caution, 1600),
    health_indicators:
      sanitizeStringArray(parsed?.health_indicators, 6, 500).length > 0
        ? sanitizeStringArray(parsed?.health_indicators, 6, 500)
        : healthIndicators,
    current_period_analysis: sanitizeString(
      parsed?.current_period_analysis,
      1800
    ),
    deterministic_review: Array.isArray(parsed?.deterministic_review)
      ? parsed.deterministic_review
          .map((item: any) => ({
            area: sanitizeString(item?.area, 220),
            deterministic_basis_used: sanitizeString(
              item?.deterministic_basis_used,
              800
            ),
            missing_or_weak_point: sanitizeString(
              item?.missing_or_weak_point,
              600
            ),
            final_decision: sanitizeString(item?.final_decision, 900),
            needs_more_bphs: Boolean(item?.needs_more_bphs),
          }))
          .filter(
            (item: {
              area: string
              deterministic_basis_used: string
              missing_or_weak_point: string
              final_decision: string
              needs_more_bphs: boolean
            }) =>
              Boolean(
                item.area &&
                  item.deterministic_basis_used &&
                  item.final_decision
              )
          )
          .slice(0, 6)
      : [],
    dasha_decision_tree: dashaDecisionTree,
    house_outcomes: houseOutcomes,
    dasha_predictions: Array.isArray(parsed?.dasha_predictions)
      ? parsed.dasha_predictions
          .map((item: any) => ({
            period: sanitizeString(item?.period, 500),
            chart_basis: sanitizeString(item?.chart_basis, 900),
            classical_basis: sanitizeString(item?.classical_basis, 700),
            prediction: sanitizeString(item?.prediction, 1200),
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
          .slice(0, 3)
      : [],
    risk_watch: Array.isArray(parsed?.risk_watch)
      ? parsed.risk_watch
          .map((item: any) => ({
            theme: sanitizeString(item?.theme, 500),
            chart_basis: sanitizeString(item?.chart_basis, 900),
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
          .slice(0, 8)
      : [],
    prediction_table: Array.isArray(parsed?.prediction_table)
      ? parsed.prediction_table
          .map((item: any) => ({
            area: sanitizeString(item?.area, 500),
            chart_basis: sanitizeString(item?.chart_basis, 900),
            prediction: sanitizeString(item?.prediction, 1300),
            advice: sanitizeString(item?.advice, 800),
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
          .slice(0, 10)
      : [],
    special_case_readings: Array.isArray(parsed?.special_case_readings)
      ? parsed.special_case_readings
          .map((item: any) => ({
            case_name: sanitizeString(item?.case_name, 500),
            chart_basis: sanitizeString(item?.chart_basis, 900),
            classical_basis: sanitizeString(item?.classical_basis, 700),
            combined_effect: sanitizeString(item?.combined_effect, 1200),
            timing: sanitizeString(item?.timing, 700),
            solution: sanitizeString(item?.solution, 900),
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
          .slice(0, 5)
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
            placement: sanitizeString(item?.placement, 500),
            life_area: sanitizeString(item?.life_area, 500),
            activation_period: sanitizeString(item?.activation_period, 500),
            effect: sanitizeString(item?.effect, 900),
            likely_effect: sanitizeString(item?.likely_effect, 900),
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
          .slice(0, 12)
      : buildPlanetEffects(chart),
    likely_challenges: sanitizeStringArray(parsed?.likely_challenges, 8, 500),
    issue_analysis: sanitizeStringArray(parsed?.issue_analysis, 8, 500),
    practical_solutions: sanitizeStringArray(parsed?.practical_solutions, 8, 500),
    spiritual_guidance: sanitizeString(parsed?.spiritual_guidance, 1200),
    sub_question_answers: Array.isArray(parsed?.sub_question_answers)
      ? parsed.sub_question_answers
          .map((item: any) => ({
            question: sanitizeString(item?.question, 1000),
            answer: sanitizeString(item?.answer, 1600),
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
          .map((item: unknown) => sanitizeString(item, 800))
          .filter(Boolean)
          .slice(0, 8)
      : detectedYogas,
    upaay: Array.isArray(parsed?.upaay)
      ? parsed.upaay
          .map((item: unknown) => sanitizeString(item, 800))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    targeted_remedies: mergeTargetedRemedies(
      Array.isArray(parsed?.targeted_remedies)
        ? parsed.targeted_remedies
            .map((item: any) => ({
              pain_point: sanitizeString(item?.pain_point, 500),
              chart_basis: sanitizeString(item?.chart_basis, 900),
              mantra_or_pooja: sanitizeString(item?.mantra_or_pooja, 1000),
              daily_practice: sanitizeString(item?.daily_practice, 900),
            }))
            .filter((item: TargetedRemedy) =>
              Boolean(
                item.pain_point &&
                  item.chart_basis &&
                  item.mantra_or_pooja &&
                  item.daily_practice
              )
            )
        : [],
      targetedRemedySeeds
    ),
    book_citations: sanitizeBookCitations(parsed?.book_citations),
    expert_call_recommended: Boolean(parsed?.expert_call_recommended),
    expert_call_reason: sanitizeString(parsed?.expert_call_reason, 900),
  }

  const deterministicRiskWatch = [
    ...criticalPeriod.medical_watchlist
      .filter((signal) => signal.severity === "high")
      .map((signal) => ({
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
    .filter((item) => {
      const text = `${item.theme || ""} ${item.chart_basis || ""}`.toLowerCase()
      return !/(markesh|maraka|badhakesh|bad period|danger window|death|cancer|diabetes|thyroid|arthritis|bp disease)/.test(text)
    })
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

  const reviewedLifeAreaRows = analysis.deterministic_review.map((item: any) => ({
    area: item.area,
    chart_basis: item.deterministic_basis_used,
    prediction: item.final_decision,
    advice: item.missing_or_weak_point,
  }))

  analysis.prediction_table = mergeRequiredPredictionRows({
    aiRows: [...reviewedLifeAreaRows, ...analysis.prediction_table],
    chart,
  })
    .filter((item) => {
      const area = String(item.area || "").toLowerCase()
      if (
        /(markesh|maraka|badhakesh|bad period|danger window|death|cancer|diabetes|thyroid|arthritis|bp disease)/.test(
          area
        )
      ) {
        return false
      }

      if (subQuestions.filter(Boolean).length) {
        return true
      }

      return !area.includes("user question") && area !== "question"
    })
    .filter(
      (item, index, items) =>
        item.area &&
        items.findIndex((candidate) => candidate.area === item.area) === index
    )
    .slice(0, 22)

  analysis.prediction_table = enrichPredictionRowsWithEvidence({
    rows: analysis.prediction_table,
    evidencePack,
  }).slice(0, 18)

  analysis.health_indicators = [
    ...healthIndicators,
    ...analysis.health_indicators,
  ]
    .filter(
      (item) =>
        item &&
        !/(markesh|maraka|badhakesh|bad period|danger window|death|cancer|diabetes|thyroid|arthritis|bp disease)/i.test(
          item
        )
    )
    .filter((item, index, items) => item && items.indexOf(item) === index)
    .slice(0, 20)

  const hasSubQuestions = subQuestions.filter(Boolean).length > 0
  const ensuredSubQuestionAnswers =
    !hasSubQuestions
      ? []
      : analysis.sub_question_answers.length >= subQuestions.filter(Boolean).length
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

  const getQuestionIntent = (question: unknown) => {
    const q = normalizeQuestionSearchText(question)

    if (
      /\b(cow|cows|cattle|dairy|livestock|buffalo|animal husbandry|milch|dry cow|pregnant cow|conceived cow)\b/.test(q) &&
      /\b(sell|sale|buy|purchase|replace|expand|increase|keep|retain|smart|should|profitable)\b/.test(q)
    ) {
      return "livestock_capital_decision"
    }

    if (
      /\b(should i|which|choose|choice|versus|vs|or|expand|shut|close|focus on|switch to)\b/.test(q) &&
      /\b(business|startup|farm|farming|ghee|hydroponic|product|venture|career|job)\b/.test(q)
    ) {
      return "comparison_decision"
    }

    if (
      /\b(pioneer|leader|leading|recognition|famous|known for|industry leader|national|india|global)\b/.test(q)
    ) {
      return "leadership"
    }

    if (
      /\b(profit|profitable|loss|break even|revenue|sales|business income|business growth|business success|shreem farms)\b/.test(q) ||
      /(लाभ|नुकसान|व्यापार लाभ|बिजनेस लाभ|बिक्री|रेवेन्यू)/.test(q)
    ) {
      return "business_profit"
    }

    if (
      /\b(rich|wealth|money|income|earning|earnings|crorepati|billionaire|business profit)\b/.test(q) ||
      /(धन|पैसा|अमीर|कमाई|आय|लाभ|समृद्ध)/.test(q)
    ) {
      return "wealth"
    }

    if (
      /\b(husband|wife|spouse|partner|lucky for|married life|marriage luck)\b/.test(q) ||
      /(पति|पत्नी|जीवनसाथी|विवाह|शादी|भाग्यशाली)/.test(q)
    ) {
      return "spouse_luck"
    }

    if (
      /\b(career|job|work|startup|business|profession|promotion)\b/.test(q) ||
      /(करियर|नौकरी|व्यवसाय|काम|पेशा|प्रमोशन)/.test(q)
    ) {
      return "career"
    }

    if (
      /\b(health|illness|disease|stress|sleep|accident|surgery)\b/.test(q) ||
      /(स्वास्थ्य|बीमारी|तनाव|नींद|दुर्घटना|सर्जरी)/.test(q)
    ) {
      return "health"
    }

    return "general"
  }

 const answerMatchesQuestionIntent = (question: string, answer: unknown, reason: unknown) => {
    const intent = getQuestionIntent(question)
    const answerText = normalizeQuestionSearchText(answer)
    const text = normalizeQuestionSearchText(`${answer || ""} ${reason || ""}`)

    if (!text) {
      return false
    }

    const intentTerms: Record<string, RegExp> = {
      business_profit: /\b(profit|profitable|loss|break even|revenue|sales|margin|business|customer|cash flow|income|gain|11th house|10th house|2nd house|6th house|7th house|लाभ|नुकसान|बिक्री|रेवेन्यू|व्यापार|बिजनेस)\b/,
      comparison_decision: /\b(prefer|better|choose|continue|expand|pause|stop|shut|pilot|test|option|versus|business|venture|profit|focus|प्राथमिकता|चुनें|विकल्प|व्यवसाय)\b/,
      leadership: /\b(pioneer|leader|leadership|recognition|known|reputation|innovation|technology|scale|national|india|career|10th house|11th house|9th house|नेतृत्व|पहचान|प्रसिद्ध|भारत)\b/,
      wealth: /\b(wealth|money|income|earning|earnings|finance|2nd house|11th house|dhan|cash|profit|धन|पैसा|कमाई|लाभ)\b/,
      spouse_luck: /\b(husband|wife|spouse|partner|marriage|7th house|venus|jupiter|पति|पत्नी|जीवनसाथी|विवाह|शादी)\b/,
      career: /\b(career|job|work|business|profession|10th house|6th house|11th house|करियर|नौकरी|व्यवसाय|काम)\b/,
      health: /\b(health|routine|screening|doctor|6th house|8th house|12th house|स्वास्थ्य|डॉक्टर|नींद|तनाव)\b/,
      livestock_capital_decision: /\b(cow|cows|cattle|dairy|livestock|sell|buy|replace|expand|yield|milk|feed|cost|margin|profit|herd|गाय|डेयरी|दूध|बेच|खरीद|लाभ)\b/,
      general: /./,
    }

    if (intent !== "general" && !intentTerms[intent].test(answerText)) {
      return false
    }

    if (
      ["business_profit", "livestock_capital_decision"].includes(intent) &&
      !/\b(yes|no|likely|unlikely|mixed|positive|caution|profitable|profit|loss|break even|revenue|sales|margin|haan|nahi|ha|na|लाभ|नुकसान|संभावना|मिश्रित|हाँ|नहीं)\b/.test(
        answerText
      )
    ) {
      return false
    }

    return intentTerms[intent].test(text)
  }

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
      normalized.includes("current period is judged through the active dasha lords first") ||
      normalized.includes("period gives results through its house placement") ||
      normalized.includes("treat this period as active for the themes shown in chart basis") ||
      normalized.includes("with discipline where pressure houses are involved") ||
      normalized.includes("mahadasha gives the background antardasha selects the active life area") ||
      normalized.includes("if the same houses repeat through lordship placement drishti") ||
      normalized.includes("retry the ai") ||
      normalized.includes("could not finish")
    )
  }

  const isRepeatedQuestionAnswer = (
    answer: unknown,
    seenAnswers: Set<string>
  ) => {
    const normalized = normalizeQuestionSearchText(answer)

    if (!normalized) {
      return true
    }

    const compact = normalized.slice(0, 260)
    const overlap = Array.from(seenAnswers).some((seen) => {
      if (!seen || !compact) {
        return false
      }

      return (
        seen === compact ||
        seen.includes(compact.slice(0, 180)) ||
        compact.includes(seen.slice(0, 180))
      )
    })

    return overlap
  }

  const hasOnlyPastTiming = (value: unknown) => {
    const text = normalizeQuestionText(value)
    const monthNumbers: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    }
    const matches = Array.from(
      text.matchAll(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d{2})\b/gi)
    )

    if (!matches.length) {
      return false
    }

    const now = new Date()
    const currentIndex = now.getUTCFullYear() * 12 + now.getUTCMonth() + 1
    const latestIndex = Math.max(
      ...matches.map((match) =>
        Number(match[2]) * 12 + (monthNumbers[match[1].slice(0, 3).toLowerCase()] || 0)
      )
    )

    return latestIndex < currentIndex
  }

  const isCompleteFocusedAnswer = (
    question: string,
    candidate: any,
    seenAnswers: Set<string>
  ) => {
    const answer = normalizeQuestionText(candidate?.answer)
    const reason = normalizeQuestionText(candidate?.chart_reason)
    const action = normalizeQuestionText(candidate?.action)
    const sentenceCount = answer.split(/[.!?।]+/).filter((item) => item.trim()).length

    return Boolean(
      !isWeakQuestionAnswer(answer) &&
      answer.length >= 260 &&
      sentenceCount >= 3 &&
      reason.length >= 70 &&
      action.length >= 60 &&
      !hasOnlyPastTiming(candidate?.timing) &&
      !isRepeatedQuestionAnswer(answer, seenAnswers) &&
      answerMatchesQuestionIntent(question, answer, reason)
    )
  }

  const buildFocusedQuestionContext = (question: string) => {
    const intent = getQuestionIntent(question)
    const housesByIntent: Record<string, number[]> = {
      business_profit: [2, 6, 7, 10, 11],
      comparison_decision: [2, 3, 6, 7, 10, 11, 12],
      leadership: [1, 3, 9, 10, 11],
      wealth: [2, 5, 9, 11],
      spouse_luck: [2, 7, 8, 12],
      career: [3, 6, 10, 11],
      health: [1, 6, 8, 12],
      livestock_capital_decision: [2, 4, 6, 7, 10, 11, 12],
      general: [1, 4, 5, 7, 9, 10],
    }
    const usefulHouses = housesByIntent[intent] || housesByIntent.general
    const houses = usefulHouses.map((houseNumber) => {
      const house = chart.houses.find((item) => item.house === houseNumber)
      const synthesis = chart.houseSynthesis?.find(
        (item) => item.house === houseNumber
      )

      return {
        house: houseNumber,
        sign: house?.sign,
        lord: house?.signLord,
        planets: getHousePlanets(chart, houseNumber).map((planet) => planet.name),
        drishti: synthesis?.aspectsReceived?.map((aspect) => ({
          planet: aspect.fromPlanet,
          type: aspect.aspectType,
        })) || [],
      }
    })
    const relevantPlanetNames = new Set(
      houses.flatMap((house) => [
        house.lord,
        ...house.planets,
        ...house.drishti.map((aspect) => aspect.planet),
      ])
        .filter(Boolean)
    )
    if (chart.dasha) {
      relevantPlanetNames.add(chart.dasha.mahadasha.lord)
      relevantPlanetNames.add(chart.dasha.antardasha.lord)
      relevantPlanetNames.add(chart.dasha.pratyantar.lord)
    }
    if (intent === "livestock_capital_decision") {
      ;["Moon", "Venus", "Mars", "Saturn", "Jupiter"].forEach((planet) =>
        relevantPlanetNames.add(planet)
      )
    }

    const comparisonOptions = intent === "comparison_decision"
      ? question
          .replace(/[?।]/g, "")
          .split(/\s+(?:or|versus|vs\.?|या)\s+/i)
          .map((option) => option.trim())
          .filter(Boolean)
          .slice(0, 3)
      : []
    const knowledgeIntent: AstrologyKnowledgeIntent =
      intent === "comparison_decision" || intent === "leadership" || intent === "business_profit"
        ? "career"
        : intent === "livestock_capital_decision"
          ? "wealth"
        : intent === "wealth" || intent === "spouse_luck" || intent === "health"
          ? (intent === "spouse_luck" ? "relationship" : intent)
          : "dasha"
    const packLabelByIntent: Record<AstrologyKnowledgeIntent, string> = {
      career: "career_pack:",
      wealth: "wealth_pack:",
      health: "health_pack:",
      relationship: "relationship_pack:",
      dasha: "dasha_pack:",
      remedy: "remedy_pack:",
      yoga: "yoga_pack:",
      markesh: "markesh_pack:",
    }
    const localBookRules = knowledgePassages
      .filter(
        (passage) =>
          passage.source !== "Shreem curated Parashari rules" &&
          passage.section.startsWith(packLabelByIntent[knowledgeIntent])
      )
      .slice(0, 2)
    const applicableEngineRules = bphsRuleProofs
      .filter((rule) => {
        const area = rule.area.toLowerCase()
        if (knowledgeIntent === "career") return /career|wealth|dasha|method/.test(area)
        if (knowledgeIntent === "relationship") return /relationship|dasha|method/.test(area)
        if (knowledgeIntent === "health") return /health|vitality|markesh|dasha|method/.test(area)
        return area.includes(knowledgeIntent) || /dasha|method/.test(area)
      })
      .slice(0, 3)

    return JSON.stringify({
      native: name,
      question,
      intent,
      decision: comparisonOptions.length > 1
        ? { type: "comparison", options: comparisonOptions }
        : undefined,
      lagna: chart.ascendant,
      moon: `${chart.moonSign}, ${chart.nakshatra} pada ${chart.nakshatraPada}`,
      active_dasha: chart.dasha
        ? [
            `${chart.dasha.mahadasha.lord} ${getPeriodWindow(chart.dasha.mahadasha)}`,
            `${chart.dasha.antardasha.lord} ${getPeriodWindow(chart.dasha.antardasha)}`,
            `${chart.dasha.pratyantar.lord} ${getPeriodWindow(chart.dasha.pratyantar)}`,
          ]
        : [],
      houses,
      planets: chart.planets
        .filter((planet) => relevantPlanetNames.has(planet.name))
        .map((planet) => ({
          name: planet.name,
          sign: planet.sign,
          bhava: planet.bhavaHouse || planet.house,
          dignity: getPlanetDignity(planet),
          owns: getPlanetOwnedHouses(chart, planet.name),
        })),
      gochar: buildGocharImpactPack(chart)
        .filter((item) => usefulHouses.includes(item.natal_house))
        .slice(0, 4),
      bphs: localBookRules.map((passage) => ({
        citation: passage.citation,
        rule: compactDossierText(passage.text, 260),
      })),
      applicable_rule_engine: applicableEngineRules.map((rule) => ({
        rule: rule.rule,
        matched_chart_fact: rule.chart_fact,
        application: rule.application,
        strength: rule.strength,
      })),
      special_case_hypotheses: detectedCases
        .filter((item) => item.houses.some((house) => usefulHouses.includes(house)))
        .slice(0, 5)
        .map((item) => ({
          name: item.name,
          strength_hypothesis: item.strength,
          chart_basis: item.chart_basis,
          proposed_effect: item.combined_effect,
        })),
      remedies: targetedRemedySeeds.slice(0, 3),
    })
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

  const houseInterpretationSchema = {
    type: "object",
    properties: {
      house_outcomes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            house: { type: "number" },
            user_meaning: { type: "string" },
            solution: { type: "string" },
          },
          required: ["house", "user_meaning", "solution"],
        },
      },
    },
    required: ["house_outcomes"],
  } as const

  let houseInterpretationComplete = false

  const enhanceHouseOutcomesWithGemini = async () => {
    if (!isGeminiEnabled() || !analysis.house_outcomes?.length) {
      houseInterpretationComplete = !analysis.house_outcomes?.length
      return
    }

    const allowHouseRewrite =
      process.env.ASTROLOGY_KUNDLI_ENABLE_HOUSE_REWRITE !== "false"
    if (!allowHouseRewrite) {
      return
    }

    const interpretedRows: any[] = []
    const houseChunks: Array<typeof analysis.house_outcomes> = []
    for (let index = 0; index < analysis.house_outcomes.length; index += 6) {
      houseChunks.push(analysis.house_outcomes.slice(index, index + 6))
    }

    for (const houseChunk of houseChunks) {
      const housePrompt = [
        "You are Shreem Astrology's senior Jyotish interpreter.",
        "Convert raw chart facts and fallible rule hypotheses into ready-made customer conclusions.",
        "Do not tell the user how to analyse. Do not say 'judge by', 'refer to', 'use this', or 'this should be read'. Give the final meaning directly.",
        "Return every house supplied in this batch. Do not skip any house.",
        "For every house return two fields: user_meaning and solution.",
        "For each house, combine its lord and lord placement, dignity, occupants, every received Parashari drishti, active dasha and every verified special case listed in the evidence. Resolve contradictions instead of trusting the supplied polarity or listing ingredients.",
        "Use BPHS-style judgement: house lord strength is primary, occupants modify delivery, drishti can protect or afflict, Bhava Chalit impact decides how strongly the result manifests, and active dasha decides whether it is current or background.",
        "If a lord is strong in dignity but weak/sandhi in Bhava Chalit, say the promise exists but delivery is inconsistent. If a malefic pressure is protected by Jupiter/Venus/Mercury/Moon, say what is protected and what still needs discipline.",
        "user_meaning must be two crisp sentences: first state whether the combined result is supportive, difficult or mixed and exactly what the graha combination causes; second state its most likely real-life manifestation for this person, with no methodology language.",
        "Name a yoga or dosha only when it is explicitly present in deterministic_meaning or technical_evidence. Count cancellation and benefic protection before deciding the net effect.",
        "solution must be one crisp sentence with conduct, daan/seva/mantra/pooja where relevant, not vague homework.",
        "Ban generic phrases such as 'may affect', 'can modify', 'needs balance', 'depends on timing' or 'results vary' unless followed by a concrete outcome and reason.",
        "Do not invent new planet positions, yogas, named diseases, death, accident certainty, or scary claims.",
        LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
        "Return JSON only.",
        JSON.stringify({
          active_dasha: chart.dasha
            ? `${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar`
            : "unavailable",
          houses: houseChunk.map((row) => ({
            house: row.house,
            theme: compactDossierText(row.theme, 120),
            prevailing_impact: compactDossierText(row.prevailing_impact, 180),
            deterministic_meaning: compactDossierText(row.user_meaning || row.outcome, 360),
            technical_evidence: compactDossierText(row.evidence, 360),
          })),
        }),
      ].join("\n")

      const houseGemini = await generateGeminiJson({
        prompt: housePrompt,
        responseSchema: houseInterpretationSchema,
        temperature: 0.12,
        timeoutMs: 45_000,
        maxAttempts: 2,
        maxOutputTokens: 2400,
        thinkingBudget: 0,
        label: "kundli-house-interpretation",
        model: process.env.ASTROLOGY_KUNDLI_HOUSE_MODEL ||
          "gemini-2.5-flash-lite",
      })

      supplementalGeminiUsage = {
        prompt_tokens:
          supplementalGeminiUsage.prompt_tokens + houseGemini.usage.prompt_tokens,
        completion_tokens:
          supplementalGeminiUsage.completion_tokens +
          houseGemini.usage.completion_tokens,
        cached_prompt_tokens:
          Number(supplementalGeminiUsage.cached_prompt_tokens || 0) +
          Number(houseGemini.usage.cached_prompt_tokens || 0),
        thoughts_tokens:
          Number(supplementalGeminiUsage.thoughts_tokens || 0) +
          Number(houseGemini.usage.thoughts_tokens || 0),
        total_tokens:
          supplementalGeminiUsage.total_tokens + houseGemini.usage.total_tokens,
        estimated_cost_usd: Number(
          (
            supplementalGeminiUsage.estimated_cost_usd +
            houseGemini.usage.estimated_cost_usd
          ).toFixed(6)
        ),
        estimated_cost_inr: Number(
          (
            supplementalGeminiUsage.estimated_cost_inr +
            houseGemini.usage.estimated_cost_inr
          ).toFixed(4)
        ),
      }
      supplementalAttemptLogs = [
        ...supplementalAttemptLogs,
        ...(houseGemini.attempt_logs || []),
      ]

      if (houseGemini.ok && Array.isArray(houseGemini.parsed?.house_outcomes)) {
        interpretedRows.push(...houseGemini.parsed.house_outcomes)
      }
    }

    if (!interpretedRows.length) {
      return
    }

    const byHouse = new Map(
      interpretedRows.map((row: any) => [Number(row.house), row])
    )

    analysis.house_outcomes = analysis.house_outcomes.map((row) => {
      const interpreted = byHouse.get(row.house)

      if (!interpreted) {
        return row
      }

      return {
        ...row,
        user_meaning:
          sanitizeString(interpreted.user_meaning, 900) || row.user_meaning,
        practical_use:
          sanitizeString(interpreted.solution, 700) || row.practical_use,
      }
    })
    houseInterpretationComplete = analysis.house_outcomes.every((row) => {
      const interpreted = byHouse.get(row.house)
      const meaning = sanitizeString(interpreted?.user_meaning, 900)
      const normalizedMeaning = normalizeQuestionSearchText(meaning)
      return Boolean(
        interpreted &&
        meaning.length >= 120 &&
        meaning.split(/[.!?।]+/).filter((item) => item.trim()).length >= 2 &&
        !/may affect|needs balance|depends on timing|results vary|judge by|refer to|should be read|how to analyse|how to analyze/.test(
          normalizedMeaning
        ) &&
        sanitizeString(interpreted.solution, 700).length >= 50
      )
    })
  }

  let focusedQuestionAnswersComplete = subQuestions.filter(Boolean).length === 0

  const enhanceQuestionAnswersWithGemini = async () => {
    const questions = (Array.isArray(subQuestions) ? subQuestions : [])
      .map((item) => normalizeQuestionText(item, 1000))
      .filter(Boolean)
      .slice(0, 3)

    if (!questions.length) {
      analysis.sub_question_answers = []
      focusedQuestionAnswersComplete = true
      return
    }

    const finalAnswers = questions.map((question) => {
      return {
        question,
        answer: "",
        chart_reason: "",
        timing: "",
        action: "",
      }
    })
    const seenQuestionAnswers = new Set<string>()

    if (isGeminiEnabled()) {
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index]
        const focusedPrompt = [
        "You are Shreem Astrology's senior Jyotish expert. Answer only the user's one question.",
        "Treat calculated positions, ownership, drishti and dasha dates below as raw chart facts. Treat supplied meanings, scores and polarity labels as fallible hypotheses; correct them when the combined evidence disagrees.",
        "Do not invent planet positions, houses, dashas, yogas, or events. Explain which hypothesis prevailed and why without exposing internal scoring to the customer.",
        "Do not write a chart overview. Do not repeat the summary. Every answer must directly address the exact question, then cite concrete chart evidence.",
        "If the question asks yes/no or outcome, start with one of: Yes, Likely yes, Mixed, Likely no, or No. Then give the reason.",
        "If the question asks business profitability, answer profit/loss potential directly using 2nd income, 6th operations, 7th customers, 10th work/status, 11th gains, dasha, drishti and gochar. Mention whether profit is likely, delayed, mixed, or needs strict cost/sales discipline.",
        "For a comparison question, name the preferred option in the first sentence. Compare evidence and risk for every option, recommend a reversible pilot or staged allocation where certainty is mixed, and give a dated review window from dasha/gochar. Never leave the choice to the user without a verdict.",
        "For a cow, cattle or dairy capital decision, give a direct sell/retain/buy/expand verdict. Combine the chart with commercial safeguards: veterinary reproductive exam, lactation history, expected milk yield, feed cost, purchase price, sale value, quarantine, insurance and a phased herd limit. Astrology may time the decision but must not replace these checks.",
        "For pioneer, leadership or national-recognition questions, answer the requested scale directly using the 1st, 3rd, 9th, 10th and 11th houses, Rahu/Mercury/Jupiter where present, active dasha and reinforcing gochar. Give the most plausible route, constraint and timing window.",
        "Words about a venture such as business operations, production, hydroponics, farming and processing are non-medical unless the question explicitly concerns health.",
        "If the question is about spouse/marriage, discuss 7th house, 7th lord, Venus/Jupiter, 2nd/8th/12th where relevant, Moon, and active dasha.",
        "If the question is about business/home town/settlement, discuss 4th, 10th, 11th, 2nd, 6th, customers/7th where relevant, and active dasha.",
        "Each answer must include practical next steps and remedies: sales/cost discipline where relevant, pooja/worship, mantra, daan, daily conduct, and gemstone only if supported with expert-review caution.",
        `Today is ${new Date().toISOString().slice(0, 10)}. Never recommend a review or action date before today unless explicitly describing a past event.`,
        "Answer in 5 to 7 concise sentences. The first sentence must be the verdict. State why, the main downside, the condition that would change the verdict, and the practical execution plan. chart_reason must be one technical sentence; timing and action must be one sentence each.",
        "Return exactly one row in sub_question_answers and return JSON only.",
        `Question: ${question}`,
        "",
        buildFocusedQuestionContext(question),
      ].join("\n")

        for (let qualityRound = 1; qualityRound <= 2; qualityRound += 1) {
          const focused = await generateGeminiJson({
          prompt:
            qualityRound === 1
              ? focusedPrompt
              : `${focusedPrompt}\n\nQUALITY_REPAIR: The previous answer failed specificity, completeness, intent, distinctness or future-timing validation. Give a sharper verdict and complete every required field.`,
          responseSchema: focusedQuestionSchema,
          temperature: 0.18,
          timeoutMs: 60_000,
          maxAttempts: 3,
          maxOutputTokens: 1800,
          thinkingBudget: 0,
          label: `kundli-focused-question-${index + 1}-round-${qualityRound}`,
          model: process.env.ASTROLOGY_KUNDLI_QUESTION_MODEL ||
            process.env.ASTROLOGY_KUNDLI_MODEL ||
            "gemini-2.5-flash",
          })

        supplementalGeminiUsage = {
          prompt_tokens:
            supplementalGeminiUsage.prompt_tokens + focused.usage.prompt_tokens,
          completion_tokens:
            supplementalGeminiUsage.completion_tokens +
            focused.usage.completion_tokens,
          cached_prompt_tokens:
            Number(supplementalGeminiUsage.cached_prompt_tokens || 0) +
            Number(focused.usage.cached_prompt_tokens || 0),
          thoughts_tokens:
            Number(supplementalGeminiUsage.thoughts_tokens || 0) +
            Number(focused.usage.thoughts_tokens || 0),
          total_tokens:
            supplementalGeminiUsage.total_tokens + focused.usage.total_tokens,
          estimated_cost_usd: Number(
            (
              supplementalGeminiUsage.estimated_cost_usd +
              focused.usage.estimated_cost_usd
            ).toFixed(6)
          ),
          estimated_cost_inr: Number(
            (
              supplementalGeminiUsage.estimated_cost_inr +
              focused.usage.estimated_cost_inr
            ).toFixed(4)
          ),
        }
        supplementalAttemptLogs = [
          ...supplementalAttemptLogs,
          ...(focused.attempt_logs || []),
        ]

        const candidate = Array.isArray(focused.parsed?.sub_question_answers)
          ? focused.parsed.sub_question_answers[0]
          : null

        if (isCompleteFocusedAnswer(question, candidate, seenQuestionAnswers)) {
            finalAnswers[index] = {
              question,
              answer: normalizeQuestionText(candidate.answer, 3200),
              chart_reason: normalizeQuestionText(candidate.chart_reason, 2200),
              timing: normalizeQuestionText(candidate.timing, 900),
              action: normalizeQuestionText(candidate.action, 1800),
            }
            seenQuestionAnswers.add(
              normalizeQuestionSearchText(candidate.answer).slice(0, 260)
            )
            break
          }
        }
        }
      }

    questions.forEach((question, index) => {
      if (isWeakQuestionAnswer(finalAnswers[index]?.answer)) {
        finalAnswers[index] = {
          question,
          answer:
            "The AI could not complete a focused answer for this question from the calculated evidence. Please regenerate the Kundli reading so Gemini can answer this specific question from the deterministic chart facts.",
          chart_reason:
            "No customer-facing answer was substituted from deterministic fallback text.",
          timing: "",
          action: "Regenerate the reading or book expert review for this question.",
        }
      }
    })

    analysis.sub_question_answers = finalAnswers
    focusedQuestionAnswersComplete = finalAnswers.every(
      (item, index) =>
        !isWeakQuestionAnswer(item.answer) &&
        answerMatchesQuestionIntent(questions[index], item.answer, item.chart_reason)
    )

    const directAnswers = finalAnswers.map((item) =>
      normalizeQuestionSearchText(item.answer)
    )

    const firstUserRow = {
      area: "User question summary",
      chart_basis: finalAnswers
        .map((item, index) => `Q${index + 1}: ${item.chart_reason}`)
        .join(" | "),
      prediction: finalAnswers
        .map((item, index) => `Q${index + 1}: ${item.answer}`)
        .join(" "),
      advice:
        "Each question is answered separately above. Use this row only as a compact summary; timing should still be judged through dasha plus Gochar trigger.",
    }

    const predictionRows = Array.isArray(analysis.prediction_table)
      ? analysis.prediction_table
      : []

    analysis.prediction_table = [
      firstUserRow,
      ...predictionRows.filter((row: any) => {
        const area = normalizeQuestionSearchText(row?.area)
        const prediction = normalizeQuestionSearchText(row?.prediction)

        return (
          !area.includes("user question") &&
          !area.includes("question") &&
          !directAnswers.includes(prediction) &&
          !prediction.includes("ai did not return") &&
          !prediction.includes("calculated chart is available") &&
          !prediction.includes("retry the ai")
        )
      }),
    ].slice(0, 18)

    if (
      directAnswers.some(
        (answer) =>
          normalizeQuestionSearchText(analysis.summary) === answer ||
          normalizeQuestionSearchText(analysis.summary).includes(answer.slice(0, 120))
      )
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
  await enhanceHouseOutcomesWithGemini()

  const safeAnalysis = sanitizeKundliLanguage(analysis)
  const safeHealthIndicators = sanitizeKundliLanguage(healthIndicators)
  const safeCriticalPeriod = sanitizeKundliLanguage(publicCriticalPeriod)

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
    health_indicators: safeHealthIndicators,
    critical_period_analysis: safeCriticalPeriod,
    longevity_assessment: undefined,
    dasha_timeline: dashaTimeline,
    targeted_remedy_seeds: targetedRemedySeeds,
    bphs_rule_proofs: bphsRuleProofs,
    evidence_stack: evidencePack,
    analysis: safeAnalysis,
    analysis_mode: "standard",
    usage_units: usageUnits,
    model: gemini.model,
    agent_pipeline: {
      architecture: "bounded-evidence-agents-v1",
      chart_calculator: "raw_input_complete",
      profile_agent: isBaseSynthesisValid(gemini.parsed) ? "passed" : "failed",
      question_agent: focusedQuestionAnswersComplete ? "passed" : "failed",
      house_agent: houseInterpretationComplete ? "passed" : "failed",
      quality_gate:
        focusedQuestionAnswersComplete && houseInterpretationComplete
          ? "passed"
          : "failed",
    },
  }

  const usageRecordPayload = buildKundliUsageRecordPayload({
    result,
    chart,
    knowledgePassages,
    detectedCases,
    healthIndicators: safeHealthIndicators,
    criticalPeriod: safeCriticalPeriod,
    targetedRemedySeeds,
    bphsRuleProofs,
    longevityAssessment,
  })
  const combinedGeminiUsage: GeminiUsage = {
    prompt_tokens:
      priorSynthesisUsage.prompt_tokens +
      gemini.usage.prompt_tokens +
      supplementalGeminiUsage.prompt_tokens,
    completion_tokens:
      priorSynthesisUsage.completion_tokens +
      gemini.usage.completion_tokens +
      supplementalGeminiUsage.completion_tokens,
    cached_prompt_tokens:
      Number(priorSynthesisUsage.cached_prompt_tokens || 0) +
      Number(gemini.usage.cached_prompt_tokens || 0) +
      Number(supplementalGeminiUsage.cached_prompt_tokens || 0),
    thoughts_tokens:
      Number(priorSynthesisUsage.thoughts_tokens || 0) +
      Number(gemini.usage.thoughts_tokens || 0) +
      Number(supplementalGeminiUsage.thoughts_tokens || 0),
    total_tokens:
      priorSynthesisUsage.total_tokens +
      gemini.usage.total_tokens +
      supplementalGeminiUsage.total_tokens,
    estimated_cost_usd: Number(
      (
            priorSynthesisUsage.estimated_cost_usd +
            gemini.usage.estimated_cost_usd +
        supplementalGeminiUsage.estimated_cost_usd
      ).toFixed(6)
    ),
    estimated_cost_inr: Number(
      (
            priorSynthesisUsage.estimated_cost_inr +
            gemini.usage.estimated_cost_inr +
        supplementalGeminiUsage.estimated_cost_inr
      ).toFixed(4)
    ),
  }

  const usage = await recordAiUsage({
    tool: "astrology_kundli",
    input: result.profile,
    response: usageRecordPayload,
    metadata: {
      customer_email: customer.email,
      analysis_mode: "standard",
      ...getAstrologyBillingMetadata(access),
      billable: focusedQuestionAnswersComplete && houseInterpretationComplete,
      quality_gate_passed:
        focusedQuestionAnswersComplete && houseInterpretationComplete,
      agent_architecture: "bounded-evidence-agents-v1",
      usage_units: usageUnits,
      chart_summary: {
        ascendant: chart.ascendant,
        moonSign: chart.moonSign,
        nakshatra: chart.nakshatra,
        dasha: chart.dasha
          ? {
              mahadasha: chart.dasha.mahadasha?.lord,
              antardasha: chart.dasha.antardasha?.lord,
              pratyantar: chart.dasha.pratyantar?.lord,
            }
          : undefined,
        panchangSystem: chart.panchangSystem,
        houseSystem: chart.houseSystem,
      },
      knowledge_references: getKnowledgeIds(knowledgePassages).slice(0, 20),
      knowledge_context: compactKnowledgeTraceForUsage(knowledgePassages).slice(0, 4),
      detected_cases_count: detectedCases.length,
      health_indicators: safeHealthIndicators.slice(0, 8),
      critical_period_summary: {
        exact_timing_window_count: 0,
        medical_watchlist_count: 0,
        disabled_reason: "whole_life_markesh_removed_from_customer_flow",
      },
      targeted_remedy_count: targetedRemedySeeds.length,
      bphs_rule_proof_count: bphsRuleProofs.length,
      evidence_counts: {
        dasha: evidencePack.dasha_evidence.length,
        drishti: evidencePack.drishti_summary.length,
        gochar: evidencePack.gochar_evidence.length,
        bphs: evidencePack.bphs_traces.length,
      },
    },
    model: gemini.model,
    ...combinedGeminiUsage,
    provider: gemini.provider,
    attempts:
      priorSynthesisAttempts.filter((log) => log.provider === "gemini").length +
      Number(gemini.attempts || 0) +
      supplementalAttemptLogs.filter((log) => log.provider === "gemini").length,
    attempt_logs: [
      ...priorSynthesisAttempts,
      ...(gemini.attempt_logs || []),
      ...supplementalAttemptLogs,
    ],
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

  if (!focusedQuestionAnswersComplete || !houseInterpretationComplete) {
    return NextResponse.json(
      {
        message:
          "The Kundli agents calculated the chart but did not pass the customer-answer quality gate. No AI credit was consumed. Please retry.",
        retryable: true,
        usage_synced: usage.synced,
        credit: { consumed: false, reason: "quality_gate_failed" },
        wallet: access.wallet,
        quota: access.quota,
      },
      { status: 503 }
    )
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
