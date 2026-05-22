import { NextRequest, NextResponse } from "next/server"

import { recordAiUsage } from "@lib/data/ai-usage"
import { retrieveCustomer } from "@lib/data/customer"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"
import { generateGeminiJson } from "@lib/util/gemini"
import type { PrakritiProduct, PrakritiSubject } from "@lib/util/prakriti"

const REMEDY_SCHEMA = {
  type: "object",
  properties: {
    likely_condition: { type: "string" },
    case_summary: { type: "string" },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    confidence_reason: { type: "string" },
    observations: {
      type: "array",
      items: { type: "string" },
    },
    possible_causes: {
      type: "array",
      items: { type: "string" },
    },
    immediate_home_steps: {
      type: "array",
      items: { type: "string" },
    },
    natural_remedy: { type: "string" },
    monitoring_plan: {
      type: "array",
      items: { type: "string" },
    },
    prevention_tips: {
      type: "array",
      items: { type: "string" },
    },
    urgent_care_signs: {
      type: "array",
      items: { type: "string" },
    },
    recommended_products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          handle: { type: "string" },
          title: { type: "string" },
          advantage: { type: "string" },
          how_to_use: { type: "string" },
          reason_match: { type: "string" },
        },
        required: ["handle", "title", "advantage", "how_to_use", "reason_match"],
      },
    },
  },
  required: [
    "likely_condition",
    "case_summary",
    "confidence",
    "confidence_reason",
    "observations",
    "possible_causes",
    "immediate_home_steps",
    "natural_remedy",
    "monitoring_plan",
    "prevention_tips",
    "urgent_care_signs",
    "recommended_products",
  ],
} as const

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the care plan in polished English.",
  hindi: "Write the care plan in natural Hindi using Devanagari.",
  hinglish: "Write the care plan in friendly Hinglish with simple care terms.",
}

type PrakritiGuidePayload = {
  subject?: PrakritiSubject
  notes?: string
  caseMeta?: {
    subjectName?: string
    environment?: string
    duration?: string
  }
  products?: PrakritiProduct[]
  images?: { dataUrl?: string }[]
  language?: string
}

const buildPrompt = ({
  subject,
  notes,
  caseMeta,
  products,
  language,
}: {
  subject: PrakritiSubject
  notes: string
  caseMeta: {
    subjectName: string
    environment: string
    duration: string
  }
  products: PrakritiProduct[]
  language: string
}) => {
  return [
    `You are GrowBuddy AI, Shreem's careful plant and animal visual-care assistant for ${subject}s.`,
    "Use the uploaded images first, then use the case metadata and issue paragraph.",
    "Return helpful, specific, plain-language guidance for a customer, but never claim certainty from images alone.",
    "If the case seems severe, rapidly spreading, or dangerous, include urgent-care signs that tell the user to contact a veterinarian, plant pathologist, or local expert.",
    `Recommend a Shreem product only if it is clearly relevant to the case and only from this available regional list: ${JSON.stringify(
      products
    )}.`,
    "If none of the available products are truly useful, return an empty recommended_products array.",
    "Do not recommend bilona ghee as a treatment for plant or animal disease.",
    "For animal cases, avoid medical treatment claims and keep product suggestions limited to environment-supportive use when clearly relevant.",
    "Keep remedies practical, conservative, and low-risk. Mention dosage/frequency only when it is a general non-medical care practice.",
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english,
    `Subject name/type: ${caseMeta.subjectName || "Not provided."}`,
    `Environment/location: ${caseMeta.environment || "Not provided."}`,
    `How long visible: ${caseMeta.duration || "Not provided."}`,
    `Issue or need: ${notes.trim() || "No extra notes provided."}`,
  ].join("\n")
}

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const sanitizeProducts = (products: unknown): PrakritiProduct[] => {
  if (!Array.isArray(products)) {
    return []
  }

  return products
    .map((product) => {
      const item = product as Partial<PrakritiProduct>

      return {
        id: typeof item.id === "string" ? item.id : "",
        handle: typeof item.handle === "string" ? item.handle : "",
        title: typeof item.title === "string" ? item.title : "",
        description:
          typeof item.description === "string" ? item.description : "",
        thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
        tags: Array.isArray(item.tags)
          ? item.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
      }
    })
    .filter((product) => product.id && product.handle && product.title)
    .slice(0, 30)
}

