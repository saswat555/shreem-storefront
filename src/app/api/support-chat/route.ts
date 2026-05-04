import { NextRequest, NextResponse } from "next/server"

import {
  getGeminiApiKey,
  getGeminiModel,
  isGeminiEnabled,
} from "@lib/util/prakriti-config"
import { shreemAssurances, shreemRituals } from "@lib/constants/shreem"

const SUPPORT_TO_EMAIL = "brajsavitrikrishisansthan@gmail.com"

const PRODUCT_KNOWLEDGE = JSON.stringify({
  assurances: shreemAssurances,
  products: shreemRituals.map((item) => ({
    title: item.title,
    description: item.description,
    points: item.points,
  })),
})

const SUPPORT_CHAT_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    resolved: { type: "boolean" },
    needs_email: { type: "boolean" },
    suggested_topic: { type: "string" },
    escalation_prompt: { type: "string" },
  },
  required: [
    "answer",
    "resolved",
    "needs_email",
    "suggested_topic",
    "escalation_prompt",
  ],
} as const

type SupportMessage = {
  role?: string
  text?: string
}

const sanitizeString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const sanitizeMessages = (messages: unknown): Required<SupportMessage>[] => {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null
      }

      const role =
        sanitizeString((message as SupportMessage).role, 24) === "assistant"
          ? "assistant"
          : "user"
      const text = sanitizeString((message as SupportMessage).text, 1400)

      if (!text) {
        return null
      }

      return { role, text }
    })
    .filter(Boolean)
    .slice(-10) as Required<SupportMessage>[]
}

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const buildPrompt = ({
  messages,
  customerContext,
}: {
  messages: Required<SupportMessage>[]
  customerContext: string
}) => {
  return [
    "You are Shreem Support AI, a warm, concise support assistant for Shreem Cow Products.",
    "Help with order guidance, account navigation, payment concerns, product selection, cart/checkout questions, and basic care guidance.",
    "Do not pretend to access tracking, payment gateways, private orders, or backend data you were not given.",
    `Use only this Shreem product knowledge for product advice: ${PRODUCT_KNOWLEDGE}.`,
    "If product information is not in that knowledge, say you do not have that exact detail and offer human follow-up.",
    "If the customer asks for exact order status, payment confirmation, refunds, cancellation, address changes, account access problems, or anything requiring private records, ask for the missing details and set needs_email true only when human follow-up is needed.",
    `Escalation email is ${SUPPORT_TO_EMAIL}. Do not say an email was sent. The website will send it only after the user explicitly submits details.`,
    "Keep the answer practical and short enough for a mobile chat bubble.",
    "Return JSON only.",
    customerContext ? `Customer context: ${customerContext}` : "",
    "Conversation:",
    messages
      .map((message) => `${message.role.toUpperCase()}: ${message.text}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { message: "We could not read the support chat request." },
      { status: 400 }
    )
  }

  const messages = sanitizeMessages((payload as { messages?: unknown }).messages)
  const customerContext = sanitizeString(
    (payload as { customerContext?: unknown }).customerContext,
    700
  )

  if (!messages.length) {
    return NextResponse.json(
      { message: "Send a message to start support chat." },
      { status: 400 }
    )
  }

  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        answer:
          "AI support is not enabled on this server yet. You can still send details to the Shreem team for a human reply.",
        resolved: false,
        needs_email: true,
        suggested_topic: "Support request",
        escalation_prompt: "Share your details and we will prepare the email.",
        support_email: SUPPORT_TO_EMAIL,
      },
      { status: 503 }
    )
  }

  const model = getGeminiModel().replace(/^models\//, "")
  const apiKey = getGeminiApiKey()

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildPrompt({ messages, customerContext }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.18,
          responseMimeType: "application/json",
          responseSchema: SUPPORT_CHAT_SCHEMA,
        },
      }),
    }
  ).catch(() => null)

  if (!geminiResponse || !geminiResponse.ok) {
    return NextResponse.json(
      {
        answer:
          "I could not reach AI support right now. If this is urgent, send the details to the Shreem team and include your order number if you have one.",
        resolved: false,
        needs_email: true,
        suggested_topic: "Support request",
        escalation_prompt: "Share your details and we will prepare the email.",
        support_email: SUPPORT_TO_EMAIL,
      },
      { status: 502 }
    )
  }

  const data = await geminiResponse.json()
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim()
  const parsed = safeParseJson(text || "")

  return NextResponse.json({
    answer:
      sanitizeString(parsed?.answer, 1600) ||
      "I can help with that. Share your order number or the product you are asking about, and I will guide you.",
    resolved: Boolean(parsed?.resolved),
    needs_email: Boolean(parsed?.needs_email),
    suggested_topic:
      sanitizeString(parsed?.suggested_topic, 140) || "Support request",
    escalation_prompt:
      sanitizeString(parsed?.escalation_prompt, 260) ||
      "Would you like to send these details to the Shreem team?",
    support_email: SUPPORT_TO_EMAIL,
    model,
  })
}
