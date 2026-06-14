"use client"

import { useState } from "react"
import { useParams } from "next/navigation"

export default function GoogleLoginButton() {
  const params = useParams<{ countryCode: string }>()
  const [loading, setLoading] = useState(false)

  const loginWithGoogle = () => {
    setLoading(true)
    const countryCode = params?.countryCode || "in"
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const query = new URLSearchParams({
      countryCode,
      returnTo,
    })

    window.location.href = `/api/auth/google/start?${query.toString()}`
  }

  return (
    <button
      type="button"
      onClick={loginWithGoogle}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center rounded-md border border-ui-border-base bg-ui-bg-base px-4 text-sm font-medium text-ui-fg-base transition-colors hover:bg-ui-bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Opening Google..." : "Continue with Google"}
    </button>
  )
}
