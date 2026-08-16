import { NextRequest, NextResponse } from "next/server"

const SUPPORT_TO_EMAIL = "brajsavitrikrishisanshtan@gmail.com"

const sanitize = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const sanitizeConversation = (value: unknown) => {
  if (!Array.isArray(value)) {
    return ""
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const role = sanitize((item as { role?: unknown }).role).slice(0, 24)
      const text = sanitize((item as { text?: unknown }).text).slice(0, 1200)

      if (!role || !text) {
        return null
      }

      return `${role}: ${text}`
    })
    .filter(Boolean)
    .slice(-8)
    .join("\n")
}

const buildSupportBody = (payload: Record<string, unknown>) => {
  return [
    `Name: ${sanitize(payload.name) || "-"}`,
    `Email: ${sanitize(payload.email) || "-"}`,
    `Phone: ${sanitize(payload.phone) || "-"}`,
    `Order number: ${sanitize(payload.orderNumber) || "-"}`,
    `Topic: ${sanitize(payload.topic) || "-"}`,
    "",
    "Message:",
    sanitize(payload.message) || "-",
    sanitizeConversation(payload.conversation)
      ? "\nRecent chat:\n" + sanitizeConversation(payload.conversation)
      : "",
  ].join("\n")
}

const buildFallbackUrl = (payload: Record<string, unknown>) => {
  const subject = encodeURIComponent(
    `[Shreem Support] ${sanitize(payload.topic) || "Customer request"}`
  )
  const body = encodeURIComponent(buildSupportBody(payload))

  return `mailto:${SUPPORT_TO_EMAIL}?subject=${subject}&body=${body}`
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

  if (!payload) {
    return NextResponse.json(
      { message: "We could not read your support request." },
      { status: 400 }
    )
  }

  const email = sanitize(payload.email)
  const name = sanitize(payload.name)
  const topic = sanitize(payload.topic)
  const message = sanitize(payload.message)

  if (!email || !name || !topic || !message) {
    return NextResponse.json(
      { message: "Name, email, topic, and message are required." },
      { status: 400 }
    )
  }

  const fallbackUrl = buildFallbackUrl(payload)
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.SUPPORT_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({
      message:
        "Support mail is ready. We opened your default mail flow because no outbound mail service is configured on this server yet.",
      fallbackUrl,
    })
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [SUPPORT_TO_EMAIL],
      reply_to: email,
      subject: `[Shreem Support] ${topic}`,
      text: buildSupportBody(payload),
    }),
  }).catch(() => null)

  if (!response || !response.ok) {
    return NextResponse.json({
      message:
        "We could not reach the configured mail service. Your support message is ready in the fallback mail flow.",
      fallbackUrl,
    })
  }

  return NextResponse.json({
    message:
      "Your support request has been sent to the Shreem team successfully.",
  })
}
