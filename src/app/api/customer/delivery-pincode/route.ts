import { NextRequest, NextResponse } from "next/server"

import { retrieveCustomer, updateCustomer } from "@lib/data/customer"

const sanitizePincode = (value: unknown) =>
  typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : ""

const getSavedPincode = (
  customer: Awaited<ReturnType<typeof retrieveCustomer>>
) => {
  const metadata = (customer?.metadata || {}) as Record<string, unknown>
  const metadataPincode = sanitizePincode(metadata.preferred_delivery_pincode)

  if (metadataPincode.length === 6) {
    return metadataPincode
  }

  const defaultAddress =
    customer?.addresses?.find((address) => address.is_default_shipping) ||
    customer?.addresses?.[0]

  return sanitizePincode(defaultAddress?.postal_code)
}

export async function GET() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json({ pincode: "", synced: false })
  }

  return NextResponse.json({
    pincode: getSavedPincode(customer),
    synced: true,
  })
}

export async function PATCH(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to save delivery pincode." },
      { status: 401 }
    )
  }

  const payload = await request.json().catch(() => null)
  const pincode = sanitizePincode(payload?.pincode)

  if (pincode.length !== 6) {
    return NextResponse.json(
      { message: "Enter a valid 6 digit pincode." },
      { status: 400 }
    )
  }

  const metadata = {
    ...((customer.metadata || {}) as Record<string, unknown>),
    preferred_delivery_pincode: pincode,
  }

  await updateCustomer({ metadata } as any)

  return NextResponse.json({
    pincode,
    synced: true,
  })
}
