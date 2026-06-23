import "server-only"

import {
  HOUSE_THEMES,
  SIGN_LORDS,
  type DashaPeriod,
  type PrashnaChart,
  type PrashnaPlanet,
} from "./astrology"
import {
  getAstrologyIntentEvidenceScore,
  retrieveAstrologyKnowledge,
  type AstrologyKnowledgeIntent,
  type RetrievedAstrologyPassage,
} from "./astrology-knowledge"
import type { BphsRuleProof } from "./bphs-rules"

export type KundliEvidenceIntent = AstrologyKnowledgeIntent

export type KundliBphsTrace = {
  intent: KundliEvidenceIntent
  citation: string
  section: string
  matched_chart_fact: string
  confidence: "high" | "medium" | "low"
  reason: string
}

export type KundliDashaEvidence = {
  period: string
  lord: string
  level: DashaPeriod["level"]
  score: number
  prevailing: "supportive" | "mixed" | "caution"
  basis: string
  drishti_basis: string
}

export type KundliGocharEvidence = {
  intent: KundliEvidenceIntent
  transit: string
  applies: boolean
  strength: "strong" | "medium" | "weak"
  basis: string
}

export type KundliEvidencePack = {
  bphs_traces: KundliBphsTrace[]
  dasha_evidence: KundliDashaEvidence[]
  drishti_summary: Array<{
    house: number
    theme: string
    benefic_support: string[]
    pressure: string[]
    basis: string
  }>
  gochar_evidence: KundliGocharEvidence[]
  guardrails: string[]
}

const BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"]
const PRESSURE_PLANETS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"]
const DUSTHANA_HOUSES = [6, 8, 12]
const SUPPORTIVE_HOUSES = [1, 2, 5, 9, 10, 11]

const INTENT_HOUSES: Record<KundliEvidenceIntent, number[]> = {
  career: [10, 6, 3, 9, 11],
  wealth: [2, 5, 9, 10, 11],
  health: [1, 6, 8, 12],
  relationship: [2, 5, 7, 8, 11],
  dasha: [1, 5, 6, 8, 9, 10, 11, 12],
  remedy: [1, 5, 6, 8, 9, 12],
  yoga: [1, 4, 5, 7, 9, 10, 11],
  markesh: [2, 7, 8, 12],
}

const INTENT_QUERY: Record<KundliEvidenceIntent, string> = {
  career: "career profession karm bhava 10th house dasha drishti",
  wealth: "wealth dhan labh 2nd 11th house dasha drishti",
  health: "health disease dusthana 6th 8th 12th prevention dasha",
  relationship: "marriage spouse 7th house venus jupiter dasha drishti",
  dasha: "vimshottari mahadasha antardasha pratyantar dasha results",
  remedy: "remedy mantra daan pooja shanti graha dasha",
  yoga: "yoga planetary combination raja dhana gajakesari neechabhanga",
  markesh: "maraka markesh 2nd 7th house dasha prevention",
}

const getPlanet = (chart: PrashnaChart, name?: string) =>
  chart.planets.find((planet) => planet.name === name)

const getHousePlanets = (chart: PrashnaChart, houseNumber: number) =>
  chart.planets.filter(
    (planet) => (planet.bhavaHouse || planet.house) === houseNumber
  )

const getOwnedHouses = (chart: PrashnaChart, planetName: string) =>
  chart.houses
    .filter((house) => house.signLord === planetName)
    .map((house) => house.house)

const getDignity = (planet?: PrashnaPlanet) => {
  if (!planet) return "not placed"

  const exaltationSigns: Record<string, string> = {
    Sun: "Aries",
    Moon: "Taurus",
    Mars: "Capricorn",
    Mercury: "Virgo",
    Jupiter: "Cancer",
    Venus: "Pisces",
    Saturn: "Libra",
  }
  const debilitationSigns: Record<string, string> = {
    Sun: "Libra",
    Moon: "Scorpio",
    Mars: "Cancer",
    Mercury: "Pisces",
    Jupiter: "Capricorn",
    Venus: "Virgo",
    Saturn: "Aries",
  }

  if (exaltationSigns[planet.name] === planet.sign) return "exalted"
  if (debilitationSigns[planet.name] === planet.sign) return "debilitated"
  if (SIGN_LORDS[planet.sign] === planet.name) return "own sign"

  return "neutral"
}

const getPeriodWindow = (period: DashaPeriod) =>
  `${period.startLabel || period.startIso} to ${period.endLabel || period.endIso}`

const getActivePeriods = (chart: PrashnaChart) =>
  [
    chart.dasha?.mahadasha,
    chart.dasha?.antardasha,
    chart.dasha?.pratyantar,
  ].filter(Boolean) as DashaPeriod[]

