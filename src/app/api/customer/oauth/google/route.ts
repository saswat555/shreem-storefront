import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sdk } from "@lib/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(new URL("/in/account", request.url))
  }

  try {
    const response = await sdk.auth.callback("customer", "google", {
      code,
      state
    })

    // AuthCallbackResponse is either a string (the token) or an AuthMfaRequiredResponse.
    // Assuming simple token string for oauth
    const token = typeof response === "string" ? response : (response && typeof response === "object" && "token" in response ? response.token : null);

    if (token) {
      const cookieStore = await cookies()
      cookieStore.set("_medusa_jwt", token, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })
    }

    return NextResponse.redirect(new URL("/in/account", request.url))
  } catch (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(new URL("/in/account?error=oauth_failed", request.url))
  }
}
