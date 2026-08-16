"use client"

import { clx } from "@medusajs/ui"
import LogoLoader from "@modules/common/components/logo-loader"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
  needsEmail?: boolean
  suggestedTopic?: string
  escalationPrompt?: string
}

type SupportChatProps = {
  customerEmail?: string
  orderCount?: number
}

type EmailDraft = {
  name: string
  email: string
  phone: string
  orderNumber: string
  topic: string
  message: string
}

const SUPPORT_EMAIL = "brajsavitrikrishisanshtan@gmail.com"
const LANGUAGE_KEY = "shreem_site_language_v1"

const getSavedLanguage = () => {
  if (typeof window === "undefined") {
    return "english"
  }

  const saved = window.localStorage.getItem(LANGUAGE_KEY)

  return saved === "hindi" || saved === "hinglish" ? saved : "english"
}

const quickPrompts = [
  "Help me choose the right product",
  "I have a payment or checkout issue",
  "I need help with my order",
  "I want to send details to support",
]

const makeId = () => Math.random().toString(36).slice(2)

export default function SupportChat({
  customerEmail = "",
  orderCount = 0,
}: SupportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "support-welcome",
      role: "assistant",
      text: "Namaste. I can help with orders, product selection, checkout, payments, and account guidance. If your issue needs human follow-up, I will help you prepare the details before anything is emailed.",
    },
  ])
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    name: "",
    email: customerEmail,
    phone: "",
    orderNumber: "",
    topic: "Support request",
    message: "",
  })
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const customerContext = useMemo(() => {
    const parts = [
      customerEmail ? `Signed in as ${customerEmail}` : "Not signed in",
      orderCount ? `${orderCount} account orders visible` : "No account orders visible",
    ]

    return parts.join(". ")
  }, [customerEmail, orderCount])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, showEscalation])

  const updateEmailDraft = (key: keyof EmailDraft, value: string) => {
    setEmailDraft((current) => ({ ...current, [key]: value }))
  }

  const openEscalation = (message?: ChatMessage) => {
    const latestUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === "user")?.text

    setEmailDraft((current) => ({
      ...current,
      email: current.email || customerEmail,
      topic: message?.suggestedTopic || current.topic || "Support request",
      message:
        current.message ||
        latestUserMessage ||
        "I need help from Shreem support.",
    }))
    setShowEscalation(true)
  }

  const askSupport = async (value = draft) => {
    const text = value.trim()

    if (!text || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      text,
    }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setDraft("")
    setIsSending(true)
    setEmailStatus(null)

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
          customerContext,
          language: getSavedLanguage(),
        }),
      })
      const payload = await response.json().catch(() => null)
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text:
          payload?.answer ||
          "I could not complete that answer right now. You can send details to the Shreem team if you want human follow-up.",
        needsEmail: Boolean(payload?.needs_email),
        suggestedTopic: payload?.suggested_topic || "Support request",
        escalationPrompt:
          payload?.escalation_prompt ||
          "Would you like to send these details to the Shreem team?",
      }

      setMessages((current) => [...current, assistantMessage])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text: "I could not reach AI support right now. You can still send details to the Shreem team.",
          needsEmail: true,
          suggestedTopic: "Support request",
          escalationPrompt: "Share your details and we will prepare the email.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const submitSupportEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsEmailSending(true)
    setEmailStatus(null)

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...emailDraft,
          conversation: messages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to send support request.")
      }

      if (payload?.fallbackUrl) {
        window.location.href = payload.fallbackUrl
      }

      setEmailStatus(
        payload?.message ||
          `Your support request is ready for ${SUPPORT_EMAIL}.`
      )
      setShowEscalation(false)
    } catch (error) {
      setEmailStatus(
        error instanceof Error
          ? error.message
          : "Unable to send support request."
      )
    } finally {
      setIsEmailSending(false)
    }
  }

  return (
    <section className="brand-royal-surface overflow-hidden px-3 py-3 small:px-6 small:py-6">
      <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-white/10 bg-black/12 px-4 py-4 text-white/88 small:px-5 small:py-5">
          <p className="brand-kicker text-[#e8c364]">Contact Us</p>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c364]">
                Email
              </p>
              <a href="mailto:brajsavitrikrishisanshtan@gmail.com" className="mt-1 block text-sm font-medium text-white hover:text-[#e8c364] transition-colors">
                brajsavitrikrishisanshtan@gmail.com
              </a>
            </div>
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c364]">
                Phone
              </p>
              <a href="tel:+919120408657" className="mt-1 block text-sm font-medium text-white hover:text-[#e8c364] transition-colors">
                +91 9120408657
              </a>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c364]">
                Account
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                {customerEmail || "Not signed in"}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c364]">
                Orders
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                {orderCount
                  ? `${orderCount} visible in your account`
                  : "Add an order number if your question is order-specific"}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 rounded-[24px] border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 small:px-5">
            <div>
              <p className="text-sm font-semibold text-[#102d36]">
                Live support chat
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Sends email to {SUPPORT_EMAIL} only after you submit details.
              </p>
            </div>
            <span className="rounded-full border border-[#e8c364]/30 bg-[#e8c364]/12 px-3 py-1 text-xs font-semibold text-[#9c6912]">
              Gemini
            </span>
          </div>

          <div
            ref={scrollRef}
            className="max-h-[58vh] min-h-[360px] overflow-y-auto px-3 py-4 small:max-h-[620px] small:px-5"
          >
            <div className="grid gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clx(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={clx(
                      "max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm small:max-w-[78%]",
                      message.role === "user"
                        ? "bg-[#102d36] text-white"
                        : "border border-gray-100 bg-gray-50 text-[#102d36]"
                    )}
                  >
                    <p>{message.text}</p>
                    {message.needsEmail && (
                      <button
                        type="button"
                        onClick={() => openEscalation(message)}
                        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#102d36] px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                      >
                        Send details to support
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <LogoLoader
                    label="Thinking through your support request..."
                    detail="Checking the chat context before suggesting the next step."
                    compact
                  />
                </div>
              )}

              {showEscalation && (
                <form
                  onSubmit={submitSupportEmail}
                  className="rounded-[22px] border border-gray-200 bg-white px-4 py-4 text-[#102d36] shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9c6912]">
                        Human follow-up
                      </p>
                      <h3 className="mt-2 text-[1.65rem] leading-[1]">
                        Send support details
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEscalation(false)}
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SupportInput
                      label="Name"
                      value={emailDraft.name}
                      onChange={(value) => updateEmailDraft("name", value)}
                      required
                    />
                    <SupportInput
                      label="Email"
                      type="email"
                      value={emailDraft.email}
                      onChange={(value) => updateEmailDraft("email", value)}
                      required
                    />
                    <SupportInput
                      label="Phone"
                      value={emailDraft.phone}
                      onChange={(value) => updateEmailDraft("phone", value)}
                    />
                    <SupportInput
                      label="Order number"
                      value={emailDraft.orderNumber}
                      onChange={(value) =>
                        updateEmailDraft("orderNumber", value)
                      }
                    />
                  </div>

                  <div className="mt-3 grid gap-3">
                    <SupportInput
                      label="Topic"
                      value={emailDraft.topic}
                      onChange={(value) => updateEmailDraft("topic", value)}
                      required
                    />
                    <label className="grid gap-2 text-sm font-semibold">
                      Message
                      <textarea
                        value={emailDraft.message}
                        onChange={(event) =>
                          updateEmailDraft("message", event.target.value)
                        }
                        required
                        className="min-h-[124px] rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-normal leading-6 outline-none focus:shadow-[0_0_0_3px_rgba(212,161,38,0.18)]"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isEmailSending}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#102d36] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-gray-800 transition-colors"
                  >
                    {isEmailSending ? "Sending..." : "Send to Shreem support"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 px-3 py-3 small:px-5">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => askSupport(prompt)}
                  className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                askSupport()
              }}
              className="flex gap-2"
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about orders, checkout, product guidance, or support..."
                rows={1}
                className="max-h-28 min-h-12 flex-1 resize-none rounded-[18px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-[#102d36] outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,195,100,0.3)] transition-colors"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="min-h-12 rounded-[18px] bg-[#e8c364] px-5 text-sm font-semibold text-[#102d36] disabled:opacity-50 hover:bg-[#d8b354] transition-colors"
              >
                Send
              </button>
            </form>
          </div>

          {emailStatus && (
            <div className="border-t border-gray-100 px-4 py-3 text-sm leading-6 text-gray-600 small:px-5">
              {emailStatus}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const SupportInput = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) => (
  <label className="grid gap-2 text-sm font-semibold">
    {label}
    <input
      type={type}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-[18px] border border-[#102d36]/12 bg-white/82 px-4 text-sm font-normal outline-none focus:shadow-[0_0_0_3px_rgba(212,161,38,0.18)]"
    />
  </label>
)
