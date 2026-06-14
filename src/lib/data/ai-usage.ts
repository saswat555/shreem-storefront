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
  tags?: string[]
  provider?: string
  attempts?: number
  attempt_logs?: Array<Record<string, unknown>>
}

export type AiUsageRecord = AiUsagePayload & {
  id?: string
  created_at?: string
}

type AiUsageWriteResponse = {
  synced?: boolean
  usage?: AiUsageRecord
  message?: string
  error?: string
}

type AiUsageListResponse = {
  synced?: boolean
  usage?: AiUsageRecord[]
  items?: AiUsageRecord[]
  message?: string
  error?: string
}

/**
 * IMPORTANT:
 * - Store route is used for customer/frontend-generated usage writes.
 * - Admin route is used as a fallback/read route for admin UI.
 *
 * This keeps the architecture safe:
 * Kundli/storefront flow writes through /store/ai-usage.
 * Admin AI Usage page can read through /admin/ai-usage.
 */
const STORE_AI_USAGE_ROUTE = "/store/ai-usage"
const ADMIN_AI_USAGE_ROUTE = "/admin/ai-usage"

const getSafeAuthHeaders = async () => {
  try {
    const headers = await getAuthHeaders()
    return headers || {}
  } catch (error: any) {
    console.warn("[AI usage] could not load auth headers", {
      reason: error?.message || "unknown_error",
    })

    return {}
  }
}

const getErrorReason = (error: any, fallback: string) => {
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.body?.message ||
    error?.body?.error ||
    error?.error ||
    fallback
  )
}

const hasUsableUsageRecord = (result?: AiUsageWriteResponse) => {
  return Boolean(result && result.synced !== false && result.usage)
}

const postAiUsageToRoute = async (
  route: string,
  headers: Record<string, any>,
  payload: AiUsagePayload
) => {
  const enrichedPayload = {
    ...payload,
    metadata: {
      ...(payload.metadata || {}),
      ai_provider: payload.provider,
      ai_attempts: payload.attempts,
      ai_attempt_logs: payload.attempt_logs,
    },
  }

  return sdk.client.fetch<AiUsageWriteResponse>(route, {
    method: "POST",
    headers,
    body: enrichedPayload,
    cache: "no-store",
  })
}

const getAiUsageFromRoute = async (
  route: string,
  headers: Record<string, any>,
  query: Record<string, unknown>
) => {
  return sdk.client.fetch<AiUsageListResponse>(route, {
    method: "GET",
    headers,
    query,
    cache: "no-store",
  })
}

