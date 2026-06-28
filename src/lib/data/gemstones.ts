"use server"

import { sdk } from "@lib/config"

export type GemstoneVendor = {
  id: string
  name: string
  handle: string
  contact_email: string
  contact_phone: string
  city: string
  state: string
  bio: string
  trust_notes: string
  banner_url: string
  logo_url: string
  commission_percent: number
  active: boolean
}

export type GemstoneProduct = {
  id: string
  vendor_id: string
  vendor_name: string
  vendor_handle: string
  medusa_variant_id: string
  medusa_product_id: string
  title: string
  handle: string
  stone_name: string
  planet: string
  rashi: string
  metal: string
  item_type: string
  cut: string
  origin: string
  treatment: string
  certification: string
  quality_grade: string
  color_grade: string
  clarity: string
  shape: string
  sku: string
  lot_number: string
  purpose: string
  lab_report_url: string
  variant_options: GemstoneVariantOption[]
  weight_carats: number
  weight_ratti: number
  size: string
  price_inr: number
  inventory_quantity: number
  image_urls: string[]
  description: string
  recommendation_notes: string
  active: boolean
}

export type GemstoneVariantOption = {
  id: string
  label: string
  medusa_variant_id: string
  form: string
  metal: string
  size: string
  quality_grade: string
  weight_carats: number
  weight_ratti: number
  stone_price_inr: number
  making_charge_inr: number
  total_price_inr: number
  inventory_quantity: number
  active: boolean
}

export const listGemstones = async ({
  vendor,
  stone,
}: {
  vendor?: string
  stone?: string
} = {}) =>
  sdk.client
    .fetch<{
      vendors: GemstoneVendor[]
      products: GemstoneProduct[]
    }>("/store/gemstones", {
      method: "GET",
      query: {
        ...(vendor ? { vendor } : {}),
        ...(stone ? { stone } : {}),
      },
      cache: "no-store",
    })
    .catch(() => ({
      vendors: [],
      products: [],
    }))
