"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

type VendorProfile = {
  id: string
  name: string
  handle: string
  city: string
  state: string
  bio: string
  trust_notes: string
  banner_url: string
  logo_url: string
}

type GemProduct = {
  id?: string
  title?: string
  handle?: string
  stone_name?: string
  planet?: string
  rashi?: string
  metal?: string
  item_type?: string
  cut?: string
  origin?: string
  treatment?: string
  certification?: string
  quality_grade?: string
  color_grade?: string
  clarity?: string
  shape?: string
  sku?: string
  lot_number?: string
  purpose?: string
  lab_report_url?: string
  variant_options?: GemstoneVariantOption[]
  weight_carats?: number
  weight_ratti?: number
  size?: string
  price_inr?: number
  inventory_quantity?: number
  image_urls?: string[]
  description?: string
  recommendation_notes?: string
  medusa_variant_id?: string
  active?: boolean
}

type GemstoneVariantOption = {
  id?: string
  label?: string
  medusa_variant_id?: string
  form?: string
  metal?: string
  size?: string
  quality_grade?: string
  weight_carats?: number
  weight_ratti?: number
  stone_price_inr?: number
  making_charge_inr?: number
  total_price_inr?: number
  inventory_quantity?: number
  active?: boolean
}

const emptyProduct = (): GemProduct => ({
  title: "",
  stone_name: "",
  metal: "Silver",
  item_type: "Ring",
  treatment: "Natural / disclose if treated",
  quality_grade: "",
  color_grade: "",
  clarity: "",
  shape: "",
  sku: "",
  lot_number: "",
  purpose: "",
  lab_report_url: "",
  variant_options: [],
  active: true,
  image_urls: [],
})

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const customerPrice = (vendorBase: unknown) =>
  Math.ceil(Number(vendorBase || 0) / 0.8)

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const PUBLISHABLE_API_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  "pk_14ea1cd12a8ee731019d8a32c74a3501b5c17e13d9d804ece7a931a194ed0208"

const api = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_API_KEY,
      ...(options.headers || {}),
    },
  })
  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json?.message || "Request failed.")
  }

  return json
}

const CSV_COLUMNS = [
  "product_id",
  "title",
  "handle",
  "stone_name",
  "planet",
  "rashi",
  "metal",
  "item_type",
  "cut",
  "origin",
  "treatment",
  "certification",
  "quality_grade",
  "color_grade",
  "clarity",
  "shape",
  "sku",
  "lot_number",
  "purpose",
  "lab_report_url",
  "weight_carats",
  "weight_ratti",
  "size",
  "vendor_base_price_inr",
  "customer_checkout_price_inr",
  "inventory_quantity",
  "image_urls_pipe_separated",
  "description",
  "recommendation_notes",
  "product_active",
  "legacy_medusa_variant_id",
  "option_id",
  "option_label",
  "option_medusa_variant_id",
  "option_form",
  "option_metal",
  "option_size",
  "option_quality_grade",
  "option_weight_carats",
  "option_weight_ratti",
  "option_stone_price_inr",
  "option_making_charge_inr",
  "option_vendor_total_price_inr",
  "option_customer_checkout_price_inr",
  "option_stock",
  "option_active",
]

