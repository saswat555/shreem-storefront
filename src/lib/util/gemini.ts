import "server-only"

import {
  getGeminiApiKey,
  getGeminiModel,
  normalizeGeminiModel,
} from "./prakriti-config"

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
  thinkingBudget?: number
  label?: string
  model?: string
}

export type GeminiUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cached_prompt_tokens?: number
  thoughts_tokens?: number
  estimated_cost_usd: number
  estimated_cost_inr: number
}

export type GeminiGenerateResult = {
  ok: boolean
  parsed: any
  text: string
  model: string
  provider?: "gemini" | "ollama"
  usage: GeminiUsage
  status?: number
  statusText?: string
  error?: string
  timedOut?: boolean
  attempts?: number
  attempt_logs?: GeminiAttemptLog[]
  queuedMs?: number
}

export type GeminiAttemptLog = {
  provider: "gemini" | "ollama"
  model: string
  attempt: number
  status?: number
  statusText?: string
  ok: boolean
  error?: string
  timedOut?: boolean
  invalidJson?: boolean
  finishReason?: string
  durationMs: number
  usage?: GeminiUsage
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

const splitCsv = (value?: string) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/^models\//, ""))
    .filter(Boolean)

const getGeminiModelFallbacks = (primaryModel: string) => {
  const configured = splitCsv(
    process.env.ASTROLOGY_AI_MODEL_FALLBACKS ||
      process.env.GEMINI_MODEL_FALLBACKS
  )
  const defaultLadder = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash",
  ]
  const defaults = configured.length
    ? [...configured, ...defaultLadder]
    : defaultLadder

  return Array.from(new Set([primaryModel, ...defaults])).filter(
    (model) => !model.startsWith("gemini-2.0")
  )
}

const canUseOllamaForFrontendAi = () =>
  Boolean(process.env.OLLAMA_URL) &&
  process.env.ALLOW_OLLAMA_FOR_ASTROLOGY === "true"

const getBackoffMs = (attempt: number, modelIndex: number) =>
  Math.min(6000, 650 * attempt + 850 * modelIndex + Math.floor(Math.random() * 350))

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

const shouldAdvanceModelImmediately = ({
  status,
  error,
  hasNextModel,
  provider,
}: {
  status?: number
  error?: string
  hasNextModel: boolean
  provider: "gemini" | "ollama"
}) => {
  if (provider !== "gemini" || !hasNextModel) {
    return false
  }

  return Boolean(
    status === 503 ||
      status === 404 ||
      status === 400 ||
      /UNAVAILABLE|high demand|temporar(?:y|ily).*unavailable|model.*overloaded|server overloaded/i.test(
        error || ""
      ) ||
      /not found|not supported|unsupported|model .*not available|model .*not found/i.test(
        error || ""
      )
  )
}

const safeParseJson = (text: string) => {
  try {
    let cleanText = text.trim()
    
    // Remove reasoning tags (like DeepSeek <think> blocks) if present
    cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, "")
    // Remove unclosed reasoning tags just in case
    cleanText = cleanText.replace(/<think>[\s\S]*$/gi, "")
    cleanText = cleanText.trim()

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

  if (!normalizedModel.includes("gemini")) {
    return { input: 0, output: 0, cachedInput: 0 }
  }

  if (normalizedModel.includes("3.1-flash-lite")) {
    return { input: 0.25, output: 1.5, cachedInput: 0.025 }
  }

  if (normalizedModel.includes("3.5-flash")) {
    return { input: 1.5, output: 9, cachedInput: 0.15 }
  }

  if (normalizedModel.includes("3-flash") || normalizedModel.includes("3.0-flash")) {
    return { input: 0.5, output: 3, cachedInput: 0.05 }
  }

  if (normalizedModel.includes("2.5-pro")) {
    return promptTokens > 200_000
      ? { input: 2.5, output: 15, cachedInput: 0.25 }
      : { input: 1.25, output: 10, cachedInput: 0.125 }
  }

  if (normalizedModel.includes("2.5-flash-lite")) {
    return { input: 0.1, output: 0.4, cachedInput: 0.01 }
  }

  if (normalizedModel.includes("2.5-flash")) {
    return { input: 0.3, output: 2.5, cachedInput: 0.03 }
  }

  if (normalizedModel.includes("2.0-flash-lite")) {
    return { input: 0.075, output: 0.3, cachedInput: 0.0075 }
  }

  if (normalizedModel.includes("2.0-flash")) {
    return { input: 0.1, output: 0.4, cachedInput: 0.01 }
  }

  return { input: 0.3, output: 2.5, cachedInput: 0.03 }
}

