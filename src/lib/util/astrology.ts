import { INDIA_ASTROLOGY_CITIES } from "./india-astrology-cities"
import {
  NEPAL_ASTROLOGY_CITIES,
  SRI_LANKA_ASTROLOGY_CITIES,
} from "./south-asia-astrology-cities"

export type AstrologyCity = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
  timeZone: string
  utcOffsetHours: number
}

export type ChoghadiyaName =
  | "Amrit"
  | "Shubh"
  | "Labh"
  | "Char"
  | "Kaal"
  | "Rog"
  | "Udveg"

export type MuhurtaSlot = {
  index: number
  name: ChoghadiyaName | string
  startMinute: number
  endMinute: number
  startLabel: string
  endLabel: string
  quality: "auspicious" | "neutral" | "avoid"
  note: string
}

export type DailyMuhurat = {
  city: AstrologyCity
  date: string
  weekday: string
  sunriseMinute: number
  sunsetMinute: number
  nextSunriseMinute: number
  sunriseLabel: string
  sunsetLabel: string
  daySlots: MuhurtaSlot[]
  nightSlots: MuhurtaSlot[]
  muhurtaSlots: MuhurtaSlot[]
}

export type HindiMonthInfo = {
  name: string
  commonName: string
  sunSign: string
  significance: string
  focus: string
  festivals: string[]
}

export type HindiCalendarDay = {
  date: string
  city: AstrologyCity
  weekday: string
  tithi: string
  paksha: "Shukla" | "Krishna"
  month: HindiMonthInfo
  nakshatra: string
  yoga: string
  karana: string
  note: string
}

export type PrashnaChart = {
  generatedAtIso: string
  generatedAtLocal: string
  city: AstrologyCity
  panchangSystem?: PanchangSystem
  houseSystem?: HouseSystem
  calculationSystem: string
  weekday: string
  ayanamsa: number
  ascendant: string
  ascendantDegree: number
  ascendantLongitude: number
  ascendantNakshatra: string
  ascendantPada: number
  moonSign: string
  moonDegree: number
  moonLongitude: number
  sunSign: string
  sunDegree: number
  sunLongitude: number
  nakshatra: string
  nakshatraPada: number
  tithi: string
  paksha: "Shukla" | "Krishna"
  yoga: string
  karana: string
  planets: PrashnaPlanet[]
  houses: PrashnaHouse[]
  aspects?: GrahaAspect[]
  houseSynthesis?: HouseSynthesis[]
  dasha?: VimshottariDasha
  prashnaFactors: string[]
  accuracyNote: string
}

export type PanchangSystemId =
  | "lahiri-mean"
  | "rishikesh-lahiri"
  | "raman"
  | "kp-lahiri"

export type HouseSystemId = "whole-sign" | "sripati-bhava"

export type HouseSystem = {
  id: HouseSystemId
  label: string
  shortLabel: string
  description: string
}

export type PanchangSystem = {
  id: PanchangSystemId
  label: string
  shortLabel: string
  description: string
  ayanamsaOffsetDegrees: number
  houseSystemId: HouseSystemId
}

export const HOUSE_SYSTEMS: HouseSystem[] = [
  {
    id: "whole-sign",
    label: "Whole-sign houses",
    shortLabel: "Rashi",
    description:
      "Each sign from the Lagna becomes one house. This is stable for rashi-based yoga reading.",
  },
  {
    id: "sripati-bhava",
    label: "Sripati Bhava Chalit",
    shortLabel: "Bhava",
    description:
      "Unequal bhava houses using Lagna and MC quadrants. This can move planets between houses near bhava boundaries.",
  },
]

