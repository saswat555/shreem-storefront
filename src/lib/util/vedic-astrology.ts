import "server-only"

import {
  HOUSE_THEMES,
  KARANAS,
  SIGN_LORDS,
  YOGAS,
  getHindiMonthInfoBySunSign,
  getHouseSystem,
  getPanchangSystem,
  getDegreeInSign,
  getNakshatraFromDegree,
  getSignFromDegree,
  type AstrologyCity,
  type HindiCalendarDay,
  type PrashnaChart,
  type PrashnaHouse,
  type PrashnaPlanet,
  type DashaPeriod,
  type HouseSystem,
  type HouseSystemId,
  type VimshottariDasha,
} from "./astrology"

type AstroCoord = {
  lon: number
  lat: number
  range?: number
}

type PlanetSource = {
  key: string
  name: string
  dataKey: string
}

const {
  base,
  moonposition,
  nutation,
  planetposition,
  sidereal,
  solar,
} = require("astronomia") as any
const astronomyData = require("astronomia/data").default as Record<string, any>

const PLANET_SOURCES: PlanetSource[] = [
  { key: "mercury", name: "Mercury", dataKey: "vsop87Bmercury" },
  { key: "venus", name: "Venus", dataKey: "vsop87Bvenus" },
  { key: "mars", name: "Mars", dataKey: "vsop87Bmars" },
  { key: "jupiter", name: "Jupiter", dataKey: "vsop87Bjupiter" },
  { key: "saturn", name: "Saturn", dataKey: "vsop87Bsaturn" },
]

const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya",
]

const VIMSHOTTARI_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
]

const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
}

const NAKSHATRA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
]

const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360
const toDegrees = (value: number) => (180 / Math.PI) * value
const toRadians = (value: number) => (Math.PI / 180) * value
const roundDegree = (value: number) => Number(value.toFixed(2))
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
const julianDay = (date: Date) => date.getTime() / 86400000 + 2440587.5

const earth = new planetposition.Planet(astronomyData.vsop87Bearth)
const planetCache = PLANET_SOURCES.reduce<Record<string, any>>(
  (acc, planet) => {
    acc[planet.key] = new planetposition.Planet(astronomyData[planet.dataKey])
    return acc
  },
  {}
)

const getMeanLahiriAyanamsa = (jd: number) => {
  const t = (jd - 2415020) / 36525

  return normalizeDegrees(22.460148 + 1.396042 * t + 0.000087 * t * t)
}

const toSidereal = (tropicalLongitude: number, ayanamsa: number) =>
  normalizeDegrees(tropicalLongitude - ayanamsa)

const getWeekday = (date: Date, city: AstrologyCity) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: city.timeZone,
    weekday: "long",
  }).format(date)

const getLocalNoonDate = (date: string, city: AstrologyCity) => {
  const [year, month, day] = date.split("-").map(Number)
  const utcMs =
    Date.UTC(year, month - 1, day, 12) - city.utcOffsetHours * 60 * 60 * 1000

  return new Date(utcMs)
}

const getLocalDateTime = (date: Date, city: AstrologyCity) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: city.timeZone,
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date)

const getKarana = (moonSunDistance: number) => {
  const halfTithi = Math.floor(normalizeDegrees(moonSunDistance) / 6)

  if (halfTithi === 0) {
    return "Kimstughna"
  }

  if (halfTithi >= 57) {
    return ["Shakuni", "Chatushpada", "Naga"][halfTithi - 57] || "Naga"
  }

  return KARANAS[(halfTithi - 1) % KARANAS.length]
}

const getRahuLongitude = (jd: number, ayanamsa: number) => {
  const t = base.J2000Century(jd)
  const meanNode = normalizeDegrees(
    125.04452 - 1934.136261 * t + 0.0020708 * t * t + (t * t * t) / 450000
  )

  return toSidereal(meanNode, ayanamsa)
}

