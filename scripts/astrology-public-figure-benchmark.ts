import { buildDetailedPrashnaChart } from "../src/lib/util/vedic-astrology"

type City = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
  utcOffsetHours: number
  timeZone: string
}

type Person = {
  name: string
  birth: string
  city: City
  events: Array<{
    label: string
    date: string
    intent: keyof typeof INTENTS
  }>
}

const city = (
  id: string,
  name: string,
  region: string,
  latitude: number,
  longitude: number,
  utcOffsetHours: number,
  timeZone: string
): City => ({ id, name, region, latitude, longitude, utcOffsetHours, timeZone })

const INTENTS = {
  career: {
    houses: [1, 3, 6, 9, 10, 11],
    planets: ["Sun", "Mercury", "Saturn", "Mars", "Rahu", "Jupiter"],
  },
  wealth: {
    houses: [2, 5, 9, 10, 11],
    planets: ["Jupiter", "Venus", "Mercury", "Rahu", "Sun"],
  },
  fame: {
    houses: [1, 5, 7, 9, 10, 11],
    planets: ["Sun", "Venus", "Rahu", "Jupiter", "Moon"],
  },
  crisis: {
    houses: [3, 6, 8, 10, 12],
    planets: ["Saturn", "Mars", "Rahu", "Ketu", "Sun"],
  },
  health: {
    houses: [1, 6, 8, 12],
    planets: ["Saturn", "Mars", "Rahu", "Ketu", "Moon", "Sun", "Venus"],
  },
  comeback: {
    houses: [1, 5, 6, 9, 10, 11],
    planets: ["Jupiter", "Sun", "Mars", "Rahu", "Saturn", "Venus"],
  },
} as const

const PEOPLE: Person[] = [
  {
    name: "Yuvraj Singh",
    birth: "1981-12-12T21:45:00",
    city: city("chandigarh", "Chandigarh", "India", 30.7333, 76.7794, 5.5, "Asia/Kolkata"),
    events: [
      { label: "T20 six sixes", date: "2007-09-19", intent: "fame" },
      { label: "World Cup peak", date: "2011-04-02", intent: "fame" },
      { label: "Health diagnosis period", date: "2011-11-01", intent: "health" },
      { label: "International comeback", date: "2012-09-11", intent: "comeback" },
      { label: "Retirement announcement", date: "2019-06-10", intent: "career" },
    ],
  },
  {
    name: "Amitabh Bachchan",
    birth: "1942-10-11T16:00:00",
    city: city("allahabad", "Allahabad", "India", 25.4358, 81.8463, 5.5, "Asia/Kolkata"),
    events: [
      { label: "Zanjeer breakthrough", date: "1973-05-11", intent: "fame" },
      { label: "Coolie accident", date: "1982-07-26", intent: "crisis" },
      { label: "ABCL bankruptcy period", date: "1999-01-01", intent: "crisis" },
      { label: "KBC comeback", date: "2000-07-03", intent: "comeback" },
      { label: "Padma Vibhushan period", date: "2015-04-08", intent: "fame" },
    ],
  },
  {
    name: "Rekha",
    birth: "1954-10-10T11:00:00",
    city: city("chennai", "Chennai", "India", 13.0827, 80.2707, 5.5, "Asia/Kolkata"),
    events: [
      { label: "Umrao Jaan acclaim", date: "1981-01-02", intent: "fame" },
      { label: "Khoon Bhari Maang comeback", date: "1988-08-12", intent: "comeback" },
      { label: "Personal/media crisis", date: "1990-10-02", intent: "crisis" },
      { label: "Supporting award phase", date: "1996-06-14", intent: "comeback" },
      { label: "Padma Shri period", date: "2010-01-26", intent: "fame" },
    ],
  },
  {
    name: "Steve Jobs",
    birth: "1955-02-24T19:15:00",
    city: city("san-francisco", "San Francisco", "USA", 37.7749, -122.4194, -8, "America/Los_Angeles"),
    events: [
      { label: "Apple founded", date: "1976-04-01", intent: "career" },
      { label: "Apple exit", date: "1985-09-17", intent: "crisis" },
      { label: "Apple return", date: "1997-07-09", intent: "comeback" },
      { label: "Health diagnosis period", date: "2003-10-01", intent: "health" },
      { label: "iPhone launch", date: "2007-01-09", intent: "fame" },
    ],
  },
  {
    name: "Bill Gates",
    birth: "1955-10-28T22:00:00",
    city: city("seattle", "Seattle", "USA", 47.6062, -122.3321, -8, "America/Los_Angeles"),
    events: [
      { label: "Microsoft founded", date: "1975-04-04", intent: "career" },
      { label: "Windows 95 launch", date: "1995-08-24", intent: "fame" },
      { label: "Antitrust pressure", date: "1998-05-18", intent: "crisis" },
      { label: "CEO transition", date: "2000-01-13", intent: "career" },
      { label: "Philanthropy transition", date: "2008-06-27", intent: "comeback" },
    ],
  },
  {
    name: "Elon Musk",
    birth: "1971-06-28T07:30:00",
    city: city("pretoria", "Pretoria", "South Africa", -25.7479, 28.2293, 2, "Africa/Johannesburg"),
    events: [
      { label: "PayPal sale", date: "2002-10-03", intent: "wealth" },
      { label: "SpaceX first orbital success", date: "2008-09-28", intent: "comeback" },
      { label: "Tesla IPO", date: "2010-06-29", intent: "career" },
      { label: "Tesla crisis year", date: "2018-08-07", intent: "crisis" },
      { label: "Twitter acquisition", date: "2022-10-27", intent: "career" },
    ],
  },
  {
    name: "Oprah Winfrey",
    birth: "1954-01-29T04:30:00",
    city: city("kosciusko", "Kosciusko", "USA", 33.058, -89.5876, -6, "America/Chicago"),
    events: [
      { label: "National show launch", date: "1986-09-08", intent: "fame" },
      { label: "Harpo ownership rise", date: "1988-09-01", intent: "wealth" },
      { label: "Beloved film phase", date: "1998-10-16", intent: "career" },
      { label: "OWN launch", date: "2011-01-01", intent: "career" },
      { label: "Golden Globes speech", date: "2018-01-07", intent: "fame" },
    ],
  },
  {
    name: "Barack Obama",
    birth: "1961-08-04T19:24:00",
    city: city("honolulu", "Honolulu", "USA", 21.3069, -157.8583, -10, "Pacific/Honolulu"),
    events: [
      { label: "Senate keynote", date: "2004-07-27", intent: "fame" },
      { label: "Presidential election", date: "2008-11-04", intent: "career" },
      { label: "Nobel Peace Prize", date: "2009-10-09", intent: "fame" },
      { label: "Re-election", date: "2012-11-06", intent: "career" },
      { label: "Post-presidency transition", date: "2017-01-20", intent: "comeback" },
    ],
  },
  {
    name: "Madonna",
    birth: "1958-08-16T07:05:00",
    city: city("bay-city", "Bay City", "USA", 43.5945, -83.8889, -5, "America/Detroit"),
    events: [
      { label: "Like a Virgin rise", date: "1984-11-12", intent: "fame" },
      { label: "Erotica controversy", date: "1992-10-20", intent: "crisis" },
      { label: "Ray of Light acclaim", date: "1998-02-22", intent: "comeback" },
      { label: "Confessions era", date: "2005-11-15", intent: "fame" },
      { label: "Health tour postponement", date: "2023-06-24", intent: "health" },
    ],
  },
  {
    name: "Lance Armstrong",
    birth: "1971-09-18T12:00:00",
    city: city("plano", "Plano", "USA", 33.0198, -96.6989, -5, "America/Chicago"),
    events: [
      { label: "Health diagnosis", date: "1996-10-02", intent: "health" },
      { label: "Tour de France comeback win", date: "1999-07-25", intent: "comeback" },
      { label: "Seventh Tour title period", date: "2005-07-24", intent: "fame" },
      { label: "USADA sanction", date: "2012-08-24", intent: "crisis" },
      { label: "Public confession", date: "2013-01-17", intent: "crisis" },
    ],
  },
]

