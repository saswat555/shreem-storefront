const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"])

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "")
}

function normalizeSiteUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null
    }

    return stripTrailingSlash(`${url.protocol}//${url.host}`)
  } catch {
    return null
  }
}

/** Raw value from NEXT_PUBLIC_SITE_URL (may be invalid). */
export function getConfiguredSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL
  if (!raw) {
    return null
  }

  return normalizeSiteUrl(raw)
}

/**
 * Production SEO is active only when NEXT_PUBLIC_SITE_URL is a public HTTPS URL.
 * Local/staging hosts stay noindex until you set the live domain.
 */
export function isSeoEnabled(): boolean {
  const siteUrl = getConfiguredSiteUrl()
  if (!siteUrl) {
    return false
  }

  try {
    const { hostname, protocol } = new URL(siteUrl)
    if (protocol !== "https:") {
      return false
    }

    return !LOCAL_HOSTS.has(hostname)
  } catch {
    return false
  }
}

export const SEO_DISABLED_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const

export const SEO_ENABLED_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} as const
