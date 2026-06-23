import fs from "node:fs"
import path from "node:path"
import { buildDetailedPrashnaChart } from "../src/lib/util/vedic-astrology"

type SuiteResult = {
  suite: string
  passed: number
  total: number
  score: number
  notes: string[]
}

type City = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
  utcOffsetHours: number
  timeZone: string
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
  career: { houses: [1, 3, 6, 9, 10, 11], planets: ["Sun", "Mercury", "Saturn", "Mars", "Rahu", "Jupiter"] },
  wealth: { houses: [2, 5, 9, 10, 11], planets: ["Jupiter", "Venus", "Mercury", "Rahu", "Sun"] },
  fame: { houses: [1, 5, 7, 9, 10, 11], planets: ["Sun", "Venus", "Rahu", "Jupiter", "Moon"] },
  leadership: { houses: [1, 3, 5, 9, 10, 11], planets: ["Sun", "Mars", "Jupiter", "Saturn", "Rahu"] },
  crisis: { houses: [3, 6, 8, 10, 12], planets: ["Saturn", "Mars", "Rahu", "Ketu", "Sun"] },
  health: { houses: [1, 6, 8, 12], planets: ["Saturn", "Mars", "Rahu", "Ketu", "Moon", "Sun", "Venus"] },
  relationship: { houses: [2, 4, 7, 8, 12], planets: ["Venus", "Jupiter", "Mars", "Saturn", "Rahu", "Ketu"] },
  comeback: { houses: [1, 5, 6, 9, 10, 11], planets: ["Jupiter", "Sun", "Mars", "Rahu", "Saturn", "Venus"] },
} as const

