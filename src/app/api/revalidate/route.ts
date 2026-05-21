import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RevalidatePayload = {
  secret?: unknown
  tag?: unknown
  tags?: unknown
  path?: unknown
  paths?: unknown
  handle?: unknown
  handles?: unknown
  countryCode?: unknown
  countryCodes?: unknown
}

const PRODUCT_TAGS = ["products", "collections", "categories"]

const getSecret = () =>
  process.env.REVALIDATE_SECRET || process.env.STOREFRONT_REVALIDATE_SECRET || ""

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const asStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean)
  }

  const single = asString(value)
  return single ? [single] : []
}

const sanitizePath = (path: string) => {
  const trimmed = path.trim()
  if (!trimmed || trimmed.includes("://")) {
    return ""
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

const getDefaultCountryCodes = () =>
  (process.env.REVALIDATE_COUNTRY_CODES || "in")
    .split(",")
    .map((countryCode) => countryCode.trim().toLowerCase())
    .filter(Boolean)

const isAuthorized = (request: NextRequest, payload?: RevalidatePayload) => {
  const configuredSecret = getSecret()

  if (!configuredSecret) {
    return false
  }

  const providedSecret =
    request.headers.get("x-revalidate-secret") ||
    request.nextUrl.searchParams.get("secret") ||
    asString(payload?.secret)

  return providedSecret === configuredSecret
}

const buildRevalidationPlan = (payload: RevalidatePayload = {}) => {
  const handles = Array.from(
    new Set([...asStringList(payload.handle), ...asStringList(payload.handles)])
  )
  const explicitTags = [
    ...asStringList(payload.tag),
    ...asStringList(payload.tags),
  ]
  const tags = Array.from(
    new Set([
      ...PRODUCT_TAGS,
      ...explicitTags,
      ...handles.map((handle) => `product:${handle}`),
    ])
  )

  const countryCodes = asStringList(payload.countryCodes)
    .concat(asStringList(payload.countryCode))
    .map((countryCode) => countryCode.toLowerCase())
  const effectiveCountryCodes = countryCodes.length
    ? Array.from(new Set(countryCodes))
    : getDefaultCountryCodes()

  const paths = [
    ...asStringList(payload.path),
    ...asStringList(payload.paths),
    "/sitemap.xml",
    "/api/google/products.xml",
    ...effectiveCountryCodes.flatMap((countryCode) => [
      `/${countryCode}`,
      `/${countryCode}/store`,
      `/${countryCode}/prakriti-guide`,
      ...handles.map((handle) => `/${countryCode}/products/${handle}`),
    ]),
  ]
    .map(sanitizePath)
    .filter(Boolean)

  return {
    tags,
    paths: Array.from(new Set(paths)),
  }
}

const revalidateStorefront = (payload?: RevalidatePayload) => {
  const plan = buildRevalidationPlan(payload)

  for (const tag of plan.tags) {
    revalidateTag(tag)
  }

  for (const path of plan.paths) {
    revalidatePath(path)
  }

  return plan
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as RevalidatePayload

  if (!isAuthorized(request, payload)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const plan = revalidateStorefront(payload)

  return NextResponse.json({ ok: true, ...plan })
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const payload: RevalidatePayload = {
    tag: searchParams.getAll("tag"),
    path: searchParams.getAll("path"),
    handle: searchParams.get("handle"),
    countryCodes: searchParams.getAll("countryCode"),
  }
  const plan = revalidateStorefront(payload)

  return NextResponse.json({ ok: true, ...plan })
}
