import { NextRequest, NextResponse } from "next/server"

import { retrieveCustomer } from "@lib/data/customer"

export const dynamic = "force-dynamic"

const backendUrl = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://127.0.0.1:9000"
).replace(/\/+$/, "")

const publishableKey =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  "pk_14ea1cd12a8ee731019d8a32c74a3501b5c17e13d9d804ece7a931a194ed0208"

const GEO_HEADERS = [
  "cf-ipcountry",
  "cf-region",
  "cf-region-code",
  "cf-ipcity",
  "cf-city",
  "cf-postal-code",
  "cf-timezone",
  "cf-iplatitude",
  "cf-iplongitude",
  "cf-latitude",
  "cf-longitude",
  "cf-ray",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-city",
  "x-vercel-ip-postal-code",
  "x-vercel-ip-timezone",
  "x-vercel-ip-latitude",
  "x-vercel-ip-longitude",
]

const getForwardedHeaders = (request: NextRequest) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey,
    "user-agent": request.headers.get("user-agent") || "",
    "x-forwarded-for":
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "",
  }

  for (const key of GEO_HEADERS) {
    const value = request.headers.get(key)

    if (value) {
      headers[key] = value
    }
  }

  return headers
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

  if (!payload?.path) {
    return NextResponse.json(
      { ok: false, message: "path is required." },
      { status: 400 }
    )
  }

  const customer = await retrieveCustomer().catch(() => null)
  const response = await fetch(`${backendUrl}/store/analytics`, {
    method: "POST",
    headers: getForwardedHeaders(request),
    body: JSON.stringify({
      ...payload,
      customer_id: customer?.id || payload.customer_id || null,
      customer_email: customer?.email || payload.customer_email || null,
      is_logged_in: Boolean(customer?.id || payload.is_logged_in),
    }),
    cache: "no-store",
  }).catch(() => null)

  if (!response?.ok) {
    return NextResponse.json(
      { ok: false, message: "analytics unavailable" },
      { status: 202 }
    )
  }

  const body = await response.json().catch(() => ({ ok: true }))

  return NextResponse.json(body, { status: 201 })
}
