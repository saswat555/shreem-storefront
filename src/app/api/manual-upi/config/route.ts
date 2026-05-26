import { NextResponse } from "next/server"

const getBackendUrl = () =>
  (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "")
    .replace(/\/$/, "")

export async function GET() {
  const backendUrl = getBackendUrl()
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "Manual UPI config is not available.",
      },
      { status: 500 }
    )
  }

  const response = await fetch(`${backendUrl}/store/manual-upi/config`, {
    headers: {
      "x-publishable-api-key": publishableKey,
    },
    cache: "no-store",
  }).catch(() => null)

  if (!response) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to load Manual UPI config.",
      },
      { status: 502 }
    )
  }

  const data = await response.json().catch(() => null)

  return NextResponse.json(data || { ok: false }, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
