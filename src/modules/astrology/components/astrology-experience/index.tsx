"use client"

import {
  ASTROLOGY_CITIES,
  calculateDailyMuhurat,
  getCityById,
  getTodayDateString,
  type MuhurtaSlot,
  type PrashnaChart,
  type PrashnaHouse,
  type PrashnaPlanet,
} from "@lib/util/astrology"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useMemo, useState } from "react"

type PrashnaResult = {
  chart?: PrashnaChart
  answer?: string
  chart_summary?: string
  direct_indication?: string
  house_focus?: string
  key_chart_factors?: string[]
  favorable_timing?: string
  caution?: string
  next_step?: string
  message?: string
}

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

export default function AstrologyExperience() {
  const [cityId, setCityId] = useState("rewa")
  const [date, setDate] = useState(() => getTodayDateString())
  const [question, setQuestion] = useState("")
  const [prashna, setPrashna] = useState<PrashnaResult | null>(null)
  const [loadingPrashna, setLoadingPrashna] = useState(false)
  const city = getCityById(cityId)
  const muhurat = useMemo(
    () => calculateDailyMuhurat({ city, date }),
    [city, date]
  )
  const bestDaySlots = muhurat.daySlots.filter(
    (slot) => slot.quality === "auspicious"
  )

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
      }),
    }).catch(() => null)
    const data = (await response?.json().catch(() => null)) as PrashnaResult | null

    setPrashna(
      data || {
        message: "Prashna AI could not answer right now. Please try again.",
      }
    )
    setLoadingPrashna(false)
  }

  return (
    <div className="grid gap-6 small:gap-8">
      <section className="brand-surface overflow-hidden px-5 py-7 small:px-8 small:py-9">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="brand-kicker">Subh Muhurth</p>
            <h2 className="mt-3 max-w-[13ch] text-[2.3rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
              Today&apos;s auspicious windows
            </h2>
            <p className="mt-4 max-w-[48rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Choose your city and date. Sunrise, sunset, day Choghadiya, night
              Choghadiya, and 30 muhurtas are calculated instantly for that
              place.
            </p>
          </div>

          <div className="brand-card grid gap-3 px-4 py-4">
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
          </div>
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

      <section className="brand-surface px-5 py-6 small:px-8 small:py-8">
        <p className="brand-kicker">48-minute planning</p>
        <h3 className="mt-2 text-[2rem] leading-none text-[var(--shreem-ink)]">
          30 muhurtas from sunrise
        </h3>
        <div className="mt-5 grid gap-2 small:grid-cols-3 xl:grid-cols-5">
          {muhurat.muhurtaSlots.map((slot) => (
            <div
              key={slot.index}
              className="rounded-[16px] border border-[var(--shreem-border)] bg-white/62 px-3 py-3 text-sm"
            >
              <p className="font-semibold text-[var(--shreem-ink)]">
                Muhurta {slot.index}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                {slot.startLabel} - {slot.endLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
        <p className="brand-kicker">Prashna Kundli</p>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="mt-2 max-w-[12ch] text-[2.4rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
              Ask one clear question
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              The chart is generated for the exact moment you ask, using the
              selected city. The AI reads the calculated Vedic Prashna factors
              and keeps the interpretation separate from the chart data.
            </p>
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

          <div className="brand-card px-4 py-5 small:px-6">
            <p className="brand-kicker">Result</p>
            {!prashna && (
              <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                Your answer will appear here with Lagna, Panchang, graha
                positions, house chart, direct indication, timing, caution, and
                next step.
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
        </div>
      </section>

      <section className="brand-surface px-5 py-7 small:px-8 small:py-9">
        <p className="brand-kicker">Astrologer booking</p>
        <h2 className="mt-2 max-w-[15ch] text-[2.35rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
          Speak with Sanjay Kumar Pandey
        </h2>
        <p className="mt-4 max-w-[48rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
          Paid consultations are handled through the same Shreem checkout and
          payment gateway once the two astrology service products are created in
          Medusa.
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