export const PANCHANG_SYSTEMS: PanchangSystem[] = [
  {
    id: "lahiri-mean",
    label: "Astronomical Lahiri",
    shortLabel: "Lahiri",
    description:
      "Current engine: sidereal zodiac with mean Lahiri ayanamsa and astronomical ephemeris.",
    ayanamsaOffsetDegrees: 0,
    houseSystemId: "whole-sign",
  },
  {
    id: "rishikesh-lahiri",
    label: "Rishikesh Panchang style",
    shortLabel: "Rishikesh",
    description:
      "Lahiri/Chitra Paksha reference with Sripati Bhava Chalit houses for users comparing printed-panchang house placement. Exact edition rules should be verified for borderline cases.",
    ayanamsaOffsetDegrees: 0,
    houseSystemId: "sripati-bhava",
  },
  {
    id: "raman",
    label: "B. V. Raman ayanamsa",
    shortLabel: "Raman",
    description:
      "Alternative ayanamsa used by some astrologers. This can move sensitive lagna/nakshatra boundaries.",
    ayanamsaOffsetDegrees: -1.45,
    houseSystemId: "whole-sign",
  },
  {
    id: "kp-lahiri",
    label: "KP Lahiri",
    shortLabel: "KP",
    description:
      "KP-style Lahiri offset for users comparing KP-oriented readings and house sensitivities.",
    ayanamsaOffsetDegrees: -0.1,
    houseSystemId: "sripati-bhava",
  },
]

export const getPanchangSystem = (id?: string | null) =>
  PANCHANG_SYSTEMS.find((system) => system.id === id) || PANCHANG_SYSTEMS[0]

export const getHouseSystem = (id?: string | null) =>
  HOUSE_SYSTEMS.find((system) => system.id === id) || HOUSE_SYSTEMS[0]

export type GrahaAspect = {
  fromPlanet: string
  fromHouse: number
  fromSign: string
  toHouse: number
  toSign: string
  aspectType: "7th" | "special" | "node-special"
  strength: "full"
  theme: string
  interpretation: string
}

export type HouseSynthesis = {
  house: number
  sign: string
  signLord: string
  theme: string
  planetsPlaced: string[]
  aspectsReceived: GrahaAspect[]
  synthesis: string
}

export type PrashnaPlanet = {
  key: string
  name: string
  longitude: number
  latitude?: number
  sign: string
  signDegree: number
  nakshatra: string
  pada: number
  house: number
  rashiHouse?: number
  bhavaHouse?: number
  bhavaCuspLongitude?: number
  bhavaCuspDegree?: number
  bhavaStartLongitude?: number
  bhavaEndLongitude?: number
  bhavaDistanceFromCusp?: number
  bhavaImpactPercent?: number
  bhavaImpactState?: "strong" | "moderate" | "weak" | "sandhi"
  houseSystem?: HouseSystemId
  houseNote?: string
  retrograde?: boolean
  aspects?: GrahaAspect[]
}

export type PrashnaHouse = {
  house: number
  sign: string
  signLord: string
  theme: string
  cuspLongitude?: number
  cuspSign?: string
  cuspDegree?: number
  bhavaStartLongitude?: number
  bhavaEndLongitude?: number
  planetsPlaced?: string[]
  aspectsReceived?: GrahaAspect[]
  synthesis?: string
}

export type DashaPeriod = {
  lord: string
  level: "mahadasha" | "antardasha" | "pratyantar"
  startIso: string
  endIso: string
  startLabel: string
  endLabel: string
  durationYears: number
}

export type VimshottariDasha = {
  system: "Vimshottari"
  balanceAtBirth: DashaPeriod
  currentDateIso: string
  mahadasha: DashaPeriod
  antardasha: DashaPeriod
  pratyantar: DashaPeriod
  sequence: string[]
  moonNakshatraLord: string
  note: string
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

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

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
]

export const YOGAS = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyan",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
]

export const KARANAS = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
]

export const SIGN_LORDS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
}

export const HOUSE_THEMES = [
  "Questioner, body, intent, immediate direction",
  "Speech, resources, family, value",
  "Effort, courage, communication, siblings",
  "Home, land, emotional base, vehicles",
  "Intelligence, children, mantra, creativity",
  "Obstacles, disease, service, dispute",
  "Partner, public dealing, agreements",
  "Sudden events, hidden matters, transformation",
  "Fortune, dharma, teacher, long travel",
  "Action, profession, authority, outcome visibility",
  "Gains, network, fulfillment",
  "Loss, isolation, sleep, foreign matters",
]

