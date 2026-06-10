"use client"

import {
  ASTROLOGY_CITIES,
  HOUSE_THEMES,
  PANCHANG_SYSTEMS,
  SIGN_LORDS,
  calculateDailyMuhurat,
  getCityById,
  getTodayDateString,
  type HindiCalendarDay,
  type AstrologyCity,
  type MuhurtaSlot,
  type PrashnaChart,
  type PrashnaHouse,
  type PrashnaPlanet,
} from "@lib/util/astrology"
import LogoLoader from "@modules/common/components/logo-loader"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { type CSSProperties, useEffect, useMemo, useState } from "react"

type PrashnaResult = {
  chart?: PrashnaChart
  answer?: string
  chart_summary?: string
  direct_indication?: string
  house_focus?: string
  sub_question_answers?: {
    question: string
    answer: string
    chart_reason: string
  }[]
  expert_call_recommended?: boolean
  expert_call_reason?: string
  recommended_service?: string
  key_chart_factors?: string[]
  book_citations?: BookCitation[]
  favorable_timing?: string
  caution?: string
  next_step?: string
  message?: string
  retryable?: boolean
  usage_synced?: boolean
  wallet?: AiWallet
  quota?: AiQuota
}

type BookCitation = {
  citation: string
  relevance: string
}

type HindiCalendarMonthDay = {
  date: string
  day_number: number
  weekday: string
  tithi: string
  paksha: "Shukla" | "Krishna"
  nakshatra: string
  yoga: string
  karana: string
  month: HindiCalendarDay["month"]
}

