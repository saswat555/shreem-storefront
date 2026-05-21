import { NextResponse } from "next/server"

import { listAllProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { toAbsoluteProductImageUrl } from "@lib/util/absolute-url"
import { getBaseURL } from "@lib/util/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

const stripHtml = (value?: string | null) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const getMerchantShippingPrice = () => {
  const configured = Number(process.env.GOOGLE_MERCHANT_SHIPPING_PRICE_INR)

  return Number.isFinite(configured) && configured >= 0
    ? configured.toFixed(2)
    : "0.00"
}

const getPrimaryCountryCode = async () => {
  const configured = process.env.GOOGLE_MERCHANT_COUNTRY_CODE?.trim().toLowerCase()

  if (configured) {
    return configured
  }

  const regions = await listRegions().catch(() => [])
  return (
    regions
      ?.flatMap((region) => region.countries?.map((country) => country.iso_2))
      .filter(Boolean)
      .map((code) => code!.toLowerCase())[0] || "in"
  )
}

export async function GET() {
  const countryCode = await getPrimaryCountryCode()
  const baseUrl = getBaseURL()
  const shippingPrice = getMerchantShippingPrice()
  const products = await listAllProducts({
    countryCode,
    queryParams: {
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,*images,+metadata,+tags,*collection,*type",
    },
    pageSize: 100,
    maxPages: 30,
  }).catch(() => [])

  const items = products
    .filter((product) => product.handle && product.title)
    .map((product) => {
      const { cheapestPrice } = getProductPrice({ product })
      const imageUrl = toAbsoluteProductImageUrl(
        product.thumbnail || product.images?.[0]?.url
      )
      const metadata = (product.metadata || {}) as Record<string, unknown>
      const availability = product.variants?.some((variant) => {
        const qty = Number((variant as any).inventory_quantity)
        return !Number.isFinite(qty) || qty > 0
      })
        ? "in stock"
        : "out of stock"
      const price =
        cheapestPrice?.calculated_price_number !== undefined
          ? `${cheapestPrice.calculated_price_number.toFixed(2)} ${(
              cheapestPrice.currency_code || "inr"
            ).toUpperCase()}`
          : ""

      return [
        "  <item>",
        `    <g:id>${escapeXml(product.id)}</g:id>`,
        `    <g:title>${escapeXml(product.title)}</g:title>`,
        `    <g:description>${escapeXml(
          stripHtml(product.description) ||
            `Shop ${product.title} from Shreem Cow Products.`
        )}</g:description>`,
        `    <g:link>${escapeXml(
          `${baseUrl}/${countryCode}/products/${product.handle}`
        )}</g:link>`,
        imageUrl
          ? `    <g:image_link>${escapeXml(imageUrl)}</g:image_link>`
          : "",
        price ? `    <g:price>${escapeXml(price)}</g:price>` : "",
        `    <g:availability>${availability}</g:availability>`,
        "    <g:condition>new</g:condition>",
        `    <g:brand>${escapeXml(
          String(metadata.google_brand || metadata.brand || "Shreem")
        )}</g:brand>`,
        `    <g:google_product_category>${escapeXml(
          String(
            metadata.google_product_category ||
              "Food, Beverages & Tobacco > Food Items"
          )
        )}</g:google_product_category>`,
        `    <g:product_type>${escapeXml(
          product.type?.value ||
            product.collection?.title ||
            metadata.product_type ||
            "Cow Products"
        )}</g:product_type>`,
        "    <g:shipping>",
        "      <g:country>IN</g:country>",
        "      <g:service>Standard</g:service>",
        `      <g:price>${shippingPrice} INR</g:price>`,
        "    </g:shipping>",
        "    <g:return_policy_label>standard-return-policy</g:return_policy_label>",
        "  </item>",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Shreem Cow Products</title>
  <link>${escapeXml(baseUrl)}</link>
  <description>Live Shreem product feed for Google Merchant Center free listings.</description>
${items}
</channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
