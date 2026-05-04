export const getGeminiModel = () =>
  process.env.GEMINI_MODEL || "gemini-2.5-flash"

export const getGeminiApiKey = () =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""

export const isGeminiEnabled = () => Boolean(getGeminiApiKey())

export const getPrakritiGuideModel = getGeminiModel

export const getPrakritiGuideApiKey = getGeminiApiKey

export const isPrakritiGuideEnabled = isGeminiEnabled
