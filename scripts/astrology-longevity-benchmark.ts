import { buildDetailedPrashnaChart } from "../src/lib/util/vedic-astrology"
import { buildLongevityAssessment } from "../src/lib/util/longevity-rules"
import { SIGN_LORDS, type AstrologyCity, type PrashnaChart } from "../src/lib/util/astrology"

type BenchmarkCase = {
  name: string
  birthDate: string
  birthTime: string
  city: AstrologyCity
  eventDate?: string
  eventLabel: string
  expected: "severe_health" | "sudden_death" | "long_lived_control" | "severe_survival"
  confidence: "high" | "medium" | "low"
  notes: string
}

const city = (
  id: string,
  name: string,
  region: string,
  latitude: number,
  longitude: number,
  utcOffsetHours: number,
  timeZone: string
): AstrologyCity => ({
  id,
  name,
  region,
  latitude,
  longitude,
  timeZone,
  utcOffsetHours,
})

const CASES: BenchmarkCase[] = [
  {
    name: "Yuvraj Singh",
    birthDate: "1981-12-12",
    birthTime: "21:45",
    city: city("chandigarh-test", "Chandigarh", "India", 30.7333, 76.7794, 5.5, "Asia/Kolkata"),
    eventDate: "2011-11-01",
    eventLabel: "Cancer treatment/diagnosis period, public after 2011 World Cup",
    expected: "severe_survival",
    confidence: "medium",
    notes: "Birth time differs by source; AstroSage gives 21:45, Astrodatabank commonly lists noon.",
  },
  {
    name: "Steve Jobs",
    birthDate: "1955-02-24",
    birthTime: "19:15",
    city: city("san-francisco-test", "San Francisco", "California, USA", 37.7749, -122.4194, -8, "America/Los_Angeles"),
    eventDate: "2003-10-01",
    eventLabel: "Pancreatic neuroendocrine tumor diagnosis year",
    expected: "severe_health",
    confidence: "high",
    notes: "Birth data and cancer timeline are well documented in Astrodatabank/news sources.",
  },
  {
    name: "Patrick Swayze",
    birthDate: "1952-08-18",
    birthTime: "08:10",
    city: city("houston-test", "Houston", "Texas, USA", 29.7604, -95.3698, -5, "America/Chicago"),
    eventDate: "2008-01-15",
    eventLabel: "Pancreatic cancer diagnosis",
    expected: "severe_health",
    confidence: "high",
    notes: "Rodden-rated public birth time; cancer diagnosis date reported as January 2008.",
  },
  {
    name: "Audrey Hepburn",
    birthDate: "1929-05-04",
    birthTime: "03:00",
    city: city("ixelles-test", "Ixelles", "Belgium", 50.8333, 4.3667, 1, "Europe/Brussels"),
    eventDate: "1993-01-20",
    eventLabel: "Death from appendiceal/intestinal cancer",
    expected: "severe_health",
    confidence: "high",
    notes: "AA-rated birth data in multiple public astrology databases.",
  },
  {
    name: "Lance Armstrong",
    birthDate: "1971-09-18",
    birthTime: "12:00",
    city: city("plano-test", "Plano", "Texas, USA", 33.0198, -96.6989, -5, "America/Chicago"),
    eventDate: "1996-10-02",
    eventLabel: "Advanced testicular cancer diagnosis",
    expected: "severe_survival",
    confidence: "low",
    notes: "Noon/dirty birth data; included only as a low-confidence stress test.",
  },
  {
    name: "Mahatma Gandhi",
    birthDate: "1869-10-02",
    birthTime: "08:36",
    city: city("porbandar-test", "Porbandar", "India", 21.6417, 69.6293, 5.5, "Asia/Kolkata"),
    eventDate: "1948-01-30",
    eventLabel: "Assassination",
    expected: "sudden_death",
    confidence: "medium",
    notes: "Birth time varies slightly by source; event date is exact.",
  },
  {
    name: "John F. Kennedy",
    birthDate: "1917-05-29",
    birthTime: "15:00",
    city: city("brookline-test", "Brookline", "Massachusetts, USA", 42.3318, -71.1212, -5, "America/New_York"),
    eventDate: "1963-11-22",
    eventLabel: "Assassination",
    expected: "sudden_death",
    confidence: "high",
    notes: "Public A/AA-style birth time appears consistently as 15:00.",
  },
  {
    name: "Princess Diana",
    birthDate: "1961-07-01",
    birthTime: "19:45",
    city: city("sandringham-test", "Sandringham", "England", 52.8296, 0.5147, 1, "Europe/London"),
    eventDate: "1997-08-31",
    eventLabel: "Fatal car crash",
    expected: "sudden_death",
    confidence: "medium",
    notes: "The popular 19:45 chart is disputed by some astrologers, so this is medium confidence.",
  },
  {
    name: "Indira Gandhi",
    birthDate: "1917-11-19",
    birthTime: "23:11",
    city: city("allahabad-test", "Allahabad", "India", 25.4358, 81.8463, 5.5, "Asia/Kolkata"),
    eventDate: "1984-10-31",
    eventLabel: "Assassination",
    expected: "sudden_death",
    confidence: "high",
    notes: "Astrodatabank lists 23:11 at Allahabad.",
  },
  {
    name: "Amitabh Bachchan",
    birthDate: "1942-10-11",
    birthTime: "16:00",
    city: city("allahabad-test", "Allahabad", "India", 25.4358, 81.8463, 5.5, "Asia/Kolkata"),
    eventDate: "1982-07-26",
    eventLabel: "Near-fatal Coolie accident, survived and long-lived",
    expected: "severe_survival",
    confidence: "medium",
    notes: "AstroSage/Indastro commonly use 16:00; other sources differ.",
  },
  {
    name: "Rekha",
    birthDate: "1954-10-10",
    birthTime: "03:00",
    city: city("chennai-test", "Chennai", "India", 13.0827, 80.2707, 5.5, "Asia/Kolkata"),
    eventLabel: "Long-lived public control; major relationship turbulence but no early death",
    expected: "long_lived_control",
    confidence: "low",
    notes: "Birth time is disputed; included as low-confidence control only.",
  },
]

