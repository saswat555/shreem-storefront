import "server-only"

import { getGeminiApiKey, getGeminiModel } from "./prakriti-config"

type GeminiGenerateOptions = {
  prompt: string
  responseSchema: unknown
  parts?: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  >
  temperature?: number
  timeoutMs?: number
  maxAttempts?: number
  maxOutputTokens?: number
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
  attempts?: number
  queuedMs?: number
}

const DEFAULT_TIMEOUT_MS = 90_000

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
    180_000
  )

const clampInteger = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Math.floor(Number(value))

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, min), max)
}

const getGeminiMaxAttempts = (override?: number) =>
  clampInteger(
    override ||
      process.env.ASTROLOGY_AI_MAX_ATTEMPTS ||
      process.env.GEMINI_MAX_ATTEMPTS,
    3,
    1,
    4
  )

const getGeminiConcurrency = () =>
  clampInteger(
    process.env.ASTROLOGY_AI_CONCURRENCY ||
      process.env.GEMINI_MAX_CONCURRENT_REQUESTS,
    3,
    1,
    10
  )

const getGeminiMaxOutputTokens = (override?: number) =>
  clampInteger(
    override ||
      process.env.ASTROLOGY_AI_MAX_OUTPUT_TOKENS ||
      process.env.GEMINI_MAX_OUTPUT_TOKENS,
    8192,
    1024,
    16384
  )

let activeGeminiRequests = 0
const geminiQueue: Array<() => void> = []

const waitForGeminiSlot = async () => {
  const startedAt = Date.now()

  if (activeGeminiRequests < getGeminiConcurrency()) {
    activeGeminiRequests += 1
    return () => {
      activeGeminiRequests = Math.max(0, activeGeminiRequests - 1)
      geminiQueue.shift()?.()
    }
  }

  await new Promise<void>((resolve) => {
    geminiQueue.push(() => {
      activeGeminiRequests += 1
      resolve()
    })
  })

  return () => {
    activeGeminiRequests = Math.max(0, activeGeminiRequests - 1)
    geminiQueue.shift()?.()
  }
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const shouldRetryGemini = ({
  status,
  timedOut,
  invalidJson,
  networkError,
}: {
  status?: number
  timedOut?: boolean
  invalidJson?: boolean
  networkError?: boolean
}) =>
  Boolean(
    timedOut ||
      networkError ||
      invalidJson ||
      status === 408 ||
      status === 409 ||
      status === 429 ||
      (status && status >= 500)
  )

const safeParseJson = (text: string) => {
  try {
    let cleanText = text.trim()
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith("```")) {
      const match = cleanText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
      if (match && match[1]) {
        cleanText = match[1]
      } else {
        // Fallback if the closing backticks are missing (truncated response)
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
      }
    }

    return JSON.parse(cleanText)
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
  parts = [],
  temperature = 0.22,
  timeoutMs = getAstrologyAiTimeoutMs(),
  maxAttempts,
  maxOutputTokens,
  label = "Gemini",
}: GeminiGenerateOptions): Promise<GeminiGenerateResult> => {
  const model = getGeminiModel().replace(/^models\//, "")
  const apiKey = getGeminiApiKey()
  const attempts = getGeminiMaxAttempts(maxAttempts)
  const limitTokens = getGeminiMaxOutputTokens(maxOutputTokens)
  const finalPrompt = `${prompt}\n\nIMPORTANT: Return one complete JSON object within ${limitTokens} output tokens. Keep rows concise but finished. Do not trail off, do not end strings mid-sentence, and prefer fewer complete rows over an incomplete response.`
  const requestParts = [{ text: finalPrompt }, ...parts]
  const queuedAt = Date.now()
  const releaseSlot = await waitForGeminiSlot()
  const queuedMs = Date.now() - queuedAt
  let lastResult: GeminiGenerateResult | null = null

  try {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
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
                parts: requestParts,
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: limitTokens,
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

        const timedOut =
          fetchError instanceof Error && fetchError.name === "AbortError"
        const errorMessage =
          fetchError instanceof Error
            ? fetchError.message
            : errorDetails || "No response from Gemini"

        lastResult = {
          ok: false,
          parsed: null,
          text: "",
          model,
          usage: emptyGeminiUsage(),
          status: response?.status,
          statusText: response?.statusText,
          error: errorMessage,
          timedOut,
          attempts: attempt,
          queuedMs,
        }

        console.error(`[${label}] Gemini generation failed`, {
          attempt,
          attempts,
          queuedMs,
          status: response?.status,
          statusText: response?.statusText,
          error: errorMessage,
        })

        if (
          attempt < attempts &&
          shouldRetryGemini({
            status: response?.status,
            timedOut,
            networkError: !response,
          })
        ) {
          await sleep(700 * attempt)
          continue
        }

        return lastResult
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim()
      const parsed = safeParseJson(text || "")

      if (!parsed) {
        lastResult = {
          ok: false,
          parsed: null,
          text: text || "",
          model,
          usage: normalizeGeminiUsage(data.usageMetadata, model),
          status: response.status,
          statusText: response.statusText,
          error: "invalid_json",
          attempts: attempt,
          queuedMs,
        }

        console.error(`[${label}] Gemini returned invalid JSON`, {
          attempt,
          attempts,
          model,
          queuedMs,
          textPreview: (text || "").slice(0, 500),
        })

        if (
          attempt < attempts &&
          shouldRetryGemini({ status: response.status, invalidJson: true })
        ) {
          await sleep(700 * attempt)
          continue
        }

        return lastResult
      }

      return {
        ok: true,
        parsed,
        text: text || "",
        model,
        usage: normalizeGeminiUsage(data.usageMetadata, model),
        status: response.status,
        statusText: response.statusText,
        attempts: attempt,
        queuedMs,
      }
    }
  } finally {
    releaseSlot()
  }

  return (
    lastResult || {
      ok: false,
      parsed: null,
      text: "",
      model,
      usage: emptyGeminiUsage(),
      error: "No response from Gemini",
      attempts,
      queuedMs,
    }
  )
}
