export const GEMINI_25_FLASH_MODEL = "gemini-2.5-flash"

const GEMINI_FLASH_ALIASES = new Set([
  "2.5-flash",
  "flash-latest",
  "gemini-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-latest",
  "gemini-2.5-flash-latest",
  "models/gemini-flash-latest",
])

export const normalizeGeminiModel = (value?: string | null) => {
  const raw = (value || "").trim()

  if (!raw) {
    return GEMINI_25_FLASH_MODEL
  }

  const normalized = raw.toLowerCase().replace(/^models\//, "")

  if (GEMINI_FLASH_ALIASES.has(normalized)) {
    return GEMINI_25_FLASH_MODEL
  }

  return normalized
}

export const getGeminiModel = () =>
  normalizeGeminiModel(process.env.GEMINI_MODEL)

export const getGeminiApiKey = () =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""

export const isGeminiEnabled = () => Boolean(getGeminiApiKey())

export const getPrakritiGuideModel = getGeminiModel

export const getPrakritiGuideApiKey = getGeminiApiKey

export const isPrakritiGuideEnabled = isGeminiEnabled
