import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const publicSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://shreemfarms.in"
).replace(/\/+$/, "")

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "442141569839-tt32j08mje0mi2jtr7e48s4s6tlh2tp8.apps.googleusercontent.com"

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode") || "in"
  const redirectUri = `${publicSiteUrl}/${countryCode}/auth/google/callback`
  const state = crypto.randomBytes(32).toString("hex")

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  authUrl.searchParams.set("client_id", googleClientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("prompt", "select_account")

  const response = NextResponse.redirect(authUrl.toString())

  response.cookies.set("shreem_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  })

  return response
}