const PEOPLE = [
  {
    name: "Mahatma Gandhi",
    birth: "1869-10-02T07:12:00",
    city: city("porbandar", "Porbandar", "India", 21.6417, 69.6293, 5.5, "Asia/Kolkata"),
    expectedLifeAreas: ["leadership", "fame", "career", "crisis"],
    events: [
      ["South Africa public-work turning point", "1893-05-24", "career"],
      ["Champaran leadership", "1917-04-10", "leadership"],
      ["Salt March", "1930-03-12", "fame"],
      ["Quit India detention", "1942-08-09", "crisis"],
      ["Final violent crisis", "1948-01-30", "crisis"],
    ],
  },
  {
    name: "Narendra Modi",
    birth: "1950-09-17T11:00:00",
    city: city("vadnagar", "Vadnagar", "India", 23.785, 72.6389, 5.5, "Asia/Kolkata"),
    expectedLifeAreas: ["leadership", "fame", "career", "crisis"],
    events: [
      ["Became Gujarat chief minister", "2001-10-07", "career"],
      ["Major political crisis", "2002-02-27", "crisis"],
      ["First national election victory", "2014-05-16", "leadership"],
      ["National re-election", "2019-05-23", "fame"],
      ["Coalition-era transition", "2024-06-04", "career"],
    ],
  },
  {
    name: "Adolf Hitler",
    birth: "1889-04-20T18:30:00",
    city: city("braunau", "Braunau am Inn", "Austria", 48.2583, 13.035, 1, "Europe/Vienna"),
    expectedLifeAreas: ["leadership", "fame", "career", "crisis"],
    events: [
      ["Beer Hall Putsch", "1923-11-08", "crisis"],
      ["Imprisonment period", "1924-04-01", "crisis"],
      ["Became chancellor", "1933-01-30", "career"],
      ["War escalation", "1939-09-01", "crisis"],
      ["Final collapse", "1945-04-30", "crisis"],
    ],
  },
  {
    name: "Yuvraj Singh",
    birth: "1981-12-12T21:45:00",
    city: city("chandigarh", "Chandigarh", "India", 30.7333, 76.7794, 5.5, "Asia/Kolkata"),
    expectedLifeAreas: ["fame", "health", "comeback", "career"],
    events: [
      ["T20 six sixes", "2007-09-19", "fame"],
      ["World Cup peak", "2011-04-02", "fame"],
      ["Health diagnosis period", "2011-11-01", "health"],
      ["International comeback", "2012-09-11", "comeback"],
      ["Retirement announcement", "2019-06-10", "career"],
    ],
  },
  {
    name: "Amitabh Bachchan",
    birth: "1942-10-11T16:00:00",
    city: city("allahabad", "Allahabad", "India", 25.4358, 81.8463, 5.5, "Asia/Kolkata"),
    expectedLifeAreas: ["fame", "crisis", "comeback", "career"],
    events: [
      ["Zanjeer breakthrough", "1973-05-11", "fame"],
      ["Coolie accident", "1982-07-26", "crisis"],
      ["ABCL bankruptcy period", "1999-01-01", "crisis"],
      ["KBC comeback", "2000-07-03", "comeback"],
      ["Padma Vibhushan period", "2015-04-08", "fame"],
    ],
  },
  {
    name: "Rekha",
    birth: "1954-10-10T11:00:00",
    city: city("chennai", "Chennai", "India", 13.0827, 80.2707, 5.5, "Asia/Kolkata"),
    expectedLifeAreas: ["fame", "comeback", "relationship", "crisis"],
    events: [
      ["Umrao Jaan acclaim", "1981-01-02", "fame"],
      ["Khoon Bhari Maang comeback", "1988-08-12", "comeback"],
      ["Husband death and media crisis", "1990-10-02", "relationship"],
      ["Personal/media crisis", "1990-10-02", "crisis"],
      ["Padma Shri period", "2010-01-26", "fame"],
    ],
  },
  {
    name: "Barack Obama",
    birth: "1961-08-04T19:24:00",
    city: city("honolulu", "Honolulu", "USA", 21.3069, -157.8583, -10, "Pacific/Honolulu"),
    expectedLifeAreas: ["career", "fame", "comeback"],
    events: [
      ["Senate keynote", "2004-07-27", "fame"],
      ["Presidential election", "2008-11-04", "career"],
      ["Nobel Peace Prize", "2009-10-09", "fame"],
      ["Re-election", "2012-11-06", "career"],
      ["Post-presidency transition", "2017-01-20", "comeback"],
    ],
  },
  {
    name: "Steve Jobs",
    birth: "1955-02-24T19:15:00",
    city: city("san-francisco", "San Francisco", "USA", 37.7749, -122.4194, -8, "America/Los_Angeles"),
    expectedLifeAreas: ["career", "crisis", "comeback", "health", "fame"],
    events: [
      ["Apple founded", "1976-04-01", "career"],
      ["Apple exit", "1985-09-17", "crisis"],
      ["Apple return", "1997-07-09", "comeback"],
      ["Health diagnosis period", "2003-10-01", "health"],
      ["iPhone launch", "2007-01-09", "fame"],
    ],
  },
  {
    name: "Bill Gates",
    birth: "1955-10-28T22:00:00",
    city: city("seattle", "Seattle", "USA", 47.6062, -122.3321, -8, "America/Los_Angeles"),
    expectedLifeAreas: ["career", "wealth", "fame", "crisis"],
    events: [
      ["Microsoft founded", "1975-04-04", "career"],
      ["Windows 95 launch", "1995-08-24", "fame"],
      ["Antitrust pressure", "1998-05-18", "crisis"],
      ["CEO transition", "2000-01-13", "career"],
      ["Philanthropy transition", "2008-06-27", "comeback"],
    ],
  },
  {
    name: "Elon Musk",
    birth: "1971-06-28T07:30:00",
    city: city("pretoria", "Pretoria", "South Africa", -25.7479, 28.2293, 2, "Africa/Johannesburg"),
    expectedLifeAreas: ["wealth", "career", "crisis", "comeback"],
    events: [
      ["PayPal sale", "2002-10-03", "wealth"],
      ["SpaceX first orbital success", "2008-09-28", "comeback"],
      ["Tesla IPO", "2010-06-29", "career"],
      ["Tesla crisis year", "2018-08-07", "crisis"],
      ["Twitter acquisition", "2022-10-27", "career"],
    ],
  },
  {
    name: "Oprah Winfrey",
    birth: "1954-01-29T04:30:00",
    city: city("kosciusko", "Kosciusko", "USA", 33.058, -89.5876, -6, "America/Chicago"),
    expectedLifeAreas: ["fame", "wealth", "career"],
    events: [
      ["National show launch", "1986-09-08", "fame"],
      ["Harpo ownership rise", "1988-09-01", "wealth"],
      ["Beloved film phase", "1998-10-16", "career"],
      ["OWN launch", "2011-01-01", "career"],
      ["Golden Globes speech", "2018-01-07", "fame"],
    ],
  },
  {
    name: "Madonna",
    birth: "1958-08-16T07:05:00",
    city: city("bay-city", "Bay City", "USA", 43.5945, -83.8889, -5, "America/Detroit"),
    expectedLifeAreas: ["fame", "crisis", "comeback", "health"],
    events: [
      ["Like a Virgin rise", "1984-11-12", "fame"],
      ["Erotica controversy", "1992-10-20", "crisis"],
      ["Ray of Light acclaim", "1998-02-22", "comeback"],
      ["Confessions era", "2005-11-15", "fame"],
      ["Health tour postponement", "2023-06-24", "health"],
    ],
  },
  {
    name: "Lance Armstrong",
    birth: "1971-09-18T12:00:00",
    city: city("plano", "Plano", "USA", 33.0198, -96.6989, -5, "America/Chicago"),
    expectedLifeAreas: ["health", "comeback", "fame", "crisis"],
    events: [
      ["Health diagnosis", "1996-10-02", "health"],
      ["Tour de France comeback win", "1999-07-25", "comeback"],
      ["Seventh Tour title period", "2005-07-24", "fame"],
      ["USADA sanction", "2012-08-24", "crisis"],
      ["Public confession", "2013-01-17", "crisis"],
    ],
  },
] as const

