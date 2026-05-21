import "server-only"

import {
  consumeAiCredit,
  getAiWallet,
  type AiWallet,
} from "@lib/data/ai-wallet"
import { listAiUsage } from "@lib/data/ai-usage"

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const normalizeUsageUnits = (value: unknown, fallback = 1) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(Math.max(1, Math.ceil(parsed)), 10)
    : fallback
}

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

const getAiUsageUnits = (item: Awaited<ReturnType<typeof listAiUsage>>["items"][number]) => {
  const metadata = (item.metadata || {}) as Record<string, unknown>
  const response = (item.response || {}) as Record<string, unknown>

  return normalizeUsageUnits(
    metadata.usage_units ?? metadata.billing_units ?? response.usage_units,
    1
  )
}

export const checkAstrologyDailyQuota = async ({
  requestedUnits = 1,
}: {
  requestedUnits?: number
} = {}) => {
  const limit = getDailyAiLimit()
  const units = normalizeUsageUnits(requestedUnits)
  const { startIso, endIso } = getIstDayWindow()
  const usage = await listAiUsage({
    limit: Math.max(50, limit * 8),
    toolPrefix: "astrology",
    createdFrom: startIso,
    createdTo: endIso,
  })
  const used = usage.items.reduce((sum, item) => sum + getAiUsageUnits(item), 0)
  const remaining = Math.max(0, limit - used)

  return {
    synced: usage.synced,
    limit,
    used,
    remaining,
    requested_units: units,
    allowed: usage.synced ? remaining >= units : true,
    reset_at: endIso,
  }
}

/** Block only when usage tracking works and the daily cap is reached. */
export const isAstrologyQuotaExceeded = (
  quota: Awaited<ReturnType<typeof checkAstrologyDailyQuota>>
) => quota.synced && !quota.allowed

export type AstrologyAccess = Awaited<ReturnType<typeof checkAstrologyAccess>>

export const checkAstrologyAccess = async ({
  requestedUnits = 1,
}: {
  requestedUnits?: number
} = {}) => {
  const units = normalizeUsageUnits(requestedUnits)
  const [quota, walletResult] = await Promise.all([
    checkAstrologyDailyQuota({ requestedUnits: units }),
    getAiWallet(),
  ])
  const wallet = walletResult.wallet
  const hasPremium = Boolean(wallet?.pro_active)
  const credits = Math.max(0, Number(wallet?.credit_balance || 0))
  const freeAllowed = !quota.synced || quota.remaining >= units

  if (hasPremium) {
    return {
      allowed: true,
      reason: "premium",
      charge_required: false,
      charge_units: 0,
      requested_units: units,
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
      charge_units: 0,
      requested_units: units,
      quota,
      wallet,
      wallet_synced: walletResult.synced,
      packs: walletResult.packs,
    }
  }

  if (credits >= units) {
    return {
      allowed: true,
      reason: "credit",
      charge_required: true,
      charge_units: units,
      requested_units: units,
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
    charge_units: 0,
    requested_units: units,
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
    return { charged: false, synced: true, charged_units: 0 }
  }

  const units = normalizeUsageUnits(access.charge_units || 1)
  let lastResult: Awaited<ReturnType<typeof consumeAiCredit>> | null = null
  let chargedUnits = 0

  for (let index = 0; index < units; index += 1) {
    const result = await consumeAiCredit({
      tool,
      usageId:
        usageId && units > 1 ? `${usageId}:${index + 1}/${units}` : usageId,
      note:
        units > 1
          ? `Deep astrology reading charged ${units} credits`
          : "Daily astrology free quota exceeded",
    })

    lastResult = result

    if ("charged" in result && result.charged) {
      chargedUnits += 1
    }

    if (result.allowed === false) {
      return {
        ...result,
        charged: chargedUnits > 0,
        charged_units: chargedUnits,
        charge_units: units,
      }
    }
  }

  return {
    ...(lastResult || {}),
    charged: chargedUnits > 0,
    charged_units: chargedUnits,
    charge_units: units,
    synced: lastResult?.synced !== false,
  }
}
