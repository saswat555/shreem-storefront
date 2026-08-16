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
import { updateCustomer } from "@lib/data/customer"
import LogoLoader from "@modules/common/components/logo-loader"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { createPortal } from "react-dom"

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
    timing?: string
    action?: string
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
  opening_profile?: string[]
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
  deterministic_review?: {
    area: string
    deterministic_basis_used: string
    missing_or_weak_point: string
    final_decision: string
    needs_more_bphs: boolean
  }[]
  dasha_decision_tree?: {
    period: string
    prevailing_factor: string
    score: number
    decision_rule: string
    expected_outcome: string
  }[]
  house_outcomes?: {
    house: number
    theme: string
    prevailing_impact: string
    user_meaning?: string
    outcome: string
    practical_use?: string
    evidence: string
  }[]
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
    timing?: string
    action?: string
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

type DashaTimelinePeriod = {
  lord: string
  level: "mahadasha" | "antardasha" | "pratyantar" | "sookshma" | "prana"
  startIso: string
  endIso: string
  startLabel: string
  endLabel: string
  durationYears: number
  depth?: number
  parentPath?: string
  role?: string
  score?: number
  focus?: string
}

type KundliDashaTimeline = {
  range?: string
  mahadashas?: DashaTimelinePeriod[]
  lifetime_antardashas?: DashaTimelinePeriod[]
  current_antardashas?: DashaTimelinePeriod[]
  current_pratyantars?: DashaTimelinePeriod[]
  current_sookshmas?: DashaTimelinePeriod[]
  current_pranas?: DashaTimelinePeriod[]
}

type KundliCriticalPeriodAnalysis = {
  maraka_lords?: string[]
  badhaka_house?: number
  badhakesh?: string
  active_triggers?: string[]
  watch_periods?: {
    period: string
    lord: string
    role: string
    window: string
    score?: number
    confidence?: "low" | "medium" | "high"
    caution: string
  }[]
  exact_timing_windows?: {
    period: string
    lord: string
    role: string
    window: string
    score: number
    confidence: "low" | "medium" | "high"
    basis: string
    avoid?: string
    do?: string
  }[]
  retrospective_timing_windows?: {
    period: string
    lord: string
    role: string
    window: string
    score: number
    confidence: "low" | "medium" | "high"
    basis: string
    avoid?: string
    do?: string
  }[]
  medical_watchlist?: {
    condition: string
    severity: "low" | "medium" | "high"
    chart_basis: string
    dasha_trigger: string
    prevention: string
  }[]
  safety_note?: string
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
  dasha_timeline?: KundliDashaTimeline
  critical_period_analysis?: KundliCriticalPeriodAnalysis
  longevity_assessment?: {
    classification: "strong vitality support" | "mixed/medium support" | "requires expert review"
    confidence: "medium" | "low"
    score: number
    protective_factors: string[]
    pressure_factors: string[]
    maraka_factors: string[]
    safety_note: string
    rule_proofs: {
      id: string
      source: string
      chapter: string
      rule: string
      chart_fact: string
      application: string
      score: number
      polarity: "protective" | "pressure" | "method"
    }[]
  }
  bphs_rule_proofs?: {
    id: string
    source: string
    chapter: string
    rule: string
    chart_fact: string
    application: string
    strength: "strong" | "medium" | "supporting"
    area: string
  }[]
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
    deep_scores?: {
      name: string
      score: number
      max: number
      reason: string
    }[]
    case_registry?: string[]
    red_flags?: string[]
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
  input?: Record<string, unknown>
  raw?: Record<string, unknown>
  response?: PrashnaResult | KundliResult | MatchmakingResult | LostItemResult
}

type SavedKundliProfile = {
  id: string
  name: string
  gender?: string
  birthDate: string
  birthTime: string
  cityId: string
  cityLabel?: string
  panchangSystemId?: string
  language?: AstrologyLanguage
  subQuestions?: string[]
  savedAt: string
  updatedAt: string
  lastResult?: KundliResult
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
const SAVED_KUNDLI_KEY = "shreem_saved_kundlis_v1"
const LANGUAGE_KEY = "shreem_site_language_v1"
const ASTROLOGY_CITY_KEY = "shreem_astrology_default_city_v1"
const THEME_KEY = "shreem_astrology_theme_v1"
const LOCAL_HISTORY_LIMIT = 12
const LOCAL_SAVED_KUNDLI_LIMIT = 24

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
  cityId: "",
})

const getCurrentLocalTimeString = () => {
  const now = new Date()

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`
}

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
  const selectedCity = value ? getCityById(value) : null
  const selectedLabel = selectedCity ? cityLabel(selectedCity) : ""
  const [query, setQuery] = useState(selectedLabel)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setQuery(selectedLabel)
  }, [selectedLabel])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return
    }

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect()

      if (!rect) {
        return
      }

      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const spaceBelow = Math.max(160, viewportHeight - rect.bottom - 14)
      const maxHeight = Math.min(320, spaceBelow)

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, query])

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
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
              setQuery(value ? cityLabel(getCityById(value)) : "")
            }, 120)
          }}
          className="h-12 w-full rounded-[16px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-3 text-sm text-[var(--shreem-ink)] shadow-sm outline-none placeholder:text-[var(--shreem-muted)]"
          placeholder="Search and select your city"
        />
        {open && mounted && createPortal(
          <div
            style={dropdownStyle}
            className="z-[9999] overflow-auto rounded-[16px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] py-1 shadow-[0_22px_60px_rgba(2,8,23,0.34)] backdrop-blur"
          >
            {matches.length ? (
              matches.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    chooseCity(city)
                  }}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition hover:bg-[rgba(13,129,126,0.12)] ${
                    city.id === value ? "bg-[rgba(212,161,38,0.18)]" : ""
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
          </div>,
          document.body
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
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.06em] small:tracking-[0.14em] opacity-70">
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
  typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)} deg`
    : ""

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
      {planet.sign}
      {formatDegree(planet.signDegree) ? ` ${formatDegree(planet.signDegree)}` : ""}
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
      <p className="text-xs font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em] text-[var(--shreem-gold-deep)]">
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
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em] text-[var(--shreem-gold-deep)]">
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