const getAscendantLongitude = ({
  jd,
  city,
  ayanamsa,
}: {
  jd: number
  city: AstrologyCity
  ayanamsa: number
}) => {
  const apparentSiderealSeconds = sidereal.apparent(jd)
  const localSiderealDegree = normalizeDegrees(
    (apparentSiderealSeconds / 240) + city.longitude
  )
  const obliquity = nutation.meanObliquity(jd)
  const latitude = toRadians(city.latitude)
  const theta = toRadians(localSiderealDegree)
  const denominator =
    Math.sin(theta) * Math.cos(obliquity) +
    Math.tan(latitude) * Math.sin(obliquity)
  const tropicalAscendant = normalizeDegrees(
    toDegrees(
      Math.atan2(
        Math.cos(theta),
        -denominator
      )
    )
  )

  return toSidereal(tropicalAscendant, ayanamsa)
}

const addYears = (date: Date, years: number) =>
  new Date(date.getTime() + years * 365.2425 * 86400000)

const formatDashaDate = (date: Date, city: AstrologyCity) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: city.timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)

const createDashaPeriod = ({
  lord,
  level,
  start,
  durationYears,
  city,
}: {
  lord: string
  level: DashaPeriod["level"]
  start: Date
  durationYears: number
  city: AstrologyCity
}): DashaPeriod => {
  const end = addYears(start, durationYears)

  return {
    lord,
    level,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startLabel: formatDashaDate(start, city),
    endLabel: formatDashaDate(end, city),
    durationYears: roundDegree(durationYears),
  }
}

const getDashaOrderFromLord = (lord: string) => {
  const startIndex = Math.max(VIMSHOTTARI_SEQUENCE.indexOf(lord), 0)

  return Array.from({ length: VIMSHOTTARI_SEQUENCE.length }, (_, index) => {
    return VIMSHOTTARI_SEQUENCE[(startIndex + index) % VIMSHOTTARI_SEQUENCE.length]
  })
}

const findRunningDasha = ({
  start,
  order,
  parentDurationYears,
  target,
  level,
  city,
}: {
  start: Date
  order: string[]
  parentDurationYears: number
  target: Date
  level: DashaPeriod["level"]
  city: AstrologyCity
}) => {
  let cursor = new Date(start)

  for (const lord of order) {
    const durationYears =
      (parentDurationYears * VIMSHOTTARI_YEARS[lord]) / 120
    const period = createDashaPeriod({
      lord,
      level,
      start: cursor,
      durationYears,
      city,
    })

    if (target >= cursor && target < new Date(period.endIso)) {
      return period
    }

    cursor = new Date(period.endIso)
  }

  const lord = order[order.length - 1]

  return createDashaPeriod({
    lord,
    level,
    start: cursor,
    durationYears: (parentDurationYears * VIMSHOTTARI_YEARS[lord]) / 120,
    city,
  })
}

const buildVimshottariDasha = ({
  moonLongitude,
  birthDate,
  city,
  targetDate = new Date(),
}: {
  moonLongitude: number
  birthDate: Date
  city: AstrologyCity
  targetDate?: Date
}): VimshottariDasha => {
  const nakshatraSpan = 360 / 27
  const nakshatraIndex = Math.floor(normalizeDegrees(moonLongitude) / nakshatraSpan)
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex % 9]
  const elapsedInNakshatra = normalizeDegrees(moonLongitude) % nakshatraSpan
  const remainingRatio = 1 - elapsedInNakshatra / nakshatraSpan
  const birthBalanceYears = VIMSHOTTARI_YEARS[nakshatraLord] * remainingRatio
  const firstMahadasha = createDashaPeriod({
    lord: nakshatraLord,
    level: "mahadasha",
    start: birthDate,
    durationYears: birthBalanceYears,
    city,
  })
  const mahadashaOrder = getDashaOrderFromLord(nakshatraLord)
  const mahadashas: DashaPeriod[] = [firstMahadasha]
  let cursor = new Date(firstMahadasha.endIso)

  for (let index = 1; index < 18; index += 1) {
    const lord = mahadashaOrder[index % mahadashaOrder.length]
    const period = createDashaPeriod({
      lord,
      level: "mahadasha",
      start: cursor,
      durationYears: VIMSHOTTARI_YEARS[lord],
      city,
    })
    mahadashas.push(period)
    cursor = new Date(period.endIso)
  }

  const mahadasha =
    mahadashas.find(
      (period) =>
        targetDate >= new Date(period.startIso) &&
        targetDate < new Date(period.endIso)
    ) || mahadashas[0]
  const antardashaOrder = getDashaOrderFromLord(mahadasha.lord)
  const antardasha = findRunningDasha({
    start: new Date(mahadasha.startIso),
    order: antardashaOrder,
    parentDurationYears: mahadasha.durationYears,
    target: targetDate,
    level: "antardasha",
    city,
  })
  const pratyantarOrder = getDashaOrderFromLord(antardasha.lord)
  const pratyantar = findRunningDasha({
    start: new Date(antardasha.startIso),
    order: pratyantarOrder,
    parentDurationYears: antardasha.durationYears,
    target: targetDate,
    level: "pratyantar",
    city,
  })

  return {
    system: "Vimshottari",
    balanceAtBirth: firstMahadasha,
    currentDateIso: targetDate.toISOString(),
    mahadasha,
    antardasha,
    pratyantar,
    sequence: VIMSHOTTARI_SEQUENCE,
    moonNakshatraLord: nakshatraLord,
    note:
      "Vimshottari dasha is calculated from the Moon nakshatra balance at birth using sidereal Lahiri Moon longitude.",
  }
}

