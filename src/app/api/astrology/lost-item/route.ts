import { NextRequest, NextResponse } from "next/server"

import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import {
  buildPrashnaChart,
  getCityById,
  type PrashnaChart,
} from "@lib/util/astrology"
import {
  checkAstrologyAccess,
  consumeChargeableAstrologyCredit,
  getAstrologyBillingMetadata,
  isAstrologyAccessBlocked,
} from "@lib/util/ai-quota"
import { generateGeminiJson } from "@lib/util/gemini"
import { isGeminiEnabled } from "@lib/util/prakriti-config"
import { buildDetailedPrashnaChart } from "@lib/util/vedic-astrology"

export const runtime = "nodejs"
export const maxDuration = 120

const LOST_ITEM_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    likely_location: { type: "string" },
    direction: { type: "string" },
    recovery_timing: { type: "string" },
    search_steps: { type: "array", items: { type: "string" } },
    chart_reasoning: { type: "array", items: { type: "string" } },
    caution: { type: "string" },
  },
  required: [
    "answer",
    "likely_location",
    "direction",
    "recovery_timing",
    "search_steps",
    "chart_reasoning",
    "caution",
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

const LOCHAN_GROUPS: Record<
  string,
  {
    label: string
    nakshatras: string[]
    direction: string
    retrieval: "high" | "medium" | "delayed" | "difficult"
    timing: string
    meaning: string
  }
> = {
  manda: {
    label: "Manda Lochana",
    nakshatras: [
      "Ashwini",
      "Mrigashira",
      "Ashlesha",
      "Hasta",
      "Anuradha",
      "Uttara Ashadha",
      "Shatabhisha",
    ],
    direction: "south or a lower/less-visible part of the place",
    retrieval: "delayed",
    timing: "Difficult but possible; repeat the search for 3-4 days instead of assuming it is gone.",
    meaning:
      "The article is often still near the known location, but hidden, covered, mixed with other things, or found after delay.",
  },
  madhya: {
    label: "Madhya Lochana",
    nakshatras: [
      "Bharani",
      "Ardra",
      "Magha",
      "Chitra",
      "Jyeshtha",
      "Purva Bhadrapada",
    ],
    direction: "west or the back/older-storage side of the place",
    retrieval: "medium",
    timing: "Information may come within a month; recovery can take longer if the item has moved.",
    meaning:
      "The object is not fully lost; movement or another person handling it is possible, so ask around and search active-use areas.",
  },
  andha: {
    label: "Andha Lochana",
    nakshatras: [
      "Rohini",
      "Pushya",
      "Uttara Phalguni",
      "Vishakha",
      "Purva Ashadha",
      "Dhanishta",
      "Revati",
    ],
    direction: "east or the front/entrance side",
    retrieval: "high",
    timing: "Quick recovery is indicated when the first search is focused.",
    meaning:
      "The object is generally recoverable and may be visible once the correct direction or nearby surface is checked.",
  },
  sulochana: {
    label: "Sulochana / Swaksha Lochana",
    nakshatras: [
      "Krittika",
      "Punarvasu",
      "Purva Phalguni",
      "Swati",
      "Mula",
      "Shravana",
      "Uttara Bhadrapada",
    ],
    direction: "north or away from the original place",
    retrieval: "difficult",
    timing: "Recovery is uncertain; act quickly and verify with people who had access.",
    meaning:
      "The object may have moved away, been carried by someone, or need a wider search than the first place.",
  },
}

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const sanitizeList = (value: unknown, limit: number, maxLength: number) =>
  Array.isArray(value)
    ? value
        .map((item) => sanitizeString(item, maxLength))
        .filter(Boolean)
        .slice(0, limit)
    : []

const findLochanGroup = (nakshatra: string) => {
  const normalized = nakshatra.toLowerCase()

  return (
    Object.values(LOCHAN_GROUPS).find((group) =>
      group.nakshatras.some((name) => name.toLowerCase() === normalized)
    ) || LOCHAN_GROUPS.manda
  )
}

const createDateFromLocalInput = ({
  date,
  time,
  city,
}: {
  date?: string
  time?: string
  city: { utcOffsetHours: number }
}) => {
  if (!date || !time) {
    return new Date()
  }

  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return new Date()
  }

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) -
      city.utcOffsetHours * 60 * 60 * 1000
  )
}

const getPlanetsInHouses = (chart: PrashnaChart, houses: number[]) =>
  chart.planets
    .filter((planet) => houses.includes(planet.bhavaHouse || planet.house))
    .map(
      (planet) =>
        `${planet.name} in bhava ${planet.bhavaHouse || planet.house} (${planet.sign}, ${planet.bhavaImpactPercent || "?"}% impact)`
    )

