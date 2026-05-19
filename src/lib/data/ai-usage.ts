import "server-only"

import { sdk } from "@lib/config"

import { getAuthHeaders } from "./cookies"

export type AiUsagePayload = {
  tool: string
  input: Record<string, unknown>
  response: Record<string, unknown>
  metadata?: Record<string, unknown>
  model?: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  estimated_cost_usd?: number
  estimated_cost_inr?: number
  expert_recommended?: boolean
}

export type AiUsageRecord = AiUsagePayload & {
  id?: string
  created_at?: string
}

const AI_USAGE_ROUTE = "/store/ai-usage"

export const recordAiUsage = async (payload: AiUsagePayload) => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { synced: false, reason: "not_authenticated" }
  }

  try {
    const result = await sdk.client.fetch<{
      synced?: boolean
      usage?: AiUsageRecord
    }>(
      AI_USAGE_ROUTE,
      {
        method: "POST",
        headers,
        body: payload,
        cache: "no-store",
      }
    )

    if (result.synced === false || !result.usage) {
      return { synced: false, reason: "backend_storage_unavailable" }
    }

    return { synced: true, usage: result.usage }
  } catch {
    return { synced: false, reason: "backend_route_unavailable" }
  }
}

export const listAiUsage = async ({
  limit = 12,
  toolPrefix = "astrology",
  createdFrom,
  createdTo,
}: {
  limit?: number
  toolPrefix?: string
  createdFrom?: string
  createdTo?: string
}) => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { synced: false, items: [] as AiUsageRecord[] }
  }

  try {
    const result = await sdk.client.fetch<{
      synced?: boolean
      usage?: AiUsageRecord[]
    }>(
      AI_USAGE_ROUTE,
      {
        method: "GET",
        headers,
        query: {
          limit,
          tool_prefix: toolPrefix,
          ...(createdFrom ? { created_from: createdFrom } : {}),
          ...(createdTo ? { created_to: createdTo } : {}),
        },
        cache: "no-store",
      }
    )

    return {
      synced: result.synced !== false,
      items: result.usage || [],
    }
  } catch {
    return { synced: false, items: [] as AiUsageRecord[] }
  }
}