const getGeocentricPlanetLongitude = (planet: any, jd: number): AstroCoord => {
  const earthPosition = earth.position(jd)
  const planetPosition = planet.position(jd)

  const earthX =
    earthPosition.range *
    Math.cos(earthPosition.lat) *
    Math.cos(earthPosition.lon)
  const earthY =
    earthPosition.range *
    Math.cos(earthPosition.lat) *
    Math.sin(earthPosition.lon)
  const earthZ = earthPosition.range * Math.sin(earthPosition.lat)

  const planetX =
    planetPosition.range *
    Math.cos(planetPosition.lat) *
    Math.cos(planetPosition.lon)
  const planetY =
    planetPosition.range *
    Math.cos(planetPosition.lat) *
    Math.sin(planetPosition.lon)
  const planetZ = planetPosition.range * Math.sin(planetPosition.lat)

  const x = planetX - earthX
  const y = planetY - earthY
  const z = planetZ - earthZ
  const lon = normalizeDegrees(toDegrees(Math.atan2(y, x)))
  const lat = toDegrees(Math.atan2(z, Math.hypot(x, y)))

  return { lon, lat }
}

const getPlanetHouse = (longitude: number, ascendantLongitude: number) => {
  const ascendantSignIndex = Math.floor(normalizeDegrees(ascendantLongitude) / 30)
  const planetSignIndex = Math.floor(normalizeDegrees(longitude) / 30)

  return ((planetSignIndex - ascendantSignIndex + 12) % 12) + 1
}

const getMidheavenLongitude = ({
  jd,
  city,
  ayanamsa,
}: {
  jd: number
  city: AstrologyCity
  ayanamsa: number
}) => {
  const apparentSiderealSeconds = sidereal.apparent(jd)
  const localSiderealDegree = normalizeDegrees(
    apparentSiderealSeconds / 240 + city.longitude
  )
  const theta = toRadians(localSiderealDegree)
  const obliquity = nutation.meanObliquity(jd)
  const tropicalMidheaven = normalizeDegrees(
    toDegrees(
      Math.atan2(
        Math.sin(theta),
        Math.cos(theta) * Math.cos(obliquity)
      )
    )
  )

  return toSidereal(tropicalMidheaven, ayanamsa)
}

const zodiacArc = (from: number, to: number) =>
  normalizeDegrees(to - from)

const interpolateZodiac = (from: number, to: number, ratio: number) =>
  normalizeDegrees(from + zodiacArc(from, to) * ratio)

const midpointZodiac = (from: number, to: number) =>
  interpolateZodiac(from, to, 0.5)

type BhavaPlacement = {
  house: number
  cuspLongitude: number
  startLongitude: number
  endLongitude: number
  distanceFromCusp: number
  impactPercent: number
  impactState: "strong" | "moderate" | "weak" | "sandhi"
}

