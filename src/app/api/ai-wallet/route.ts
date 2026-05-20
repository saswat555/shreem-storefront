import { NextResponse } from "next/server"

import { getAiWallet } from "@lib/data/ai-wallet"
import { retrieveCustomer } from "@lib/data/customer"
import { checkAstrologyDailyQuota } from "@lib/util/ai-quota"

export async function GET() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to view AI credits." },
      { status: 401 }
    )
  }

  const [wallet, quota] = await Promise.all([
    getAiWallet(),
    checkAstrologyDailyQuota(),
  ])

  return NextResponse.json({ ...wallet, quota })
}
