"use client"

import {
  ASTROLOGY_CITIES,
  calculateDailyMuhurat,
  getCityById,
  getTodayDateString,
  type HindiCalendarDay,
  type MuhurtaSlot,
  type PrashnaChart,
  type PrashnaHouse,
  type PrashnaPlanet,
} from "@lib/util/astrology"
import LogoLoader from "@modules/common/components/logo-loader"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useMemo, useState } from "react"

type PrashnaResult = {
  chart?: PrashnaChart
  answer?: string
  chart_summary?: string
  direct_indication?: string
  house_focus?: string
  expert_call_recommended?: boolean
  expert_call_reason?: string
  recommended_service?: string
  key_chart_factors?: string[]
  favorable_timing?: string
  caution?: string
  next_step?: string
  message?: string
  usage_synced?: boolean
}

type KundliAnalysis = {
  summary?: string
  person_information?: string
  temperament?: string
  behavioral_traits?: string[]
  strengths?: string[]
  life_themes?: string[]
  career_direction?: string
  relationship_pattern?: string
  health_caution?: string
  current_period_analysis?: string
  prediction_table?: {
    area: string
    chart_basis: string
    prediction: string
    advice: string
  }[]
  likely_challenges?: string[]
  issue_analysis?: string[]
  practical_solutions?: string[]
  spiritual_guidance?: string
  sub_question_answers?: {
    question: string
    answer: string
    chart_reason: string
  }[]
  special_cases?: string[]
  upaay?: string[]
  shreem_product_suggestions?: {
    title: string
    handle: string
    reason: string
  }[]
  expert_call_recommended?: boolean
  expert_call_reason?: string
}

type KundliResult = {
  profile?: {
    name?: string
    gender?: string
    birth_date?: string
    birth_time?: string
    city?: string
    language?: string
    sub_questions?: string[]
  }
  chart?: PrashnaChart
  detected_yogas?: string[]
  stones?: {
    lagna?: {
      sign?: string
      lord?: string
      primary?: string
      alternatives?: string[]
      caution?: string
    }
    rashi?: {
      sign?: string
      lord?: string
      primary?: string
      alternatives?: string[]
      caution?: string
    }
    caution?: string
  }
  analysis?: KundliAnalysis
  message?: string
  usage_synced?: boolean
}

type MatchmakingResult = {
  girl?: {
    profile?: {
      name?: string
      birth_date?: string
      birth_time?: string
      city?: string
    }
    chart?: PrashnaChart
  }
  boy?: {
    profile?: {
      name?: string
      birth_date?: string
      birth_time?: string
      city?: string
    }
    chart?: PrashnaChart
  }
  compatibility?: {
    scores?: {
      name: string
      score: number
      max: number
      reason: string
    }[]
    total?: number
    max?: number
    percentage?: number
    deterministicRecommendation?: "go" | "caution" | "avoid"
  }
  analysis?: {
    summary?: string
    recommendation?: "go" | "caution" | "avoid"
    percentage_suggestion?: number
    decision_reason?: string
    strengths?: string[]
    concerns?: string[]
    family_discussion_points?: string[]
    marriage_timing_note?: string
    remedies?: string[]
    expert_call_recommended?: boolean
    expert_call_reason?: string
  }
  message?: string
  usage_synced?: boolean
}

type AstrologyHistoryItem = {
  id: string
  type: "Prashna" | "Kundli" | "Matchmaking"
  title: string
  createdAt: string
  summary: string
  synced?: boolean
  response?: PrashnaResult | KundliResult | MatchmakingResult
}

type AstrologyTab =
  | "muhurth"
  | "calendar"
  | "prashna"
  | "kundli"
  | "matchmaking"
type AstrologyLanguage = "english" | "hindi" | "hinglish"

const qualityClasses: Record<MuhurtaSlot["quality"], string> = {
  auspicious:
    "border-[rgba(13,129,126,0.22)] bg-[rgba(240,248,246,0.88)] text-[var(--shreem-ink)]",
  neutral:
    "border-[rgba(18,63,99,0.1)] bg-[rgba(255,252,248,0.74)] text-[var(--shreem-muted)]",
  avoid: "border-[rgba(127,37,35,0.16)] bg-[rgba(255,244,241,0.82)] text-[#7f2523]",
}

const serviceCards = [
  {
    title: "15 min call",
    amount: "Rs. 499",
    href: "/products/shreem-astrology-15-minute-call",
    description:
      "Focused answer for one topic with Sanjay Kumar Pandey ji.",
  },
  {
    title: "30 min call",
    amount: "Rs. 999",
    href: "/products/shreem-astrology-30-minute-call",
    description:
      "Detailed guidance with stone recommendation and pooja direction.",
  },
]

const astrologyTabs: { id: AstrologyTab; label: string; description: string }[] = [
  {
    id: "muhurth",
    label: "Muhurth",
    description: "Daily Choghadiya windows",
  },
  {
    id: "calendar",
    label: "Hindu Calendar",
    description: "Tithi, masa, festivals",
  },
  {
    id: "prashna",
    label: "Prashna",
    description: "Ask one focused question",
  },
  {
    id: "kundli",
    label: "Kundli",
    description: "Birth chart and PDF",
  },
  {
    id: "matchmaking",
    label: "Matchmaking",
    description: "Marriage compatibility",
  },
]

const HISTORY_KEY = "shreem_astrology_history_v1"
const LANGUAGE_KEY = "shreem_site_language_v1"

const languageOptions: {
  value: AstrologyLanguage
  label: string
  detail: string
}[] = [
  {
    value: "english",
    label: "English",
    detail: "Premium English readings",
  },
  {
    value: "hindi",
    label: "Hindi",
    detail: "Devanagari Hindi",
  },
  {
    value: "hinglish",
    label: "Hinglish",
    detail: "Hindi-English chat style",
  },
]

const emptyMatchPerson = () => ({
  name: "",
  birthDate: "",
  birthTime: "",
  cityId: "rewa",
})

