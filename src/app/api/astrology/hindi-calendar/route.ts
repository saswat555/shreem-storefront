import { NextRequest, NextResponse } from "next/server"

import { getCityById, getTodayDateString } from "@lib/util/astrology"
import { buildHindiCalendarDay } from "@lib/util/vedic-astrology"

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)

export async function GET(request: NextRequest) {
  const city = getCityById(
    sanitizeString(request.nextUrl.searchParams.get("cityId"), 80)
  )
  const requestedDate = sanitizeString(
    request.nextUrl.searchParams.get("date"),
    20
  )
  const date = isValidDate(requestedDate)
    ? requestedDate
    : getTodayDateString(new Date(), city.timeZone)

  try {
    return NextResponse.json(buildHindiCalendarDay({ city, date }))
  } catch (error) {
    console.error("Hindi calendar calculation failed", error)

    return NextResponse.json(
      { message: "Unable to calculate Hindi calendar details right now." },
      { status: 500 }
    )
  }
}