const scoreRecovery = (chart: PrashnaChart, retrieval: string) => {
  const base = retrieval === "high" ? 72 : retrieval === "medium" ? 58 : retrieval === "delayed" ? 48 : 34
  const support = getPlanetsInHouses(chart, [2, 4, 11]).length * 5
  const pressure = getPlanetsInHouses(chart, [8, 12]).length * 4

  return Math.max(15, Math.min(92, base + support - pressure))
}

const buildDeterministicReading = ({
  chart,
  itemName,
  itemType,
  lastSeenPlace,
  notes,
}: {
  chart: PrashnaChart
  itemName: string
  itemType: string
  lastSeenPlace: string
  notes: string
}) => {
  const lochan = findLochanGroup(chart.nakshatra)
  const recoveryScore = scoreRecovery(chart, lochan.retrieval)
  const supportFactors = getPlanetsInHouses(chart, [2, 4, 11])
  const pressureFactors = getPlanetsInHouses(chart, [7, 8, 12])
  const itemLabel = itemName || itemType || "lost item"
  const knownPlace = lastSeenPlace || "the last known place"
  const searchSteps = [
    `Start from ${knownPlace}; check the ${lochan.direction} side first.`,
    "Search under covers, inside bags/drawers, near charging points, shelves, clothes, vehicle pockets, and places recently cleaned or moved.",
    "Ask the last two people who entered or handled the area; do it calmly and with the exact item description.",
    itemType
      ? `For ${itemType}, check its natural storage zone first, then the nearest place where it was used.`
      : "Check the place where the item is usually kept, then the place where it was last used.",
  ]

  return {
    lochan,
    recoveryScore,
    answer:
      `${itemLabel} shows ${lochan.label} from Moon in ${chart.nakshatra}. ` +
      `${lochan.meaning} Recovery confidence is about ${recoveryScore}%.`,
    likely_location:
      `${lochan.direction}. Begin from ${knownPlace}; ${notes ? `also consider: ${notes}` : "look around hidden, covered, or recently shifted spots."}`,
    direction: lochan.direction,
    recovery_timing: lochan.timing,
    search_steps: searchSteps,
    chart_reasoning: [
      `Moon nakshatra at Prashna: ${chart.nakshatra} pada ${chart.nakshatraPada} -> ${lochan.label}.`,
      `Prashna Lagna: ${chart.ascendant} ${chart.ascendantDegree} deg; Moon in ${chart.moonSign} ${chart.moonDegree} deg.`,
      supportFactors.length
        ? `Recovery support houses active: ${supportFactors.join("; ")}.`
        : "No strong graha support in 2nd/4th/11th recovery houses; search should be systematic.",
      pressureFactors.length
        ? `Movement/hidden-loss pressure: ${pressureFactors.join("; ")}.`
        : "Hidden-loss pressure is not dominant in the practical bhava chart.",
    ],
    caution:
      "This is Prashna guidance, not proof of theft or blame. Use it to focus the search; report legally important documents or devices through proper channels.",
  }
}

const buildPrompt = ({
  deterministic,
  chart,
  payload,
}: {
  deterministic: ReturnType<typeof buildDeterministicReading>
  chart: PrashnaChart
  payload: Record<string, string>
}) =>
  [
    "You are Shreem Astrology's Nashta-Vastu Prashna assistant for lost items.",
    "Use the calculated Prashna chart and Four Eyes/Lochan nakshatra result as the base. Do not override the deterministic Lochan group, direction, or recovery confidence.",
    "Give practical search guidance without accusing anyone or guaranteeing recovery.",
    "Use Bhava Chalit for practical house impact: 2nd for object/value, 4th for home/place, 7th for other person, 8th for hidden, 11th for recovery, 12th for loss/removal.",
    "Return JSON only with the requested fields.",
    `Lost item details: ${JSON.stringify(payload)}`,
    `Deterministic Lochan reading: ${JSON.stringify(deterministic)}`,
    `Calculated chart: ${JSON.stringify({
      generated_at_local: chart.generatedAtLocal,
      city: `${chart.city.name}, ${chart.city.region}`,
      panchang_system: chart.panchangSystem?.label,
      lagna: `${chart.ascendant} ${chart.ascendantDegree} deg`,
      moon: `${chart.moonSign} ${chart.moonDegree} deg, ${chart.nakshatra} pada ${chart.nakshatraPada}`,
      planets: chart.planets.map((planet) => ({
        graha: planet.name,
        sign: planet.sign,
        rashi_house: planet.rashiHouse,
        bhava_house: planet.bhavaHouse,
        bhava_impact_percent: planet.bhavaImpactPercent,
        bhava_impact_state: planet.bhavaImpactState,
      })),
      factors: chart.prashnaFactors,
    })}`,
  ].join("\n")