const SlotCard = ({ slot }: { slot: MuhurtaSlot }) => (
  <div className={`rounded-[18px] border px-4 py-4 ${qualityClasses[slot.quality]}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">{slot.name}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] opacity-70">
          Slot {slot.index}
        </p>
      </div>
      <span className="rounded-full border border-current/15 bg-white/54 px-2.5 py-1 text-xs font-semibold">
        {slot.quality === "auspicious"
          ? "Good"
          : slot.quality === "avoid"
          ? "Avoid"
          : "Neutral"}
      </span>
    </div>
    <p className="mt-3 text-sm font-semibold">
      {slot.startLabel} - {slot.endLabel}
    </p>
    <p className="mt-2 text-xs leading-5 opacity-80">{slot.note}</p>
  </div>
)

const formatDegree = (value?: number) =>
  typeof value === "number" ? `${value.toFixed(2)} deg` : "Not available"

const ChartMiniCard = ({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) => (
  <div className="min-w-0 rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
      {label}
    </p>
    <p className="mt-2 break-words text-base font-semibold leading-6 text-[var(--shreem-ink)]">
      {value}
    </p>
    {detail && (
      <p className="mt-1 break-words text-xs leading-5 text-[var(--shreem-muted)]">
        {detail}
      </p>
    )}
  </div>
)

const PlanetCard = ({ planet }: { planet: PrashnaPlanet }) => (
  <div className="min-w-0 rounded-[18px] border border-[var(--shreem-border)] bg-white/68 px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-[var(--shreem-ink)]">
          {planet.name}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
          House {planet.house}
          {planet.retrograde ? " · retrograde" : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-[var(--shreem-border)] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[var(--shreem-gold-deep)]">
        H{planet.house}
      </span>
    </div>
    <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
      {planet.sign} {formatDegree(planet.signDegree)}
    </p>
    <p className="text-xs leading-5 text-[var(--shreem-muted)]">
      {planet.nakshatra} pada {planet.pada}
    </p>
  </div>
)

const HouseCard = ({ house }: { house: PrashnaHouse }) => (
  <div className="min-w-0 rounded-[16px] border border-[var(--shreem-border)] bg-white/58 px-3 py-3">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
        House {house.house}
      </p>
      <span className="rounded-full bg-[rgba(13,129,126,0.08)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--shreem-ink)]">
        {house.signLord}
      </span>
    </div>
    <p className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
      {house.sign}
    </p>
    <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
      {house.theme}
    </p>
  </div>
)

const getHousePlanets = (chart: PrashnaChart, houseNumber: number) =>
  chart.planets.filter((planet) => planet.house === houseNumber)

const DashaCard = ({ chart }: { chart: PrashnaChart }) => {
  const dasha = chart.dasha

  if (!dasha) {
    return null
  }

  const periods = [
    ["Mahadasha", dasha.mahadasha],
    ["Antardasha", dasha.antardasha],
    ["Pratyantar", dasha.pratyantar],
  ] as const

  return (
    <div className="rounded-[22px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.74)] px-4 py-4">
      <div className="flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Vimshottari dasha
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            Moon nakshatra lord: {dasha.moonNakshatraLord}. Balance at birth:
            {" "}
            {dasha.balanceAtBirth.lord} until {dasha.balanceAtBirth.endLabel}.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 small:grid-cols-3">
        {periods.map(([label, period]) => (
          <div
            key={label}
            className="rounded-[18px] border border-[rgba(212,161,38,0.2)] bg-white/72 px-3 py-3"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
              {label}
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--shreem-ink)]">
              {period.lord}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {period.startLabel} - {period.endLabel}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const PlanetTable = ({ chart }: { chart: PrashnaChart }) => (
  <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]">
          <tr>
            {["Graha", "Sign", "Degree", "House", "Nakshatra", "Motion"].map(
              (heading) => (
                <th
                  key={heading}
                  className="px-3 py-3 font-semibold uppercase tracking-[0.14em]"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((planet) => (
            <tr
              key={planet.key}
              className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
            >
              <td className="px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                {planet.name}
              </td>
              <td className="px-3 py-3">{planet.sign}</td>
              <td className="px-3 py-3">{formatDegree(planet.signDegree)}</td>
              <td className="px-3 py-3">House {planet.house}</td>
              <td className="px-3 py-3">
                {planet.nakshatra} pada {planet.pada}
              </td>
              <td className="px-3 py-3">
                {planet.retrograde ? "Retrograde" : "Direct"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const HouseTable = ({ chart }: { chart: PrashnaChart }) => (
  <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-[rgba(240,248,246,0.86)] text-[var(--shreem-gold-deep)]">
          <tr>
            {["House", "Sign", "Lord", "Planets", "Theme"].map((heading) => (
              <th
                key={heading}
                className="px-3 py-3 font-semibold uppercase tracking-[0.14em]"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.houses.map((house) => {
            const planets = getHousePlanets(chart, house.house)

            return (
              <tr
                key={house.house}
                className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
              >
                <td className="px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                  {house.house}
                </td>
                <td className="px-3 py-3">{house.sign}</td>
                <td className="px-3 py-3">{house.signLord}</td>
                <td className="px-3 py-3">
                  {planets.length
                    ? planets.map((planet) => planet.name).join(", ")
                    : "-"}
                </td>
                <td className="px-3 py-3">{house.theme}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

const PredictionTable = ({
  rows,
}: {
  rows?: KundliAnalysis["prediction_table"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)]">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Prediction table
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-white/66 text-[var(--shreem-gold-deep)]">
            <tr>
              {["Area", "Chart basis", "Prediction", "Advice"].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-3 font-semibold uppercase tracking-[0.14em]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.area}-${index}`}
                className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
              >
                <td className="px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                  {row.area}
                </td>
                <td className="px-3 py-3">{row.chart_basis}</td>
                <td className="px-3 py-3">{row.prediction}</td>
                <td className="px-3 py-3">{row.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PrashnaChartView = ({ result }: { result: PrashnaResult }) => {
  const chart = result.chart

  if (!chart) {
    return null
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] border border-[rgba(13,129,126,0.16)] bg-[linear-gradient(135deg,rgba(13,129,126,0.08),rgba(254,248,233,0.78))] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
          Calculated chart
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
          {chart.generatedAtLocal} · {chart.city.name}, {chart.city.region}
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
          {chart.calculationSystem}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ChartMiniCard
          label="Lagna"
          value={`${chart.ascendant} ${formatDegree(chart.ascendantDegree)}`}
          detail={`${chart.ascendantNakshatra} pada ${chart.ascendantPada}`}
        />
        <ChartMiniCard
          label="Moon"
          value={`${chart.moonSign} ${formatDegree(chart.moonDegree)}`}
          detail={`${chart.nakshatra} pada ${chart.nakshatraPada}`}
        />
        <ChartMiniCard
          label="Tithi"
          value={chart.tithi}
          detail={`${chart.paksha} paksha`}
        />
        <ChartMiniCard
          label="Panchang"
          value={chart.yoga}
          detail={`${chart.karana} karana · ${chart.weekday}`}
        />
      </div>

      {result.answer && (
        <div className="grid gap-3">
          {[
            ["Answer", result.answer],
            ["Chart summary", result.chart_summary],
            ["Direct indication", result.direct_indication],
            ["House focus", result.house_focus],
            ["Favorable timing", result.favorable_timing],
            ["Caution", result.caution],
            ["Next step", result.next_step],
          ].map(([label, value]) =>
            value ? (
              <div
                key={label}
                className="rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                  {label}
                </p>
                <p className="mt-2 break-words text-sm leading-7 text-[var(--shreem-muted)]">
                  {value}
                </p>
              </div>
            ) : null
          )}
        </div>
      )}

      {Boolean(result.key_chart_factors?.length || chart.prashnaFactors.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Key chart factors
          </p>
          <div className="mt-3 grid gap-2">
            {(result.key_chart_factors?.length
              ? result.key_chart_factors
              : chart.prashnaFactors
            ).map((factor, index) => (
              <p
                key={`${factor}-${index}`}
                className="rounded-[14px] bg-white/68 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
              >
                {factor}
              </p>
            ))}
          </div>
        </div>
      )}

      {result.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[rgba(255,248,233,0.84)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.expert_call_reason ||
              "This question is better reviewed with a human astrologer before acting."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-astrology-30-minute-call"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-2.5 text-sm font-semibold text-white small:w-auto"
          >
            Book Sanjay Kumar Pandey
          </LocalizedClientLink>
        </div>
      )}

      {chart.planets.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Graha positions
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chart.planets.map((planet) => (
              <PlanetCard key={planet.key} planet={planet} />
            ))}
          </div>
        </div>
      )}

      {chart.houses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Whole-sign house chart
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chart.houses.map((house) => (
              <HouseCard key={house.house} house={house} />
            ))}
          </div>
        </div>
      )}

      <p className="rounded-[18px] border border-[var(--shreem-border)] bg-white/52 px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
        {chart.accuracyNote}
      </p>
    </div>
  )
}

