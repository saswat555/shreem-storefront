/* eslint-disable no-console */
const fs = require("fs")

const route = fs.readFileSync("src/app/api/astrology/kundli/route.ts", "utf8")

const checks = [
  ["curated helper exists", "buildCuratedKundliKnowledgePassages"],
  ["direct question curated pack", "shreem-curated-direct-question"],
  ["career curated pack", "shreem-curated-career"],
  ["wealth curated pack", "shreem-curated-wealth"],
  ["health curated pack", "shreem-curated-health"],
  ["relationship curated pack", "shreem-curated-relationship"],
  ["property curated pack", "shreem-curated-property-home"],
  ["foreign/spiritual curated pack", "shreem-curated-spiritual-foreign"],
  ["curated comes before BPHS", "mergeKnowledgePassages(32, curatedPassages, selected)"],
  ["two-layer prompt", "two-layer RAG system"],
  ["single-call question", "Production single-call mode"],
]

console.log("=== Kundli knowledge-pack audit ===")
let failed = false
for (const [label, needle] of checks) {
  const ok = route.includes(needle)
  console.log(`${ok ? "OK " : "BAD"} ${label}`)
  if (!ok) failed = true
}

if (route.includes("Kundli focused question Gemini")) {
  console.log("BAD old focused question Gemini label still present")
  failed = true
}

if (failed) process.exit(1)
console.log("Kundli knowledge-pack redesign is active.")
