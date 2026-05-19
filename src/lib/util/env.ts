import { getConfiguredSiteUrl, isSeoEnabled } from "@lib/seo/config"

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "")
}

export const getBaseURL = () => {
  if (isSeoEnabled()) {
    return getConfiguredSiteUrl()!
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL)
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:8000"
}
