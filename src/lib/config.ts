import Medusa from "@medusajs/js-sdk"

// Server-side code can use local backend for speed.
// Browser/client code must use the public domain, otherwise OAuth calls try localhost:9000 in the user's browser.
const MEDUSA_BACKEND_URL =
  typeof window === "undefined"
    ? process.env.MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      "http://localhost:9000"
    : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      "https://www.shreemfarms.in"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug:
    process.env.MEDUSA_DEBUG === "true" ||
    process.env.NEXT_PUBLIC_MEDUSA_DEBUG === "true",
  publishableKey:
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
    "pk_14ea1cd12a8ee731019d8a32c74a3501b5c17e13d9d804ece7a931a194ed0208",
})
