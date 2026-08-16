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

const PRASHNA_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    chart_summary: { type: "string" },
    direct_indication: { type: "string" },
    house_focus: { type: "string" },
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
    "sub_question_answers",
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

const splitQuestionParts = (question: string) => {
  const normalized = question
    .replace(/\b(first|second|third|fourth)\b/gi, "|$1")
    .replace(/\b(1st|2nd|3rd|4th)\b/gi, "|$1")
    .replace(/[?।]\s+/g, "?|")
  const parts = normalized
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length >= 8)

  return (parts.length > 1 ? parts : [question]).slice(0, 3)
}

const sanitizeSubQuestionAnswers = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item: any) => ({
          question: sanitizeString(item?.question, 240),
          answer: sanitizeString(item?.answer, 700),
          chart_reason: sanitizeString(item?.chart_reason, 500),
        }))
        .filter((item) => item.question && item.answer && item.chart_reason)
        .slice(0, 3)
    : []

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the answer in polished English.",
  hindi:
    "Write the answer in natural Hindi using Devanagari, keeping astrology terms understandable.",
  hinglish:
    "Write the answer in Roman Hindi/Hinglish using English alphabets only. Do not use Devanagari. Example style: 'aap ka prashna strong hai'. Keep common astrology terms like lagna, rashi, bhav, and upaay.",
}

const knowledgeTrace = (passages: RetrievedAstrologyPassage[]) =>
  passages.map((passage) => ({
    id: passage.id,
    citation: passage.citation,
    score: Number(passage.score.toFixed(4)),
    keywords: passage.keywords.slice(0, 8),
  }))

const retrievePrashnaKnowledgeSafely = (
  args: Parameters<typeof retrieveAstrologyKnowledge>[0]
) => {
  try {
    return retrieveAstrologyKnowledge(args)
  } catch (error) {
    console.error("Prashna RAG retrieval failed", error)
    return []
  }
}

