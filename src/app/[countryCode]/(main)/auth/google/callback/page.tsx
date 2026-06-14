"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

export default function GoogleCallbackPage() {
  const params = useParams<{ countryCode: string }>()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Completing Google sign in...")

  useEffect(() => {
    const countryCode = params?.countryCode || "in"
    const incoming = new URLSearchParams(searchParams.toString())

    if (!incoming.get("code")) {
      setMessage("Google login failed: missing authorization code.")
      return
    }

    incoming.set("countryCode", countryCode)

    window.location.replace(`/api/auth/google/callback?${incoming.toString()}`)
  }, [params?.countryCode, searchParams])

  return (
    <main className="mx-auto flex min-h-[58vh] max-w-xl items-center justify-center px-6 py-16 text-center">
      <div className="w-full rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.9)] px-6 py-8 shadow-[0_18px_42px_rgba(15,49,70,0.08)]">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[rgba(18,63,99,0.16)] border-t-[var(--shreem-teal)]" />
        <h1 className="mt-5 text-2xl font-semibold text-[var(--shreem-ink)]">
          Completing Google sign in
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--shreem-muted)]">
          {message}
        </p>
      </div>
    </main>
  )
}