const sanitizeImages = (images: unknown) => {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((image) => {
      const dataUrl = (image as { dataUrl?: unknown }).dataUrl

      if (typeof dataUrl !== "string") {
        return null
      }

      const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/)

      if (!match) {
        return null
      }

      return {
        mimeType: match[1],
        data: match[2],
      }
    })
    .filter(
      (image): image is { mimeType: string; data: string } => Boolean(image)
    )
    .slice(0, 3)
}

export async function POST(request: NextRequest) {
  if (!isPrakritiGuideEnabled()) {
    return NextResponse.json(
      { message: "GrowBuddy AI is not enabled on this server." },
      { status: 404 }
    )
  }

  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to use GrowBuddy AI." },
      { status: 401 }
    )
  }

  const payload = (await request.json().catch(() => null)) as
    | PrakritiGuidePayload
    | null

  if (!payload) {
    return NextResponse.json(
      { message: "We could not read the guide request." },
      { status: 400 }
    )
  }

  const subject = payload.subject === "animal" ? "animal" : "plant"
  const notes = sanitizeString(payload.notes, 1800)
  const caseMeta = {
    subjectName: sanitizeString(payload.caseMeta?.subjectName, 160),
    environment: sanitizeString(payload.caseMeta?.environment, 240),
    duration: sanitizeString(payload.caseMeta?.duration, 120),
  }
  const products = sanitizeProducts(payload.products)
  const images = sanitizeImages(payload.images)
  const rawLanguage = sanitizeString(payload.language, 20)
  const language =
    rawLanguage === "hindi" || rawLanguage === "hinglish"
      ? rawLanguage
      : "english"

  if (!images.length) {
    return NextResponse.json(
      { message: "Add at least one clear image to continue." },
      { status: 400 }
    )
  }

  const gemini = await generateGeminiJson({
    prompt: buildPrompt({
      subject,
      notes,
      caseMeta,
      products,
      language,
    }),
    parts: images.map((image) => ({
      inline_data: {
        mime_type: image.mimeType,
        data: image.data,
      },
    })),
    responseSchema: REMEDY_SCHEMA,
    temperature: 0.25,
    timeoutMs: 120_000,
    maxOutputTokens: 8192,
    label: "GrowBuddy API",
  })

  if (!gemini.ok) {
    return NextResponse.json(
      {
        message:
          gemini.error ||
          "GrowBuddy could not analyze this case right now. Please try again in a moment.",
        retryable: true,
      },
      { status: 502 }
    )
  }

  const result = gemini.text
  const parsedResult = gemini.parsed
  const response =
    parsedResult && typeof parsedResult === "object" && !Array.isArray(parsedResult)
      ? (parsedResult as Record<string, unknown>)
      : { raw_result: String(result || "").slice(0, 4000) }
  const urgentCareSigns = Array.isArray(response.urgent_care_signs)
    ? response.urgent_care_signs
    : []
  const usage = await recordAiUsage({
    tool: "grow_ai",
    input: {
      subject,
      notes,
      case_meta: caseMeta,
      language,
      image_count: images.length,
      product_handles: products.map((product) => product.handle),
    },
    response,
    metadata: {
      customer_email: customer.email,
      billing_mode: "free",
      usage_units: 1,
      charge_required: false,
      image_mime_types: images.map((image) => image.mimeType),
    },
    model: gemini.model,
    ...gemini.usage,
    expert_recommended:
      response.confidence === "low" || urgentCareSigns.length > 0,
  })

  return NextResponse.json({
    result,
    model: gemini.model,
    usage_synced: usage.synced,
  })
}