const scoreDashaPeriod = (chart: PrashnaChart, period: DashaPeriod) => {
  const planet = getPlanet(chart, period.lord)
  const house = planet?.bhavaHouse || planet?.house
  const ownedHouses = getOwnedHouses(chart, period.lord)
  const aspectsToPlacement = house
    ? (chart.aspects || []).filter((aspect) => aspect.toHouse === house)
    : []
  const dignity = getDignity(planet)
  let score =
    period.level === "mahadasha" ? 40 : period.level === "antardasha" ? 28 : 18

  if (dignity === "exalted") score += 14
  if (dignity === "own sign") score += 10
  if (dignity === "debilitated") score -= 12
  if (house && SUPPORTIVE_HOUSES.includes(house)) score += 8
  if (house && DUSTHANA_HOUSES.includes(house)) score -= 8

  ownedHouses.forEach((ownedHouse) => {
    if (SUPPORTIVE_HOUSES.includes(ownedHouse)) score += 5
    if (DUSTHANA_HOUSES.includes(ownedHouse)) score -= 5
    if ([2, 7].includes(ownedHouse)) score -= 4
  })

  aspectsToPlacement.forEach((aspect) => {
    if (BENEFICS.includes(aspect.fromPlanet)) score += 3
    if (PRESSURE_PLANETS.includes(aspect.fromPlanet)) score -= 3
  })

  return {
    score,
    planet,
    house,
    ownedHouses,
    aspectsToPlacement,
    dignity,
  }
}

const buildDashaEvidence = (chart: PrashnaChart): KundliDashaEvidence[] =>
  getActivePeriods(chart).map((period) => {
    const scored = scoreDashaPeriod(chart, period)
    const prevailing =
      scored.score >= 50 ? "supportive" : scored.score >= 32 ? "mixed" : "caution"
    const drishtiBasis = scored.aspectsToPlacement.length
      ? `Receives drishti from ${scored.aspectsToPlacement
          .map((aspect) => aspect.fromPlanet)
          .join(", ")}.`
      : "No major graha drishti to the dasha lord's delivery house."

    return {
      period: `${period.lord} ${period.level} (${getPeriodWindow(period)})`,
      lord: period.lord,
      level: period.level,
      score: scored.score,
      prevailing,
      basis: `${period.lord} is ${scored.dignity}${
        scored.house ? ` in bhava ${scored.house}` : ""
      }, owns ${scored.ownedHouses.join(", ") || "no houses"}, and ${
        scored.planet?.bhavaImpactPercent
          ? `has ${scored.planet.bhavaImpactPercent}% bhava impact`
          : "has no measured bhava impact"
      }.`,
      drishti_basis: drishtiBasis,
    }
  })

const buildDrishtiSummary = (chart: PrashnaChart) =>
  chart.houses.map((house) => {
    const aspects = (chart.aspects || []).filter(
      (aspect) => aspect.toHouse === house.house
    )
    const beneficSupport = aspects
      .filter((aspect) => BENEFICS.includes(aspect.fromPlanet))
      .map((aspect) => aspect.fromPlanet)
    const pressure = aspects
      .filter((aspect) => PRESSURE_PLANETS.includes(aspect.fromPlanet))
      .map((aspect) => aspect.fromPlanet)
    const placed = getHousePlanets(chart, house.house).map((planet) => planet.name)

    return {
      house: house.house,
      theme: house.theme || HOUSE_THEMES[house.house - 1] || "life area",
      benefic_support: beneficSupport,
      pressure,
      basis: `H${house.house} ${house.sign}, lord ${house.signLord}; placed ${
        placed.join(", ") || "none"
      }; drishti from ${aspects.map((aspect) => aspect.fromPlanet).join(", ") || "none"}.`,
    }
  })