const HINDI_MONTHS_BY_SUN_SIGN: Record<string, HindiMonthInfo> = {
  Pisces: {
    name: "Chaitra",
    commonName: "Chait",
    sunSign: "Pisces",
    significance:
      "Chaitra begins the traditional Hindu year in many panchang traditions and is associated with renewal, Navratri, Ram Navami, and fresh sankalpa.",
    focus: "Renewal, discipline, worship, and beginning clean routines.",
    festivals: ["Chaitra Navratri", "Ram Navami", "Hanuman Jayanti"],
  },
  Aries: {
    name: "Vaishakha",
    commonName: "Baisakh",
    sunSign: "Aries",
    significance:
      "Vaishakha is praised for snan, daan, japa, Akshaya Tritiya, and steady punya-oriented work.",
    focus: "Charity, purity, water offering, and stable prosperity.",
    festivals: ["Akshaya Tritiya", "Parashurama Jayanti", "Buddha Purnima"],
  },
  Taurus: {
    name: "Jyeshtha",
    commonName: "Jeth",
    sunSign: "Taurus",
    significance:
      "Jyeshtha falls in the intense summer period and emphasizes water charity, protection from heat, restraint, Vat Savitri, and Ganga Dussehra observances.",
    focus: "Cooling care, patience, protection, and family wellbeing.",
    festivals: ["Ganga Dussehra", "Nirjala Ekadashi", "Vat Savitri Vrat"],
  },
  Gemini: {
    name: "Ashadha",
    commonName: "Asadh",
    sunSign: "Gemini",
    significance:
      "Ashadha carries Guru Purnima energy and leads into Chaturmas, a period for learning, vows, and spiritual steadiness.",
    focus: "Guru bhakti, study, vows, and inner discipline.",
    festivals: ["Jagannath Rath Yatra", "Devshayani Ekadashi", "Guru Purnima"],
  },
  Cancer: {
    name: "Shravana",
    commonName: "Sawan",
    sunSign: "Cancer",
    significance:
      "Shravana is deeply connected with Shiva worship, rainfall, greenery, fasting, and devotional practice.",
    focus: "Shiva bhakti, healing, devotion, and simple living.",
    festivals: ["Shravan Somwar", "Nag Panchami", "Raksha Bandhan"],
  },
  Leo: {
    name: "Bhadrapada",
    commonName: "Bhado",
    sunSign: "Leo",
    significance:
      "Bhadrapada is known for Shri Krishna, Ganesha Chaturthi, Anant Chaturdashi, and dharmic household observances.",
    focus: "Wisdom, remover-of-obstacles worship, and family dharma.",
    festivals: ["Krishna Janmashtami", "Ganesh Chaturthi", "Anant Chaturdashi"],
  },
  Virgo: {
    name: "Ashwin",
    commonName: "Asoj",
    sunSign: "Virgo",
    significance:
      "Ashwin includes Pitru Paksha, Sharad Navratri, and Vijayadashami, balancing ancestral remembrance with Devi worship.",
    focus: "Ancestral gratitude, Devi sadhana, and victory over inertia.",
    festivals: ["Pitru Paksha", "Sharad Navratri", "Vijayadashami"],
  },
  Libra: {
    name: "Kartik",
    commonName: "Kartik",
    sunSign: "Libra",
    significance:
      "Kartik is treasured for deepdaan, Tulsi worship, Govardhan, and devotion around light, purity, and bhakti.",
    focus: "Light, devotion, gratitude, and sacred household rituals.",
    festivals: ["Diwali", "Govardhan Puja", "Tulsi Vivah"],
  },
  Scorpio: {
    name: "Margashirsha",
    commonName: "Agahan",
    sunSign: "Scorpio",
    significance:
      "Margashirsha is associated with Krishna bhakti, Gita Jayanti, and quiet nourishment of faith and knowledge.",
    focus: "Learning, Krishna smaran, and grounded prosperity.",
    festivals: ["Gita Jayanti", "Vivah Panchami", "Margashirsha Lakshmi Vrat"],
  },
  Sagittarius: {
    name: "Pausha",
    commonName: "Pus",
    sunSign: "Sagittarius",
    significance:
      "Pausha is a winter month for Surya worship, discipline, warmth, and preserving health through restrained living.",
    focus: "Health, warmth, Surya upasana, and restraint.",
    festivals: ["Pausha Putrada Ekadashi", "Makar Sankranti season", "Surya worship"],
  },
  Capricorn: {
    name: "Magha",
    commonName: "Magh",
    sunSign: "Capricorn",
    significance:
      "Magha is known for sacred bathing, daan, Mauni Amavasya, and deep purification practices.",
    focus: "Purification, silence, charity, and ancestral respect.",
    festivals: ["Mauni Amavasya", "Vasant Panchami", "Magha Purnima"],
  },
  Aquarius: {
    name: "Phalguna",
    commonName: "Phagun",
    sunSign: "Aquarius",
    significance:
      "Phalguna brings Holika, Holi, seasonal transition, forgiveness, joy, and completion before the new yearly cycle.",
    focus: "Joy, forgiveness, completion, and community harmony.",
    festivals: ["Maha Shivratri", "Holika Dahan", "Holi"],
  },
}

