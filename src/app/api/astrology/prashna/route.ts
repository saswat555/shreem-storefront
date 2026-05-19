import { NextRequest, NextResponse } from "next/server"

import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import {
  buildPrashnaChart,
  getCityById,
  type PrashnaChart,
} from "@lib/util/astrology"
import {
  formatAstrologyKnowledgeForPrompt,
  getKnowledgeIds,
  retrieveAstrologyKnowledge,
  type RetrievedAstrologyPassage,
} from "@lib/util/astrology-knowledge"
import { checkAstrologyDailyQuota } from "@lib/util/ai-quota"
import { generateGeminiJson } from "@lib/util/gemini"
import { buildDetailedPrashnaChart } from "@lib/util/vedic-astrology"
import { isGeminiEnabled } from "@lib/util/prakriti-config"

const PRASHNA_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    chart_summary: { type: "string" },
    direct_indication: { type: "string" },
    house_focus: { type: "string" },
    expert_call_recommended: { type: "boolean" },
    expert_call_reason: { type: "string" },
    recommended_service: { type: "string" },
    key_chart_factors: {
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
    favorable_timing: { type: "string" },
    caution: { type: "string" },
    next_step: { type: "string" },
  },
  required: [
    "answer",
    "chart_summary",
    "direct_indication",
    "house_focus",
    "expert_call_recommended",
    "expert_call_reason",
    "recommended_service",
    "key_chart_factors",
    "book_citations",
    "favorable_timing",
    "caution",
    "next_step",
  ],
} as const

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

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

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the answer in polished English.",
  hindi:
    "Write the answer in natural Hindi using Devanagari, keeping astrology terms understandable.",
  hinglish:
    "Write the answer in friendly Hinglish with common astrology terms like lagna, rashi, bhav, and upaay.",
}

