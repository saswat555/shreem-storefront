import { NextRequest, NextResponse } from "next/server"

import { getCartPackageDetails, getCartWeightKg } from "@lib/util/shiprocket"

const getBackendUrl = () =>
  (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "")
    .replace(/\/$/, "")

const sanitizePincode = (value: unknown) =>
  typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : ""

const sanitizeWeight = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const sanitizeDimension = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const postalCode = sanitizePincode(payload?.postal_code)
  const weight = sanitizeWeight(
    payload?.weight || (payload?.cart ? getCartWeightKg(payload.cart) : 1)
  )
  const packageDetails = payload?.cart ? getCartPackageDetails(payload.cart) : null
  const length =
    sanitizeDimension(payload?.length || payload?.length_cm) ||
    packageDetails?.lengthCm
  const breadth =
    sanitizeDimension(payload?.breadth || payload?.breadth_cm || payload?.width_cm) ||
    packageDetails?.breadthCm
  const height =
    sanitizeDimension(payload?.height || payload?.height_cm) ||
    packageDetails?.heightCm
  const backendUrl = getBackendUrl()
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!postalCode || postalCode.length !== 6) {
    return NextResponse.json(
      { ok: false, available: false, message: "Enter a valid 6 digit pincode." },
      { status: 400 }
    )
  }

  if (!backendUrl || !publishableKey) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        message: "Shiprocket rate service is not configured.",
      },
      { status: 500 }
    )
  }

  const response = await fetch(`${backendUrl}/store/shiprocket/rates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
    },
    body: JSON.stringify({
      postal_code: postalCode,
      weight,
      length,
      breadth,
      height,
      cod: Boolean(payload?.cod),
    }),
    cache: "no-store",
  }).catch(() => null)

  if (!response) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        message: "Unable to calculate shipping right now. Please try again.",
      },
      { status: 502 }
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        message:
          data?.message ||
          data?.error ||
          "Unable to calculate shipping right now. Please try again.",
      },
      { status: response.status }
    )
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
