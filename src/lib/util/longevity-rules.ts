import "server-only"

import fs from "fs"
import path from "path"

import {
  SIGN_LORDS,
  type PrashnaChart,
  type PrashnaPlanet,
} from "./astrology"

export type LongevityRuleProof = {
  id: string
  source: string
  chapter: string
  rule: string
  chart_fact: string
  application: string
  score: number
  polarity: "protective" | "pressure" | "method"
}

export type LongevityAssessment = {
  classification: "strong vitality support" | "mixed/medium support" | "requires expert review"
  confidence: "medium" | "low"
  score: number
  protective_factors: string[]
  pressure_factors: string[]
  maraka_factors: string[]
  rule_proofs: LongevityRuleProof[]
  safety_note: string
}

const MOVABLE_SIGNS = ["Aries", "Cancer", "Libra", "Capricorn"]
const FIXED_SIGNS = ["Taurus", "Leo", "Scorpio", "Aquarius"]
const DUAL_SIGNS = ["Gemini", "Virgo", "Sagittarius", "Pisces"]
const DUSTHANA_HOUSES = [6, 8, 12]
const KENDRA_HOUSES = [1, 4, 7, 10]
const TRIKONA_HOUSES = [1, 5, 9]
const NATURAL_MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"]
const NATURAL_BENEFICS = ["Moon", "Mercury", "Jupiter", "Venus"]
const LONGEVITY_SOURCE =
  "Brihat Parashara Hora Shastra Ch. 43-44 with internal longevity-book rule extraction"

type ExtractedLongevityRule = {
  id?: string
  category?: string
  condition?: string
  effect?: string
  implementation?: string
  confidence?: "high" | "medium" | "low"
}

type ExtractedRuleMatch = {
  id: string
  category: string
  polarity: "protective" | "pressure" | "method"
  score: number
  label: string
}

let extractedRuleCache: ExtractedLongevityRule[] | null = null

const loadExtractedLongevityRules = () => {
  if (extractedRuleCache) return extractedRuleCache

  try {
    const file = path.join(process.cwd(), "data", "longevity-rules.json")
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
    extractedRuleCache = Array.isArray(parsed.rules) ? parsed.rules : []
  } catch {
    extractedRuleCache = []
  }

  return extractedRuleCache
}

const countExtractedRules = (category: string) =>
  loadExtractedLongevityRules().filter((rule) => rule.category === category).length

const normalizeRuleText = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\w\s°/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const DEBILITATION_SIGNS: Record<string, string> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries",
}

const EXALTATION_SIGNS: Record<string, string> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
}

const getPlanet = (chart: PrashnaChart, name?: string) =>
  chart.planets.find((planet) => planet.name === name)

const getHouse = (chart: PrashnaChart, house: number) =>
  chart.houses.find((item) => item.house === house)

const getHouseLord = (chart: PrashnaChart, house: number) =>
  getHouse(chart, house)?.signLord

const getHousePlanets = (chart: PrashnaChart, house: number) =>
  chart.planets.filter((planet) => (planet.bhavaHouse || planet.house) === house)

const dignity = (planet?: PrashnaPlanet) => {
  if (!planet) return "not placed"
  if (EXALTATION_SIGNS[planet.name] === planet.sign) return "exalted"
  if (DEBILITATION_SIGNS[planet.name] === planet.sign) return "debilitated"
  if (SIGN_LORDS[planet.sign] === planet.name) return "own sign"
  return "neutral"
}

const signMode = (sign: string) => {
  if (MOVABLE_SIGNS.includes(sign)) return "movable"
  if (FIXED_SIGNS.includes(sign)) return "fixed"
  if (DUAL_SIGNS.includes(sign)) return "dual"
  return "unknown"
}

const pairLongevityClass = (leftSign?: string, rightSign?: string) => {
  const left = signMode(leftSign || "")
  const right = signMode(rightSign || "")

  if (left === "unknown" || right === "unknown") return "unknown"
  if (left === "movable" && right === "movable") return "long"
  if (
    (left === "fixed" && right === "dual") ||
    (left === "dual" && right === "fixed")
  ) {
    return "long"
  }
  if (
    (left === "movable" && right === "fixed") ||
    (left === "fixed" && right === "movable") ||
    (left === "dual" && right === "dual")
  ) {
    return "medium"
  }
  if (
    (left === "movable" && right === "dual") ||
    (left === "dual" && right === "movable") ||
    (left === "fixed" && right === "fixed")
  ) {
    return "short"
  }

  return "unknown"
}