const buildSripatiCusps = ({
  ascendantLongitude,
  midheavenLongitude,
}: {
  ascendantLongitude: number
  midheavenLongitude: number
}) => {
  const bhavaMadhya: Record<number, number> = {
    1: normalizeDegrees(ascendantLongitude),
    4: normalizeDegrees(midheavenLongitude + 180),
    7: normalizeDegrees(ascendantLongitude + 180),
    10: normalizeDegrees(midheavenLongitude),
  }

  bhavaMadhya[11] = interpolateZodiac(bhavaMadhya[10], bhavaMadhya[1], 1 / 3)
  bhavaMadhya[12] = interpolateZodiac(bhavaMadhya[10], bhavaMadhya[1], 2 / 3)
  bhavaMadhya[2] = interpolateZodiac(bhavaMadhya[1], bhavaMadhya[4], 1 / 3)
  bhavaMadhya[3] = interpolateZodiac(bhavaMadhya[1], bhavaMadhya[4], 2 / 3)
  bhavaMadhya[5] = interpolateZodiac(bhavaMadhya[4], bhavaMadhya[7], 1 / 3)
  bhavaMadhya[6] = interpolateZodiac(bhavaMadhya[4], bhavaMadhya[7], 2 / 3)
  bhavaMadhya[8] = interpolateZodiac(bhavaMadhya[7], bhavaMadhya[10], 1 / 3)
  bhavaMadhya[9] = interpolateZodiac(bhavaMadhya[7], bhavaMadhya[10], 2 / 3)

  return bhavaMadhya
}

const longitudeInHouseBoundary = ({
  value,
  start,
  end,
}: {
  value: number
  start: number
  end: number
}) => zodiacArc(start, value) < zodiacArc(start, end)

const getSripatiHouse = (
  longitude: number,
  cusps: Record<number, number>
) => {
  const normalizedLongitude = normalizeDegrees(longitude)

  for (let house = 1; house <= 12; house += 1) {
    const previousHouse = house === 1 ? 12 : house - 1
    const nextHouse = house === 12 ? 1 : house + 1
    const start = midpointZodiac(cusps[previousHouse], cusps[house])
    const end = midpointZodiac(cusps[house], cusps[nextHouse])

    if (
      longitudeInHouseBoundary({
        value: normalizedLongitude,
        start,
        end,
      })
    ) {
      return house
    }
  }

  return getPlanetHouse(longitude, cusps[1])
}

const getBhavaBoundary = (house: number, cusps: Record<number, number>) => {
  const previousHouse = house === 1 ? 12 : house - 1
  const nextHouse = house === 12 ? 1 : house + 1

  return {
    house,
    cuspLongitude: normalizeDegrees(cusps[house]),
    startLongitude: midpointZodiac(cusps[previousHouse], cusps[house]),
    endLongitude: midpointZodiac(cusps[house], cusps[nextHouse]),
  }
}

const getBhavaImpactState = (
  impactPercent: number
): BhavaPlacement["impactState"] => {
  if (impactPercent >= 80) {
    return "strong"
  }

  if (impactPercent >= 50) {
    return "moderate"
  }

  if (impactPercent >= 25) {
    return "weak"
  }

  return "sandhi"
}

const getSripatiPlacement = (
  longitude: number,
  cusps: Record<number, number>
): BhavaPlacement => {
  const normalizedLongitude = normalizeDegrees(longitude)
  const fallbackHouse = getPlanetHouse(longitude, cusps[1])
  let boundary = getBhavaBoundary(fallbackHouse, cusps)

  for (let house = 1; house <= 12; house += 1) {
    const candidate = getBhavaBoundary(house, cusps)

    if (
      longitudeInHouseBoundary({
        value: normalizedLongitude,
        start: candidate.startLongitude,
        end: candidate.endLongitude,
      })
    ) {
      boundary = candidate
      break
    }
  }

  const span = zodiacArc(boundary.startLongitude, boundary.endLongitude)
  const cuspOffset = zodiacArc(boundary.startLongitude, boundary.cuspLongitude)
  const planetOffset = zodiacArc(boundary.startLongitude, normalizedLongitude)
  const beforeCusp = planetOffset <= cuspOffset
  const distanceFromCusp = beforeCusp
    ? cuspOffset - planetOffset
    : planetOffset - cuspOffset
  const halfSpan = beforeCusp ? cuspOffset : span - cuspOffset
  const impactPercent =
    halfSpan > 0 ? clamp(100 - (distanceFromCusp / halfSpan) * 100, 0, 100) : 0
  const roundedImpact = Math.round(impactPercent)

  return {
    house: boundary.house,
    cuspLongitude: roundDegree(boundary.cuspLongitude),
    startLongitude: roundDegree(boundary.startLongitude),
    endLongitude: roundDegree(boundary.endLongitude),
    distanceFromCusp: roundDegree(distanceFromCusp),
    impactPercent: roundedImpact,
    impactState: getBhavaImpactState(roundedImpact),
  }
}

