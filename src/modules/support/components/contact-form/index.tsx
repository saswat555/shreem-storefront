"use client"

import { useState } from "react"
import Input from "@modules/common/components/input"

const topics = [
  "Order support",
  "Product guidance",
  "Delivery question",
  "Bulk or farm inquiry",
  "Account issue",
]

export default function SupportContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("submitting")
    setMessage("")

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.message || "We could not send your message.")
      }

      if (result?.fallbackUrl) {
        window.location.href = result.fallbackUrl
      }

      setStatus("success")
      setMessage(
        result?.message ||
          "Your message has been prepared for the support team."
      )
      form.reset()
    } catch (error: any) {
      setStatus("error")
      setMessage(error?.message || "We could not send your message.")
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          name="name"
          label="Full name"
          required
          autoComplete="name"
        />
        <Input
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
        />
        <Input
          name="phone"
          label="Phone"
          autoComplete="tel"
        />
        <Input
          name="orderNumber"
          label="Order number"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--shreem-ink)]">
          What do you need help with?
        </label>
        <select
          name="topic"
          required
          defaultValue=""
          className="h-12 rounded-[18px] border border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] px-4 text-sm text-[var(--shreem-ink)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,108,78,0.12)]"
        >
          <option value="" disabled>
            Select a topic
          </option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--shreem-ink)]">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={6}
          className="w-full rounded-[18px] border border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] px-4 py-3 text-sm leading-6 text-[var(--shreem-ink)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,108,78,0.12)]"
          placeholder="Tell us what happened, what product you are asking about, or what kind of help you need."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--shreem-muted)]">
          Messages go to brajsavitrikrishisanshtan@gmail.com. When a mail
          service is not configured on the server, we prepare the message in
          your default mail client as a fallback.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="brand-primary-button w-full min-w-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
        >
          {status === "submitting" ? "Sending..." : "Send support request"}
        </button>
      </div>

      {status !== "idle" && (
        <div
          className={`rounded-[20px] px-4 py-3 text-sm leading-6 ${
            status === "success"
              ? "bg-[rgba(13,129,126,0.1)] text-[var(--shreem-accent-dark)]"
              : "bg-[rgba(111,33,31,0.08)] text-[var(--shreem-maroon)]"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  )
}
