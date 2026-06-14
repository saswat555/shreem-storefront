import { NextResponse } from "next/server"

import { listAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"

export async function GET() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to view astrology history.", items: [] },
      { status: 401 }
    )
  }

  const history = await listAiUsage({ limit: 50, toolPrefix: "astrology" })

  return NextResponse.json({
    items: history.items,
    synced: history.synced,
  })
}