const estimateGeminiCost = ({
  promptTokens,
  completionTokens,
  cachedPromptTokens = 0,
  model,
}: {
  promptTokens: number
  completionTokens: number
  cachedPromptTokens?: number
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
  const cachedInputRate = parsePositiveNumber(
    process.env.GEMINI_CACHED_INPUT_COST_PER_1M_TOKENS ||
      process.env.AI_CACHED_INPUT_COST_PER_1M_TOKENS,
    defaults.cachedInput
  )
  const usdToInr = parsePositiveNumber(
    process.env.GOOGLE_AI_BILLING_USD_TO_INR ||
      process.env.AI_USD_TO_INR ||
      process.env.USD_TO_INR,
    94.55
  )
  const cachedTokens = Math.max(0, Math.floor(cachedPromptTokens))
  const billablePromptTokens = Math.max(0, promptTokens - cachedTokens)

  const usd =
    (billablePromptTokens / 1_000_000) * inputRate +
    (cachedTokens / 1_000_000) * cachedInputRate +
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
  const cachedPromptTokens = Math.max(
    0,
    Math.floor(
      Number(
        usageMetadata?.cachedContentTokenCount ||
          usageMetadata?.cachedPromptTokenCount ||
          0
      )
    )
  )
  const thoughtsTokens = Math.max(
    0,
    Math.floor(Number(usageMetadata?.thoughtsTokenCount || 0))
  )
  const totalTokens = Math.max(
    promptTokens + completionTokens,
    Math.floor(Number(usageMetadata?.totalTokenCount || 0))
  )

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    cached_prompt_tokens: cachedPromptTokens,
    thoughts_tokens: thoughtsTokens,
    total_tokens: totalTokens,
    ...estimateGeminiCost({
      promptTokens,
      completionTokens: completionTokens + thoughtsTokens,
      cachedPromptTokens,
      model,
    }),
  }
}

