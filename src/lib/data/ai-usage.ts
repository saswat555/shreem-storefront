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
  cached_prompt_tokens?: number
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

const MAX_AI_USAGE_POST_CHARS = 45_000

const compactString = (value: string, max = 1600) =>
  value.length > max ? `${value.slice(0, max)}...` : value

const compactJsonForAiUsage = (
  value: unknown,
  parentKey = "",
  depth = 0
): unknown => {
  if (value === null || typeof value === "undefined") {
    return value
  }

  if (typeof value === "string") {
    return compactString(value, depth > 3 ? 700 : 1800)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    const limit =
      /attempt_logs/i.test(parentKey) ? 8 :
      /bphs|proof|evidence|timeline|dasha|houses|aspects|planets/i.test(parentKey) ? 12 :
      24

    return value
      .slice(0, limit)
      .map((item) => compactJsonForAiUsage(item, parentKey, depth + 1))
  }

  if (typeof value === "object") {
    if (depth > 5) {
      return "[compacted-depth]"
    }

    const record = value as Record<string, unknown>
    const heavyKeys = new Set([
      "chart",
      "evidence_stack",
      "bphs_rule_proofs",
      "knowledge_context",
      "knowledge_references",
      "dasha_timeline",
      "longevity_assessment",
      "critical_period_analysis",
      "targeted_remedy_seeds",
      "targeted_remedies",
      "detected_cases",
      "detected_yogas",
      "health_indicators",
      "house_outcomes",
      "planet_effects",
      "graha_table",
      "house_table",
      "aspects",
      "houses",
      "planets",
    ])

    return Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => !(depth > 1 && heavyKeys.has(key)))
        .map(([key, item]) => [
          key,
          compactJsonForAiUsage(item, key, depth + 1),
        ])
    )
  }

  return String(value)
}

const fitAiUsagePayload = (payload: AiUsagePayload): AiUsagePayload => {
  const compacted: AiUsagePayload = {
    ...payload,
    input: compactJsonForAiUsage(payload.input) as Record<string, unknown>,
    response: compactJsonForAiUsage(payload.response) as Record<string, unknown>,
    metadata: compactJsonForAiUsage(payload.metadata || {}) as Record<string, unknown>,
    attempt_logs: compactJsonForAiUsage(payload.attempt_logs || []) as Array<
      Record<string, unknown>
    >,
  }

  if (JSON.stringify(compacted).length <= MAX_AI_USAGE_POST_CHARS) {
    return compacted
  }

  const analysis = (payload.response as any)?.analysis || {}
  const profile = (payload.response as any)?.profile
  const chart = (payload.response as any)?.chart
  const compactResponse = {
    compacted: true,
    profile,
    message: (payload.response as any)?.message,
    model: payload.model,
    provider: payload.provider,
    token_usage: {
      prompt_tokens: payload.prompt_tokens,
      completion_tokens: payload.completion_tokens,
      cached_prompt_tokens: payload.cached_prompt_tokens,
      total_tokens: payload.total_tokens,
      estimated_cost_usd: payload.estimated_cost_usd,
      estimated_cost_inr: payload.estimated_cost_inr,
      attempts: payload.attempts,
    },
    chart_summary: {
      ascendant: chart?.ascendant,
      moonSign: chart?.moonSign,
      nakshatra: chart?.nakshatra,
      nakshatraPada: chart?.nakshatraPada,
      dasha: chart?.dasha
        ? {
            mahadasha: chart.dasha.mahadasha,
            antardasha: chart.dasha.antardasha,
            pratyantar: chart.dasha.pratyantar,
          }
        : undefined,
    },
    analysis: {
      summary: compactJsonForAiUsage(analysis.summary, "summary", 1),
      current_period_analysis: compactJsonForAiUsage(
        analysis.current_period_analysis,
        "current_period_analysis",
        1
      ),
      career_direction: compactJsonForAiUsage(
        analysis.career_direction,
        "career_direction",
        1
      ),
      relationship_pattern: compactJsonForAiUsage(
        analysis.relationship_pattern,
        "relationship_pattern",
        1
      ),
      health_caution: compactJsonForAiUsage(
        analysis.health_caution,
        "health_caution",
        1
      ),
      prediction_table: compactJsonForAiUsage(
        Array.isArray(analysis.prediction_table)
          ? analysis.prediction_table.slice(0, 12)
          : [],
        "prediction_table",
        1
      ),
      sub_question_answers: compactJsonForAiUsage(
        Array.isArray(analysis.sub_question_answers)
          ? analysis.sub_question_answers.slice(0, 3)
          : [],
        "sub_question_answers",
        1
      ),
      targeted_remedies: compactJsonForAiUsage(
        Array.isArray(analysis.targeted_remedies)
          ? analysis.targeted_remedies.slice(0, 8)
          : [],
        "targeted_remedies",
        1
      ),
    },
  }

  if (JSON.stringify({ ...compacted, response: compactResponse }).length <= MAX_AI_USAGE_POST_CHARS) {
    return {
      ...compacted,
      response: compactResponse as Record<string, unknown>,
      metadata: {
        ...(compacted.metadata || {}),
        payload_compacted: true,
        compaction_mode: "kundli_meaningful_summary",
        original_payload_chars: JSON.stringify(payload).length,
      },
    }
  }

  return {
    ...compacted,
    response: {
      compacted: true,
      compaction_mode: "minimal_usage_summary",
      profile,
      token_usage: compactResponse.token_usage,
      chart_summary: compactResponse.chart_summary,
      analysis: {
        summary: compactResponse.analysis.summary,
        current_period_analysis: compactResponse.analysis.current_period_analysis,
        prediction_table: compactResponse.analysis.prediction_table,
        sub_question_answers: compactResponse.analysis.sub_question_answers,
        targeted_remedies: compactResponse.analysis.targeted_remedies,
      },
      summary: compactResponse.analysis.summary,
      targeted_remedies: compactResponse.analysis.targeted_remedies,
    },
    metadata: {
      ...(compacted.metadata || {}),
      payload_compacted: true,
      compaction_mode: "minimal_usage_summary",
      original_payload_chars: JSON.stringify(payload).length,
    },
  }
}

const postAiUsageToRoute = async (
  route: string,
  headers: Record<string, any>,
  payload: AiUsagePayload
) => {
  const safePayload = fitAiUsagePayload(payload)
  const enrichedPayload = {
    ...safePayload,
    metadata: {
      ...(safePayload.metadata || {}),
      ai_provider: safePayload.provider,
      ai_attempts: safePayload.attempts,
      ai_attempt_logs: safePayload.attempt_logs,
      cached_prompt_tokens: safePayload.cached_prompt_tokens,
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

    if ("authorization" in headers) {
      try {
        const adminResult = await getAiUsageFromRoute(
          ADMIN_AI_USAGE_ROUTE,
          headers,
          query
        )

        const items = adminResult.usage || adminResult.items || []

        console.log("[AI usage] admin list fallback result", {
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
        console.error("[AI usage] admin list fallback failed", {
          route: ADMIN_AI_USAGE_ROUTE,
          reason: getErrorReason(adminError, "admin_route_unavailable"),
        })
      }
    }

    return { synced: false, items: [] as AiUsageRecord[] }
  }
}
