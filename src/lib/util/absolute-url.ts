import { getBaseURL } from "@lib/util/env"

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "")

const getBackendURL = () =>
  (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "")

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const isMedusaAssetPath = (value: string) =>
  /^\/(?:uploads?|files?|static)\//i.test(value)

export const toAbsoluteUrl = (
  value?: string | null,
  options: { preferBackend?: boolean } = {}
) => {
  const raw = typeof value === "string" ? value.trim() : ""

  if (!raw) {
    return ""
  }

  if (isAbsoluteUrl(raw)) {
    return raw
  }

  const backendURL = getBackendURL()
  const baseURL =
    options.preferBackend || isMedusaAssetPath(raw)
      ? backendURL || getBaseURL()
      : getBaseURL()

  try {
    return new URL(raw, `${stripTrailingSlash(baseURL)}/`).toString()
  } catch {
    return raw
  }
}

export const toAbsoluteProductImageUrl = (value?: string | null) =>
  toAbsoluteUrl(value, { preferBackend: true })