export const emptyGeminiUsage = (): GeminiUsage => ({
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  cached_prompt_tokens: 0,
  thoughts_tokens: 0,
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
  thinkingBudget = 0,
  label = "Gemini",
  model: modelOverride,
}: GeminiGenerateOptions): Promise<GeminiGenerateResult> => {
  const model = normalizeGeminiModel(modelOverride || getGeminiModel())
  const apiKey = getGeminiApiKey()
  const attempts = getGeminiMaxAttempts(maxAttempts)
  const limitTokens = getGeminiMaxOutputTokens(maxOutputTokens)
  const finalPrompt = `${prompt}\n\nIMPORTANT: Return one complete JSON object within ${limitTokens} output tokens. Keep rows concise but finished. Do not trail off, do not end strings mid-sentence, and prefer fewer complete rows over an incomplete response.`
  const requestParts = [{ text: finalPrompt }, ...parts]
  const queuedAt = Date.now()
  const releaseSlot = await waitForGeminiSlot()
  const queuedMs = Date.now() - queuedAt
  let lastResult: GeminiGenerateResult | null = null
  const attemptLogs: GeminiAttemptLog[] = []

  const ollamaUrl = process.env.OLLAMA_URL
  const isOllama = canUseOllamaForFrontendAi()
  const actualModel = isOllama ? (process.env.OLLAMA_MODEL || "deepseek-r1:1.5b") : model
  const provider: "gemini" | "ollama" = isOllama ? "ollama" : "gemini"
  const modelsToTry = isOllama ? [actualModel] : getGeminiModelFallbacks(model)
  let totalAttempts = 0

  try {
    for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex += 1) {
      const currentModel = modelsToTry[modelIndex]

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        totalAttempts += 1
        const startedAt = Date.now()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        let fetchError: unknown = null
        let response: Response | null = null

        if (isOllama) {
          const fullPromptText = requestParts
            .map((part) => ("text" in part ? part.text : ""))
            .join("\n")

          response = await fetch(`${ollamaUrl}/api/generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: currentModel,
              prompt: fullPromptText,
              stream: false,
              format: "json",
              options: {
                temperature,
                num_predict: limitTokens,
                num_ctx: Math.max(
                  8192,
                  limitTokens + 1024 + Math.ceil(fullPromptText.length / 3)
                ),
              },
            }),
          }).catch((error) => {
            fetchError = error
            return null
          })
        } else {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
              currentModel
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
                  ...(currentModel.includes("2.5")
                    ? { thinkingConfig: { thinkingBudget } }
                    : {}),
                },
              }),
            }
          ).catch((error) => {
            fetchError = error
            return null
          })
        }

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
              : errorDetails || `No response from ${isOllama ? "Ollama" : "Gemini"}`
          const retryable = shouldRetryGemini({
            status: response?.status,
            timedOut,
            networkError: !response,
          })
          const advanceModelNow = shouldAdvanceModelImmediately({
            status: response?.status,
            error: errorMessage,
            hasNextModel: modelIndex < modelsToTry.length - 1,
            provider,
          })

          attemptLogs.push({
            provider,
            model: currentModel,
            attempt,
            status: response?.status,
            statusText: response?.statusText,
            ok: false,
            error: errorMessage,
            timedOut,
            durationMs: Date.now() - startedAt,
            usage: emptyGeminiUsage(),
          })

          lastResult = {
            ok: false,
            parsed: null,
            text: "",
            model: currentModel,
            provider,
            usage: emptyGeminiUsage(),
            status: response?.status,
            statusText: response?.statusText,
            error: errorMessage,
            timedOut,
            attempts: totalAttempts,
            attempt_logs: attemptLogs,
            queuedMs,
          }

          const willRetry =
            retryable &&
            (advanceModelNow || attempt < attempts || modelIndex < modelsToTry.length - 1)
          const logGenerationIssue = willRetry ? console.log : console.error

          logGenerationIssue(`[${label}] Gemini generation ${willRetry ? "retrying" : "failed"}`, {
            attempt,
            attempts,
            model: currentModel,
            modelIndex,
            nextModel: advanceModelNow ? modelsToTry[modelIndex + 1] : undefined,
            advanceModelNow,
            queuedMs,
            status: response?.status,
            statusText: response?.statusText,
            retryable,
            error: errorMessage,
          })

          if (willRetry) {
            await sleep(getBackoffMs(attempt, modelIndex))
            if (advanceModelNow) {
              break
            }
            continue
          }

          return lastResult
        }

        const data = await response.json()

        let text = ""
        let rawUsage: any = null

        if (isOllama) {
          text = data.response || ""
          rawUsage = {
            promptTokenCount: data.prompt_eval_count || 0,
            candidatesTokenCount: data.eval_count || 0,
          }
        } else {
          text = data.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text || "")
            .join("")
            .trim() || ""
          rawUsage = data.usageMetadata
        }

        const usage = normalizeGeminiUsage(rawUsage, currentModel)
        const parsed = safeParseJson(text)
        const finishReason = isOllama
          ? undefined
          : String(data.candidates?.[0]?.finishReason || "") || undefined

        if (!parsed) {
          const retryable = shouldRetryGemini({
            status: response.status,
            invalidJson: false,
          })

          attemptLogs.push({
            provider,
            model: currentModel,
            attempt,
            status: response.status,
            statusText: response.statusText,
            ok: false,
            error: "invalid_json",
            invalidJson: true,
            finishReason,
            durationMs: Date.now() - startedAt,
            usage,
          })

          lastResult = {
            ok: false,
            parsed: null,
            text: text || "",
            model: currentModel,
            provider,
            usage,
            status: response.status,
            statusText: response.statusText,
            error: "invalid_json",
            attempts: totalAttempts,
            attempt_logs: attemptLogs,
            queuedMs,
          }

          console.error(`[${label}] ${isOllama ? "Ollama" : "Gemini"} returned invalid JSON`, {
            attempt,
            attempts,
            model: currentModel,
            modelIndex,
            queuedMs,
            retryable,
            finishReason,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            thoughtsTokens: usage.thoughts_tokens,
            textPreview: (text || "").slice(0, 500),
          })

          if (retryable && (attempt < attempts || modelIndex < modelsToTry.length - 1)) {
            await sleep(getBackoffMs(attempt, modelIndex))
            continue
          }

          return lastResult
        }

        const successLog: GeminiAttemptLog = {
          provider,
          model: currentModel,
          attempt,
          status: response.status,
          statusText: response.statusText,
          ok: true,
          finishReason,
          durationMs: Date.now() - startedAt,
          usage,
        }

        return {
          ok: true,
          parsed,
          text: text || "",
          model: currentModel,
          provider,
          usage,
          status: response.status,
          statusText: response.statusText,
          attempts: totalAttempts,
          attempt_logs: [...attemptLogs, successLog],
          queuedMs,
        }
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
      model: actualModel,
      provider,
      usage: emptyGeminiUsage(),
      error: `No response from ${isOllama ? "Ollama" : "Gemini"}`,
      attempts: totalAttempts || attempts,
      attempt_logs: attemptLogs,
      queuedMs,
    }
  )
}
