import { Metadata } from "next"

import { privatePageMetadata } from "@lib/seo/metadata"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Sign in",
  description: "Sign in to your Shreem account.",
}

export default function Login() {
  return <LoginTemplate />
}