const toUtcDate = (localIso: string, utcOffsetHours: number) =>
  new Date(new Date(localIso).getTime() - utcOffsetHours * 60 * 60 * 1000)

const getPlanet = (chart: any, name: string) =>
  chart.planets.find((planet: any) => planet.name === name)

const ownedHouses = (chart: any, planetName: string) =>
  chart.houses
    .filter((house: any) => house.signLord === planetName)
    .map((house: any) => house.house)

const scorePeriod = (chart: any, lord: string, intent: keyof typeof INTENTS) => {
  const config = INTENTS[intent]
  const planet = getPlanet(chart, lord)
  const house = planet?.bhavaHouse || planet?.house
  const owns = ownedHouses(chart, lord)
  const houseHits = [house, ...owns].filter((item) =>
    config.houses.includes(Number(item) as never)
  ).length
  const naturalHit = config.planets.includes(lord as never) ? 1 : 0

  return houseHits * 2 + naturalHit * 1.5
}

const evaluateEvent = (person: Person, event: Person["events"][number]) => {
  const chart = buildDetailedPrashnaChart({
    city: person.city as any,
    date: toUtcDate(person.birth, person.city.utcOffsetHours),
    dashaDate: new Date(`${event.date}T12:00:00.000Z`),
    panchangSystemId: "lahiri-mean",
  })
  const dasha = chart.dasha
  const periods = [
    dasha?.mahadasha?.lord,
    dasha?.antardasha?.lord,
    dasha?.pratyantar?.lord,
  ].filter(Boolean) as string[]
  const scores = periods.map((lord) => ({
    lord,
    score: scorePeriod(chart, lord, event.intent),
  }))
  const total = scores.reduce((sum, item, index) => sum + item.score * [1, 1.35, 1.1][index], 0)
  const verdict = total >= 7 ? "hit" : total >= 4 ? "partial" : "miss"

  return {
    person: person.name,
    event: event.label,
    date: event.date,
    intent: event.intent,
    dasha: scores.map((item) => `${item.lord}:${item.score}`).join(" / "),
    verdict,
    total: Number(total.toFixed(2)),
  }
}

const rows = PEOPLE.flatMap((person) =>
  person.events.map((event) => evaluateEvent(person, event))
)
const hits = rows.filter((row) => row.verdict === "hit").length
const partials = rows.filter((row) => row.verdict === "partial").length
const misses = rows.filter((row) => row.verdict === "miss").length
const weighted = ((hits + partials * 0.5) / rows.length) * 100

console.table(rows)
console.log(
  JSON.stringify(
    {
      events: rows.length,
      hits,
      partials,
      misses,
      strictDashaThemeMatch: Math.round((hits / rows.length) * 100),
      weightedDashaThemeMatch: Math.round(weighted),
      note:
        "Seed benchmark for deterministic dasha-house theme matching only. This is not full Kundli prediction accuracy. Some public birth times are disputed; use this as a regression harness, not a scientific proof claim.",
    },
    null,
    2
  )
)