const repo = process.cwd()
const route = fs.readFileSync(path.join(repo, "src/app/api/astrology/kundli/route.ts"), "utf8")
const prashnaRoute = fs.readFileSync(path.join(repo, "src/app/api/astrology/prashna/route.ts"), "utf8")
const matchRoute = fs.readFileSync(path.join(repo, "src/app/api/astrology/matchmaking/route.ts"), "utf8")

const toUtcDate = (localIso: string, utcOffsetHours: number) =>
  new Date(new Date(localIso).getTime() - utcOffsetHours * 60 * 60 * 1000)

const getPlanet = (chart: any, name: string) =>
  chart.planets.find((planet: any) => planet.name === name)

const ownedHouses = (chart: any, planetName: string) =>
  chart.houses
    .filter((house: any) => house.signLord === planetName)
    .map((house: any) => house.house)

const scoreIntent = (chart: any, lord: string, intent: keyof typeof INTENTS) => {
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

const getEventIntentScore = (
  person: (typeof PEOPLE)[number],
  event: (typeof PEOPLE)[number]["events"][number],
  intent: keyof typeof INTENTS
) => {
  const chart = buildDetailedPrashnaChart({
    city: person.city as any,
    date: toUtcDate(person.birth, person.city.utcOffsetHours),
    dashaDate: new Date(`${event[1]}T12:00:00.000Z`),
    panchangSystemId: "lahiri-mean",
  })
  const periods = [
    chart.dasha?.mahadasha?.lord,
    chart.dasha?.antardasha?.lord,
    chart.dasha?.pratyantar?.lord,
  ].filter(Boolean) as string[]
  const total = periods.reduce(
    (sum, lord, index) =>
      sum + scoreIntent(chart, lord, intent) * [1, 1.35, 1.1][index],
    0
  )

  return total
}

const evaluateEvent = (person: (typeof PEOPLE)[number], event: (typeof PEOPLE)[number]["events"][number]) => {
  const total = getEventIntentScore(
    person,
    event,
    event[2] as keyof typeof INTENTS
  )

  return total >= 7 ? 1 : total >= 4 ? 0.5 : 0
}

const biographyDiscriminationSuite = (): SuiteResult => {
  const results = PEOPLE.flatMap((person) =>
    person.events.map((event) => {
      const expectedIntent = event[2] as keyof typeof INTENTS
      const ranked = (Object.keys(INTENTS) as Array<keyof typeof INTENTS>)
        .map((intent) => ({
          intent,
          score: getEventIntentScore(person, event, intent),
        }))
        .sort((left, right) => right.score - left.score)
      const expectedRank = ranked.findIndex((item) => item.intent === expectedIntent)

      return expectedRank === 0 ? 1 : expectedRank === 1 ? 0.5 : 0
    })
  )
  const passed = results.reduce((sum, score) => sum + score, 0)

  return {
    suite: "Biography event discrimination",
    passed,
    total: results.length,
    score: Math.round((passed / results.length) * 100),
    notes: [
      "Known events are positives; all wrong life-area labels at the same date are negative controls, so broad rules are penalized for false positives.",
      "People are evaluated individually and no biography text is sent to the production answer agent. Birth-time uncertainty remains a limitation.",
    ],
  }
}

const natalEventSuite = (): SuiteResult => {
  const scores = PEOPLE.flatMap((person) =>
    person.events.map((event) => evaluateEvent(person, event))
  )
  const passed = scores.reduce((sum, score) => sum + score, 0)

  return {
    suite: "Natal dated event theme timing",
    passed,
    total: scores.length,
    score: Math.round((passed / scores.length) * 100),
    notes: [
      "This checks whether known event dates fall under dasha lords connected to the event life area.",
      "It still does not prove the system would narrate the whole biography without curated expected outputs.",
    ],
  }
}

const natalCoverageSuite = (): SuiteResult => {
  let total = 0
  let passed = 0

  PEOPLE.forEach((person) => {
    const chart = buildDetailedPrashnaChart({
      city: person.city as any,
      date: toUtcDate(person.birth, person.city.utcOffsetHours),
      panchangSystemId: "lahiri-mean",
    })

    person.expectedLifeAreas.forEach((intent) => {
      total += 1
      const intentScore = chart.planets.reduce(
        (best: number, planet: any) =>
          Math.max(best, scoreIntent(chart, planet.name, intent as keyof typeof INTENTS)),
        0
      )

      if (intentScore >= 3.5) passed += 1
    })
  })

  return {
    suite: "Natal life-area coverage",
    passed,
    total,
    score: Math.round((passed / total) * 100),
    notes: [
      "Checks whether the natal chart has enough deterministic house/planet basis for expected biography themes like fame, career, crisis, relationship or health.",
      "This is stronger than dated-event matching, but still needs human-written expected narratives for true biography-grade accuracy.",
    ],
  }
}

const prashnaCoverageSuite = (): SuiteResult => {
  const checks = [
    /Question parts to answer separately/,
    /Use deterministic_drishti_pack/,
    /Prashna Lagna, Moon, significator house/,
    /Bhava Chalit/,
    /questionDate/,
    /questionTime/,
  ]
  const passed = checks.filter((check) => check.test(prashnaRoute)).length

  return {
    suite: "Prashna deterministic coverage",
    passed,
    total: checks.length,
    score: Math.round((passed / checks.length) * 100),
    notes: [
      "This is a code coverage/regression suite, not real-world prashna outcome accuracy.",
      "To test outcome accuracy, we need a curated set of timestamped prashna questions with known later outcomes.",
    ],
  }
}

const matchmakingCoverageSuite = (): SuiteResult => {
  const checks = [
    /not be based only on guna/,
    /from Moon and Venus/,
    /7th house\/lord/,
    /buildManglikBalanceScore/,
    /buildRelationshipAxisScore/,
    /buildDashaMarriageReadinessScore/,
    /deep_scores/,
    /red_flags/,
  ]
  const passed = checks.filter((check) => check.test(matchRoute)).length

  return {
    suite: "Matchmaking deterministic coverage",
    passed,
    total: checks.length,
    score: Math.round((passed / checks.length) * 100),
    notes: [
      "This verifies the matchmaking code considers deeper layers beyond guna.",
      "To test real matching accuracy, we need a dataset of known marriages, separations and stable relationships with reliable birth times.",
    ],
  }
}

const kundliArchitectureSuite = (): SuiteResult => {
  const checks = [
    /deterministic_review/,
    /buildLifeAreaPredictionRows/,
    /buildKundliAiDossier/,
    /DETERMINISTIC_DOSSIER/,
    /senior Jyotish evidence reviewer/,
    /needs_more_bphs/,
    /kundli-profile-draft-agent/,
    /thinkingBudget:\s*0/,
    /buildFocusedQuestionContext\(question\)/,
    /quality_gate_passed/,
    /fallible rule hypotheses/,
  ]
  const passed = checks.filter((check) => check.test(route)).length

  return {
    suite: "Kundli bounded-agent architecture",
    passed,
    total: checks.length,
    score: Math.round((passed / checks.length) * 100),
    notes: [
      "Checks raw chart inputs, fallible rule hypotheses, routed agents and a no-charge quality gate.",
      "This protects quality and token cost, but biography discrimination and sampled narrative review remain separate tests.",
    ],
  }
}

const suites = [
  natalEventSuite(),
  biographyDiscriminationSuite(),
  natalCoverageSuite(),
  kundliArchitectureSuite(),
  prashnaCoverageSuite(),
  matchmakingCoverageSuite(),
]
const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0)
const total = suites.reduce((sum, suite) => sum + suite.total, 0)

console.table(
  suites.map((suite) => ({
    suite: suite.suite,
    passed: Number(suite.passed.toFixed(1)),
    total: suite.total,
    score: `${suite.score}%`,
  }))
)
console.log(
  JSON.stringify(
    {
      overallWeightedScore: Math.round((totalPassed / total) * 100),
      suites,
      honesty_note:
        "This is a mixed benchmark: dated natal event timing is data-based; prashna and matchmaking are deterministic coverage checks until curated outcome datasets are added.",
    },
    null,
    2
  )
)
