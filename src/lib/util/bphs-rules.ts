import "server-only"

import {
  HOUSE_THEMES,
  SIGN_LORDS,
  type PrashnaChart,
  type PrashnaPlanet,
} from "./astrology"

export type BphsRuleProof = {
  id: string
  source: string
  chapter: string
  rule: string
  chart_fact: string
  application: string
  strength: "strong" | "medium" | "supporting"
  area: string
}

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

const DUSTHANA_HOUSES = [6, 8, 12]
const KENDRA_HOUSES = [1, 4, 7, 10]
const TRIKONA_HOUSES = [1, 5, 9]
const UPACHAYA_HOUSES = [3, 6, 10, 11]
const NATURAL_MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"]
const NATURAL_BENEFICS = ["Moon", "Mercury", "Jupiter", "Venus"]

const getPlanet = (chart: PrashnaChart, name?: string) =>
  chart.planets.find((planet) => planet.name === name)

const getHouse = (chart: PrashnaChart, houseNumber: number) =>
  chart.houses.find((house) => house.house === houseNumber)

const getHousePlanets = (chart: PrashnaChart, houseNumber: number) =>
  chart.planets.filter(
    (planet) => (planet.bhavaHouse || planet.house) === houseNumber
  )

const dignity = (planet?: PrashnaPlanet) => {
  if (!planet) return "not placed"
  if (EXALTATION_SIGNS[planet.name] === planet.sign) return "exalted"
  if (DEBILITATION_SIGNS[planet.name] === planet.sign) return "debilitated"
  if (SIGN_LORDS[planet.sign] === planet.name) return "own sign"
  return "neutral dignity"
}

const hasMaleficPressure = (chart: PrashnaChart, houseNumber: number) => {
  const occupants = getHousePlanets(chart, houseNumber)
  const received = chart.aspects?.filter((aspect) => aspect.toHouse === houseNumber) || []

  return (
    occupants.some((planet) => NATURAL_MALEFICS.includes(planet.name)) ||
    received.some((aspect) => NATURAL_MALEFICS.includes(aspect.fromPlanet))
  )
}

const hasBeneficSupport = (chart: PrashnaChart, houseNumber: number) => {
  const occupants = getHousePlanets(chart, houseNumber)
  const received = chart.aspects?.filter((aspect) => aspect.toHouse === houseNumber) || []

  return (
    occupants.some((planet) => NATURAL_BENEFICS.includes(planet.name)) ||
    received.some((aspect) => NATURAL_BENEFICS.includes(aspect.fromPlanet))
  )
}

const activeDashaLords = (chart: PrashnaChart) =>
  [
    chart.dasha?.mahadasha?.lord,
    chart.dasha?.antardasha?.lord,
    chart.dasha?.pratyantar?.lord,
  ].filter(Boolean) as string[]

const pushRule = (
  proofs: BphsRuleProof[],
  proof: BphsRuleProof | null | undefined
) => {
  if (!proof) return
  if (!proofs.some((item) => item.id === proof.id && item.chart_fact === proof.chart_fact)) {
    proofs.push(proof)
  }
}

