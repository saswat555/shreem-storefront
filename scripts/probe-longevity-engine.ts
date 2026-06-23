import { buildDetailedPrashnaChart } from "../src/lib/util/vedic-astrology"
import { buildLongevityAssessment } from "../src/lib/util/longevity-rules"
import type { AstrologyCity } from "../src/lib/util/astrology"

const rewa: AstrologyCity = {
  id: "rewa",
  name: "Rewa",
  region: "Madhya Pradesh",
  latitude: 24.5362,
  longitude: 81.3037,
  timeZone: "Asia/Kolkata",
  utcOffsetHours: 5.5,
}

const localDate = new Date(
  Date.UTC(1964, 3, 7, 13, 50) - rewa.utcOffsetHours * 60 * 60 * 1000
)
const chart = buildDetailedPrashnaChart({ city: rewa, date: localDate })
const longevity = buildLongevityAssessment(chart)

console.log(
  JSON.stringify(
    {
      ascendant: chart.ascendant,
      moon: `${chart.moonSign} ${chart.nakshatra}`,
      dasha: chart.dasha
        ? [
            chart.dasha.mahadasha.lord,
            chart.dasha.antardasha.lord,
            chart.dasha.pratyantar.lord,
          ]
        : [],
      classification: longevity.classification,
      score: longevity.score,
      protective: longevity.protective_factors,
      pressure: longevity.pressure_factors,
      maraka: longevity.maraka_factors,
      topProofs: longevity.rule_proofs.slice(0, 5).map((proof) => ({
        id: proof.id,
        score: proof.score,
        polarity: proof.polarity,
        application: proof.application,
      })),
    },
    null,
    2
  )
)
