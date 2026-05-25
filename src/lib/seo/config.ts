const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"])
const DEFAULT_INDEXED_COUNTRY_CODES = ["in"]

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

function parseCountryCodes(raw?: string | null) {
  return (raw || "")
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter((code) => /^[a-z]{2}$/.test(code))
}

export function getIndexedCountryCodes() {
  const configured = parseCountryCodes(
    process.env.NEXT_PUBLIC_INDEXED_COUNTRY_CODES ||
      process.env.NEXT_PUBLIC_SITEMAP_COUNTRY_CODES ||
      process.env.INDEXED_COUNTRY_CODES ||
      process.env.SITEMAP_COUNTRY_CODES
  )

  return configured.length ? configured : DEFAULT_INDEXED_COUNTRY_CODES
}

export function isIndexedCountryCode(countryCode?: string | null) {
  if (!countryCode) {
    return false
  }

  return getIndexedCountryCodes().includes(countryCode.toLowerCase())
}

const SITE_URL_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "SITE_URL",
] as const

/** Raw canonical site URL value from env, normalized when valid. */
export function getConfiguredSiteUrl(): string | null {
  for (const key of SITE_URL_ENV_KEYS) {
    const raw = process.env[key]
    if (!raw) {
      continue
    }

    const normalized = normalizeSiteUrl(raw)
    if (normalized) {
      return normalized
    }
  }

  return null
}

/**
 * Production SEO is active only when the configured canonical site URL is a
 * public HTTPS URL. Local/staging hosts stay noindex until you set the live
 * domain through NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_BASE_URL.
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