export const evaluateBphsRules = (chart: PrashnaChart): BphsRuleProof[] => {
  const proofs: BphsRuleProof[] = []
  const lagnaLord = getPlanet(chart, SIGN_LORDS[chart.ascendant])
  const dashaLords = activeDashaLords(chart)

  pushRule(proofs, {
    id: "bphs.ch11.bhava-lord-primary",
    source: "Brihat Parashara Hora Shastra",
    chapter: "Chapter 11: Judgement of Bhavas",
    rule: "A bhava is judged from the bhava, its lord, occupants, and relevant graha indications.",
    chart_fact: `Lagna ${chart.ascendant}; house lords are ${chart.houses
      .slice(0, 12)
      .map((house) => `H${house.house}-${house.signLord}`)
      .join(", ")}.`,
    application:
      "The reading must combine house sign, house lord placement, planets placed, drishti received, and dasha activation instead of giving isolated planet snippets.",
    strength: "strong",
    area: "method",
  })

  if (lagnaLord) {
    const lagnaLordHouse = lagnaLord.bhavaHouse || lagnaLord.house
    pushRule(proofs, {
      id: "bphs.ch12.lagna-lord-body",
      source: "Brihat Parashara Hora Shastra",
      chapter: "Chapter 12: Effects of Tanu Bhava",
      rule: "If Lagna lord is strong and well placed, bodily comfort and vitality improve; if joined with malefic influence or placed in 6th, 8th, or 12th, bodily comfort is reduced.",
      chart_fact: `Lagna lord ${lagnaLord.name} is in ${lagnaLord.sign}, house ${lagnaLordHouse}, dignity ${dignity(lagnaLord)}.`,
      application: DUSTHANA_HOUSES.includes(lagnaLordHouse)
        ? "Vitality and body matters need preventive attention, especially during the Lagna lord's dasha or related transits."
        : "Lagna lord is not in a dusthana, so vitality judgement should be moderated by dignity, drishti and dasha rather than made fearful.",
      strength: DUSTHANA_HOUSES.includes(lagnaLordHouse) ? "strong" : "supporting",
      area: "health/vitality",
    })
  }

  ;[2, 7].forEach((houseNumber) => {
    const house = getHouse(chart, houseNumber)
    const lord = getPlanet(chart, house?.signLord)
    const occupants = getHousePlanets(chart, houseNumber)
    const lordActive = lord ? dashaLords.includes(lord.name) : false

    pushRule(proofs, {
      id: `bphs.ch44.maraka-house-${houseNumber}`,
      source: "Brihat Parashara Hora Shastra",
      chapter: "Chapter 44: Marak Grahas",
      rule: "The 2nd and 7th houses and their lords are Maraka factors; their periods require careful judgement with longevity, strength and benefic protection.",
      chart_fact: `House ${houseNumber} ${house?.sign || ""}, lord ${house?.signLord || ""}${
        lord ? ` placed in H${lord.bhavaHouse || lord.house}, ${dignity(lord)}` : ""
      }; occupants: ${occupants.map((planet) => planet.name).join(", ") || "none"}.`,
      application: lordActive
        ? `${house?.signLord} is active in the current dasha chain, so this Maraka rule becomes a prevention/watch-period factor, not a certainty of harm.`
        : "Use as background Maraka audit; do not present danger timing unless the dasha chain or fine timing also activates it.",
      strength: lordActive ? "strong" : "supporting",
      area: "markesh/timing",
    })
  })

  DUSTHANA_HOUSES.forEach((houseNumber) => {
    const house = getHouse(chart, houseNumber)
    const lord = getPlanet(chart, house?.signLord)
    const occupants = getHousePlanets(chart, houseNumber)
    const active = occupants.some((planet) => dashaLords.includes(planet.name)) ||
      (lord ? dashaLords.includes(lord.name) : false)
    const malefic = hasMaleficPressure(chart, houseNumber)
    const benefic = hasBeneficSupport(chart, houseNumber)

    pushRule(proofs, {
      id: `bphs.ch11.dusthana-${houseNumber}`,
      source: "Brihat Parashara Hora Shastra",
      chapter: "Chapter 11: Judgement of Bhavas",
      rule: "Ari, Randhra and Vyaya bhavas are dusthana houses and are used for disease, obstacles, chronic/sudden events, loss, isolation and expenditure.",
      chart_fact: `H${houseNumber} ${HOUSE_THEMES[houseNumber - 1]}; lord ${house?.signLord || ""}${
        lord ? ` in H${lord.bhavaHouse || lord.house}, ${dignity(lord)}` : ""
      }; occupants ${occupants.map((planet) => planet.name).join(", ") || "none"}; malefic pressure ${malefic ? "yes" : "no"}; benefic support ${benefic ? "yes" : "no"}.`,
      application: active || malefic
        ? "Use as a specific prevention and watch signal, softened when benefic support exists. Do not convert this into a medical diagnosis."
        : "Use as background house audit only; avoid over-predicting disease or accident from this alone.",
      strength: active && malefic ? "strong" : active || malefic ? "medium" : "supporting",
      area: "health/risk",
    })
  })

  ;[10, 11].forEach((houseNumber) => {
    const house = getHouse(chart, houseNumber)
    const lord = getPlanet(chart, house?.signLord)
    const occupants = getHousePlanets(chart, houseNumber)
    const active = occupants.some((planet) => dashaLords.includes(planet.name)) ||
      (lord ? dashaLords.includes(lord.name) : false)

    pushRule(proofs, {
      id: `bphs.ch${houseNumber === 10 ? "21.karm" : "22.labh"}-bhava`,
      source: "Brihat Parashara Hora Shastra",
      chapter: houseNumber === 10
        ? "Chapter 21: Effects of Karm Bhava"
        : "Chapter 22: Effects of Labh Bhava",
      rule: houseNumber === 10
        ? "Karm Bhava is used for profession, action, authority and visible outcomes."
        : "Labh Bhava is used for gains, fulfilment, network and income growth.",
      chart_fact: `H${houseNumber} ${house?.sign || ""}, lord ${house?.signLord || ""}${
        lord ? ` placed in H${lord.bhavaHouse || lord.house}, ${dignity(lord)}` : ""
      }; occupants: ${occupants.map((planet) => planet.name).join(", ") || "none"}.`,
      application: active
        ? "Current dasha activates this house, so career/gain predictions should be more time-specific."
        : "Use this house as a structural career/gain factor and time it through dasha/transit activation.",
      strength: active ? "strong" : "medium",
      area: houseNumber === 10 ? "career" : "wealth/gains",
    })
  })

  if (chart.dasha) {
    const activePlanets = [
      chart.dasha.mahadasha,
      chart.dasha.antardasha,
      chart.dasha.pratyantar,
    ].map((period) => {
      const planet = getPlanet(chart, period.lord)
      return `${period.level} ${period.lord}${
        planet ? ` in H${planet.bhavaHouse || planet.house}, ${dignity(planet)}` : ""
      } (${period.startLabel} to ${period.endLabel})`
    })

    pushRule(proofs, {
      id: "bphs.ch46-47.vimshottari-activation",
      source: "Brihat Parashara Hora Shastra",
      chapter: "Chapters 46-47: Dashas of Grahas and Effects of Dashas",
      rule: "Vimshottari dasha gives timing; judge period results from the active dasha lord's house, dignity, ownership, associations and sub-period lord.",
      chart_fact: activePlanets.join("; "),
      application:
        "Mahadasha sets the background, Antardasha decides the active life area, and Pratyantar triggers shorter events. Predictions must be timed through this hierarchy.",
      strength: "strong",
      area: "dasha/timing",
    })
  }

  return proofs.sort((left, right) => {
    const rank = { strong: 3, medium: 2, supporting: 1 }
    return rank[right.strength] - rank[left.strength]
  })
}
