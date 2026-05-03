import { NextRequest, NextResponse } from "next/server"

import { retrieveCustomer } from "@lib/data/customer"
import {
  getPrakritiGuideModel,
  isPrakritiGuideEnabled,
} from "@lib/util/prakriti-config"
import type { PrakritiProduct, PrakritiSubject } from "@lib/util/prakriti"

const REMEDY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    likely_condition: { type: "string" },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    observations: {
      type: "array",
      items: { type: "string" },
    },
    immediate_home_steps: {
      type: "array",
      items: { type: "string" },
    },
    natural_remedy: { type: "string" },
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
        additionalProperties: false,
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
    "confidence",
    "observations",
    "immediate_home_steps",
    "natural_remedy",
    "prevention_tips",
    "urgent_care_signs",
    "recommended_products",
  ],
} as const

type PrakritiGuidePayload = {
  subject?: PrakritiSubject
  notes?: string
  products?: PrakritiProduct[]
  images?: { dataUrl?: string }[]
}

const buildPrompt = ({
  subject,
  notes,
  products,
}: {
  subject: PrakritiSubject
  notes: string
  products: PrakritiProduct[]
}) => {
  return [
    `You are Shreem Prakriti Guide, a careful natural-care assistant for ${subject}s.`,
    "Use the uploaded images first, then use the user's note if present.",
    "Give a practical, low-risk assessment. Never claim certainty from images alone.",
    "If the case seems severe, rapidly spreading, or dangerous, include urgent-care signs that tell the user to contact a veterinarian, plant pathologist, or local expert.",
    `Recommend a Shreem product only if it is clearly relevant to the case and only from this available regional list: ${JSON.stringify(
      products
    )}.`,
    "If none of the available products are truly useful, return an empty recommended_products array.",
    "Do not recommend bilona ghee as a treatment for plant or animal disease.",
    "For animal cases, avoid medical treatment claims and keep product suggestions limited to environment-supportive use when clearly relevant.",
    `User note: ${notes.trim() || "No extra notes provided."}`,
  ].join("\n")
}

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
    .map((image) => (image as { dataUrl?: unknown }).dataUrl)
    .filter(
      (dataUrl): dataUrl is string =>
        typeof dataUrl === "string" &&
        /^data:image\/(png|jpe?g|webp);base64,/.test(dataUrl)
    )
    .slice(0, 3)
}

export async function POST(request: NextRequest) {
  if (!isPrakritiGuideEnabled()) {
    return NextResponse.json(
      { message: "Prakriti Guide is not enabled on this server." },
      { status: 404 }
    )
  }

  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return NextResponse.json(
      { message: "Sign in to use Prakriti Guide." },
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
  const notes = typeof payload.notes === "string" ? payload.notes.slice(0, 1200) : ""
  const products = sanitizeProducts(payload.products)
  const images = sanitizeImages(payload.images)

  if (!images.length) {
    return NextResponse.json(
      { message: "Add at least one clear image to continue." },
      { status: 400 }
    )
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getPrakritiGuideModel(),
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "shreem_prakriti_guide",
          strict: true,
          schema: REMEDY_SCHEMA,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a careful natural-care assistant. Stay cautious, practical, and product-honest. Never recommend a regional product unless it is clearly useful for the specific case.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt({ subject, notes, products }),
            },
            ...images.map((dataUrl) => ({
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "low",
              },
            })),
          ],
        },
      ],
    }),
  }).catch(() => null)

  if (!openAiResponse || !openAiResponse.ok) {
    const errorBody = openAiResponse ? await openAiResponse.text() : ""

    return NextResponse.json(
      {
        message:
          errorBody ||
          "The AI service could not analyze the images right now. Please try again.",
      },
      { status: 502 }
    )
  }

  const data = await openAiResponse.json()

  return NextResponse.json({
    result: data.choices?.[0]?.message?.content,
    model: getPrakritiGuideModel(),
  })
}