type HindiCalendarMonth = {
  month: string
  city: AstrologyCity
  days: HindiCalendarMonthDay[]
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
  health_indicators?: string[]
  current_period_analysis?: string
  dasha_predictions?: {
    period: string
    chart_basis: string
    classical_basis: string
    prediction: string
    action: string
  }[]
  risk_watch?: {
    theme: string
    chart_basis: string
    dasha_trigger: string
    prevention: string
  }[]
  prediction_table?: {
    area: string
    chart_basis: string
    prediction: string
    advice: string
  }[]
  special_case_readings?: {
    case_name: string
    chart_basis: string
    classical_basis: string
    combined_effect: string
    timing: string
    solution: string
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
  targeted_remedies?: {
    pain_point: string
    chart_basis: string
    mantra_or_pooja: string
    daily_practice: string
  }[]
  shreem_product_suggestions?: {
    title: string
    handle: string
    product_url?: string
    image_url?: string
    reason: string
  }[]
  book_citations?: BookCitation[]
  planet_effects?: {
    planet: string
    placement: string
    life_area?: string
    activation_period?: string
    effect: string
    likely_effect?: string
    advice: string
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
    panchang_system_id?: string
    sub_questions?: string[]
    analysis_mode?: "standard"
    usage_units?: number
  }
  chart?: PrashnaChart
  detected_yogas?: string[]
  stones?: {
    trinal?: {
      house?: number
      label?: string
      sign?: string
      lord?: string
      primary?: string
      alternatives?: string[]
      chart_basis?: string
      caution?: string
    }[]
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
  health_indicators?: string[]
  targeted_remedy_seeds?: {
    pain_point: string
    chart_basis: string
    mantra_or_pooja: string
    daily_practice: string
  }[]
  analysis?: KundliAnalysis
  message?: string
  retryable?: boolean
  usage_synced?: boolean
  wallet?: AiWallet
  quota?: AiQuota
  packs?: AiCreditPack[]
  analysis_mode?: "standard"
  usage_units?: number
}

type MatchmakingResult = {
  girl?: {
    profile?: {
      name?: string
      birth_date?: string
      birth_time?: string
      city?: string
      panchang_system_id?: string
    }
    chart?: PrashnaChart
  }
  boy?: {
    profile?: {
      name?: string
      birth_date?: string
      birth_time?: string
      city?: string
      panchang_system_id?: string
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
    book_citations?: BookCitation[]
    expert_call_recommended?: boolean
    expert_call_reason?: string
  }
  message?: string
  retryable?: boolean
  usage_synced?: boolean
  wallet?: AiWallet
  quota?: AiQuota
  packs?: AiCreditPack[]
}

type LostItemResult = {
  chart?: PrashnaChart
  lochan?: {
    label?: string
    direction?: string
    retrieval?: string
    timing?: string
    meaning?: string
  }
  recoveryScore?: number
  answer?: string
  likely_location?: string
  direction?: string
  recovery_timing?: string
  search_steps?: string[]
  chart_reasoning?: string[]
  caution?: string
  ai_enhanced?: boolean
  message?: string
  retryable?: boolean
  usage_synced?: boolean
  wallet?: AiWallet
  quota?: AiQuota
  packs?: AiCreditPack[]
}

type AiQuota = {
  limit?: number
  used?: number
  remaining?: number
  requested_units?: number
  reset_at?: string
}

type AiWallet = {
  credit_balance?: number
  plan?: string
  plan_expires_at?: string | null
  pro_question_limit?: number
  pro_active?: boolean
}

type AiCreditPack = {
  id: string
  label: string
  credits: number
  price_inr: number
  product_handle: string
  plan?: string
  duration_days?: number
  pro_question_limit?: number
}

type AstrologyHistoryItem = {
  id: string
  type: "Prashna" | "Kundli" | "Matchmaking" | "Lost item"
  title: string
  createdAt: string
  summary: string
  synced?: boolean
  response?: PrashnaResult | KundliResult | MatchmakingResult | LostItemResult
}

type AstrologyTab =
  | "muhurth"
  | "calendar"
  | "prashna"
  | "lost-item"
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
    title: "Focused Jyotish call",
    amount: "Rs. 499",
    href: "/products/shreem-expert-jyotish-consultation",
    description:
      "15 minutes for one clear question, timing concern, or remedy review with Sanjay Kumar Pandey ji.",
  },
  {
    title: "Detailed Kundli call",
    amount: "Rs. 999",
    href: "/products/shreem-expert-jyotish-consultation",
    description:
      "30 minutes for chart context, gemstone caution, pooja direction, and practical next steps.",
  },
]

const grahaMedallions = [
  {
    key: "surya",
    label: "Surya",
    body: "Soul, authority, vitality",
    mark: "Su",
  },
  {
    key: "chandra",
    label: "Chandra",
    body: "Mind, comfort, emotion",
    mark: "Mo",
  },
  {
    key: "mangal",
    label: "Mangal",
    body: "Courage, land, action",
    mark: "Ma",
  },
  {
    key: "budh",
    label: "Budh",
    body: "Speech, trade, intellect",
    mark: "Me",
  },
  {
    key: "guru",
    label: "Guru",
    body: "Wisdom, dharma, counsel",
    mark: "Ju",
  },
  {
    key: "shukra",
    label: "Shukra",
    body: "Love, comfort, beauty",
    mark: "Ve",
  },
  {
    key: "shani",
    label: "Shani",
    body: "Karma, discipline, delays",
    mark: "Sa",
  },
  {
    key: "rahu",
    label: "Rahu",
    body: "Desire, rise, disruption",
    mark: "Ra",
  },
  {
    key: "ketu",
    label: "Ketu",
    body: "Moksha, cuts, insight",
    mark: "Ke",
  },
]

const zodiacGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

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
    id: "lost-item",
    label: "Lost item",
    description: "Nashta-Vastu Lochan",
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
const THEME_KEY = "shreem_astrology_theme_v1"

type AstrologyTheme = "day" | "night"

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

const normalizeCitySearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const cityLabel = (city: AstrologyCity) => `${city.name}, ${city.region}`

const findCityIdFromLabel = (value?: string) => {
  const normalized = normalizeCitySearch(value || "")

  if (!normalized) {
    return ""
  }

  const exact = ASTROLOGY_CITIES.find(
    (city) => normalizeCitySearch(cityLabel(city)) === normalized
  )

  if (exact) {
    return exact.id
  }

  const partial = ASTROLOGY_CITIES.find((city) => {
    const cityName = normalizeCitySearch(city.name)
    const regionName = normalizeCitySearch(city.region)

    return normalized.includes(cityName) && normalized.includes(regionName)
  })

  return partial?.id || ""
}

const parseDateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

const formatDateParts = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

const shiftMonth = (value: string, offset: number) => {
  const parsed = parseDateParts(value) || parseDateParts(getTodayDateString())
  const base = new Date((parsed?.year || 2026), (parsed?.month || 1) - 1 + offset, 1)

  return formatDateParts(base.getFullYear(), base.getMonth() + 1, 1)
}

const getCalendarMonthLabel = (value: string) => {
  const parsed = parseDateParts(value) || parseDateParts(getTodayDateString())
  const base = new Date(parsed?.year || 2026, (parsed?.month || 1) - 1, 1)

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(base)
}

const getCalendarMonthKey = (value: string) => {
  const parsed = parseDateParts(value) || parseDateParts(getTodayDateString())

  return `${parsed?.year || 2026}-${String(parsed?.month || 1).padStart(2, "0")}`
}

const getCompactTithi = (value?: string) => {
  if (!value) {
    return "Tithi"
  }

  return value
    .replace(/\s*\(\d+\)\s*/g, "")
    .replace(/^Shukla\s+/i, "S. ")
    .replace(/^Krishna\s+/i, "K. ")
    .trim()
}

const getCompactWeekday = (value?: string) =>
  value ? value.slice(0, 3) : "Day"

const buildCalendarGrid = (value: string) => {
  const parsed = parseDateParts(value) || parseDateParts(getTodayDateString())
  const year = parsed?.year || 2026
  const month = parsed?.month || 1
  const selected = parsed?.day || 1
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = getTodayDateString()

  return [
    ...Array.from({ length: firstDay }, (_, index) => ({
      key: `blank-${index}`,
      date: "",
      day: "",
      selected: false,
      today: false,
      weekend: false,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const dateString = formatDateParts(year, month, day)
      const weekday = new Date(year, month - 1, day).getDay()

      return {
        key: dateString,
        date: dateString,
        day: String(day),
        selected: day === selected,
        today: dateString === today,
        weekend: weekday === 0 || weekday === 6,
      }
    }),
  ]
}

const CityPicker = ({
  label = "Birth city",
  value,
  onChange,
}: {
  label?: string
  value: string
  onChange: (cityId: string) => void
}) => {
  const selectedCity = getCityById(value)
  const selectedLabel = cityLabel(selectedCity)
  const [query, setQuery] = useState(selectedLabel)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setQuery(selectedLabel)
  }, [selectedLabel])

  const normalizedQuery = normalizeCitySearch(query)
  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return ASTROLOGY_CITIES.slice(0, 48)
    }

    return ASTROLOGY_CITIES.filter((city) =>
      normalizeCitySearch(`${city.name} ${city.region}`).includes(normalizedQuery)
    ).slice(0, 72)
  }, [normalizedQuery])

  const chooseCity = (city: AstrologyCity) => {
    onChange(city.id)
    setQuery(cityLabel(city))
    setOpen(false)
  }

  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        {label}
      </span>
      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
              setQuery(cityLabel(getCityById(value)))
            }, 120)
          }}
          className="h-12 w-full rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
          placeholder="Search city"
        />
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-[16px] border border-[var(--shreem-border)] bg-white py-1 shadow-[0_18px_40px_rgba(18,63,99,0.16)]">
            {matches.length ? (
              matches.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    chooseCity(city)
                  }}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition hover:bg-[rgba(13,129,126,0.08)] ${
                    city.id === value ? "bg-[rgba(13,129,126,0.1)]" : ""
                  }`}
                >
                  <span className="font-semibold text-[var(--shreem-ink)]">
                    {city.name}
                  </span>
                  <span className="text-xs text-[var(--shreem-muted)]">
                    {city.region}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-[var(--shreem-muted)]">
                No matching city
              </p>
            )}
          </div>
        )}
      </div>
    </label>
  )
}

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

const formatHousePosition = (planet: PrashnaPlanet) => {
  const rashi = planet.rashiHouse || planet.house
  const bhava = planet.bhavaHouse || planet.house
  const impact =
    typeof planet.bhavaImpactPercent === "number"
      ? `, ${planet.bhavaImpactPercent}% ${planet.bhavaImpactState || "bhava"} impact`
      : ""

  if (rashi !== bhava) {
    return `House ${planet.house} (Rashi H${rashi}, Bhava H${bhava}${impact})`
  }

  return `House ${planet.house}${impact ? ` (${impact.replace(/^, /, "")})` : ""}`
}

const PlanetCard = ({ planet }: { planet: PrashnaPlanet }) => (
  <div className="min-w-0 rounded-[18px] border border-[var(--shreem-border)] bg-white/68 px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-[var(--shreem-ink)]">
          {planet.name}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
          {formatHousePosition(planet)}
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
    {planet.houseNote && (
      <p className="mt-2 text-[0.68rem] leading-5 text-[var(--shreem-muted)]">
        {planet.houseNote}
      </p>
    )}
    {typeof planet.bhavaCuspDegree === "number" && (
      <p className="mt-1 text-[0.68rem] leading-5 text-[var(--shreem-muted)]">
        Bhava madhya: {formatDegree(planet.bhavaCuspDegree)} in{" "}
        {typeof planet.bhavaCuspLongitude === "number"
          ? SIGNS[Math.floor(planet.bhavaCuspLongitude / 30)]
          : "this bhava"}
        {typeof planet.bhavaDistanceFromCusp === "number"
          ? ` · ${formatDegree(planet.bhavaDistanceFromCusp)} from cusp`
          : ""}
      </p>
    )}
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

const getHousePlanets = (
  chart: PrashnaChart,
  houseNumber: number,
  basis: "selected" | "rashi" | "bhava" = "selected"
) =>
  chart.planets.filter((planet) => {
    const house =
      basis === "rashi"
        ? planet.rashiHouse || planet.house
        : basis === "bhava"
        ? planet.bhavaHouse || planet.house
        : planet.house

    return house === houseNumber
  })

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
              <td className="px-3 py-3">{formatHousePosition(planet)}</td>
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
            {["House", "Sign", "Bhava madhya", "Lord", "Planets", "Theme"].map((heading) => (
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
                <td className="px-3 py-3">
                  {typeof house.cuspDegree === "number" && house.cuspSign
                    ? `${house.cuspSign} ${formatDegree(house.cuspDegree)}`
                    : "-"}
                </td>
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
    <div className="grid gap-4 relative">
      <div className="flex justify-center mb-4">
        <LogoLoader compact label="Shreem Prashna Kundli" />
      </div>

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

      <div className="grid gap-4 xl:grid-cols-2">
        <NorthIndianChart chart={chart} mode="lagna" title="Prashna Rashi chart" />
        <NorthIndianChart chart={chart} mode="bhava" title="Prashna Bhava Chalit" />
      </div>

      <BhavaChalitSummary chart={chart} />

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

      {Boolean(result.sub_question_answers?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Question-wise Prashna answer
          </p>
          <div className="mt-3 grid gap-3">
            {result.sub_question_answers?.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-[16px] border border-[var(--shreem-border)] bg-white/70 px-3 py-3"
              >
                <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
                  {index + 1}. {item.question}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
                  {item.answer}
                </p>
                <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.72)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  Chart reason: {item.chart_reason}
                </p>
              </div>
            ))}
          </div>
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

      <BookCitationList items={result.book_citations} />

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
            {chart.houseSystem?.label || "House chart"}
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

      <p className="mt-4 text-center text-xs text-[var(--shreem-muted)]">
        Disclaimer: All insights are AI-generated based on astrological principles.
      </p>
    </div>
  )
}

const LostItemResultView = ({ result }: { result: LostItemResult }) => {
  const chart = result.chart

  return (
    <div className="grid gap-4">
      {chart && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <NorthIndianChart
            chart={chart}
            mode="bhava"
            title="Lost item Prashna Bhava"
          />
          <div className="grid gap-3">
            <ChartMiniCard
              label="Lochan"
              value={result.lochan?.label || chart.nakshatra}
              detail={`${chart.nakshatra} pada ${chart.nakshatraPada}`}
            />
            <ChartMiniCard
              label="Recovery"
              value={`${Math.round(Number(result.recoveryScore || 0))}%`}
              detail={result.lochan?.retrieval || "Prashna signal"}
            />
            <ChartMiniCard
              label="Direction"
              value={result.direction || result.lochan?.direction || "Check chart"}
              detail={result.recovery_timing || result.lochan?.timing || "Timing"}
            />
          </div>
        </div>
      )}

      <div className="rounded-[22px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.74)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Four Eyes reading
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
          {result.answer}
        </p>
        {result.lochan?.meaning && (
          <p className="mt-2 rounded-[16px] bg-white/64 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
            {result.lochan.meaning}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Likely location", result.likely_location],
          ["Direction", result.direction],
          ["Timing", result.recovery_timing],
        ].map(([label, value]) =>
          value ? (
            <div
              key={label}
              className="rounded-[18px] border border-[var(--shreem-border)] bg-white/64 px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                {label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                {value}
              </p>
            </div>
          ) : null
        )}
      </div>

      {Boolean(result.search_steps?.length) && (
        <div className="rounded-[20px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Search sequence
          </p>
          <div className="mt-3 grid gap-2">
            {result.search_steps?.map((step, index) => (
              <p
                key={`${step}-${index}`}
                className="rounded-[14px] bg-white/72 px-3 py-2 text-sm leading-6 text-[var(--shreem-muted)]"
              >
                <span className="font-semibold text-[var(--shreem-ink)]">
                  {index + 1}.
                </span>{" "}
                {step}
              </p>
            ))}
          </div>
        </div>
      )}

      {Boolean(result.chart_reasoning?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Chart reasoning
          </p>
          <div className="mt-3 grid gap-2">
            {result.chart_reasoning?.map((reason, index) => (
              <p
                key={`${reason}-${index}`}
                className="rounded-[14px] bg-white/68 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
              >
                {reason}
              </p>
            ))}
          </div>
        </div>
      )}

      {result.caution && (
        <p className="rounded-[18px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,244,241,0.74)] px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
          {result.caution}
        </p>
      )}
    </div>
  )
}

const getPlanetsByHouse = (
  chart?: PrashnaChart,
  basis: "selected" | "rashi" | "bhava" = "selected"
) => {
  if (!chart) {
    return new Map<number, PrashnaPlanet[]>()
  }

  return chart.planets.reduce((map, planet) => {
    const house =
      basis === "rashi"
        ? planet.rashiHouse || planet.house
        : basis === "bhava"
        ? planet.bhavaHouse || planet.house
        : planet.house
    const list = map.get(house) || []
    list.push(planet)
    map.set(house, list)
    return map
  }, new Map<number, PrashnaPlanet[]>())
}

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
]

const SIGN_NUMBERS = SIGNS.reduce<Record<string, number>>((acc, sign, index) => {
  acc[sign] = index + 1
  return acc
}, {})

const PLANET_SHORT: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
}

const northIndianHouseSlots: Record<
  number,
  {
    x: number
    y: number
    signX: number
    signY: number
    anchor?: "start" | "middle" | "end"
  }
> = {
  1: { x: 70, y: 22, signX: 70, signY: 37 },
  2: { x: 40, y: 14, signX: 47, signY: 29 },
  3: { x: 24, y: 35, signX: 38, signY: 44 },
  4: { x: 19, y: 50, signX: 31, signY: 60 },
  5: { x: 25, y: 72, signX: 38, signY: 65 },
  6: { x: 40, y: 87, signX: 47, signY: 77 },
  7: { x: 70, y: 82, signX: 70, signY: 67 },
  8: { x: 100, y: 87, signX: 93, signY: 77 },
  9: { x: 115, y: 72, signX: 102, signY: 65 },
  10: { x: 121, y: 50, signX: 109, signY: 60 },
  11: { x: 116, y: 35, signX: 102, signY: 44 },
  12: { x: 100, y: 14, signX: 93, signY: 29 },
}

const splitPlanetLabels = (labels: string[]) => {
  if (labels.length <= 3) {
    return [labels.join(" ")]
  }

  return [
    labels.slice(0, Math.ceil(labels.length / 2)).join(" "),
    labels.slice(Math.ceil(labels.length / 2)).join(" "),
  ]
}

const buildChartCells = (
  chart: PrashnaChart,
  mode: "lagna" | "moon" | "bhava"
) => {
  const planetsByHouse = getPlanetsByHouse(
    chart,
    mode === "bhava" ? "bhava" : "selected"
  )

  if (mode === "lagna" || mode === "bhava") {
    return chart.houses.map((house) => ({
      house: house.house,
      sign: house.sign,
      planets: planetsByHouse.get(house.house) || [],
      marker: house.house === 1 ? (mode === "bhava" ? "Bhava" : "Lagna") : "",
    }))
  }

  const moonSignIndex = Math.max(SIGNS.indexOf(chart.moonSign), 0)

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1
    const sign = SIGNS[(moonSignIndex + index) % SIGNS.length]

    return {
      house,
      sign,
      planets: chart.planets.filter((planet) => planet.sign === sign),
      marker: house === 1 ? "Chandra" : "",
    }
  })
}

const NorthIndianChart = ({
  chart,
  mode = "lagna",
  title,
}: {
  chart?: PrashnaChart
  mode?: "lagna" | "moon" | "bhava"
  title: string
}) => {
  if (!chart) {
    return null
  }

  const cells = buildChartCells(chart, mode)

  return (
    <div className="rounded-[22px] border border-[rgba(212,161,38,0.28)] bg-[rgba(255,252,248,0.86)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_40px_rgba(11,39,53,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          {title}
        </p>
        <p className="text-xs font-semibold text-[var(--shreem-muted)]">
          {mode === "moon" ? chart.moonSign : chart.ascendant}
        </p>
      </div>
      <div className="relative mx-auto aspect-[7/5] w-full max-w-[520px] overflow-hidden rounded-[14px] bg-white shadow-[inset_0_0_0_1px_rgba(156,105,18,0.08)]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 140 100"
          role="img"
          aria-label={`${title} in North Indian style`}
        >
          <rect
            x="3"
            y="3"
            width="134"
            height="94"
            fill="white"
            stroke="#111827"
            strokeWidth="1.25"
          />
          <path
            d="M3 3 L137 97 M137 3 L3 97"
            fill="none"
            stroke="#111827"
            strokeWidth="1.15"
          />
          <path
            d="M70 3 L137 50 L70 97 L3 50 Z"
            fill="none"
            stroke="#111827"
            strokeWidth="1.15"
          />

          {cells.map((cell) => {
            const slot = northIndianHouseSlots[cell.house]
            const planetLabels = splitPlanetLabels([
              ...(cell.marker
                ? [
                    cell.marker === "Lagna"
                      ? "Asc"
                      : cell.marker === "Bhava"
                      ? "Bh"
                      : "Ch",
                  ]
                : []),
              ...cell.planets.map(
                (planet) => PLANET_SHORT[planet.name] || planet.name.slice(0, 2)
              ),
            ])

            return (
              <g key={`${mode}-${cell.house}-${cell.sign}`}>
                {planetLabels.map((line, index) => (
                  <text
                    key={`${cell.house}-${line}-${index}`}
                    x={slot.x}
                    y={slot.y + index * 5.4}
                    textAnchor={slot.anchor || "middle"}
                    dominantBaseline="middle"
                    fill="#123f63"
                    stroke="white"
                    strokeWidth="0.55"
                    paintOrder="stroke"
                    fontSize="4.2"
                    fontWeight="700"
                  >
                    {line}
                  </text>
                ))}
                <text
                  x={slot.signX}
                  y={slot.signY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9c6912"
                  stroke="white"
                  strokeWidth="0.7"
                  paintOrder="stroke"
                  fontSize="4.4"
                  fontWeight="800"
                >
                  {SIGN_NUMBERS[cell.sign]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

const BhavaChalitSummary = ({ chart }: { chart: PrashnaChart }) => {
  const shiftedPlanets = chart.planets.filter(
    (planet) =>
      typeof planet.rashiHouse === "number" &&
      typeof planet.bhavaHouse === "number" &&
      planet.rashiHouse !== planet.bhavaHouse
  )

  return (
    <div className="rounded-[20px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.68)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Bhava Chalit impact
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
        Rashi chart is used for sign dignity, ownership, and yogas. Bhava
        Chalit is used for lived house effects, timing impact, and how the
        planet may deliver results in real life.
      </p>
      {shiftedPlanets.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {shiftedPlanets.map((planet) => (
            <p
              key={`bhava-shift-${planet.key}`}
              className="rounded-[14px] border border-[var(--shreem-border)] bg-white/66 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
            >
              <span className="font-semibold text-[var(--shreem-ink)]">
                {planet.name}
              </span>{" "}
              shifts from Rashi house {planet.rashiHouse} to Bhava house{" "}
              {planet.bhavaHouse}; Bhava impact is{" "}
              {planet.bhavaImpactPercent ?? "-"}%{" "}
              {planet.bhavaImpactState || "measured"} and the planet is{" "}
              {planet.bhavaDistanceFromCusp ?? "-"} deg from bhava madhya.
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-[14px] border border-[var(--shreem-border)] bg-white/66 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
          No graha changes house between Rashi and Bhava Chalit in this chart;
          house effects are therefore more direct.
        </p>
      )}
    </div>
  )
}

const buildPlanetEffectsFallback = (chart: PrashnaChart) =>
  chart.planets.map((planet) => {
    const theme = HOUSE_THEMES[planet.house - 1] || "life matters"
    const lord = SIGN_LORDS[planet.sign] || "its sign lord"

    return {
      planet: planet.name,
      placement: `${planet.sign}, ${formatHousePosition(planet)}, ${planet.nakshatra} pada ${planet.pada}`,
      life_area: theme,
      activation_period: "Shown most clearly during this graha's dasha, antardasha, pratyantar, or strong transit.",
      effect: `${planet.name} activates ${theme.toLowerCase()} through the nature of ${planet.sign} and ${lord}.`,
      likely_effect: `${theme} becomes more noticeable when ${planet.name} is activated by dasha or transit.`,
      advice:
        planet.name === "Rahu" || planet.name === "Ketu"
          ? "Keep remedies simple and take expert review before strong pooja or gemstone decisions."
          : "Use steady discipline, relevant skill-building, and clean daily practice to support this placement.",
    }
  })

const PlanetEffectList = ({
  chart,
  effects,
}: {
  chart: PrashnaChart
  effects?: KundliAnalysis["planet_effects"]
}) => {
  const rows = effects?.length ? effects : buildPlanetEffectsFallback(chart)

  return (
    <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Planet effects
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--shreem-border)] text-[var(--shreem-muted)]">
              <th className="py-2 pr-3 font-semibold w-1/6">Planet</th>
              <th className="py-2 px-3 font-semibold w-1/4">Effect</th>
              <th className="py-2 px-3 font-semibold w-1/4">Timing</th>
              <th className="py-2 pl-3 font-semibold w-1/3">Advice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--shreem-border)] text-[var(--shreem-ink)]">
            {rows.map((item, index) => (
              <tr key={`${item.planet}-${index}`} className="group hover:bg-white/40 transition-colors">
                <td className="py-3 pr-3 align-top">
                  <span className="font-semibold block">{item.planet}</span>
                  <span className="text-[0.66rem] text-[var(--shreem-muted)] block mt-1 leading-snug">
                    {item.placement}
                  </span>
                </td>
                <td className="py-3 px-3 align-top">
                  <p className="leading-5">{item.effect}</p>
                  {item.life_area && (
                    <p className="mt-1 text-[10px] text-[var(--shreem-muted)]">
                      <span className="font-semibold">Area:</span> {item.life_area}
                    </p>
                  )}
                  {item.likely_effect && (
                    <p className="mt-1 text-[10px] text-[var(--shreem-muted)]">
                      {item.likely_effect}
                    </p>
                  )}
                </td>
                <td className="py-3 px-3 align-top leading-5 text-[var(--shreem-muted)]">
                  {item.activation_period || "-"}
                </td>
                <td className="py-3 pl-3 align-top leading-5 text-[var(--shreem-muted)]">
                  {item.advice || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DashaPredictionList = ({
  rows,
}: {
  rows?: KundliAnalysis["dasha_predictions"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.68)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Dasha-first reading
      </p>
      <div className="mt-3 grid gap-3">
        {rows.map((item, index) => (
          <div
            key={`${item.period}-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {item.period}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Chart basis: {item.chart_basis}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              BPHS basis: {item.classical_basis}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-ink)]">
              {item.prediction}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.78)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {item.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SubQuestionAnswersList = ({
  rows,
}: {
  rows?: KundliAnalysis["sub_question_answers"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[var(--shreem-border)] bg-[rgba(255,249,235,0.7)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Your specific questions answered
      </p>
      <div className="mt-3 grid gap-3">
        {rows.map((item, index) => (
          <div
            key={`question-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-4 py-3"
          >
            <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
              Q: {item.question}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {item.answer}
            </p>
            <div className="mt-3 rounded-[12px] bg-[rgba(13,129,126,0.06)] px-3 py-2">
              <p className="text-[11px] font-semibold text-[var(--shreem-ink)] uppercase tracking-wide">
                Chart Context
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                {item.chart_reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SpecialCaseReadingList = ({
  rows,
}: {
  rows?: KundliAnalysis["special_case_readings"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Special case synthesis
      </p>
      <div className="mt-3 grid gap-3">
        {rows.map((item, index) => (
          <div
            key={`${item.case_name}-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/74 px-3 py-3"
          >
            <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
              {item.case_name}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Chart basis: {item.chart_basis}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              BPHS basis: {item.classical_basis}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {item.combined_effect}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(13,129,126,0.08)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Timing: {item.timing}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Solution: {item.solution}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const RiskWatchList = ({
  rows,
}: {
  rows?: KundliAnalysis["risk_watch"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.7)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Watch periods and prevention
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {rows.map((item, index) => (
          <div
            key={`${item.theme}-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {item.theme}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {item.chart_basis}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Timing: {item.dasha_trigger}
            </p>
            <p className="mt-2 rounded-[14px] bg-white/78 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {item.prevention}
            </p>
          </div>
        ))}
      </div>
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
        Your last Prashna, Lost item, Kundli, and matchmaking sessions will
        appear here after you run them.
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

const AstralGrahaPanel = () => (
  <div className="astrology-star-map relative overflow-hidden rounded-[28px] border border-[rgba(245,199,96,0.28)] px-4 py-4 text-white shadow-[0_28px_70px_rgba(10,30,48,0.24)] small:px-5 small:py-5">
    <div className="astrology-zodiac-wheel" aria-hidden="true">
      {zodiacGlyphs.map((glyph, index) => (
        <span
          key={`${glyph}-${index}`}
          style={
            {
              "--zodiac-index": index,
            } as CSSProperties
          }
        >
          {glyph}
        </span>
      ))}
    </div>
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#f5d98b]">
          Navagraha map
        </p>
        <h3 className="mt-2 text-2xl leading-tight text-white">
          Charts, dasha, and remedies in one sky.
        </h3>
      </div>
      <div className="hidden rounded-full border border-white/18 bg-white/10 px-3 py-2 text-xs font-semibold text-[#fff7d8] small:block">
        Vedic Jyotish
      </div>
    </div>

    <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3">
      {grahaMedallions.map((graha, index) => (
        <div
          key={graha.key}
          className={`astrology-graha-card ${
            index === 4 ? "astrology-graha-card-center" : ""
          }`}
        >
          <span className="grid size-10 place-items-center rounded-full border border-[rgba(245,217,139,0.34)] bg-[rgba(255,255,255,0.1)] text-sm font-bold text-[#ffe7a1]">
            {graha.mark}
          </span>
          <p className="mt-2 text-sm font-semibold text-white">{graha.label}</p>
          <p className="mt-1 text-[0.7rem] leading-4 text-[#d8e8ea]">
            {graha.body}
          </p>
        </div>
      ))}
    </div>

    <div className="relative z-10 mt-4 grid gap-2 text-xs font-semibold leading-5 text-[#0b2735] min-[540px]:grid-cols-3">
      <p className="rounded-[16px] border border-white/25 bg-white/85 px-3 py-2 shadow-[0_12px_24px_rgba(2,8,19,0.14)]">
        North Indian chart view
      </p>
      <p className="rounded-[16px] border border-white/25 bg-white/85 px-3 py-2 shadow-[0_12px_24px_rgba(2,8,19,0.14)]">
        Panchang comparison
      </p>
      <p className="rounded-[16px] border border-white/25 bg-white/85 px-3 py-2 shadow-[0_12px_24px_rgba(2,8,19,0.14)]">
        BPHS-backed prompts
      </p>
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

const BookCitationList = ({ items }: { items?: BookCitation[] }) => {
  if (!items?.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.72)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Classical references
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <div
            key={`${item.citation}-${index}`}
            className="rounded-[14px] bg-white/70 px-3 py-2"
          >
            <p className="text-xs font-semibold leading-5 text-[var(--shreem-ink)]">
              {item.citation}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {item.relevance}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const getStoneCards = (stones?: KundliResult["stones"]) => {
  if (stones?.trinal?.length) {
    return stones.trinal
  }

  return [
    stones?.lagna
      ? {
          ...stones.lagna,
          house: 1,
          label: "1st house / Lagna",
          chart_basis: `${stones.lagna.sign || ""} lagna, lord ${
            stones.lagna.lord || ""
          }.`,
        }
      : null,
    stones?.rashi
      ? {
          ...stones.rashi,
          house: undefined,
          label: "Legacy rashi stone",
          chart_basis: `${stones.rashi.sign || ""} rashi, lord ${
            stones.rashi.lord || ""
          }.`,
        }
      : null,
  ].filter(Boolean) as NonNullable<KundliResult["stones"]>["trinal"]
}


const cleanKundliText = (value?: string | null) =>
  typeof value === "string" ? value.trim() : ""

const compactKundliText = (value?: string | null, maxLength = 240) => {
  const cleaned = cleanKundliText(value).replace(/\s+/g, " ")

  if (!cleaned) {
    return ""
  }

  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength - 1).trim()}…`
    : cleaned
}

const normalizeKundliText = (value?: string | null) =>
  cleanKundliText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()

const uniqueByText = <T,>(items: T[], getText: (item: T) => string) => {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeKundliText(getText(item))

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const getKundliQuestions = (result: KundliResult) =>
  (result.profile?.sub_questions || [])
    .map((item) => cleanKundliText(item))
    .filter(Boolean)

const getKundliQuestionText = (result: KundliResult) => {
  const questions = getKundliQuestions(result)

  return questions.length ? questions.join(" · ") : ""
}

const findPredictionRow = (result: KundliResult, terms: string[]) => {
  const rows = result.analysis?.prediction_table || []

  return rows.find((row) => {
    const area = normalizeKundliText(row.area)
    const prediction = normalizeKundliText(row.prediction)
    const basis = normalizeKundliText(row.chart_basis)
    const joined = `${area} ${prediction} ${basis}`

    return terms.some((term) => joined.includes(term))
  })
}

const getFocusedPredictionRows = (result: KundliResult) => {
  const rows = result.analysis?.prediction_table || []

  const priorityTerms = [
    "current dasha",
    "current period",
    "career",
    "professional",
    "work",
    "money",
    "wealth",
    "finance",
    "business",
    "entrepreneurship",
    "health",
    "mental",
    "relationship",
    "marriage",
    "family",
    "home",
    "property",
    "foreign",
    "spiritual",
    "education",
    "skill",
    "next 30",
    "next 3",
    "next 12",
    "remedy",
  ]

  const scoreRow = (row: NonNullable<KundliAnalysis["prediction_table"]>[number]) => {
    const area = normalizeKundliText(row.area)
    const joined = `${area} ${normalizeKundliText(row.prediction)}`
    const index = priorityTerms.findIndex((term) => joined.includes(term))

    return index === -1 ? 999 : index
  }

  return uniqueByText(rows, (row) => `${row.area} ${row.prediction}`)
    .sort((a, b) => scoreRow(a) - scoreRow(b))
    .slice(0, 8)
}

const getKundliDirectAnswer = (result: KundliResult) => {
  const analysis = result.analysis
  const questionAnswer = cleanKundliText(analysis?.sub_question_answers?.[0]?.answer)

  if (questionAnswer) {
    return questionAnswer
  }

  const questions = getKundliQuestions(result)
  const questionTokens = questions
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9\u0900-\u097f]+/i)
    .filter((item) => item.length > 3)
    .slice(0, 8)

  const questionMatchedRow =
    questionTokens.length > 0
      ? findPredictionRow(result, questionTokens)
      : undefined

  const priorityRow =
    questionMatchedRow ||
    findPredictionRow(result, [
      "user question",
      "question",
      "current dasha",
      "current period",
      "business",
      "career",
      "work",
      "money",
      "marriage",
      "relationship",
      "health",
    ]) ||
    getFocusedPredictionRows(result)[0]

  const rowPrediction = cleanKundliText(priorityRow?.prediction)

  if (rowPrediction) {
    return rowPrediction
  }

  const dashaPrediction = cleanKundliText(analysis?.dasha_predictions?.[0]?.prediction)

  if (dashaPrediction) {
    return dashaPrediction
  }

  return (
    cleanKundliText(analysis?.summary) ||
    cleanKundliText(analysis?.current_period_analysis) ||
    cleanKundliText(analysis?.person_information) ||
    cleanKundliText(result.message)
  )
}

const getKundliDirectReason = (result: KundliResult) => {
  const analysis = result.analysis
  const questionReason = cleanKundliText(analysis?.sub_question_answers?.[0]?.chart_reason)

  if (questionReason) {
    return questionReason
  }

  const row =
    findPredictionRow(result, ["user question", "question", "current dasha", "current period"]) ||
    getFocusedPredictionRows(result)[0]

  return (
    cleanKundliText(row?.chart_basis) ||
    cleanKundliText(analysis?.dasha_predictions?.[0]?.chart_basis) ||
    cleanKundliText(analysis?.current_period_analysis) ||
    cleanKundliText(result.detected_yogas?.slice(0, 3).join("; "))
  )
}

const getKundliDashaText = (chart?: PrashnaChart) => {
  const dasha = chart?.dasha

  if (!dasha) {
    return ""
  }

  return `${dasha.mahadasha.lord} Mahadasha · ${dasha.antardasha.lord} Antardasha · ${dasha.pratyantar.lord} Pratyantar`
}

const getKundliDashaWindow = (chart?: PrashnaChart) => {
  const dasha = chart?.dasha

  if (!dasha) {
    return ""
  }

  return `${dasha.mahadasha.startLabel} to ${dasha.mahadasha.endLabel}; Antardasha ${dasha.antardasha.startLabel} to ${dasha.antardasha.endLabel}; Pratyantar ${dasha.pratyantar.startLabel} to ${dasha.pratyantar.endLabel}.`
}

const KundliAnswerFirstCard = ({ result }: { result: KundliResult }) => {
  const question = getKundliQuestionText(result)
  const directAnswer = getKundliDirectAnswer(result)
  const directReason = getKundliDirectReason(result)
  const dashaText = getKundliDashaText(result.chart)
  const dashaWindow = getKundliDashaWindow(result.chart)

  if (!directAnswer && !directReason && !dashaText) {
    return null
  }

  return (
    <section className="rounded-[24px] border border-[rgba(13,129,126,0.24)] bg-[rgba(240,248,246,0.88)] px-4 py-5 small:px-6 small:py-6">
      {question ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Your question
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-7 text-[var(--shreem-ink)]">
            {question}
          </h3>
        </>
      ) : (
        <h3 className="text-xl font-semibold leading-7 text-[var(--shreem-ink)]">
          Kundli reading
        </h3>
      )}

      {directAnswer && (
        <div className="mt-4 rounded-[18px] border border-white/80 bg-white/78 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Direct reading
          </p>
          <p className="mt-2 text-base leading-7 text-[var(--shreem-ink)]">
            {directAnswer}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 small:grid-cols-2">
        {dashaText && (
          <div className="rounded-[18px] border border-[rgba(212,161,38,0.24)] bg-white/78 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Current dasha
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
              {dashaText}
            </p>
            {dashaWindow && (
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                {dashaWindow}
              </p>
            )}
          </div>
        )}

        {directReason && (
          <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white/78 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Chart basis
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {directReason}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

const FocusedPredictionCards = ({ result }: { result: KundliResult }) => {
  const directAnswer = normalizeKundliText(getKundliDirectAnswer(result))
  const rows = getFocusedPredictionRows(result)
    .filter((row) => {
      const area = normalizeKundliText(row.area)
      const prediction = normalizeKundliText(row.prediction)

      return (
        !area.includes("user question") &&
        !area.includes("question") &&
        prediction !== directAnswer
      )
    })
    .slice(0, 10)

  if (!rows.length) {
    return null
  }

  return (
    <section className="rounded-[22px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Detailed life guidance
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {rows.map((row, index) => (
          <article
            key={`${row.area}-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/74 px-3 py-3"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {row.area}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {row.prediction}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {row.advice}
            </p>
            {row.chart_basis && (
              <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                Basis: {compactKundliText(row.chart_basis, 180)}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

const CompactSpecialCaseSummary = ({ result }: { result: KundliResult }) => {
  const caseReadings = result.analysis?.special_case_readings || []
  const rawCases = result.analysis?.special_cases?.length
    ? result.analysis.special_cases
    : result.detected_yogas || []

  const rows = caseReadings.length
    ? caseReadings.map((item) => ({
        title: item.case_name,
        body:
          item.combined_effect ||
          item.chart_basis ||
          item.classical_basis ||
          item.solution,
        timing: item.timing,
        solution: item.solution,
      }))
    : rawCases.map((item) => ({
        title: item,
        body: item,
        timing: "",
        solution: "",
      }))

  const uniqueRows = uniqueByText(rows, (row) => `${row.title} ${row.body}`).slice(0, 8)

  if (!uniqueRows.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Special cases checked
      </p>
      <div className="mt-3 grid gap-2">
        {uniqueRows.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-[14px] bg-white/72 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
          >
            <span className="font-semibold text-[var(--shreem-ink)]">
              {compactKundliText(item.title, 60)}
            </span>
            {item.body && (
              <span> — {compactKundliText(item.body, 150)}</span>
            )}
            {item.timing && (
              <span> Timing: {compactKundliText(item.timing, 90)}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const GrahaDrishtiCard = ({ chart }: { chart?: PrashnaChart }) => {
  const aspects = chart?.aspects || []
  const houseSynthesis = chart?.houseSynthesis || []

  if (!aspects.length && !houseSynthesis.length) {
    return null
  }

  const keyHouses = houseSynthesis
    .filter((house) => [1, 2, 5, 7, 9, 10, 11].includes(house.house))
    .slice(0, 7)

  return (
    <section className="rounded-[24px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] px-4 py-5 small:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Graha drishti synthesis
      </p>
      <h3 className="mt-2 text-xl font-semibold leading-7 text-[var(--shreem-ink)]">
        Planet aspects and combined house impact
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        This section is calculated deterministically before AI interpretation, so the reading does not miss major Parashari drishti.
      </p>

      <div className="mt-4 grid gap-3 small:grid-cols-2">
        {aspects.slice(0, 12).map((aspect, index) => (
          <article
            key={`${aspect.fromPlanet}-${aspect.toHouse}-${index}`}
            className="rounded-[18px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {aspect.fromPlanet} → House {aspect.toHouse}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--shreem-gold-deep)]">
              {aspect.aspectType} drishti · {aspect.toSign}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {compactKundliText(aspect.interpretation, 180)}
            </p>
          </article>
        ))}
      </div>

      {!!keyHouses.length && (
        <div className="mt-4 grid gap-3">
          {keyHouses.map((house) => (
            <article
              key={`house-synthesis-${house.house}`}
              className="rounded-[18px] border border-white/80 bg-white/70 px-4 py-3"
            >
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                House {house.house}: {house.theme}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                {compactKundliText(house.synthesis, 260)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

const CompactDashaPredictionList = ({
  rows,
}: {
  rows?: KundliAnalysis["dasha_predictions"]
}) => {
  const uniqueRows = uniqueByText(rows || [], (row) => `${row.period} ${row.prediction}`).slice(0, 3)

  if (!uniqueRows.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.68)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Dasha timing
      </p>
      <div className="mt-3 grid gap-3 small:grid-cols-3">
        {uniqueRows.map((item, index) => (
          <article
            key={`${item.period}-${index}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/74 px-3 py-3"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {item.period}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {compactKundliText(item.prediction, 260)}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {compactKundliText(item.action, 180)}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

const CompactInsightList = ({
  title,
  items,
  limit = 5,
}: {
  title: string
  items?: string[]
  limit?: number
}) => {
  const uniqueItems = uniqueByText(items || [], (item) => item).slice(0, limit)

  if (!uniqueItems.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {uniqueItems.map((item, index) => (
          <p
            key={`${title}-${index}`}
            className="rounded-[14px] bg-white/70 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]"
          >
            {compactKundliText(item, 180)}
          </p>
        ))}
      </div>
    </section>
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
  const stoneCards = getStoneCards(result.stones)
  const requestedUnits = result.usage_units || result.profile?.usage_units || 1
  const isInterruptedReading = Boolean(result.message)

  if (!chart) {
    return null
  }

  const hasQuestionAnswers = Boolean(result.analysis?.sub_question_answers?.length)
  const showGeneralText =
    !hasQuestionAnswers &&
    Boolean(
      result.analysis?.summary ||
        result.analysis?.career_direction ||
        result.analysis?.relationship_pattern ||
        result.analysis?.health_caution ||
        result.analysis?.current_period_analysis
    )

  return (
    <div className="grid gap-4 relative">
      <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/62 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          {isInterruptedReading ? "Kundli not completed" : "Kundli reading"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
          {isInterruptedReading
            ? "No AI turn was consumed for this interrupted reading. Retry when you are ready."
            : `Used ${requestedUnits} AI ${
                Number(requestedUnits) > 1 ? "turns" : "turn"
              }.`}
        </p>
      </div>

      <KundliAnswerFirstCard result={result} />

      <FocusedPredictionCards result={result} />

      <DashaCard chart={chart} />

      <GrahaDrishtiCard chart={chart} />

      <CompactDashaPredictionList rows={result.analysis?.dasha_predictions} />

      <RiskWatchList rows={result.analysis?.risk_watch} />

      <CompactSpecialCaseSummary result={result} />

      {showGeneralText && (
        <section className="grid gap-3">
          {[
            ["Summary", result.analysis?.summary],
            ["Career direction", result.analysis?.career_direction],
            ["Relationship pattern", result.analysis?.relationship_pattern],
            ["Health caution", result.analysis?.health_caution],
            ["Current period", result.analysis?.current_period_analysis],
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
        </section>
      )}

      <div className="grid gap-3 xl:grid-cols-2">
        <CompactInsightList
          title="Likely issues"
          items={result.analysis?.likely_challenges}
        />
        <CompactInsightList
          title="Practical solutions"
          items={result.analysis?.practical_solutions}
        />
        <CompactInsightList
          title="Health watchlist"
          items={result.analysis?.health_indicators || result.health_indicators}
        />
        <CompactInsightList
          title="Strengths"
          items={result.analysis?.strengths}
        />
      </div>

      {Boolean(result.analysis?.targeted_remedies?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Targeted remedies
          </p>
          <div className="mt-3 grid gap-3">
            {uniqueByText(result.analysis?.targeted_remedies || [], (item) => `${item.pain_point} ${item.mantra_or_pooja}`)
              .slice(0, 4)
              .map((item, index) => (
                <div
                  key={`${item.pain_point}-${index}`}
                  className="rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
                >
                  <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
                    {item.pain_point}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                    {compactKundliText(item.chart_basis, 180)}
                  </p>
                  <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                    {compactKundliText(item.mantra_or_pooja, 180)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                    {compactKundliText(item.daily_practice, 180)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {Boolean(result.analysis?.upaay?.length) && (
        <CompactInsightList title="Upaay" items={result.analysis?.upaay} limit={5} />
      )}

      {(stoneCards?.length || 0) > 0 && (
        <section className="grid gap-3 small:grid-cols-3">
          {(stoneCards || []).slice(0, 3).map((stone, index) => (
            <div
              key={`${stone?.label || "stone"}-${stone?.primary || index}`}
              className="rounded-[18px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                {stone?.label || "Stone"}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--shreem-ink)]">
                {stone?.primary}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                {compactKundliText(
                  stone?.chart_basis ||
                    `${stone?.sign || ""} sign, lord ${stone?.lord || ""}. ${stone?.caution || ""}`,
                  160
                )}
              </p>
            </div>
          ))}
        </section>
      )}

      {result.stones?.caution && (
        <p className="rounded-[16px] border border-[rgba(212,161,38,0.26)] bg-[rgba(255,248,233,0.74)] px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
          {compactKundliText(result.stones.caution, 220)}
        </p>
      )}

      {Boolean(result.analysis?.shreem_product_suggestions?.length) && (
        <div className="rounded-[20px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.74)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Helpful support for your remedy
          </p>
          <div className="mt-3 grid gap-3">
            {result.analysis?.shreem_product_suggestions?.slice(0, 3).map((item) => (
              <LocalizedClientLink
                key={`${item.handle}-${item.title}`}
                href={item.product_url || `/products/${item.handle}`}
                className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-[16px] border border-[var(--shreem-border)] bg-white/70 p-3 transition hover:border-[rgba(13,129,126,0.32)]"
              >
                <img
                  src={item.image_url || "/shreem-scenes/hero-scene.png"}
                  alt=""
                  className="h-[84px] w-[84px] rounded-[12px] object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {compactKundliText(item.reason, 150)}
                  </p>
                </div>
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

      <BookCitationList items={result.analysis?.book_citations} />

      <section className="grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Chart proof
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
            Calculated chart and tables
          </h3>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <NorthIndianChart chart={chart} mode="lagna" title="Lagna chart" />
            <NorthIndianChart chart={chart} mode="bhava" title="Bhava Chalit chart" />
            <NorthIndianChart chart={chart} mode="moon" title="Chandra chart" />
          </div>
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

        <BhavaChalitSummary chart={chart} />

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

        <PlanetEffectList chart={chart} effects={result.analysis?.planet_effects} />
      </section>

      <button
        type="button"
        onClick={onPrint}
        className="w-full rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white small:w-fit"
      >
        Download PDF-ready Kundli
      </button>

      <p className="mt-4 text-center text-xs text-[var(--shreem-muted)]">
        Disclaimer: All insights are AI-generated based on astrological principles.
      </p>
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
      <CityPicker
        value={value.cityId}
        onChange={(cityId) => onChange({ ...value, cityId })}
      />
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

      <BookCitationList items={result.analysis?.book_citations} />

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
  const stoneCards = getStoneCards(result.stones)
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
  <div style="text-align: center; margin-bottom: 20px;"><img src="/logo.jpeg" alt="Shreem Logo" style="max-height: 80px;" /></div>
  <h1 style="text-align: center;">Shreem Kundli Report</h1>
  <p class="small">${escapeHtml(profile?.name || "Native")} · ${escapeHtml(profile?.birth_date)} ${escapeHtml(profile?.birth_time)} · ${escapeHtml(profile?.city)}</p>
  <div class="grid">
    <div class="card"><strong>Lagna</strong><br/>${escapeHtml(chart.ascendant)} ${escapeHtml(chart.ascendantDegree)} deg<br/><span class="small">${escapeHtml(chart.ascendantNakshatra)} pada ${escapeHtml(chart.ascendantPada)}</span></div>
    <div class="card"><strong>Rashi</strong><br/>${escapeHtml(chart.moonSign)} ${escapeHtml(chart.moonDegree)} deg<br/><span class="small">${escapeHtml(chart.nakshatra)} pada ${escapeHtml(chart.nakshatraPada)}</span></div>
  </div>
  <h2>Vimshottari Dasha</h2>
  <div class="card"><p><strong>Mahadasha:</strong> ${escapeHtml(dasha?.mahadasha.lord)} (${escapeHtml(dasha?.mahadasha.startLabel)} - ${escapeHtml(dasha?.mahadasha.endLabel)})</p><p><strong>Antardasha:</strong> ${escapeHtml(dasha?.antardasha.lord)} (${escapeHtml(dasha?.antardasha.startLabel)} - ${escapeHtml(dasha?.antardasha.endLabel)})</p><p><strong>Pratyantar:</strong> ${escapeHtml(dasha?.pratyantar.lord)} (${escapeHtml(dasha?.pratyantar.startLabel)} - ${escapeHtml(dasha?.pratyantar.endLabel)})</p><p class="small">${escapeHtml(dasha?.note)}</p></div>
  <h2>Graha Positions</h2>
  <table><thead><tr><th>Graha</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra</th></tr></thead><tbody>${chart.planets.map((planet) => `<tr><td>${escapeHtml(planet.name)}</td><td>${escapeHtml(planet.sign)}</td><td>${escapeHtml(planet.signDegree)} deg</td><td>${escapeHtml(formatHousePosition(planet))}</td><td>${escapeHtml(planet.nakshatra)} pada ${escapeHtml(planet.pada)}${planet.retrograde ? " (retrograde)" : ""}</td></tr>`).join("")}</tbody></table>
  <h2>House Information</h2>
  <table><thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Planets</th><th>Theme</th></tr></thead><tbody>${chart.houses.map((house) => `<tr><td>${escapeHtml(house.house)}</td><td>${escapeHtml(house.sign)}</td><td>${escapeHtml(house.signLord)}</td><td>${escapeHtml(getHousePlanets(chart, house.house).map((planet) => planet.name).join(", ") || "-")}</td><td>${escapeHtml(house.theme)}</td></tr>`).join("")}</tbody></table>
  <h2>Graha Drishti</h2>
  <table><thead><tr><th>From</th><th>To House</th><th>Type</th><th>Impact</th></tr></thead><tbody>${(chart.aspects || []).map((aspect) => `<tr><td>${escapeHtml(aspect.fromPlanet)} from H${escapeHtml(aspect.fromHouse)}</td><td>H${escapeHtml(aspect.toHouse)} ${escapeHtml(aspect.toSign)}</td><td>${escapeHtml(aspect.aspectType)}</td><td>${escapeHtml(aspect.interpretation)}</td></tr>`).join("")}</tbody></table>
  <h2>House-wise Combined Synthesis</h2>
  <table><thead><tr><th>House</th><th>Theme</th><th>Planets</th><th>Drishti From</th><th>Synthesis</th></tr></thead><tbody>${(chart.houseSynthesis || []).map((house) => `<tr><td>${escapeHtml(house.house)}</td><td>${escapeHtml(house.theme)}</td><td>${escapeHtml((house.planetsPlaced || []).join(", ") || "-")}</td><td>${escapeHtml((house.aspectsReceived || []).map((aspect) => aspect.fromPlanet).join(", ") || "-")}</td><td>${escapeHtml(house.synthesis)}</td></tr>`).join("")}</tbody></table>
  <h2>Prediction Table</h2>
  <table><thead><tr><th>Area</th><th>Chart Basis</th><th>Prediction</th><th>Advice</th></tr></thead><tbody>${(analysis?.prediction_table || []).map((row) => `<tr><td>${escapeHtml(row.area)}</td><td>${escapeHtml(row.chart_basis)}</td><td>${escapeHtml(row.prediction)}</td><td>${escapeHtml(row.advice)}</td></tr>`).join("")}</tbody></table>
  <h2>Analysis</h2>
  <div class="card"><p>${escapeHtml(analysis?.summary)}</p><p>${escapeHtml(analysis?.person_information)}</p><p>${escapeHtml(analysis?.temperament)}</p><p>${escapeHtml(analysis?.career_direction)}</p><p>${escapeHtml(analysis?.relationship_pattern)}</p><p><strong>Health caution:</strong> ${escapeHtml(analysis?.health_caution)}</p><p>${escapeHtml(analysis?.current_period_analysis)}</p><p>${escapeHtml(analysis?.spiritual_guidance)}</p></div>
  <h2>Health Watchlist</h2>
  <div class="card"><ul>${(analysis?.health_indicators || result.health_indicators || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
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
  <div class="card"><p><strong>Direct answer:</strong> ${escapeHtml(analysis?.sub_question_answers?.[0]?.answer || "")}</p></div>
  <h2>Special Cases Checked</h2>
  <div class="card"><ul>${(analysis?.special_cases || result.detected_yogas || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
  <h2>Upaay</h2>
  <div class="card"><ul>${(analysis?.upaay || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
  <h2>Pain-point Mantra and Pooja</h2>
  <div class="card"><ul>${(analysis?.targeted_remedies || []).map((item) => `<li><strong>${escapeHtml(item.pain_point)}</strong><br/>${escapeHtml(item.chart_basis)}<br/>${escapeHtml(item.mantra_or_pooja)}<br/><span class="small">${escapeHtml(item.daily_practice)}</span></li>`).join("")}</ul></div>
  <h2>1st, 5th, and 9th House Stone Indicators</h2>
  <div class="card">${(stoneCards || []).map((stone) => `<p><strong>${escapeHtml(stone?.label)}</strong>: ${escapeHtml(stone?.primary)} (${escapeHtml(stone?.sign)}, lord ${escapeHtml(stone?.lord)})<br/><span class="small">${escapeHtml(stone?.chart_basis)} ${escapeHtml(stone?.caution)}</span></p>`).join("")}<p class="small">${escapeHtml(result.stones?.caution)}</p></div>
  <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #516b75;">Disclaimer: All insights are AI-generated based on astrological principles.</p>
</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
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
    : tool.includes("lost_item")
    ? "Lost item"
    : "Prashna"
  const title =
    type === "Matchmaking"
      ? `${String(asRecord(asRecord(response.girl).profile).name || "Girl")} + ${String(
          asRecord(asRecord(response.boy).profile).name || "Boy"
        )}`
      : type === "Kundli"
      ? `${String(profile.name || input.name || "Generated")} Kundli`
      : type === "Lost item"
      ? `Lost ${String(input.itemName || input.itemType || "item")}`
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
      | LostItemResult
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
  const [astrologyTheme, setAstrologyTheme] = useState<AstrologyTheme>("day")
  const [language, setLanguage] = useState<AstrologyLanguage>("english")
  const [languageReady, setLanguageReady] = useState(false)
  const [panchangSystemId, setPanchangSystemId] = useState("lahiri-mean")
  const [cityId, setCityId] = useState("rewa")
  const [date, setDate] = useState(() => getTodayDateString())
  const [question, setQuestion] = useState("")
  const [prashna, setPrashna] = useState<PrashnaResult | null>(null)
  const [loadingPrashna, setLoadingPrashna] = useState(false)
  const [lostItemForm, setLostItemForm] = useState({
    itemName: "",
    itemType: "",
    ownerName: customerName || "",
    lastSeenPlace: "",
    lastSeenDate: "",
    lastSeenTime: "",
    notes: "",
  })
  const [lostItemResult, setLostItemResult] = useState<LostItemResult | null>(
    null
  )
  const [loadingLostItem, setLoadingLostItem] = useState(false)
  const [hindiCalendar, setHindiCalendar] = useState<HindiCalendarDay | null>(
    null
  )
  const [hindiCalendarMonth, setHindiCalendarMonth] =
    useState<HindiCalendarMonth | null>(null)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [loadingCalendarMonth, setLoadingCalendarMonth] = useState(true)
  const [history, setHistory] = useState<AstrologyHistoryItem[]>([])
  const [aiWallet, setAiWallet] = useState<AiWallet | null>(null)
  const [aiQuota, setAiQuota] = useState<AiQuota | null>(null)
  const [aiPacks, setAiPacks] = useState<AiCreditPack[]>([])
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
  const [kundliProgress, setKundliProgress] = useState(0)
  const [matchmakingForm, setMatchmakingForm] = useState({
    girl: emptyMatchPerson(),
    boy: emptyMatchPerson(),
  })
  const [matchmakingResult, setMatchmakingResult] =
    useState<MatchmakingResult | null>(null)
  const [loadingMatchmaking, setLoadingMatchmaking] = useState(false)
  const city = getCityById(cityId)
  const calendarMonthKey = getCalendarMonthKey(date)
  const muhurat = useMemo(
    () => calculateDailyMuhurat({ city, date }),
    [city, date]
  )
  const bestDaySlots = muhurat.daySlots.filter(
    (slot) => slot.quality === "auspicious"
  )
  const refreshWallet = () =>
    fetch("/api/ai-wallet", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setAiWallet(data?.wallet || null)
        setAiQuota(data?.quota || null)
        setAiPacks(Array.isArray(data?.packs) ? data.packs : [])
      })
      .catch(() => null)

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY)

    if (saved === "hindi" || saved === "hinglish") {
      setLanguage(saved)
    }

    const savedTheme = window.localStorage.getItem(THEME_KEY)

    if (savedTheme === "night") {
      setAstrologyTheme("night")
    }

    setLanguageReady(true)
  }, [])

  useEffect(() => {
    document.body.classList.toggle(
      "astrology-night-mode",
      astrologyTheme === "night"
    )
    document.body.classList.toggle(
      "astrology-day-mode",
      astrologyTheme === "day"
    )
    window.localStorage.setItem(THEME_KEY, astrologyTheme)

    return () => {
      document.body.classList.remove("astrology-night-mode")
      document.body.classList.remove("astrology-day-mode")
    }
  }, [astrologyTheme])

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
      )}&date=${encodeURIComponent(date)}&panchangSystemId=${encodeURIComponent(
        panchangSystemId
      )}`,
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
  }, [cityId, date, panchangSystemId])

  useEffect(() => {
    let active = true

    setLoadingCalendarMonth(true)
    fetch(
      `/api/astrology/hindi-calendar?cityId=${encodeURIComponent(
        cityId
      )}&month=${encodeURIComponent(calendarMonthKey)}&panchangSystemId=${encodeURIComponent(
        panchangSystemId
      )}`,
      { cache: "no-store" }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: HindiCalendarMonth | null) => {
        if (active) {
          setHindiCalendarMonth(data?.days?.length ? data : null)
        }
      })
      .catch(() => {
        if (active) {
          setHindiCalendarMonth(null)
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCalendarMonth(false)
        }
      })

    return () => {
      active = false
    }
  }, [cityId, calendarMonthKey, panchangSystemId])

  useEffect(() => {
    refreshWallet()
  }, [])

  useEffect(() => {
    window.localStorage.removeItem(HISTORY_KEY)
    setHistory([])

    fetch("/api/astrology/history", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const remoteItems = Array.isArray(data?.items)
          ? data.items
              .map((item: unknown) => normalizeUsageHistory(item))
              .filter(Boolean)
          : []

        if (remoteItems.length) {
          setHistory(mergeHistory(remoteItems).slice(0, 12))
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

      return next
    })
  }

  const askPrashna = async () => {
    if (loadingPrashna) {
      return
    }

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
        panchangSystemId,
      }),
      cache: "no-store",
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as PrashnaResult | null

    if (!data?.answer) {
      const retryHint = data?.retryable
        ? " This looks temporary — wait a few seconds and try again."
        : ""
      setPrashna({
        message:
          data?.message ||
          `Prashna AI could not answer right now. Please try again.${retryHint}`,
        retryable: data?.retryable,
      })
      setLoadingPrashna(false)
      return
    }

    const result = data

    setPrashna(result)
    if (result.wallet) {
      setAiWallet(result.wallet)
    }
    if (result.quota) {
      setAiQuota(result.quota)
    }

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
    refreshWallet()
  }

  const askLostItemPrashna = async () => {
    if (loadingLostItem) {
      return
    }

    setLoadingLostItem(true)
    setLostItemResult(null)

    const now = new Date()
    const questionDate = now.toISOString().slice(0, 10)
    const questionTime = now.toTimeString().slice(0, 5)
    const response = await fetch("/api/astrology/lost-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...lostItemForm,
        cityId,
        language,
        panchangSystemId,
        questionDate,
        questionTime,
      }),
      cache: "no-store",
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as LostItemResult | null

    if (!data?.answer) {
      setLostItemResult({
        message:
          data?.message ||
          "Lost item Prashna could not be generated right now. Please try again.",
        retryable: data?.retryable,
      })
      setLoadingLostItem(false)
      return
    }

    setLostItemResult(data)
    if (data.wallet) {
      setAiWallet(data.wallet)
    }
    if (data.quota) {
      setAiQuota(data.quota)
    }
    if (Array.isArray(data.packs)) {
      setAiPacks(data.packs)
    }

    rememberHistory(
      {
        id: `lost-item-${Date.now()}`,
        type: "Lost item",
        title: `Lost ${lostItemForm.itemName || lostItemForm.itemType || "item"}`,
        createdAt: new Date().toISOString(),
        summary: data.answer,
        response: data,
      },
      {
        persistLocal: !data.usage_synced,
      }
    )

    setLoadingLostItem(false)
    refreshWallet()
  }

  const generateKundli = async () => {
    if (loadingKundli) {
      return
    }

    setLoadingKundli(true)
    setKundliProgress(0)
    setKundliResult(null)

    const progressInterval = setInterval(() => {
      setKundliProgress((prev) => {
        if (prev < 30) return prev + 2
        if (prev < 60) return prev + 1
        if (prev < 85) return prev + 0.5
        if (prev < 95) return prev + 0.2
        return prev
      })
    }, 1000)

    try {
      const response = await fetch("/api/astrology/kundli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...kundliForm,
          language,
          panchangSystemId,
        }),
        cache: "no-store",
      }).catch(() => null)

      const data = (await response?.json().catch(() => null)) as KundliResult | null
      const result =
        data || ({
          message: "Kundli AI could not generate the chart right now.",
        } satisfies KundliResult)

      setKundliResult(result)

      if (result.wallet) {
        setAiWallet(result.wallet)
      }
      if (result.quota) {
        setAiQuota(result.quota)
      }
      if (Array.isArray(result.packs)) {
        setAiPacks(result.packs)
      }

      setKundliProgress(100)

      if (result.chart && (result.analysis?.summary || result.analysis?.prediction_table?.length) && !result.message) {
        rememberHistory({
          id: `kundli-${Date.now()}`,
          type: "Kundli",
          title: `${result.profile?.name || kundliForm.name || "Generated"} Kundli`,
          createdAt: new Date().toISOString(),
          summary:
            result.analysis?.sub_question_answers?.[0]?.answer ||
            result.analysis?.prediction_table?.[0]?.prediction ||
            result.analysis?.summary ||
            result.detected_yogas?.[0] ||
            "Birth chart generated",
          response: result,
        }, {
          persistLocal: !result.usage_synced,
        })
      }

      refreshWallet()
    } catch (error) {
      console.error("Kundli generation failed", error)
      setKundliResult({
        message: "Kundli generation failed unexpectedly. Please try again.",
        retryable: true,
      })
    } finally {
      clearInterval(progressInterval)
      window.setTimeout(() => {
        setLoadingKundli(false)
        setKundliProgress(0)
      }, 300)
    }
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
        girl: { ...matchmakingForm.girl, panchangSystemId },
        boy: { ...matchmakingForm.boy, panchangSystemId },
        language,
        panchangSystemId,
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
    if (result.wallet) {
      setAiWallet(result.wallet)
    }
    if (result.quota) {
      setAiQuota(result.quota)
    }
    if (Array.isArray(result.packs)) {
      setAiPacks(result.packs)
    }

    if (result.compatibility && result.analysis?.summary && !result.message) {
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
    refreshWallet()
  }

  const selectHistoryItem = (item: AstrologyHistoryItem) => {
    if (item.type === "Matchmaking") {
      setMatchmakingResult(item.response as MatchmakingResult)
      setActiveTab("matchmaking")
      return
    }

    if (item.type === "Lost item") {
      setLostItemResult(item.response as LostItemResult)
      setActiveTab("lost-item")
      return
    }

    if (item.type === "Kundli") {
      const result = item.response as KundliResult
      const profile = result?.profile

      setKundliResult(result)
      if (profile) {
        const restoredCityId = findCityIdFromLabel(profile.city)
        const restoredPanchangId = profile.panchang_system_id

        setKundliForm((current) => ({
          ...current,
          name: profile.name || current.name,
          gender: profile.gender || current.gender,
          birthDate: profile.birth_date || current.birthDate,
          birthTime: profile.birth_time || current.birthTime,
          cityId: restoredCityId || current.cityId,
          subQuestions:
            Array.isArray(profile.sub_questions) &&
            profile.sub_questions.some(Boolean)
              ? [
                  profile.sub_questions[0] || "",
                  profile.sub_questions[1] || "",
                  profile.sub_questions[2] || "",
                ]
              : current.subQuestions,
        }))
        if (restoredPanchangId) {
          setPanchangSystemId(restoredPanchangId)
        }
      }
      setActiveTab("kundli")
      return
    }

    setPrashna(item.response as PrashnaResult)
    setActiveTab("prashna")
  }

  const LocationDateControls = ({ showDate = true }: { showDate?: boolean }) => (
    <div className="brand-card grid gap-3 px-4 py-4 small:grid-cols-2">
      <CityPicker label="City" value={cityId} onChange={setCityId} />
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
      <div className="grid gap-2 min-[420px]:grid-cols-3">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            className={`min-w-0 rounded-[16px] border px-3 py-3 text-left transition ${
              language === option.value
                ? "border-[rgba(212,161,38,0.45)] bg-[rgba(255,248,233,0.88)] text-[var(--shreem-ink)]"
                : "border-[var(--shreem-border)] bg-white/62 text-[var(--shreem-muted)]"
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="mt-1 block text-[0.68rem] leading-4 min-[420px]:line-clamp-2">
              {option.detail}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  const PanchangControls = ({ compact = false }: { compact?: boolean } = {}) => {
    const selectedPanchang =
      PANCHANG_SYSTEMS.find((system) => system.id === panchangSystemId) ||
      PANCHANG_SYSTEMS[0]

    if (compact) {
      return (
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
            Panchang system
          </span>
          <select
            value={selectedPanchang.id}
            onChange={(event) => setPanchangSystemId(event.target.value)}
            className="h-12 w-full rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm font-semibold text-[var(--shreem-ink)] outline-none"
          >
            {PANCHANG_SYSTEMS.map((system) => (
              <option key={system.id} value={system.id}>
                {system.label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-[var(--shreem-muted)]">
            {selectedPanchang.description}
          </p>
        </label>
      )
    }

    return (
      <div className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
          Panchang system
        </span>
        <div className="grid gap-2">
          {PANCHANG_SYSTEMS.map((system) => (
            <button
              key={system.id}
              type="button"
              onClick={() => setPanchangSystemId(system.id)}
              className={`rounded-[16px] border px-3 py-3 text-left transition ${
                selectedPanchang.id === system.id
                  ? "border-[rgba(212,161,38,0.45)] bg-[rgba(255,248,233,0.88)] text-[var(--shreem-ink)]"
                  : "border-[var(--shreem-border)] bg-white/62 text-[var(--shreem-muted)]"
              }`}
            >
              <span className="block text-sm font-semibold">
                {system.shortLabel}
              </span>
              <span className="mt-1 block text-[0.68rem] leading-4">
                {system.description}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-[var(--shreem-muted)]">
          Default is astronomical Lahiri. Use Rishikesh when comparing against
          that tradition; exact printed editions can still differ for borderline
          births.
        </p>
      </div>
    )
  }

  const ThemeToggle = () => (
    <div className="inline-flex rounded-full border border-[var(--shreem-border)] bg-white/60 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
      {([
        ["day", "Day", "☀"],
        ["night", "Night", "☾"],
      ] as const).map(([value, label, icon]) => {
        const active = astrologyTheme === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => setAstrologyTheme(value)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
              active
                ? value === "night"
                  ? "bg-[linear-gradient(135deg,#08152f,#33205d_58%,#6b2344)] text-white shadow-[0_10px_24px_rgba(8,21,47,0.28)]"
                  : "bg-[linear-gradient(135deg,#fff8df,#f5d98b)] text-[#60420d] shadow-[0_10px_24px_rgba(212,161,38,0.16)]"
                : "text-[var(--shreem-muted)] hover:text-[var(--shreem-ink)]"
            }`}
            aria-pressed={active}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )

  const HinduCalendarGrid = () => {
    const days = buildCalendarGrid(date)
    const monthDetails = new Map(
      (hindiCalendarMonth?.days || []).map((item) => [item.date, item])
    )
    const selectedDay = hindiCalendar ? monthDetails.get(date) : null

    return (
      <div className="rounded-[24px] border border-[var(--shreem-border)] bg-white/62 px-4 py-4 shadow-[0_18px_44px_rgba(18,63,99,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="brand-kicker">Month view</p>
            <p className="mt-1 text-lg font-semibold text-[var(--shreem-ink)]">
              {getCalendarMonthLabel(date)}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {loadingCalendarMonth
                ? "Calculating tithi for every day..."
                : hindiCalendarMonth
                ? `${hindiCalendarMonth.city.name} panchang with weekday, paksha, and tithi in each cell.`
                : "Month tithi could not load; selected-day details still work."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDate(shiftMonth(date, -1))}
              className="rounded-full border border-[var(--shreem-border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setDate(getTodayDateString())}
              className="rounded-full border border-[rgba(212,161,38,0.28)] bg-[rgba(255,248,233,0.78)] px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDate(shiftMonth(date, 1))}
              className="rounded-full border border-[var(--shreem-border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--shreem-gold-deep)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            if (!day.date) {
              return <span key={day.key} aria-hidden="true" />
            }

              const details = monthDetails.get(day.date)

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setDate(day.date)}
                  className={`min-h-[5.6rem] rounded-[16px] border px-1.5 py-2 text-left transition ${
                    day.selected
                      ? "border-[rgba(212,161,38,0.5)] bg-[rgba(255,248,233,0.9)] text-[var(--shreem-ink)] shadow-[0_12px_24px_rgba(212,161,38,0.12)]"
                      : day.today
                      ? "border-[rgba(13,129,126,0.32)] bg-[rgba(240,248,246,0.74)] text-[var(--shreem-ink)]"
                      : "border-[var(--shreem-border)] bg-white/54 text-[var(--shreem-muted)] hover:border-[rgba(212,161,38,0.3)]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-1">
                    <span className="text-base font-semibold leading-none text-[var(--shreem-ink)]">
                      {day.day}
                    </span>
                    <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)]">
                      {getCompactWeekday(details?.weekday)}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 block min-h-[2rem] text-[0.64rem] font-semibold leading-4 text-[var(--shreem-ink)]">
                    {loadingCalendarMonth
                      ? "Loading"
                      : getCompactTithi(details?.tithi)}
                  </span>
                  <span className="mt-1 block text-[0.58rem] leading-4 text-[var(--shreem-muted)]">
                    {details
                      ? `${details.paksha} · ${details.nakshatra.replace(/ pada \d+$/i, "")}`
                      : day.today
                      ? "Today"
                      : "Tap for detail"}
                  </span>
                </button>
              )
          })}
        </div>

        <div className="mt-4 grid gap-2 rounded-[18px] border border-[rgba(13,129,126,0.12)] bg-[rgba(240,248,246,0.64)] px-3 py-3 text-xs leading-5 text-[var(--shreem-muted)] small:grid-cols-[minmax(0,1fr)_auto] small:items-center">
          <p>
            Selected: <span className="font-semibold text-[var(--shreem-ink)]">
              {hindiCalendar?.weekday || selectedDay?.weekday || "Day"}
            </span>{" "}
            · {hindiCalendar?.tithi || selectedDay?.tithi || "Tithi loading"}
          </p>
          <p className="font-semibold text-[var(--shreem-gold-deep)]">
            {hindiCalendar?.month?.name || selectedDay?.month?.name || "Masa"}
          </p>
        </div>
      </div>
    )
  }

  const AiWalletCard = () => {
    const balance = Math.max(0, Number(aiWallet?.credit_balance || 0))
    const proActive = Boolean(aiWallet?.pro_active)
    const freeLimit = Math.max(0, Number(aiQuota?.limit ?? 3))
    const freeUsed = Math.max(0, Number(aiQuota?.used ?? 0))
    const freeRemaining = Math.max(0, Number(aiQuota?.remaining ?? freeLimit))
    const premiumDailyLimit = Math.max(
      0,
      Number(aiWallet?.pro_question_limit || 0)
    )
    const premiumRemaining =
      proActive && premiumDailyLimit
        ? Math.max(0, premiumDailyLimit - freeUsed)
        : null
    const resetLabel = aiQuota?.reset_at
      ? new Intl.DateTimeFormat("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          day: "numeric",
          month: "short",
          timeZone: "Asia/Kolkata",
        }).format(new Date(aiQuota.reset_at))
      : "midnight IST"
    const creditPacks = aiPacks.filter((pack) => pack.plan !== "premium")
    const premiumPack =
      aiPacks.find((pack) => pack.plan === "premium") || aiPacks[aiPacks.length - 1]

    return (
      <div className="brand-card px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="brand-kicker">AI wallet</p>
            <p className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
              {proActive ? "Premium active" : `${balance} paid credits`}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {freeRemaining} of {freeLimit} free readings left today across
              Prashna, Lost item, Kundli, and Matchmaking. Used {freeUsed}; refreshes at
              {" "}{resetLabel}.
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              Extra readings use paid credits or Premium. Each Kundli,
              Matchmaking, Lost item, or Prashna request uses 1 AI turn.
            </p>
            {proActive && premiumRemaining !== null && (
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                Premium allowance: {premiumRemaining} of {premiumDailyLimit} AI
                turns left today.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-start gap-2 small:justify-end">
            {creditPacks.map((pack) => (
              <LocalizedClientLink
                key={pack.id}
                href={`/products/${pack.product_handle}`}
                className="rounded-full border border-[rgba(13,129,126,0.24)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
              >
                {pack.credits} credits
              </LocalizedClientLink>
            ))}
            {premiumPack && (
              <LocalizedClientLink
                href={`/products/${premiumPack.product_handle}`}
                className="rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_58%,#6f211f_100%)] px-3 py-2 text-xs font-semibold text-white"
              >
                Premium ₹{premiumPack.price_inr}/30 days
              </LocalizedClientLink>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`astrology-dashboard astrology-dashboard-${astrologyTheme} grid gap-6 small:gap-8`}
    >
      <section className="astrology-tool-switcher brand-surface relative overflow-hidden px-5 py-6 small:px-8 small:py-8">
        <div className="pointer-events-none absolute inset-x-5 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,161,38,0.38),transparent)]" />
        <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="brand-kicker">Choose your Jyotish tool</p>
            <h1 className="brand-section-title mt-3 max-w-[18ch]">
              Start with the answer you need today.
            </h1>
            <p className="mt-4 max-w-[52rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Muhurth, Hindu calendar, Prashna, lost-item search, Kundli, and
              matchmaking are arranged as direct workspaces so the right tool is
              always one tap away.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ThemeToggle />
            <p className="max-w-[18rem] text-xs leading-5 text-[var(--shreem-muted)]">
              Day keeps the Shreem calm. Night opens the astral desk.
            </p>
          </div>
        </div>

        <div className="astrology-tab-grid mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-6">
          {astrologyTabs.map((tab) => {
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`astrology-tab-card ${
                  active ? "astrology-tab-card-active" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="astrology-tab-dot" />
                  <p className="text-sm font-semibold">{tab.label}</p>
                </div>
                <p className="mt-2 text-xs leading-5">{tab.description}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <div className="brand-card px-4 py-4 small:px-5 small:py-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] xl:items-start">
              <div>
                <p className="brand-kicker">Your desk</p>
                <p className="mt-2 break-words text-sm font-semibold text-[var(--shreem-ink)]">
                  {customerEmail}
                </p>
                <div className="mt-4">
                  <LanguageControls />
                </div>
              </div>
              <div className="border-t border-[var(--shreem-border)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                <PanchangControls compact />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <AiWalletCard />
        </div>
      </section>

      {activeTab === "muhurth" && (
        <>
          <section className="brand-surface overflow-hidden px-5 py-7 small:px-8 small:py-9">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
              <div>
                <p className="brand-kicker">Subh Muhurth</p>
                <h2 className="brand-section-title mt-3 max-w-[16ch]">
                  Auspicious windows for your city and date.
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
              <h3 className="brand-card-title mt-2">
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
              <h3 className="brand-card-title mt-2">
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
              <h3 className="brand-section-title mt-2 max-w-[16ch]">
                Panchang, masa, and festivals
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)]">
                Pick a day directly on the calendar to view tithi, paksha,
                nakshatra, karana, Hindi month significance, and festival
                themes for the selected city.
              </p>
              <div className="mt-5">
                <LocationDateControls showDate={false} />
              </div>
              <div className="mt-5">
                <HinduCalendarGrid />
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
              <h2 className="brand-section-title mt-2 max-w-[16ch]">
                Ask the question exactly as it arises.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                The chart is generated for the exact moment you ask, using the
                selected city. The AI reads the calculated Vedic factors and
                keeps chart facts separate from interpretation. If your question
                has parts, they are answered as first, second, and third.
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
                placeholder="Example: First, should I start this work now? Second, will money get blocked? Third, what should I avoid?"
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
                    inverse={astrologyTheme === "night"}
                  />
                )}
                {!loadingPrashna && !prashna && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    Your answer will appear here with Lagna, Panchang, graha
                    positions, house chart, direct indication, timing, caution,
                    and next step.
                  </p>
                )}
                {prashna?.message && !prashna?.answer && (
                  <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm leading-6 text-rose-700">
                      {prashna.message}
                    </p>
                    {prashna.retryable && (
                      <button
                        type="button"
                        onClick={askPrashna}
                        disabled={loadingPrashna || question.trim().length < 8}
                        className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Retry same Prashna
                      </button>
                    )}
                  </div>
                )}
                {prashna?.answer && prashna.chart && (
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

      {activeTab === "lost-item" && (
        <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="brand-card px-4 py-5 small:px-5">
              <p className="brand-kicker">Nashta-Vastu Prashna</p>
              <h2 className="brand-card-title mt-2 max-w-[14ch]">
                Find a lost item with Lochan Nakshatra.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                This casts a Prashna chart for the moment you ask and applies
                the Four Eyes nakshatra method: Manda, Madhya, Andha, or
                Sulochana. Use it as a focused search map, not as proof against
                any person.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="grid gap-3 small:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Item name
                    </span>
                    <input
                      value={lostItemForm.itemName}
                      onChange={(event) =>
                        setLostItemForm((current) => ({
                          ...current,
                          itemName: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                      placeholder="Phone, ring, document..."
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Item type
                    </span>
                    <select
                      value={lostItemForm.itemType}
                      onChange={(event) =>
                        setLostItemForm((current) => ({
                          ...current,
                          itemType: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    >
                      <option value="">Select type</option>
                      <option value="phone or electronics">Phone / electronics</option>
                      <option value="jewellery or metal">Jewellery / metal</option>
                      <option value="documents or card">Documents / card</option>
                      <option value="keys or tool">Keys / tool</option>
                      <option value="money or wallet">Money / wallet</option>
                      <option value="clothes or bag">Clothes / bag</option>
                      <option value="other personal item">Other personal item</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Owner name
                  </span>
                  <input
                    value={lostItemForm.ownerName}
                    onChange={(event) =>
                      setLostItemForm((current) => ({
                        ...current,
                        ownerName: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    placeholder="Whose item is it?"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                    Last seen place
                  </span>
                  <input
                    value={lostItemForm.lastSeenPlace}
                    onChange={(event) =>
                      setLostItemForm((current) => ({
                        ...current,
                        lastSeenPlace: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    placeholder="Kitchen shelf, car, office desk..."
                  />
                </label>

                <div className="grid gap-3 small:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Last seen date
                    </span>
                    <input
                      type="date"
                      value={lostItemForm.lastSeenDate}
                      onChange={(event) =>
                        setLostItemForm((current) => ({
                          ...current,
                          lastSeenDate: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                      Approx time
                    </span>
                    <input
                      type="time"
                      value={lostItemForm.lastSeenTime}
                      onChange={(event) =>
                        setLostItemForm((current) => ({
                          ...current,
                          lastSeenTime: event.target.value,
                        }))
                      }
                      className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/82 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                    />
                  </label>
                </div>

                <CityPicker label="Question city" value={cityId} onChange={setCityId} />
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <PanchangControls compact />
                </div>
                <textarea
                  value={lostItemForm.notes}
                  onChange={(event) =>
                    setLostItemForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Who was nearby? Any recent travel, cleaning, guests, vehicle use, or suspected direction?"
                  className="min-h-[120px] w-full resize-none rounded-[22px] border border-[var(--shreem-border)] bg-white/80 px-4 py-4 text-sm leading-6 text-[var(--shreem-ink)] outline-none"
                />
                <button
                  type="button"
                  disabled={
                    loadingLostItem ||
                    (!lostItemForm.itemName.trim() &&
                      !lostItemForm.itemType.trim()) ||
                    !lostItemForm.lastSeenPlace.trim()
                  }
                  onClick={askLostItemPrashna}
                  className="mt-2 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingLostItem ? "Casting lost item Prashna..." : "Find lost item"}
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Lost item result</p>
                {loadingLostItem && (
                  <LogoLoader
                    label="Reading Lochan Nakshatra..."
                    detail="Casting the moment chart, checking Moon nakshatra, Bhava Chalit houses, direction, timing, and search sequence."
                    inverse={astrologyTheme === "night"}
                  />
                )}
                {!loadingLostItem && !lostItemResult && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    The answer will show the Four Eyes group, likely direction,
                    search places, timing, recovery signal, and chart reasoning.
                  </p>
                )}
                {lostItemResult?.message && !lostItemResult?.answer && (
                  <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm leading-6 text-rose-700">
                      {lostItemResult.message}
                    </p>
                    {lostItemResult.retryable && (
                      <button
                        type="button"
                        onClick={askLostItemPrashna}
                        disabled={loadingLostItem}
                        className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Retry same lost item Prashna
                      </button>
                    )}
                  </div>
                )}
                {lostItemResult?.answer && (
                  <div className="mt-4">
                    <LostItemResultView result={lostItemResult} />
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
              <h2 className="brand-card-title mt-2">
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
                <CityPicker
                  value={kundliForm.cityId}
                  onChange={(cityId) =>
                    setKundliForm((current) => ({
                      ...current,
                      cityId,
                    }))
                  }
                />
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <LanguageControls />
                </div>
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <PanchangControls compact />
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
                  <div className="grid gap-2">
                    <LogoLoader
                      label={`Generating your Kundli... ${Math.floor(kundliProgress)}%`}
                      detail={
                        kundliProgress < 30
                          ? "Casting the North Indian chart and planetary positions..."
                          : kundliProgress < 60
                          ? "Analyzing dasha context, house strengths, and yogas..."
                          : "Asking Shreem AI for a comprehensive Vedic interpretation..."
                      }
                      inverse={astrologyTheme === "night"}
                    />
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-[var(--shreem-gold)] transition-all duration-300"
                        style={{ width: `${Math.floor(kundliProgress)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!loadingKundli && !kundliResult && (
                  <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                    Your North Indian chart, graha positions, special case
                    checks, upaay, stone indicators, and PDF-ready report will
                    appear here.
                  </p>
                )}
                {kundliResult?.message && (
                  <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm leading-6 text-rose-700">
                      {kundliResult.message}
                    </p>
                    {kundliResult.retryable && (
                      <button
                        type="button"
                        onClick={generateKundli}
                        disabled={
                          loadingKundli ||
                          !kundliForm.birthDate ||
                          !kundliForm.birthTime
                        }
                        className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Retry same Kundli
                      </button>
                    )}
                  </div>
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
              <h2 className="brand-card-title mt-2 max-w-[14ch]">
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
                <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-3 py-3">
                  <PanchangControls compact />
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
                    inverse={astrologyTheme === "night"}
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
                  <div className="mt-3 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm leading-6 text-amber-800">
                      {matchmakingResult.message}
                    </p>
                    {matchmakingResult.retryable && (
                      <button
                        type="button"
                        onClick={generateMatchmaking}
                        disabled={loadingMatchmaking}
                        className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Retry same match
                      </button>
                    )}
                  </div>
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

      <section className="brand-surface relative overflow-hidden px-5 py-7 small:px-8 small:py-9">
        <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-[linear-gradient(90deg,transparent,rgba(212,161,38,0.4),transparent)]" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
          <div>
            <p className="brand-kicker">Astrologer booking</p>
            <h2 className="brand-section-title mt-2 max-w-[17ch]">
              When the chart needs human judgement.
            </h2>
            <p className="mt-4 max-w-[48rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              AI can surface timing, chart factors, and general upaay. Gemstones,
              pooja decisions, major life calls, and strong dosha combinations
              should be reviewed directly with Sanjay Kumar Pandey ji.
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.72)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Best used after a Kundli or Prashna result
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Bring your question, birth details, and any current concern so the
              call can focus on decisions rather than re-entering basics.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 small:grid-cols-2">
          {serviceCards.map((service) => (
            <div
              key={service.title}
              className="brand-card flex flex-col justify-between overflow-hidden px-5 py-5"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="brand-kicker">{service.amount}</p>
                  <span className="grid size-10 place-items-center rounded-full border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] text-sm font-bold text-[var(--shreem-gold-deep)]">
                    Om
                  </span>
                </div>
                <h3 className="brand-card-title mt-2">
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