const localDate = (date: string, time: string, offsetHours: number) => {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetHours * 60 * 60 * 1000)
}

const signLord = (chart: PrashnaChart, house: number) =>
  chart.houses.find((item) => item.house === house)?.signLord || ""

const activeLords = (chart: PrashnaChart) =>
  [chart.dasha?.mahadasha, chart.dasha?.antardasha, chart.dasha?.pratyantar].filter(Boolean)

const planet = (chart: PrashnaChart, name: string) =>
  chart.planets.find((item) => item.name === name)

const isAssociatedWithAny = (
  chart: PrashnaChart,
  planetName: string,
  targetPlanets: string[]
) => {
  if (!targetPlanets.length || targetPlanets.includes(planetName)) return false

  const source = planet(chart, planetName)
  if (!source) return false

  const sourceHouse = source.bhavaHouse || source.house

  return targetPlanets.some((targetName) => {
    const target = planet(chart, targetName)
    if (!target) return false
    const targetHouse = target.bhavaHouse || target.house

    return (
      sourceHouse === targetHouse ||
      Boolean(
        chart.aspects?.some(
          (aspect) =>
            (aspect.fromPlanet === planetName && aspect.toHouse === targetHouse) ||
            (aspect.fromPlanet === targetName && aspect.toHouse === sourceHouse)
        )
      )
    )
  })
}

const getBadhakaHouse = (ascendant: string) => {
  if (["Aries", "Cancer", "Libra", "Capricorn"].includes(ascendant)) return 11
  if (["Taurus", "Leo", "Scorpio", "Aquarius"].includes(ascendant)) return 9
  return 7
}

const roleFor = (chart: PrashnaChart, name: string) => {
  const marakaLords = [signLord(chart, 2), signLord(chart, 7)].filter(Boolean)
  const badhakesh = signLord(chart, getBadhakaHouse(chart.ascendant))
  const dusthanaLords = [6, 8, 12].map((house) => signLord(chart, house)).filter(Boolean)
  const p = planet(chart, name)
  const house = p?.bhavaHouse || p?.house
  const owns = chart.houses.filter((item) => item.signLord === name).map((item) => item.house)
  const roles = [
    marakaLords.includes(name) ? "maraka_lord" : "",
    isAssociatedWithAny(chart, name, marakaLords) ? "associated_maraka_lord" : "",
    badhakesh === name ? "badhakesh" : "",
    badhakesh && isAssociatedWithAny(chart, name, [badhakesh])
      ? "associated_badhakesh"
      : "",
    dusthanaLords.includes(name) ? "dusthana_lord" : "",
    isAssociatedWithAny(chart, name, dusthanaLords)
      ? "associated_dusthana_lord"
      : "",
    house && [6, 8, 12].includes(house) ? "placed_in_dusthana" : "",
    owns.some((owned) => [6, 8, 12].includes(owned)) ? "owns_dusthana" : "",
    ["Rahu", "Ketu"].includes(name) ? "node" : "",
    ["Mars", "Saturn"].includes(name) ? "hard_natural_karaka" : "",
  ].filter(Boolean)

  return roles
}