const hasBeneficSupport = (chart: PrashnaChart, house: number) => {
  const occupants = getHousePlanets(chart, house)
  const received = chart.aspects?.filter((aspect) => aspect.toHouse === house) || []

  return (
    occupants.some((planet) => NATURAL_BENEFICS.includes(planet.name)) ||
    received.some((aspect) => NATURAL_BENEFICS.includes(aspect.fromPlanet))
  )
}

const hasMaleficPressure = (chart: PrashnaChart, house: number) => {
  const occupants = getHousePlanets(chart, house)
  const received = chart.aspects?.filter((aspect) => aspect.toHouse === house) || []

  return (
    occupants.some((planet) => NATURAL_MALEFICS.includes(planet.name)) ||
    received.some((aspect) => NATURAL_MALEFICS.includes(aspect.fromPlanet))
  )
}

const planetSummary = (planet?: PrashnaPlanet) =>
  planet
    ? `${planet.name} in ${planet.sign}, H${planet.bhavaHouse || planet.house}, ${dignity(planet)}`
    : "not found"

const getPlanetHouse = (planet?: PrashnaPlanet) =>
  planet ? planet.bhavaHouse || planet.house : 0

const isBenefic = (planet?: PrashnaPlanet) =>
  Boolean(planet && NATURAL_BENEFICS.includes(planet.name))

const isMalefic = (planet?: PrashnaPlanet) =>
  Boolean(planet && NATURAL_MALEFICS.includes(planet.name))

const isStrong = (planet?: PrashnaPlanet) => {
  const planetDignity = dignity(planet)

  return planetDignity === "own sign" || planetDignity === "exalted"
}

const hasPlanetAspectToHouse = (
  chart: PrashnaChart,
  planetName: string,
  house: number
) =>
  Boolean(
    chart.aspects?.some(
      (aspect) => aspect.fromPlanet === planetName && aspect.toHouse === house
    )
  )

const hasPlanetAspectToPlanet = (
  chart: PrashnaChart,
  fromPlanet: string,
  toPlanet?: PrashnaPlanet
) => {
  const house = getPlanetHouse(toPlanet)

  return Boolean(house && hasPlanetAspectToHouse(chart, fromPlanet, house))
}

const isPlanetJoinedWith = (
  left?: PrashnaPlanet,
  right?: PrashnaPlanet
) => Boolean(left && right && getPlanetHouse(left) === getPlanetHouse(right))

const hasAnyBeneficInHouses = (chart: PrashnaChart, houses: number[]) =>
  chart.planets.some(
    (planet) => NATURAL_BENEFICS.includes(planet.name) && houses.includes(getPlanetHouse(planet))
  )

const hasAnyMaleficInHouse = (chart: PrashnaChart, house: number) =>
  getHousePlanets(chart, house).some((planet) => NATURAL_MALEFICS.includes(planet.name))

const countMaleficHouses = (chart: PrashnaChart, houses: number[]) =>
  houses.filter((house) => hasAnyMaleficInHouse(chart, house)).length

const getActiveDashaLords = (chart: PrashnaChart) =>
  [
    chart.dasha?.mahadasha?.lord,
    chart.dasha?.antardasha?.lord,
    chart.dasha?.pratyantar?.lord,
  ].filter(Boolean) as string[]

const pushRuleMatch = (
  matches: ExtractedRuleMatch[],
  rule: ExtractedLongevityRule,
  match: Omit<ExtractedRuleMatch, "id" | "category">
) => {
  const id = rule.id || `${rule.category}-${matches.length}`

  if (matches.some((item) => item.id === id || item.label === match.label)) {
    return
  }

  matches.push({
    id,
    category: rule.category || "method",
    ...match,
  })
}