export async function POST(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to use lost item Prashna." },
      { status: 401 }
    )
  }

  const payload = await request.json().catch(() => null)
  const itemName = sanitizeString(payload?.itemName, 140)
  const itemType = sanitizeString(payload?.itemType, 120)
  const ownerName = sanitizeString(payload?.ownerName, 120)
  const lastSeenPlace = sanitizeString(payload?.lastSeenPlace, 220)
  const lastSeenDate = sanitizeString(payload?.lastSeenDate, 20)
  const lastSeenTime = sanitizeString(payload?.lastSeenTime, 20)
  const notes = sanitizeString(payload?.notes, 500)
  const city = getCityById(sanitizeString(payload?.cityId, 80))
  const panchangSystemId = sanitizeString(payload?.panchangSystemId, 40)
  const questionDate = createDateFromLocalInput({
    date: sanitizeString(payload?.questionDate, 20),
    time: sanitizeString(payload?.questionTime, 20),
    city,
  })

  if (!itemName && !itemType) {
    return NextResponse.json(
      { message: "Enter the lost item name or item type." },
      { status: 400 }
    )
  }

  if (!lastSeenPlace) {
    return NextResponse.json(
      { message: "Enter the place where the item was last seen." },
      { status: 400 }
    )
  }

  const chart = (() => {
    try {
      return buildDetailedPrashnaChart({
        city,
        date: questionDate,
        panchangSystemId,
      })
    } catch (error) {
      console.error("Lost item chart calculation failed", error)
      return buildPrashnaChart({ city, date: questionDate })
    }
  })()
  const deterministic = buildDeterministicReading({
    chart,
    itemName,
    itemType,
    lastSeenPlace,
    notes,
  })
  const input = {
    itemName,
    itemType,
    ownerName,
    lastSeenPlace,
    lastSeenDate,
    lastSeenTime,
    notes,
    cityId: city.id,
    city: `${city.name}, ${city.region}`,
    panchangSystemId: chart.panchangSystem?.id || panchangSystemId,
  }

  if (!isGeminiEnabled()) {
    return NextResponse.json({
      chart,
      ...deterministic,
      ai_enhanced: false,
    })
  }

  const access = await checkAstrologyAccess()

  if (isAstrologyAccessBlocked(access)) {
    return NextResponse.json(
      {
        message:
          `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        chart,
        ...deterministic,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
      },
      { status: 429 }
    )
  }

  const gemini = await generateGeminiJson({
    prompt: buildPrompt({ deterministic, chart, payload: input }),
    responseSchema: LOST_ITEM_SCHEMA,
    temperature: 0.18,
    maxOutputTokens: 4096,
    label: "Lost Item Prashna API",
  })

  const parsed = gemini.ok ? gemini.parsed : null
  const result = {
    chart,
    lochan: deterministic.lochan,
    recoveryScore: deterministic.recoveryScore,
    answer: sanitizeString(parsed?.answer, 1200) || deterministic.answer,
    likely_location:
      sanitizeString(parsed?.likely_location, 700) || deterministic.likely_location,
    direction: sanitizeString(parsed?.direction, 240) || deterministic.direction,
    recovery_timing:
      sanitizeString(parsed?.recovery_timing, 500) || deterministic.recovery_timing,
    search_steps:
      sanitizeList(parsed?.search_steps, 8, 280).length > 0
        ? sanitizeList(parsed?.search_steps, 8, 280)
        : deterministic.search_steps,
    chart_reasoning:
      sanitizeList(parsed?.chart_reasoning, 8, 340).length > 0
        ? sanitizeList(parsed?.chart_reasoning, 8, 340)
        : deterministic.chart_reasoning,
    caution: sanitizeString(parsed?.caution, 500) || deterministic.caution,
    ai_enhanced: Boolean(gemini.ok),
    model: gemini.model,
    retryable: !gemini.ok,
  }

  const usage = await recordAiUsage({
    tool: "astrology_lost_item",
    input,
    response: result,
    metadata: {
      chart,
      customer_email: customer.email,
      usage_units: gemini.ok ? 1 : 0,
      billable: gemini.ok,
      failed_ai_generation: !gemini.ok,
      ...getAstrologyBillingMetadata(access),
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended: false,
    tags: gemini.ok ? ["nashta_vastu", "lochan"] : ["failed_ai_generation", "retryable"],
  })

  const credit = gemini.ok
    ? await consumeChargeableAstrologyCredit({
        access,
        tool: "astrology_lost_item",
        usageId: usage.synced ? usage.usage?.id : undefined,
      })
    : { charged: false, reason: "ai_generation_failed" }

  return NextResponse.json({
    ...result,
    usage_synced: usage.synced && access.quota.synced,
    credit,
    wallet: "wallet" in credit ? credit.wallet : access.wallet,
    quota: access.quota,
  })
}
