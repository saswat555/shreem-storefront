import { NextRequest, NextResponse } from "next/server"

import { retrieveCustomer } from "@lib/data/customer"
import { getCityById, getTodayDateString } from "@lib/util/astrology"
import { buildHindiCalendarDay } from "@lib/util/vedic-astrology"

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
const isValidMonth = (month: string) => /^\d{4}-\d{2}$/.test(month)

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

const buildCalendarMonth = ({
  city,
  month,
  panchangSystemId,
}: {
  city: ReturnType<typeof getCityById>
  month: string
  panchangSystemId?: string
}) => {
  const [year, monthNumber] = month.split("-").map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()

  return {
    month,
    city,
    days: Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1
      const date = formatDate(year, monthNumber, dayNumber)
      const day = buildHindiCalendarDay({ city, date, panchangSystemId })

      return {
        date,
        day_number: dayNumber,
        weekday: day.weekday,
        tithi: day.tithi,
        paksha: day.paksha,
        nakshatra: day.nakshatra,
        yoga: day.yoga,
        karana: day.karana,
        month: day.month,
      }
    }),
  }
}

export async function GET(request: NextRequest) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to view Hindi calendar details." },
      { status: 401 }
    )
  }

  const city = getCityById(
    sanitizeString(request.nextUrl.searchParams.get("cityId"), 80)
  )
  const requestedDate = sanitizeString(
    request.nextUrl.searchParams.get("date"),
    20
  )
  const panchangSystemId = sanitizeString(
    request.nextUrl.searchParams.get("panchangSystemId"),
    40
  )
  const requestedMonth = sanitizeString(
    request.nextUrl.searchParams.get("month"),
    7
  )

  if (isValidMonth(requestedMonth)) {
    try {
      return NextResponse.json(
        buildCalendarMonth({ city, month: requestedMonth, panchangSystemId })
      )
    } catch (error) {
      console.error("Hindi calendar month calculation failed", error)

      return NextResponse.json(
        { message: "Unable to calculate Hindi calendar month right now." },
        { status: 500 }
      )
    }
  }

  const date = isValidDate(requestedDate)
    ? requestedDate
    : getTodayDateString(new Date(), city.timeZone)

  try {
    return NextResponse.json(
      buildHindiCalendarDay({ city, date, panchangSystemId })
    )
  } catch (error) {
    console.error("Hindi calendar calculation failed", error)

    return NextResponse.json(
      { message: "Unable to calculate Hindi calendar details right now." },
      { status: 500 }
    )
  }
}