const markeshEventScore = (chart: PrashnaChart) => {
  let score = 0
  let hasMarakaBadhaka = false
  let hasPressure = false
  const rows = activeLords(chart).map((period) => {
    const roles = roleFor(chart, period!.lord)
    const levelWeight =
      period!.level === "mahadasha" ? 3 : period!.level === "antardasha" ? 2 : 1
    const roleScore = roles.reduce((sum, role) => {
      if (
        role === "maraka_lord" ||
        role === "badhakesh" ||
        role === "associated_maraka_lord" ||
        role === "associated_badhakesh"
      ) return sum + 4
      if (
        role === "dusthana_lord" ||
        role === "placed_in_dusthana" ||
        role === "owns_dusthana" ||
        role === "associated_dusthana_lord"
      ) return sum + 2
      return sum + 1
    }, 0)

    if (
      roles.includes("maraka_lord") ||
      roles.includes("badhakesh") ||
      roles.includes("associated_maraka_lord") ||
      roles.includes("associated_badhakesh")
    ) {
      hasMarakaBadhaka = true
    }
    if (
      roles.some((role) =>
        ["dusthana_lord", "placed_in_dusthana", "owns_dusthana", "node", "hard_natural_karaka"].includes(role)
      )
    ) {
      hasPressure = true
    }

    score += levelWeight + roleScore

    return `${period!.lord} ${period!.level}: ${roles.join(", ") || "no critical role"}`
  })

  return {
    score,
    hasMarakaBadhaka,
    hasPressure,
    hit: hasMarakaBadhaka && hasPressure && score >= 11,
    rows,
  }
}

const expectedNeedsPressure = (expected: BenchmarkCase["expected"]) =>
  expected === "severe_health" ||
  expected === "sudden_death" ||
  expected === "severe_survival"

const run = () => {
  const rows = CASES.map((item) => {
    const birth = localDate(item.birthDate, item.birthTime, item.city.utcOffsetHours)
    const eventDate = item.eventDate ? new Date(`${item.eventDate}T12:00:00.000Z`) : undefined
    const chart = buildDetailedPrashnaChart({
      city: item.city,
      date: birth,
      dashaDate: eventDate,
    })
    const longevity = buildLongevityAssessment(chart)
    const markesh = eventDate ? markeshEventScore(chart) : null
    const pressureExpected = expectedNeedsPressure(item.expected)
    const longevityHit = pressureExpected
      ? longevity.score <= 1 || longevity.pressure_factors.length >= 2
      : longevity.classification !== "requires expert review" && longevity.score >= -2
    const markeshHit = !eventDate ? true : pressureExpected ? markesh!.hit : !markesh!.hit
    const casePassed = item.confidence === "low"
      ? longevityHit
      : longevityHit && markeshHit

    return {
      name: item.name,
      expected: item.expected,
      confidence: item.confidence,
      ascendant: chart.ascendant,
      moon: `${chart.moonSign} ${chart.nakshatra}`,
      longevity: longevity.classification,
      longevityScore: longevity.score,
      longevityHit,
      markeshScore: markesh?.score ?? null,
      markeshHit: markesh?.hit ?? null,
      dashaAtEvent: markesh?.rows.join(" | ") || "control/no event",
      passed: casePassed,
      notes: item.notes,
    }
  })

  const scored = rows.filter((row) => row.confidence !== "low")
  const lowConfidence = rows.filter((row) => row.confidence === "low")
  const longevityAccuracy = rows.filter((row) => row.longevityHit).length / rows.length
  const markeshScored = rows.filter((row) => row.markeshHit !== null && row.confidence !== "low")
  const markeshAccuracy =
    markeshScored.filter((row) => row.markeshHit).length / markeshScored.length
  const strictAccuracy = scored.filter((row) => row.passed).length / scored.length
  const inclusiveAccuracy = rows.filter((row) => row.passed).length / rows.length

  console.table(
    rows.map((row) => ({
      name: row.name,
      expected: row.expected,
      confidence: row.confidence,
      lagna: row.ascendant,
      longevity: `${row.longevity} (${row.longevityScore})`,
      longevityHit: row.longevityHit,
      markeshScore: row.markeshScore,
      markeshHit: row.markeshHit,
      passed: row.passed,
    }))
  )

  console.log(
    JSON.stringify(
      {
        totals: {
          cases: rows.length,
          strictScoredCases: scored.length,
          lowConfidenceCases: lowConfidence.length,
          longevityAccuracy: Math.round(longevityAccuracy * 100),
          markeshAccuracy: Math.round(markeshAccuracy * 100),
          strictHighMediumConfidenceAccuracy: Math.round(strictAccuracy * 100),
          inclusiveAccuracy: Math.round(inclusiveAccuracy * 100),
        },
        rows,
      },
      null,
      2
    )
  )
}

run()