const getSignDistance = (fromSign: string, toSign: string) => {
  const signs = [
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
  const from = Math.max(signs.indexOf(fromSign), 0)
  const to = Math.max(signs.indexOf(toSign), 0)

  return ((to - from + 12) % 12) + 1
}

const getEnvGocharSign = (planet: string, fallback: string) =>
  process.env[`ASTROLOGY_GOCHAR_${planet.toUpperCase()}_SIGN`] || fallback

const buildGocharEvidence = (
  chart: PrashnaChart,
  dashaEvidence: KundliDashaEvidence[]
): KundliGocharEvidence[] => {
  const transits = [
    { planet: "Saturn", sign: getEnvGocharSign("SATURN", "Pisces") },
    { planet: "Jupiter", sign: getEnvGocharSign("JUPITER", "Cancer") },
    { planet: "Rahu", sign: getEnvGocharSign("RAHU", "Aquarius") },
    { planet: "Ketu", sign: getEnvGocharSign("KETU", "Leo") },
  ]
  const activeLords = new Set(dashaEvidence.map((item) => item.lord))

  return (Object.keys(INTENT_HOUSES) as KundliEvidenceIntent[]).flatMap((intent) =>
    transits.map((transit) => {
      const fromLagna = getSignDistance(chart.ascendant, transit.sign)
      const fromMoon = getSignDistance(chart.moonSign, transit.sign)
      const natalHouse = chart.houses.find((house) => house.sign === transit.sign)
      const transitHouse = natalHouse?.house || fromLagna
      const intentHouses = INTENT_HOUSES[intent]
      const natalPlanets = chart.planets.filter(
        (planet) => planet.sign === transit.sign
      )
      const sameTheme = intentHouses.some((house) =>
        [fromLagna, fromMoon, transitHouse].includes(house)
      )
      const dashaOverlap =
        activeLords.has(transit.planet) ||
        natalPlanets.some((planet) => activeLords.has(planet.name))
      const applies = Boolean(sameTheme && dashaOverlap)
      const strength = applies ? "strong" : sameTheme ? "medium" : "weak"

      return {
        intent,
        transit: `${transit.planet} in ${transit.sign}`,
        applies,
        strength,
        basis: `${transit.planet} activates H${fromLagna} from Lagna, H${fromMoon} from Moon, natal H${transitHouse}; ${
          sameTheme
            ? `${intent} houses overlap`
            : `${intent} houses do not directly overlap`
        }; ${
          dashaOverlap
            ? "active dasha overlap exists"
            : "no active dasha overlap, so gochar cannot override natal/dasha promise"
        }.`,
      }
    })
  )
}

const buildBphsTraces = ({
  chart,
  bphsRuleProofs,
  detectedCases,
  subQuestions,
}: {
  chart: PrashnaChart
  bphsRuleProofs: BphsRuleProof[]
  detectedCases: string[]
  subQuestions: string[]
}): KundliBphsTrace[] =>
  (Object.keys(INTENT_QUERY) as KundliEvidenceIntent[]).flatMap((intent) => {
    const passages = retrieveAstrologyKnowledge({
      // Do not mix every user question into every life-area retrieval. The
      // focused question pipeline performs its own intent-specific search.
      query: INTENT_QUERY[intent],
      chart,
      detectedCases,
      min: 1,
      max: 2,
      intent,
    })
    const matchingRule =
      bphsRuleProofs.find((rule) => rule.area.includes(intent)) ||
      bphsRuleProofs.find((rule) => {
        if (intent === "career") return rule.area.includes("career")
        if (intent === "wealth") return rule.area.includes("wealth")
        if (intent === "relationship") return rule.area.includes("relationship")
        if (intent === "health") return rule.area.includes("health")
        if (intent === "dasha") return rule.area.includes("dasha")
        if (intent === "markesh") return rule.area.includes("markesh")
        return false
      }) ||
      bphsRuleProofs[0]

    return passages.map((passage: RetrievedAstrologyPassage) => {
      const evidenceHits = getAstrologyIntentEvidenceScore(intent, {
        text: passage.text,
        keywords: passage.keywords,
        chapterTitle: passage.chapterTitle,
      })
      const confidence =
        evidenceHits >= 2 && passage.score > 1
          ? "high"
          : evidenceHits >= 1
            ? "medium"
            : "low"

      return {
        intent,
        citation: passage.citation,
        section: passage.section,
        matched_chart_fact:
          matchingRule?.chart_fact || "Chart fact matched by retrieval intent.",
        confidence,
        reason: `${intent} retrieval matched ${evidenceHits} topic terms; score ${passage.score.toFixed(
          3
        )}.`,
      }
    })
  })

export const buildKundliEvidencePack = ({
  chart,
  bphsRuleProofs,
  detectedCases,
  subQuestions,
}: {
  chart: PrashnaChart
  bphsRuleProofs: BphsRuleProof[]
  detectedCases: string[]
  subQuestions: string[]
}): KundliEvidencePack => {
  const dashaEvidence = buildDashaEvidence(chart)

  return {
    bphs_traces: buildBphsTraces({
      chart,
      bphsRuleProofs,
      detectedCases,
      subQuestions,
    }),
    dasha_evidence: dashaEvidence,
    drishti_summary: buildDrishtiSummary(chart),
    gochar_evidence: buildGocharEvidence(chart, dashaEvidence),
    guardrails: [
      "Natal chart and Vimshottari dasha outrank gochar.",
      "Gochar applies only when it overlaps the same intent houses and active dasha/natal planets.",
      "BPHS passages must match the section intent before influencing output.",
      "Do not name diseases or deterministic harm; use prevention language only.",
    ],
  }
}