const evaluateExtractedRuleEngine = (chart: PrashnaChart) => {
  const matches: ExtractedRuleMatch[] = []
  const rules = loadExtractedLongevityRules()
  const lagnaLord = getPlanet(chart, SIGN_LORDS[chart.ascendant])
  const eighthLordName = getHouseLord(chart, 8)
  const eighthLord = getPlanet(chart, eighthLordName)
  const marakaLords = [getHouseLord(chart, 2), getHouseLord(chart, 7)].filter(Boolean)
  const activeDashaLords = getActiveDashaLords(chart)
  const moon = getPlanet(chart, "Moon")
  const jupiter = getPlanet(chart, "Jupiter")
  const saturn = getPlanet(chart, "Saturn")
  const rahu = getPlanet(chart, "Rahu")
  const ketu = getPlanet(chart, "Ketu")

  rules.forEach((rule) => {
    const condition = normalizeRuleText(rule.condition)
    const effect = normalizeRuleText(rule.effect)
    const implementation = normalizeRuleText(rule.implementation)
    const haystack = `${condition} ${effect} ${implementation}`
    const category = rule.category || ""

    if (!condition || /^(n\/a|general astrological principle)$/.test(condition)) {
      return
    }

    if (
      /jupiter/.test(condition) &&
      /lagna|kendra|trikona/.test(condition) &&
      jupiter &&
      [...KENDRA_HOUSES, ...TRIKONA_HOUSES].includes(getPlanetHouse(jupiter))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: isStrong(jupiter) ? 3 : 2,
        label: "Jupiter protection matched by extracted longevity rules",
      })
    }

    if (
      /lagna lord/.test(condition) &&
      /(occupies lagna|exalted|strong)/.test(condition) &&
      lagnaLord &&
      (getPlanetHouse(lagnaLord) === 1 || isStrong(lagnaLord))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: 2,
        label: "Strong Lagna lord protection matched by extracted longevity rules",
      })
    }

    if (/benefic planet/.test(condition) && /kendra/.test(condition) && hasAnyBeneficInHouses(chart, KENDRA_HOUSES)) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: 1,
        label: "Kendra benefic mitigation matched by extracted longevity rules",
      })
    }

    if (
      /powerful aspect of jupiter/.test(condition) &&
      (hasPlanetAspectToPlanet(chart, "Jupiter", lagnaLord) ||
        marakaLords.some((lord) => hasPlanetAspectToPlanet(chart, "Jupiter", getPlanet(chart, lord))))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: 2,
        label: "Jupiter aspect mitigation on Lagna/Maraka factors matched",
      })
    }

    if (/rahu/.test(condition) && /kendra/.test(condition) && rahu && KENDRA_HOUSES.includes(getPlanetHouse(rahu))) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: 1,
        label: "Rahu Kendra mitigation matched by extracted longevity rules",
      })
    }

    if (
      /ketu/.test(condition) &&
      /3rd|6th|11th|3 6|6 11/.test(condition) &&
      ketu &&
      [3, 6, 11].includes(getPlanetHouse(ketu))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "protective",
        score: 1,
        label: "Ketu upachaya mitigation matched by extracted longevity rules",
      })
    }

    if (
      /moon/.test(condition) &&
      /(ashwini|moola|magha|ashlesha|jyeshtha|revati)/.test(condition) &&
      /(Ashwini|Moola|Magha|Ashlesha|Jyeshtha|Revati)/.test(chart.nakshatra || "")
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "pressure",
        score: -2,
        label: "Moon nakshatra sensitivity matched by extracted longevity rules",
      })
    }

    if (
      /8th lord/.test(condition) &&
      /(6|8|12|houses 6 8 or 12|6th|8th|12th)/.test(condition) &&
      eighthLord &&
      DUSTHANA_HOUSES.includes(getPlanetHouse(eighthLord))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: category === "dasha_timing" ? "method" : "pressure",
        score: category === "dasha_timing" ? 0 : -2,
        label: "8th lord dusthana rule matched by extracted longevity rules",
      })
    }

    if (
      /saturn/.test(condition) &&
      /(lagna|8th house|8th)/.test(condition) &&
      saturn &&
      [1, 8].includes(getPlanetHouse(saturn))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: category === "dasha_timing" ? "method" : "pressure",
        score: category === "dasha_timing" ? 0 : -1,
        label: "Saturn Lagna/8th timing rule matched by extracted longevity rules",
      })
    }

    if (/malefic/.test(condition) && /6th/.test(condition) && /8th/.test(condition) && /12th/.test(condition)) {
      const pressureCount = [6, 8, 12].filter((house) => hasMaleficPressure(chart, house)).length
      const protectedCount = [6, 8, 12].filter((house) => hasBeneficSupport(chart, house)).length

      if (pressureCount >= 2 && protectedCount === 0) {
        pushRuleMatch(matches, rule, {
          polarity: "pressure",
          score: -3,
          label: "Dusthana malefic cluster matched by extracted longevity rules",
        })
      }
    }

    if (/malefics/.test(condition) && /2nd/.test(condition) && /6th/.test(condition) && /8th/.test(condition) && /12th/.test(condition)) {
      if (countMaleficHouses(chart, [2, 6, 8, 12]) >= 3) {
        pushRuleMatch(matches, rule, {
          polarity: "pressure",
          score: -3,
          label: "Maraka/dusthana malefic cluster matched by extracted longevity rules",
        })
      }
    }

    if (/mars/.test(condition) && /(lagna|8th house)/.test(condition)) {
      const mars = getPlanet(chart, "Mars")
      if (mars && [1, 8].includes(getPlanetHouse(mars))) {
        pushRuleMatch(matches, rule, {
          polarity: "pressure",
          score: -2,
          label: "Mars Lagna/8th pressure rule matched by extracted longevity rules",
        })
      }
    }

    if (/moon/.test(condition) && /(7th|8th)/.test(condition) && moon && [7, 8].includes(getPlanetHouse(moon))) {
      pushRuleMatch(matches, rule, {
        polarity: "pressure",
        score: -1,
        label: "Moon 7th/8th sensitivity rule matched by extracted longevity rules",
      })
    }

    if (
      /rahu|ketu/.test(condition) &&
      /(tanu|lagna|yuvati|7th|randhr|8th|vyaya|12th)/.test(condition) &&
      [rahu, ketu].some((node) => node && [1, 7, 8, 12].includes(getPlanetHouse(node)))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "pressure",
        score: -2,
        label: "Node Maraka-house placement matched by extracted longevity rules",
      })
    }

    if (
      /planet/.test(condition) &&
      /conjoins the 8th lord/.test(condition) &&
      eighthLord &&
      chart.planets.some((planet) => planet.name !== eighthLord.name && isPlanetJoinedWith(planet, eighthLord))
    ) {
      pushRuleMatch(matches, rule, {
        polarity: "pressure",
        score: -2,
        label: "Planet joined with 8th lord matched by extracted longevity rules",
      })
    }

    if (/dasha periods of maraka lords/.test(haystack) || /mahadasa of a strong maraka/.test(haystack)) {
      if (activeDashaLords.some((lord) => marakaLords.includes(lord))) {
        pushRuleMatch(matches, rule, {
          polarity: "method",
          score: 0,
          label: "Active dasha touches Maraka lord per extracted dasha-timing rules",
        })
      }
    }

    if (/planets in the 2nd and 7th houses/.test(condition)) {
      const occupied = getHousePlanets(chart, 2).length + getHousePlanets(chart, 7).length
      if (occupied || marakaLords.length) {
        pushRuleMatch(matches, rule, {
          polarity: "method",
          score: 0,
          label: "2nd/7th Maraka audit rule matched by extracted longevity rules",
        })
      }
    }
  })

  return matches
}