const getPlanetsByHouse = (chart?: PrashnaChart) => {
  if (!chart) {
    return new Map<number, PrashnaPlanet[]>()
  }

  return chart.planets.reduce((map, planet) => {
    const list = map.get(planet.house) || []
    list.push(planet)
    map.set(planet.house, list)
    return map
  }, new Map<number, PrashnaPlanet[]>())
}

const housePositions: Record<number, string> = {
  1: "left-1/2 top-[7%] -translate-x-1/2",
  2: "left-[23%] top-[18%] -translate-x-1/2",
  3: "left-[9%] top-1/2 -translate-y-1/2",
  4: "left-[23%] bottom-[18%] -translate-x-1/2",
  5: "left-1/2 bottom-[7%] -translate-x-1/2",
  6: "right-[23%] bottom-[18%] translate-x-1/2",
  7: "right-[9%] top-1/2 -translate-y-1/2",
  8: "right-[23%] top-[18%] translate-x-1/2",
  9: "left-1/2 top-[31%] -translate-x-1/2",
  10: "left-[31%] top-1/2 -translate-x-1/2 -translate-y-1/2",
  11: "left-1/2 bottom-[31%] -translate-x-1/2",
  12: "right-[31%] top-1/2 translate-x-1/2 -translate-y-1/2",
}

const NorthIndianChart = ({ chart }: { chart?: PrashnaChart }) => {
  const planetsByHouse = getPlanetsByHouse(chart)

  if (!chart) {
    return null
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[430px] overflow-hidden rounded-[24px] border border-[rgba(212,161,38,0.28)] bg-[rgba(255,252,248,0.86)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_40px_rgba(11,39,53,0.08)]">
      <svg
        className="absolute inset-0 h-full w-full text-[rgba(156,105,18,0.34)]"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="94" height="94" rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M50 3 L97 50 L50 97 L3 50 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 3 L97 97 M97 3 L3 97 M50 3 L50 97 M3 50 L97 50" fill="none" stroke="currentColor" strokeWidth="0.75" />
      </svg>

      {chart.houses.map((house) => (
        <div
          key={house.house}
          className={`absolute ${housePositions[house.house]} w-[27%] text-center`}
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)] small:text-[0.68rem]">
            {house.house === 1 ? "Asc " : ""}H{house.house} {house.sign.slice(0, 3)}
          </p>
          <p className="mt-0.5 line-clamp-3 text-[0.66rem] font-semibold leading-4 text-[var(--shreem-ink)] small:text-[0.72rem]">
            {(planetsByHouse.get(house.house) || [])
              .map((planet) => planet.name.slice(0, 2))
              .join(" ")}
          </p>
        </div>
      ))}
    </div>
  )
}

const HistoryPanel = ({
  items,
  onSelect,
}: {
  items: AstrologyHistoryItem[]
  onSelect: (item: AstrologyHistoryItem) => void
}) => (
  <div className="brand-card px-4 py-4">
    <p className="brand-kicker">Recent history</p>
    {!items.length && (
      <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
        Your last Prashna, Kundli, and matchmaking sessions will appear here
        after you run them.
      </p>
    )}
    <div className="mt-3 grid gap-2">
      {items.slice(0, 8).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="rounded-[16px] border border-[var(--shreem-border)] bg-white/62 px-3 py-3 text-left transition hover:border-[rgba(13,129,126,0.32)]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {item.title}
            </p>
            <span className="rounded-full bg-[rgba(13,129,126,0.08)] px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--shreem-ink)]">
              {item.type}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--shreem-muted)]">
            {item.summary}
          </p>
        </button>
      ))}
    </div>
  </div>
)

