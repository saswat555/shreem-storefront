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
import { checkAstrologyDailyQuota } from "@lib/util/ai-quota"
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
    current_period_analysis: { type: "string" },
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
    "current_period_analysis",
    "prediction_table",
    "planet_effects",
    "likely_challenges",
    "issue_analysis",
    "practical_solutions",
    "spiritual_guidance",
    "sub_question_answers",
    "special_cases",
    "upaay",
    "shreem_product_suggestions",
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

const getStoneRecommendations = (chart: PrashnaChart) => {
  const lagnaLord = SIGN_LORDS[chart.ascendant]
  const rashiLord = SIGN_LORDS[chart.moonSign]

  return {
    lagna: {
      sign: chart.ascendant,
      lord: lagnaLord,
      ...GEMSTONES_BY_LORD[lagnaLord],
    },
    rashi: {
      sign: chart.moonSign,
      lord: rashiLord,
      ...GEMSTONES_BY_LORD[rashiLord],
    },
    caution:
      "These are general lagna/rashi stone indications. Gemstones should not be worn without expert review of strength, affliction, dasha, health, and suitability.",
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

const buildPrompt = ({
  name,
  chart,
  detectedYogas,
  stones,
  subQuestions,
  language,
}: {
  name: string
  chart: PrashnaChart
  detectedYogas: string[]
  stones: ReturnType<typeof getStoneRecommendations>
  subQuestions: string[]
  language: string
}) =>
  [
    "You are Shreem Astrology's Vedic Kundli analysis assistant.",
    "Use only the calculated chart data and deterministic yoga detections below. Do not invent yogas that are not present.",
    "The chart calculation layer is authoritative. Do not move planets into different houses, do not alter Lagna, and do not infer chart facts that are absent.",
    "Cover special astrological cases when indicated, including Kaal Sarp, Manglik/Mars sensitivity, debilitation, possible Neechabhanga, Gajakesari, Budhaditya, and Chandra-Mangal.",
    "Also consider period timing from Vimshottari Mahadasha, Antardasha, and Pratyantar Dasha. Keep period analysis grounded in the dasha lords and their houses/signs.",
    "Give a detailed reading with these sections: who the person is, behavioral traits, strengths, life themes, likely challenges/issues, practical solutions, Vedic remedies, and cautious spiritual guidance.",
    "Return prediction_table with rows for Personality, Career, Money, Marriage, Health, Current period, and Remedies. Each row must include chart_basis, prediction, and advice.",
    "Return planet_effects with one useful row for every graha: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu. Each row must explain placement, effect, and practical advice.",
    "Answer at most three sub-questions. If no sub-questions are provided, return an empty sub_question_answers array.",
    "Every sub-question answer must cite a chart reason using Lagna, Moon sign/nakshatra, houses, or graha placement. Do not answer from generic intuition.",
    "If a yoga is not detected, do not claim it exists. Mention uncertainty clearly.",
    "Give remedies as Vedic practices: mantra, daan, vrata, worship, discipline, and seva.",
    "For product suggestions, use only the provided available_ritual_support handles. Do not invent products, URLs, prices, or claims. Recommend at most three and only when naturally relevant to the remedy.",
    "Never give medical, legal, or financial certainty. Gemstones must always redirect to expert review before wearing.",
    "If strong dosha, gemstone, pooja, marriage, health, or career-defining guidance appears, set expert_call_recommended true and recommend Sanjay Kumar Pandey.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only.",
    `Native name: ${name || "Not provided"}`,
    `Sub-questions: ${JSON.stringify(subQuestions)}`,
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
    `General stone indicators: ${JSON.stringify(stones)}`,
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

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        message: "Kundli AI is not enabled on this server yet.",
        chart,
        detected_yogas: detectedYogas,
        stones,
      },
      { status: 503 }
    )
  }

  const quota = await checkAstrologyDailyQuota()

  if (!quota.synced) {
    return NextResponse.json(
      {
        message:
          "AI usage tracking is unavailable, so this reading is paused to protect your daily limit.",
        chart,
        detected_yogas: detectedYogas,
        stones,
        retryable: true,
      },
      { status: 503 }
    )
  }

  if (!quota.allowed) {
    return NextResponse.json(
      {
        message:
          `You have used your ${quota.limit} astrology AI readings for today. Please try again tomorrow.`,
        chart,
        detected_yogas: detectedYogas,
        stones,
        quota,
      },
      { status: 429 }
    )
  }

  const prompt = buildPrompt({
    name,
    chart,
    detectedYogas,
    stones,
    subQuestions,
    language,
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
    health_caution: sanitizeString(parsed?.health_caution, 600),
    current_period_analysis: sanitizeString(
      parsed?.current_period_analysis,
      800
    ),
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
    shreem_product_suggestions: normalizeAstrologyProductSuggestions(
      parsed?.shreem_product_suggestions
    ),
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
    stones,
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
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended: analysis.expert_call_recommended,
  })

  return NextResponse.json({
    ...result,
    usage_synced: usage.synced,
  })
}