const buildPrompt = ({
  question,
  chart,
  language,
  knowledgePassages,
}: {
  question: string
  chart: PrashnaChart
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  [
    "You are Shreem Astrology's Prashna Kundli assistant.",
    "Use only the calculated Prashna Kundli context and the user's question.",
    "Use the retrieved classical reference pack below to strengthen the answer, but keep Prashna tied to the exact question and do not quote the pack verbatim.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Follow calculation-first discipline: Prashna Lagna, Moon, significator house, relevant lord, and timing signals must lead the answer.",
    "Interpret through traditional Vedic Prashna factors: lagna, lagna lord, Moon, relevant houses, tithi, nakshatra, yoga, karana, Rahu/Ketu, and retrograde grahas when relevant.",
    "Keep the answer concise, realistic, and practical. Separate calculated chart facts from interpretation.",
    "Do not mix personal opinion, do not invent missing aspects, do not claim certainty, and do not prescribe gemstones without recommending a paid human consultation.",
    "If the question involves gemstones, pooja, marriage, medical matters, legal/financial risk, repeated blocks, strong dosha indications, or anything requiring detailed personal judgement, set expert_call_recommended true and recommend a call with Sanjay Kumar Pandey.",
    "For health, legal, financial, pregnancy, or emergency questions, keep the answer cautious and tell the user to consult a qualified professional.",
    "Never guarantee outcomes. Avoid fear-based language.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only with the exact requested fields.",
    `Question: ${question}`,
    `Retrieved classical reference pack: ${formatAstrologyKnowledgeForPrompt(
      knowledgePassages
    )}`,
    `Calculated Prashna Kundli context: ${JSON.stringify({
      generated_at: chart.generatedAtIso,
      generated_at_local: chart.generatedAtLocal,
      city: `${chart.city.name}, ${chart.city.region}`,
      system: chart.calculationSystem,
      ayanamsa: chart.ayanamsa,
      weekday: chart.weekday,
      lagna: {
        sign: chart.ascendant,
        degree: chart.ascendantDegree,
        absolute_longitude: chart.ascendantLongitude,
        nakshatra: chart.ascendantNakshatra,
        pada: chart.ascendantPada,
      },
      sun: {
        sign: chart.sunSign,
        degree: chart.sunDegree,
        absolute_longitude: chart.sunLongitude,
      },
      moon: {
        sign: chart.moonSign,
        degree: chart.moonDegree,
        absolute_longitude: chart.moonLongitude,
        nakshatra: chart.nakshatra,
        pada: chart.nakshatraPada,
      },
      tithi: chart.tithi,
      paksha: chart.paksha,
      yoga: chart.yoga,
      karana: chart.karana,
      planets: chart.planets.map((planet) => ({
        graha: planet.name,
        sign: planet.sign,
        degree: planet.signDegree,
        house: planet.house,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        retrograde: Boolean(planet.retrograde),
      })),
      houses: chart.houses,
      prashna_factors: chart.prashnaFactors,
    })}`,
  ].join("\n")

export async function POST(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to use Prashna Kundli." },
      { status: 401 }
    )
  }

  const payload = await request.json().catch(() => null)
  const question = sanitizeString(
    (payload as { question?: unknown } | null)?.question,
    700
  )
  const city = getCityById(
    sanitizeString((payload as { cityId?: unknown } | null)?.cityId, 80)
  )
  const rawLanguage = sanitizeString(
    (payload as { language?: unknown } | null)?.language,
    20
  )
  const language =
    rawLanguage === "hindi" || rawLanguage === "hinglish"
      ? rawLanguage
      : "english"

  if (question.length < 8) {
    return NextResponse.json(
      { message: "Ask a clear question with at least a few words." },
      { status: 400 }
    )
  }

  const chart = (() => {
    try {
      return buildDetailedPrashnaChart({ city })
    } catch (error) {
      console.error("Prashna chart calculation failed", error)
      return buildPrashnaChart({ city })
    }
  })()
  const knowledgePassages = retrieveAstrologyKnowledge({
    query: [
      "prashna kundli question answer classical lagna moon significator timing",
      question,
      chart.prashnaFactors.join(" "),
      `${chart.ascendant} lagna ${chart.moonSign} moon ${chart.nakshatra}`,
      chart.planets
        .map(
          (planet) =>
            `${planet.name} ${planet.sign} house ${planet.house} ${planet.nakshatra}`
        )
        .join(" "),
    ].join(" "),
    chart,
    detectedCases: chart.prashnaFactors,
    min: 3,
    max: 6,
  })

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        message:
          "Prashna AI is not enabled on this server yet. Add GEMINI_API_KEY to enable it.",
        chart,
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
        quota,
      },
      { status: 429 }
    )
  }

  const gemini = await generateGeminiJson({
    prompt: buildPrompt({ question, chart, language, knowledgePassages }),
    responseSchema: PRASHNA_SCHEMA,
    temperature: 0.25,
    label: "Prashna API",
  })

  if (!gemini.ok) {
    return NextResponse.json(
      {
        message:
          "Prashna AI could not answer right now. Please try again in a moment.",
        chart,
        retryable: true,
      },
      { status: 502 }
    )
  }

  const parsed = gemini.parsed

  const result = {
    chart,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    answer: sanitizeString(parsed?.answer, 1200),
    chart_summary: sanitizeString(parsed?.chart_summary, 700),
    direct_indication: sanitizeString(parsed?.direct_indication, 700),
    house_focus: sanitizeString(parsed?.house_focus, 500),
    expert_call_recommended: Boolean(parsed?.expert_call_recommended),
    expert_call_reason: sanitizeString(parsed?.expert_call_reason, 500),
    recommended_service:
      sanitizeString(parsed?.recommended_service, 160) ||
      "Book a call with Sanjay Kumar Pandey",
    key_chart_factors: Array.isArray(parsed?.key_chart_factors)
      ? parsed.key_chart_factors
          .map((item: unknown) => sanitizeString(item, 180))
          .filter(Boolean)
          .slice(0, 6)
      : chart.prashnaFactors.slice(0, 4),
    book_citations: sanitizeBookCitations(parsed?.book_citations),
    favorable_timing: sanitizeString(parsed?.favorable_timing, 500),
    caution: sanitizeString(parsed?.caution, 500),
    next_step: sanitizeString(parsed?.next_step, 500),
    model: gemini.model,
  }

  const usage = await recordAiUsage({
    tool: "astrology_prashna",
    input: {
      question,
      city_id: city.id,
      city: `${city.name}, ${city.region}`,
      language,
    },
    response: result,
    metadata: {
      chart,
      customer_email: customer.email,
      knowledge_references: getKnowledgeIds(knowledgePassages),
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended: result.expert_call_recommended,
  })

  return NextResponse.json({
    ...result,
    usage_synced: usage.synced,
  })
}