export const getHindiMonthInfoBySunSign = (sunSign: string) =>
  HINDI_MONTHS_BY_SUN_SIGN[sunSign] || HINDI_MONTHS_BY_SUN_SIGN.Pisces

export const ASTROLOGY_CITIES: AstrologyCity[] = [
  ...INDIA_ASTROLOGY_CITIES,
  ...NEPAL_ASTROLOGY_CITIES,
  ...SRI_LANKA_ASTROLOGY_CITIES,
]

const DAY_SEQUENCES: Record<number, ChoghadiyaName[]> = {
  0: ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],
  1: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"],
  2: ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],
  3: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],
  4: ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"],
  5: ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"],
  6: ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"],
}

const NIGHT_SEQUENCES: Record<number, ChoghadiyaName[]> = {
  0: ["Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh"],
  1: ["Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char"],
  2: ["Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal"],
  3: ["Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"],
  4: ["Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"],
  5: ["Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog"],
  6: ["Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh"],
}

const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360
const toRadians = (value: number) => (Math.PI / 180) * value
const toDegrees = (value: number) => (180 / Math.PI) * value

export const getCityById = (cityId?: string) =>
  ASTROLOGY_CITIES.find((city) => city.id === cityId) || ASTROLOGY_CITIES[0]

export const getTodayDateString = (date = new Date(), timeZone = "Asia/Kolkata") => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value

  return `${get("year")}-${get("month")}-${get("day")}`
}

const parseDateParts = (date: string) => {
  const [year, month, day] = date.split("-").map(Number)

  return { year, month, day }
}

const dayOfYear = ({ year, month, day }: { year: number; month: number; day: number }) => {
  const current = Date.UTC(year, month - 1, day)
  const start = Date.UTC(year, 0, 0)

  return Math.floor((current - start) / 86400000)
}

const getWeekdayIndex = (date: string) => {
  const { year, month, day } = parseDateParts(date)

  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

const calculateSunTime = ({
  date,
  city,
  isSunrise,
}: {
  date: string
  city: AstrologyCity
  isSunrise: boolean
}) => {
  const parts = parseDateParts(date)
  const zenith = 90.833
  const n = dayOfYear(parts)
  const lngHour = city.longitude / 15
  const t = n + ((isSunrise ? 6 : 18) - lngHour) / 24
  const m = 0.9856 * t - 3.289
  let l =
    m +
    1.916 * Math.sin(toRadians(m)) +
    0.02 * Math.sin(toRadians(2 * m)) +
    282.634
  l = normalizeDegrees(l)

  let ra = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(l))))
  ra = normalizeDegrees(ra)
  const lQuadrant = Math.floor(l / 90) * 90
  const raQuadrant = Math.floor(ra / 90) * 90
  ra = (ra + lQuadrant - raQuadrant) / 15

  const sinDec = 0.39782 * Math.sin(toRadians(l))
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH =
    (Math.cos(toRadians(zenith)) -
      sinDec * Math.sin(toRadians(city.latitude))) /
    (cosDec * Math.cos(toRadians(city.latitude)))

  if (cosH > 1 || cosH < -1) {
    return isSunrise ? 6 * 60 : 18 * 60
  }

  let h = isSunrise ? 360 - toDegrees(Math.acos(cosH)) : toDegrees(Math.acos(cosH))
  h /= 15

  const localHours =
    h + ra - 0.06571 * t - 6.622 - lngHour + city.utcOffsetHours
  const normalizedHours = ((localHours % 24) + 24) % 24

  return Math.round(normalizedHours * 60)
}

