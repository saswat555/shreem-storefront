const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const { base, moonposition, nutation, sidereal } = require("astronomia")

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
const VIMSHOTTARI_YEARS = {
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

const normalizeDegrees = (value) => ((value % 360) + 360) % 360
const toDegrees = (value) => (180 / Math.PI) * value
const toRadians = (value) => (Math.PI / 180) * value
const julianDay = (date) => date.getTime() / 86400000 + 2440587.5

const getMeanLahiriAyanamsa = (jd) => {
  const t = (jd - 2415020) / 36525

  return normalizeDegrees(22.460148 + 1.396042 * t + 0.000087 * t * t)
}

const signFromDegree = (degree) => SIGNS[Math.floor(normalizeDegrees(degree) / 30)]
const degreeInSign = (degree) => Number((normalizeDegrees(degree) % 30).toFixed(2))

const nakshatraFromDegree = (degree) => {
  const span = 360 / 27
  const normalized = normalizeDegrees(degree)
  const index = Math.floor(normalized / span)
  const pada = Math.floor((normalized % span) / (span / 4)) + 1

  return {
    name: NAKSHATRAS[index],
    pada,
  }
}

const addYears = (date, years) =>
  new Date(date.getTime() + years * 365.2425 * 86400000)

const orderFromLord = (lord) => {
  const startIndex = Math.max(VIMSHOTTARI_SEQUENCE.indexOf(lord), 0)

  return Array.from({ length: VIMSHOTTARI_SEQUENCE.length }, (_, index) => {
    return VIMSHOTTARI_SEQUENCE[(startIndex + index) % VIMSHOTTARI_SEQUENCE.length]
  })
}

const findRunningDasha = ({ start, order, parentDurationYears, target }) => {
  let cursor = new Date(start)

  for (const lord of order) {
    const durationYears =
      (parentDurationYears * VIMSHOTTARI_YEARS[lord]) / 120
    const end = addYears(cursor, durationYears)

    if (target >= cursor && target < end) {
      return { lord, start: cursor, end, durationYears }
    }

    cursor = end
  }

  return null
}

const getDashaAt = ({ moonLongitude, birthDate, target }) => {
  const span = 360 / 27
  const nakshatraIndex = Math.floor(normalizeDegrees(moonLongitude) / span)
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex % 9]
  const balanceYears =
    VIMSHOTTARI_YEARS[nakshatraLord] *
    (1 - (normalizeDegrees(moonLongitude) % span) / span)
  const order = orderFromLord(nakshatraLord)
  const mahadashas = [
    {
      lord: nakshatraLord,
      start: birthDate,
      end: addYears(birthDate, balanceYears),
      durationYears: balanceYears,
    },
  ]
  let cursor = mahadashas[0].end

  for (let index = 1; index < 18; index += 1) {
    const lord = order[index % order.length]
    const end = addYears(cursor, VIMSHOTTARI_YEARS[lord])

    mahadashas.push({
      lord,
      start: cursor,
      end,
      durationYears: VIMSHOTTARI_YEARS[lord],
    })
    cursor = end
  }

  const mahadasha = mahadashas.find(
    (period) => target >= period.start && target < period.end
  )
  const antardasha = findRunningDasha({
    start: mahadasha.start,
    order: orderFromLord(mahadasha.lord),
    parentDurationYears: mahadasha.durationYears,
    target,
  })
  const pratyantar = findRunningDasha({
    start: antardasha.start,
    order: orderFromLord(antardasha.lord),
    parentDurationYears: antardasha.durationYears,
    target,
  })

  return { nakshatraLord, mahadasha, antardasha, pratyantar }
}

const calculateAscendant = ({ jd, latitude, longitude, ayanamsa }) => {
  const localSiderealDegree = normalizeDegrees(sidereal.apparent(jd) / 240 + longitude)
  const obliquity = nutation.meanObliquity(jd)
  const theta = toRadians(localSiderealDegree)
  const denominator =
    Math.sin(theta) * Math.cos(obliquity) +
    Math.tan(toRadians(latitude)) * Math.sin(obliquity)
  const tropicalAscendant = normalizeDegrees(
    toDegrees(Math.atan2(Math.cos(theta), -denominator))
  )

  return normalizeDegrees(tropicalAscendant - ayanamsa)
}

const source = fs.readFileSync(
  path.join(process.cwd(), "src/lib/util/vedic-astrology.ts"),
  "utf8"
)