export const recordAiUsage = async (payload: AiUsagePayload) => {
  const headers = await getSafeAuthHeaders()

  console.log("[AI usage] recording usage", {
    tool: payload.tool,
    primaryRoute: STORE_AI_USAGE_ROUTE,
    hasAuthorization: "authorization" in headers,
    headerKeys: Object.keys(headers || {}),
  })

  /**
   * Do NOT skip when authorization is missing.
   *
   * In storefront/customer/server flows, /store/ai-usage may be intentionally
   * public or may rely on Medusa/store headers instead of admin authorization.
   *
   * The old logic returned not_authenticated before even calling the backend,
   * which could make admin usage stay empty.
   */
  try {
    const result = await postAiUsageToRoute(
      STORE_AI_USAGE_ROUTE,
      headers,
      payload
    )

    console.log("[AI usage] store write result", {
      synced: result?.synced,
      hasUsage: Boolean(result?.usage),
      usageId: result?.usage?.id,
      message: result?.message,
      error: result?.error,
    })

    if (hasUsableUsageRecord(result)) {
      return { synced: true, usage: result.usage as AiUsageRecord }
    }

    /**
     * If store route exists but storage was unavailable, do not immediately fail.
     * Try admin route only when authorization is available.
     */
    if ("authorization" in headers) {
      console.warn("[AI usage] store write did not return usage, trying admin route", {
        tool: payload.tool,
        reason: result?.message || result?.error || "missing_usage",
      })

      const adminResult = await postAiUsageToRoute(
        ADMIN_AI_USAGE_ROUTE,
        headers,
        payload
      )

      console.log("[AI usage] admin write fallback result", {
        synced: adminResult?.synced,
        hasUsage: Boolean(adminResult?.usage),
        usageId: adminResult?.usage?.id,
        message: adminResult?.message,
        error: adminResult?.error,
      })

      if (hasUsableUsageRecord(adminResult)) {
        return { synced: true, usage: adminResult.usage as AiUsageRecord }
      }

      return {
        synced: false,
        reason:
          adminResult?.message ||
          adminResult?.error ||
          result?.message ||
          result?.error ||
          "backend_storage_unavailable",
      }
    }

    return {
      synced: false,
      reason:
        result?.message ||
        result?.error ||
        "backend_storage_unavailable",
    }
  } catch (storeError: any) {
    const storeReason = getErrorReason(storeError, "store_route_unavailable")

    console.error("[AI usage] store write failed", {
      route: STORE_AI_USAGE_ROUTE,
      tool: payload.tool,
      reason: storeReason,
    })

    /**
     * Fallback to admin route only if auth is present.
     * This avoids breaking storefront/customer usage when admin auth is absent.
     */
    if ("authorization" in headers) {
      try {
        const adminResult = await postAiUsageToRoute(
          ADMIN_AI_USAGE_ROUTE,
          headers,
          payload
        )

        console.log("[AI usage] admin write fallback result", {
          synced: adminResult?.synced,
          hasUsage: Boolean(adminResult?.usage),
          usageId: adminResult?.usage?.id,
          message: adminResult?.message,
          error: adminResult?.error,
        })

        if (hasUsableUsageRecord(adminResult)) {
          return { synced: true, usage: adminResult.usage as AiUsageRecord }
        }

        return {
          synced: false,
          reason:
            adminResult?.message ||
            adminResult?.error ||
            storeReason ||
            "backend_storage_unavailable",
        }
      } catch (adminError: any) {
        const adminReason = getErrorReason(
          adminError,
          "admin_route_unavailable"
        )

        console.error("[AI usage] admin write fallback failed", {
          route: ADMIN_AI_USAGE_ROUTE,
          tool: payload.tool,
          reason: adminReason,
        })

        return {
          synced: false,
          reason: `${storeReason}; fallback_failed: ${adminReason}`,
        }
      }
    }

    return { synced: false, reason: storeReason }
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
  const headers = await getSafeAuthHeaders()

  const query = {
    limit,
    tool_prefix: toolPrefix,
    ...(createdFrom ? { created_from: createdFrom } : {}),
    ...(createdTo ? { created_to: createdTo } : {}),
  }

  /**
   * For listing, prefer admin route first because this is normally consumed
   * by the admin AI Usage page.
   */
  if ("authorization" in headers) {
    try {
      const adminResult = await getAiUsageFromRoute(
        ADMIN_AI_USAGE_ROUTE,
        headers,
        query
      )

      const items = adminResult.usage || adminResult.items || []

      console.log("[AI usage] admin list result", {
        synced: adminResult?.synced,
        count: items.length,
        message: adminResult?.message,
        error: adminResult?.error,
      })

      if (adminResult.synced !== false) {
        return {
          synced: true,
          items,
        }
      }
    } catch (adminError: any) {
      console.error("[AI usage] admin list failed", {
        route: ADMIN_AI_USAGE_ROUTE,
        reason: getErrorReason(adminError, "admin_route_unavailable"),
      })
    }
  }

  /**
   * Fallback to store route so existing storefront/server usage is not affected.
   */
  try {
    const storeResult = await getAiUsageFromRoute(
      STORE_AI_USAGE_ROUTE,
      headers,
      query
    )

    const items = storeResult.usage || storeResult.items || []

    console.log("[AI usage] store list result", {
      synced: storeResult?.synced,
      count: items.length,
      message: storeResult?.message,
      error: storeResult?.error,
    })

    return {
      synced: storeResult.synced !== false,
      items,
    }
  } catch (storeError: any) {
    console.error("[AI usage] store list failed", {
      route: STORE_AI_USAGE_ROUTE,
      reason: getErrorReason(storeError, "store_route_unavailable"),
    })

    return { synced: false, items: [] as AiUsageRecord[] }
  }
}
