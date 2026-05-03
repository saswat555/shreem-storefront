export const getPrakritiGuideModel = () =>
  process.env.OPENAI_MODEL || "gpt-4o-mini"

export const isPrakritiGuideEnabled = () => Boolean(process.env.OPENAI_API_KEY)
