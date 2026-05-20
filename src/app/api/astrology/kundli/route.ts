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
    "expert_call_recommended",
    "expert_call_reason",
  ],
} as const

type KundliPayload = {
  name?: unknown
  birthDate?: unknown
  birthTime?: unknown
  cityId?: unknown
  gender?: unknown
  language?: unknown
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

const detectKaalSarp = (chart: PrashnaChart) => {
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

  return "Kaal Sarp pattern indicated: all classical grahas fall within the Rahu-Ketu axis. Treat this as a sensitive indication and confirm with an astrologer."
}

const detectYogas = (chart: PrashnaChart) => {
  const yogas: string[] = []
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

  const kaalSarp = detectKaalSarp(chart)
  if (kaalSarp) {
    yogas.push(kaalSarp)
  }

  if (moon && jupiter && isKendraDistance(getHouseDistance(moon, jupiter))) {
    yogas.push(
      "Gajakesari-style support: Jupiter is in a kendra from Moon, supporting guidance, learning, and protection when unafflicted."
    )
  }

  if (sun && mercury && sun.sign === mercury.sign) {
    yogas.push(
      "Budhaditya-style combination: Sun and Mercury share a sign, supporting intellect, speech, and administrative ability."
    )
  }

  if (moon && mars && (moon.sign === mars.sign || isKendraDistance(getHouseDistance(moon, mars)))) {
    yogas.push(
      "Chandra-Mangal influence: Moon and Mars are strongly linked, giving drive and financial initiative but emotional heat should be managed."
    )
  }

  if (mars && [1, 4, 7, 8, 12].includes(mars.house)) {
    yogas.push(
      "Manglik/Mars sensitivity is present by house placement. Relationship and conflict matters should be reviewed carefully."
    )
  }

  if (moon) {
    const adjacentPlanets = chart.planets.filter(
      (planet) =>
        !["Moon", "Rahu", "Ketu"].includes(planet.name) &&
        [2, 12].includes(((planet.house - moon.house + 12) % 12) + 1)
    )

    if (!adjacentPlanets.length) {
      yogas.push(
        "Kemadruma-style Moon isolation is indicated by the automated first pass. This can show emotional self-reliance, periodic loneliness, or the need for stronger support routines."
      )
    }
  }

  if (moon && jupiter) {
    const distance = getHouseDistance(moon, jupiter)

    if ([6, 8, 12].includes(distance)) {
      yogas.push(
        "Shakata-style Moon-Jupiter distance is present. Guidance, confidence, and fortune can fluctuate, so consistency matters more than mood-based decisions."
      )
    }
  }

  if (
    venus &&
    saturn &&
    (venus.sign === saturn.sign ||
      isKendraDistance(getHouseDistance(venus, saturn)))
  ) {
    yogas.push(
      "Venus-Saturn influence is active, pointing to maturity, delay, responsibility, or realism in love, luxury, art, and comfort matters."
    )
  }

  if (rahu && mars && rahu.sign === mars.sign) {
    yogas.push(
      "Angarak-style Rahu-Mars influence is present. Use discipline around anger, haste, risk-taking, inflammation, and conflict."
    )
  }

  if (ketu && saturn && ketu.sign === saturn.sign) {
    yogas.push(
      "Saturn-Ketu influence is present, suggesting karmic pressure around duty, health routines, boundaries, detachment, or service."
    )
  }

  Object.entries(planetsByHouse)
    .filter(
      ([, names]) =>
        names.filter((name) => !["Rahu", "Ketu"].includes(name)).length >= 3
    )
    .forEach(([house, names]) => {
      yogas.push(
        `Graha concentration is present in house ${house}: ${names.join(", ")}. This house becomes a major life theme and should be read carefully with dasha.`
      )
    })

  chart.planets
    .filter((planet) => EXALTATION_SIGNS[planet.name] === planet.sign)
    .forEach((planet) => {
      yogas.push(
        `${planet.name} is in exaltation sign ${planet.sign}, strengthening its significations when supported by house placement and dasha.`
      )
    })

  chart.planets
    .filter((planet) => DEBILITATION_SIGNS[planet.name] === planet.sign)
    .forEach((planet) => {
      const signLord = SIGN_LORDS[planet.sign]
      const lord = getPlanet(chart, signLord)
      const cancellation =
        lord && [1, 4, 7, 10].includes(lord.house)
          ? " Possible Neechabhanga support exists because the sign lord is in a kendra."
          : ""

      yogas.push(
        `${planet.name} is in debilitation sign ${planet.sign}.${cancellation}`
      )
    })

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
    yogas.push(
      "Dharma-karma support is indicated by the 9th/10th lord pattern. Career growth improves when ethics, skill, and visible action align."
    )
  }

  const dusthanaLordsInDusthana = [6, 8, 12].filter((houseNumber) => {
    const sign = chart.houses[houseNumber - 1]?.sign
    const lord = sign ? getPlanet(chart, SIGN_LORDS[sign]) : null

    return lord && DUSTHANA_HOUSES.includes(lord.house)
  })

  if (dusthanaLordsInDusthana.length) {
    yogas.push(
      `Vipreet Raja Yoga-style support should be reviewed: lords of houses ${dusthanaLordsInDusthana.join(", ")} occupy dusthana houses. Obstacles may convert into growth through service, discipline, and crisis handling.`
    )
  }

  return yogas.length
    ? yogas
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

const mergeKnowledgePassages = (
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
    .slice(0, 10)
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

const buildKundliKnowledgePassages = ({
  chart,
  detectedYogas,
  healthIndicators,
  targetedRemedySeeds,
  subQuestions,
}: {
  chart: PrashnaChart
  detectedYogas: string[]
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
      detectedCases: detectedYogas,
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

const buildPrompt = ({
  name,
  chart,
  detectedYogas,
  stones,
  healthIndicators,
  targetedRemedySeeds,
  subQuestions,
  language,
  knowledgePassages,
}: {
  name: string
  chart: PrashnaChart
  detectedYogas: string[]
  stones: ReturnType<typeof getStoneRecommendations>
  healthIndicators: string[]
  targetedRemedySeeds: TargetedRemedy[]
  subQuestions: string[]
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  [
    "You are Shreem Astrology's Vedic Kundli analysis assistant.",
    "Use only the calculated chart data and deterministic yoga detections below. Do not invent yogas that are not present.",
    "The chart calculation layer is authoritative. Do not move planets into different houses, do not alter Lagna, and do not infer chart facts that are absent.",
    "Use the retrieved Brihat Parashara Hora Shastra reference pack as the interpretive base for dasha, yoga, health-risk, and remedy judgement. It is not decorative citation. Apply it only after checking the calculated chart facts.",
    "First read Vimshottari timing: Mahadasha, Antardasha, and Pratyantar lord placement by house, sign, dignity, association, and relevant houses. Then explain how the BPHS reference pack modifies timing and outcomes.",
    "When two strong combinations coexist, synthesize them rather than listing them separately. Example: if Gajakesari support and Kaal Sarp/Rahu-Ketu pressure both appear, judge which dominates by dasha, house relevance, and afflicted/protective grahas.",
    "When a retrieved note identifies a later convention such as Kaal Sarp, say so plainly and judge it through Rahu/Ketu, houses, dignity, and dasha.",
    "Follow calculation-first discipline: if a combination is partial, call it partial and explain what supports or weakens it.",
    "Cover special astrological cases when indicated, including Kaal Sarp, Manglik/Mars sensitivity, debilitation, possible Neechabhanga, Gajakesari, Budhaditya, and Chandra-Mangal.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Also consider period timing from Vimshottari Mahadasha, Antardasha, and Pratyantar Dasha. Keep period analysis grounded in the dasha lords and their houses/signs.",
    "Give a detailed reading with these sections: who the person is, behavioral traits, strengths, life themes, likely challenges/issues, practical solutions, Vedic remedies, and cautious spiritual guidance.",
    "Health analysis must be deeper than generic caution: name likely vulnerability areas and possible disease tendencies from chart indicators, but use cautious language like tendency/watch/monitor. Do not diagnose. Tell the user to consult a qualified doctor for symptoms, emergencies, or persistent issues.",
    "Accident or major-incident analysis must be framed only as watch periods and preventive care. Mention it only when 6th/8th/12th houses, Mars/Saturn/Rahu/Ketu, and active dasha signals support it. Never guarantee harm or use frightening certainty.",
    "Return health_indicators with 4 to 7 specific watchlist items. Each item must include chart basis and a practical prevention note.",
    "Return dasha_predictions with one row each for Mahadasha, Antardasha, and Pratyantar. Each row must include chart_basis, classical_basis from the retrieved pack, prediction, and action.",
    "Return risk_watch with 2 to 5 practical watch areas only when supported by chart and dasha; include prevention, not fear.",
    "Return prediction_table with rows for Personality, Career, Money, Marriage, Health, Current period, and Remedies. Each row must include chart_basis, prediction, and advice.",
    "Return planet_effects with one useful row for every graha: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu. Each row must explain placement, effect, and practical advice.",
    "Answer at most three sub-questions. If no sub-questions are provided, return an empty sub_question_answers array.",
    "Every sub-question answer must cite a chart reason using Lagna, Moon sign/nakshatra, houses, or graha placement. Do not answer from generic intuition.",
    "If a yoga is not detected, do not claim it exists. Mention uncertainty clearly.",
    "Give remedies as Vedic practices: mantra, daan, vrata, worship, discipline, and seva.",
    "Return targeted_remedies with 3 to 6 exact pain-point remedies. Each row must map pain_point -> chart_basis -> mantra_or_pooja -> daily_practice. Avoid generic advice like simply do pooja; name the graha, day, mantra or deity, and the pain point it addresses.",
    "Gemstone guidance must only use the provided 1st, 5th, and 9th house lord stone indicators. Do not recommend a separate rashi/Moon stone unless it is already one of those trinal house indicators.",
    "For product suggestions, use only the provided available_ritual_support handles. Do not invent products, URLs, prices, or claims. Recommend at most three and only when naturally relevant to the remedy.",
    "Never give medical, legal, or financial certainty. Gemstones must always redirect to expert review before wearing.",
    "If strong dosha, gemstone, pooja, marriage, health, or career-defining guidance appears, set expert_call_recommended true and recommend Sanjay Kumar Pandey.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only.",
    `Native name: ${name || "Not provided"}`,
    `Sub-questions: ${JSON.stringify(subQuestions)}`,
    `Retrieved classical reference pack: ${formatAstrologyKnowledgeForPrompt(
      knowledgePassages
    )}`,
    `Active dasha discipline: ${activeDashaText(chart)}`,
    `Deterministic health watchlist: ${JSON.stringify(healthIndicators)}`,
    `Deterministic targeted remedy seeds: ${JSON.stringify(
      targetedRemedySeeds
    )}`,
    `Chart: ${JSON.stringify({
      generated_at: chart.generatedAtLocal,
      city: `${chart.city.name}, ${chart.city.region}`,
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
  const city = getCityById(sanitizeString(payload.cityId, 80))
  const subQuestions = sanitizeStringArray(payload.subQuestions, 3, 220)
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

  const chart = buildDetailedPrashnaChart({ city, date: birthDateTime })
  const detectedYogas = detectYogas(chart)
  const stones = getStoneRecommendations(chart)
  const healthIndicators = buildHealthIndicators(chart, detectedYogas)
  const targetedRemedySeeds = buildTargetedRemedySeeds(
    chart,
    detectedYogas,
    healthIndicators
  )
  const knowledgePassages = buildKundliKnowledgePassages({
    chart,
    detectedYogas,
    healthIndicators,
    targetedRemedySeeds,
    subQuestions,
  })

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        message: "Kundli AI is not enabled on this server yet.",
        chart,
        detected_yogas: detectedYogas,
        stones,
        health_indicators: healthIndicators,
        targeted_remedies: targetedRemedySeeds,
      },
      { status: 503 }
    )
  }

  const access = await checkAstrologyAccess()

  if (isAstrologyAccessBlocked(access)) {
    return NextResponse.json(
      {
        message:
          `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        chart,
        detected_yogas: detectedYogas,
        stones,
        health_indicators: healthIndicators,
        targeted_remedies: targetedRemedySeeds,
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
    stones,
    healthIndicators,
    targetedRemedySeeds,
    subQuestions,
    language,
    knowledgePassages,
  })
  const gemini = await generateGeminiJson({
    prompt,
    responseSchema: KUNDLI_SCHEMA,
    temperature: 0.22,
    label: "Kundli API",
  })

  if (!gemini.ok) {
    return NextResponse.json(
      {
        message:
          "Kundli AI could not generate the reading right now. Please try again.",
        chart,
        detected_yogas: detectedYogas,
        stones,
        retryable: true,
      },
      { status: 502 }
    )
  }

  const parsed = gemini.parsed
  const analysis = {
    summary: sanitizeString(parsed?.summary, 900),
    person_information: sanitizeString(parsed?.person_information, 900),
    temperament: sanitizeString(parsed?.temperament, 700),
    behavioral_traits: sanitizeStringArray(parsed?.behavioral_traits, 8, 220),
    strengths: sanitizeStringArray(parsed?.strengths, 8, 220),
    life_themes: sanitizeStringArray(parsed?.life_themes, 8, 220),
    career_direction: sanitizeString(parsed?.career_direction, 700),
    relationship_pattern: sanitizeString(parsed?.relationship_pattern, 700),
    health_caution: sanitizeString(parsed?.health_caution, 1000),
    health_indicators:
      sanitizeStringArray(parsed?.health_indicators, 7, 320).length > 0
        ? sanitizeStringArray(parsed?.health_indicators, 7, 320)
        : healthIndicators,
    current_period_analysis: sanitizeString(
      parsed?.current_period_analysis,
      800
    ),
    dasha_predictions: Array.isArray(parsed?.dasha_predictions)
      ? parsed.dasha_predictions
          .map((item: any) => ({
            period: sanitizeString(item?.period, 80),
            chart_basis: sanitizeString(item?.chart_basis, 320),
            classical_basis: sanitizeString(item?.classical_basis, 360),
            prediction: sanitizeString(item?.prediction, 560),
            action: sanitizeString(item?.action, 320),
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
            chart_basis: sanitizeString(item?.chart_basis, 320),
            dasha_trigger: sanitizeString(item?.dasha_trigger, 260),
            prevention: sanitizeString(item?.prevention, 320),
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
            chart_basis: sanitizeString(item?.chart_basis, 280),
            prediction: sanitizeString(item?.prediction, 500),
            advice: sanitizeString(item?.advice, 320),
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
            placement: sanitizeString(item?.placement, 220),
            effect: sanitizeString(item?.effect, 520),
            advice: sanitizeString(item?.advice, 320),
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
    likely_challenges: sanitizeStringArray(parsed?.likely_challenges, 8, 220),
    issue_analysis: sanitizeStringArray(parsed?.issue_analysis, 8, 260),
    practical_solutions: sanitizeStringArray(parsed?.practical_solutions, 8, 260),
    spiritual_guidance: sanitizeString(parsed?.spiritual_guidance, 700),
    sub_question_answers: Array.isArray(parsed?.sub_question_answers)
      ? parsed.sub_question_answers
          .map((item: any) => ({
            question: sanitizeString(item?.question, 220),
            answer: sanitizeString(item?.answer, 600),
            chart_reason: sanitizeString(item?.chart_reason, 360),
          }))
          .filter(
            (item: { question: string; answer: string; chart_reason: string }) =>
              Boolean(item.question && item.answer)
          )
          .slice(0, 3)
      : [],
    special_cases: Array.isArray(parsed?.special_cases)
      ? parsed.special_cases
          .map((item: unknown) => sanitizeString(item, 220))
          .filter(Boolean)
          .slice(0, 8)
      : detectedYogas,
    upaay: Array.isArray(parsed?.upaay)
      ? parsed.upaay
          .map((item: unknown) => sanitizeString(item, 220))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    targeted_remedies: Array.isArray(parsed?.targeted_remedies)
      ? parsed.targeted_remedies
          .map((item: any) => ({
            pain_point: sanitizeString(item?.pain_point, 180),
            chart_basis: sanitizeString(item?.chart_basis, 260),
            mantra_or_pooja: sanitizeString(item?.mantra_or_pooja, 360),
            daily_practice: sanitizeString(item?.daily_practice, 320),
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
    expert_call_recommended: Boolean(parsed?.expert_call_recommended),
    expert_call_reason: sanitizeString(parsed?.expert_call_reason, 600),
  }
  const result = {
    profile: {
      name,
      gender,
      birth_date: birthDate,
      birth_time: birthTime,
      city: `${city.name}, ${city.region}`,
      language,
      sub_questions: subQuestions,
    },
    chart,
    detected_yogas: detectedYogas,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    stones,
    health_indicators: healthIndicators,
    targeted_remedy_seeds: targetedRemedySeeds,
    analysis,
    model: gemini.model,
  }

  const usage = await recordAiUsage({
    tool: "astrology_kundli",
    input: result.profile,
    response: result,
    metadata: {
      customer_email: customer.email,
      chart,
      dasha: chart.dasha,
      knowledge_references: getKnowledgeIds(knowledgePassages),
      knowledge_context: knowledgeTrace(knowledgePassages),
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
