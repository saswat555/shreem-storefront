#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = path.resolve(__dirname, "..")
const envFiles = [path.join(root, ".env.local"), path.join(root, ".env")]

for (const file of envFiles) {
  if (!fs.existsSync(file)) continue
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
  }
}

const apiKey = process.env.GEMINI_API_KEY
const primaryModel = process.env.LONGEVITY_OCR_GEMINI_MODEL || "gemini-2.5-flash"
const models = Array.from(
  new Set([
    primaryModel,
    "gemini-2.5-flash-lite",
  ])
)
const pagesDir = path.join(root, "data", "longevity-pages")
const outDir = path.join(root, "data", "longevity-rules")
const chunkSize = Number(process.env.LONGEVITY_OCR_CHUNK_SIZE || 5)

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY")
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const imagePart = (file) => ({
  inline_data: {
    mime_type: "image/jpeg",
    data: fs.readFileSync(file).toString("base64"),
  },
})

const extractJson = (text) => {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON in model response: ${cleaned.slice(0, 400)}`)
  }
  const jsonText = cleaned
    .slice(start, end + 1)
    .replace(/:\s*0+(\d+)/g, ": $1")
    .replace(/\[\s*0+(\d+)/g, "[$1")
    .replace(/,\s*0+(\d+)/g, ", $1")
  return JSON.parse(jsonText)
}

const callGemini = async (files, attempt = 1, modelIndex = 0) => {
  const model = models[modelIndex] || models[0]
  const pageLabels = files.map((file) => path.basename(file).match(/(\d+)/)?.[1])
  const prompt = `
You are summarizing Jyotish longevity and Maraka rules from scanned book pages for internal software verification.

Task:
1. Do not transcribe the book.
2. Extract only paraphrased actionable astrology rules.
3. Return JSON only.

Important:
- Preserve page numbers from file names: ${pageLabels.join(", ")}.
- Use only these PDF page numbers in "pages" and each rule "page"; ignore printed/book page numbers shown inside the scan.
- Do not invent rules if a page is unclear.
- Separate longevity class rules, Maraka rules, dasha timing rules, mitigation/protection rules, and caution rules.
- Convert fatalistic wording into internal verification language. The product must not show death predictions to customers.
- Do not include more than 8 consecutive words copied from the page.
- Return at most 12 strongest rules per PDF page. Prefer Maraka, dasha timing, protection, mitigation, and calculation methods over examples.

JSON shape:
{
  "pages": [1, 2],
  "page_summary": "brief paraphrased summary only; no verbatim text",
  "rules": [
    {
      "id": "short-stable-id",
      "page": 1,
      "category": "longevity_class|maraka|dasha_timing|protection|mitigation|method|caution",
      "condition": "exact astrological condition",
      "effect": "classical effect in neutral internal language",
      "implementation": "how software should use this rule safely",
      "confidence": "high|medium|low"
    }
  ]
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...files.map(imagePart)],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: Number(process.env.LONGEVITY_OCR_MAX_OUTPUT_TOKENS || 24000),
        },
      }),
    }
  )

  const body = await response.text()
  const first = path.basename(files[0]).match(/(\d+)/)?.[1]
  const last = path.basename(files[files.length - 1]).match(/(\d+)/)?.[1]
  fs.writeFileSync(
    path.join(outDir, `raw-pages-${first}-${last}-attempt-${attempt}.json`),
    body
  )
  if (!response.ok) {
    if (attempt < 3 && [429, 500, 502, 503, 504].includes(response.status)) {
      await sleep(1500 * attempt)
      return callGemini(files, attempt + 1, modelIndex)
    }
    if (modelIndex < models.length - 1 && [404, 429, 500, 502, 503, 504].includes(response.status)) {
      await sleep(1200)
      return callGemini(files, 1, modelIndex + 1)
    }
    throw new Error(`Gemini ${response.status}: ${body.slice(0, 1000)}`)
  }

  const parsed = JSON.parse(body)
  if (parsed.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked OCR chunk ${first}-${last}: ${parsed.promptFeedback.blockReason}`
    )
  }
  const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n")
  if (!text) {
    const reason = parsed.candidates?.[0]?.finishReason || "no_text"
    throw new Error(`Gemini returned no OCR text for ${first}-${last}: ${reason}`)
  }
  return extractJson(text)
}

const main = async () => {
  const files = fs
    .readdirSync(pagesDir)
    .filter((file) => /^page-\d+\.jpe?g$/i.test(file))
    .sort()
    .map((file) => path.join(pagesDir, file))
    .filter((file) => {
      const page = Number(path.basename(file).match(/(\d+)/)?.[1] || 0)
      const start = Number(process.env.LONGEVITY_OCR_START_PAGE || 0)
      const end = Number(process.env.LONGEVITY_OCR_END_PAGE || 9999)
      return page >= start && page <= end
    })

  const allRules = []
  const chunks = []

  for (let index = 0; index < files.length; index += chunkSize) {
    chunks.push(files.slice(index, index + chunkSize))
  }

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    const first = path.basename(chunk[0]).match(/(\d+)/)?.[1]
    const last = path.basename(chunk[chunk.length - 1]).match(/(\d+)/)?.[1]
    const outFile = path.join(outDir, `pages-${first}-${last}.json`)

    if (fs.existsSync(outFile) && process.env.LONGEVITY_OCR_FORCE !== "true") {
      const existing = JSON.parse(fs.readFileSync(outFile, "utf8"))
      allRules.push(...(existing.rules || []))
      console.log(`skip ${first}-${last}`)
      continue
    }

    console.log(`extract ${first}-${last} (${index + 1}/${chunks.length})`)
    const result = await callGemini(chunk)
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2))
    allRules.push(...(result.rules || []))
    await sleep(Number(process.env.LONGEVITY_OCR_DELAY_MS || 800))
  }

  const aggregate = {
    generatedAt: new Date().toISOString(),
    source: "data/longetivity.pdf",
    model: models.join(","),
    rules: allRules,
  }

  fs.writeFileSync(
    path.join(root, "data", "longevity-rules.json"),
    JSON.stringify(aggregate, null, 2)
  )
  console.log(`rules: ${allRules.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
