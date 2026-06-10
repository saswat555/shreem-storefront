/* eslint-disable no-console */
const fs = require("fs")

const route = fs.readFileSync("src/app/api/astrology/kundli/route.ts", "utf8")

const required = [
  "career_pack",
  "wealth_pack",
  "health_pack",
  "relationship_pack",
  "dasha_pack",
  "yoga_pack",
  "remedy_pack",
  "question_pack",
  "Topic: ${passage.section}",
  "do not pass the full chart object here",
]

console.log("=== Balanced RAG static audit ===")
let failed = false

for (const needle of required) {
  const ok = route.includes(needle)
  console.log(`${ok ? "OK " : "BAD"} ${needle}`)
  if (!ok) failed = true
}

const buildFnStart = route.indexOf("const buildKundliKnowledgePassages")
const buildFnEnd = route.indexOf("const formatCompactPassagesForPrompt", buildFnStart)
const buildChunk = route.slice(buildFnStart, buildFnEnd)

const retrieveBlocks = [...buildChunk.matchAll(/retrieveKnowledgeSafely\s*\(\s*\{[\s\S]*?\}\s*\)/g)]
const badRetrieveBlocks = retrieveBlocks.filter((match) =>
  /\n\s*chart\s*,/.test(match[0]) || /\n\s*chart\s*:/.test(match[0])
)

console.log("retrieveKnowledgeSafely blocks:", retrieveBlocks.length)
console.log("retrieveKnowledgeSafely blocks passing chart:", badRetrieveBlocks.length)

if (badRetrieveBlocks.length > 0) {
  console.log("BAD: full chart is still passed into retrieval blocks")
  badRetrieveBlocks.forEach((match, index) => {
    console.log(`--- bad block ${index + 1} ---`)
    console.log(match[0].slice(0, 700))
  })
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log("Balanced RAG patch looks applied correctly.")
