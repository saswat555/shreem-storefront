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
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Google Login</h1>
        <p className="mt-4 text-base text-ui-fg-subtle">{message}</p>
      </div>
    </main>
  )
}