const buildPrashnaDrishtiPromptPack = (chart: PrashnaChart) =>
  JSON.stringify(
    {
      instruction:
        "Use this deterministic drishti table for Prashna judgement. Answer the exact question using Lagna, Lagna lord, Moon, relevant house/lord, placed grahas, drishti, dignity and dasha.",
      graha_drishti: (chart.aspects || []).map((aspect) => ({
        from: `${aspect.fromPlanet} H${aspect.fromHouse} ${aspect.fromSign}`,
        to: `H${aspect.toHouse} ${aspect.toSign}`,
        type: aspect.aspectType,
        theme: aspect.theme,
        interpretation: aspect.interpretation,
      })),
      house_synthesis: (chart.houseSynthesis || []).map((house) => ({
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

const buildPrompt = ({
  question,
  questionParts,
  chart,
  language,
  knowledgePassages,
}: {
  question: string
  questionParts: string[]
  chart: PrashnaChart
  language: string
  knowledgePassages: RetrievedAstrologyPassage[]
}) =>
  [
    "You are Shreem Astrology's Prashna Kundli assistant.",
    "Focus sharply on the user's actual question and provide deep, pinpointed details using the chart and references. Avoid general or purely philosophical talk.",
    "Use deterministic_drishti_pack. Do not invent drishti. Judge each answer from Lagna, Lagna lord, Moon, relevant house/lord, placed grahas, drishti received, dignity, and dasha.",
    "Do not repeat the user's question as the answer. Start answer with a direct verdict: yes, no, likely, unlikely, delayed, mixed, or yes with conditions.",
    "Disclaimer: All insights are AI-generated based on astrological principles.",
    "Use only the calculated Prashna Kundli context and the user's question.",
    "Use the retrieved classical reference pack below to strengthen the answer, but keep Prashna tied to the exact question and do not quote the pack verbatim.",
    "When you use the reference pack, return book_citations with the exact Citation values and one-line relevance notes.",
    "Follow calculation-first discipline: Prashna Lagna, Moon, significator house, relevant lord, and timing signals must lead the answer.",
    "Use Rashi chart for sign dignity, graha ownership, and yogic condition. Use Bhava Chalit houses for practical house impact and likely real-world delivery. If rashi_house and bhava_house differ, say how the practical result changes.",
    "Bhava Chalit is calculated from Sripati bhava madhya and sandhi boundaries. For Prashna, bhava_impact_percent is critical: strong near-cusp planets give clearer delivery; sandhi/weak planets show uncertainty, delay, mixed answer, or changing circumstances.",
    "Interpret through traditional Vedic Prashna factors: lagna, lagna lord, Moon, relevant houses and house lords, tithi, nakshatra, yoga, karana, Rahu/Ketu, retrograde grahas, and Bhava Chalit shifts when relevant.",
    "If the user asks multiple parts, answer each part separately in sub_question_answers as first, second, and third. Do not merge them into one vague answer.",
    "Be critical: state yes/no/unclear when the chart supports it, then explain the conditions and timing. If the Prashna is weak or mixed, say mixed rather than forcing a positive answer.",
    "Keep the answer concise, realistic, and practical. Separate calculated chart facts from interpretation.",
    "Do not mix personal opinion, do not invent missing aspects, do not claim certainty, and do not prescribe gemstones without recommending a paid human consultation.",
    "If the question involves gemstones, pooja, marriage, medical matters, legal/financial risk, repeated blocks, strong dosha indications, or anything requiring detailed personal judgement, set expert_call_recommended true and recommend a call with Sanjay Kumar Pandey.",
    "For health, legal, financial, pregnancy, or emergency questions, keep the answer cautious and tell the user to consult a qualified professional.",
    "Never guarantee outcomes. Avoid fear-based language.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    "Return JSON only with the exact requested fields.",
    `Question: ${question}`,
    `Question parts to answer separately: ${JSON.stringify(questionParts)}`,
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
  const panchangSystemId = sanitizeString(
    (payload as { panchangSystemId?: unknown } | null)?.panchangSystemId,
    40
  )
  const questionMoment = createDateFromLocalInput({
    date: sanitizeString(
      (payload as { questionDate?: unknown } | null)?.questionDate,
      20
    ),
    time: sanitizeString(
      (payload as { questionTime?: unknown } | null)?.questionTime,
      20
    ),
    city,
  })
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

  const questionParts = splitQuestionParts(question)
  const chart = (() => {
    try {
      return buildDetailedPrashnaChart({
        city,
        date: questionMoment,
        panchangSystemId,
      })
    } catch (error) {
      console.error("Prashna chart calculation failed", error)
      return buildPrashnaChart({ city, date: questionMoment })
    }
  })()
  const prashnaFactors = Array.isArray(chart.prashnaFactors)
    ? chart.prashnaFactors
    : []
  const knowledgePassages = retrievePrashnaKnowledgeSafely({
    query: [
      "prashna kundli question answer classical lagna moon significator timing",
      question,
      prashnaFactors.join(" "),
      `${chart.ascendant} lagna ${chart.moonSign} moon ${chart.nakshatra}`,
      chart.planets
        .map(
          (planet) =>
            `${planet.name} ${planet.sign} house ${planet.house} ${planet.nakshatra}`
        )
        .join(" "),
    ].join(" "),
    chart,
    detectedCases: prashnaFactors,
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

  const access = await checkAstrologyAccess()

  if (isAstrologyAccessBlocked(access)) {
    return NextResponse.json(
      {
        message:
          `You have used your ${access.quota.limit} free astrology AI readings for today. Buy credits or upgrade to Premium to continue.`,
        chart,
        quota: access.quota,
        wallet: access.wallet,
        packs: access.packs,
      },
      { status: 429 }
    )
  }

  const gemini = await generateGeminiJson({
    prompt: buildPrompt({
      question,
      questionParts,
      chart,
      language,
      knowledgePassages,
    }),
    responseSchema: PRASHNA_SCHEMA,
    temperature: 0.16,
    label: "Prashna API",
  })

  if (!gemini.ok) {
    await recordAiUsage({
      tool: "astrology_prashna",
      input: {
        question,
        question_parts: questionParts,
        city_id: city.id,
        city: `${city.name}, ${city.region}`,
        question_moment_iso: questionMoment.toISOString(),
        question_moment_local: chart.generatedAtLocal,
        panchang_system_id: chart.panchangSystem?.id,
        language,
      },
      response: {
        message: "Prashna AI generation failed.",
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
        message:
          "Prashna AI could not answer right now. Please try again in a moment.",
        chart,
        retryable: true,
      },
      { status: 502 }
    )
  }

  const parsed = gemini.parsed

  const answer = sanitizeString(parsed?.answer, 1200)

  if (!answer) {
    return NextResponse.json(
      {
        message:
          "Prashna AI returned an empty answer. Please try again in a moment.",
        chart,
        retryable: true,
      },
      { status: 502 }
    )
  }

  const result = {
    chart,
    knowledge_references: getKnowledgeIds(knowledgePassages),
    answer,
    chart_summary: sanitizeString(parsed?.chart_summary, 700),
    direct_indication: sanitizeString(parsed?.direct_indication, 700),
    house_focus: sanitizeString(parsed?.house_focus, 500),
    sub_question_answers: sanitizeSubQuestionAnswers(
      parsed?.sub_question_answers
    ),
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
      question_parts: questionParts,
      city_id: city.id,
      city: `${city.name}, ${city.region}`,
      question_moment_iso: questionMoment.toISOString(),
      question_moment_local: chart.generatedAtLocal,
      panchang_system_id: chart.panchangSystem?.id,
      language,
    },
    response: result,
    metadata: {
      chart,
      customer_email: customer.email,
      usage_units: 1,
      ...getAstrologyBillingMetadata(access),
      panchangSystem: chart.panchangSystem,
      knowledge_references: getKnowledgeIds(knowledgePassages),
      knowledge_context: knowledgeTrace(knowledgePassages),
    },
    model: gemini.model,
    ...gemini.usage,
    provider: gemini.provider,
    attempts: gemini.attempts,
    attempt_logs: gemini.attempt_logs,
    expert_recommended: result.expert_call_recommended,
  })
  const credit = await consumeChargeableAstrologyCredit({
    access,
    tool: "astrology_prashna",
    usageId: usage.synced ? usage.usage?.id : undefined,
  })

  return NextResponse.json({
    ...result,
    usage_synced: usage.synced && access.quota.synced,
    credit,
    wallet: "wallet" in credit ? credit.wallet : access.wallet,
    quota: access.quota,
  })
}
