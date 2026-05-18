import "server-only"

import { sdk } from "@lib/config"

import { getAuthHeaders } from "./cookies"

export type AiUsagePayload = {
  tool: string
  input: Record<string, unknown>
  response: Record<string, unknown>
  metadata?: Record<string, unknown>
  model?: string
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
    const result = await sdk.client.fetch<{ usage: AiUsageRecord }>(
      AI_USAGE_ROUTE,
      {
        method: "POST",
        headers,
        body: payload,
        cache: "no-store",
      }
    )

    return { synced: true, usage: result.usage }
  } catch {
    return { synced: false, reason: "backend_route_unavailable" }
  }
}

export const listAiUsage = async ({
  limit = 12,
  toolPrefix = "astrology",
}: {
  limit?: number
  toolPrefix?: string
}) => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { synced: false, items: [] as AiUsageRecord[] }
  }

  try {
    const result = await sdk.client.fetch<{ usage: AiUsageRecord[] }>(
      AI_USAGE_ROUTE,
      {
        method: "GET",
        headers,
        query: {
          limit,
          tool_prefix: toolPrefix,
        },
        cache: "no-store",
      }
    )

    return { synced: true, items: result.usage || [] }
  } catch {
    return { synced: false, items: [] as AiUsageRecord[] }
  }
}