const getSelectedHouse = ({
  longitude,
  ascendantLongitude,
  houseSystemId,
  sripatiCusps,
}: {
  longitude: number
  ascendantLongitude: number
  houseSystemId: HouseSystemId
  sripatiCusps?: Record<number, number>
}) =>
  houseSystemId === "sripati-bhava" && sripatiCusps
    ? getSripatiPlacement(longitude, sripatiCusps).house
    : getPlanetHouse(longitude, ascendantLongitude)

const getSignedAngleDelta = (from: number, to: number) =>
  ((to - from + 540) % 360) - 180

const getRetrograde = ({
  planet,
  jd,
  ayanamsa,
  currentLongitude,
}: {
  planet: any
  jd: number
  ayanamsa: number
  currentLongitude: number
}) => {
  const nextLongitude = toSidereal(
    getGeocentricPlanetLongitude(planet, jd + 1).lon,
    ayanamsa
  )

  return getSignedAngleDelta(currentLongitude, nextLongitude) < -0.01
}

const createPlanet = ({
  key,
  name,
  longitude,
  latitude,
  ascendantLongitude,
  houseSystem,
  sripatiCusps,
  retrograde = false,
}: {
  key: string
  name: string
  longitude: number
  latitude?: number
  ascendantLongitude: number
  houseSystem: HouseSystem
  sripatiCusps?: Record<number, number>
  retrograde?: boolean
}): PrashnaPlanet => {
  const nakshatra = getNakshatraFromDegree(longitude)
  const rashiHouse = getPlanetHouse(longitude, ascendantLongitude)
  const bhavaPlacement = sripatiCusps
    ? getSripatiPlacement(longitude, sripatiCusps)
    : undefined
  const bhavaHouse = bhavaPlacement?.house || rashiHouse
  const house = getSelectedHouse({
    longitude,
    ascendantLongitude,
    houseSystemId: houseSystem.id,
    sripatiCusps,
  })

  return {
    key,
    name,
    longitude: roundDegree(normalizeDegrees(longitude)),
    latitude: typeof latitude === "number" ? roundDegree(latitude) : undefined,
    sign: getSignFromDegree(longitude),
    signDegree: getDegreeInSign(longitude),
    nakshatra: nakshatra.name,
    pada: nakshatra.pada,
    house,
    rashiHouse,
    bhavaHouse,
    bhavaCuspLongitude: bhavaPlacement?.cuspLongitude,
    bhavaCuspDegree:
      typeof bhavaPlacement?.cuspLongitude === "number"
        ? getDegreeInSign(bhavaPlacement.cuspLongitude)
        : undefined,
    bhavaStartLongitude: bhavaPlacement?.startLongitude,
    bhavaEndLongitude: bhavaPlacement?.endLongitude,
    bhavaDistanceFromCusp: bhavaPlacement?.distanceFromCusp,
    bhavaImpactPercent: bhavaPlacement?.impactPercent,
    bhavaImpactState: bhavaPlacement?.impactState,
    houseSystem: houseSystem.id,
    houseNote:
      bhavaPlacement
        ? `Rashi house ${rashiHouse}; Bhava Chalit house ${bhavaHouse}; ${bhavaPlacement.impactPercent}% ${bhavaPlacement.impactState} bhava impact, ${bhavaPlacement.distanceFromCusp} deg from bhava madhya.`
        : undefined,
    retrograde,
  }
}

const buildHouses = ({
  ascendantLongitude,
  houseSystem,
  sripatiCusps,
}: {
  ascendantLongitude: number
  houseSystem: HouseSystem
  sripatiCusps?: Record<number, number>
}): PrashnaHouse[] => {
  const ascendantSignIndex = Math.floor(normalizeDegrees(ascendantLongitude) / 30)

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1
    const signLongitude = normalizeDegrees((ascendantSignIndex + index) * 30)
    const bhavaBoundary = sripatiCusps
      ? getBhavaBoundary(house, sripatiCusps)
      : undefined
    const cuspLongitude =
      typeof bhavaBoundary?.cuspLongitude === "number"
        ? roundDegree(bhavaBoundary.cuspLongitude)
        : undefined
    const sign = getSignFromDegree(signLongitude)
    const cuspSign =
      typeof cuspLongitude === "number" ? getSignFromDegree(cuspLongitude) : undefined

    return {
      house,
      sign,
      signLord: SIGN_LORDS[sign],
      theme: HOUSE_THEMES[index],
      cuspLongitude,
      cuspSign,
      cuspDegree:
        typeof cuspLongitude === "number"
          ? getDegreeInSign(cuspLongitude)
          : undefined,
      bhavaStartLongitude:
        typeof bhavaBoundary?.startLongitude === "number"
          ? roundDegree(bhavaBoundary.startLongitude)
          : undefined,
      bhavaEndLongitude:
        typeof bhavaBoundary?.endLongitude === "number"
          ? roundDegree(bhavaBoundary.endLongitude)
          : undefined,
    }
  })
}