const DashaTimelineTable = ({
  timeline,
}: {
  timeline?: KundliDashaTimeline
}) => {
  if (!timeline) {
    return null
  }

  const groups: Array<[string, DashaTimelinePeriod[] | undefined, string]> = [
    [
      "Full life Mahadasha map",
      timeline.mahadashas,
      timeline.range || "Long-range Vimshottari context around the birth timeline.",
    ],
    [
      "Current Antardasha branch",
      timeline.current_antardashas,
      "Sub-periods inside the active Mahadasha. This is the most useful layer for current planning.",
    ],
    [
      "Current Pratyantar branch",
      timeline.current_pratyantars,
      "Shorter trigger layer inside the active Antardasha. Use for near-term action, not fear.",
    ],
  ]

  const visibleGroups = groups.filter(([, rows]) => rows?.length)

  if (!visibleGroups.length) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/70 px-4 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Life dasha timing map
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
          Vimshottari timing from Moon nakshatra balance. The first table covers
          the full Mahadasha life arc; the smaller current branch tables explain
          the present operating period.
        </p>
      </div>
      {!!timeline.mahadashas?.length && (
        <div className="mt-4 grid gap-2 small:grid-cols-2 medium:grid-cols-3">
          {timeline.mahadashas.map((period, index) => {
            const now = new Date()
            const status =
              now >= new Date(period.startIso) && now < new Date(period.endIso)
                ? "Current"
                : new Date(period.endIso) < now
                  ? "Past"
                  : "Future"

            return (
              <article
                key={`life-md-${period.lord}-${period.startIso}-${index}`}
                className={`rounded-[16px] border px-3 py-3 ${
                  status === "Current"
                    ? "border-[rgba(13,129,126,0.34)] bg-[rgba(240,248,246,0.9)]"
                    : "border-[var(--shreem-border)] bg-white/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    {period.lord} Mahadasha
                  </p>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-muted)]">
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  {period.startLabel} to {period.endLabel}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  Approx {Number(period.durationYears).toFixed(1)} years
                </p>
              </article>
            )
          })}
        </div>
      )}
      <div className="mt-4 grid gap-4">
        {visibleGroups.map(([title, rows, note]) => (
          <div key={title} className="grid gap-2">
            <div className="flex flex-col gap-1 small:flex-row small:items-end small:justify-between">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                {title}
              </p>
              <p className="text-xs leading-5 text-[var(--shreem-muted)]">
                {note}
              </p>
            </div>
            <div className="overflow-hidden rounded-[16px] border border-[var(--shreem-border)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-0 small:min-w-[620px] text-left text-xs">
                  <thead className="bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]">
                    <tr>
                      {["Period", "Lord", "From", "To", "Impact"].map((head) => (
                        <th
                          key={head}
                          className="px-3 py-2 font-semibold uppercase tracking-[0.05em] small:tracking-[0.12em]"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--shreem-border)] bg-white/78">
                    {(rows || []).map((row, index) => (
                      <tr key={`${title}-${row.lord}-${row.startIso}-${index}`}>
                        <td className="break-words px-3 py-2 font-medium text-[var(--shreem-ink)]">
                          {row.parentPath ? `${row.parentPath}/` : ""}
                          {row.level}
                        </td>
                        <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">
                          {row.lord}
                        </td>
                        <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">
                          {row.startLabel}
                        </td>
                        <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">
                          {row.endLabel}
                        </td>
                        <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">
                          {row.focus ||
                            row.role ||
                            `Approx ${Number(row.durationYears).toFixed(
                              row.durationYears < 0.1 ? 4 : 2
                            )} years`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!!timeline.lifetime_antardashas?.length && (
        <details className="mt-4 overflow-hidden rounded-[16px] border border-[var(--shreem-border)] bg-white/78">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--shreem-ink)]">
            Full-life Antardasha map ({timeline.lifetime_antardashas.length} periods)
          </summary>
          <p className="border-t border-[var(--shreem-border)] px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
            Open this technical table when checking an event across the whole life. The current branch above remains the practical planning view.
          </p>
          <div className="overflow-x-auto border-t border-[var(--shreem-border)]">
            <table className="w-full min-w-0 small:min-w-[620px] text-left text-xs">
              <thead className="bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]">
                <tr>{["Mahadasha", "Antardasha", "From", "To", "Impact"].map((head) => <th key={head} className="px-3 py-2 font-semibold uppercase tracking-[0.05em] small:tracking-[0.12em]">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--shreem-border)]">
                {timeline.lifetime_antardashas.map((row, index) => (
                  <tr key={`life-ad-${row.parentPath}-${row.lord}-${row.startIso}-${index}`}>
                    <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">{row.parentPath}</td>
                    <td className="break-words px-3 py-2 font-medium text-[var(--shreem-ink)]">{row.lord}</td>
                    <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">{row.startLabel}</td>
                    <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">{row.endLabel}</td>
                    <td className="break-words px-3 py-2 text-[var(--shreem-muted)]">{row.focus || row.role || "Period effect depends on its lord, house ownership, placement, drishti and active sub-period."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}

const PlanetTable = ({ chart }: { chart: PrashnaChart }) => {
  const showDegree = chart.planets.some((planet) => formatDegree(planet.signDegree))
  const showBhavaImpact = chart.planets.some(
    (planet) =>
      typeof planet.bhavaImpactPercent === "number" ||
      (planet.rashiHouse && planet.bhavaHouse && planet.rashiHouse !== planet.bhavaHouse)
  )

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 small:min-w-[680px] text-left text-xs">
          <thead className="bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]">
            <tr>
              {[
                "Graha",
                "Sign",
                showDegree ? "Degree" : "",
                "House",
                showBhavaImpact ? "Bhava impact" : "",
                "Nakshatra",
                "Motion",
              ]
                .filter(Boolean)
                .map((heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]"
                  >
                    {heading}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {chart.planets.map((planet) => (
              <tr
                key={planet.key}
                className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
              >
                <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                  {planet.name}
                </td>
                <td className="break-words px-3 py-3">{planet.sign}</td>
                {showDegree && (
                  <td className="break-words px-3 py-3">
                    {formatDegree(planet.signDegree) || "Degree unavailable"}
                  </td>
                )}
                <td className="break-words px-3 py-3">{formatHousePosition(planet)}</td>
                {showBhavaImpact && (
                  <td className="break-words px-3 py-3">
                    {planet.rashiHouse && planet.bhavaHouse && planet.rashiHouse !== planet.bhavaHouse
                      ? `Rashi H${planet.rashiHouse} to Bhava H${planet.bhavaHouse}`
                      : "Same house"}
                    {typeof planet.bhavaImpactPercent === "number"
                      ? ` · ${planet.bhavaImpactPercent}% ${planet.bhavaImpactState || "impact"}`
                      : ""}
                  </td>
                )}
                <td className="break-words px-3 py-3">
                  {planet.nakshatra} pada {planet.pada}
                </td>
                <td className="break-words px-3 py-3">
                  {planet.retrograde ? "Retrograde" : "Direct"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const HouseTable = ({ chart }: { chart: PrashnaChart }) => {
  const showCusp = chart.houses.some(
    (house) => typeof house.cuspDegree === "number" && house.cuspSign
  )

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 small:min-w-[720px] text-left text-xs">
          <thead className="bg-[rgba(240,248,246,0.86)] text-[var(--shreem-gold-deep)]">
            <tr>
              {["House", "Sign", showCusp ? "Bhava madhya" : "", "Lord", "Planets", "Drishti received", "Theme"]
                .filter(Boolean)
                .map((heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]"
                  >
                    {heading}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {chart.houses.map((house) => {
              const planets = getHousePlanets(chart, house.house)
              const synthesis = chart.houseSynthesis?.find(
                (item) => item.house === house.house
              )
              const aspects = synthesis?.aspectsReceived || house.aspectsReceived || []

              return (
                <tr
                  key={house.house}
                  className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
                >
                  <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                    {house.house}
                  </td>
                  <td className="break-words px-3 py-3">{house.sign}</td>
                  {showCusp && (
                    <td className="break-words px-3 py-3">
                      {typeof house.cuspDegree === "number" && house.cuspSign
                        ? `${house.cuspSign} ${formatDegree(house.cuspDegree)}`
                        : "Not calculated for this house"}
                    </td>
                  )}
                  <td className="break-words px-3 py-3">{house.signLord}</td>
                  <td className="break-words px-3 py-3">
                    {planets.length
                      ? planets.map((planet) => planet.name).join(", ")
                      : "None"}
                  </td>
                  <td className="break-words px-3 py-3">
                    {aspects.length
                      ? aspects
                          .slice(0, 4)
                          .map(
                            (aspect) =>
                              `${aspect.fromPlanet} ${aspect.aspectType}`
                          )
                          .join(", ")
                      : "None"}
                  </td>
                  <td className="break-words px-3 py-3">{house.theme}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const GrahaProofGrid = ({ chart }: { chart: PrashnaChart }) => (
  <section className="rounded-[22px] border border-[rgba(212,161,38,0.22)] bg-[rgba(255,248,233,0.62)] px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
      Graha proof
    </p>
    <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
      Each graha card shows placement, nakshatra, motion, Bhava Chalit shift,
      and the houses it aspects. This is easier to read than a raw graha table.
    </p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {chart.planets.map((planet) => {
        const aspects = planet.aspects || []
        const rashiHouse = planet.rashiHouse || planet.house
        const bhavaHouse = planet.bhavaHouse || planet.house

        return (
          <article
            key={`graha-proof-${planet.key}`}
            className="min-w-0 rounded-[18px] border border-[var(--shreem-border)] bg-white/76 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {planet.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {planet.sign}
                  {formatDegree(planet.signDegree)
                    ? ` ${formatDegree(planet.signDegree)}`
                    : ""}{" "}
                  · {planet.nakshatra} pada {planet.pada}
                  {planet.retrograde ? " · retrograde" : " · direct"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[rgba(13,129,126,0.08)] px-2.5 py-1 text-xs font-semibold text-[var(--shreem-accent-dark)]">
                H{planet.house}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--shreem-muted)]">
              <p>
                <span className="font-semibold text-[var(--shreem-ink)]">
                  House effect:
                </span>{" "}
                {formatHousePosition(planet)}
              </p>
              {rashiHouse !== bhavaHouse && (
                <p className="rounded-[14px] bg-[rgba(255,248,233,0.86)] px-3 py-2">
                  Bhava Chalit shifts this graha from Rashi H{rashiHouse} to
                  Bhava H{bhavaHouse}
                  {typeof planet.bhavaImpactPercent === "number"
                    ? ` with ${planet.bhavaImpactPercent}% ${planet.bhavaImpactState || "measured"} impact`
                    : ""}
                  .
                </p>
              )}
              <p>
                <span className="font-semibold text-[var(--shreem-ink)]">
                  Drishti given:
                </span>{" "}
                {aspects.length
                  ? aspects
                      .slice(0, 4)
                      .map(
                        (aspect) =>
                          `H${aspect.toHouse} ${aspect.toSign} (${aspect.aspectType})`
                      )
                      .join(", ")
                  : "No listed special drishti."}
              </p>
              {planet.houseNote && (
                <p className="rounded-[14px] bg-[rgba(240,248,246,0.72)] px-3 py-2">
                  {compactKundliText(planet.houseNote, 220)}
                </p>
              )}
            </div>
          </article>
        )
      })}
    </div>
  </section>
)

const AspectAuditTable = ({ chart }: { chart: PrashnaChart }) => {
  const aspects = chart.aspects || []

  if (!aspects.length) {
    return (
      <p className="rounded-[16px] border border-[var(--shreem-border)] bg-white/64 px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
        No Parashari drishti rows were produced for this chart.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 small:min-w-[760px] text-left text-xs">
          <thead className="bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]">
            <tr>
              {["From", "To", "Drishti", "Theme", "Interpretation"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {aspects.map((aspect, index) => (
              <tr
                key={`${aspect.fromPlanet}-${aspect.toHouse}-${index}`}
                className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
              >
                <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                  {aspect.fromPlanet} · H{aspect.fromHouse} {aspect.fromSign}
                </td>
                <td className="break-words px-3 py-3">
                  H{aspect.toHouse} {aspect.toSign}
                </td>
                <td className="break-words px-3 py-3">
                  {aspect.aspectType} · {aspect.strength}
                </td>
                <td className="break-words px-3 py-3">{aspect.theme}</td>
                <td className="break-words px-3 py-3">
                  {aspect.interpretation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const HouseSynthesisAuditTable = ({ chart }: { chart: PrashnaChart }) => {
  const rows = chart.houseSynthesis || []

  if (!rows.length) {
    return (
      <p className="rounded-[16px] border border-[var(--shreem-border)] bg-white/64 px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
        House synthesis audit was not produced for this chart.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/64">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 small:min-w-[820px] text-left text-xs">
          <thead className="bg-[rgba(240,248,246,0.86)] text-[var(--shreem-gold-deep)]">
            <tr>
              {["House", "Sign/Lord", "Planets", "Drishti received", "Synthesis"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`house-synthesis-audit-${row.house}`}
                className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]"
              >
                <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">
                  H{row.house} · {row.theme}
                </td>
                <td className="break-words px-3 py-3">
                  {row.sign} · lord {row.signLord}
                </td>
                <td className="break-words px-3 py-3">
                  {row.planetsPlaced.length
                    ? row.planetsPlaced.join(", ")
                    : "No planet placed"}
                </td>
                <td className="break-words px-3 py-3">
                  {row.aspectsReceived.length
                    ? row.aspectsReceived
                        .map(
                          (aspect) =>
                            `${aspect.fromPlanet} ${aspect.aspectType}`
                        )
                        .join(", ")
                    : "None"}
                </td>
                <td className="break-words px-3 py-3">{row.synthesis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const BphsRuleProofList = ({
  proofs,
}: {
  proofs?: KundliResult["bphs_rule_proofs"]
}) => {
  if (!proofs?.length) {
    return null
  }

  return (
    <section className="rounded-[22px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.68)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        BPHS rule proof
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        Deterministic rule matches from Brihat Parashara Hora Shastra. These are
        calculated before AI text generation, so astrologers can verify the
        exact shastra rule, chart fact, and application.
      </p>
      <div className="mt-4 grid gap-3">
        {proofs.slice(0, 18).map((proof, index) => (
          <article
            key={`${proof.id}-${index}`}
            className="rounded-[18px] border border-[var(--shreem-border)] bg-white/76 px-4 py-4"
          >
            <div className="flex flex-col gap-2 small:flex-row small:items-start small:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {proof.chapter}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)]">
                  {proof.area} · {proof.strength}
                </p>
              </div>
              <span className="rounded-full bg-[rgba(13,129,126,0.08)] px-3 py-1 text-xs font-semibold text-[var(--shreem-accent-dark)]">
                {proof.source}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--shreem-muted)]">
              <p>
                <span className="font-semibold text-[var(--shreem-ink)]">
                  Rule:
                </span>{" "}
                {proof.rule}
              </p>
              <p className="rounded-[14px] bg-[rgba(240,248,246,0.72)] px-3 py-2">
                <span className="font-semibold text-[var(--shreem-ink)]">
                  Chart fact:
                </span>{" "}
                {proof.chart_fact}
              </p>
              <p className="rounded-[14px] bg-[rgba(255,252,248,0.86)] px-3 py-2">
                <span className="font-semibold text-[var(--shreem-ink)]">
                  Application:
                </span>{" "}
                {proof.application}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const LongevityAssessmentCard = ({
  assessment,
}: {
  assessment?: KundliResult["longevity_assessment"]
}) => {
  if (!assessment) {
    return null
  }

  const factorGroups = [
    {
      label: "Protective factors",
      values: assessment.protective_factors,
      tone: "text-[var(--shreem-accent-dark)]",
    },
    {
      label: "Pressure factors",
      values: assessment.pressure_factors,
      tone: "text-[var(--shreem-maroon)]",
    },
    {
      label: "Maraka audit",
      values: assessment.maraka_factors,
      tone: "text-[var(--shreem-muted)]",
    },
  ]

  return (
    <section className="rounded-[22px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.72)] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Longevity rule audit
          </p>
          <h4 className="mt-2 text-lg font-semibold text-[var(--shreem-ink)]">
            {assessment.classification}
          </h4>
          <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
            Score {assessment.score} · confidence {assessment.confidence}. This
            is classical vitality evidence for astrologer review, not a death
            date or medical prediction.
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--shreem-ink)]">
          BPHS Ch. 43-44
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {factorGroups.map((group) => (
          <div
            key={group.label}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3"
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${group.tone}`}>
              {group.label}
            </p>
            <ul className="mt-2 grid gap-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {group.values?.length ? (
                group.values.slice(0, 4).map((value, index) => (
                  <li key={`${group.label}-${index}`}>{value}</li>
                ))
              ) : (
                <li>No strong factor isolated.</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {assessment.rule_proofs.slice(0, 5).map((proof) => (
          <article
            key={proof.id}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-3 py-3 text-xs leading-5 text-[var(--shreem-muted)]"
          >
            <p className="font-semibold text-[var(--shreem-ink)]">
              {proof.chapter} · {proof.polarity} · score {proof.score}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-[var(--shreem-ink)]">Rule:</span>{" "}
              {proof.rule}
            </p>
            <p className="mt-2 rounded-[12px] bg-[rgba(240,248,246,0.72)] px-3 py-2">
              <span className="font-semibold text-[var(--shreem-ink)]">
                Chart fact:
              </span>{" "}
              {proof.chart_fact}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-[var(--shreem-ink)]">
                Application:
              </span>{" "}
              {proof.application}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--shreem-muted)]">
        {assessment.safety_note}
      </p>
    </section>
  )
}

const AstrologerAuditTables = ({ chart }: { chart: PrashnaChart }) => (
  <section className="rounded-[22px] border border-[rgba(18,63,99,0.14)] bg-[rgba(255,252,248,0.78)] px-4 py-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Astrologer audit tables
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        Technical verification layer for astrologers: house placement, graha
        placement, Bhava Chalit movement, received drishti, and synthesized
        house judgement. Columns that cannot be calculated for the selected
        system are hidden instead of shown blank.
      </p>
    </div>
    <div className="mt-4 grid gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
          House audit
        </p>
        <HouseTable chart={chart} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
          Graha audit
        </p>
        <PlanetTable chart={chart} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
          Drishti audit
        </p>
        <AspectAuditTable chart={chart} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
          House synthesis audit
        </p>
        <HouseSynthesisAuditTable chart={chart} />
      </div>
    </div>
  </section>
)

const PredictionTable = ({
  rows,
  hasQuestionAnswers = false,
}: {
  rows?: KundliAnalysis["prediction_table"]
  hasQuestionAnswers?: boolean
}) => {
  const visibleRows = (rows || []).filter((row) => {
    const text = `${row.area || ""} ${row.chart_basis || ""} ${row.prediction || ""}`.toLowerCase()

    return (
      !/(markesh|maraka|badhakesh|bad period|danger window|death|cancer|diabetes|thyroid|arthritis|bp disease)/.test(
        text
      ) && !isTemplatePredictionRow(row, hasQuestionAnswers)
    )
  })

  if (!visibleRows.length) {
    return null
  }

  return (
    <div className="rounded-[22px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Prediction proof cards
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
          Each card gives the useful prediction first. The proof line is kept
          compact so this section stays readable instead of becoming an internal
          audit table.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleRows.map((row, index) => (
          <article
            key={`${row.area}-${index}`}
            className="rounded-[18px] border border-[var(--shreem-border)] bg-white/70 px-4 py-4"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {row.area}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {row.prediction}
            </p>
            {row.advice && (
              <p className="mt-3 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                {row.advice}
              </p>
            )}
            {row.chart_basis && (
              <p className="mt-3 text-xs leading-5 text-[var(--shreem-muted)]">
                <span className="font-semibold text-[var(--shreem-ink)]">
                  Why:
                </span>{" "}
                {compactKundliText(row.chart_basis, 260)}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

const PrashnaChartView = ({ result }: { result: PrashnaResult }) => {
  const chart = result.chart
  const [guideOpen, setGuideOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("prashna-answer")

  if (!chart) {
    return null
  }

  return (
    <div className="grid gap-4 relative">
      <ResultAnchorNav
        items={[
          { id: "prashna-answer", label: "Answer" },
          { id: "prashna-chart", label: "Chart" },
          { id: "prashna-factors", label: "Factors" },
          { id: "prashna-timing", label: "Timing" },
        ]}
        activeId={activeSection}
        onSelect={setActiveSection}
        onOpenInfo={() => setGuideOpen(true)}
      />
      <KundliGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <div className="flex justify-center mb-4">
        <LogoLoader compact animated={false} label="Shreem Prashna Kundli" />
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

      <div
        id="prashna-chart"
        className={
          activeSection === "prashna-chart"
            ? "grid gap-4 scroll-mt-28 xl:grid-cols-2"
            : "hidden"
        }
      >
        <NorthIndianChart chart={chart} mode="lagna" title="Prashna Rashi chart" />
        <NorthIndianChart chart={chart} mode="bhava" title="Prashna Bhava Chalit" />
      </div>

      {activeSection === "prashna-chart" && <BhavaChalitSummary chart={chart} />}

      {result.answer && (
        <div
          id="prashna-answer"
          className={
            activeSection === "prashna-answer"
              ? "overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/66 scroll-mt-28"
              : "hidden"
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-0 small:min-w-[680px] text-left text-sm">
              <tbody>
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
              <tr
                key={label}
                className="border-t border-[var(--shreem-border)] first:border-t-0"
              >
                <th className="break-words w-[180px] bg-[rgba(255,248,233,0.72)] px-4 py-4 align-top text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
                  {label}
                </th>
                <td className="break-words break-words px-4 py-4 leading-7 text-[var(--shreem-muted)]">
                  {value}
                </td>
              </tr>
            ) : null
          )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === "prashna-answer" &&
        Boolean(result.sub_question_answers?.length) && (
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

      {activeSection === "prashna-factors" &&
        Boolean(result.key_chart_factors?.length || chart.prashnaFactors.length) && (
        <div id="prashna-factors" className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4 scroll-mt-28">
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

      {activeSection === "prashna-factors" && (
        <BookCitationList items={result.book_citations} />
      )}

      {activeSection === "prashna-answer" && result.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[rgba(255,248,233,0.84)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.expert_call_reason ||
              "This question is better reviewed with a human astrologer before acting."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-expert-jyotish-consultation"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-2.5 text-sm font-semibold text-white small:w-auto"
          >
            Book Sanjay Kumar Pandey
          </LocalizedClientLink>
        </div>
      )}

      {activeSection === "prashna-factors" && chart.planets.length > 0 && (
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

      {activeSection === "prashna-factors" && chart.houses.length > 0 && (
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

      <p
        id="prashna-timing"
        className={
          activeSection === "prashna-timing"
            ? "rounded-[18px] border border-[var(--shreem-border)] bg-white/52 px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)] scroll-mt-28"
            : "hidden"
        }
      >
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

const splitPlanetLabels = (labels: string[]) => {
  if (!labels.length) return []
  if (labels.length <= 2) return [labels.join(" ")]
  if (labels.length <= 4) return [labels.slice(0, 2).join(" "), labels.slice(2).join(" ")]
  return [
    labels.slice(0, 2).join(" "),
    labels.slice(2, 4).join(" "),
    labels.slice(4).join(" "),
  ]
}

const northIndianHouseCenters: Record<
  number,
  { x: number; y: number; width: number; align?: "start" | "middle" | "end" }
> = {
  1: { x: 300, y: 104, width: 118 },
  2: { x: 212, y: 74, width: 128 },
  3: { x: 96, y: 116, width: 118 },
  4: { x: 83, y: 224, width: 112 },
  5: { x: 96, y: 306, width: 118 },
  6: { x: 218, y: 374, width: 128 },
  7: { x: 300, y: 318, width: 118 },
  8: { x: 382, y: 374, width: 128 },
  9: { x: 504, y: 306, width: 118 },
  10: { x: 517, y: 224, width: 112 },
  11: { x: 504, y: 116, width: 118 },
  12: { x: 388, y: 74, width: 128 },
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

const escapeChartText = (value?: string | number) =>
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

const getChartPlanetLines = (
  cell: ReturnType<typeof buildChartCells>[number]
) => {
  const labels = [
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
  ]

  return labels.length ? splitPlanetLabels(labels).slice(0, 3) : []
}

const getChartTextAnchor = (house: number) =>
  northIndianHouseCenters[house]?.align || "middle"

const getChartTextX = (house: number) => {
  const slot = northIndianHouseCenters[house]

  if (!slot) return 300
  if (slot.align === "start") return slot.x - slot.width / 2
  if (slot.align === "end") return slot.x + slot.width / 2
  return slot.x
}

const buildNorthIndianChartSvg = ({
  chart,
  mode = "lagna",
  title,
}: {
  chart: PrashnaChart
  mode?: "lagna" | "moon" | "bhava"
  title: string
}) => {
  const cells = buildChartCells(chart, mode)

  return `<svg viewBox="0 0 600 420" role="img" aria-label="${escapeChartText(
    title
  )}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .chart-line{stroke:#111827;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
        .chart-soft{stroke:#c9b989;stroke-width:1;stroke-linecap:round}
        .label-bg{fill:#fffdf8;opacity:.92}
        .house-sign{fill:#7b5618;font:700 13px Arial,sans-serif;letter-spacing:.02em}
        .planet-text{fill:#123f63;font:800 16px Arial,sans-serif}
      </style>
    </defs>
    <rect x="18" y="18" width="564" height="384" rx="10" fill="#fffdf8" stroke="#111827" stroke-width="3.2" />
    <path class="chart-line" d="M18 18 L582 402 M582 18 L18 402" fill="none" />
    <path class="chart-line" d="M300 18 L582 210 L300 402 L18 210 Z" fill="none" />
    <path class="chart-soft" d="M300 18 L300 402 M18 210 L582 210" fill="none" opacity=".16" />
    ${cells
      .map((cell) => {
        const slot = northIndianHouseCenters[cell.house]
        const signNumber = SIGN_NUMBERS[cell.sign] || ""
        const planetLines = getChartPlanetLines(cell)
        const anchor = getChartTextAnchor(cell.house)
        const x = getChartTextX(cell.house)
        const signY = slot.y - (planetLines.length ? 14 : 0)
        const planetStartY = slot.y + (planetLines.length > 2 ? 3 : 8)
        const bgX =
          anchor === "start" ? x - 6 : anchor === "end" ? x - 92 : x - 48
        const bgHeight = 24 + planetLines.length * 20

        return `<g>
          <rect class="label-bg" x="${bgX}" y="${signY - 17}" width="98" height="${bgHeight}" rx="8" />
          <text class="house-sign" x="${x}" y="${signY}" text-anchor="${anchor}">${escapeChartText(
            `H${cell.house} R${signNumber}`
          )}</text>
          ${
            planetLines.length
              ? planetLines
                  .map(
                    (line, index) =>
                      `<text class="planet-text" x="${x}" y="${
                        planetStartY + index * 22
                      }" text-anchor="${anchor}">${escapeChartText(line)}</text>`
                  )
                  .join("")
              : ""
          }
        </g>`
      })
      .join("")}
  </svg>`
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

  const chartSvg = buildNorthIndianChartSvg({ chart, mode, title })

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
        <div
          className="absolute inset-0 h-full w-full"
          dangerouslySetInnerHTML={{ __html: chartSvg }}
        />
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
        <table className="w-full text-left text-xs border-collapse min-w-0 small:min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--shreem-border)] text-[var(--shreem-muted)]">
              <th className="break-words py-2 pr-3 font-semibold w-1/6">Planet</th>
              <th className="break-words py-2 px-3 font-semibold w-1/4">Effect</th>
              <th className="break-words py-2 px-3 font-semibold w-1/4">Timing</th>
              <th className="break-words py-2 pl-3 font-semibold w-1/3">Advice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--shreem-border)] text-[var(--shreem-ink)]">
            {rows.map((item, index) => (
              <tr key={`${item.planet}-${index}`} className="group hover:bg-white/40 transition-colors">
                <td className="break-words py-3 pr-3 align-top">
                  <span className="font-semibold block">{item.planet}</span>
                  <span className="text-[0.66rem] text-[var(--shreem-muted)] block mt-1 leading-snug">
                    {item.placement}
                  </span>
                </td>
                <td className="break-words py-3 px-3 align-top">
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
                <td className="break-words py-3 px-3 align-top leading-5 text-[var(--shreem-muted)]">
                  {item.activation_period || "-"}
                </td>
                <td className="break-words py-3 pl-3 align-top leading-5 text-[var(--shreem-muted)]">
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
              Evidence: {safeKundliText(item.chart_basis, "")}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              BPHS: {safeKundliText(item.classical_basis, "")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-ink)]">
              {safeKundliText(item.prediction, "")}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.78)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {safeKundliText(item.action, "")}
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
    <div className="mt-4 rounded-[20px] border border-[var(--shreem-border)] bg-[rgba(255,249,235,0.7)] px-4 py-4">
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
              {safeKundliText(item.answer, "", "This question needs a fresh AI interpretation.")}
            </p>
            {item.timing && (
              <div className="mt-3 rounded-[12px] bg-[rgba(255,211,105,0.16)] px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--shreem-gold-deep)]">
                  Timing
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {safeKundliText(item.timing, "")}
                </p>
              </div>
            )}
            {item.action && (
              <div className="mt-3 rounded-[12px] bg-[rgba(13,129,126,0.08)] px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--shreem-ink)]">
                  Suggested action / upaay
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {safeKundliText(item.action, "")}
                </p>
              </div>
            )}
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
              Evidence: {safeKundliText(item.chart_basis, "")}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              BPHS: {safeKundliText(item.classical_basis, "")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              {safeKundliText(item.combined_effect, "")}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(13,129,126,0.08)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Timing: {safeKundliText(item.timing, "")}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Solution: {safeKundliText(item.solution, "")}
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
        Markesh, Badhakesh and bad period watch
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
        Prevention-focused timing from Maraka lords, Badhakesh, dasha triggers,
        and 6th/8th/12th house health signals. This is not a diagnosis.
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

const CriticalTimingWindowList = ({
  analysis,
}: {
  analysis?: KundliCriticalPeriodAnalysis
}) => {
  const rawRows = analysis?.exact_timing_windows?.length
    ? analysis.exact_timing_windows
    : analysis?.watch_periods || []
  const rows = rawRows.filter((row) => {
    const score = "score" in row ? Number(row.score || 0) : 0
    return row.confidence === "high" && score >= 24
  })
  const retrospectiveRows = (analysis?.retrospective_timing_windows || []).filter(
    (row) => row.confidence === "high" && Number(row.score || 0) >= 24
  )

  if (!analysis) {
    return (
      <section className="rounded-[22px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.76)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Next 30 years Markesh prevention windows
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
          This saved report does not include the newer Markesh scan data.
          Regenerate the Kundli once to calculate the next-30-year prevention
          windows and technical Maraka/Badhaka audit.
        </p>
      </section>
    )
  }

  if (!rows.length && !retrospectiveRows.length) {
    return (
      <section className="rounded-[22px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.76)] px-4 py-4">
        <div className="flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Lifetime Markesh prevention windows
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              The system scanned birth-to-current history and the next 30 years
              of Vimshottari timing, but no high-confidence Markesh prevention window met the display
              threshold. This is good: weak or loose combinations are hidden so
              the reading does not create fear. The technical audit is still
              available in Chart Proof.
            </p>
          </div>
          {analysis.badhakesh && (
            <span className="rounded-full bg-white/78 px-3 py-1 text-xs font-semibold text-[var(--shreem-ink)]">
              Badhakesh: {analysis.badhakesh}
            </span>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[22px] border border-[rgba(111,33,31,0.16)] bg-[rgba(255,248,233,0.76)] px-4 py-4">
      <div className="flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Lifetime Markesh prevention windows
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            Past windows help compare the rule engine with lived experience; future windows support prevention planning. The list shows short Sookshma/Pratyantar prevention windows
            only when Maraka, Badhaka, dusthana, node and Mars/Saturn pressure
            repeat together. Use these dates for discipline, careful travel,
            routine checks and expert review, never as fatalistic prediction.
          </p>
        </div>
        {analysis?.badhakesh && (
          <span className="rounded-full bg-white/78 px-3 py-1 text-xs font-semibold text-[var(--shreem-ink)]">
            Badhakesh: {analysis.badhakesh}
          </span>
        )}
      </div>
      {!!retrospectiveRows.length && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            Strongest windows from birth to today
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
            These are retrospective rule matches, not claims that a specific event certainly happened.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {retrospectiveRows.slice(0, 4).map((row, index) => (
              <article key={`past-${row.period}-${row.window}-${index}`} className="rounded-[18px] border border-[var(--shreem-border)] bg-white/78 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">{row.period}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">{row.role}</p>
                <p className="mt-3 rounded-[14px] bg-[rgba(240,248,246,0.76)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--shreem-ink)]">{row.window}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">Score {row.score} · {row.basis}</p>
                {row.avoid && <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]"><span className="font-semibold text-[var(--shreem-ink)]">Avoid:</span> {row.avoid}</p>}
                {row.do && <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]"><span className="font-semibold text-[var(--shreem-ink)]">Preventive action:</span> {row.do}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
      <p className="mt-5 text-sm font-semibold text-[var(--shreem-ink)]">
        Strongest windows from today through the next 30 years
      </p>
      <p className="mt-4 rounded-[14px] bg-white/72 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
        Showing {Math.min(rows.length, 8)} strongest windows from {rawRows.length} scanned
        candidates. Weak, duplicate, or single-factor windows are hidden to avoid noise.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.slice(0, 8).map((row, index) => (
          <article
            key={`${row.period}-${row.window}-${index}`}
            className="rounded-[18px] border border-[var(--shreem-border)] bg-white/78 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {row.period}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                  {row.role}
                </p>
              </div>
              <span className="rounded-full bg-[rgba(13,129,126,0.08)] px-2.5 py-1 text-xs font-semibold text-[var(--shreem-accent-dark)]">
                {row.confidence || "watch"}
              </span>
            </div>
            <p className="mt-3 rounded-[14px] bg-[rgba(240,248,246,0.76)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
              {row.window}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Score: {"score" in row && typeof row.score === "number" ? row.score : "-"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {"basis" in row ? row.basis : row.caution}
            </p>
            {"avoid" in row && row.avoid && (
              <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]"><span className="font-semibold text-[var(--shreem-ink)]">Avoid:</span> {row.avoid}</p>
            )}
            {"do" in row && row.do && (
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]"><span className="font-semibold text-[var(--shreem-ink)]">Preventive action:</span> {row.do}</p>
            )}
          </article>
        ))}
      </div>
      {analysis?.safety_note && (
        <p className="mt-3 rounded-[14px] bg-white/70 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
          {analysis.safety_note}
        </p>
      )}
    </section>
  )
}

const CustomerMarkeshTimeline = ({
  analysis,
}: {
  analysis?: KundliCriticalPeriodAnalysis
}) => {
  if (!analysis) {
    return (
      <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Lifetime prevention calendar
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
          This older saved reading does not contain the lifetime timing scan.
          Generate it again once to add the birth-to-today review and the next
          30 years of carefully filtered prevention dates.
        </p>
      </section>
    )
  }

  const selectCustomerTimingRows = (
    rows:
      | KundliCriticalPeriodAnalysis["exact_timing_windows"]
      | KundliCriticalPeriodAnalysis["retrospective_timing_windows"]
      | undefined
  ) => {
    const sortedRows = [...(rows || [])].sort(
      (a, b) => Number(b.score || 0) - Number(a.score || 0)
    )
    const strictRows = sortedRows.filter(
      (row) => row.confidence === "high" && Number(row.score || 0) >= 24
    )
    if (strictRows.length) {
      return strictRows
    }

    const highRows = sortedRows.filter((row) => row.confidence === "high")
    if (highRows.length) {
      return highRows
    }

    return sortedRows.filter((row) => Number(row.score || 0) >= 20)
  }

  const groups = [
    {
      title: "Birth to today",
      description:
        "Past dates help you compare the timing calculation with events you remember.",
      rows: selectCustomerTimingRows(analysis.retrospective_timing_windows),
    },
    {
      title: "Today to the next 30 years",
      description:
        "Future dates are reminders for extra discipline, routine checks and careful decisions.",
      rows: selectCustomerTimingRows(analysis.exact_timing_windows),
    },
  ]

  return (
    <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Markesh timing
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
        Strong Markesh watch periods across life
      </h3>
      <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
        Only the strongest repeated combinations are shown. These dates do not
        predict death, disease or a certain harmful event. They are practical
        reminders to avoid unnecessary risk and look after health and routine.
      </p>
      <div className="mt-4 grid gap-3 small:grid-cols-3">
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)]">
            Maraka lords
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
            {analysis.maraka_lords?.filter(Boolean).join(", ") || "Not calculated"}
          </p>
        </div>
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)]">
            Badhaka house
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
            {analysis.badhaka_house ? `House ${analysis.badhaka_house}` : "Not calculated"}
          </p>
        </div>
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--shreem-gold-deep)]">
            Badhakesh
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
            {analysis.badhakesh || "Not calculated"}
          </p>
        </div>
      </div>
      {!!analysis.active_triggers?.length && (
        <p className="mt-3 rounded-[14px] bg-[rgba(240,248,246,0.76)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
          Active timing triggers: {analysis.active_triggers.slice(0, 4).join("; ")}
        </p>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-[18px] border border-[var(--shreem-border)] bg-white/78 px-4 py-4"
          >
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              {group.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {group.description}
            </p>
            <div className="mt-3 grid gap-3">
              {group.rows.slice(0, 6).map((row, index) => (
                <article
                  key={`${group.title}-${row.window}-${index}`}
                  className="rounded-[14px] bg-[rgba(255,248,233,0.72)] px-3 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    {row.window}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {row.period} creates a stronger-than-usual caution period.
                  </p>
                  {row.avoid && (
                    <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                      <span className="font-semibold text-[var(--shreem-ink)]">Avoid:</span>{" "}
                      {row.avoid}
                    </p>
                  )}
                  {row.do && (
                    <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                      <span className="font-semibold text-[var(--shreem-ink)]">Do:</span>{" "}
                      {row.do}
                    </p>
                  )}
                </article>
              ))}
              {!group.rows.length && (
                <p className="rounded-[14px] bg-[rgba(240,248,246,0.72)] px-3 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
                  Markesh roles were calculated, but no short window in this
                  range crossed the strict multi-factor display threshold.
                  Weaker or single-factor combinations are intentionally hidden.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const MarakaBadhakaAuditCard = ({
  analysis,
}: {
  analysis?: KundliCriticalPeriodAnalysis
}) => {
  if (!analysis) {
    return null
  }

  const facts = [
    {
      label: "Maraka lords",
      value: analysis.maraka_lords?.filter(Boolean).join(", ") || "Not calculated",
    },
    {
      label: "Badhaka house",
      value: analysis.badhaka_house ? `House ${analysis.badhaka_house}` : "Not calculated",
    },
    {
      label: "Badhakesh",
      value: analysis.badhakesh || "Not calculated",
    },
    {
      label: "Current technical triggers",
      value:
        analysis.active_triggers?.filter(Boolean).slice(0, 4).join("; ") ||
        "No strong active trigger shown",
    },
  ]

  return (
    <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/68 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Technical Maraka/Badhaka audit
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        This is chart proof for astrologer review only. The reading does not show
        deterministic event dates from this layer unless stricter validation is
        added.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
              {fact.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
      {analysis.safety_note && (
        <p className="mt-3 rounded-[14px] bg-[rgba(240,248,246,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
          {analysis.safety_note}
        </p>
      )}
    </section>
  )
}

const HistoryPanel = ({
  items,
  onSelect,
}: {
  items: AstrologyHistoryItem[]
  onSelect: (item: AstrologyHistoryItem) => void
}) => {
  const pageSize = 3
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const visibleItems = items.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  )

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [page, totalPages])

  return (
    <div className="brand-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">Recent history</p>
          {items.length > 0 && (
            <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
              Showing {safePage * pageSize + 1}-
              {Math.min((safePage + 1) * pageSize, items.length)} of{" "}
              {items.length}. Use the controls below to browse older readings.
            </p>
          )}
        </div>
        {items.length > 3 && (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[0.66rem] font-semibold text-[var(--shreem-ink)]">
            Page {safePage + 1}/{totalPages}
          </span>
        )}
      </div>
      {!items.length && (
        <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
          Your last Prashna, Lost item, Kundli, and matchmaking sessions will
          appear here after you run them.
        </p>
      )}
      <div className="mt-3 grid gap-2">
        {visibleItems.map((item) => (
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
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              {item.summary}
            </p>
            {getHistoryDetailLines(item).length > 0 && (
              <div className="mt-2 grid gap-1">
                {getHistoryDetailLines(item)
                  .slice(0, 4)
                  .map((line) => (
                    <p
                      key={line}
                      className="text-[0.68rem] leading-4 text-[var(--shreem-muted)]"
                    >
                      {line}
                    </p>
                  ))}
              </div>
            )}
            <p className="mt-2 text-[0.66rem] font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em] text-[var(--shreem-gold-deep)]">
              {formatHistoryDate(item.createdAt)}
              {item.synced === false ? " · Local" : " · Saved"}
            </p>
          </button>
        ))}
      </div>
      {items.length > pageSize && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-full border border-[var(--shreem-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-full border border-[rgba(13,129,126,0.22)] bg-white px-3 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

const SavedKundliPanel = ({
  profiles,
  message,
  syncing,
  onUse,
  onOpen,
  onGenerate,
  onRemove,
}: {
  profiles: SavedKundliProfile[]
  message?: string
  syncing?: boolean
  onUse: (profile: SavedKundliProfile) => void
  onOpen: (profile: SavedKundliProfile) => void
  onGenerate: (profile: SavedKundliProfile) => void
  onRemove: (profile: SavedKundliProfile) => void
}) => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(profiles.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const visibleProfiles = profiles.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  )

  const closeAfter = (action: () => void, shouldClose = true) => {
    action()
    if (shouldClose) {
      setOpen(false)
    }
  }

  return (
    <div className="brand-card px-4 py-4">
      <div className="flex flex-col gap-3 small:flex-row small:items-start small:justify-between">
        <div>
          <p className="brand-kicker">Saved Kundlis</p>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            {profiles.length
              ? `${profiles.length} saved profile${profiles.length === 1 ? "" : "s"}. Open the library when you need one.`
              : "Save family birth details once, then reopen them from a clean library."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {syncing && (
            <span className="rounded-full bg-[rgba(13,129,126,0.08)] px-2 py-1 text-[0.65rem] font-semibold text-[var(--shreem-accent-dark)]">
              Syncing
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-[rgba(13,129,126,0.22)] bg-[var(--shreem-surface)] px-4 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)] shadow-sm"
          >
            Manage saved Kundlis
          </button>
        </div>
      </div>
      {message && (
        <p className="mt-3 rounded-[14px] bg-[rgba(13,129,126,0.08)] px-3 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)]">
          {message}
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(7,18,32,0.58)] px-3 py-3 backdrop-blur-sm small:items-center">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[var(--shreem-border)] bg-[var(--shreem-surface)] shadow-[0_28px_80px_rgba(7,18,32,0.24)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--shreem-border)] px-5 py-4">
              <div>
                <p className="brand-kicker">Kundli library</p>
                <h3 className="mt-2 text-2xl leading-tight text-[var(--shreem-ink)]">
                  Saved family charts
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                  Use details without spending AI, open a saved chart, or
                  regenerate only when you need a fresh reading.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--shreem-border)] bg-[rgba(255,255,255,0.10)] px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[58vh] overflow-y-auto px-4 py-4 small:px-5">
              {profiles.length ? (
                <div className="grid gap-3">
                  {visibleProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-[20px] border border-[var(--shreem-border)] bg-[rgba(255,255,255,0.08)] px-3 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 small:flex-row small:items-start small:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-[var(--shreem-ink)]">
                            {profile.name || "Saved Kundli"}
                          </p>
                          <p className="mt-1 break-words text-xs leading-5 text-[var(--shreem-muted)]">
                            {profile.birthDate || "Date"} ·{" "}
                            {profile.birthTime || "Time"} ·{" "}
                            {profile.cityLabel || cityLabel(getCityById(profile.cityId))}
                          </p>
                        </div>
                        {profile.lastResult?.chart && (
                          <span className="w-fit shrink-0 rounded-full bg-[rgba(245,199,96,0.18)] px-2 py-1 text-[0.65rem] font-semibold text-[var(--shreem-gold-deep)]">
                            Chart saved
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 small:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => closeAfter(() => onUse(profile))}
                          className="rounded-full border border-[rgba(13,129,126,0.24)] bg-[rgba(13,129,126,0.10)] px-3 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)]"
                        >
                          Use details
                        </button>
                        <button
                          type="button"
                          onClick={() => closeAfter(() => onOpen(profile))}
                          disabled={!profile.lastResult?.chart}
                          className="rounded-full border border-[var(--shreem-border)] bg-[rgba(255,255,255,0.10)] px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Open chart
                        </button>
                        <button
                          type="button"
                          onClick={() => closeAfter(() => onGenerate(profile))}
                          className="rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_72%)] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Generate AI
                        </button>
                        <button
                          type="button"
                          onClick={() => closeAfter(() => onRemove(profile), false)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[18px] border border-dashed border-[rgba(13,129,126,0.24)] bg-[rgba(13,129,126,0.08)] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
                  No saved Kundlis yet. Fill birth details and save them before
                  or after generating a chart.
                </p>
              )}
            </div>

            {profiles.length > pageSize && (
              <div className="flex items-center justify-between gap-3 border-t border-[var(--shreem-border)] px-5 py-4 text-sm text-[var(--shreem-muted)]">
                <span>
                  Page {safePage + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                    className="rounded-full border border-[var(--shreem-border)] bg-[rgba(255,255,255,0.10)] px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                    disabled={safePage >= totalPages - 1}
                    className="rounded-full border border-[rgba(13,129,126,0.22)] bg-[rgba(13,129,126,0.10)] px-3 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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

const legacyText = (value: unknown, fallback = "") =>
  typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : fallback

const legacyTextArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "number"
            ? String(item)
            : item && typeof item === "object"
            ? legacyText(
                (item as Record<string, unknown>).text,
                legacyText(
                  (item as Record<string, unknown>).reason,
                  legacyText((item as Record<string, unknown>).summary)
                )
              )
            : ""
        )
        .filter(Boolean)
    : typeof value === "string"
    ? [value]
    : []

const legacyNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const legacyRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }

  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

const legacyScoreRows = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          if (typeof item === "string") {
            return {
              name: `Point ${index + 1}`,
              score: 0,
              max: 0,
              reason: item,
            }
          }

          if (!item || typeof item !== "object") {
            return null
          }

          const row = item as Record<string, unknown>
          return {
            name: legacyText(row.name, legacyText(row.layer, `Point ${index + 1}`)),
            score: legacyNumber(row.score),
            max: legacyNumber(row.max),
            reason: legacyText(row.reason, legacyText(row.meaning, legacyText(row.text))),
          }
        })
        .filter(Boolean)
    : []

const normalizeMatchmakingResultForUi = (value: unknown): MatchmakingResult => {
  const result = legacyRecord(value) as MatchmakingResult & Record<string, unknown>
  const compatibility = legacyRecord(
    result.compatibility || result.match || result.compatibility_result || result.result
  ) as NonNullable<MatchmakingResult["compatibility"]> & Record<string, unknown>
  const analysis = legacyRecord(
    result.analysis || result.reading || result.ai_analysis
  ) as NonNullable<MatchmakingResult["analysis"]> & Record<string, unknown>
  const girl = legacyRecord(result.girl || result.female || result.bride)
  const boy = legacyRecord(result.boy || result.male || result.groom)

  return {
    ...result,
    girl: {
      ...(girl as MatchmakingResult["girl"]),
      profile: legacyRecord(girl.profile) as MatchmakingResult["girl"]["profile"],
      chart: (girl.chart || result.girl_chart) as PrashnaChart | undefined,
    },
    boy: {
      ...(boy as MatchmakingResult["boy"]),
      profile: legacyRecord(boy.profile) as MatchmakingResult["boy"]["profile"],
      chart: (boy.chart || result.boy_chart) as PrashnaChart | undefined,
    },
    compatibility: {
      ...compatibility,
      scores: legacyScoreRows(compatibility.scores || compatibility.koota_scores || result.scores) as NonNullable<
        MatchmakingResult["compatibility"]
      >["scores"],
      deep_scores: legacyScoreRows(compatibility.deep_scores || compatibility.deepScores || result.deep_scores) as NonNullable<
        MatchmakingResult["compatibility"]
      >["deep_scores"],
      case_registry: legacyTextArray(compatibility.case_registry || compatibility.caseRegistry || result.case_registry),
      red_flags: legacyTextArray(compatibility.red_flags || compatibility.redFlags || result.red_flags),
      total: legacyNumber(compatibility.total, legacyNumber(compatibility.score)),
      max: legacyNumber(compatibility.max, legacyNumber(compatibility.maximum)),
      percentage: legacyNumber(
        compatibility.percentage,
        legacyNumber(compatibility.compatibility_percentage, legacyNumber(analysis.percentage_suggestion))
      ),
      deterministicRecommendation:
        compatibility.deterministicRecommendation === "go" ||
        compatibility.deterministicRecommendation === "avoid"
          ? compatibility.deterministicRecommendation
          : "caution",
    },
    analysis: {
      ...analysis,
      summary: legacyText(analysis.summary, legacyText(result.summary, legacyText(result.message))),
      decision_reason: legacyText(
        analysis.decision_reason,
        legacyText(analysis.summary, legacyText(result.summary))
      ),
      strengths: legacyTextArray(analysis.strengths || result.strengths),
      concerns: legacyTextArray(analysis.concerns || result.concerns),
      family_discussion_points: legacyTextArray(
        analysis.family_discussion_points || result.family_discussion_points
      ),
      remedies: legacyTextArray(analysis.remedies || result.remedies),
      marriage_timing_note: legacyText(analysis.marriage_timing_note, legacyText(result.marriage_timing_note)),
      book_citations: Array.isArray(analysis.book_citations)
        ? analysis.book_citations
            .map((item, index) => {
              if (typeof item === "string") {
                return { citation: `Reference ${index + 1}`, relevance: item }
              }
              if (!item || typeof item !== "object") {
                return null
              }
              const row = item as Record<string, unknown>
              return {
                citation: legacyText(row.citation, `Reference ${index + 1}`),
                relevance: legacyText(row.relevance, legacyText(row.reason)),
              }
            })
            .filter(Boolean) as BookCitation[]
        : [],
      recommendation:
        analysis.recommendation === "go" || analysis.recommendation === "avoid"
          ? analysis.recommendation
          : "caution",
      percentage_suggestion: legacyNumber(
        analysis.percentage_suggestion,
        legacyNumber(compatibility.percentage)
      ),
      expert_call_recommended: Boolean(analysis.expert_call_recommended),
      expert_call_reason: legacyText(analysis.expert_call_reason),
    },
    message: legacyText(result.message),
    retryable: Boolean(result.retryable),
  }
}

const KUNDLI_SCAFFOLD_PATTERNS = [
  /no direct planet placed/i,
  /no direct graha sits/i,
  /no major parashari/i,
  /no major drishti/i,
  /in plain language/i,
  /result comes mainly/i,
  /controls .* for this native/i,
  /for this native it is/i,
  /means results come through/i,
  /modifies the final result/i,
  /direct occupation/i,
  /external graha modification/i,
  /currently activating this house/i,
  /final impact:/i,
  /placed graha/i,
  /so the lord placement/i,
  /this house is not directly/i,
  /judge by/i,
  /judgement method/i,
  /should be read/i,
  /refer to/i,
  /use this house as/i,
  /the reading must combine/i,
  /do not record past life events/i,
]

const looksIncompleteKundliText = (value?: string | null) => {
  const text = cleanKundliText(value).replace(/\s+/g, " ")

  if (!text) {
    return true
  }

  if (text.length < 28) {
    return false
  }

  if (KUNDLI_SCAFFOLD_PATTERNS.some((pattern) => pattern.test(text))) {
    return true
  }

  if (/[.!?।)]$/.test(text)) {
    return false
  }

  return /\b(Sp|d|ac|activ|activate|lordsh|deliv|thro|hou|curr|sho|pl|or|and|with|from|by|in)$/i.test(text) ||
    text.length > 160
}

const safeKundliText = (
  preferred?: string | null,
  fallback?: string | null,
  empty = ""
) => {
  const primary = fullKundliText(preferred)

  if (primary && !looksIncompleteKundliText(primary)) {
    return primary
  }

  const secondary = fullKundliText(fallback)

  if (secondary && !looksIncompleteKundliText(secondary)) {
    return secondary
  }

  return empty
}

const HOUSE_USER_MEANINGS: Record<number, { meaning: string; action: string }> = {
  1: {
    meaning: "Identity, confidence and health need disciplined routines, calm decisions and steady self-belief.",
    action: "Protect sleep, body rhythm and speech; avoid impulsive reactions.",
  },
  2: {
    meaning: "Money, family values and speech improve when savings, food habits and communication stay controlled.",
    action: "Keep accounts clean, speak carefully and avoid emotional spending.",
  },
  3: {
    meaning: "Growth comes through courage, marketing, writing, skills and consistent daily effort.",
    action: "Build one visible skill channel and use communication without haste.",
  },
  4: {
    meaning: "Home, property, vehicles and emotional peace improve through stability and practical family decisions.",
    action: "Avoid rushed property/home decisions and keep domestic routines peaceful.",
  },
  5: {
    meaning: "Learning, creativity, children and mantra practice work best with patience and focused study.",
    action: "Strengthen education, mantra and creative discipline; avoid risky speculation.",
  },
  6: {
    meaning: "Obstacles, debt, disputes and health routines can be managed through discipline and service.",
    action: "Keep fitness, paperwork, debt control and conflict handling clean.",
  },
  7: {
    meaning: "Marriage, customers and agreements need fairness, clarity and patience before commitment.",
    action: "Write expectations clearly and avoid ego or hurried promises.",
  },
  8: {
    meaning: "Sudden change, secrets, research and vulnerability need prevention, documentation and expert guidance.",
    action: "Avoid risky shortcuts; keep insurance, records and health checks disciplined.",
  },
  9: {
    meaning: "Fortune grows through teachers, fatherly blessings, dharma, learning and long-distance opportunity.",
    action: "Respect mentors, continue study and avoid rejecting guidance out of pride.",
  },
  10: {
    meaning: "Career and public reputation improve through consistent output, responsibility and visible work.",
    action: "Choose measurable work goals and show progress every week.",
  },
  11: {
    meaning: "Gains come through networks, repeat customers, elder support and practical income systems.",
    action: "Track sales, referrals and collections instead of relying only on hope.",
  },
  12: {
    meaning: "Expenses, sleep, isolation and foreign links need boundaries and spiritual grounding.",
    action: "Control leaks in money/time, improve sleep and keep a simple spiritual routine.",
  },
}

const HOUSE_LIFE_LINKS: Record<number, string> = {
  1: "identity, confidence and physical vitality",
  2: "family, savings, food and speech",
  3: "skills, communication, courage and enterprise",
  4: "home, property, education and emotional security",
  5: "learning, children, creativity and judgement",
  6: "service, competition, debt and health routine",
  7: "marriage, customers, contracts and public dealing",
  8: "shared assets, research, vulnerability and sudden change",
  9: "teachers, dharma, higher learning and long travel",
  10: "career, authority, status and visible work",
  11: "income, networks, audience and fulfilment",
  12: "expenses, sleep, foreign links and spiritual retreat",
}

const getHouseEvidence = (
  row?: NonNullable<KundliAnalysis["house_outcomes"]>[number]
) => {
  const evidence = cleanKundliText(row?.evidence)
  const lordMatch = evidence.match(
    /Lord:\s*([A-Za-z]+)(?:\s+in\s+bhava\s+(\d+))?(?:,\s*([^;]+))?/i
  )
  const placedMatch = evidence.match(/Placed:\s*([^;]+)/i)
  const drishtiMatch = evidence.match(/Drishti:\s*([^;]+)/i)
  const toPlanets = (value?: string) =>
    value && !/^none$/i.test(value.trim())
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : []

  return {
    lord: lordMatch?.[1] || "",
    lordHouse: Number(lordMatch?.[2] || 0),
    dignity: lordMatch?.[3]?.trim() || "",
    placed: toPlanets(placedMatch?.[1]),
    drishti: toPlanets(drishtiMatch?.[1]),
  }
}

const getHouseCustomerMeaning = (
  row?: NonNullable<KundliAnalysis["house_outcomes"]>[number]
) => {
  const suppliedMeaning = cleanKundliText(row?.user_meaning)
  if (suppliedMeaning) {
    return suppliedMeaning
  }

  const base = row?.house ? HOUSE_USER_MEANINGS[row.house] : undefined
  const impact = cleanKundliText(row?.prevailing_impact).toLowerCase()
  const evidence = getHouseEvidence(row)
  const activeMatch = cleanKundliText(row?.prevailing_impact).match(
    /\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+dasha/i
  )
  const lordLink = evidence.lord && evidence.lordHouse
    ? `${evidence.lord} ties the result to ${HOUSE_LIFE_LINKS[evidence.lordHouse] || `house ${evidence.lordHouse}`}${evidence.dignity ? ` and is ${evidence.dignity}` : ""}.`
    : ""
  const directSignal = evidence.placed.length
    ? `${evidence.placed.join(" and ")} make this a direct lived theme.`
    : ""
  const supportiveDrishti = evidence.drishti.filter((planet) =>
    /Jupiter|Venus|Mercury|Moon/i.test(planet)
  )
  const pressureDrishti = evidence.drishti.filter((planet) =>
    /Saturn|Mars|Rahu|Ketu|Sun/i.test(planet)
  )
  const drishtiSignal = supportiveDrishti.length && pressureDrishti.length
    ? "Received drishti is mixed, so opportunity comes with correction."
    : supportiveDrishti.length
    ? `Support from ${supportiveDrishti.join(" and ")} improves delivery.`
    : pressureDrishti.length
    ? `Pressure from ${pressureDrishti.join(" and ")} requires patience and control.`
    : ""
  const quality = impact.includes("active and usable") ||
    impact.includes("supportive")
    ? `${activeMatch?.[1] || "Current"} timing makes this a usable growth area now.`
    : impact.includes("pressure") ||
      impact.includes("discipline") ||
      impact.includes("needs")
    ? `${activeMatch?.[1] || "Current"} timing activates it, but progress needs correction rather than force.`
    : "This is a background area now; timing and conduct matter more than force."
  const deterministic = base
    ? [base.meaning, lordLink, directSignal, drishtiSignal, quality]
        .filter(Boolean)
        .join(" ")
    : ""
  const meaning = safeKundliText(deterministic, "", base?.meaning || "")

  return meaning || base?.meaning || "This house needs expert review with the full chart."
}

const getHouseCustomerAction = (
  row?: NonNullable<KundliAnalysis["house_outcomes"]>[number]
) => {
  const suppliedAction = cleanKundliText(row?.practical_use)
  if (suppliedAction) {
    return suppliedAction
  }

  const base = row?.house ? HOUSE_USER_MEANINGS[row.house] : undefined
  const impact = cleanKundliText(row?.prevailing_impact).toLowerCase()
  const timingAdvice =
    impact.includes("active")
      ? "Use the current period carefully instead of postponing everything."
      : "Prepare the foundation now and act more strongly when timing supports it."
  const deterministic = base ? `${base.action} ${timingAdvice}` : ""
  const action = safeKundliText(deterministic, "", base?.action || "")

  return action || base?.action || "Keep this area disciplined and review timing before major decisions."
}

const compactKundliText = (value?: string | null, maxLength = 240) => {
  const cleaned = cleanKundliText(value).replace(/\s+/g, " ")

  if (!cleaned) {
    return ""
  }

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  const slice = cleaned.slice(0, Math.max(20, maxLength - 1)).trim()
  const sentenceCut = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("।"),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  )
  const wordCut = slice.lastIndexOf(" ")
  const cutAt = sentenceCut > maxLength * 0.45 ? sentenceCut + 1 : wordCut
  const shortened = slice.slice(0, cutAt > 20 ? cutAt : slice.length).trim()

  return `${shortened}…`
}

const fullKundliText = (value?: string | null) =>
  cleanKundliText(value).replace(/\s+/g, " ")

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

const isTemplatePredictionRow = (
  row?: NonNullable<KundliAnalysis["prediction_table"]>[number] | null,
  hasQuestionAnswers = false
) => {
  const text = normalizeKundliText(
    `${row?.area || ""} ${row?.prediction || ""} ${row?.advice || ""} ${row?.chart_basis || ""}`
  )

  if (!text) {
    return true
  }

  if (hasQuestionAnswers && /user question/.test(text)) {
    return true
  }

  return [
    /this row explains/,
    /is judged through/,
    /must be judged together/,
    /depends on speech and savings/,
    /health is shown as prevention only/,
    /remedy quality depends/,
    /career direction comes from/,
    /money is judged by/,
    /business is read through/,
    /marriage and partnership are judged/,
    /read the promise from the houses first/,
    /use gochar only as a trigger/,
    /watch .* periods for timing/,
    /make big decisions only after checking/,
    /start with conduct daan mantra seva/,
  ].some((pattern) => pattern.test(text))
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
  const hasQuestionAnswers = Boolean(result.analysis?.sub_question_answers?.length)
  const reviewedRows = (result.analysis?.deterministic_review || []).map((row) => ({
    area: row.area,
    chart_basis: row.deterministic_basis_used,
    prediction: row.final_decision,
    advice: row.missing_or_weak_point,
  }))
  const sourceRows = [
    ...(result.analysis?.prediction_table || []),
    ...reviewedRows,
  ].filter(
    (row) =>
      cleanKundliText(row.area) &&
      cleanKundliText(row.prediction) &&
      !/user question/i.test(row.area)
  )
  const qualityRows = sourceRows.filter(
    (row) => !isTemplatePredictionRow(row, hasQuestionAnswers)
  )
  // Older saved readings and an occasional strict quality pass can classify
  // every otherwise complete life-area row as scaffolding. Keep the generated
  // conclusions visible instead of rendering an empty customer tab.
  const rows = qualityRows.length ? qualityRows : sourceRows

  const categories = [
    ["career", ["career", "profession", "work", "business", "entrepreneur"]],
    ["wealth", ["wealth", "money", "finance", "income", "gains"]],
    ["relationship", ["marriage", "relationship", "spouse", "partner"]],
    ["education", ["education", "learning", "creativity", "children", "skill"]],
    ["home", ["home", "property", "family", "mother", "vehicle"]],
    ["wellbeing", ["health", "routine", "foreign", "spiritual", "sleep"]],
  ] as const
  const uniqueRows = uniqueByText(rows, (row) => `${row.area} ${row.prediction}`)
  const selected = categories.flatMap(([, terms]) => {
    const candidates = uniqueRows.filter((row) => {
      const area = normalizeKundliText(row.area)
      return terms.some((term) => area.includes(term))
    })

    return candidates
      .sort((left, right) => {
        const leftArea = normalizeKundliText(left.area)
        const rightArea = normalizeKundliText(right.area)
        const leftExact = terms.some((term) => leftArea === term) ? 1 : 0
        const rightExact = terms.some((term) => rightArea === term) ? 1 : 0
        return rightExact - leftExact
      })
      .slice(0, 1)
  })

  const focused = uniqueByText(selected, (row) => `${row.area} ${row.prediction}`).slice(0, 6)

  if (focused.length) {
    return focused
  }

  if (rows.length) {
    return uniqueByText(rows, (row) => `${row.area} ${row.prediction}`).slice(0, 6)
  }

  const analysisFallback = [
    ["Career and business", result.analysis?.career_direction],
    ["Marriage and relationships", result.analysis?.relationship_pattern],
    ["Health and routine", result.analysis?.health_caution],
    ["Current life direction", result.analysis?.current_period_analysis],
    ["Overall life pattern", result.analysis?.summary],
  ]
    .filter((row): row is [string, string] => Boolean(cleanKundliText(row[1])))
    .map(([area, prediction]) => ({
      area,
      prediction: fullKundliText(prediction),
      advice: "Use this conclusion together with the Timing and Remedies tabs for practical decisions.",
      chart_basis: "",
    }))

  if (analysisFallback.length) {
    return uniqueByText(analysisFallback, (row) => `${row.area} ${row.prediction}`).slice(0, 6)
  }

  const houseFallbacks = [
    ["Career and business", [10, 11]],
    ["Money and savings", [2, 11]],
    ["Marriage and relationships", [7]],
    ["Education and judgement", [5]],
    ["Home and family", [4]],
    ["Health and daily routine", [1, 6, 12]],
  ] as const

  return houseFallbacks
    .map(([area, houses]) => {
      const houseRow = (result.analysis?.house_outcomes || []).find((row) =>
        houses.includes(row.house as never)
      )

      if (!houseRow) return null

      return {
        area,
        prediction: getHouseCustomerMeaning(houseRow),
        advice: getHouseCustomerAction(houseRow),
        chart_basis: "",
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

const getKundliDirectAnswer = (result: KundliResult) => {
  const analysis = result.analysis
  const questions = getKundliQuestions(result)
  const questionAnswer = cleanKundliText(analysis?.sub_question_answers?.[0]?.answer)

  if (questionAnswer) {
    return questionAnswer
  }

  if (!questions.length) {
    return (
      cleanKundliText(analysis?.summary) ||
      cleanKundliText(analysis?.person_information) ||
      cleanKundliText(analysis?.current_period_analysis) ||
      cleanKundliText(result.message)
    )
  }

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
  const questions = getKundliQuestions(result)
  const questionReason = cleanKundliText(analysis?.sub_question_answers?.[0]?.chart_reason)

  if (questionReason) {
    return questionReason
  }

  if (!questions.length) {
    return cleanKundliText(analysis?.current_period_analysis)
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
  const questionRows = result.analysis?.sub_question_answers || []
  const openingProfile = (result.analysis?.opening_profile || [])
    .map((paragraph) => cleanKundliText(paragraph))
    .filter(Boolean)
    .slice(0, 2)

  if (!question) {
    return null
  }

  if (!directAnswer && !questionRows.length) {
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

      {!!openingProfile.length && (
        <div className="mt-4 rounded-[18px] border border-[rgba(212,161,38,0.24)] bg-white/82 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Who you are and where you can thrive
          </p>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-[var(--shreem-ink)]">
            {openingProfile.map((paragraph, index) => (
              <p key={`opening-profile-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      <SubQuestionAnswersList rows={questionRows} />

      {directAnswer && questionRows.length === 0 && (
        <div className="mt-4 rounded-[18px] border border-white/80 bg-white/78 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Direct answer
          </p>
          <p className="mt-2 text-base leading-7 text-[var(--shreem-ink)]">
            {safeKundliText(directAnswer, "")}
          </p>
        </div>
      )}

    </section>
  )
}

const ResultAnchorNav = ({
  items,
  onOpenInfo,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[]
  onOpenInfo: () => void
  activeId?: string
  onSelect?: (id: string) => void
}) => (
  <nav className="sticky top-2 z-20 rounded-[18px] border border-[var(--shreem-border)] bg-white/94 px-3 py-3 shadow-sm backdrop-blur">
    <div className="flex items-center justify-between gap-3">
      <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Contents
      </p>
      <button
        type="button"
        onClick={onOpenInfo}
        className="shrink-0 rounded-full border border-[rgba(13,129,126,0.22)] px-3 py-1.5 text-xs font-semibold text-[var(--shreem-accent-dark)]"
      >
        Kundli guide
      </button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 small:grid-cols-3 medium:grid-cols-6">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (onSelect) {
              onSelect(item.id)
              return
            }

            document.getElementById(item.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }}
          className={`min-h-10 w-full rounded-full border px-2 py-2 text-center text-[0.72rem] font-semibold leading-tight transition small:px-3 small:text-xs ${
            item.id === "kundli-proof"
              ? "col-span-2 small:col-span-3 medium:col-span-1 "
              : ""
          }${
            activeId === item.id
              ? "border-[rgba(13,129,126,0.42)] bg-[var(--shreem-accent-dark)] text-white shadow-sm"
              : "border-[var(--shreem-border)] bg-[rgba(255,248,233,0.64)] text-[var(--shreem-ink)] hover:border-[rgba(13,129,126,0.3)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </nav>
)

const KundliGuideModal = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-[rgba(2,8,23,0.72)] p-0 backdrop-blur-sm small:items-center small:p-5">
      <div className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border border-[rgba(212,161,38,0.34)] bg-[#fffaf0] text-[#123f63] shadow-2xl small:h-[92dvh] small:rounded-[20px]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(18,63,99,0.14)] bg-[#fffaf0] px-4 py-4 small:px-7 small:py-5">
          <div>
            <p className="brand-kicker">Kundli guide</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--shreem-ink)]">
              How to read this chart
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--shreem-border)] px-3 py-1.5 text-sm font-semibold text-[var(--shreem-ink)]"
          >
            Close
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 py-5 text-sm leading-7 text-[#334155] small:px-7 small:py-6">
          <div className="rounded-[18px] border border-[rgba(13,129,126,0.2)] bg-white px-4 py-4">
            <p className="text-sm font-semibold text-[#123f63]">Read in this order</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>Direct answer appears only when you asked a question. It should answer each question separately.</li>
              <li>Predictions gives the practical life areas: life path, career, money, business, marriage, family, education, reputation, health, foreign/spiritual and remedies.</li>
              <li>Timing shows the current Vimshottari dasha branch and practical period guidance.</li>
              <li>Houses shows which house impact is actually prevailing after lordship, placement, occupants and Bhava Chalit delivery.</li>
              <li>Remedies combines pooja, mantra, daan, daily discipline and gemstone caution where supported.</li>
            </ol>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Chart layers</p>
              <p className="mt-2">Lagna shows body, direction and how life is experienced. Moon/Rashi shows mind, emotions and dasha starting point. Bhava Chalit shows where a planet practically delivers results in lived events.</p>
              <p className="mt-2">If Rashi and Bhava differ, both matter: Rashi gives the graha condition and yoga; Bhava Chalit shows the real house where results manifest.</p>
            </div>
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Timing rules</p>
              <p className="mt-2">Mahadasha is the background, Antardasha selects the active life area, and Pratyantar often triggers the event. Gochar is only a trigger; it should not override natal promise and active dasha.</p>
              <p className="mt-2">We do not show whole-life Markesh calendars because broad danger lists become misleading. The timing tab focuses on periods where dasha guidance is useful for action.</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
            <p className="text-sm font-semibold text-[#123f63]">House cheat sheet</p>
            <div className="mt-3 grid gap-2 text-xs leading-5 small:grid-cols-2 md:grid-cols-3">
              {[
                "1: body, identity, confidence, life direction",
                "2: family, speech, savings, food, values",
                "3: courage, skills, communication, siblings, sales",
                "4: home, mother, land, vehicles, emotional base",
                "5: intelligence, children, mantra, creativity, judgement",
                "6: service, competition, debt, routine, illness prevention",
                "7: spouse, customers, contracts, public dealing",
                "8: sudden change, longevity audit, hidden matters, shared assets",
                "9: dharma, father/guru, fortune, higher learning, long travel",
                "10: career, authority, karma, status, visible work",
                "11: gains, network, fulfilment, elder support",
                "12: sleep, expenses, isolation, foreign links, moksha",
              ].map((item) => (
                <span key={item} className="rounded-[12px] bg-[#fff7df] px-3 py-2 text-[#334155]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Graha and drishti</p>
              <p className="mt-2">Sun shows authority and soul direction; Moon mind and comfort; Mars action and heat; Mercury logic and trade; Jupiter wisdom and expansion; Venus harmony and enjoyment; Saturn duty and delay; Rahu hunger and unusual growth; Ketu detachment and spiritual cut.</p>
              <p className="mt-2">Parashari drishti is used: all planets aspect 7th, Mars also 4th and 8th, Jupiter also 5th and 9th, Saturn also 3rd and 10th.</p>
            </div>
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Remedies and safety</p>
              <p className="mt-2">Good remedies start with conduct: discipline, truthfulness, daan, seva, mantra, worship, cleanliness, sleep and food control. Stones and major pooja should be confirmed by an expert because strengthening the wrong graha can worsen the problem.</p>
              <p className="mt-2">Health rows are prevention signals, never diagnosis. For symptoms, emergencies or medical decisions, consult a qualified doctor.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Positive, mixed and caution results</p>
              <p className="mt-2">A positive result means several chart factors support the same outcome. Mixed means opportunity exists but comes with delay, effort or a trade-off. Caution means prevention and measured decisions matter more than speed.</p>
              <p className="mt-2">No single planet or yoga should be read alone. The final interpretation combines the house, its lord, dignity, occupants, aspects, dasha and supporting transit.</p>
            </div>
            <div className="rounded-[18px] border border-[var(--shreem-border)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#123f63]">Confidence and verification</p>
              <p className="mt-2">Exact birth time matters because even a small difference can change Lagna degree, Bhava Chalit delivery and fine timing. Verify the time before acting on marriage, gemstone, health-watch or major financial guidance.</p>
              <p className="mt-2">Use past timing dates as a reality check. If the strongest periods do not resemble lived events, ask an astrologer to review birth-time accuracy before relying on future windows.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AstrologerProofWarningModal = ({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean
  onConfirm: () => void
  onClose: () => void
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(2,8,23,0.76)] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[20px] border border-[rgba(212,161,38,0.4)] bg-[#fffaf0] px-5 py-5 shadow-2xl small:px-7 small:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6510]">
          Advanced Jyotish material
        </p>
        <h3 className="mt-2 text-xl font-semibold text-[#123f63]">
          This section needs skilled interpretation
        </h3>
        <p className="mt-3 text-sm leading-7 text-[#475569]">
          It contains raw chart calculations, dasha branches, Maraka and
          Badhaka scoring, BPHS evidence, drishti and rule audits. Scores and
          isolated combinations are not final predictions and can be
          misleading without weighing the complete chart.
        </p>
        <p className="mt-2 text-sm leading-7 text-[#475569]">
          Markesh and health-watch data is preventive astrology only. It must
          not be read as certainty of illness, death or harm.
        </p>
        <div className="mt-5 grid gap-2 small:grid-cols-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-[rgba(18,63,99,0.2)] px-4 text-sm font-semibold text-[#123f63]">
            Back to reading
          </button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-full bg-[#123f63] px-4 text-sm font-semibold text-white">
            Open technical proof
          </button>
        </div>
      </div>
    </div>
  )
}

const DashaDecisionTreeTable = ({
  rows,
}: {
  rows?: KundliAnalysis["dasha_decision_tree"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.72)]">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Dasha decision tree
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
          Active Mahadasha, Antardasha and Pratyantar are pinned first. The
          remaining rows compare the current Mahadasha branch and current
          Antardasha branch, so you can see which sub-periods are supportive,
          mixed or caution-heavy.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 small:min-w-[820px] text-left text-xs">
          <thead className="bg-white/70 text-[var(--shreem-gold-deep)]">
            <tr>
              {["Period", "Prevailing factor", "Score", "Outcome"].map((heading) => (
                <th key={heading} className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.period}-${index}`} className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]">
                <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">{row.period}</td>
                <td className="break-words px-3 py-3">{row.prevailing_factor}</td>
                <td className="break-words px-3 py-3">{row.score}</td>
                <td className="break-words px-3 py-3">{row.expected_outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const HouseNarrativeGuide = ({
  chart,
  rows,
}: {
  chart: PrashnaChart
  rows?: KundliAnalysis["house_outcomes"]
}) => {
  const houseRows = rows || []
  const activeDasha = chart.dasha
    ? `${chart.dasha.mahadasha.lord} Mahadasha, ${chart.dasha.antardasha.lord} Antardasha, ${chart.dasha.pratyantar.lord} Pratyantar`
    : "current dasha unavailable"
  const activePlanets = chart.dasha
    ? [
        chart.dasha.mahadasha.lord,
        chart.dasha.antardasha.lord,
        chart.dasha.pratyantar.lord,
      ]
    : []
  const activeHouseNumbers = Array.from(
    new Set(
      activePlanets
        .map((planetName) => chart.planets.find((planet) => planet.name === planetName))
        .flatMap((planet) => [
          planet?.bhavaHouse || planet?.house,
          planet?.rashiHouse,
        ])
        .filter((house): house is number => typeof house === "number")
    )
  )
  const activeHouseText = activeHouseNumbers.length
    ? activeHouseNumbers
        .map((house) => `H${house} ${HOUSE_THEMES[house - 1] || "life area"}`)
        .join(", ")
    : "no active house focus calculated"
  const pressureRows = houseRows
    .filter((row) =>
      /pressure|mixed|delay|caution|risk|weak|dusthana|manage/i.test(
        `${row.prevailing_impact} ${row.user_meaning} ${row.practical_use}`
      )
    )
    .slice(0, 3)
  const supportRows = houseRows
    .filter((row) =>
      /support|growth|strong|benefic|favour|usable|clear/i.test(
        `${row.prevailing_impact} ${row.user_meaning} ${row.practical_use}`
      )
    )
    .slice(0, 3)

  return (
    <section className="rounded-[22px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        House summary
      </p>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--shreem-muted)] md:grid-cols-2">
        <div className="rounded-[16px] bg-white/72 px-3 py-3">
          <p className="font-semibold text-[var(--shreem-ink)]">Current focus</p>
          <p className="mt-1">
            {activeDasha} is currently highlighting {activeHouseText}, so these
            life areas need the most attention now.
          </p>
        </div>
        <div className="rounded-[16px] bg-white/72 px-3 py-3">
          <p className="font-semibold text-[var(--shreem-ink)]">Overall use</p>
          <p className="mt-1">
            Use the supportive houses for growth and the pressure houses for
            discipline, repair and prevention. The detailed proof is kept lower
            on the page for astrologer review.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-[16px] bg-white/72 px-3 py-3">
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            Supportive houses to use
          </p>
          <div className="mt-2 grid gap-2">
            {(supportRows.length ? supportRows : houseRows.slice(0, 3)).map((row) => (
              <p key={`support-house-${row.house}`} className="text-xs leading-5 text-[var(--shreem-muted)]">
                <span className="font-semibold text-[var(--shreem-ink)]">
                  H{row.house}:
                </span>{" "}
                {compactKundliText(
                  getHouseCustomerMeaning(row),
                  190
                )}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-[16px] bg-white/72 px-3 py-3">
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            Houses needing discipline
          </p>
          <div className="mt-2 grid gap-2">
            {(pressureRows.length ? pressureRows : houseRows.slice(-3)).map((row) => (
              <p key={`pressure-house-${row.house}`} className="text-xs leading-5 text-[var(--shreem-muted)]">
                <span className="font-semibold text-[var(--shreem-ink)]">
                  H{row.house}:
                </span>{" "}
                {compactKundliText(
                  getHouseCustomerAction(row),
                  190
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const HouseOutcomeTable = ({
  rows,
}: {
  rows?: KundliAnalysis["house_outcomes"]
}) => {
  if (!rows?.length) {
    return null
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/66">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          House outcomes
        </p>
      </div>
      <div className="grid gap-3 px-3 pb-4 small:hidden">
        {rows.map((row) => (
          <article
            key={`house-mobile-${row.house}`}
            className="rounded-[16px] border border-[var(--shreem-border)] bg-white/78 px-3 py-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--shreem-accent-dark)] text-xs font-semibold text-white">
                H{row.house}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {row.theme}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  {getHouseCustomerMeaning(row)}
                </p>
                <p className="mt-2 border-t border-[var(--shreem-border)] pt-2 text-xs leading-5 text-[var(--shreem-ink)]">
                  <span className="font-semibold">Action: </span>
                  {getHouseCustomerAction(row)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto small:block">
        <table className="w-full min-w-0 small:min-w-[860px] text-left text-xs">
          <thead className="bg-[rgba(255,248,233,0.88)] text-[var(--shreem-gold-deep)]">
            <tr>
              {["House", "Theme", "Final meaning", "What to do"].map((heading) => (
                <th key={heading} className="px-3 py-3 font-semibold uppercase tracking-[0.06em] small:tracking-[0.14em]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.house} className="border-t border-[var(--shreem-border)] text-[var(--shreem-muted)]">
                <td className="break-words px-3 py-3 font-semibold text-[var(--shreem-ink)]">H{row.house}</td>
                <td className="break-words px-3 py-3">{row.theme}</td>
                <td className="break-words px-3 py-3">
                  {getHouseCustomerMeaning(row)}
                </td>
                <td className="break-words px-3 py-3">
                  {getHouseCustomerAction(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const BackToTopButton = () => (
  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className="fixed bottom-5 right-4 z-30 rounded-full border border-[rgba(13,129,126,0.24)] bg-white/92 px-4 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)] shadow-lg backdrop-blur"
  >
    Top
  </button>
)

const FocusedPredictionCards = ({ result }: { result: KundliResult }) => {
  const hasSpecificAnswers = Boolean(
    getKundliQuestions(result).length &&
      result.analysis?.sub_question_answers?.length
  )
  const directAnswer = hasSpecificAnswers
    ? normalizeKundliText(getKundliDirectAnswer(result))
    : ""
  const rows = getFocusedPredictionRows(result)
    .filter((row) => {
      const area = normalizeKundliText(row.area)
      const prediction = normalizeKundliText(row.prediction)

      return (
        !area.includes("user question") &&
        !area.includes("question") &&
        (!directAnswer || prediction !== directAnswer)
      )
    })
    .slice(0, 10)

  if (!rows.length) {
    return null
  }

  return (
    <section className="rounded-[22px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.72)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Your six key life predictions
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
          </article>
        ))}
      </div>
    </section>
  )
}

const CurrentGocharImpactCard = ({ result }: { result: KundliResult }) => {
  const gocharRow = (result.analysis?.prediction_table || []).find((row) =>
    /gochar|transit|current planet/i.test(`${row.area} ${row.chart_basis}`)
  )

  if (!gocharRow) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.76)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Current Gochar impact
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
        {gocharRow.prediction}
      </p>
      <div className="mt-3 rounded-[16px] bg-white/72 px-3 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
        <p>
          <span className="font-semibold text-[var(--shreem-ink)]">
            Chart basis:
          </span>{" "}
          {gocharRow.chart_basis}
        </p>
        {gocharRow.advice && (
          <p className="mt-2">
            <span className="font-semibold text-[var(--shreem-ink)]">
              How to use it:
            </span>{" "}
            {gocharRow.advice}
          </p>
        )}
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
        Active special combinations
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

const GrahaDrishtiCard = ({
  chart,
  outcomes,
}: {
  chart?: PrashnaChart
  outcomes?: KundliAnalysis["house_outcomes"]
}) => {
  const aspects = chart?.aspects || []
  const houseSynthesis = chart?.houseSynthesis || []
  const outcomeByHouse = new Map((outcomes || []).map((row) => [row.house, row]))

  if (!aspects.length && !houseSynthesis.length) {
    return null
  }

  const keyHouseNumbers = Array.from(
    new Set([
      ...(chart?.houses || []).map((house) => house.house),
      ...houseSynthesis.map((house) => house.house),
      ...(outcomes || []).map((row) => row.house),
    ])
  ).sort((left, right) => left - right)
  const keyHouses = keyHouseNumbers
    .map(
      (houseNumber) =>
        houseSynthesis.find((house) => house.house === houseNumber) ||
        chart?.houses?.find((house) => house.house === houseNumber)
    )
    .filter(
      (
        house
      ): house is NonNullable<(typeof houseSynthesis)[number] | NonNullable<typeof chart>["houses"][number]> =>
        Boolean(house)
    )
  const getAspectImpact = (aspect: (typeof aspects)[number]) => {
    const supportivePlanets = ["Jupiter", "Venus", "Mercury"]
    const pressurePlanets = ["Mars", "Saturn", "Rahu", "Ketu"]
    const pressureHouses = [6, 8, 12]
    const polarity =
      aspect.polarity ||
      (supportivePlanets.includes(aspect.fromPlanet) &&
      !pressureHouses.includes(aspect.toHouse)
        ? "supportive"
        : pressurePlanets.includes(aspect.fromPlanet) ||
          pressureHouses.includes(aspect.toHouse)
        ? "challenging"
        : "mixed")
    const label =
      polarity === "supportive"
        ? "Positive impact"
        : polarity === "challenging"
        ? "Challenging impact"
        : "Mixed impact"
    const badgeClass =
      polarity === "supportive"
        ? "bg-[rgba(13,129,126,0.12)] text-[var(--shreem-accent-dark)]"
        : polarity === "challenging"
        ? "bg-[rgba(185,74,64,0.10)] text-[#9d332b]"
        : "bg-[rgba(245,199,96,0.18)] text-[var(--shreem-gold-deep)]"
    const positive =
      aspect.positiveEffect ||
      (aspect.fromPlanet === "Jupiter"
        ? `${aspect.theme} gets wisdom, protection, guidance and growth.`
        : aspect.fromPlanet === "Venus"
        ? `${aspect.theme} gets harmony, relationship support, comfort and refinement.`
        : aspect.fromPlanet === "Mercury"
        ? `${aspect.theme} gets planning, communication, business logic and skill support.`
        : aspect.fromPlanet === "Moon"
        ? `${aspect.theme} gets emotional attention, public sensitivity and family involvement.`
        : aspect.fromPlanet === "Sun"
        ? `${aspect.theme} gets authority, confidence, visibility and leadership push.`
        : aspect.fromPlanet === "Mars"
        ? `${aspect.theme} gets courage, speed, technical drive and competitive force.`
        : aspect.fromPlanet === "Saturn"
        ? `${aspect.theme} gets discipline, endurance, responsibility and long-term structure.`
        : aspect.fromPlanet === "Rahu"
        ? `${aspect.theme} gets ambition, unusual opportunity, digital/foreign pull and hunger for growth.`
        : `${aspect.theme} gets detachment, simplification, spiritual correction and sharp discrimination.`)
    const negative =
      aspect.negativeEffect ||
      (aspect.fromPlanet === "Jupiter"
        ? `${aspect.theme} can become excessive or over-optimistic if practical limits are ignored.`
        : aspect.fromPlanet === "Venus"
        ? `${aspect.theme} can become indulgent or relationship-dependent if boundaries are weak.`
        : aspect.fromPlanet === "Mercury"
        ? `${aspect.theme} can become overthinking, scattered decisions or nervous speech.`
        : aspect.fromPlanet === "Moon"
        ? `${aspect.theme} can fluctuate with mood, family pressure and emotional reactions.`
        : aspect.fromPlanet === "Sun"
        ? `${aspect.theme} can bring ego clash, authority pressure or impatience.`
        : aspect.fromPlanet === "Mars"
        ? `${aspect.theme} can bring haste, conflict, heat, sharp speech or sudden breaks.`
        : aspect.fromPlanet === "Saturn"
        ? `${aspect.theme} can bring delay, heaviness, duty pressure or slow results before maturity.`
        : aspect.fromPlanet === "Rahu"
        ? `${aspect.theme} can become restless, obsessive, unconventional or unstable.`
        : `${aspect.theme} can feel detached, irregular, isolating or hard to understand until simplified.`)

    return { polarity, label, badgeClass, positive, negative }
  }
  const getHouseImpact = (
    outcome?: NonNullable<KundliAnalysis["house_outcomes"]>[number]
  ) => {
    const text = `${outcome?.prevailing_impact || ""} ${outcome?.outcome || ""}`.toLowerCase()
    const polarity = /active and usable|supportive|benefic|growth|progress|improve/.test(text)
      ? "supportive"
      : /pressure|needs discipline|challenging|delay|caution|risk|weak|dusthana/.test(text)
      ? "challenging"
      : "mixed"
    const label =
      polarity === "supportive"
        ? "Overall positive"
        : polarity === "challenging"
        ? "Overall challenging"
        : "Overall mixed"
    const badgeClass =
      polarity === "supportive"
        ? "bg-[rgba(13,129,126,0.12)] text-[var(--shreem-accent-dark)]"
        : polarity === "challenging"
        ? "bg-[rgba(185,74,64,0.10)] text-[#9d332b]"
        : "bg-[rgba(245,199,96,0.18)] text-[var(--shreem-gold-deep)]"

    return { polarity, label, badgeClass }
  }
  const getHouseConclusion = (
    house: NonNullable<(typeof keyHouses)[number]>,
    outcome?: NonNullable<KundliAnalysis["house_outcomes"]>[number]
  ) => {
    const impact = getHouseImpact(outcome)
    const aspectsReceived = house.aspectsReceived || []
    const supporters = aspectsReceived
      .filter((aspect) => getAspectImpact(aspect).polarity === "supportive")
      .map((aspect) => aspect.fromPlanet)
    const challengers = aspectsReceived
      .filter((aspect) => getAspectImpact(aspect).polarity === "challenging")
      .map((aspect) => aspect.fromPlanet)
    const placed = house.planetsPlaced?.length
      ? house.planetsPlaced.join(", ")
      : "no direct planet"
    const interpretedMeaning = getHouseCustomerMeaning(outcome)
    const interpretedAction = getHouseCustomerAction(outcome)
    const net = interpretedMeaning ||
      (impact.polarity === "supportive"
        ? `${house.theme} is a usable strength area.`
        : impact.polarity === "challenging"
        ? `${house.theme} needs discipline before results become smooth.`
        : `${house.theme} gives mixed results and depends strongly on timing.`)
    const why = [
      `Lord ${house.signLord}; ${placed} placed.`,
      supporters.length ? `Support from ${supporters.slice(0, 3).join(", ")}.` : "",
      challengers.length ? `Pressure from ${challengers.slice(0, 3).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ")
    const action = interpretedAction ||
      (impact.polarity === "supportive"
        ? "Use this area actively, but keep promises realistic."
        : impact.polarity === "challenging"
        ? "Slow down, keep routine, avoid ego/conflict, and use mantra-daan discipline."
        : "Act after checking dasha timing and keep a balanced plan.")

    return { net, why, action }
  }

  return (
    <section className="rounded-[24px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] px-4 py-5 small:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
        Graha drishti synthesis
      </p>
      <h3 className="mt-2 text-xl font-semibold leading-7 text-[var(--shreem-ink)]">
        Planet aspects and combined house impact
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        Final house impact is shown first. Individual aspect cards remain as proof for astrologers.
      </p>

      {!!keyHouses.length && (
        <div className="mt-4 grid gap-3 small:grid-cols-2">
          {keyHouses.map((house) => {
            const outcome = outcomeByHouse.get(house.house)
            const impact = getHouseImpact(outcome)

            return (
              <article
                key={`house-synthesis-${house.house}`}
                className="rounded-[18px] border border-white/80 bg-white/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    House {house.house}: {house.theme}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${impact.badgeClass}`}
                  >
                    {impact.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-ink)]">
                  {getHouseConclusion(house, outcome).net}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  {getHouseConclusion(house, outcome).why}
                </p>
                <p className="mt-2 rounded-[14px] bg-[rgba(13,129,126,0.08)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  {getHouseConclusion(house, outcome).action}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {!!aspects.length && (
        <details className="mt-4 rounded-[18px] border border-[var(--shreem-border)] bg-white/68 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--shreem-ink)]">
            Show individual drishti proof
          </summary>
          <div className="mt-3 grid gap-3 small:grid-cols-2">
            {aspects.slice(0, 12).map((aspect, index) => {
              const impact = getAspectImpact(aspect)

              return (
                <article
                  key={`${aspect.fromPlanet}-${aspect.toHouse}-${index}`}
                  className="rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                      {aspect.fromPlanet} → House {aspect.toHouse}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${impact.badgeClass}`}
                    >
                      {impact.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.05em] small:tracking-[0.12em] text-[var(--shreem-gold-deep)]">
                    {aspect.aspectType} drishti · {aspect.toSign}
                  </p>
                  <div className="mt-2 grid gap-2 text-sm leading-6">
                    <p className="rounded-[12px] bg-[rgba(13,129,126,0.08)] px-3 py-2 text-[var(--shreem-ink)]">
                      <span className="font-semibold">Effect: </span>
                      {compactKundliText(impact.positive, 150)}
                    </p>
                    <p className="rounded-[12px] bg-[rgba(185,74,64,0.08)] px-3 py-2 text-[var(--shreem-muted)]">
                      <span className="font-semibold text-[var(--shreem-ink)]">
                        Caution:
                      </span>{" "}
                      {compactKundliText(impact.negative, 150)}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </details>
      )}
    </section>
  )
}

const CompactDashaPredictionList = ({
  rows,
}: {
  rows?: KundliAnalysis["dasha_predictions"]
}) => {
  const uniqueRows = uniqueByText(rows || [], (row) => `${row.period} ${row.prediction}`)
    .filter(
      (row) =>
        !/period gives results through its house placement|treat this period as active for the themes shown|keep decisions practical, strengthen the period lord/i.test(
          `${row.prediction} ${row.action}`
        )
    )
    .slice(0, 3)

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
              {fullKundliText(item.prediction)}
            </p>
            <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.74)] px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
              {fullKundliText(item.action)}
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
            {fullKundliText(item)}
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
  const hasQuestionAnswers = Boolean(
    getKundliQuestions(result).length &&
      result.analysis?.sub_question_answers?.length
  )
  const [guideOpen, setGuideOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(
    hasQuestionAnswers ? "kundli-answer" : "kundli-predictions"
  )

  useEffect(() => {
    if (!hasQuestionAnswers && activeSection === "kundli-answer") {
      setActiveSection("kundli-predictions")
    }
  }, [activeSection, hasQuestionAnswers])

  if (!chart) {
    return null
  }

  const kundliChart = chart

  const showGeneralText =
    !hasQuestionAnswers &&
    Boolean(
      result.analysis?.summary ||
        result.analysis?.career_direction ||
        result.analysis?.relationship_pattern ||
        result.analysis?.health_caution ||
        result.analysis?.current_period_analysis
    )
  const tocItems = [
    ...(hasQuestionAnswers ? [{ id: "kundli-answer", label: "Answer" }] : []),
    { id: "kundli-timing", label: "Timing" },
    { id: "kundli-predictions", label: "Predictions" },
    { id: "kundli-houses", label: "Houses" },
    { id: "kundli-remedies", label: "Remedies" },
  ]

  return (
    <div className="grid gap-4 relative">
      <ResultAnchorNav
        items={tocItems}
        activeId={activeSection}
        onSelect={(sectionId) => setActiveSection(sectionId)}
        onOpenInfo={() => setGuideOpen(true)}
      />
      <KundliGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
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

      {hasQuestionAnswers && (
        <div
          id="kundli-answer"
          className={activeSection === "kundli-answer" ? "scroll-mt-28" : "hidden"}
        >
          <KundliAnswerFirstCard result={result} />
        </div>
      )}

      <div
        id="kundli-predictions"
        className={
          activeSection === "kundli-predictions"
            ? "grid gap-4 scroll-mt-28"
            : "hidden"
        }
      >
        <FocusedPredictionCards result={result} />
      </div>

      <div
        id="kundli-timing"
        className={
          activeSection === "kundli-timing"
            ? "grid gap-4 scroll-mt-28"
            : "hidden"
        }
      >
        {result.analysis?.current_period_analysis && (
          <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              What the current period means
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
              {result.analysis.current_period_analysis}
            </p>
          </section>
        )}
        <CurrentGocharImpactCard result={result} />
        <DashaCard chart={chart} />
        <CompactDashaPredictionList rows={result.analysis?.dasha_predictions} />
        <DashaTimelineTable timeline={result.dasha_timeline} />
        <DashaDecisionTreeTable rows={result.analysis?.dasha_decision_tree} />
      </div>

      {activeSection === "kundli-predictions" && showGeneralText && (
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

      <div
        id="kundli-remedies"
        className={
          activeSection === "kundli-remedies"
            ? "grid gap-4 scroll-mt-28"
            : "hidden"
        }
      >
      {Boolean(result.analysis?.targeted_remedies?.length) && (
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Pooja, daan, mantra and stone guidance
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            Remedies are selected from active graha, Lagna lord, detected dosha
            and health-watch signals. Each row should include worship, mantra,
            daan/seva, conduct correction, and gemstone caution where relevant.
            For strong pooja, gemstone or dosha decisions, take expert review
            before starting.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {uniqueByText(result.analysis?.targeted_remedies || [], (item) => `${item.pain_point} ${item.mantra_or_pooja}`)
              .slice(0, 6)
              .map((item, index) => (
                <article
                  key={`${item.pain_point}-${index}`}
                  className="rounded-[18px] border border-[var(--shreem-border)] bg-white/76 px-4 py-4"
                >
                  <p className="text-sm font-semibold leading-6 text-[var(--shreem-ink)]">
                    {item.pain_point}
                  </p>
                  <p className="mt-2 rounded-[14px] bg-[rgba(255,248,233,0.82)] px-3 py-2 text-sm leading-6 text-[var(--shreem-ink)]">
                    <span className="font-semibold">Pooja/mantra:</span>{" "}
                    {compactKundliText(item.mantra_or_pooja, 300)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                    <span className="font-semibold text-[var(--shreem-ink)]">
                      Daan, conduct and stone caution:
                    </span>{" "}
                    {compactKundliText(item.daily_practice, 360)}
                  </p>
                </article>
              ))}
          </div>
        </div>
      )}

      </div>

      {activeSection === "kundli-remedies" && (stoneCards?.length || 0) > 0 && (
        <section className="space-y-3">
          <div className="grid gap-3 small:grid-cols-3">
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
                {stone?.caution && (
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {compactKundliText(stone.caution, 160)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-[18px] border border-[rgba(13,129,126,0.18)] bg-[rgba(240,248,246,0.74)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Buy only after expert confirmation
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              Gemstone listings show weight, ratti/carat, metal, form, treatment and certificate details from Shreem vendor substores.
            </p>
            <LocalizedClientLink
              href={`/gemstones${
                stoneCards?.[0]?.primary
                  ? `?stone=${encodeURIComponent(stoneCards[0].primary)}`
                  : ""
              }`}
              className="mt-3 inline-flex rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-4 py-2 text-xs font-semibold text-white"
            >
              View matching gemstone vendors
            </LocalizedClientLink>
          </div>
        </section>
      )}

      {activeSection === "kundli-remedies" && result.stones?.caution && (
        <p className="rounded-[16px] border border-[rgba(212,161,38,0.26)] bg-[rgba(255,248,233,0.74)] px-4 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
          {compactKundliText(result.stones.caution, 220)}
        </p>
      )}

      {activeSection === "kundli-remedies" &&
        Boolean(result.analysis?.shreem_product_suggestions?.length) && (
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
                  src={item.image_url || "/shreem-scenes/hero-scene.jpg"}
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

      {activeSection === "kundli-remedies" &&
        result.analysis?.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[rgba(255,248,233,0.84)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.expert_call_reason ||
              "Gemstones, doshas, and pooja decisions should be confirmed by a human astrologer."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-expert-jyotish-consultation"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-2.5 text-sm font-semibold text-white small:w-auto"
          >
            Book Sanjay Kumar Pandey
          </LocalizedClientLink>
        </div>
      )}


      <section
        id="kundli-houses"
        className={
          activeSection === "kundli-houses"
            ? "grid gap-4 scroll-mt-28"
            : "hidden"
        }
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Life area interpretation
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
            What each house means for you
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            These are the final combined conclusions after lordship, placements,
            drishti, dasha and proven special combinations are weighed together.
          </p>
        </div>
        <HouseOutcomeTable rows={result.analysis?.house_outcomes} />
        <GrahaDrishtiCard chart={chart} outcomes={result.analysis?.house_outcomes} />
      </section>

      {false && (
      <section
        id="kundli-proof"
        className="hidden"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            For astrologers
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
            Complete calculated chart and audit trail
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            This tab preserves the technical calculation, rule evidence and
            timing audit behind the customer interpretation.
          </p>
        </div>
        <div
          className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <NorthIndianChart chart={kundliChart} mode="lagna" title="Lagna chart" />
            <NorthIndianChart chart={kundliChart} mode="bhava" title="Bhava Chalit chart" />
            <NorthIndianChart chart={kundliChart} mode="moon" title="Chandra chart" />
          </div>
          <div className="grid gap-3">
            <ChartMiniCard
              label="Lagna"
              value={`${kundliChart.ascendant} ${formatDegree(kundliChart.ascendantDegree)}`}
              detail={`${kundliChart.ascendantNakshatra} pada ${kundliChart.ascendantPada}`}
            />
            <ChartMiniCard
              label="Rashi"
              value={`${kundliChart.moonSign} ${formatDegree(kundliChart.moonDegree)}`}
              detail={`${kundliChart.nakshatra} pada ${kundliChart.nakshatraPada}`}
            />
            <ChartMiniCard
              label="Birth panchang"
              value={kundliChart.tithi}
              detail={`${kundliChart.yoga} yoga · ${kundliChart.karana} karana`}
            />
          </div>
        </div>

        <BhavaChalitSummary chart={kundliChart} />
        <DashaCard chart={kundliChart} />
        <DashaTimelineTable timeline={result.dasha_timeline} />
        <DashaDecisionTreeTable rows={result.analysis?.dasha_decision_tree} />
        <CriticalTimingWindowList analysis={result.critical_period_analysis} />
        <RiskWatchList rows={result.analysis?.risk_watch} />
        <LongevityAssessmentCard assessment={result.longevity_assessment} />
        <MarakaBadhakaAuditCard analysis={result.critical_period_analysis} />
        <PredictionTable
          rows={result.analysis?.prediction_table}
          hasQuestionAnswers={hasQuestionAnswers}
        />
        {Boolean(result.analysis?.sub_question_answers?.length) && (
          <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Question evidence audit
            </p>
            <div className="mt-3 grid gap-2">
              {result.analysis?.sub_question_answers?.map((item, index) => (
                <div key={`question-proof-${index}`} className="rounded-[14px] bg-white/76 px-3 py-3 text-xs leading-5 text-[var(--shreem-muted)]">
                  <p className="font-semibold text-[var(--shreem-ink)]">Q{index + 1}: {item.question}</p>
                  <p className="mt-1">{item.chart_reason}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <CompactSpecialCaseSummary result={result} />
        <SpecialCaseReadingList rows={result.analysis?.special_case_readings} />
        <GrahaDrishtiCard chart={kundliChart} outcomes={result.analysis?.house_outcomes} />
        {Boolean(result.analysis?.house_outcomes?.length) && (
          <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              House evidence audit
            </p>
            <div className="mt-3 grid gap-2">
              {result.analysis?.house_outcomes?.map((item) => (
                <details key={`house-proof-${item.house}`} className="rounded-[14px] bg-white/76 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  <summary className="cursor-pointer font-semibold text-[var(--shreem-ink)]">
                    H{item.house}: {item.theme}
                  </summary>
                  <p className="mt-2"><strong>Calculated outcome:</strong> {item.outcome}</p>
                  <p className="mt-1"><strong>Evidence:</strong> {item.evidence}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <GrahaProofGrid chart={kundliChart} />
        <PlanetEffectList chart={kundliChart} effects={result.analysis?.planet_effects} />
        <BphsRuleProofList proofs={result.bphs_rule_proofs} />
        <AstrologerAuditTables chart={kundliChart} />
        <BookCitationList items={result.analysis?.book_citations} />
        <CompactInsightList title="Generated upaay audit" items={result.analysis?.upaay} limit={8} />
        {Boolean(result.analysis?.targeted_remedies?.length) && (
          <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Remedy selection proof
            </p>
            <div className="mt-3 grid gap-2">
              {result.analysis?.targeted_remedies?.map((item, index) => (
                <p key={`remedy-proof-${index}`} className="rounded-[14px] bg-white/76 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  <span className="font-semibold text-[var(--shreem-ink)]">{item.pain_point}:</span>{" "}
                  {item.chart_basis}
                </p>
              ))}
            </div>
          </section>
        )}
        {Boolean(stoneCards?.length) && (
          <section className="rounded-[20px] border border-[var(--shreem-border)] bg-white/66 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
              Gemstone selection proof
            </p>
            <div className="mt-3 grid gap-2">
              {stoneCards?.map((stone, index) => (
                <p key={`stone-proof-${index}`} className="rounded-[14px] bg-white/76 px-3 py-2 text-xs leading-5 text-[var(--shreem-muted)]">
                  <span className="font-semibold text-[var(--shreem-ink)]">{stone?.label}: {stone?.primary}</span>{" "}
                  {stone?.chart_basis} {stone?.caution}
                </p>
              ))}
            </div>
          </section>
        )}
      </section>
      )}

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
      <BackToTopButton />
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
  <div className="rounded-[22px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-4 py-4">
    <p className="text-sm font-semibold text-[var(--shreem-ink)]">{title}</p>
    <div className="mt-4 grid gap-3">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
          Name
        </span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-3 text-sm text-[var(--shreem-ink)] outline-none placeholder:text-[var(--shreem-muted)]"
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
            className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-3 text-sm text-[var(--shreem-ink)] outline-none"
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
            className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-3 text-sm text-[var(--shreem-ink)] outline-none"
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
  const kootaScores = Array.isArray(result.compatibility?.scores)
    ? result.compatibility.scores.filter((score) => score && score.name)
    : []
  const deepScores = Array.isArray(result.compatibility?.deep_scores)
    ? result.compatibility.deep_scores.filter((score) => score && score.name)
    : []
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
      <div className="rounded-[24px] border border-[rgba(212,161,38,0.26)] bg-[var(--shreem-card)] px-5 py-5">
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
          <div className="rounded-full border border-[var(--shreem-border)] bg-[rgba(13,129,126,0.12)] px-4 py-2 text-sm font-semibold capitalize text-[var(--shreem-ink)]">
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

      <div className="grid gap-3 xl:grid-cols-2">
        <InsightList
          title="Special cases checked"
          items={
            result.compatibility?.case_registry?.length
              ? result.compatibility.case_registry
              : ["No major special-case blocker is strongly proven from the deterministic match audit."]
          }
        />
        <InsightList
          title="Deep match risks"
          items={
            result.compatibility?.red_flags?.length
              ? result.compatibility.red_flags
              : ["No severe combined red flag is strongly proven. Still verify family, values, consent, health and practical compatibility."]
          }
        />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[var(--shreem-border)] bg-[var(--shreem-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-0 small:min-w-[620px] text-left text-sm">
            <thead className="bg-[rgba(13,129,126,0.12)] text-xs uppercase tracking-[0.06em] small:tracking-[0.14em] text-[var(--shreem-gold-deep)]">
              <tr>
                <th className="break-words px-4 py-3">Koota</th>
                <th className="break-words px-4 py-3">Score</th>
                <th className="break-words px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {kootaScores.map((score, index) => (
                <tr key={score.name} className="border-t border-[var(--shreem-border)]">
                  <td className="break-words px-4 py-3 font-semibold text-[var(--shreem-ink)]">
                    {score.name}
                  </td>
                  <td className="break-words px-4 py-3 text-[var(--shreem-muted)]">
                    {score.score}/{score.max}
                  </td>
                  <td className="break-words px-4 py-3 text-[var(--shreem-muted)]">
                    {score.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Boolean(deepScores.length) && (
        <div className="overflow-hidden rounded-[20px] border border-[var(--shreem-border)] bg-[var(--shreem-card)]">
          <div className="border-b border-[var(--shreem-border)] px-4 py-3">
            <p className="brand-kicker">Deep relationship audit</p>
            <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
              This goes beyond guna and checks 7th house promise, Moon/Venus Manglik balance, family houses, conflict houses, dasha readiness and graha pressure.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-0 small:min-w-[700px] text-left text-sm">
              <thead className="bg-[rgba(13,129,126,0.12)] text-xs uppercase tracking-[0.06em] small:tracking-[0.14em] text-[var(--shreem-gold-deep)]">
                <tr>
                  <th className="break-words px-4 py-3">Layer</th>
                  <th className="break-words px-4 py-3">Score</th>
                  <th className="break-words px-4 py-3">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {deepScores.map((score) => (
                  <tr key={score.name} className="border-t border-[var(--shreem-border)]">
                    <td className="break-words px-4 py-3 font-semibold text-[var(--shreem-ink)]">
                      {score.name}
                    </td>
                    <td className="break-words px-4 py-3 text-[var(--shreem-muted)]">
                      {score.score}/{score.max}
                    </td>
                    <td className="break-words px-4 py-3 text-[var(--shreem-muted)]">
                      {score.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        <div className="rounded-[20px] border border-[var(--shreem-border)] bg-[var(--shreem-card)] px-4 py-4">
          <p className="brand-kicker">Timing note</p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.marriage_timing_note}
          </p>
        </div>
      )}

      {result.analysis?.expert_call_recommended && (
        <div className="rounded-[20px] border border-[rgba(212,161,38,0.32)] bg-[var(--shreem-card)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
            Expert review suggested
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
            {result.analysis.expert_call_reason ||
              "Marriage matching should be confirmed with a human astrologer before final decisions."}
          </p>
          <LocalizedClientLink
            href="/products/shreem-expert-jyotish-consultation"
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
  const dashaTimeline = result.dasha_timeline
  const stoneCards = getStoneCards(result.stones)
  const printHouseOutcomeByHouse = new Map(
    (analysis?.house_outcomes || []).map((row) => [row.house, row])
  )
  const lagnaChartSvg = buildNorthIndianChartSvg({
    chart,
    mode: "lagna",
    title: "Lagna chart",
  })
  const bhavaChartSvg = buildNorthIndianChartSvg({
    chart,
    mode: "bhava",
    title: "Bhava Chalit chart",
  })
  const moonChartSvg = buildNorthIndianChartSvg({
    chart,
    mode: "moon",
    title: "Chandra chart",
  })
  const isiOS =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  const win = window.open("", "_blank", "width=900,height=1200")

  if (!win) {
    window.print()
    return
  }

      const dashaTimelineHtml = dashaTimeline
    ? [
        ["Mahadasha context", dashaTimeline.mahadashas],
        ["Current Antardasha", dashaTimeline.current_antardashas],
        ["Current Pratyantar", dashaTimeline.current_pratyantars],
        ["Current Sookshma", dashaTimeline.current_sookshmas],
        ["Current Prana", dashaTimeline.current_pranas],
      ]
        .filter(([, rows]) => Array.isArray(rows) && rows.length)
        .map(
          ([title, rows]) =>
            `<h3>${escapeHtml(String(title))}</h3><table><thead><tr><th>Period</th><th>Lord</th><th>From</th><th>To</th></tr></thead><tbody>${(rows as DashaTimelinePeriod[])
              .map(
                (row) =>
                  `<tr><td>${escapeHtml(
                    `${row.parentPath ? `${row.parentPath}/` : ""}${row.level}`
                  )}</td><td>${escapeHtml(row.lord)}</td><td>${escapeHtml(
                    row.startLabel
                  )}</td><td>${escapeHtml(row.endLabel)}</td></tr>`
              )
              .join("")}</tbody></table>`
        )
        .join("")
    : ""

  win.document.write(`<!doctype html>
<html>
<head>
  <title>Shreem Kundli Report</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <base href="${escapeHtml(window.location.origin)}" />
  <style>
    body{font-family:Georgia,'Times New Roman',serif;color:#0b2735;background:#fffaf1;margin:32px;line-height:1.55}
    h1{font-size:34px;margin:0 0 8px}
    h2{font-size:20px;margin:28px 0 8px;color:#7a5412}
    .card{border:1px solid #dbc99e;border-radius:18px;padding:18px;margin:14px 0;background:#fff}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .small{font-size:13px;color:#516b75}
    .chart-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}
    .chart-card{border:1px solid #dbc99e;border-radius:18px;padding:10px;background:#fff;break-inside:avoid}
    .chart-card h3{font-size:13px;margin:0 0 8px;color:#7a5412;text-transform:uppercase;letter-spacing:.08em}
    .chart-card svg{width:100%;height:auto;display:block}
    table{width:100%;border-collapse:collapse;background:#fff;margin:14px 0}
    th,td{border:1px solid #dbc99e;padding:9px;text-align:left;vertical-align:top;font-size:13px}
    th{color:#7a5412;background:#fff4d8;text-transform:uppercase;letter-spacing:.08em}
    ul{padding-left:20px}
    .actions{position:sticky;top:0;z-index:2;display:flex;gap:10px;align-items:center;justify-content:center;background:#fffaf1;padding:10px;border-bottom:1px solid #dbc99e;margin:-32px -32px 22px}
    button{border:0;border-radius:999px;background:#123f63;color:white;padding:10px 18px;font-weight:700}
    .ios-note{font-size:12px;color:#516b75}
    @media (max-width:800px){.chart-grid{grid-template-columns:1fr}}
    @media print{.actions{display:none} body{margin:18px;background:white}.chart-grid{grid-template-columns:repeat(3,1fr)}}
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Save as PDF</button>
    ${
      isiOS
        ? '<span class="ios-note">iPhone/iPad: tap Save as PDF, then use Share to save or send.</span>'
        : '<span class="ios-note">Choose Save as PDF in the print dialog.</span>'
    }
  </div>
  <div style="text-align: center; margin-bottom: 20px;"><img src="/logo.jpeg" alt="Shreem Logo" style="max-height: 80px;" /></div>
  <h1 style="text-align: center;">Shreem Kundli Report</h1>
  <p class="small">${escapeHtml(profile?.name || "Native")} · ${escapeHtml(profile?.birth_date)} ${escapeHtml(profile?.birth_time)} · ${escapeHtml(profile?.city)}</p>
  <div class="grid">
    <div class="card"><strong>Lagna</strong><br/>${escapeHtml(chart.ascendant)} ${escapeHtml(chart.ascendantDegree)} deg<br/><span class="small">${escapeHtml(chart.ascendantNakshatra)} pada ${escapeHtml(chart.ascendantPada)}</span></div>
    <div class="card"><strong>Rashi</strong><br/>${escapeHtml(chart.moonSign)} ${escapeHtml(chart.moonDegree)} deg<br/><span class="small">${escapeHtml(chart.nakshatra)} pada ${escapeHtml(chart.nakshatraPada)}</span></div>
  </div>
  <h2>Calculated Charts</h2>
  <div class="chart-grid">
    <div class="chart-card"><h3>Lagna chart</h3>${lagnaChartSvg}</div>
    <div class="chart-card"><h3>Bhava Chalit chart</h3>${bhavaChartSvg}</div>
    <div class="chart-card"><h3>Chandra chart</h3>${moonChartSvg}</div>
  </div>
  <h2>Vimshottari Dasha</h2>
  <div class="card"><p><strong>Mahadasha:</strong> ${escapeHtml(dasha?.mahadasha.lord)} (${escapeHtml(dasha?.mahadasha.startLabel)} - ${escapeHtml(dasha?.mahadasha.endLabel)})</p><p><strong>Antardasha:</strong> ${escapeHtml(dasha?.antardasha.lord)} (${escapeHtml(dasha?.antardasha.startLabel)} - ${escapeHtml(dasha?.antardasha.endLabel)})</p><p><strong>Pratyantar:</strong> ${escapeHtml(dasha?.pratyantar.lord)} (${escapeHtml(dasha?.pratyantar.startLabel)} - ${escapeHtml(dasha?.pratyantar.endLabel)})</p><p class="small">${escapeHtml(dasha?.note)}</p></div>
  ${dashaTimelineHtml}
  <h2>Graha Positions</h2>
  <table><thead><tr><th>Graha</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra</th></tr></thead><tbody>${chart.planets.map((planet) => `<tr><td>${escapeHtml(planet.name)}</td><td>${escapeHtml(planet.sign)}</td><td>${escapeHtml(planet.signDegree)} deg</td><td>${escapeHtml(formatHousePosition(planet))}</td><td>${escapeHtml(planet.nakshatra)} pada ${escapeHtml(planet.pada)}${planet.retrograde ? " (retrograde)" : ""}</td></tr>`).join("")}</tbody></table>
  <h2>House Information</h2>
  <table><thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Planets</th><th>Theme</th></tr></thead><tbody>${chart.houses.map((house) => `<tr><td>${escapeHtml(house.house)}</td><td>${escapeHtml(house.sign)}</td><td>${escapeHtml(house.signLord)}</td><td>${escapeHtml(getHousePlanets(chart, house.house).map((planet) => planet.name).join(", ") || "-")}</td><td>${escapeHtml(house.theme)}</td></tr>`).join("")}</tbody></table>
  <h2>Graha Drishti</h2>
  <table><thead><tr><th>From</th><th>To House</th><th>Type</th><th>Impact</th></tr></thead><tbody>${(chart.aspects || []).map((aspect) => `<tr><td>${escapeHtml(aspect.fromPlanet)} from H${escapeHtml(aspect.fromHouse)}</td><td>H${escapeHtml(aspect.toHouse)} ${escapeHtml(aspect.toSign)}</td><td>${escapeHtml(aspect.aspectType)}</td><td>${escapeHtml(aspect.interpretation)}</td></tr>`).join("")}</tbody></table>
  <h2>House-wise Results</h2>
  <table><thead><tr><th>House</th><th>Theme</th><th>Final meaning</th><th>What to do</th></tr></thead><tbody>${chart.houses.map((house) => {
    const row = printHouseOutcomeByHouse.get(house.house)
    return `<tr><td>${escapeHtml(house.house)}</td><td>${escapeHtml(house.theme)}</td><td>${escapeHtml(getHouseCustomerMeaning(row))}</td><td>${escapeHtml(getHouseCustomerAction(row))}</td></tr>`
  }).join("")}</tbody></table>
  <h2>Life Guidance</h2>
  <table><thead><tr><th>Area</th><th>Chart Basis</th><th>Conclusion</th><th>Action</th></tr></thead><tbody>${(analysis?.prediction_table || []).filter((row) => !isTemplatePredictionRow(row, Boolean(analysis?.sub_question_answers?.length))).map((row) => `<tr><td>${escapeHtml(row.area)}</td><td>${escapeHtml(row.chart_basis)}</td><td>${escapeHtml(row.prediction)}</td><td>${escapeHtml(row.advice)}</td></tr>`).join("")}</tbody></table>
  <h2>Analysis</h2>
  ${(analysis?.opening_profile || []).length ? `<h2>Who You Are and Where You Can Thrive</h2><div class="card">${(analysis?.opening_profile || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>` : ""}
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
  ${(profile?.sub_questions || []).length ? `<h2>Your Questions</h2><div class="card"><ol>${(profile?.sub_questions || []).map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ol></div>` : ""}
  ${(analysis?.sub_question_answers || []).length ? `<h2>Focused Answers</h2>${(analysis?.sub_question_answers || []).map((row, index) => `<div class="card"><p><strong>Q${index + 1}: ${escapeHtml(row.question)}</strong></p><p>${escapeHtml(row.answer)}</p>${row.timing ? `<p><strong>Timing:</strong> ${escapeHtml(row.timing)}</p>` : ""}${row.action ? `<p><strong>Action:</strong> ${escapeHtml(row.action)}</p>` : ""}<p class="small"><strong>Chart basis:</strong> ${escapeHtml(row.chart_reason)}</p></div>`).join("")}` : ""}
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

  if (!isiOS) {
    setTimeout(() => win.print(), 500)
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}


const parseHistoryRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return {}
    }
  }

  return asRecord(value)
}

const parseHistoryValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

const pickHistoryRecord = (
  source: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> => {
  for (const key of keys) {
    const record = parseHistoryRecord(source[key])

    if (Object.keys(record).length) {
      return record
    }
  }

  return {}
}

const isStorageQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014)

const safeSetLocalStorage = (key: string, value: string, fallbackValue = "") => {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      return false
    }

    try {
      window.localStorage.removeItem(key)
      window.localStorage.setItem(key, fallbackValue || value)
      return true
    } catch {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // Ignore storage cleanup failure.
      }
      return false
    }
  }
}

const compactLocalText = (value: unknown, max = 1200) =>
  typeof value === "string" ? value.slice(0, max) : ""

const compactLocalAnalysis = (analysis?: KundliAnalysis): KundliAnalysis | undefined => {
  if (!analysis) {
    return undefined
  }

  return {
    summary: compactLocalText(analysis.summary, 1800),
    opening_profile: (analysis.opening_profile || []).slice(0, 2).map((paragraph) =>
      compactLocalText(paragraph, 1200)
    ),
    career_direction: compactLocalText(analysis.career_direction, 1400),
    relationship_pattern: compactLocalText(analysis.relationship_pattern, 1400),
    health_caution: compactLocalText(analysis.health_caution, 1200),
    current_period_analysis: compactLocalText(analysis.current_period_analysis, 1600),
    prediction_table: (analysis.prediction_table || []).slice(0, 10).map((row) => ({
      area: compactLocalText(row.area, 120),
      chart_basis: compactLocalText(row.chart_basis, 700),
      prediction: compactLocalText(row.prediction, 900),
      advice: compactLocalText(row.advice, 500),
    })),
    sub_question_answers: (analysis.sub_question_answers || []).slice(0, 3).map((row) => ({
      question: compactLocalText(row.question, 500),
      answer: compactLocalText(row.answer, 1400),
      chart_reason: compactLocalText(row.chart_reason, 900),
      timing: compactLocalText(row.timing, 400),
      action: compactLocalText(row.action, 700),
    })),
    dasha_predictions: (analysis.dasha_predictions || []).slice(0, 3).map((row) => ({
      period: compactLocalText(row.period, 160),
      chart_basis: compactLocalText(row.chart_basis, 700),
      classical_basis: compactLocalText(row.classical_basis, 500),
      prediction: compactLocalText(row.prediction, 900),
      action: compactLocalText(row.action, 500),
    })),
    house_outcomes: (analysis.house_outcomes || []).slice(0, 12).map((row) => ({
      house: row.house,
      theme: compactLocalText(row.theme, 160),
      prevailing_impact: compactLocalText(row.prevailing_impact, 400),
      user_meaning: compactLocalText(row.user_meaning, 700),
      outcome: compactLocalText(row.outcome, 700),
      practical_use: compactLocalText(row.practical_use, 500),
      evidence: compactLocalText(row.evidence, 400),
    })),
    targeted_remedies: (analysis.targeted_remedies || []).slice(0, 6).map((row) => ({
      pain_point: compactLocalText(row.pain_point, 160),
      chart_basis: compactLocalText(row.chart_basis, 700),
      mantra_or_pooja: compactLocalText(row.mantra_or_pooja, 900),
      daily_practice: compactLocalText(row.daily_practice, 900),
    })),
    special_case_readings: (analysis.special_case_readings || []).slice(0, 5).map((row) => ({
      case_name: compactLocalText(row.case_name, 220),
      chart_basis: compactLocalText(row.chart_basis, 600),
      classical_basis: compactLocalText(row.classical_basis, 500),
      combined_effect: compactLocalText(row.combined_effect, 700),
      timing: compactLocalText(row.timing, 300),
      solution: compactLocalText(row.solution, 700),
    })),
    expert_call_recommended: Boolean(analysis.expert_call_recommended),
    expert_call_reason: compactLocalText(analysis.expert_call_reason, 700),
  }
}

const compactLocalDashaTimeline = (
  timeline?: KundliDashaTimeline
): KundliDashaTimeline | undefined => {
  if (!timeline) {
    return undefined
  }

  return {
    range: timeline.range,
    mahadashas: timeline.mahadashas?.slice(0, 12),
    lifetime_antardashas: timeline.lifetime_antardashas?.slice(0, 36),
    current_antardashas: timeline.current_antardashas?.slice(0, 12),
    current_pratyantars: timeline.current_pratyantars?.slice(0, 12),
    current_sookshmas: timeline.current_sookshmas?.slice(0, 12),
    current_pranas: timeline.current_pranas?.slice(0, 12),
  }
}

const compactLocalCriticalPeriodAnalysis = (
  analysis?: KundliCriticalPeriodAnalysis
): KundliCriticalPeriodAnalysis | undefined => {
  if (!analysis) {
    return undefined
  }

  const bestRows = <
    T extends
      | NonNullable<KundliCriticalPeriodAnalysis["exact_timing_windows"]>[number]
      | NonNullable<KundliCriticalPeriodAnalysis["retrospective_timing_windows"]>[number],
  >(
    rows?: T[],
    limit = 12
  ) =>
    [...(rows || [])]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, limit)

  return {
    maraka_lords: analysis.maraka_lords?.slice(0, 4),
    badhaka_house: analysis.badhaka_house,
    badhakesh: analysis.badhakesh,
    active_triggers: analysis.active_triggers?.slice(0, 6),
    watch_periods: analysis.watch_periods?.slice(0, 8),
    retrospective_timing_windows: bestRows(
      analysis.retrospective_timing_windows,
      10
    ),
    exact_timing_windows: bestRows(analysis.exact_timing_windows, 12),
    medical_watchlist: analysis.medical_watchlist?.slice(0, 6),
    safety_note: analysis.safety_note,
  }
}

const compactLocalKundliResult = (result?: KundliResult): KundliResult | undefined => {
  if (!result) {
    return undefined
  }

  return {
    profile: result.profile,
    chart: result.chart,
    dasha_timeline: compactLocalDashaTimeline(result.dasha_timeline),
    critical_period_analysis: compactLocalCriticalPeriodAnalysis(
      result.critical_period_analysis
    ),
    detected_yogas: result.detected_yogas?.slice(0, 12),
    stones: result.stones,
    health_indicators: result.health_indicators?.slice(0, 8),
    targeted_remedy_seeds: result.targeted_remedy_seeds?.slice(0, 6),
    analysis: compactLocalAnalysis(result.analysis),
    analysis_mode: result.analysis_mode,
    usage_units: result.usage_units,
    usage_synced: result.usage_synced,
  }
}

const compactLocalHistoryItem = (
  item: AstrologyHistoryItem
): AstrologyHistoryItem => {
  const response =
    item.type === "Kundli"
      ? compactLocalKundliResult(item.response as KundliResult)
      : item.response

  return {
    ...item,
    summary: compactLocalText(item.summary, 900),
    response,
    raw: undefined,
  }
}

const serializeLocalHistory = (items: AstrologyHistoryItem[]) =>
  JSON.stringify(items.slice(0, LOCAL_HISTORY_LIMIT).map(compactLocalHistoryItem))

const serializeLocalSavedKundlis = (profiles: SavedKundliProfile[]) =>
  JSON.stringify(
    profiles
      .slice(0, LOCAL_SAVED_KUNDLI_LIMIT)
      .map(({ lastResult, ...profile }) => ({
        ...profile,
        lastResult: compactLocalKundliResult(lastResult),
      }))
  )

const serializeLocalSavedKundliDetails = (profiles: SavedKundliProfile[]) =>
  JSON.stringify(
    profiles
      .slice(0, LOCAL_SAVED_KUNDLI_LIMIT)
      .map(({ lastResult, ...profile }) => profile)
  )

const pickHistoryValue = (
  source: Record<string, unknown>,
  keys: string[]
): unknown => {
  for (const key of keys) {
    const value = parseHistoryValue(source[key])

    if (value !== undefined && value !== null && value !== "") {
      return value
    }
  }

  return undefined
}

const historyText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ""
}

const historyStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) =>
          typeof item === "string"
            ? item
            : historyText(
                asRecord(item).reason,
                asRecord(item).text,
                asRecord(item).summary,
                asRecord(item).description
              )
        )
        .filter(Boolean)
    : []

const historyScoreRows = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          const record = asRecord(item)
          const score = Number(record.score ?? record.value ?? record.points ?? 0)
          const max = Number(record.max ?? record.maximum ?? record.total ?? 0)

          return {
            name: historyText(record.name, record.label, record.koota, `Score ${index + 1}`),
            score: Number.isFinite(score) ? score : 0,
            max: Number.isFinite(max) && max > 0 ? max : 0,
            reason: historyText(
              record.reason,
              record.meaning,
              record.note,
              record.description,
              "Saved compatibility score."
            ),
          }
        })
        .filter((row) => row.name)
    : []

const historyBookCitations = (value: unknown): BookCitation[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") {
            return { citation: item, relevance: "Saved matchmaking reference." }
          }

          const record = asRecord(item)
          const citation = historyText(record.citation, record.title, record.source)

          if (!citation) {
            return null
          }

          return {
            citation,
            relevance: historyText(
              record.relevance,
              record.reason,
              record.text,
              "Used for compatibility reading."
            ),
          }
        })
        .filter((item): item is BookCitation => Boolean(item))
    : []

const normalizeMatchmakingResult = (value: unknown): MatchmakingResult => {
  const source = parseHistoryRecord(value)
  const compatibilitySource = parseHistoryRecord(
    source.compatibility || source.match || source.result || source.compatibility_result
  )
  const analysisSource = parseHistoryRecord(source.analysis || source.reading || source.ai_analysis)
  const girlSource = parseHistoryRecord(source.girl || source.female || source.bride)
  const boySource = parseHistoryRecord(source.boy || source.male || source.groom)
  const percentage = Number(
    compatibilitySource.percentage ??
      compatibilitySource.compatibility_percentage ??
      analysisSource.percentage_suggestion ??
      source.percentage
  )
  const recommendation = historyText(
    analysisSource.recommendation,
    compatibilitySource.deterministicRecommendation,
    source.recommendation
  ).toLowerCase()
  const safeRecommendation =
    recommendation === "go" || recommendation === "avoid" || recommendation === "caution"
      ? (recommendation as "go" | "caution" | "avoid")
      : "caution"

  return {
    ...(source as MatchmakingResult),
    girl: {
      ...(girlSource as MatchmakingResult["girl"]),
      profile: asRecord(girlSource.profile) as MatchmakingResult["girl"]["profile"],
      chart: (girlSource.chart || source.girl_chart) as PrashnaChart | undefined,
    },
    boy: {
      ...(boySource as MatchmakingResult["boy"]),
      profile: asRecord(boySource.profile) as MatchmakingResult["boy"]["profile"],
      chart: (boySource.chart || source.boy_chart) as PrashnaChart | undefined,
    },
    compatibility: {
      ...(compatibilitySource as MatchmakingResult["compatibility"]),
      scores: historyScoreRows(
        compatibilitySource.scores || compatibilitySource.koota_scores || source.scores
      ),
      deep_scores: historyScoreRows(
        compatibilitySource.deep_scores || compatibilitySource.deepScores || source.deep_scores
      ),
      total: Number(compatibilitySource.total ?? compatibilitySource.score ?? source.total) || undefined,
      max: Number(compatibilitySource.max ?? compatibilitySource.maximum ?? source.max) || undefined,
      percentage: Number.isFinite(percentage) ? percentage : Number(compatibilitySource.percentage) || 0,
      deterministicRecommendation: safeRecommendation,
      case_registry: historyStringArray(
        compatibilitySource.case_registry || compatibilitySource.caseRegistry || source.case_registry
      ),
      red_flags: historyStringArray(
        compatibilitySource.red_flags || compatibilitySource.redFlags || source.red_flags
      ),
    },
    analysis: {
      ...(analysisSource as MatchmakingResult["analysis"]),
      summary: historyText(
        analysisSource.summary,
        analysisSource.decision_reason,
        source.summary,
        source.message,
        "Saved matchmaking reading."
      ),
      recommendation: safeRecommendation,
      percentage_suggestion: Number.isFinite(percentage) ? percentage : undefined,
      decision_reason: historyText(analysisSource.decision_reason, analysisSource.summary, source.summary),
      strengths: historyStringArray(analysisSource.strengths || source.strengths),
      concerns: historyStringArray(analysisSource.concerns || source.concerns),
      family_discussion_points: historyStringArray(
        analysisSource.family_discussion_points || source.family_discussion_points
      ),
      marriage_timing_note: historyText(analysisSource.marriage_timing_note, source.marriage_timing_note),
      remedies: historyStringArray(analysisSource.remedies || source.remedies),
      book_citations: historyBookCitations(analysisSource.book_citations || source.book_citations),
      expert_call_recommended: Boolean(analysisSource.expert_call_recommended),
      expert_call_reason: historyText(analysisSource.expert_call_reason),
    },
    message: historyText(source.message) || undefined,
    retryable: Boolean(source.retryable),
  }
}

const historyQuestionArray = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = parseHistoryValue(value)

    if (Array.isArray(parsed)) {
      const questions = parsed
        .map((item) => historyText(item))
        .filter(Boolean)
        .slice(0, 3)

      if (questions.length) {
        return [questions[0] || "", questions[1] || "", questions[2] || ""]
      }
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim(), "", ""]
    }
  }

  return ["", "", ""]
}

const getHistoryResponseRecord = (item: AstrologyHistoryItem) =>
  parseHistoryRecord(item.response)

const getHistoryInputRecord = (item: AstrologyHistoryItem) =>
  parseHistoryRecord(item.input)

const getKundliHistoryProfile = (item: AstrologyHistoryItem) => {
  const response = getHistoryResponseRecord(item)
  const profile = parseHistoryRecord(response.profile)
  const input = getHistoryInputRecord(item)

  return Object.keys(profile).length ? profile : input
}

const buildKundliSummary = (result?: KundliResult | null) =>
  historyText(
    result?.analysis?.sub_question_answers?.[0]?.answer,
    result?.analysis?.prediction_table?.[0]?.prediction,
    result?.analysis?.summary,
    result?.message,
    result?.detected_yogas?.[0],
    result?.chart ? "Birth chart saved for future viewing." : "Birth details saved."
  )

const normalizeSavedKundliProfile = (
  item: unknown,
  index = 0
): SavedKundliProfile | null => {
  const source = asRecord(item)
  const legacyPlace = historyText(source.birth_place, source.birthPlace)
  const profileRecord = parseHistoryRecord(source.profile)
  const result = parseHistoryRecord(source.lastResult).chart
    ? (source.lastResult as KundliResult)
    : parseHistoryRecord(source.response).chart
    ? (source.response as KundliResult)
    : undefined
  const resultProfile = parseHistoryRecord(result?.profile)
  const name = historyText(
    source.name,
    profileRecord.name,
    resultProfile.name,
    `Family Kundli ${index + 1}`
  )
  const birthDate = historyText(
    source.birthDate,
    source.birth_date,
    profileRecord.birth_date,
    resultProfile.birth_date
  )
  const birthTime = historyText(
    source.birthTime,
    source.birth_time,
    profileRecord.birth_time,
    resultProfile.birth_time
  )
  const cityId = historyText(
    source.cityId,
    source.city_id,
    profileRecord.cityId,
    profileRecord.city_id,
    findCityIdFromLabel(historyText(source.cityLabel, legacyPlace, resultProfile.city))
  )
  const now = new Date().toISOString()
  const questions = historyQuestionArray(
    source.subQuestions,
    source.sub_questions,
    profileRecord.sub_questions,
    resultProfile.sub_questions
  )

  if (!name && !birthDate && !birthTime) {
    return null
  }

  return {
    id: historyText(
      source.id,
      `${name || "kundli"}-${birthDate || "date"}-${birthTime || "time"}-${cityId || "city"}`
    ),
    name,
    gender: historyText(source.gender, profileRecord.gender, resultProfile.gender),
    birthDate,
    birthTime,
    cityId: cityId || "rewa",
    cityLabel: historyText(
      source.cityLabel,
      source.city_label,
      legacyPlace,
      resultProfile.city,
      cityLabel(getCityById(cityId || "rewa"))
    ),
    panchangSystemId: historyText(
      source.panchangSystemId,
      source.panchang_system_id,
      profileRecord.panchangSystemId,
      profileRecord.panchang_system_id,
      resultProfile.panchang_system_id
    ),
    language: (
      ["english", "hindi", "hinglish"].includes(
        historyText(source.language, profileRecord.language, resultProfile.language)
      )
        ? historyText(source.language, profileRecord.language, resultProfile.language)
        : undefined
    ) as AstrologyLanguage | undefined,
    subQuestions: questions,
    savedAt: historyText(source.savedAt, source.saved_at, source.createdAt, now),
    updatedAt: historyText(source.updatedAt, source.updated_at, now),
    lastResult: result,
  }
}

const normalizeSavedKundliProfiles = (...sources: unknown[]) => {
  const byKey = new Map<string, SavedKundliProfile>()

  sources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map((item, index) => normalizeSavedKundliProfile(item, index))
    .filter(Boolean)
    .forEach((item) => {
      const profile = item as SavedKundliProfile
      const key = `${profile.name.toLowerCase()}-${profile.birthDate}-${profile.birthTime}-${profile.cityId}`
      const existing = byKey.get(key)

      byKey.set(key, {
        ...(existing || profile),
        ...profile,
        savedAt: existing?.savedAt || profile.savedAt,
        lastResult: profile.lastResult?.chart
          ? profile.lastResult
          : existing?.lastResult,
      })
    })

  return Array.from(byKey.values()).sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
}

const parseLocalHistory = (value: string | null): AstrologyHistoryItem[] => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed
          .map((item) => {
            const record = asRecord(item)

            if (record.type && record.title && record.createdAt) {
              const historyItem = record as AstrologyHistoryItem
              return historyItem.type === "Matchmaking"
                ? {
                    ...historyItem,
                    response: normalizeMatchmakingResultForUi(historyItem.response),
                  }
                : historyItem
            }

            return normalizeUsageHistory(item)
          })
          .filter((item): item is AstrologyHistoryItem => Boolean(item))
      : []
  } catch {
    return []
  }
}

const formatHistoryDate = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const getHistoryDetailLines = (item: AstrologyHistoryItem) => {
  const input = getHistoryInputRecord(item)
  const response = getHistoryResponseRecord(item)

  if (item.type === "Kundli") {
    const profile = getKundliHistoryProfile(item)
    const questions = historyQuestionArray(
      profile.sub_questions,
      profile.subQuestions,
      input.subQuestions,
      input.sub_questions
    ).filter(Boolean)

    return [
      historyText(profile.name, input.name) ? `Name: ${historyText(profile.name, input.name)}` : "",
      historyText(profile.birth_date, input.birthDate, input.birth_date)
        ? `DOB: ${historyText(profile.birth_date, input.birthDate, input.birth_date)} ${historyText(
            profile.birth_time,
            input.birthTime,
            input.birth_time
          )}`
        : "",
      historyText(profile.city, input.city, input.cityId)
        ? `Place: ${historyText(profile.city, input.city, input.cityId)}`
        : "",
      questions.length ? `Question: ${questions[0]}` : "",
    ].filter(Boolean)
  }

  if (item.type === "Prashna") {
    return [
      historyText(input.question, response.question) ? `Question: ${historyText(input.question, response.question)}` : "",
      historyText(input.cityId, input.city) ? `Place: ${historyText(input.cityId, input.city)}` : "",
    ].filter(Boolean)
  }

  if (item.type === "Lost item") {
    return [
      historyText(input.itemName, input.itemType) ? `Item: ${historyText(input.itemName, input.itemType)}` : "",
      historyText(input.lastSeenPlace) ? `Last seen: ${historyText(input.lastSeenPlace)}` : "",
    ].filter(Boolean)
  }

  return []
}

const normalizeUsageHistory = (item: unknown): AstrologyHistoryItem | null => {
  const source = asRecord(item)
  const input = pickHistoryRecord(source, [
    "input",
    "request",
    "request_payload",
    "input_payload",
    "payload",
  ])
  const metadata = pickHistoryRecord(source, ["metadata"])
  const metadataInput = pickHistoryRecord(metadata, ["input", "request_payload"])
  const finalInput = Object.keys(input).length ? input : metadataInput

  const responseValue =
    pickHistoryValue(source, [
      "response",
      "result",
      "output",
      "response_payload",
      "data",
    ]) || source.response

  const response = parseHistoryRecord(responseValue)
  const profile = parseHistoryRecord(response.profile)
  const tool = String(source.tool || source.tool_name || source.type || "astrology")
  const normalizedTool = tool.toLowerCase()

  const type: AstrologyHistoryItem["type"] = normalizedTool.includes("matchmaking")
    ? "Matchmaking"
    : normalizedTool.includes("kundli")
    ? "Kundli"
    : normalizedTool.includes("lost_item") || normalizedTool.includes("lost-item")
    ? "Lost item"
    : "Prashna"

  const title =
    type === "Matchmaking"
      ? `${historyText(
          asRecord(asRecord(response.girl).profile).name,
          asRecord(asRecord(finalInput.girl).profile).name,
          "Girl"
        )} + ${historyText(
          asRecord(asRecord(response.boy).profile).name,
          asRecord(asRecord(finalInput.boy).profile).name,
          "Boy"
        )}`
      : type === "Kundli"
      ? `${historyText(profile.name, finalInput.name, "Generated")} Kundli`
      : type === "Lost item"
      ? `Lost ${historyText(finalInput.itemName, finalInput.itemType, "item")}`
      : historyText(finalInput.question, response.question, "Prashna session")

  const responseAnalysis = asRecord(response.analysis)
  const subQuestionAnswers = Array.isArray(responseAnalysis.sub_question_answers)
    ? responseAnalysis.sub_question_answers
    : []
  const predictionTable = Array.isArray(responseAnalysis.prediction_table)
    ? responseAnalysis.prediction_table
    : []

  const summary =
    historyText(
      response.answer,
      subQuestionAnswers.length
        ? asRecord(subQuestionAnswers[0]).answer
        : "",
      responseAnalysis.summary,
      responseAnalysis.decision_reason,
      predictionTable.length ? asRecord(predictionTable[0]).prediction : "",
      response.chart_summary,
      String(response.message || "").includes("Full response was too large")
        ? ""
        : response.message,
      "Saved astrology session"
    )

  const createdAt = historyText(
    source.created_at,
    source.createdAt,
    source.created,
    source.updated_at,
    new Date().toISOString()
  )

  return {
    id: historyText(source.id, source.usage_id, `${tool}-${createdAt}-${title}`),
    type,
    title,
    createdAt,
    summary,
    synced: true,
    input: finalInput,
    raw: source,
    response:
      type === "Matchmaking"
        ? normalizeMatchmakingResultForUi(responseValue)
        : (responseValue as
            | PrashnaResult
            | KundliResult
            | LostItemResult
            | undefined),
  }
}

const mergeHistory = (items: AstrologyHistoryItem[]) => {
  const seen = new Set<string>()

  return items
    .filter((item) => {
      if (seen.has(item.id)) {
        return false
      }

      seen.add(item.id)
      return true
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
}

export default function AstrologyExperience({
  customerEmail,
  customerName,
  customerMetadata,
}: {
  customerEmail: string
  customerName?: string
  customerMetadata?: Record<string, unknown>
}) {
  const [activeTab, setActiveTab] = useState<AstrologyTab>("muhurth")
  const [astrologyTheme, setAstrologyTheme] = useState<AstrologyTheme>("day")
  const [language, setLanguage] = useState<AstrologyLanguage>("english")
  const [languageReady, setLanguageReady] = useState(false)
  const [panchangSystemId, setPanchangSystemId] = useState("lahiri-mean")
  const [cityId, setCityId] = useState("")
  const [date, setDate] = useState(() => getTodayDateString())
  const [question, setQuestion] = useState("")
  const [prashnaDate, setPrashnaDate] = useState(() => getTodayDateString())
  const [prashnaTime, setPrashnaTime] = useState(() => getCurrentLocalTimeString())
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
  const [savedKundlis, setSavedKundlis] = useState<SavedKundliProfile[]>([])
  const [savedKundliMessage, setSavedKundliMessage] = useState("")
  const [savedMetadata, setSavedMetadata] = useState<Record<string, unknown>>(
    customerMetadata || {}
  )
  const [syncingSavedKundlis, startSavedKundliSync] = useTransition()
  const [aiWallet, setAiWallet] = useState<AiWallet | null>(null)
  const [aiQuota, setAiQuota] = useState<AiQuota | null>(null)
  const [aiPacks, setAiPacks] = useState<AiCreditPack[]>([])
  const [kundliForm, setKundliForm] = useState({
    name: customerName || "",
    gender: "",
    birthDate: "",
    birthTime: "",
    cityId: "",
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

  useEffect(() => {
    if (prashna) {
      setLoadingPrashna(false)
    }
  }, [prashna])

  useEffect(() => {
    if (lostItemResult) {
      setLoadingLostItem(false)
    }
  }, [lostItemResult])

  useEffect(() => {
    if (kundliResult) {
      setLoadingKundli(false)
    }
  }, [kundliResult])

  useEffect(() => {
    if (matchmakingResult) {
      setLoadingMatchmaking(false)
    }
  }, [matchmakingResult])

  const city = getCityById(cityId || "rewa")
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

    const savedCity = window.localStorage.getItem(ASTROLOGY_CITY_KEY) || ""

    if (savedCity && ASTROLOGY_CITIES.some((city) => city.id === savedCity)) {
      setCityId(savedCity)
      setKundliForm((current) => ({
        ...current,
        cityId: current.cityId || savedCity,
      }))
      setMatchmakingForm((current) => ({
        girl: { ...current.girl, cityId: current.girl.cityId || savedCity },
        boy: { ...current.boy, cityId: current.boy.cityId || savedCity },
      }))
    }

    setLanguageReady(true)
  }, [])

  const rememberAstrologyCity = (nextCityId: string) => {
    setCityId(nextCityId)
    if (nextCityId) {
      safeSetLocalStorage(ASTROLOGY_CITY_KEY, nextCityId, nextCityId)
    }
  }

  useEffect(() => {
    document.body.classList.toggle(
      "astrology-night-mode",
      astrologyTheme === "night"
    )
    document.body.classList.toggle(
      "astrology-day-mode",
      astrologyTheme === "day"
    )
    safeSetLocalStorage(THEME_KEY, astrologyTheme, astrologyTheme)

    return () => {
      document.body.classList.remove("astrology-night-mode")
      document.body.classList.remove("astrology-day-mode")
    }
  }, [astrologyTheme])

  useEffect(() => {
    if (!languageReady) {
      return
    }

    safeSetLocalStorage(LANGUAGE_KEY, language, language)
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
    const localHistory = parseLocalHistory(window.localStorage.getItem(HISTORY_KEY))

    if (localHistory.length) {
      setHistory(mergeHistory(localHistory).slice(0, 50))
    }

    const localSaved = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(SAVED_KUNDLI_KEY) || "[]")
      } catch {
        return []
      }
    })()
    const metadataSaved = normalizeSavedKundliProfiles(
      customerMetadata?.saved_kundlis,
      customerMetadata?.family_members,
      localSaved
    )

    if (metadataSaved.length) {
      setSavedKundlis(metadataSaved)
      safeSetLocalStorage(
        SAVED_KUNDLI_KEY,
        serializeLocalSavedKundlis(metadataSaved),
        serializeLocalSavedKundliDetails(metadataSaved)
      )
    }

    fetch("/api/astrology/history", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const remoteItems = Array.isArray(data?.items)
          ? data.items
              .map((item: unknown) => normalizeUsageHistory(item))
              .filter(Boolean)
          : []

        if (remoteItems.length) {
          setHistory((current) =>
            mergeHistory([...remoteItems, ...current]).slice(0, 50)
          )
        }
      })
      .catch(() => null)
  }, [customerMetadata])

  const rememberHistory = (
    item: AstrologyHistoryItem,
    options: { persistLocal?: boolean } = {}
  ) => {
    setHistory((current) => {
      const nextItem = {
        ...item,
        synced: !options.persistLocal,
      }
      const next = mergeHistory([nextItem, ...current]).slice(0, 50)
      const localItems = next.filter((historyItem) => historyItem.synced === false)

      safeSetLocalStorage(HISTORY_KEY, serializeLocalHistory(localItems), "[]")

      return next
    })
  }

  const syncSavedKundlis = (
    nextProfiles: SavedKundliProfile[],
    message = "Saved Kundli library updated."
  ) => {
    setSavedKundlis(nextProfiles)
    setSavedKundliMessage(message)
    safeSetLocalStorage(
      SAVED_KUNDLI_KEY,
      serializeLocalSavedKundlis(nextProfiles),
      serializeLocalSavedKundliDetails(nextProfiles)
    )

    const compactProfiles = nextProfiles.map(({ lastResult, ...profile }) => ({
      ...profile,
      has_saved_chart: Boolean(lastResult?.chart),
    }))
    const legacyMembers = nextProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      birth_date: profile.birthDate,
      birth_time: profile.birthTime,
      birth_place: profile.cityLabel || cityLabel(getCityById(profile.cityId)),
    }))

    startSavedKundliSync(async () => {
      try {
        const nextMetadata = {
          ...(savedMetadata || {}),
          saved_kundlis: compactProfiles,
          family_members: legacyMembers,
        }
        await updateCustomer({ metadata: nextMetadata } as any)
        setSavedMetadata(nextMetadata)
      } catch {
        setSavedKundliMessage(
          "Saved on this device. Account sync will retry the next time you save."
        )
      }
    })
  }

  const profileToKundliForm = (profile: SavedKundliProfile) => ({
    name: profile.name,
    gender: profile.gender || "",
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    cityId: profile.cityId || "rewa",
    subQuestions:
      profile.subQuestions?.length === 3
        ? profile.subQuestions
        : [profile.subQuestions?.[0] || "", profile.subQuestions?.[1] || "", profile.subQuestions?.[2] || ""],
  })

  const findSavedKundliResultInHistory = (profile: SavedKundliProfile) => {
    const profileKey = `${profile.name}-${profile.birthDate}-${profile.birthTime}-${profile.cityId}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")

    const matched = history.find((item) => {
      if (item.type !== "Kundli") {
        return false
      }

      const itemProfile = getKundliHistoryProfile(item)
      const input = getHistoryInputRecord(item)
      const itemCityId =
        historyText(input.cityId) ||
        findCityIdFromLabel(historyText(itemProfile.city, input.city)) ||
        profile.cityId
      const itemKey = `${historyText(itemProfile.name, input.name)}-${historyText(
        itemProfile.birth_date,
        input.birthDate,
        input.birth_date
      )}-${historyText(
        itemProfile.birth_time,
        input.birthTime,
        input.birth_time
      )}-${itemCityId}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
      const response = getHistoryResponseRecord(item)

      return itemKey === profileKey && Boolean(response.chart && response.analysis)
    })

    return matched?.response as KundliResult | undefined
  }

  const saveKundliProfile = (
    result?: KundliResult | null,
    options: { quiet?: boolean; form?: typeof kundliForm } = {}
  ) => {
    const sourceForm = options.form || kundliForm
    const resultProfile = result?.profile || {}
    const formName = historyText(resultProfile.name, sourceForm.name)
    const formBirthDate = historyText(resultProfile.birth_date, sourceForm.birthDate)
    const formBirthTime = historyText(resultProfile.birth_time, sourceForm.birthTime)
    const formCityId =
      findCityIdFromLabel(historyText(resultProfile.city)) ||
      sourceForm.cityId ||
      "rewa"

    if (!formName || !formBirthDate || !formBirthTime) {
      setSavedKundliMessage("Add name, birth date and birth time before saving.")
      return null
    }

    const now = new Date().toISOString()
    const id = `${formName}-${formBirthDate}-${formBirthTime}-${formCityId}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    const nextProfile: SavedKundliProfile = {
      id,
      name: formName,
      gender: historyText(resultProfile.gender, sourceForm.gender),
      birthDate: formBirthDate,
      birthTime: formBirthTime,
      cityId: formCityId,
      cityLabel: historyText(resultProfile.city, cityLabel(getCityById(formCityId))),
      panchangSystemId: historyText(
        resultProfile.panchang_system_id,
        panchangSystemId
      ),
      language,
      subQuestions: sourceForm.subQuestions,
      savedAt:
        savedKundlis.find((profile) => profile.id === id)?.savedAt || now,
      updatedAt: now,
      lastResult: result?.chart
        ? result
        : savedKundlis.find((profile) => profile.id === id)?.lastResult,
    }
    const nextProfiles = [
      nextProfile,
      ...savedKundlis.filter((profile) => profile.id !== id),
    ].slice(0, 40)

    syncSavedKundlis(
      nextProfiles,
      options.quiet
        ? "Kundli auto-saved for future viewing."
        : result?.chart
        ? "Kundli saved. You can reopen this chart without AI."
        : "Birth details saved. Generate AI when you want the full reading."
    )

    if (nextProfile.lastResult?.chart) {
      rememberHistory(
        {
          id: `kundli-${id}`,
          type: "Kundli",
          title: `${nextProfile.name} Kundli`,
          createdAt: now,
          summary: buildKundliSummary(nextProfile.lastResult),
          input: {
            ...sourceForm,
            cityId: formCityId,
            language,
            panchangSystemId,
          },
          response: nextProfile.lastResult,
        },
        { persistLocal: true }
      )
    }

    return nextProfile
  }

  const applySavedKundliProfile = (profile: SavedKundliProfile) => {
    setKundliForm(profileToKundliForm(profile))

    if (profile.panchangSystemId) {
      setPanchangSystemId(profile.panchangSystemId)
    }

    if (profile.language) {
      setLanguage(profile.language)
    }

    setSavedKundliMessage(`${profile.name} details loaded.`)
  }

  const openSavedKundliProfile = (profile: SavedKundliProfile) => {
    applySavedKundliProfile(profile)
    const reusableResult =
      profile.lastResult?.chart
        ? profile.lastResult
        : findSavedKundliResultInHistory(profile)

    if (reusableResult?.chart) {
      setKundliResult(reusableResult)
      setActiveTab("kundli")
      setSavedKundliMessage(`${profile.name} chart opened without AI usage.`)
      return
    }

    setSavedKundliMessage("This profile has details saved. Generate once to save the chart.")
  }

  const removeSavedKundliProfile = (profile: SavedKundliProfile) => {
    syncSavedKundlis(
      savedKundlis.filter((item) => item.id !== profile.id),
      `${profile.name} removed from saved Kundlis.`
    )
  }

  const generateSavedKundliProfile = (profile: SavedKundliProfile) => {
    applySavedKundliProfile(profile)
    generateKundli(profileToKundliForm(profile))
  }

  const askPrashna = async () => {
    if (loadingPrashna) {
      return
    }

    setLoadingPrashna(true)
    setPrashna(null)

    try {
      const response = await fetch("/api/astrology/prashna", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          cityId,
          questionDate: prashnaDate,
          questionTime: prashnaTime,
          language,
          panchangSystemId,
        }),
        cache: "no-store",
      }).catch(() => null)
      const data = (await response?.json().catch(() => null)) as PrashnaResult | null

      if (!data?.answer) {
        const retryHint = data?.retryable
          ? " This looks temporary; wait a few seconds and try again."
          : ""
        setPrashna({
          message:
            data?.message ||
            `Prashna AI could not answer right now. Please try again.${retryHint}`,
          retryable: data?.retryable,
        })
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
          input: {
            question,
            cityId,
            questionDate: prashnaDate,
            questionTime: prashnaTime,
            language,
            panchangSystemId,
          },
          response: result,
        }, {
          persistLocal: !result.usage_synced,
        })
      }

      refreshWallet()
    } catch (error) {
      console.error("Prashna generation failed", error)
      setPrashna({
        message: "Prashna failed unexpectedly on this browser. Please refresh once and try again.",
        retryable: true,
      })
    } finally {
      setLoadingPrashna(false)
    }
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

  const generateKundli = async (
    overrideForm?: typeof kundliForm
  ) => {
    if (loadingKundli) {
      return
    }

    const requestForm = overrideForm || kundliForm

    if (overrideForm) {
      setKundliForm(overrideForm)
    }

    setLoadingKundli(true)
    setKundliProgress(0)
    setKundliResult(null)

    let displayedProgress = 0
    const progressInterval = setInterval(() => {
      displayedProgress = Math.min(94, displayedProgress + 1)
      setKundliProgress(displayedProgress)
    }, 800)

    const finishProgress = async () => {
      clearInterval(progressInterval)
      const start = displayedProgress
      const steps = 16

      for (let step = 1; step <= steps; step += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 45))
        displayedProgress = start + ((100 - start) * step) / steps
        setKundliProgress(displayedProgress)
      }
    }

    try {
      const response = await fetch("/api/astrology/kundli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestForm,
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

      await finishProgress()
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

      if (result.chart && (result.analysis?.summary || result.analysis?.prediction_table?.length) && !result.message) {
        rememberHistory({
          id: `kundli-${Date.now()}`,
          type: "Kundli",
          title: `${result.profile?.name || requestForm.name || "Generated"} Kundli`,
          createdAt: new Date().toISOString(),
          summary: buildKundliSummary(result),
          input: {
            ...requestForm,
            language,
            panchangSystemId,
          },
          response: result,
        }, {
          persistLocal: true,
        })
      }

      if (result.chart) {
        saveKundliProfile(result, { quiet: true, form: requestForm })
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
    if (loadingMatchmaking) {
      return
    }

    setLoadingMatchmaking(true)
    setMatchmakingResult(null)

    try {
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
      const result = normalizeMatchmakingResultForUi(
        data || ({
          message:
            "Matchmaking AI could not generate the compatibility reading right now.",
          retryable: true,
        } satisfies MatchmakingResult)
      )

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

      refreshWallet()
    } catch (error) {
      console.error("Matchmaking generation failed", error)
      setMatchmakingResult({
        message:
          "Matchmaking failed unexpectedly on this browser. Please refresh once and try again.",
        retryable: true,
      })
    } finally {
      setLoadingMatchmaking(false)
    }
  }

  const selectHistoryItem = (item: AstrologyHistoryItem) => {
    if (item.type === "Matchmaking") {
      setMatchmakingResult(normalizeMatchmakingResultForUi(item.response))
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
      const profile = getKundliHistoryProfile(item)
      const input = getHistoryInputRecord(item)
      const responseRecord = getHistoryResponseRecord(item)

      if (responseRecord.chart && responseRecord.analysis) {
        setKundliResult(result)
      } else {
        setKundliResult(null)
      }

      const restoredCityId =
        historyText(input.cityId) ||
        findCityIdFromLabel(historyText(profile.city, input.city))
      const restoredPanchangId = historyText(
        profile.panchang_system_id,
        input.panchangSystemId,
        input.panchang_system_id
      )
      const restoredLanguage = historyText(profile.language, input.language)
      const restoredQuestions = historyQuestionArray(
        profile.sub_questions,
        profile.subQuestions,
        input.subQuestions,
        input.sub_questions
      )

      setKundliForm((current) => ({
        ...current,
        name: historyText(profile.name, input.name, current.name),
        gender: historyText(profile.gender, input.gender, current.gender),
        birthDate: historyText(
          profile.birth_date,
          input.birthDate,
          input.birth_date,
          current.birthDate
        ),
        birthTime: historyText(
          profile.birth_time,
          input.birthTime,
          input.birth_time,
          current.birthTime
        ),
        cityId: restoredCityId || current.cityId,
        subQuestions: restoredQuestions.some(Boolean)
          ? restoredQuestions
          : current.subQuestions,
      }))

      if (restoredPanchangId) {
        setPanchangSystemId(restoredPanchangId)
      }

      if (
        restoredLanguage === "english" ||
        restoredLanguage === "hindi" ||
        restoredLanguage === "hinglish"
      ) {
        setLanguage(restoredLanguage)
      }

      setActiveTab("kundli")
      return
    }

    const input = getHistoryInputRecord(item)
    const restoredQuestion = historyText(input.question)
    const restoredCityId = historyText(input.cityId)
    const restoredQuestionDate = historyText(input.questionDate, input.question_date)
    const restoredQuestionTime = historyText(input.questionTime, input.question_time)
    const restoredPanchangId = historyText(
      input.panchangSystemId,
      input.panchang_system_id
    )
    const restoredLanguage = historyText(input.language)

    if (restoredQuestion) {
      setQuestion(restoredQuestion)
    }

    if (restoredCityId) {
      rememberAstrologyCity(restoredCityId)
    }

    if (restoredQuestionDate) {
      setPrashnaDate(restoredQuestionDate)
    }

    if (restoredQuestionTime) {
      setPrashnaTime(restoredQuestionTime)
    }

    if (restoredPanchangId) {
      setPanchangSystemId(restoredPanchangId)
    }

    if (
      restoredLanguage === "english" ||
      restoredLanguage === "hindi" ||
      restoredLanguage === "hinglish"
    ) {
      setLanguage(restoredLanguage)
    }

    setPrashna(item.response as PrashnaResult)
    setActiveTab("prashna")
  }

  const LocationDateControls = ({ showDate = true }: { showDate?: boolean }) => (
    <div className="brand-card grid gap-3 px-4 py-4 small:grid-cols-2">
      <CityPicker label="City" value={cityId} onChange={rememberAstrologyCity} />
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
            className={`relative min-w-0 rounded-[16px] border px-3 py-3 text-left transition ${
              language === option.value
                ? "border-[rgba(212,161,38,0.9)] bg-[linear-gradient(135deg,#0d817e_0%,#123f63_62%,#6f211f_100%)] text-white shadow-[0_12px_26px_rgba(18,63,99,0.24)] ring-2 ring-[rgba(212,161,38,0.42)]"
                : "border-[var(--shreem-border)] bg-white/62 text-[var(--shreem-muted)]"
            }`}
          >
            <span className="flex items-center justify-between gap-2 text-sm font-semibold">
              <span>{option.label}</span>
              {language === option.value && (
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--shreem-gold)] shadow-[0_0_0_4px_rgba(255,255,255,0.16)]"
                />
              )}
            </span>
            <span className={`mt-1 block text-[0.68rem] leading-4 ${language === option.value ? "text-white/82" : ""}`}>
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

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.05em] small:tracking-[0.12em] text-[var(--shreem-gold-deep)]">
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
                  <span className="mt-2 block min-h-[2rem] text-[0.64rem] font-semibold leading-4 text-[var(--shreem-ink)]">
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
                The chart is generated for the question moment and selected
                city. It defaults to now, but you can change the time if the
                question clearly arose earlier. If your question has parts, they
                are answered as first, second, and third.
              </p>
              <div className="mt-5">
                <LocationDateControls showDate={false} />
              </div>
              <div className="mt-3 grid gap-3 rounded-[20px] border border-[var(--shreem-border)] bg-white/52 px-4 py-4 small:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
                    Question date
                  </span>
                  <input
                    type="date"
                    value={prashnaDate}
                    onChange={(event) => setPrashnaDate(event.target.value)}
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-gold-deep)]">
                    Question time
                  </span>
                  <input
                    type="time"
                    value={prashnaTime}
                    onChange={(event) => setPrashnaTime(event.target.value)}
                    className="h-12 rounded-[16px] border border-[var(--shreem-border)] bg-white/80 px-3 text-sm text-[var(--shreem-ink)] outline-none"
                  />
                </label>
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
                disabled={
                  loadingPrashna ||
                  question.trim().length < 8 ||
                  !prashnaDate ||
                  !prashnaTime ||
                  !cityId
                }
                onClick={askPrashna}
                className="mt-4 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45 small:w-auto"
              >
                {loadingPrashna ? "Reading chart..." : "Ask Prashna"}
              </button>
            </div>

            <div className="grid gap-4">
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Result</p>
                {loadingPrashna && !prashna && (
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

                <CityPicker label="Question city" value={cityId} onChange={rememberAstrologyCity} />
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
                    !lostItemForm.lastSeenPlace.trim() ||
                    !cityId
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
                {loadingLostItem && !lostItemResult && (
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
                  onChange={(cityId) => {
                    rememberAstrologyCity(cityId)
                    setKundliForm((current) => ({
                      ...current,
                      cityId,
                    }))
                  }}
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
                <div className="mt-2 grid gap-2 small:grid-cols-[0.72fr_1fr]">
                  <button
                    type="button"
                    disabled={!kundliForm.name || !kundliForm.birthDate || !kundliForm.birthTime || !kundliForm.cityId}
                    onClick={() => saveKundliProfile(null)}
                    className="w-full rounded-full border border-[rgba(13,129,126,0.22)] bg-white px-5 py-3 text-sm font-semibold text-[var(--shreem-accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Save details
                  </button>
                  <button
                    type="button"
                    disabled={
                      loadingKundli ||
                      !kundliForm.birthDate ||
                      !kundliForm.birthTime ||
                      !kundliForm.cityId
                    }
                    onClick={() => generateKundli()}
                    className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {loadingKundli ? "Generating Kundli..." : "Generate Kundli"}
                  </button>
                </div>
                <p className="text-xs leading-5 text-[var(--shreem-muted)]">
                  The generated stone indicators are general. Wear gemstones or
                  start major remedies only after expert review.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <SavedKundliPanel
                profiles={savedKundlis}
                message={savedKundliMessage}
                syncing={syncingSavedKundlis}
                onUse={applySavedKundliProfile}
                onOpen={openSavedKundliProfile}
                onGenerate={generateSavedKundliProfile}
                onRemove={removeSavedKundliProfile}
              />
              <div className="brand-card px-4 py-5 small:px-6">
                <p className="brand-kicker">Generated chart</p>
                {loadingKundli && !kundliResult && (
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
                        onClick={() => generateKundli()}
                        disabled={
                          loadingKundli ||
                          !kundliForm.birthDate ||
                          !kundliForm.birthTime ||
                          !kundliForm.cityId
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
                    <div className="mb-3 flex flex-col gap-2 small:flex-row small:items-center small:justify-end">
                      <button
                        type="button"
                        onClick={() => saveKundliProfile(kundliResult)}
                        className="rounded-full border border-[rgba(13,129,126,0.22)] bg-white px-4 py-2 text-xs font-semibold text-[var(--shreem-accent-dark)]"
                      >
                        Save this Kundli
                      </button>
                    </div>
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
                  onChange={(girl) => {
                    if (girl.cityId) {
                      safeSetLocalStorage(ASTROLOGY_CITY_KEY, girl.cityId, girl.cityId)
                    }
                    setMatchmakingForm((current) => ({ ...current, girl }))
                  }}
                />
                <MatchPersonFields
                  title="Boy"
                  value={matchmakingForm.boy}
                  onChange={(boy) => {
                    if (boy.cityId) {
                      safeSetLocalStorage(ASTROLOGY_CITY_KEY, boy.cityId, boy.cityId)
                    }
                    setMatchmakingForm((current) => ({ ...current, boy }))
                  }}
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
                    !matchmakingForm.girl.cityId ||
                    !matchmakingForm.boy.name ||
                    !matchmakingForm.boy.birthDate ||
                    !matchmakingForm.boy.birthTime ||
                    !matchmakingForm.boy.cityId
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
                {loadingMatchmaking && !matchmakingResult && (
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
                {matchmakingResult?.compatibility &&
                  !matchmakingResult.message &&
                  (Boolean(matchmakingResult.analysis?.summary) ||
                    Boolean(matchmakingResult.analysis?.decision_reason) ||
                    Boolean(matchmakingResult.compatibility?.scores?.length) ||
                    Boolean(matchmakingResult.compatibility?.deep_scores?.length)) && (
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
