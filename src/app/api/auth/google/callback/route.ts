import { NextRequest, NextResponse } from "next/server"
import { setAuthToken } from "@lib/data/cookies"

export const dynamic = "force-dynamic"

const backendUrl = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://127.0.0.1:9000"
).replace(/\/+$/, "")

const publicSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.shreemfarms.in"
).replace(/\/+$/, "")

const googleOAuthRedirectBaseUrl = (
  process.env.GOOGLE_OAUTH_REDIRECT_BASE_URL ||
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_BASE_URL ||
  "https://shreemfarms.in"
).replace(/\/+$/, "")

const publishableKey =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  "pk_14ea1cd12a8ee731019d8a32c74a3501b5c17e13d9d804ece7a931a194ed0208"

const buildHomeUrl = (countryCode: string) =>
  `${publicSiteUrl}/${countryCode || "in"}`

const buildAccountUrl = (countryCode: string, error: string) =>
  `${publicSiteUrl}/${countryCode || "in"}/account?google_error=${encodeURIComponent(error)}`

const sanitizeCountryCode = (value: string | null) =>
  (value || "in").replace(/[^a-z]/gi, "").toLowerCase().slice(0, 4) || "in"

const sanitizeReturnTo = (value: string | undefined, countryCode: string) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return buildHomeUrl(countryCode)
  }

  try {
    const parsed = new URL(value, publicSiteUrl)

    if (parsed.origin !== publicSiteUrl) {
      return buildHomeUrl(countryCode)
    }

    const allowedPrefix = `/${countryCode}`

    if (
      parsed.pathname !== allowedPrefix &&
      !parsed.pathname.startsWith(`${allowedPrefix}/`)
    ) {
      return buildHomeUrl(countryCode)
    }

    return `${publicSiteUrl}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return buildHomeUrl(countryCode)
  }
}

const clearOAuthCookies = (response: NextResponse) => {
  for (const name of [
    "shreem_google_oauth_state",
    "shreem_google_oauth_return_to",
  ]) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: -1,
    })
  }

  return response
}

export async function GET(req: NextRequest) {
  const countryCode = sanitizeCountryCode(req.nextUrl.searchParams.get("countryCode"))
  const code = req.nextUrl.searchParams.get("code") || ""
  const returnedState = req.nextUrl.searchParams.get("state") || ""
  const storedState = req.cookies.get("shreem_google_oauth_state")?.value || ""
  const returnTo = sanitizeReturnTo(
    req.cookies.get("shreem_google_oauth_return_to")?.value,
    countryCode
  )

  if (!code) {
    return NextResponse.redirect(buildAccountUrl(countryCode, "missing_code"))
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(buildAccountUrl(countryCode, "invalid_google_state"))
  }

  try {
    const redirectUri = `${googleOAuthRedirectBaseUrl}/${countryCode}/auth/google/callback`

    const upstream = await fetch(`${backendUrl}/store/auth/google-direct-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    })

    const body = await upstream.json().catch(() => ({}))

    if (!upstream.ok || !body?.token) {
      console.error("[google-oauth-api-callback] direct backend failed", {
        status: upstream.status,
        body,
      })

      return NextResponse.redirect(
        buildAccountUrl(countryCode, body?.message || "google_direct_callback_failed")
      )
    }

    await setAuthToken(body.token)

    return clearOAuthCookies(NextResponse.redirect(returnTo))
  } catch (error: any) {
    console.error("[google-oauth-api-callback] failed", {
      message: error?.message,
      stack: error?.stack,
    })

    return NextResponse.redirect(
      buildAccountUrl(countryCode, error?.message || "google_oauth_failed")
    )
  }
}