const addDays = (date: string, days: number) => {
  const { year, month, day } = parseDateParts(date)
  const next = new Date(Date.UTC(year, month - 1, day + days))

  return next.toISOString().slice(0, 10)
}

export const formatMinuteLabel = (minute: number) => {
  const dayOffset = Math.floor(minute / 1440)
  const normalized = ((Math.round(minute) % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const prefix = dayOffset > 0 ? "Next day " : ""

  return `${prefix}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

const getQuality = (name: string): MuhurtaSlot["quality"] => {
  if (["Amrit", "Shubh", "Labh", "Char"].includes(name)) {
    return "auspicious"
  }

  return name === "Kaal" || name === "Rog" || name === "Udveg"
    ? "avoid"
    : "neutral"
}

const getNote = (name: string) => {
  switch (name) {
    case "Amrit":
      return "Best for important beginnings, worship, and high-intent work."
    case "Shubh":
      return "Good for positive starts, meetings, and household decisions."
    case "Labh":
      return "Good for business, purchases, learning, and gains."
    case "Char":
      return "Good for travel, movement, calls, and quick action."
    case "Kaal":
      return "Avoid starting sensitive or high-value work."
    case "Rog":
      return "Avoid new commitments; keep focus on repair and caution."
    case "Udveg":
      return "Restless window; avoid conflict-heavy decisions."
    default:
      return "Use this as a short 48-minute planning window."
  }
}

const createSlots = ({
  start,
  end,
  names,
}: {
  start: number
  end: number
  names: string[]
}) => {
  const duration = (end - start) / names.length

  return names.map((name, index) => {
    const startMinute = start + duration * index
    const endMinute = start + duration * (index + 1)

    return {
      index: index + 1,
      name,
      startMinute,
      endMinute,
      startLabel: formatMinuteLabel(startMinute),
      endLabel: formatMinuteLabel(endMinute),
      quality: getQuality(name),
      note: getNote(name),
    }
  })
}

export const calculateDailyMuhurat = ({
  city,
  date,
}: {
  city: AstrologyCity
  date: string
}): DailyMuhurat => {
  const weekdayIndex = getWeekdayIndex(date)
  const sunriseMinute = calculateSunTime({ date, city, isSunrise: true })
  const sunsetMinute = calculateSunTime({ date, city, isSunrise: false })
  const nextSunriseMinute =
    1440 +
    calculateSunTime({
      date: addDays(date, 1),
      city,
      isSunrise: true,
    })

  const daySlots = createSlots({
    start: sunriseMinute,
    end: sunsetMinute,
    names: DAY_SEQUENCES[weekdayIndex],
  }) as MuhurtaSlot[]
  const nightSlots = createSlots({
    start: sunsetMinute,
    end: nextSunriseMinute,
    names: NIGHT_SEQUENCES[weekdayIndex],
  }) as MuhurtaSlot[]
  const muhurtaSlots = createSlots({
    start: sunriseMinute,
    end: nextSunriseMinute,
    names: Array.from({ length: 30 }, (_, index) => `Muhurta ${index + 1}`),
  }) as MuhurtaSlot[]

  return {
    city,
    date,
    weekday: WEEKDAYS[weekdayIndex],
    sunriseMinute,
    sunsetMinute,
    nextSunriseMinute,
    sunriseLabel: formatMinuteLabel(sunriseMinute),
    sunsetLabel: formatMinuteLabel(sunsetMinute),
    daySlots,
    nightSlots,
    muhurtaSlots,
  }
}

const julianDay = (date: Date) => date.getTime() / 86400000 + 2440587.5

export const getSignFromDegree = (degree: number) =>
  SIGNS[Math.floor(normalizeDegrees(degree) / 30)]

export const getDegreeInSign = (degree: number) =>
  Number((normalizeDegrees(degree) % 30).toFixed(2))

export const getNakshatraFromDegree = (degree: number) => {
  const normalized = normalizeDegrees(degree)
  const span = 360 / 27
  const index = Math.floor(normalized / span)
  const pada = Math.floor((normalized % span) / (span / 4)) + 1

  return {
    name: NAKSHATRAS[index] || "Unknown",
    pada,
  }
}

export const buildPrashnaChart = ({
  city,
  date = new Date(),
}: {
  city: AstrologyCity
  date?: Date
}): PrashnaChart => {
  const jd = julianDay(date)
  const daysSinceJ2000 = jd - 2451545
  const gmstHours =
    18.697374558 + 24.06570982441908 * daysSinceJ2000
  const localSiderealDegree = normalizeDegrees(gmstHours * 15 + city.longitude)
  const ayanamsa = 24.1
  const ascendantLongitude = normalizeDegrees(localSiderealDegree - ayanamsa)
  const sunLongitude = normalizeDegrees(
    280.46646 + 0.98564736 * daysSinceJ2000 - ayanamsa
  )
  const moonLongitude = normalizeDegrees(
    218.316 + 13.176396 * daysSinceJ2000 - ayanamsa
  )
  const tithiIndex =
    Math.floor(normalizeDegrees(moonLongitude - sunLongitude) / 12) + 1
  const pakshaTithi = tithiIndex > 15 ? tithiIndex - 15 : tithiIndex
  const nakshatraIndex = Math.floor(moonLongitude / (360 / 27))
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: city.timeZone,
    weekday: "long",
  }).format(date)

  return {
    generatedAtIso: date.toISOString(),
    generatedAtLocal: new Intl.DateTimeFormat("en-IN", {
      timeZone: city.timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date),
    city,
    calculationSystem:
      "Approximate sidereal prashna chart using mean Lahiri ayanamsa. Production AI uses chart data as guidance, not certainty.",
    weekday,
    ayanamsa,
    ascendant: getSignFromDegree(ascendantLongitude),
    ascendantDegree: getDegreeInSign(ascendantLongitude),
    ascendantLongitude: Number(ascendantLongitude.toFixed(2)),
    ascendantNakshatra: getNakshatraFromDegree(ascendantLongitude).name,
    ascendantPada: getNakshatraFromDegree(ascendantLongitude).pada,
    moonSign: getSignFromDegree(moonLongitude),
    moonDegree: getDegreeInSign(moonLongitude),
    moonLongitude: Number(moonLongitude.toFixed(2)),
    sunSign: getSignFromDegree(sunLongitude),
    sunDegree: getDegreeInSign(sunLongitude),
    sunLongitude: Number(sunLongitude.toFixed(2)),
    nakshatra: NAKSHATRAS[nakshatraIndex] || "Unknown",
    nakshatraPada: getNakshatraFromDegree(moonLongitude).pada,
    tithi: `${pakshaTithi} ${tithiIndex <= 15 ? "Shukla" : "Krishna"}`,
    paksha: tithiIndex <= 15 ? "Shukla" : "Krishna",
    yoga: "Not calculated in fallback mode",
    karana: "Not calculated in fallback mode",
    planets: [],
    houses: [],
    prashnaFactors: [
      "Fallback chart is approximate. Use the production server chart for detailed reading.",
    ],
    accuracyNote:
      "This fallback avoids blank UI only. Server-side Prashna uses astronomia for richer ephemeris-style calculations.",
  }
}