const push = (
  proofs: LongevityRuleProof[],
  proof: LongevityRuleProof,
  lists: {
    protective: string[]
    pressure: string[]
    maraka: string[]
  }
) => {
  proofs.push(proof)

  if (proof.polarity === "protective") {
    lists.protective.push(proof.application)
  }
  if (proof.polarity === "pressure") {
    lists.pressure.push(proof.application)
  }
  if (proof.id.includes("maraka")) {
    lists.maraka.push(proof.chart_fact)
  }
}

export const buildLongevityAssessment = (
  chart: PrashnaChart
): LongevityAssessment => {
  const proofs: LongevityRuleProof[] = []
  const lists = { protective: [] as string[], pressure: [] as string[], maraka: [] as string[] }
  let score = 0
  const extractedMarakaRules = countExtractedRules("maraka")
  const extractedTimingRules = countExtractedRules("dasha_timing")
  const extractedProtectionRules = countExtractedRules("protection") + countExtractedRules("mitigation")
  const extractedRuleMatches = evaluateExtractedRuleEngine(chart)
  const extractedScore = extractedRuleMatches.reduce(
    (total, match) => total + match.score,
    0
  )
  const extractedProtectiveMatches = extractedRuleMatches.filter(
    (match) => match.polarity === "protective"
  )
  const extractedPressureMatches = extractedRuleMatches.filter(
    (match) => match.polarity === "pressure"
  )
  const extractedMethodMatches = extractedRuleMatches.filter(
    (match) => match.polarity === "method"
  )
  score += extractedScore

  const lagnaLord = getPlanet(chart, SIGN_LORDS[chart.ascendant])
  const eighthLord = getPlanet(chart, getHouseLord(chart, 8))
  const thirdLord = getPlanet(chart, getHouseLord(chart, 3))
  const saturn = getPlanet(chart, "Saturn")
  const moon = getPlanet(chart, "Moon")
  const jupiter = getPlanet(chart, "Jupiter")

  push(
    proofs,
    {
      id: "longevity.ch43.method-choice",
      source: LONGEVITY_SOURCE,
      chapter: "Chapter 43: Longevity",
      rule: "Longevity is difficult to determine and must be judged through multiple methods; strength of Lagna, Sun and Moon guides method choice.",
      chart_fact: `Lagna ${chart.ascendant}; Lagna lord ${planetSummary(lagnaLord)}; ${planetSummary(getPlanet(chart, "Sun"))}; ${planetSummary(moon)}.`,
      application:
        `This assessment is a classical vitality audit only. It is not a death-date calculation and should be reviewed by an expert astrologer before strong conclusions. Internal longevity-book verification loaded ${extractedMarakaRules} Maraka, ${extractedTimingRules} timing, and ${extractedProtectionRules} protection/mitigation rules.`,
      score: 0,
      polarity: "method",
    },
    lists
  )

  const pairClass = pairLongevityClass(lagnaLord?.sign, eighthLord?.sign)
  if (pairClass !== "unknown") {
    const pairScore = pairClass === "long" ? 3 : pairClass === "medium" ? 1 : -3
    score += pairScore
    push(
      proofs,
      {
        id: "longevity.ch43-lagna-randhra-pair",
        source: LONGEVITY_SOURCE,
        chapter: "Chapter 43: Longevity, verses 33-40",
        rule: "Judge longevity from the pair of Lagna lord and 8th lord by movable, fixed and dual sign relationship; long, medium or short class is inferred only by repeated agreement.",
        chart_fact: `Lagna lord ${planetSummary(lagnaLord)}; 8th lord ${planetSummary(eighthLord)}; pair class ${pairClass}.`,
        application:
          pairClass === "long"
            ? "The Lagna lord and 8th lord pair gives a protective long-life/vitality indication."
            : pairClass === "medium"
              ? "The Lagna lord and 8th lord pair gives medium/mixed vitality support."
              : "The Lagna lord and 8th lord pair is a pressure indication and needs corroboration before any strong judgement.",
        score: pairScore,
        polarity:
          pairClass === "long"
            ? "protective"
            : pairClass === "short"
            ? "pressure"
            : "method",
      },
      lists
    )
  }

  const saturnMoonClass = pairLongevityClass(saturn?.sign, moon?.sign)
  if (saturnMoonClass !== "unknown") {
    const pairScore =
      saturnMoonClass === "long" ? 2 : saturnMoonClass === "medium" ? 1 : -2
    score += pairScore
    push(
      proofs,
      {
        id: "longevity.ch43-saturn-moon-pair",
        source: LONGEVITY_SOURCE,
        chapter: "Chapter 43: Longevity, verses 33-40",
        rule: "Saturn and Moon form one of the three longevity pairs; their sign modes support long, medium or short classification.",
        chart_fact: `${planetSummary(saturn)}; ${planetSummary(moon)}; pair class ${saturnMoonClass}.`,
        application:
          saturnMoonClass === "long"
            ? "The Saturn-Moon pair supports endurance and recovery capacity."
            : saturnMoonClass === "medium"
              ? "The Saturn-Moon pair is mixed and should be weighed with Lagna and 8th house strength."
              : "The Saturn-Moon pair adds pressure; avoid overstatement unless other longevity factors also agree.",
        score: pairScore,
        polarity:
          saturnMoonClass === "long"
            ? "protective"
            : saturnMoonClass === "short"
            ? "pressure"
            : "method",
      },
      lists
    )
  }

  if (lagnaLord) {
    const house = lagnaLord.bhavaHouse || lagnaLord.house
    const planetDignity = dignity(lagnaLord)
    const strong =
      KENDRA_HOUSES.includes(house) ||
      TRIKONA_HOUSES.includes(house) ||
      planetDignity === "own sign" ||
      planetDignity === "exalted"
    const pressured =
      DUSTHANA_HOUSES.includes(house) ||
      planetDignity === "debilitated" ||
      hasMaleficPressure(chart, 1)

    if (strong && !pressured) score += 2
    else if (pressured && !strong) score -= 2
    push(
      proofs,
      {
        id: "longevity.ch43-lagna-lord-strength",
        source: LONGEVITY_SOURCE,
        chapter: "Chapter 43: Longevity, verses 69 and 75-78",
        rule: "Strong Lagna lord in kendra/trikona/exaltation supports long life; Lagna lord in 6th/8th/12th with malefic pressure and no benefic support reduces vitality.",
        chart_fact: `Lagna lord ${planetSummary(lagnaLord)}; benefic support on Lagna ${hasBeneficSupport(chart, 1) ? "yes" : "no"}; malefic pressure on Lagna ${hasMaleficPressure(chart, 1) ? "yes" : "no"}.`,
        application: strong && !pressured
          ? "Lagna lord condition gives direct vitality support."
          : pressured
            ? "Lagna lord condition needs preventive discipline and should be softened if benefic support exists."
            : "Lagna lord gives neutral support; judge through dasha and 8th-house condition.",
        score: strong && !pressured ? 2 : pressured && !strong ? -2 : 0,
        polarity: pressured ? "pressure" : "protective",
      },
      lists
    )
  }

  const eighthHouseHasBenefic = hasBeneficSupport(chart, 8)
  const eighthHousePressure = hasMaleficPressure(chart, 8)
  const eighthLordDignity = dignity(eighthLord)
  if (eighthHouseHasBenefic) score += 2
  if (eighthHousePressure && eighthLordDignity !== "own sign" && eighthLordDignity !== "exalted") {
    score -= 2
  }
  push(
    proofs,
    {
      id: "longevity.ch44-sahaj-randhra-longevity",
      source: LONGEVITY_SOURCE,
      chapter: "Chapter 44: Marak Grahas, verses 2-5",
      rule: "The 3rd and 8th houses are longevity houses; judgement must include their lords, occupants, benefic protection and malefic pressure.",
      chart_fact: `3rd lord ${planetSummary(thirdLord)}; 8th lord ${planetSummary(eighthLord)}; H8 benefic support ${eighthHouseHasBenefic ? "yes" : "no"}; H8 malefic pressure ${eighthHousePressure ? "yes" : "no"}.`,
      application: eighthHouseHasBenefic
        ? "The 8th house has protective support, so Maraka or risk language must be moderated."
        : eighthHousePressure
          ? "The 8th house has pressure; use this only as a preventive watch factor and never as deterministic harm."
          : "The longevity houses need dasha confirmation before timing any strong result.",
      score: eighthHouseHasBenefic ? 2 : eighthHousePressure ? -2 : 0,
      polarity: eighthHouseHasBenefic ? "protective" : "pressure",
    },
    lists
  )

  ;[2, 7].forEach((house) => {
    const lord = getPlanet(chart, getHouseLord(chart, house))
    const occupants = getHousePlanets(chart, house)
    const maleficOccupants = occupants.filter((planet) =>
      NATURAL_MALEFICS.includes(planet.name)
    )
    const houseScore = house === 2 ? -2 : -1
    score += maleficOccupants.length ? houseScore : 0
    push(
      proofs,
      {
        id: `longevity.ch44-maraka-house-${house}`,
        source: LONGEVITY_SOURCE,
        chapter: "Chapter 44: Marak Grahas, verses 2-5 and 15-21",
        rule: "2nd and 7th are Maraka houses; their lords, malefic occupants and planets joined with their lords become Maraka factors, but results depend on longevity class and dasha.",
        chart_fact: `H${house} lord ${planetSummary(lord)}; occupants ${occupants.map((planet) => planet.name).join(", ") || "none"}; malefic occupants ${maleficOccupants.map((planet) => planet.name).join(", ") || "none"}.`,
        application:
          "Keep this as a technical Maraka audit. Show customer-facing prevention only when active dasha and multiple chart factors agree.",
        score: maleficOccupants.length ? houseScore : 0,
        polarity: "pressure",
      },
      lists
    )
  })

  if (
    jupiter &&
    [1, 7].includes(jupiter.bhavaHouse || jupiter.house) &&
    hasBeneficSupport(chart, jupiter.bhavaHouse || jupiter.house)
  ) {
    score += 2
    push(
      proofs,
      {
        id: "longevity.ch43-jupiter-class-increase",
        source: LONGEVITY_SOURCE,
        chapter: "Chapter 43: Longevity, verses 48-50",
        rule: "Jupiter in Lagna or 7th with benefic association/aspect can raise longevity class.",
        chart_fact: `${planetSummary(jupiter)} with benefic support ${hasBeneficSupport(chart, jupiter.bhavaHouse || jupiter.house) ? "yes" : "no"}.`,
        application:
          "Jupiter gives a protective class-increase indication, especially for recovery, counsel and timely remedies.",
        score: 2,
        polarity: "protective",
      },
      lists
    )
  }

  if (saturn) {
    const saturnDignity = dignity(saturn)
    const saturnHouse = saturn.bhavaHouse || saturn.house
    const saturnPressure =
      saturnDignity === "debilitated" ||
      DUSTHANA_HOUSES.includes(saturnHouse) ||
      hasMaleficPressure(chart, saturnHouse)

    if (saturnPressure) {
      score -= 1
      push(
        proofs,
        {
          id: "longevity.ch43-saturn-class-check",
          source: LONGEVITY_SOURCE,
          chapter: "Chapter 43: Longevity, verses 47 and 49-50",
          rule: "Saturn as a contributor can lower longevity class unless protected by own/exalted dignity or specific mitigating factors.",
          chart_fact: `${planetSummary(saturn)}; malefic pressure on its house ${hasMaleficPressure(chart, saturnHouse) ? "yes" : "no"}.`,
          application:
            "Saturn adds discipline and prevention demand. This should become routine, screening, sleep and safe-travel guidance rather than fatalistic wording.",
          score: -1,
          polarity: "pressure",
        },
        lists
      )
    }
  }

  if (extractedProtectiveMatches.length) {
    lists.protective.push(
      `Classical rule engine matched ${extractedProtectiveMatches.length} protection/mitigation condition(s): ${extractedProtectiveMatches
        .slice(0, 3)
        .map((match) => match.label)
        .join("; ")}.`
    )
  }

  if (extractedPressureMatches.length) {
    lists.pressure.push(
      `Classical rule engine matched ${extractedPressureMatches.length} pressure condition(s): ${extractedPressureMatches
        .slice(0, 3)
        .map((match) => match.label)
        .join("; ")}.`
    )
  }

  if (extractedMethodMatches.length) {
    lists.maraka.push(
      `Timing engine matched ${extractedMethodMatches.length} Maraka/dasha audit condition(s); customer timing remains filtered through the high-confidence window scanner.`
    )
  }

  const classification =
    score >= 4
      ? "strong vitality support"
      : score <= -6
        ? "requires expert review"
        : "mixed/medium support"

  return {
    classification,
    confidence: "medium",
    score,
    protective_factors: Array.from(new Set(lists.protective)).slice(0, 6),
    pressure_factors: Array.from(new Set(lists.pressure)).slice(0, 6),
    maraka_factors: Array.from(new Set(lists.maraka)).slice(0, 6),
    rule_proofs: proofs.sort((left, right) => Math.abs(right.score) - Math.abs(left.score)),
    safety_note:
      "Classical longevity rules are for astrologer review and preventive discipline only. Shreem must not show a death date, deterministic harm, or named disease prediction from this layer.",
  }
}