const getPlanetByName = (planets: PrashnaPlanet[], name: string) =>
  planets.find((planet) => planet.name === name)

export const buildDetailedPrashnaChart = ({
  city,
  date = new Date(),
  dashaDate,
  panchangSystemId,
}: {
  city: AstrologyCity
  date?: Date
  dashaDate?: Date
  panchangSystemId?: string
}): PrashnaChart => {
  const jd = julianDay(date)
  const panchangSystem = getPanchangSystem(panchangSystemId)
  const houseSystem = getHouseSystem(panchangSystem.houseSystemId)
  const ayanamsa = normalizeDegrees(
    getMeanLahiriAyanamsa(jd) + panchangSystem.ayanamsaOffsetDegrees
  )
  const ascendantLongitude = getAscendantLongitude({ jd, city, ayanamsa })
  const midheavenLongitude = getMidheavenLongitude({ jd, city, ayanamsa })
  const sripatiCusps = buildSripatiCusps({
    ascendantLongitude,
    midheavenLongitude,
  })
  const ascendantNakshatra = getNakshatraFromDegree(ascendantLongitude)
  const sunLongitude = toSidereal(
    toDegrees(solar.apparentLongitude(base.J2000Century(jd))),
    ayanamsa
  )
  const moonPosition = moonposition.position(jd)
  const moonLongitude = toSidereal(toDegrees(moonPosition.lon), ayanamsa)
  const moonNakshatra = getNakshatraFromDegree(moonLongitude)
  const moonSunDistance = normalizeDegrees(moonLongitude - sunLongitude)
  const tithiNumber = Math.floor(moonSunDistance / 12) + 1
  const yogaIndex = Math.floor(
    normalizeDegrees(sunLongitude + moonLongitude) / (360 / 27)
  )
  const paksha = tithiNumber <= 15 ? "Shukla" : "Krishna"
  const houses = buildHouses({
    ascendantLongitude,
    houseSystem,
    sripatiCusps,
  })
  const dasha = buildVimshottariDasha({
    moonLongitude,
    birthDate: date,
    city,
    targetDate: dashaDate,
  })

  const planets: PrashnaPlanet[] = [
    createPlanet({
      key: "sun",
      name: "Sun",
      longitude: sunLongitude,
      ascendantLongitude,
      houseSystem,
      sripatiCusps,
    }),
    createPlanet({
      key: "moon",
      name: "Moon",
      longitude: moonLongitude,
      latitude: toDegrees(moonPosition.lat),
      ascendantLongitude,
      houseSystem,
      sripatiCusps,
    }),
    ...PLANET_SOURCES.map((source) => {
      const geocentric = getGeocentricPlanetLongitude(planetCache[source.key], jd)
      const longitude = toSidereal(geocentric.lon, ayanamsa)

      return createPlanet({
        key: source.key,
        name: source.name,
        longitude,
        latitude: geocentric.lat,
        ascendantLongitude,
        houseSystem,
        sripatiCusps,
        retrograde: getRetrograde({
          planet: planetCache[source.key],
          jd,
          ayanamsa,
          currentLongitude: longitude,
        }),
      })
    }),
  ]

  const rahuLongitude = getRahuLongitude(jd, ayanamsa)
  planets.push(
    createPlanet({
      key: "rahu",
      name: "Rahu",
      longitude: rahuLongitude,
      ascendantLongitude,
      houseSystem,
      sripatiCusps,
      retrograde: true,
    }),
    createPlanet({
      key: "ketu",
      name: "Ketu",
      longitude: rahuLongitude + 180,
      ascendantLongitude,
      houseSystem,
      sripatiCusps,
      retrograde: true,
    })
  )

  const ascendant = getSignFromDegree(ascendantLongitude)
  const lagnaLord = getPlanetByName(planets, SIGN_LORDS[ascendant])
  const moon = getPlanetByName(planets, "Moon")
  const sun = getPlanetByName(planets, "Sun")

  return {
    generatedAtIso: date.toISOString(),
    generatedAtLocal: getLocalDateTime(date, city),
    city,
    panchangSystem,
    houseSystem,
    calculationSystem:
      `${panchangSystem.label}: Astronomia 4.2.0 Meeus/VSOP87 ephemeris, sidereal zodiac, ${houseSystem.label}.`,
    weekday: getWeekday(date, city),
    ayanamsa: roundDegree(ayanamsa),
    ascendant,
    ascendantDegree: getDegreeInSign(ascendantLongitude),
    ascendantLongitude: roundDegree(ascendantLongitude),
    ascendantNakshatra: ascendantNakshatra.name,
    ascendantPada: ascendantNakshatra.pada,
    moonSign: moon?.sign || getSignFromDegree(moonLongitude),
    moonDegree: moon?.signDegree || getDegreeInSign(moonLongitude),
    moonLongitude: roundDegree(moonLongitude),
    sunSign: sun?.sign || getSignFromDegree(sunLongitude),
    sunDegree: sun?.signDegree || getDegreeInSign(sunLongitude),
    sunLongitude: roundDegree(sunLongitude),
    nakshatra: moonNakshatra.name,
    nakshatraPada: moonNakshatra.pada,
    tithi: `${paksha} ${TITHI_NAMES[tithiNumber - 1]} (${tithiNumber})`,
    paksha,
    yoga: YOGAS[yogaIndex] || "Unknown",
    karana: getKarana(moonSunDistance),
    planets,
    houses,
    dasha,
    prashnaFactors: [
      `Prashna cast for ${getLocalDateTime(date, city)} at ${city.name}, ${
        city.region
      }.`,
      `${ascendant} rises at ${getDegreeInSign(
        ascendantLongitude
      )} degrees; house method ${houseSystem.label}; lagna lord ${
        SIGN_LORDS[ascendant]
      } is in ${
        lagnaLord ? `house ${lagnaLord.house}, ${lagnaLord.sign}` : "the chart"
      }.`,
      `Moon is in ${moon?.sign || getSignFromDegree(moonLongitude)}, ${
        moonNakshatra.name
      } nakshatra pada ${moonNakshatra.pada}, house ${
        moon?.house || getPlanetHouse(moonLongitude, ascendantLongitude)
      }.`,
      `${paksha} paksha, ${TITHI_NAMES[tithiNumber - 1]} tithi, ${
        YOGAS[yogaIndex] || "Unknown"
      } yoga, ${getKarana(moonSunDistance)} karana.`,
      `Current period: ${dasha.mahadasha.lord} Mahadasha, ${dasha.antardasha.lord} Antardasha, ${dasha.pratyantar.lord} Pratyantar Dasha.`,
    ],
    accuracyNote:
      `Chart is calculated with astronomical ephemeris, ${panchangSystem.label}, and ${houseSystem.label}. Printed panchang editions can differ around sunrise, ayanamsa, house division, and boundary moments; final ritual, gemstone, medical, legal, or financial decisions should be confirmed with a qualified astrologer or professional.`,
  }
}

export const buildHindiCalendarDay = ({
  city,
  date,
  panchangSystemId,
}: {
  city: AstrologyCity
  date: string
  panchangSystemId?: string
}): HindiCalendarDay => {
  const chart = buildDetailedPrashnaChart({
    city,
    date: getLocalNoonDate(date, city),
    panchangSystemId,
  })

  return {
    date,
    city,
    weekday: chart.weekday,
    tithi: chart.tithi,
    paksha: chart.paksha,
    month: getHindiMonthInfoBySunSign(chart.sunSign),
    nakshatra: `${chart.nakshatra} pada ${chart.nakshatraPada}`,
    yoga: chart.yoga,
    karana: chart.karana,
    note:
      "Calculated for the selected city and date around local midday. Local panchang traditions can differ slightly by sunrise rules and regional calendar style.",
  }
}
