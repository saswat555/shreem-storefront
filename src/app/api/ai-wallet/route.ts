import { NextResponse } from "next/server"

import { getAiWallet } from "@lib/data/ai-wallet"
import { retrieveCustomer } from "@lib/data/customer"

export async function GET() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to view AI credits." },
      { status: 401 }
    )
  }

  const wallet = await getAiWallet()

  return NextResponse.json(wallet)
}