const csvCell = (value: unknown) => {
  const text = String(value ?? "")
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const downloadCsv = (fileName: string, rows: Record<string, unknown>[]) => {
  const csv = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((key) => csvCell(row[key])).join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

const parseCsv = (text: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      row.push(cell)
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1
      }
      row.push(cell)
      if (row.some((item) => item.trim())) {
        rows.push(row)
      }
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  row.push(cell)
  if (row.some((item) => item.trim())) {
    rows.push(row)
  }

  const [header = [], ...body] = rows
  const columns = header.map((item) => item.trim())

  return body.map((items) =>
    columns.reduce<Record<string, string>>((result, key, index) => {
      result[key] = String(items[index] || "").trim()
      return result
    }, {})
  )
}

const csvNumber = (value: unknown) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const csvBool = (value: unknown, fallback = true) => {
  const text = String(value ?? "").trim().toLowerCase()
  if (!text) return fallback
  return ["true", "yes", "1", "live", "active"].includes(text)
}

const productToCsvRows = (product: GemProduct) => {
  const options = product.variant_options?.length
    ? product.variant_options
    : [
        {
          id: "",
          label: "",
          medusa_variant_id: "",
          form: "",
          metal: "",
          size: "",
          quality_grade: "",
          weight_carats: 0,
          weight_ratti: 0,
          stone_price_inr: 0,
          making_charge_inr: 0,
          total_price_inr: 0,
          inventory_quantity: 0,
          active: true,
        },
      ]

  return options.map((option) => ({
    product_id: product.id || "",
    title: product.title || "",
    handle: product.handle || "",
    stone_name: product.stone_name || "",
    planet: product.planet || "",
    rashi: product.rashi || "",
    metal: product.metal || "",
    item_type: product.item_type || "",
    cut: product.cut || "",
    origin: product.origin || "",
    treatment: product.treatment || "",
    certification: product.certification || "",
    quality_grade: product.quality_grade || "",
    color_grade: product.color_grade || "",
    clarity: product.clarity || "",
    shape: product.shape || "",
    sku: product.sku || "",
    lot_number: product.lot_number || "",
    purpose: product.purpose || "",
    lab_report_url: product.lab_report_url || "",
    weight_carats: product.weight_carats || "",
    weight_ratti: product.weight_ratti || "",
    size: product.size || "",
    vendor_base_price_inr: product.price_inr || "",
    customer_checkout_price_inr: product.price_inr ? customerPrice(product.price_inr) : "",
    inventory_quantity: product.inventory_quantity || "",
    image_urls_pipe_separated: (product.image_urls || []).join("|"),
    description: product.description || "",
    recommendation_notes: product.recommendation_notes || "",
    product_active: product.active === false ? "false" : "true",
    legacy_medusa_variant_id: product.medusa_variant_id || "",
    option_id: option.id || "",
    option_label: option.label || "",
    option_medusa_variant_id: option.medusa_variant_id || "",
    option_form: option.form || "",
    option_metal: option.metal || "",
    option_size: option.size || "",
    option_quality_grade: option.quality_grade || "",
    option_weight_carats: option.weight_carats || "",
    option_weight_ratti: option.weight_ratti || "",
    option_stone_price_inr: option.stone_price_inr || "",
    option_making_charge_inr: option.making_charge_inr || "",
    option_vendor_total_price_inr: option.total_price_inr || "",
    option_customer_checkout_price_inr: option.total_price_inr ? customerPrice(option.total_price_inr) : "",
    option_stock: option.inventory_quantity || "",
    option_active: option.active === false ? "false" : "true",
  }))
}

const productsFromCsvRows = (rows: Record<string, string>[]) => {
  const groups = new Map<string, Record<string, string>[]>()

  rows.forEach((row, index) => {
    const key =
      row.product_id ||
      row.handle ||
      `${row.title || "gemstone"}-${row.lot_number || row.sku || index}`
    groups.set(key, [...(groups.get(key) || []), row])
  })

  return Array.from(groups.values()).map((group) => {
    const first = group[0] || {}
    const options = group
      .map((row) => ({
        id: row.option_id || undefined,
        label: row.option_label,
        medusa_variant_id: row.option_medusa_variant_id,
        form: row.option_form,
        metal: row.option_metal,
        size: row.option_size,
        quality_grade: row.option_quality_grade,
        weight_carats: csvNumber(row.option_weight_carats),
        weight_ratti: csvNumber(row.option_weight_ratti),
        stone_price_inr: csvNumber(row.option_stone_price_inr),
        making_charge_inr: csvNumber(row.option_making_charge_inr),
        total_price_inr:
          csvNumber(row.option_vendor_total_price_inr) ||
          csvNumber(row.option_stone_price_inr) + csvNumber(row.option_making_charge_inr),
        inventory_quantity: Math.max(0, Math.trunc(csvNumber(row.option_stock))),
        active: csvBool(row.option_active, true),
      }))
      .filter((option) =>
        Boolean(
          option.label ||
            option.medusa_variant_id ||
            option.form ||
            option.metal ||
            option.total_price_inr
        )
      )

    return {
      id: first.product_id || undefined,
      title: first.title,
      handle: first.handle,
      stone_name: first.stone_name,
      planet: first.planet,
      rashi: first.rashi,
      metal: first.metal,
      item_type: first.item_type,
      cut: first.cut,
      origin: first.origin,
      treatment: first.treatment,
      certification: first.certification,
      quality_grade: first.quality_grade,
      color_grade: first.color_grade,
      clarity: first.clarity,
      shape: first.shape,
      sku: first.sku,
      lot_number: first.lot_number,
      purpose: first.purpose,
      lab_report_url: first.lab_report_url,
      weight_carats: csvNumber(first.weight_carats),
      weight_ratti: csvNumber(first.weight_ratti),
      size: first.size,
      price_inr: csvNumber(first.vendor_base_price_inr),
      inventory_quantity: Math.max(0, Math.trunc(csvNumber(first.inventory_quantity))),
      image_urls: String(first.image_urls_pipe_separated || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean),
      description: first.description,
      recommendation_notes: first.recommendation_notes,
      medusa_variant_id: first.legacy_medusa_variant_id,
      active: csvBool(first.product_active, true),
      variant_options: options,
    } as GemProduct
  })
}

const sampleCsvRows = () =>
  productToCsvRows({
    title: "Natural Yellow Sapphire 5.25 Ratti",
    handle: "natural-yellow-sapphire-5-25-ratti",
    stone_name: "Yellow Sapphire",
    planet: "Jupiter",
    rashi: "Sagittarius, Pisces",
    metal: "Silver",
    item_type: "Ring",
    cut: "Oval mixed cut",
    origin: "Sri Lanka",
    treatment: "Unheated / disclose clearly",
    certification: "IGI / vendor certificate",
    quality_grade: "Premium",
    color_grade: "Medium golden yellow",
    clarity: "Eye clean",
    shape: "Oval",
    sku: "RS-YS-001",
    lot_number: "LOT-2026-001",
    purpose: "Brihaspati remedy after astrologer review",
    lab_report_url: "https://example.com/lab-report.pdf",
    weight_carats: 4.72,
    weight_ratti: 5.25,
    size: "18",
    price_inr: 8000,
    inventory_quantity: 1,
    image_urls: ["https://example.com/yellow-sapphire-front.jpg"],
    description: "Premium natural yellow sapphire suitable for Jyotish recommendation after review.",
    recommendation_notes: "Use only after confirming Jupiter suitability.",
    active: false,
    variant_options: [
      {
        label: "Stone only",
        medusa_variant_id: "variant_add_medusa_id",
        form: "Stone only",
        metal: "",
        size: "",
        quality_grade: "Premium",
        weight_carats: 4.72,
        weight_ratti: 5.25,
        stone_price_inr: 8000,
        making_charge_inr: 0,
        total_price_inr: 8000,
        inventory_quantity: 1,
        active: true,
      },
      {
        label: "Silver ring size 18",
        medusa_variant_id: "variant_add_second_medusa_id",
        form: "Ring",
        metal: "Silver",
        size: "18",
        quality_grade: "Premium",
        weight_carats: 4.72,
        weight_ratti: 5.25,
        stone_price_inr: 8000,
        making_charge_inr: 1200,
        total_price_inr: 9200,
        inventory_quantity: 1,
        active: true,
      },
    ],
  })

const VendorPortal = () => {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [products, setProducts] = useState<GemProduct[]>([])
  const [draft, setDraft] = useState<GemProduct>(emptyProduct())
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft" | "out">("all")
  const [sortBy, setSortBy] = useState<"updated" | "price" | "stock" | "stone">("updated")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const haystack = [
        product.title,
        product.stone_name,
        product.planet,
        product.rashi,
        product.metal,
        product.item_type,
        product.certification,
        product.quality_grade,
        product.color_grade,
        product.clarity,
        product.sku,
        product.lot_number,
        product.purpose,
        product.medusa_variant_id,
        ...(product.variant_options || []).flatMap((option) => [
          option.label,
          option.medusa_variant_id,
          option.form,
          option.metal,
          option.size,
          option.quality_grade,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !needle || haystack.includes(needle)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && product.active !== false && Number(product.inventory_quantity || 0) > 0) ||
        (statusFilter === "draft" && product.active === false) ||
        (statusFilter === "out" && Number(product.inventory_quantity || 0) <= 0)

      return matchesSearch && matchesStatus
    })

    return filtered.sort((a, b) => {
      if (sortBy === "price") return Number(b.price_inr || 0) - Number(a.price_inr || 0)
      if (sortBy === "stock") return Number(b.inventory_quantity || 0) - Number(a.inventory_quantity || 0)
      if (sortBy === "stone") return String(a.stone_name || a.title || "").localeCompare(String(b.stone_name || b.title || ""))
      return String(b.id || "").localeCompare(String(a.id || ""))
    })
  }, [products, search, sortBy, statusFilter])

  const stats = useMemo(() => {
    const live = products.filter((item) => item.active !== false).length
    const stock = products.reduce((total, item) => total + Number(item.inventory_quantity || 0), 0)
    const value = products.reduce(
      (total, item) => total + Number(item.price_inr || 0) * Number(item.inventory_quantity || 0),
      0
    )
    const unmapped = products.filter(
      (item) =>
        !item.medusa_variant_id &&
        !(item.variant_options || []).some((option) => option.medusa_variant_id)
    ).length

    return { live, stock, value, unmapped }
  }, [products])

  const load = useCallback(async () => {
    try {
      const data = await api("/store/gemstone-vendor/me")
      setLoggedIn(true)
      setProfile(data.profile)
      setProducts(data.products || [])
      setDraft((current) =>
        !current.id && data.products?.[0] ? data.products[0] : current
      )
    } catch {
      setLoggedIn(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const login = async () => {
    setSaving(true)
    setMessage("")

    try {
      await api("/store/gemstone-vendor/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      await load()
      setPassword("")
    } catch (error: any) {
      setMessage(error?.message || "Login failed.")
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await api("/store/gemstone-vendor/logout", { method: "POST" }).catch(
      () => undefined
    )
    setLoggedIn(false)
    setProfile(null)
    setProducts([])
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage("")

    try {
      await api("/store/gemstone-vendor/profile", {
        method: "POST",
        body: JSON.stringify({ profile }),
      })
      await load()
      setMessage("Profile saved.")
    } catch (error: any) {
      setMessage(error?.message || "Could not save profile.")
    } finally {
      setSaving(false)
    }
  }

  const saveProduct = async () => {
    setSaving(true)
    setMessage("")

    try {
      await api("/store/gemstone-vendor/products", {
        method: "POST",
        body: JSON.stringify({ product: draft }),
      })
      await load()
      setMessage("Gemstone saved.")
    } catch (error: any) {
      setMessage(error?.message || "Could not save gemstone.")
    } finally {
      setSaving(false)
    }
  }

  const archiveProduct = async () => {
    if (!draft.id) {
      setDraft({ ...draft, active: false })
      return
    }

    setDraft((current) => ({ ...current, active: false }))
    setSaving(true)
    setMessage("")

    try {
      await api("/store/gemstone-vendor/products", {
        method: "POST",
        body: JSON.stringify({ product: { ...draft, active: false } }),
      })
      await load()
      setMessage("Gemstone archived. It is hidden from the public sub-shop.")
    } catch (error: any) {
      setMessage(error?.message || "Could not archive gemstone.")
    } finally {
      setSaving(false)
    }
  }

  const duplicateProduct = () => {
    const copy = {
      ...draft,
      id: undefined,
      handle: "",
      medusa_variant_id: "",
      variant_options: [],
      sku: "",
      lot_number: "",
      title: draft.title ? `${draft.title} - new lot` : "",
      active: false,
    }
    setDraft(copy)
    setMessage("Duplicated as a draft. Add the new variant ID, SKU/lot, weight and price before publishing.")
  }

  const changePassword = async () => {
    setSaving(true)
    setMessage("")

    try {
      await api("/store/gemstone-vendor/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      setCurrentPassword("")
      setNewPassword("")
      setMessage("Password changed.")
    } catch (error: any) {
      setMessage(error?.message || "Could not change password.")
    } finally {
      setSaving(false)
    }
  }

  const updateOption = (
    index: number,
    patch: Partial<GemstoneVariantOption>
  ) => {
    const next = [...(draft.variant_options || [])]
    next[index] = { ...next[index], ...patch }
    setDraft({ ...draft, variant_options: next })
  }

  const addOption = () => {
    setDraft({
      ...draft,
      variant_options: [
        ...(draft.variant_options || []),
        {
          id: `local-${Date.now()}`,
          label: "",
          form: "Ring",
          metal: "Silver",
          size: "",
          quality_grade: draft.quality_grade || "",
          stone_price_inr: Number(draft.price_inr || 0),
          making_charge_inr: 0,
          total_price_inr: Number(draft.price_inr || 0),
          inventory_quantity: 1,
          active: true,
        },
      ],
    })
  }

  const removeOption = (index: number) => {
    setDraft({
      ...draft,
      variant_options: (draft.variant_options || []).filter((_, itemIndex) => itemIndex !== index),
    })
  }

  const upload = async (file: File, onUrl: (url: string) => void) => {
    setSaving(true)
    setMessage("")

    try {
      const contentBase64 = await readFileAsBase64(file)
      const data = await api("/store/gemstone-vendor/image", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          contentBase64,
        }),
      })

      if (data.image?.url) {
        onUrl(data.image.url)
        setMessage("Image uploaded. Save to keep it.")
      }
    } catch (error: any) {
      setMessage(error?.message || "Image upload failed.")
    } finally {
      setSaving(false)
    }
  }

  const downloadTemplate = () => {
    downloadCsv("shreem-gemstone-upload-template.csv", sampleCsvRows())
    setMessage("CSV template downloaded. Open it in Google Sheets, fill it, then upload it back as CSV.")
  }

  const exportInventory = () => {
    downloadCsv(
      `shreem-gemstone-inventory-${profile?.handle || "vendor"}.csv`,
      products.length ? products.flatMap(productToCsvRows) : sampleCsvRows()
    )
    setMessage("Inventory CSV exported.")
  }

  const importInventoryCsv = async (file: File) => {
    setSaving(true)
    setMessage("")

    try {
      const rows = parseCsv(await file.text())
      const parsedProducts = productsFromCsvRows(rows).filter(
        (product) => product.title || product.stone_name || product.handle
      )

      if (!parsedProducts.length) {
        throw new Error("No valid gemstone rows found in the CSV.")
      }

      for (const product of parsedProducts) {
        await api("/store/gemstone-vendor/products", {
          method: "POST",
          body: JSON.stringify({ product }),
        })
      }

      await load()
      setMessage(`Imported ${parsedProducts.length} gemstone product${parsedProducts.length === 1 ? "" : "s"} from CSV.`)
    } catch (error: any) {
      setMessage(error?.message || "Could not import CSV.")
    } finally {
      setSaving(false)
    }
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[var(--shreem-bg)] py-10">
        <section className="content-container">
          <div className="mx-auto max-w-md rounded-[28px] border border-[rgba(18,63,99,0.12)] bg-white/92 p-6 shadow-[0_24px_70px_rgba(18,63,99,0.12)]">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpeg" width={56} height={56} alt="Shreem" className="rounded-2xl" />
              <div>
                <p className="brand-kicker">Shreem Gem Network</p>
                <h1 className="text-2xl font-semibold text-[var(--shreem-ink)]">
                  Vendor login
                </h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
              Access is created by Shreem admin only. Vendors can manage gemstone
              listings, images and stock. Customer data remains with Shreem.
            </p>
            <div className="mt-5 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Vendor email"
                className="w-full rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm"
              />
              <button
                onClick={login}
                disabled={saving}
                className="w-full rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-5 py-3 text-sm font-semibold text-white"
              >
                {saving ? "Please wait..." : "Login"}
              </button>
              {message && <p className="text-sm text-[var(--shreem-muted)]">{message}</p>}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--shreem-bg)] py-8">
      <section className="content-container space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-[rgba(18,63,99,0.12)] bg-white/90 p-5">
          <div>
            <p className="brand-kicker">Gemstone vendor portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--shreem-ink)]">
              {profile?.name || "Vendor"}
            </h1>
            <p className="mt-2 text-sm text-[var(--shreem-muted)]">
              Manage only your gemstone sub-shop. Orders, customer data and payouts are handled by Shreem.
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-[var(--shreem-border)] px-4 py-2 text-sm font-semibold text-[var(--shreem-ink)]"
          >
            Logout
          </button>
          {profile?.handle && (
            <Link
              href={`/in/gemstones/${profile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-4 py-2 text-sm font-semibold text-white"
            >
              Preview store
            </Link>
          )}
        </div>

        {message && (
          <div className="rounded-[18px] border border-[rgba(13,129,126,0.18)] bg-white/86 px-4 py-3 text-sm text-[var(--shreem-muted)]">
            {message}
          </div>
        )}

        {profile && (
          <section className="rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/90 p-5">
            <h2 className="text-xl font-semibold text-[var(--shreem-ink)]">Sub-shop profile</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Name", "name"],
                ["Handle", "handle"],
                ["City", "city"],
                ["State", "state"],
                ["Banner URL", "banner_url"],
                ["Logo URL", "logo_url"],
              ].map(([label, key]) => (
                <label key={key} className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                  {label}
                  <input
                    value={(profile as any)[key] || ""}
                    onChange={(event) => setProfile({ ...profile, [key]: event.target.value } as VendorProfile)}
                    className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                Bio
                <textarea
                  rows={4}
                  value={profile.bio || ""}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                Trust notes
                <textarea
                  rows={4}
                  value={profile.trust_notes || ""}
                  onChange={(event) => setProfile({ ...profile, trust_notes: event.target.value })}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) upload(file, (url) => setProfile({ ...profile, banner_url: url }))
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) upload(file, (url) => setProfile({ ...profile, logo_url: url }))
                }}
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-4 rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-5 py-3 text-sm font-semibold text-white"
            >
              Save profile
            </button>
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--shreem-ink)]">Inventory</h2>
                <p className="mt-1 text-xs text-[var(--shreem-muted)]">
                  Each row should map to one sellable Medusa variant.
                </p>
              </div>
              <button
                onClick={() => setDraft(emptyProduct())}
                className="rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-3 py-2 text-xs font-semibold text-white"
              >
                New
              </button>
            </div>

            <div className="mt-4 rounded-[20px] border border-[rgba(18,63,99,0.10)] bg-[rgba(255,252,248,0.78)] p-3">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                Bulk upload with CSV / Google Sheets
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                Download the template, edit in Google Sheets, export as CSV, then upload.
                Repeat product details across rows and add one option per row.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="rounded-full border border-[var(--shreem-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
                >
                  Download template
                </button>
                <button
                  type="button"
                  onClick={exportInventory}
                  className="rounded-full border border-[var(--shreem-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
                >
                  Export inventory
                </button>
                <label className="cursor-pointer rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-3 py-2 text-xs font-semibold text-white">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    disabled={saving}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.currentTarget.value = ""
                      if (file) {
                        importInventoryCsv(file)
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[
                ["Live", stats.live],
                ["Stock", stats.stock],
                ["Value", money(stats.value)],
                ["Needs variant", stats.unmapped],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.76)] px-3 py-2">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[var(--shreem-gold-deep)]">{label}</p>
                  <p className="mt-1 text-base font-semibold text-[var(--shreem-ink)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stone, SKU, lot, planet, quality..."
                className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as any)}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="live">Live in stock</option>
                  <option value="out">Out of stock</option>
                  <option value="draft">Draft/hidden</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as any)}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-3 py-2 text-sm"
                >
                  <option value="updated">Recently edited</option>
                  <option value="price">Price high first</option>
                  <option value="stock">Stock high first</option>
                  <option value="stone">Stone A-Z</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setDraft(product)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition hover:border-[rgba(13,129,126,0.34)]",
                    draft.id === product.id
                      ? "border-[rgba(13,129,126,0.44)] bg-[rgba(240,248,246,0.85)]"
                      : "border-[var(--shreem-border)] bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[var(--shreem-ink)]">{product.title || product.stone_name}</p>
                    <span className={[
                      "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                      product.active === false
                        ? "bg-slate-100 text-slate-600"
                        : Number(product.inventory_quantity || 0) > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}>
                      {product.active === false
                        ? "draft"
                        : Number(product.inventory_quantity || 0) > 0
                        ? "live"
                        : "out"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {product.stone_name} · {product.quality_grade || "quality not set"} · {product.weight_carats || 0} ct / {product.weight_ratti || 0} ratti
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {money(product.price_inr)} · stock {product.inventory_quantity || 0} · {product.sku || product.lot_number || "SKU/lot missing"}
                  </p>
                  {!product.medusa_variant_id && (
                    <p className="mt-2 rounded-xl bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      Add Medusa variant ID before publishing.
                    </p>
                  )}
                </button>
              ))}
              {!filteredProducts.length && (
                <p className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-4 text-sm text-[var(--shreem-muted)]">
                  No stones match this search/filter.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/90 p-5">
            <h2 className="text-xl font-semibold text-[var(--shreem-ink)]">Gemstone details</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Title", "title"],
                ["Handle", "handle"],
                ["Medusa variant ID", "medusa_variant_id"],
                ["Stone name", "stone_name"],
                ["Planet", "planet"],
                ["Rashi", "rashi"],
                ["Metal", "metal"],
                ["Ring / Pendant / Loose", "item_type"],
                ["Cut", "cut"],
                ["Origin", "origin"],
                ["Treatment", "treatment"],
                ["Certification", "certification"],
                ["Quality grade", "quality_grade"],
                ["Color grade", "color_grade"],
                ["Clarity", "clarity"],
                ["Shape", "shape"],
                ["SKU", "sku"],
                ["Lot number", "lot_number"],
                ["Purpose / use case", "purpose"],
                ["Lab report URL", "lab_report_url"],
                ["Size", "size"],
              ].map(([label, key]) => (
                <label key={key} className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                  {label}
                  <input
                    value={(draft as any)[key] || ""}
                    onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                    className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                  />
                </label>
              ))}
              {[
                ["Carat", "weight_carats"],
                ["Ratti", "weight_ratti"],
                ["Price INR", "price_inr"],
                ["Inventory", "inventory_quantity"],
              ].map(([label, key]) => (
                <label key={key} className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                  {label}
                  <input
                    type="number"
                    value={(draft as any)[key] || 0}
                    onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value || 0) })}
                    className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.72)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--shreem-ink)]">
                    Sellable jewellery options
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    Add every option the customer can buy: stone only, silver ring by size,
                    gold ring by size, pendant, etc. Each option must map to its own Medusa variant ID.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="rounded-full bg-[rgba(13,129,126,0.1)] px-4 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
                >
                  Add option
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {(draft.variant_options || []).map((option, index) => (
                  <div key={option.id || index} className="rounded-[20px] border border-[var(--shreem-border)] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--shreem-ink)]">
                        Option {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {[
                        ["Label", "label"],
                        ["Medusa variant ID", "medusa_variant_id"],
                        ["Form", "form"],
                        ["Metal", "metal"],
                        ["Size", "size"],
                        ["Quality", "quality_grade"],
                      ].map(([label, key]) => (
                        <label key={key} className="grid gap-1 text-xs font-semibold text-[var(--shreem-ink)]">
                          {label}
                          <input
                            value={(option as any)[key] || ""}
                            onChange={(event) => updateOption(index, { [key]: event.target.value } as any)}
                            className="rounded-2xl border border-[var(--shreem-border)] bg-white px-3 py-2 text-sm font-normal"
                          />
                        </label>
                      ))}
                      {[
                        ["Carat", "weight_carats"],
                        ["Ratti", "weight_ratti"],
                        ["Stone price INR", "stone_price_inr"],
                        ["Making charge INR", "making_charge_inr"],
                        ["Total price INR", "total_price_inr"],
                        ["Stock", "inventory_quantity"],
                      ].map(([label, key]) => (
                        <label key={key} className="grid gap-1 text-xs font-semibold text-[var(--shreem-ink)]">
                          {label}
                          <input
                            type="number"
                            value={(option as any)[key] || 0}
                            onChange={(event) => {
                              const value = Number(event.target.value || 0)
                              const patch: any = { [key]: value }
                              if (key === "stone_price_inr" || key === "making_charge_inr") {
                                const stonePrice =
                                  key === "stone_price_inr" ? value : Number(option.stone_price_inr || 0)
                                const makingCharge =
                                  key === "making_charge_inr" ? value : Number(option.making_charge_inr || 0)
                                patch.total_price_inr = stonePrice + makingCharge
                              }
                              updateOption(index, patch)
                            }}
                            className="rounded-2xl border border-[var(--shreem-border)] bg-white px-3 py-2 text-sm font-normal"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--shreem-ink)]">
                      <input
                        type="checkbox"
                        checked={option.active !== false}
                        onChange={(event) => updateOption(index, { active: event.target.checked })}
                      />
                      Live option
                    </label>
                    <p className="mt-3 rounded-2xl bg-[rgba(13,129,126,0.08)] px-4 py-3 text-xs leading-5 text-[var(--shreem-ink)]">
                      Customer checkout price: <strong>{money(customerPrice(option.total_price_inr))}</strong>.
                      Set this same amount on the mapped Medusa variant so checkout, invoice and payout stay correct.
                    </p>
                  </div>
                ))}
                {!(draft.variant_options || []).length && (
                  <p className="rounded-2xl border border-dashed border-[var(--shreem-border)] bg-white px-4 py-4 text-sm text-[var(--shreem-muted)]">
                    No option matrix yet. Add options if this stone can be sold as
                    stone only, ring, pendant, or different metals/sizes.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                Description
                <textarea
                  rows={4}
                  value={draft.description || ""}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
                Recommendation notes
                <textarea
                  rows={4}
                  value={draft.recommendation_notes || ""}
                  onChange={(event) => setDraft({ ...draft, recommendation_notes: event.target.value })}
                  className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
                />
              </label>
            </div>
            <label className="mt-3 grid gap-1 text-sm font-semibold text-[var(--shreem-ink)]">
              Image URLs
              <textarea
                rows={3}
                value={(draft.image_urls || []).join("\n")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    image_urls: event.target.value.split(/\n+/).map((item) => item.trim()).filter(Boolean),
                  })
                }
                className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm font-normal"
              />
            </label>
            <input
              className="mt-3"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  upload(file, (url) => setDraft({ ...draft, image_urls: [...(draft.image_urls || []), url] }))
                }
              }}
            />
            {(draft.image_urls || []).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {(draft.image_urls || []).slice(0, 8).map((url) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--shreem-border)] bg-[#f5efdf]">
                    <Image src={url} alt={draft.title || "Gemstone"} fill sizes="160px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            {!draft.medusa_variant_id && draft.active !== false && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Add the Medusa variant ID before making this live, otherwise checkout cannot sell this exact stone lot.
              </p>
            )}
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--shreem-ink)]">
              <input
                type="checkbox"
                checked={draft.active !== false}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Live in gemstone sub-shop
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={saveProduct}
                disabled={saving}
                className="rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-5 py-3 text-sm font-semibold text-white"
              >
                Save gemstone
              </button>
              <button
                onClick={duplicateProduct}
                disabled={saving}
                className="rounded-full border border-[var(--shreem-border)] px-5 py-3 text-sm font-semibold text-[var(--shreem-ink)]"
              >
                Duplicate as new lot
              </button>
              <button
                onClick={archiveProduct}
                disabled={saving}
                className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800"
              >
                Archive
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/90 p-5">
          <h2 className="text-xl font-semibold text-[var(--shreem-ink)]">Change password</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              className="rounded-2xl border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={saving}
            className="mt-4 rounded-full border border-[var(--shreem-border)] px-5 py-3 text-sm font-semibold text-[var(--shreem-ink)]"
          >
            Change password
          </button>
        </section>
      </section>
    </main>
  )
}

export default VendorPortal