assert.match(
  source,
  /Math\.atan2\(\s*Math\.cos\(theta\),\s*-denominator\s*\)/,
  "Ascendant source should use the corrected eastern horizon formula."
)
assert.doesNotMatch(
  source,
  /Math\.atan2\(\s*-Math\.cos\(theta\)/,
  "Old descendant/opposite Lagna formula must not return."
)

const city = {
  latitude: 24.5362,
  longitude: 81.3037,
  offsetHours: 5.5,
}
const birthDate = new Date(
  Date.UTC(1997, 2, 5, 20, 58) - city.offsetHours * 60 * 60 * 1000
)
const jd = julianDay(birthDate)
const ayanamsa = getMeanLahiriAyanamsa(jd)
const ascendantLongitude = calculateAscendant({
  jd,
  latitude: city.latitude,
  longitude: city.longitude,
  ayanamsa,
})
const moonLongitude = normalizeDegrees(
  toDegrees(moonposition.position(jd).lon) - ayanamsa
)
const moonNakshatra = nakshatraFromDegree(moonLongitude)

assert.equal(signFromDegree(ascendantLongitude), "Libra")
assert.ok(
  Math.abs(degreeInSign(ascendantLongitude) - 0.37) < 0.1,
  `Expected Libra Lagna near 0.37 deg, got ${degreeInSign(ascendantLongitude)}`
)
assert.notEqual(signFromDegree(ascendantLongitude), "Aries")
assert.equal(signFromDegree(moonLongitude), "Capricorn")
assert.ok(
  Math.abs(degreeInSign(moonLongitude) - 3.45) < 0.1,
  `Expected Capricorn Moon near 3.45 deg, got ${degreeInSign(moonLongitude)}`
)
assert.equal(moonNakshatra.name, "Uttara Ashadha")
assert.equal(moonNakshatra.pada, 3)

const dasha = getDashaAt({
  moonLongitude,
  birthDate,
  target: new Date("2026-05-17T00:00:00.000Z"),
})

assert.equal(dasha.nakshatraLord, "Sun")
assert.equal(dasha.mahadasha.lord, "Rahu")
assert.equal(dasha.antardasha.lord, "Mercury")
assert.equal(dasha.pratyantar.lord, "Mars")

const saswatCity = {
  latitude: 24.5362,
  longitude: 81.3037,
  offsetHours: 5.5,
}
const saswatBirthDate = new Date(
  Date.UTC(1999, 10, 5, 1, 45) -
    saswatCity.offsetHours * 60 * 60 * 1000
)
const saswatJd = julianDay(saswatBirthDate)
const saswatAyanamsa = getMeanLahiriAyanamsa(saswatJd)
const saswatMoonLongitude = normalizeDegrees(
  toDegrees(moonposition.position(saswatJd).lon) - saswatAyanamsa
)
const saswatDasha = getDashaAt({
  moonLongitude: saswatMoonLongitude,
  birthDate: saswatBirthDate,
  target: new Date("2026-06-19T00:00:00.000Z"),
})

assert.equal(saswatDasha.nakshatraLord, "Moon")
assert.equal(saswatDasha.mahadasha.lord, "Rahu")
assert.equal(saswatDasha.antardasha.lord, "Mercury")
assert.equal(saswatDasha.pratyantar.lord, "Jupiter")

const kundliRouteSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/astrology/kundli/route.ts"),
  "utf8"
)
const knowledgeSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/util/astrology-knowledge.ts"),
  "utf8"
)
const evidenceSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/util/astrology-evidence.ts"),
  "utf8"
)
const geminiSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/util/gemini.ts"),
  "utf8"
)

