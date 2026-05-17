import { NextRequest, NextResponse } from "next/server"

import { buildPrashnaChart, getCityById } from "@lib/util/astrology"
import { buildDetailedPrashnaChart } from "@lib/util/vedic-astrology"
import {
  getGeminiApiKey,
  getGeminiModel,
  isGeminiEnabled,
} from "@lib/util/prakriti-config"

const PRASHNA_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    chart_summary: { type: "string" },
    direct_indication: { type: "string" },
    house_focus: { type: "string" },
    key_chart_factors: {
      type: "array",
      items: { type: "string" },
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
    "key_chart_factors",
    "favorable_timing",
    "caution",
    "next_step",
  ],
} as const

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const buildPrompt = ({
  question,
  chart,
}: {
  question: string
  chart: ReturnType<typeof buildDetailedPrashnaChart>
}) =>
  [
    "You are Shreem Astrology's Prashna Kundli assistant.",
    "Use only the calculated Prashna Kundli context and the user's question.",
    "Interpret through traditional Vedic Prashna factors: lagna, lagna lord, Moon, relevant houses, tithi, nakshatra, yoga, karana, Rahu/Ketu, and retrograde grahas when relevant.",
    "Keep the answer concise, realistic, and practical. Separate calculated chart facts from interpretation.",
    "Do not mix personal opinion, do not invent missing aspects, do not claim certainty, and do not prescribe gemstones without recommending a paid human consultation.",
    "For health, legal, financial, pregnancy, or emergency questions, keep the answer cautious and tell the user to consult a qualified professional.",
    "Never guarantee outcomes. Avoid fear-based language.",
    "Return JSON only with the exact requested fields.",
    `Question: ${question}`,
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
  const payload = await request.json().catch(() => null)
  const question = sanitizeString(
    (payload as { question?: unknown } | null)?.question,
    700
  )
  const city = getCityById(
    sanitizeString((payload as { cityId?: unknown } | null)?.cityId, 80)
  )

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

  const model = getGeminiModel().replace(/^models\//, "")
  const apiKey = getGeminiApiKey()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildPrompt({ question, chart }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseSchema: PRASHNA_SCHEMA,
        },
      }),
    }
  ).catch(() => null)
  clearTimeout(timeout)

  if (!geminiResponse || !geminiResponse.ok) {
    return NextResponse.json(
      {
        message:
          "Prashna AI could not answer right now. Please try again in a moment.",
        chart,
      },
      { status: 502 }
    )
  }

  const data = await geminiResponse.json()
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim()
  const parsed = safeParseJson(text || "")

  return NextResponse.json({
    chart,
    answer: sanitizeString(parsed?.answer, 1200),
    chart_summary: sanitizeString(parsed?.chart_summary, 700),
    direct_indication: sanitizeString(parsed?.direct_indication, 700),
    house_focus: sanitizeString(parsed?.house_focus, 500),
    key_chart_factors: Array.isArray(parsed?.key_chart_factors)
      ? parsed.key_chart_factors
          .map((item: unknown) => sanitizeString(item, 180))
          .filter(Boolean)
          .slice(0, 6)
      : chart.prashnaFactors.slice(0, 4),
    favorable_timing: sanitizeString(parsed?.favorable_timing, 500),
    caution: sanitizeString(parsed?.caution, 500),
    next_step: sanitizeString(parsed?.next_step, 500),
    model,
  })
}
