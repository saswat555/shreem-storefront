import "server-only"

import { sdk } from "@lib/config"

import { getAuthHeaders } from "./cookies"

export type AiCreditPack = {
  id: string
  label: string
  description?: string
  credits: number
  price_inr: number
  product_handle: string
  plan?: string
  duration_days?: number
  pro_question_limit?: number
  digital?: boolean
}

export type AiWallet = {
  id: string
  customer_id: string
  customer_email?: string | null
  credit_balance: number
  plan: string
  plan_expires_at?: string | null
  pro_question_limit?: number
  pro_active?: boolean
  recent_ledger?: {
    id: string
    type: string
    source?: string | null
    credits: number
    balance_after: number
    order_id?: string | null
    usage_id?: string | null
    note?: string | null
    metadata?: Record<string, unknown>
    created_at?: string
  }[]
}

export const getAiWallet = async () => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { synced: false, wallet: null as AiWallet | null, packs: [] as AiCreditPack[] }
  }

  try {
    const result = await sdk.client.fetch<{
      synced?: boolean
      wallet?: AiWallet | null
      packs?: AiCreditPack[]
    }>("/store/ai-wallet", {
      method: "GET",
      headers,
      cache: "no-store",
    })

    return {
      synced: result.synced !== false,
      wallet: result.wallet || null,
      packs: result.packs || [],
    }
  } catch {
    return { synced: false, wallet: null, packs: [] as AiCreditPack[] }
  }
}

export const consumeAiCredit = async ({
  tool,
  usageId,
  note,
  units = 1,
}: {
  tool: string
  usageId?: string
  note?: string
  units?: number
}) => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { allowed: false, synced: false, reason: "not_authenticated" }
  }

  try {
    return await sdk.client.fetch<{
      allowed?: boolean
      charged?: boolean
      synced?: boolean
      wallet?: AiWallet
      message?: string
      charged_units?: number
      premium_units?: number
      idempotent?: boolean
    }>("/store/ai-wallet/consume", {
      method: "POST",
      headers,
      body: {
        tool,
        usage_id: usageId,
        note,
        units,
      },
      cache: "no-store",
    })
  } catch (error: any) {
    if (error?.status === 402 || error?.response?.status === 402) {
      return {
        allowed: false,
        synced: true,
        message: "No AI credits available. Please buy credits or upgrade.",
      }
    }

    return { allowed: true, synced: false, charged: false }
  }
}
