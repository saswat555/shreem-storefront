import "server-only"

import {
  consumeAiCredit,
  getAiWallet,
  type AiWallet,
} from "@lib/data/ai-wallet"
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

export type AstrologyAccess = Awaited<ReturnType<typeof checkAstrologyAccess>>

export const checkAstrologyAccess = async () => {
  const [quota, walletResult] = await Promise.all([
    checkAstrologyDailyQuota(),
    getAiWallet(),
  ])
  const wallet = walletResult.wallet
  const hasPremium = Boolean(wallet?.pro_active)
  const credits = Math.max(0, Number(wallet?.credit_balance || 0))
  const freeAllowed = !isAstrologyQuotaExceeded(quota)

  if (hasPremium) {
    return {
      allowed: true,
      reason: "premium",
      charge_required: false,
      quota,
      wallet,
      wallet_synced: walletResult.synced,
      packs: walletResult.packs,
    }
  }

  if (freeAllowed) {
    return {
      allowed: true,
      reason: "daily_free",
      charge_required: false,
      quota,
      wallet,
      wallet_synced: walletResult.synced,
      packs: walletResult.packs,
    }
  }

  if (credits > 0) {
    return {
      allowed: true,
      reason: "credit",
      charge_required: true,
      quota,
      wallet,
      wallet_synced: walletResult.synced,
      packs: walletResult.packs,
    }
  }

  return {
    allowed: walletResult.synced ? false : true,
    reason: walletResult.synced ? "limit_reached" : "wallet_unavailable",
    charge_required: false,
    quota,
    wallet: wallet as AiWallet | null,
    wallet_synced: walletResult.synced,
    packs: walletResult.packs,
  }
}

export const isAstrologyAccessBlocked = (access: AstrologyAccess) =>
  !access.allowed

export const consumeChargeableAstrologyCredit = async ({
  access,
  tool,
  usageId,
}: {
  access: AstrologyAccess
  tool: string
  usageId?: string
}) => {
  if (!access.charge_required) {
    return { charged: false, synced: true }
  }

  return consumeAiCredit({
    tool,
    usageId,
    note: "Daily astrology free quota exceeded",
  })
}
