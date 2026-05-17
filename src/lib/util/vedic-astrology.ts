import "server-only"

import {
  HOUSE_THEMES,
  KARANAS,
  SIGN_LORDS,
  YOGAS,
  getDegreeInSign,
  getNakshatraFromDegree,
  getSignFromDegree,
  type AstrologyCity,
  type PrashnaChart,
  type PrashnaHouse,
  type PrashnaPlanet,
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

const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360
const toDegrees = (value: number) => (180 / Math.PI) * value
const toRadians = (value: number) => (Math.PI / 180) * value
const roundDegree = (value: number) => Number(value.toFixed(2))
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
  const tropicalAscendant = normalizeDegrees(
    toDegrees(
      Math.atan2(
        -Math.cos(theta),
        Math.sin(theta) * Math.cos(obliquity) +
          Math.tan(latitude) * Math.sin(obliquity)
      )
    )
  )

  return toSidereal(tropicalAscendant, ayanamsa)
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
  retrograde = false,
}: {
  key: string
  name: string
  longitude: number
  latitude?: number
  ascendantLongitude: number
  retrograde?: boolean
}): PrashnaPlanet => {
  const nakshatra = getNakshatraFromDegree(longitude)

  return {
    key,
    name,
    longitude: roundDegree(normalizeDegrees(longitude)),
    latitude: typeof latitude === "number" ? roundDegree(latitude) : undefined,
    sign: getSignFromDegree(longitude),
    signDegree: getDegreeInSign(longitude),
    nakshatra: nakshatra.name,
    pada: nakshatra.pada,
    house: getPlanetHouse(longitude, ascendantLongitude),
    retrograde,
  }
}

const buildHouses = (ascendantLongitude: number): PrashnaHouse[] => {
  const ascendantSignIndex = Math.floor(normalizeDegrees(ascendantLongitude) / 30)

  return Array.from({ length: 12 }, (_, index) => {
    const signLongitude = normalizeDegrees((ascendantSignIndex + index) * 30)
    const sign = getSignFromDegree(signLongitude)

    return {
      house: index + 1,
      sign,
      signLord: SIGN_LORDS[sign],
      theme: HOUSE_THEMES[index],
    }
  })
}

const getPlanetByName = (planets: PrashnaPlanet[], name: string) =>
  planets.find((planet) => planet.name === name)

export const buildDetailedPrashnaChart = ({
  city,
  date = new Date(),
}: {
  city: AstrologyCity
  date?: Date
}): PrashnaChart => {
  const jd = julianDay(date)
  const ayanamsa = getMeanLahiriAyanamsa(jd)
  const ascendantLongitude = getAscendantLongitude({ jd, city, ayanamsa })
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
  const houses = buildHouses(ascendantLongitude)

  const planets: PrashnaPlanet[] = [
    createPlanet({
      key: "sun",
      name: "Sun",
      longitude: sunLongitude,
      ascendantLongitude,
    }),
    createPlanet({
      key: "moon",
      name: "Moon",
      longitude: moonLongitude,
      latitude: toDegrees(moonPosition.lat),
      ascendantLongitude,
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
      retrograde: true,
    }),
    createPlanet({
      key: "ketu",
      name: "Ketu",
      longitude: rahuLongitude + 180,
      ascendantLongitude,
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
    calculationSystem:
      "Astronomia 4.2.0 Meeus/VSOP87 ephemeris, mean Lahiri ayanamsa, sidereal zodiac, whole-sign Prashna houses.",
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
    prashnaFactors: [
      `Prashna cast for ${getLocalDateTime(date, city)} at ${city.name}, ${
        city.region
      }.`,
      `${ascendant} rises at ${getDegreeInSign(
        ascendantLongitude
      )} degrees; lagna lord ${SIGN_LORDS[ascendant]} is in ${
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
    ],
    accuracyNote:
      "Chart is calculated with astronomical ephemeris and an approximate mean Lahiri ayanamsa. It is suitable for first-pass Prashna guidance; final ritual, gemstone, medical, legal, or financial decisions should be confirmed with a qualified astrologer or professional.",
  }
}