assert.doesNotMatch(
  kundliRouteSource,
  /bestOutside\.length\s*<=\s*1/,
  "Kaal Sarp must not allow one outside planet as a partial false positive."
)
assert.match(
  kundliRouteSource,
  /All seven classical grahas are enclosed/,
  "Kaal Sarp proof must require all seven classical grahas inside the node axis."
)
assert.match(
  knowledgeSource,
  /AstrologyKnowledgeIntent/,
  "RAG retrieval must support section intent."
)
assert.match(
  knowledgeSource,
  /intentEvidence/,
  "RAG retrieval must filter or score by intent evidence."
)
assert.match(
  evidenceSource,
  /Gochar applies only when it overlaps the same intent houses and active dasha\/natal planets/,
  "Gochar must be restricted by natal/dasha overlap."
)
assert.match(
  source,
  /if \(planetName === "Mars"\)[\s\S]*return \[\.\.\.base, 4, 8\]/,
  "Regression requires Mars 4th and 8th drishti support in the deterministic source."
)
assert.match(
  source,
  /if \(planetName === "Jupiter"\)[\s\S]*return \[\.\.\.base, 5, 9\]/,
  "Regression requires Jupiter 5th and 9th drishti support in the deterministic source."
)
assert.match(
  evidenceSource,
  /Natal chart and Vimshottari dasha outrank gochar/,
  "Gochar must never override natal promise or Vimshottari dasha."
)
assert.match(
  kundliRouteSource,
  /bphs_basis[\s\S]*dasha_basis[\s\S]*drishti_basis[\s\S]*gochar_basis/,
  "Prediction rows must be enriched with BPHS, dasha, drishti and gochar basis fields."
)
assert.match(
  kundliRouteSource,
  /naturalPlanets\?: string\[\]/,
  "Preventive health timing should allow natural significator weighting without naming diseases."
)
assert.doesNotMatch(
  kundliRouteSource,
  /answer:\s*fallback\.answer/,
  "Customer-facing question answers must not be substituted from deterministic fallback text."
)
assert.match(
  kundliRouteSource,
  /kundli-focused-question-\$\{index \+ 1\}/,
  "Weak or mismatched sub-question answers must use isolated Gemini calls with deterministic evidence."
)
assert.match(
  kundliRouteSource,
  /buildFocusedQuestionContext\(question\)/,
  "Each focused question must receive only its intent-relevant deterministic context."
)
assert.match(
  kundliRouteSource,
  /thinkingBudget:\s*0/,
  "Kundli calls must disable thinking overhead."
)
assert.doesNotMatch(
  geminiSource,
  /attemptJsonRepair|JSON was repaired after truncation|retryInvalidJson|repairInvalidJson/,
  "Shared Gemini JSON generation must not contain paid repair or malformed-output retry paths."
)
assert.doesNotMatch(
  kundliRouteSource,
  /answer: `\$\{fallback\.answer\} Timing:/,
  "Question answers must not stuff timing and remedies into one paragraph."
)
assert.doesNotMatch(
  kundliRouteSource,
  /replace\(\/\\boperation\(s\)\?\\b\/gi,\s*"medical procedure"\)/,
  "Business operations must never be rewritten as a medical procedure."
)
assert.match(
  kundliRouteSource,
  /return "comparison_decision"/,
  "Alternative business questions must use a dedicated comparison intent."
)
assert.match(
  kundliRouteSource,
  /exactly 6 deterministic_review rows/,
  "The compact reviewer must return six customer-facing life-area decisions."
)
assert.match(
  kundliRouteSource,
  /lifetime_antardashas/,
  "The timing engine must expose full-life Antardasha coverage."
)
assert.match(
  knowledgeSource,
  /INTENT_CHAPTERS/,
  "Local BPHS retrieval must gate every intent to relevant source chapters."
)
assert.match(
  knowledgeSource,
  /INTENT_PRIMARY_CHAPTERS/,
  "Local BPHS retrieval must rank governing chapters above supporting dasha passages."
)
assert.match(
  kundliRouteSource,
  /exactly 2 opening_profile paragraphs/,
  "The first Kundli section must include a bounded two-paragraph personal and career portrait."
)
assert.match(
  kundliRouteSource,
  /retrospective_timing_windows/,
  "Maraka prevention timing must preserve high-confidence birth-to-current windows separately from future windows."
)
assert.match(
  kundliRouteSource,
  /getCriticalWindowGuidance/,
  "Every displayed critical window must include deterministic avoid and preventive-action guidance."
)
assert.match(
  kundliRouteSource,
  /return "livestock_capital_decision"/,
  "Cow and dairy investment questions must use a dedicated capital-decision agent intent."
)
assert.match(
  kundliRouteSource,
  /quality_gate_failed/,
  "A failed customer-answer quality gate must block astrology credit consumption."
)
assert.match(
  kundliRouteSource,
  /fallible rule hypotheses/,
  "Rule-engine interpretations must be treated as hypotheses rather than ground truth."
)
assert.match(
  kundliRouteSource,
  /qualityRound <= 2/,
  "Focused question answers must receive one bounded semantic repair round."
)

console.log(
  "Astrology regression passed: Lagna, dasha, BPHS intent RAG, drishti, Kaal Sarp and gochar guardrails verified."
)