const InsightList = ({
  title,
  items,
}: {
  title: string
  items?: string[]
}) => {
  if (!items?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <p
            key={`${title}-${item}-${index}`}
            className="rounded-[14px] bg-white/68 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

const KundliResultView = ({
  result,
  onPrint,
}: {
  result: KundliResult
  onPrint: () => void
}) => {
  const chart = result.chart

  if (!chart) {
    return null
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <NorthIndianChart chart={chart} />
        <div className="grid gap-3">
          <ChartMiniCard
            label="Lagna"
            value={`${chart.ascendant} ${formatDegree(chart.ascendantDegree)}`}
            detail={`${chart.ascendantNakshatra} pada ${chart.ascendantPada}`}
          />
          <ChartMiniCard
            label="Rashi"
            value={`${chart.moonSign} ${formatDegree(chart.moonDegree)}`}
            detail={`${chart.nakshatra} pada ${chart.nakshatraPada}`}
          />
          <ChartMiniCard
            label="Birth panchang"
            value={chart.tithi}
            detail={`${chart.yoga} yoga · ${chart.karana} karana`}
          />
        </div>
      </div>

      <DashaCard chart={chart} />

      <div className="grid gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            House information
          </p>
          <HouseTable chart={chart} />
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Graha table
          </p>
          <PlanetTable chart={chart} />
        </div>
      </div>

      <button
        type="button"
        onClick={onPrint}
        className="w-full rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white small:w-fit"
      >
        Download PDF-ready Kundli
      </button>

      {result.analysis && (
        <div className="grid gap-3">
          {[
            ["Summary", result.analysis.summary],
            ["Person information", result.analysis.person_information],
            ["Temperament", result.analysis.temperament],
            ["Career direction", result.analysis.career_direction],
            ["Relationship pattern", result.analysis.relationship_pattern],
            ["Health caution", result.analysis.health_caution],
            ["Current period", result.analysis.current_period_analysis],
            ["Spiritual guidance", result.analysis.spiritual_guidance],
          ].map(([label, value]) =>
            value ? (
              <div
                key={label}
                className="rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
                  {value}
                </p>
              </div>
            ) : null
          )}
        </div>
      )}

      <PredictionTable rows={result.analysis?.prediction_table} />

      <div className="grid gap-3 xl:grid-cols-2">
        <InsightList
          title="Behavioral traits"
          items={result.analysis?.behavioral_traits}
        />
        <InsightList title="Strengths" items={result.analysis?.strengths} />
        <InsightList title="Life themes" items={result.analysis?.life_themes} />
        <InsightList
          title="Likely issues"
          items={result.analysis?.likely_challenges}
        />
        <InsightList
          title="Issue analysis"
          items={result.analysis?.issue_analysis}
        />
        <InsightList
          title="Practical solutions"
          items={result.analysis?.practical_solutions}
        />
      </div>

      {Boolean(result.analysis?.sub_question_answers?.length) && (
        <div className="rounded-[20px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.74)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Your chart questions
          </p>
          <div className="mt-3 grid gap-3">
            {result.analysis?.sub_question_answers?.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
              >
                <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
                  {item.question}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
                  {item.answer}
                </p>
                <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.76)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  Chart reason: {item.chart_reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 small:grid-cols-2">
        <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Lagna stone
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--shreem-ink)]">
            {result.stones?.lagna?.primary}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
            {result.stones?.lagna?.sign} lagna, lord {result.stones?.lagna?.lord}.
            {result.stones?.lagna?.caution}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Rashi stone
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--shreem-ink)]">
            {result.stones?.rashi?.primary}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
            {result.stones?.rashi?.sign} rashi, lord {result.stones?.rashi?.lord}.
            {result.stones?.rashi?.caution}
          </p>
        </div>
      </div>

      {Boolean(result.analysis?.special_cases?.length || result.detected_yogas?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Special cases checked
          </p>
          <div className="mt-3 grid gap-2">
            {(result.analysis?.special_cases?.length
              ? result.analysis.special_cases
              : result.detected_yogas || []
            ).map((item, index) => (
              <p
                key={`${item}-${index}`}
                className="rounded-[14px] bg-white/68 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      )}

      {Boolean(result.analysis?.upaay?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Upaay
          </p>
          <div className="mt-3 grid gap-2">
            {result.analysis?.upaay?.map((item, index) => (
              <p
                key={`${item}-${index}`}
                className="rounded-[14px] bg-white/68 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      )}

      {Boolean(result.analysis?.shreem_product_suggestions?.length) && (
        <div className="rounded-[20px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.74)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Shreem ritual support
          </p>
          <div className="mt-3 grid gap-3">
            {result.analysis?.shreem_product_suggestions?.map((item) => (
              <LocalizedClientLink
                key={`${item.handle}-${item.title}`}
                href={`/products/${item.handle}`}
                className="rounded-[16px] border border-[var(--shreem-border)] bg-white/70 px-3 py-3"
              >
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {item.reason}
                </p>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      {result.analysis?.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[rgba(255,248,233,0.84)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.expert_call_reason ||
              "Gemstones, doshas, and pooja decisions should be confirmed by a human astrologer."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-astrology-30-minute-call"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-2.5 text-sm font-semibold text-white small:w-auto"
          >
            Book Sanjay Kumar Pandey
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}

const MatchPersonFields = ({
  title,
  value,
  onChange,
}: {
  title: string
  value: ReturnType<typeof emptyMatchPerson>
  onChange: (value: ReturnType<typeof emptyMatchPerson>) => void
}) => (
  <div className="rounded-[22px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
    <p className="text-sm font-semibold text-[var(--shreem-ink)]">{title}</p>
    <div className="mt-4 grid gap-3">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Name
        </span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
          placeholder={`${title} name`}
        />
      </label>
      <div className="grid gap-3 small:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Birth date
          </span>
          <input
            type="date"
            value={value.birthDate}
            onChange={(event) =>
              onChange({ ...value, birthDate: event.target.value })
            }
            className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Birth time
          </span>
          <input
            type="time"
            value={value.birthTime}
            onChange={(event) =>
              onChange({ ...value, birthTime: event.target.value })
            }
            className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Birth city
        </span>
        <select
          value={value.cityId}
          onChange={(event) => onChange({ ...value, cityId: event.target.value })}
          className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
        >
          {ASTROLOGY_CITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}, {item.region}
            </option>
          ))}
        </select>
      </label>
    </div>
  </div>
)

const MatchmakingResultView = ({ result }: { result: MatchmakingResult }) => {
  const percentage =
    result.analysis?.percentage_suggestion ?? result.compatibility?.percentage ?? 0
  const recommendation =
    result.analysis?.recommendation ||
    result.compatibility?.deterministicRecommendation ||
    "caution"
  const recommendationLabel =
    recommendation === "go"
      ? "Good to proceed"
      : recommendation === "avoid"
      ? "Do not proceed without expert review"
      : "Proceed carefully"

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] border border-[rgba(212,161,38,0.26)] bg-[rgba(255,248,233,0.82)] px-5 py-5">
        <p className="brand-kicker">Marriage compatibility</p>
        <div className="mt-3 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-[3rem] font-semibold leading-none text-[var(--shreem-ink)]">
              {percentage}%
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--shreem-muted)]">
              {recommendationLabel}
            </p>
          </div>
          <div className="rounded-full border border-[var(--shreem-border)] bg-white/70 px-4 py-2 text-sm font-semibold capitalize text-[var(--shreem-ink)]">
            {recommendation}
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)]">
          {result.analysis?.decision_reason || result.analysis?.summary}
        </p>
      </div>

      <div className="grid gap-3 small:grid-cols-2">
        <ChartMiniCard
          label={`${result.girl?.profile?.name || "Girl"} chart`}
          value={`${result.girl?.chart?.ascendant || "-"} Lagna · ${
            result.girl?.chart?.moonSign || "-"
          } Moon`}
        />
        <ChartMiniCard
          label={`${result.boy?.profile?.name || "Boy"} chart`}
          value={`${result.boy?.chart?.ascendant || "-"} Lagna · ${
            result.boy?.chart?.moonSign || "-"
          } Moon`}
        />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[var(--shreem-border)] bg-white/70">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[rgba(255,248,233,0.92)] text-xs uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
              <tr>
                <th className="px-4 py-3">Koota</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {(result.compatibility?.scores || []).map((score) => (
                <tr key={score.name} className="border-t border-[var(--shreem-border)]">
                  <td className="px-4 py-3 font-semibold text-[var(--shreem-ink)]">
                    {score.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--shreem-muted)]">
                    {score.score}/{score.max}
                  </td>
                  <td className="px-4 py-3 text-[var(--shreem-muted)]">
                    {score.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <InsightList title="Strengths" items={result.analysis?.strengths} />
        <InsightList title="Concerns" items={result.analysis?.concerns} />
        <InsightList
          title="Family discussion points"
          items={result.analysis?.family_discussion_points}
        />
        <InsightList title="Remedies" items={result.analysis?.remedies} />
      </div>

      {result.analysis?.marriage_timing_note && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="brand-kicker">Timing note</p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.marriage_timing_note}
          </p>
        </div>
      )}

      {result.analysis?.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[rgba(255,248,233,0.84)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.expert_call_reason ||
              "Marriage matching should be confirmed with a human astrologer before final decisions."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-astrology-30-minute-call"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-2.5 text-sm font-semibold text-white small:w-auto"
          >
            Book Sanjay Kumar Pandey
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}

const escapeHtml = (value?: string | number) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }

    return entities[char] || char
  })

const printKundliReport = (result: KundliResult) => {
  if (!result.chart || typeof window === "undefined") {
    return
  }

  const chart = result.chart
  const analysis = result.analysis
  const profile = result.profile
  const dasha = chart.dasha
  const win = window.open("", "_blank", "width=900,height=1200")

  if (!win) {
    window.print()
    return
  }

  win.document.write(`<!doctype html>
<html>
<head>
  <title>Shreem Kundli Report</title>
  <style>
    body{font-family:Georgia,'Times New Roman',serif;color:#0b2735;background:#fffaf1;margin:32px;line-height:1.55}
    h1{font-size:34px;margin:0 0 8px}
    h2{font-size:20px;margin:28px 0 8px;color:#7a5412}
    .card{border:1px solid #dbc99e;border-radius:18px;padding:18px;margin:14px 0;background:#fff}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .small{font-size:13px;color:#516b75}
    table{width:100%;border-collapse:collapse;background:#fff;margin:14px 0}
    th,td{border:1px solid #dbc99e;padding:9px;text-align:left;vertical-align:top;font-size:13px}
    th{color:#7a5412;background:#fff4d8;text-transform:uppercase;letter-spacing:.08em}
    ul{padding-left:20px}
    @media print{button{display:none} body{margin:18px;background:white}}
  </style>
</head>
<body>
  <button onclick="window.print()">Save as PDF</button>
  <h1>Shreem Kundli Report</h1>
  <p class="small">${escapeHtml(profile?.name || "Native")} · ${escapeHtml(profile?.birth_date)} ${escapeHtml(profile?.birth_time)} · ${escapeHtml(profile?.city)}</p>
  <div class="grid">
    <div class="card"><strong>Lagna</strong><br/>${escapeHtml(chart.ascendant)} ${escapeHtml(chart.ascendantDegree)} deg<br/><span class="small">${escapeHtml(chart.ascendantNakshatra)} pada ${escapeHtml(chart.ascendantPada)}</span></div>
    <div class="card"><strong>Rashi</strong><br/>${escapeHtml(chart.moonSign)} ${escapeHtml(chart.moonDegree)} deg<br/><span class="small">${escapeHtml(chart.nakshatra)} pada ${escapeHtml(chart.nakshatraPada)}</span></div>
  </div>
  <h2>Vimshottari Dasha</h2>
  <div class="card"><p><strong>Mahadasha:</strong> ${escapeHtml(dasha?.mahadasha.lord)} (${escapeHtml(dasha?.mahadasha.startLabel)} - ${escapeHtml(dasha?.mahadasha.endLabel)})</p><p><strong>Antardasha:</strong> ${escapeHtml(dasha?.antardasha.lord)} (${escapeHtml(dasha?.antardasha.startLabel)} - ${escapeHtml(dasha?.antardasha.endLabel)})</p><p><strong>Pratyantar:</strong> ${escapeHtml(dasha?.pratyantar.lord)} (${escapeHtml(dasha?.pratyantar.startLabel)} - ${escapeHtml(dasha?.pratyantar.endLabel)})</p><p class="small">${escapeHtml(dasha?.note)}</p></div>
  <h2>Graha Positions</h2>
  <table><thead><tr><th>Graha</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra</th></tr></thead><tbody>${chart.planets.map((planet) => `<tr><td>${escapeHtml(planet.name)}</td><td>${escapeHtml(planet.sign)}</td><td>${escapeHtml(planet.signDegree)} deg</td><td>${escapeHtml(planet.house)}</td><td>${escapeHtml(planet.nakshatra)} pada ${escapeHtml(planet.pada)}${planet.retrograde ? " (retrograde)" : ""}</td></tr>`).join("")}</tbody></table>
  <h2>House Information</h2>
  <table><thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Planets</th><th>Theme</th></tr></thead><tbody>${chart.houses.map((house) => `<tr><td>${escapeHtml(house.house)}</td><td>${escapeHtml(house.sign)}</td><td>${escapeHtml(house.signLord)}</td><td>${escapeHtml(getHousePlanets(chart, house.house).map((planet) => planet.name).join(", ") || "-")}</td><td>${escapeHtml(house.theme)}</td></tr>`).join("")}</tbody></table>
  <h2>Prediction Table</h2>
  <table><thead><tr><th>Area</th><th>Chart Basis</th><th>Prediction</th><th>Advice</th></tr></thead><tbody>${(analysis?.prediction_table || []).map((row) => `<tr><td>${escapeHtml(row.area)}</td><td>${escapeHtml(row.chart_basis)}</td><td>${escapeHtml(row.prediction)}</td><td>${escapeHtml(row.advice)}</td></tr>`).join("")}</tbody></table>
  <h2>Analysis</h2>
  <div class="card"><p>${escapeHtml(analysis?.summary)}</p><p>${escapeHtml(analysis?.person_information)}</p><p>${escapeHtml(analysis?.temperament)}</p><p>${escapeHtml(analysis?.career_direction)}</p><p>${escapeHtml(analysis?.relationship_pattern)}</p><p>${escapeHtml(analysis?.current_period_analysis)}</p><p>${escapeHtml(analysis?.spiritual_guidance)}</p></div>
  <h2>Traits, Issues, and Solutions</h2>
  <div class="card">
    <p><strong>Behavioral traits:</strong> ${(analysis?.behavioral_traits || []).map(escapeHtml).join(", ")}</p>
    <p><strong>Strengths:</strong> ${(analysis?.strengths || []).map(escapeHtml).join(", ")}</p>
    <p><strong>Life themes:</strong> ${(analysis?.life_themes || []).map(escapeHtml).join(", ")}</p>
    <p><strong>Likely issues:</strong> ${(analysis?.likely_challenges || []).map(escapeHtml).join(", ")}</p>
    <p><strong>Issue analysis:</strong> ${(analysis?.issue_analysis || []).map(escapeHtml).join(", ")}</p>
    <p><strong>Practical solutions:</strong> ${(analysis?.practical_solutions || []).map(escapeHtml).join(", ")}</p>
  </div>
  <h2>Chart Questions</h2>
  <div class="card"><ul>${(analysis?.sub_question_answers || []).map((item) => `<li><strong>${escapeHtml(item.question)}</strong><br/>${escapeHtml(item.answer)}<br/><span class="small">Chart reason: ${escapeHtml(item.chart_reason)}</span></li>`).join("")}</ul></div>
  <h2>Special Cases Checked</h2>
  <div class="card"><ul>${(analysis?.special_cases || result.detected_yogas || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
  <h2>Upaay</h2>
  <div class="card"><ul>${(analysis?.upaay || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
  <h2>General Stone Indicators</h2>
  <div class="card"><p>Lagna: ${escapeHtml(result.stones?.lagna?.primary)} (${escapeHtml(result.stones?.lagna?.sign)})</p><p>Rashi: ${escapeHtml(result.stones?.rashi?.primary)} (${escapeHtml(result.stones?.rashi?.sign)})</p><p class="small">${escapeHtml(result.stones?.caution)}</p></div>
</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

const parseLocalHistory = (): AstrologyHistoryItem[] => {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    const items = raw ? JSON.parse(raw) : []

    if (!Array.isArray(items)) {
      return []
    }

    return items
      .filter((item) => item?.id && item?.title)
      .slice(0, 12) as AstrologyHistoryItem[]
  } catch {
    return []
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}

const normalizeUsageHistory = (item: unknown): AstrologyHistoryItem | null => {
  const source = asRecord(item)
  const input = asRecord(source.input)
  const response = asRecord(source.response)
  const profile = asRecord(response.profile)
  const tool = String(source.tool || "astrology")
  const type: AstrologyHistoryItem["type"] = tool.includes("matchmaking")
    ? "Matchmaking"
    : tool.includes("kundli")
    ? "Kundli"
    : "Prashna"
  const title =
    type === "Matchmaking"
      ? `${String(asRecord(asRecord(response.girl).profile).name || "Girl")} + ${String(
          asRecord(asRecord(response.boy).profile).name || "Boy"
        )}`
      : type === "Kundli"
      ? `${String(profile.name || input.name || "Generated")} Kundli`
      : String(input.question || "Prashna session")
  const summary =
    String(
      response.answer ||
        asRecord(response.analysis).summary ||
        asRecord(response.analysis).decision_reason ||
        ""
    ) ||
    String(response.chart_summary || "Saved astrology session")
  const createdAt = String(source.created_at || new Date().toISOString())

  return {
    id: String(source.id || `${tool}-${createdAt}-${title}`),
    type,
    title,
    createdAt,
    summary,
    synced: true,
    response: source.response as
      | PrashnaResult
      | KundliResult
      | MatchmakingResult
      | undefined,
  }
}

const mergeHistory = (items: AstrologyHistoryItem[]) => {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }

    seen.add(item.id)
    return true
  })
}

export default function AstrologyExperience({
  customerEmail,
  customerName,
}: {
  customerEmail: string
  customerName?: string
}) {
  const [activeTab, setActiveTab] = useState<AstrologyTab>("muhurth")
  const [language, setLanguage] = useState<AstrologyLanguage>("english")
  const [languageReady, setLanguageReady] = useState(false)
  const [cityId, setCityId] = useState("rewa")
  const [date, setDate] = useState(() => getTodayDateString())
  const [question, setQuestion] = useState("")
  const [prashna, setPrashna] = useState<PrashnaResult | null>(null)
  const [loadingPrashna, setLoadingPrashna] = useState(false)
  const [hindiCalendar, setHindiCalendar] = useState<HindiCalendarDay | null>(
    null
  )
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [history, setHistory] = useState<AstrologyHistoryItem[]>([])
  const [kundliForm, setKundliForm] = useState({
    name: customerName || "",
    gender: "",
    birthDate: "",
    birthTime: "",
    cityId: "rewa",
    subQuestions: ["", "", ""],
  })
  const [kundliResult, setKundliResult] = useState<KundliResult | null>(null)
  const [loadingKundli, setLoadingKundli] = useState(false)
  const [matchmakingForm, setMatchmakingForm] = useState({
    girl: emptyMatchPerson(),
    boy: emptyMatchPerson(),
  })
  const [matchmakingResult, setMatchmakingResult] =
    useState<MatchmakingResult | null>(null)
  const [loadingMatchmaking, setLoadingMatchmaking] = useState(false)
  const city = getCityById(cityId)
  const muhurat = useMemo(
    () => calculateDailyMuhurat({ city, date }),
    [city, date]
  )
  const bestDaySlots = muhurat.daySlots.filter(
    (slot) => slot.quality === "auspicious"
  )

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY)

    if (saved === "hindi" || saved === "hinglish") {
      setLanguage(saved)
    }

    setLanguageReady(true)
  }, [])

  useEffect(() => {
    if (!languageReady) {
      return
    }

    window.localStorage.setItem(LANGUAGE_KEY, language)
    document.documentElement.lang =
      language === "hindi" ? "hi" : language === "hinglish" ? "hi-Latn" : "en"
  }, [language, languageReady])

  useEffect(() => {
    let active = true

    setLoadingCalendar(true)
    fetch(
      `/api/astrology/hindi-calendar?cityId=${encodeURIComponent(
        cityId
      )}&date=${encodeURIComponent(date)}`,
      { cache: "no-store" }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: HindiCalendarDay | null) => {
        if (active) {
          setHindiCalendar(data)
        }
      })
      .catch(() => {
        if (active) {
          setHindiCalendar(null)
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCalendar(false)
        }
      })

    return () => {
      active = false
    }
  }, [cityId, date])

  useEffect(() => {
    const localHistory = parseLocalHistory()
    setHistory(localHistory)

    fetch("/api/astrology/history", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const remoteItems = Array.isArray(data?.items)
          ? data.items
              .map((item: unknown) => normalizeUsageHistory(item))
              .filter(Boolean)
          : []

        if (remoteItems.length) {
          const localFallbackItems = localHistory.filter(
            (item) => item.synced === false
          )
          const next = mergeHistory([
            ...remoteItems,
            ...localFallbackItems,
          ]).slice(0, 12)

          setHistory(next)

          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              HISTORY_KEY,
              JSON.stringify(localFallbackItems.slice(0, 12))
            )
          }
        }
      })
      .catch(() => null)
  }, [])

  const rememberHistory = (
    item: AstrologyHistoryItem,
    options: { persistLocal?: boolean } = {}
  ) => {
    setHistory((current) => {
      const nextItem = {
        ...item,
        synced: !options.persistLocal,
      }
      const next = mergeHistory([nextItem, ...current]).slice(0, 12)

      if (typeof window !== "undefined" && options.persistLocal) {
        const fallbackItems = next.filter((historyItem) => !historyItem.synced)
        window.localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(fallbackItems.slice(0, 12))
        )
      }

      return next
    })
  }

  const askPrashna = async () => {
    setLoadingPrashna(true)
    setPrashna(null)

    const response = await fetch("/api/astrology/prashna", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        cityId,
        language,
      }),
      cache: "no-store",
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as PrashnaResult | null
    const result =
      data || ({
        message: "Prashna AI could not answer right now. Please try again.",
      } satisfies PrashnaResult)

    setPrashna(result)

    if (result.chart && result.answer) {
      rememberHistory({
        id: `prashna-${Date.now()}`,
        type: "Prashna",
        title: question.trim().slice(0, 56),
        createdAt: new Date().toISOString(),
        summary: result.answer,
        response: result,
      }, {
        persistLocal: !result.usage_synced,
      })
    }

    setLoadingPrashna(false)
  }

  const generateKundli = async () => {
    setLoadingKundli(true)
    setKundliResult(null)

    const response = await fetch("/api/astrology/kundli", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...kundliForm,
        language,
      }),
      cache: "no-store",
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as KundliResult | null
    const result =
      data || ({
        message: "Kundli AI could not generate the chart right now.",
      } satisfies KundliResult)

    setKundliResult(result)

    if (result.chart) {
      rememberHistory({
        id: `kundli-${Date.now()}`,
        type: "Kundli",
        title: `${result.profile?.name || kundliForm.name || "Generated"} Kundli`,
        createdAt: new Date().toISOString(),
        summary:
          result.analysis?.summary ||
          result.detected_yogas?.[0] ||
          "Birth chart generated",
        response: result,
      }, {
        persistLocal: !result.usage_synced,
      })
    }

    setLoadingKundli(false)
  }

  const generateMatchmaking = async () => {
    setLoadingMatchmaking(true)
    setMatchmakingResult(null)

    const response = await fetch("/api/astrology/matchmaking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...matchmakingForm,
        language,
      }),
      cache: "no-store",
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as
      | MatchmakingResult
      | null
    const result =
      data || ({
        message:
          "Matchmaking AI could not generate the compatibility reading right now.",
      } satisfies MatchmakingResult)

    setMatchmakingResult(result)

    if (result.compatibility) {
      rememberHistory(
        {
          id: `matchmaking-${Date.now()}`,
          type: "Matchmaking",
          title: `${matchmakingForm.girl.name || "Girl"} + ${
            matchmakingForm.boy.name || "Boy"
          }`,
          createdAt: new Date().toISOString(),
          summary:
            result.analysis?.summary ||
            result.analysis?.decision_reason ||
            `Compatibility ${result.compatibility.percentage || 0}%`,
          response: result,
        },
        {
          persistLocal: !result.usage_synced,
        }
      )
    }

    setLoadingMatchmaking(false)
  }

  const selectHistoryItem = (item: AstrologyHistoryItem) => {
    if (item.type === "Matchmaking") {
      setMatchmakingResult(item.response as MatchmakingResult)
      setActiveTab("matchmaking")
      return
    }

    if (item.type === "Kundli") {
      setKundliResult(item.response as KundliResult)
      setActiveTab("kundli")
      return
    }

    setPrashna(item.response as PrashnaResult)
    setActiveTab("prashna")
  }

  const LocationDateControls = ({ showDate = true }: { showDate?: boolean }) => (
    <div className="brand-card grid gap-3 px-4 py-4 small:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
          City
        </span>
        <select
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-3 text-sm text-[var(--shreem-ink)] outline-none"
        >
          {ASTROLOGY_CITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}, {item.region}
            </option>
          ))}
        </select>
      </label>
      {showDate && (
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-3 text-sm text-[var(--shreem-ink)] outline-none"
          />
        </label>
      )}
    </div>
  )

  const LanguageControls = () => (
    <div className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
        Site and AI language
      </span>
      <div className="grid grid-cols-3 gap-2">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            className={`rounded-[16px] border px-3 py-3 text-left transition ${
              language === option.value
                ? "border-[rgba(212,161,38,0.45)] bg-[rgba(255,248,233,0.88)] text-[var(--shreem-ink)]"
                : "border-[var(--shreem-border)] bg-white/62 text-[var(--shreem-muted)]"
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="mt-1 block text-[0.68rem] leading-4">
              {option.detail}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 small:gap-8">
      <section className="brand-surface overflow-hidden px-5 py-7 small:px-8 small:py-9">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="brand-kicker">Astrology desk</p>
            <h2 className="mt-3 max-w-[14ch] text-[2.3rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.5rem]">
              Shreem astrology tools
            </h2>
            <p className="mt-4 max-w-[52rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Explore Muhurth, Hindu Calendar, Prashna Kundli, and full Kundli
              generation in one focused workspace.
            </p>
          </div>

          <div className="brand-card px-4 py-4">
            <p className="brand-kicker">Account</p>
            <p className="mt-2 break-words text-sm font-semibold text-[var(--shreem-ink)]">
              {customerEmail}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Your recent Prashna and Kundli sessions appear in history.
            </p>
            <div className="mt-4">
              <LanguageControls />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 min-[520px]:grid-cols-2 xl:grid-cols-4">
          {astrologyTabs.map((tab) => {
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[18px] border px-4 py-4 text-left transition ${
                  active
                    ? "border-[rgba(212,161,38,0.45)] bg-[rgba(255,248,233,0.88)] shadow-[0_16px_34px_rgba(18,63,99,0.12)]"
                    : "border-[var(--shreem-border)] bg-white/56 hover:border-[rgba(13,129,126,0.28)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {tab.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {tab.description}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {activeTab === "muhurth" && (
        <>
          <section className="brand-surface overflow-hidden px-5 py-7 small:px-8 small:py-9">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
              <div>
                <p className="brand-kicker">Subh Muhurth</p>
                <h2 className="mt-3 max-w-[13ch] text-[2.3rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
                  Today&apos;s auspicious windows
                </h2>
                <p className="mt-4 max-w-[48rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                  Choose your city and date. Sunrise, sunset, day Choghadiya,
                  and night Choghadiya are calculated for that local place.
                </p>
              </div>
              <LocationDateControls />
            </div>

            <div className="mt-6 grid gap-3 small:grid-cols-3">
              <div className="brand-card px-4 py-4">
                <p className="brand-kicker">Sunrise</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--shreem-ink)]">
                  {muhurat.sunriseLabel}
                </p>
              </div>
              <div className="brand-card px-4 py-4">
                <p className="brand-kicker">Sunset</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--shreem-ink)]">
                  {muhurat.sunsetLabel}
                </p>
              </div>
              <div className="brand-card px-4 py-4">
                <p className="brand-kicker">Best day slots</p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  {bestDaySlots
                    .map((slot) => `${slot.name} ${slot.startLabel}`)
                    .join(", ")}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="brand-card px-5 py-6 small:px-6">
              <p className="brand-kicker">Day Choghadiya</p>
              <h3 className="mt-2 text-[1.9rem] leading-none text-[var(--shreem-ink)]">
                {muhurat.weekday} daytime
              </h3>
              <div className="mt-5 grid gap-3 small:grid-cols-2">
                {muhurat.daySlots.map((slot) => (
                  <SlotCard key={`day-${slot.index}`} slot={slot} />
                ))}
              </div>
            </div>

            <div className="brand-card px-5 py-6 small:px-6">
              <p className="brand-kicker">Night Choghadiya</p>
              <h3 className="mt-2 text-[1.9rem] leading-none text-[var(--shreem-ink)]">
                Sunset to next sunrise
              </h3>
              <div className="mt-5 grid gap-3 small:grid-cols-2">
                {muhurat.nightSlots.map((slot) => (
                  <SlotCard key={`night-${slot.index}`} slot={slot} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "calendar" && (
        <section className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-start">
            <div>
              <p className="brand-kicker">Hindu calendar</p>
              <h3 className="mt-2 max-w-[13ch] text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.4rem]">
                Panchang, masa, and festivals
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)]">
                Select a date and city to view tithi, paksha, nakshatra,
                karana, Hindi month significance, and the month&apos;s major
                festival themes.
              </p>
              <div className="mt-5">
                <LocationDateControls />
              </div>
            </div>

            <div className="brand-card px-4 py-5 small:px-6">
              {loadingCalendar && (
                <p className="text-sm leading-7 text-[var(--shreem-muted)]">
                  Calculating Hindi calendar details...
                </p>
              )}
              {!loadingCalendar && !hindiCalendar && (
                <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  Unable to calculate Hindi calendar details right now.
                </p>
              )}
              {hindiCalendar && (
                <div className="grid gap-4">
                  <div className="grid gap-3 small:grid-cols-2">
                    <ChartMiniCard
                      label="Tithi"
                      value={hindiCalendar.tithi}
                      detail={`${hindiCalendar.paksha} paksha · ${hindiCalendar.weekday}`}
                    />
                    <ChartMiniCard
                      label="Hindi month"
                      value={`${hindiCalendar.month.name} (${hindiCalendar.month.commonName})`}
                      detail={`Solar anchor: ${hindiCalendar.month.sunSign}`}
                    />
                    <ChartMiniCard
                      label="Nakshatra"
                      value={hindiCalendar.nakshatra}
                      detail={`${hindiCalendar.yoga} yoga`}
                    />
                    <ChartMiniCard
                      label="Karana"
                      value={hindiCalendar.karana}
                      detail={`${hindiCalendar.city.name}, ${hindiCalendar.city.region}`}
                    />
                  </div>

                  <div className="rounded-[20px] border border-[rgba(13,129,126,0.14)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Month significance
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
                      {hindiCalendar.month.significance}
                    </p>
                    <p className="mt-3 rounded-[14px] bg-white/62 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                      Focus: {hindiCalendar.month.focus}
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-[rgba(212,161,38,0.22)] bg-[rgba(255,248,233,0.72)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Festival and vrat focus
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hindiCalendar.month.festivals.map((festival) => (
                        <span
                          key={festival}
                          className="rounded-full border border-[rgba(212,161,38,0.28)] bg-white/72 px-3 py-1.5 text-xs font-semibold text-[var(--shreem-ink)]"
                        >
                          {festival}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[var(--shreem-muted)]">
                      Exact festival observance can vary by local panchang,
                      sunrise, and regional tradition.
                    </p>
                  </div>

                  <p className="text-xs leading-5 text-[var(--shreem-muted)]">
                    {hindiCalendar.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "prashna" && (
        <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div>
              <p className="brand-kicker">Prashna Kundli</p>
              <h2 className="mt-2 max-w-[12ch] text-[2.4rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
                Ask one clear question
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                The chart is generated for the exact moment you ask, using the
                selected city. The AI reads the calculated Vedic factors and
                keeps chart facts separate from interpretation.
              </p>
              <div className="mt-5">
                <LocationDateControls showDate={false} />
              </div>
              <div className="mt-5 rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-4 py-4">
                <LanguageControls />
              </div>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: Is this a good time to start the planned work?"
                className="mt-5 min-h-[150px] w-full resize-none rounded-[22px] border border-[var(--shreem-border)] bg-white/80 px-4 py-4 text-sm leading-6 text-[var(--shreem-ink)] outline-none"
              />
              <button
                type="button"
                disabled={loadingPrashna || question.trim().length < 8}
                onClick={askPrashna}
                className="mt-4 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45 small:w-auto"
              >
                {loadingPrashna ? "Reading chart..." : "Ask Prashna"}
              </button>
            </div>

            <div className="grid gap-4">
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Result</p>
                {loadingPrashna && (
                  <LogoLoader
                    label="Reading the Prashna chart..."
                    detail="Calculating the moment chart, then asking Shreem AI for a concise Vedic interpretation."
                  />
                )}
                {!loadingPrashna && !prashna && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    Your answer will appear here with Lagna, Panchang, graha
                    positions, house chart, direct indication, timing, caution,
                    and next step.
                  </p>
                )}
                {prashna?.message && (
                  <p className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {prashna.message}
                  </p>
                )}
                {prashna?.chart && (
                  <div className="mt-4">
                    <PrashnaChartView result={prashna} />
                  </div>
                )}
              </div>
              <HistoryPanel items={history} onSelect={selectHistoryItem} />
            </div>
          </div>
        </section>
      )}

      {activeTab === "kundli" && (
        <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
          <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <div className="brand-card px-4 py-5 small:px-5">
              <p className="brand-kicker">Kundli generator</p>
              <h2 className="mt-2 text-[2.1rem] leading-none text-[var(--shreem-ink)]">
                Birth chart and PDF
              </h2>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Name
                  </span>
                  <input
                    value={kundliForm.name}
                    onChange={(event) =>
                      setKundliForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    placeholder="Full name"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Gender
                  </span>
                  <select
                    value={kundliForm.gender}
                    onChange={(event) =>
                      setKundliForm((current) => ({
                        ...current,
                        gender: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <div className="grid gap-3 small:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Birth date
                    </span>
                    <input
                      type="date"
                      value={kundliForm.birthDate}
                      onChange={(event) =>
                        setKundliForm((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Birth time
                    </span>
                    <input
                      type="time"
                      value={kundliForm.birthTime}
                      onChange={(event) =>
                        setKundliForm((current) => ({
                          ...current,
                          birthTime: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Birth city
                  </span>
                  <select
                    value={kundliForm.cityId}
                    onChange={(event) =>
                      setKundliForm((current) => ({
                        ...current,
                        cityId: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                  >
                    {ASTROLOGY_CITIES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}, {item.region}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <LanguageControls />
                </div>
                <div className="rounded-[20px] border border-[rgba(13,129,126,0.14)] bg-[rgba(240,248,246,0.62)] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Ask up to 3 chart questions
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    Optional. Keep each question specific so the reading can
                    answer it from the chart.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {kundliForm.subQuestions.map((question, index) => (
                      <input
                        key={`kundli-sub-question-${index}`}
                        value={question}
                        maxLength={220}
                        onChange={(event) =>
                          setKundliForm((current) => {
                            const nextQuestions = [...current.subQuestions]
                            nextQuestions[index] = event.target.value

                            return {
                              ...current,
                              subQuestions: nextQuestions,
                            }
                          })
                        }
                        className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                        placeholder={`Question ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={
                    loadingKundli ||
                    !kundliForm.birthDate ||
                    !kundliForm.birthTime
                  }
                  onClick={generateKundli}
                  className="mt-2 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingKundli ? "Generating Kundli..." : "Generate Kundli"}
                </button>
                <p className="text-xs leading-5 text-[var(--shreem-muted)]">
                  The generated stone indicators are general. Wear gemstones or
                  start major remedies only after expert review.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Generated chart</p>
                {loadingKundli && (
                  <LogoLoader
                    label="Generating your Kundli..."
                    detail="Preparing the North Indian chart, dasha context, yogas, house table, and AI reading."
                  />
                )}
                {!loadingKundli && !kundliResult && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    Your North Indian chart, graha positions, special case
                    checks, upaay, stone indicators, and PDF-ready report will
                    appear here.
                  </p>
                )}
                {kundliResult?.message && (
                  <p className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {kundliResult.message}
                  </p>
                )}
                {kundliResult?.chart && (
                  <div className="mt-4">
                    <KundliResultView
                      result={kundliResult}
                      onPrint={() => printKundliReport(kundliResult)}
                    />
                  </div>
                )}
              </div>
              <HistoryPanel items={history} onSelect={selectHistoryItem} />
            </div>
          </div>
        </section>
      )}

      {activeTab === "matchmaking" && (
        <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="brand-card px-4 py-5 small:px-5">
              <p className="brand-kicker">Kundli matchmaking</p>
              <h2 className="mt-2 max-w-[12ch] text-[2.2rem] leading-none text-[var(--shreem-ink)]">
                Marriage compatibility
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                Enter both birth details. Shreem calculates both sidereal
                charts, Ashtakoota-style score, dasha context, and a clear
                go/caution/avoid recommendation.
              </p>
              <div className="mt-5 grid gap-4">
                <MatchPersonFields
                  title="Girl"
                  value={matchmakingForm.girl}
                  onChange={(girl) =>
                    setMatchmakingForm((current) => ({ ...current, girl }))
                  }
                />
                <MatchPersonFields
                  title="Boy"
                  value={matchmakingForm.boy}
                  onChange={(boy) =>
                    setMatchmakingForm((current) => ({ ...current, boy }))
                  }
                />
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <LanguageControls />
                </div>
                <button
                  type="button"
                  disabled={
                    loadingMatchmaking ||
                    !matchmakingForm.girl.name ||
                    !matchmakingForm.girl.birthDate ||
                    !matchmakingForm.girl.birthTime ||
                    !matchmakingForm.boy.name ||
                    !matchmakingForm.boy.birthDate ||
                    !matchmakingForm.boy.birthTime
                  }
                  onClick={generateMatchmaking}
                  className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingMatchmaking
                    ? "Checking compatibility..."
                    : "Generate Matchmaking"}
                </button>
                <p className="text-xs leading-5 text-[var(--shreem-muted)]">
                  Marriage decisions should include family context, consent,
                  health, values, and expert review. This is a calculated
                  first-pass reading.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Compatibility result</p>
                {loadingMatchmaking && (
                  <LogoLoader
                    label="Matching both Kundlis..."
                    detail="Calculating Moon, nakshatra, guna score, dasha context, and the AI recommendation."
                  />
                )}
                {!loadingMatchmaking && !matchmakingResult && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    The result will show percentage suitability, Ashtakoota
                    breakdown, strengths, concerns, remedies, and whether the
                    wedding should proceed.
                  </p>
                )}
                {matchmakingResult?.message && (
                  <p className="mt-3 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    {matchmakingResult.message}
                  </p>
                )}
                {matchmakingResult?.compatibility && (
                  <div className="mt-4">
                    <MatchmakingResultView result={matchmakingResult} />
                  </div>
                )}
              </div>
              <HistoryPanel items={history} onSelect={selectHistoryItem} />
            </div>
          </div>
        </section>
      )}

      <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
        <p className="brand-kicker">Astrologer booking</p>
        <h2 className="mt-2 max-w-[15ch] text-[2.35rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
          Speak with Sanjay Kumar Pandey
        </h2>
        <p className="mt-4 max-w-[48rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
          AI can surface timing, chart factors, and general upaay. Gemstones,
          pooja decisions, major life calls, and strong dosha combinations
          should be reviewed directly with Sanjay Kumar Pandey ji.
        </p>
        <div className="mt-6 grid gap-4 small:grid-cols-2">
          {serviceCards.map((service) => (
            <div
              key={service.title}
              className="brand-card flex flex-col justify-between px-5 py-5"
            >
              <div>
                <p className="brand-kicker">{service.amount}</p>
                <h3 className="mt-2 text-[1.9rem] leading-none text-[var(--shreem-ink)]">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                  {service.description}
                </p>
              </div>
              <LocalizedClientLink
                href={service.href}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
              >
                Book with payment
              </LocalizedClientLink>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
