import "server-only"

import { getGeminiApiKey, getGeminiModel } from "./prakriti-config"

type GeminiGenerateOptions = {
  prompt: string
  responseSchema: unknown
  temperature?: number
  timeoutMs?: number
  label?: string
}

export type GeminiUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  estimated_cost_inr: number
}

export type GeminiGenerateResult = {
  ok: boolean
  parsed: any
  text: string
  model: string
  usage: GeminiUsage
  status?: number
  statusText?: string
  error?: string
  timedOut?: boolean
}

const DEFAULT_TIMEOUT_MS = 60_000

const parsePositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const getAstrologyAiTimeoutMs = () =>
  Math.min(
    parsePositiveNumber(
      process.env.ASTROLOGY_AI_TIMEOUT_MS ||
        process.env.GEMINI_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS
    ),
    120_000
  )

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const getDefaultGeminiRates = (model: string, promptTokens: number) => {
  const normalizedModel = model.toLowerCase()

  if (normalizedModel.includes("2.5-pro")) {
    return promptTokens > 200_000
      ? { input: 2.5, output: 15 }
      : { input: 1.25, output: 10 }
  }

  if (normalizedModel.includes("2.5-flash-lite")) {
    return { input: 0.1, output: 0.4 }
  }

  if (normalizedModel.includes("2.0-flash-lite")) {
    return { input: 0.075, output: 0.3 }
  }

  if (normalizedModel.includes("2.0-flash")) {
    return { input: 0.1, output: 0.4 }
  }

  return { input: 0.3, output: 2.5 }
}

const estimateGeminiCost = ({
  promptTokens,
  completionTokens,
  model,
}: {
  promptTokens: number
  completionTokens: number
  model: string
}) => {
  const defaults = getDefaultGeminiRates(model, promptTokens)
  const inputRate = parsePositiveNumber(
    process.env.GEMINI_INPUT_COST_PER_1M_TOKENS ||
      process.env.AI_INPUT_COST_PER_1M_TOKENS,
    defaults.input
  )
  const outputRate = parsePositiveNumber(
    process.env.GEMINI_OUTPUT_COST_PER_1M_TOKENS ||
      process.env.AI_OUTPUT_COST_PER_1M_TOKENS,
    defaults.output
  )
  const usdToInr = parsePositiveNumber(
    process.env.AI_USD_TO_INR || process.env.USD_TO_INR,
    85
  )

  const usd =
    (promptTokens / 1_000_000) * inputRate +
    (completionTokens / 1_000_000) * outputRate

  return {
    estimated_cost_usd: Number(usd.toFixed(6)),
    estimated_cost_inr: Number((usd * usdToInr).toFixed(4)),
  }
}

export const normalizeGeminiUsage = (
  usageMetadata: any,
  model = getGeminiModel().replace(/^models\//, "")
): GeminiUsage => {
  const promptTokens = Math.max(
    0,
    Math.floor(Number(usageMetadata?.promptTokenCount || 0))
  )
  const completionTokens = Math.max(
    0,
    Math.floor(
      Number(
        usageMetadata?.candidatesTokenCount ||
          usageMetadata?.completionTokenCount ||
          0
      )
    )
  )
  const totalTokens = Math.max(
    promptTokens + completionTokens,
    Math.floor(Number(usageMetadata?.totalTokenCount || 0))
  )

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    ...estimateGeminiCost({
      promptTokens,
      completionTokens,
      model,
    }),
  }
}

export const emptyGeminiUsage = (): GeminiUsage => ({
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  estimated_cost_usd: 0,
  estimated_cost_inr: 0,
})

export const generateGeminiJson = async ({
  prompt,
  responseSchema,
  temperature = 0.22,
  timeoutMs = getAstrologyAiTimeoutMs(),
  label = "Gemini",
}: GeminiGenerateOptions): Promise<GeminiGenerateResult> => {
  const model = getGeminiModel().replace(/^models\//, "")
  const apiKey = getGeminiApiKey()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let fetchError: unknown = null

  const response = await fetch(
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
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    }
  ).catch((error) => {
    fetchError = error
    return null
  })

  clearTimeout(timeout)

  if (!response || !response.ok) {
    let errorDetails = ""

    if (response) {
      try {
        errorDetails = await response.text()
      } catch {
        errorDetails = "Could not read error response body"
      }
    }

    const errorMessage =
      fetchError instanceof Error
        ? fetchError.message
        : errorDetails || "No response from Gemini"

    console.error(`[${label}] Gemini generation failed`, {
      status: response?.status,
      statusText: response?.statusText,
      error: errorMessage,
    })

    return {
      ok: false,
      parsed: null,
      text: "",
      model,
      usage: emptyGeminiUsage(),
      status: response?.status,
      statusText: response?.statusText,
      error: errorMessage,
      timedOut:
        fetchError instanceof Error && fetchError.name === "AbortError",
    }
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim()
  const parsed = safeParseJson(text || "")

  if (!parsed) {
    console.error(`[${label}] Gemini returned invalid JSON`, {
      model,
      textPreview: (text || "").slice(0, 500),
    })
  }

  return {
    ok: Boolean(parsed),
    parsed,
    text: text || "",
    model,
    usage: normalizeGeminiUsage(data.usageMetadata, model),
    status: response.status,
    statusText: response.statusText,
    error: parsed ? undefined : "invalid_json",
  }
}
