import "server-only"

import { listAiUsage } from "@lib/data/ai-usage"

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export const getDailyAiLimit = () => {
  const parsed = Number(
    process.env.ASTROLOGY_AI_DAILY_LIMIT ||
      process.env.AI_DAILY_LIMIT ||
      3
  )

  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(Math.floor(parsed), 20)
    : 3
}

export const getIstDayWindow = (now = new Date()) => {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS)
  const startIst = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
    0,
    0,
    0,
    0
  )
  const start = new Date(startIst - IST_OFFSET_MS)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

export const checkAstrologyDailyQuota = async () => {
  const limit = getDailyAiLimit()
  const { startIso, endIso } = getIstDayWindow()
  const usage = await listAiUsage({
    limit,
    toolPrefix: "astrology",
    createdFrom: startIso,
    createdTo: endIso,
  })
  const used = usage.items.length

  return {
    synced: usage.synced,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    allowed: usage.synced ? used < limit : true,
    reset_at: endIso,
  }
}

/** Block only when usage tracking works and the daily cap is reached. */
export const isAstrologyQuotaExceeded = (
  quota: Awaited<ReturnType<typeof checkAstrologyDailyQuota>>
) => quota.synced && !quota.allowed
