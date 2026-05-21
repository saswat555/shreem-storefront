"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import LogoLoader from "@modules/common/components/logo-loader"
import MotionReveal from "@modules/common/components/motion-reveal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"

import {
  getRelevantPrakritiProducts,
  matchRecommendedProduct,
} from "@lib/util/prakriti"
import type { PrakritiProduct, PrakritiSubject } from "@lib/util/prakriti"

type GuideResult = {
  likely_condition: string
  case_summary: string
  confidence: "low" | "medium" | "high"
  confidence_reason: string
  observations: string[]
  possible_causes: string[]
  immediate_home_steps: string[]
  natural_remedy: string
  monitoring_plan: string[]
  prevention_tips: string[]
  urgent_care_signs: string[]
  recommended_products: {
    handle: string
    title: string
    advantage: string
    how_to_use: string
    reason_match: string
  }[]
}

type PreparedImage = {
  id: string
  name: string
  dataUrl: string
}

type GuideChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
  result?: GuideResult
  imageCount?: number
}

type CaseMeta = {
  subjectName: string
  environment: string
  duration: string
}

type PrakritiGuideProps = {
  products: PrakritiProduct[]
  model: string
}

const careToolName = "GrowBuddy AI"
const LANGUAGE_KEY = "shreem_site_language_v1"

const makeId = () => Math.random().toString(36).slice(2)

const getSavedLanguage = () => {
  if (typeof window === "undefined") {
    return "english"
  }

  const saved = window.localStorage.getItem(LANGUAGE_KEY)

  return saved === "hindi" || saved === "hinglish" ? saved : "english"
}

const resizeImageToDataUrl = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.")
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Unable to read image"))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Unable to process image"))
    img.src = rawDataUrl
  })

  const maxEdge = 1400
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Unable to create image canvas")
  }

  context.drawImage(image, 0, 0, width, height)

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg"
  const dataUrl = canvas.toDataURL(mimeType, 0.84)

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    dataUrl,
  }
}

const asList = (value: unknown) => (Array.isArray(value) ? value : [])

const asStringList = (value: unknown) =>
  asList(value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)

const getText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() || fallback : fallback

const parseGuideResult = (
  raw: unknown,
  products: PrakritiProduct[],
  subject: PrakritiSubject
): GuideResult => {
  const parsedValue = typeof raw === "string" ? JSON.parse(raw) : raw
  const parsed =
    parsedValue && typeof parsedValue === "object"
      ? (parsedValue as Partial<GuideResult>)
      : {}

  const filteredRecommendations = asList(parsed.recommended_products)
    .map((recommendation) => {
      if (!recommendation || typeof recommendation !== "object") {
        return null
      }

      const item = recommendation as Partial<
        GuideResult["recommended_products"][number]
      >
      const matchedProduct = matchRecommendedProduct(products, item)

      if (!matchedProduct) {
        return null
      }

      const relevantProducts = getRelevantPrakritiProducts([matchedProduct], subject)

      if (!relevantProducts.length) {
        return null
      }

      return {
        handle: matchedProduct.handle,
        title: matchedProduct.title,
        advantage: getText(item.advantage),
        how_to_use: getText(item.how_to_use),
        reason_match: getText(item.reason_match),
      }
    })
    .filter(Boolean) as GuideResult["recommended_products"]

  const confidence =
    parsed.confidence === "high" ||
    parsed.confidence === "medium" ||
    parsed.confidence === "low"
      ? parsed.confidence
      : "low"

  return {
    likely_condition: getText(parsed.likely_condition, "Care check result"),
    case_summary:
      getText(parsed.case_summary) ||
      "GrowBuddy AI reviewed the images and your notes to create a first-pass care plan.",
    confidence,
    confidence_reason: getText(parsed.confidence_reason),
    observations: asStringList(parsed.observations),
    possible_causes: asStringList(parsed.possible_causes),
    immediate_home_steps: asStringList(parsed.immediate_home_steps),
    natural_remedy: getText(parsed.natural_remedy),
    monitoring_plan: asStringList(parsed.monitoring_plan),
    prevention_tips: asStringList(parsed.prevention_tips),
    urgent_care_signs: asStringList(parsed.urgent_care_signs),
    recommended_products: filteredRecommendations,
  }
}

export default function PrakritiGuide({ products, model }: PrakritiGuideProps) {
  const [subject, setSubject] = useState<PrakritiSubject>("plant")
  const [caseMeta, setCaseMeta] = useState<CaseMeta>({
    subjectName: "",
    environment: "",
    duration: "",
  })
  const [notes, setNotes] = useState("")
  const [images, setImages] = useState<PreparedImage[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [, setResult] = useState<GuideResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<GuideChatMessage[]>([
    {
      id: "growbuddy-welcome",
      role: "assistant",
      text: "Start a case by choosing plant or animal, adding the brief, attaching photos, and then asking your care question in the same console.",
    },
  ])
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const relevantProducts = useMemo(
    () => getRelevantPrakritiProducts(products, subject),
    [products, subject]
  )

  const canAnalyze = images.length > 0 && notes.trim().length >= 12
  const promptSeeds =
    subject === "plant"
      ? [
          "Leaves are turning yellow after watering.",
          "There are spots on the leaves and weak growth.",
          "The plant is drooping even though soil is moist.",
        ]
      : [
          "The animal seems irritated in the evening.",
          "The shed has insects and the animal is restless.",
          "I need safe environment-care guidance.",
        ]

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isAnalyzing])

  const updateCaseMeta = (key: keyof CaseMeta, value: string) => {
    setCaseMeta((current) => ({ ...current, [key]: value }))
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const availableSlots = Math.max(0, 3 - images.length)
    const fileList = Array.from(event.target.files || []).slice(0, availableSlots)

    if (!fileList.length) {
      event.target.value = ""
      return
    }

    try {
      setError(null)
      const prepared = await Promise.all(fileList.map(resizeImageToDataUrl))
      setImages((current) => [...current, ...prepared].slice(0, 3))
      setResult(null)
      event.target.value = ""
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to process images."
      )
    }
  }

  const runGuide = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!images.length) {
      setError("Add at least one image to continue.")
      return
    }

    if (notes.trim().length < 12) {
      setError("Add a short paragraph about the issue or care need.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    setMessages((current) => [
      ...current,
      {
        id: makeId(),
        role: "user",
        text: notes.trim(),
        imageCount: images.length,
      },
    ])

    try {
      const response = await fetch("/api/prakriti-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          caseMeta,
          notes,
          language: getSavedLanguage(),
          products: relevantProducts,
          images: images.map((image) => ({ dataUrl: image.dataUrl })),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.message || "Unable to analyze the images right now."
        )
      }

      const parsedResult = parseGuideResult(
        payload?.result,
        relevantProducts,
        subject
      )

      setResult(parsedResult)
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text: parsedResult.case_summary,
          result: parsedResult,
        },
      ])
      setNotes("")
    } catch (guideError) {
      const message =
        guideError instanceof Error
          ? guideError.message
          : "Unable to analyze the images right now."

      setError(message)
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text: message,
        },
      ])
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <MotionReveal>
      <section className="brand-royal-surface relative overflow-hidden px-3 py-4 text-white small:px-6 small:py-6">
        <div className="pointer-events-none absolute -right-12 top-4 h-40 w-40 rounded-full border border-[#e8c364]/12" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-32 w-32 rounded-full border border-[#79c7b8]/12" />

        <div className="relative z-[1] flex flex-col gap-4 xsmall:flex-row xsmall:items-center xsmall:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 rounded-[18px] border border-white/10 bg-white/8">
              <Image src="/gauri.png" alt="" fill sizes="64px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="brand-kicker text-[#e8c364]">{careToolName}</p>
              <h1 className="brand-card-title mt-2 text-white">
                Ancient care, modern eyes.
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#e8c364]/30 bg-[#e8c364]/12 px-3 py-1.5 text-[11px] font-semibold text-[#f5dd9c]">
              {model}
            </span>
            <div className="relative h-14 w-14 shrink-0 rounded-[18px] border border-white/10 bg-white/8">
              <Image src="/mayur.png" alt="" fill sizes="56px" className="object-contain p-1" />
            </div>
          </div>
        </div>

        <div className="relative z-[1] mt-5 overflow-hidden rounded-[28px] border border-[#e8c364]/18 bg-[rgba(255,252,244,0.96)] text-[var(--shreem-ink)] shadow-[0_26px_70px_rgba(0,0,0,0.18)]">
          <div className="border-b border-[rgba(18,63,99,0.1)] bg-[linear-gradient(135deg,rgba(255,249,235,0.95),rgba(241,248,245,0.9))] px-4 py-4 small:px-5">
            <div className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
              <div>
                <p className="brand-kicker">Case console</p>
                <h2 className="brand-card-title mt-1">
                  Context and chat move together
                </h2>
              </div>
              <LocalizedClientLink
                href="/store"
                className="brand-secondary-button w-full small:w-auto"
              >
                Store
              </LocalizedClientLink>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_240px]">
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                {(["plant", "animal"] as PrakritiSubject[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSubject(option)
                      setResult(null)
                      setError(null)
                    }}
                    className={clx(
                      "min-h-12 rounded-[18px] border px-4 py-3 text-sm font-semibold",
                      subject === option
                        ? "border-[rgba(212,161,38,0.48)] bg-[rgba(212,161,38,0.18)] text-[var(--shreem-ink)] shadow-[0_12px_26px_rgba(156,105,18,0.12)]"
                        : "border-[rgba(18,63,99,0.12)] bg-white/70 text-[var(--shreem-muted)]"
                    )}
                  >
                    {option === "plant" ? "Plant" : "Animal"}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <TextInput
                  label={subject === "plant" ? "Plant name" : "Animal type"}
                  value={caseMeta.subjectName}
                  placeholder={subject === "plant" ? "Rose, tulsi, wheat" : "Cow, calf, goat"}
                  onChange={(value) => updateCaseMeta("subjectName", value)}
                />
                <TextInput
                  label="Place"
                  value={caseMeta.environment}
                  placeholder={subject === "plant" ? "Pot, garden, field" : "Shed, home, farm"}
                  onChange={(value) => updateCaseMeta("environment", value)}
                />
                <TextInput
                  label="Visible since"
                  value={caseMeta.duration}
                  placeholder="2 days, 1 week"
                  onChange={(value) => updateCaseMeta("duration", value)}
                />
              </div>

              <div className="rounded-[20px] border border-dashed border-[rgba(212,161,38,0.34)] bg-white/74 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                      Images
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                      {images.length}/3 attached
                    </p>
                  </div>
                  <label
                    className={clx(
                      "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--shreem-gold)] px-4 py-2 text-xs font-semibold text-[var(--shreem-ink)]",
                      images.length >= 3 && "pointer-events-none opacity-50"
                    )}
                  >
                    Attach
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={images.length >= 3}
                    />
                  </label>
                </div>
                {!!images.length && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => {
                          setImages((current) =>
                            current.filter((item) => item.id !== image.id)
                          )
                          setResult(null)
                          setError(null)
                        }}
                        className="group overflow-hidden rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white"
                      >
                        <span className="relative block aspect-square">
                          <Image
                            src={image.dataUrl}
                            alt={`GrowBuddy upload ${index + 1}`}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-black/52 py-1 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100">
                            Remove
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="brand-pill px-3 py-1.5 text-[11px]">
                {subject === "plant" ? "Plant case" : "Animal case"}
              </span>
              {caseMeta.subjectName && (
                <span className="brand-pill px-3 py-1.5 text-[11px]">
                  {caseMeta.subjectName}
                </span>
              )}
              {caseMeta.environment && (
                <span className="brand-pill px-3 py-1.5 text-[11px]">
                  {caseMeta.environment}
                </span>
              )}
              {caseMeta.duration && (
                <span className="brand-pill px-3 py-1.5 text-[11px]">
                  {caseMeta.duration}
                </span>
              )}
              <span className="brand-pill px-3 py-1.5 text-[11px]">
                {images.length} image{images.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            className="max-h-[58vh] min-h-[380px] overflow-y-auto px-3 py-4 small:max-h-[650px] small:px-5"
          >
            <div className="grid gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clx(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={clx(
                      "max-w-[94%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-[0_14px_34px_rgba(15,49,70,0.1)] small:max-w-[84%]",
                      message.role === "user"
                        ? "bg-[linear-gradient(135deg,#0d817e,#123f63)] text-white"
                        : "border border-[rgba(212,161,38,0.18)] bg-[rgba(255,249,235,0.96)] text-[var(--shreem-ink)]"
                    )}
                  >
                    <p>{message.text}</p>
                    {!!message.imageCount && (
                      <p className="mt-2 text-xs font-semibold opacity-72">
                        {message.imageCount} image{message.imageCount === 1 ? "" : "s"} attached with this case
                      </p>
                    )}
                    {message.result && (
                      <div className="mt-4">
                        <CareResult result={message.result} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex justify-start">
                  <LogoLoader
                    label="Reading the case brief and images..."
                    detail="GrowBuddy is checking photos, issue notes, and Shreem product fit."
                    compact
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-4 mb-3 flex flex-col gap-3 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 small:mx-5 small:flex-row small:items-center small:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => runGuide()}
                disabled={isAnalyzing || !canAnalyze}
                className="shrink-0 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-800 disabled:opacity-50"
              >
                Retry same case
              </button>
            </div>
          )}

          <form
            onSubmit={runGuide}
            className="border-t border-[rgba(18,63,99,0.1)] bg-white/72 px-3 py-3 small:px-5 small:py-4"
          >
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {promptSeeds.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setNotes(prompt)
                    setError(null)
                    setResult(null)
                  }}
                  className="shrink-0 rounded-full border border-[rgba(18,63,99,0.12)] bg-white/84 px-3 py-2 text-xs font-semibold text-[var(--shreem-muted)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value)
                  setResult(null)
                  setError(null)
                }}
                placeholder={
                  subject === "plant"
                    ? "Ask with the case above: leaves, soil, watering, weather, pests, or care need..."
                    : "Ask with the case above: behavior, shed conditions, visible issue, or care need..."
                }
                rows={1}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-white/92 px-4 py-3 text-sm leading-6 text-[var(--shreem-ink)] outline-none focus:shadow-[0_0_0_3px_rgba(212,161,38,0.16)]"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !canAnalyze}
                className="min-h-12 rounded-[18px] bg-[linear-gradient(135deg,#0d817e,#123f63,#6f211f)] px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isAnalyzing ? "..." : "Ask"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--shreem-muted)]">
              First-pass guidance only. For animal distress, wounds, fever,
              breathing trouble, poisoning, or rapid crop loss, contact a local expert.
            </p>
          </form>
        </div>
      </section>
    </MotionReveal>
  )
}

const TextInput = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shreem-gold-deep)]">
    {label}
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-12 rounded-[16px] border border-[rgba(18,63,99,0.12)] bg-white/86 px-4 text-sm font-medium normal-case tracking-[0] text-[var(--shreem-ink)] outline-none placeholder:text-[rgba(75,104,114,0.58)] focus:shadow-[0_0_0_3px_rgba(212,161,38,0.16)]"
    />
  </label>
)

const CareResult = ({ result }: { result: GuideResult }) => (
  <article className="brand-surface px-4 py-5 small:px-6 small:py-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="brand-kicker">GrowBuddy result</p>
        <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
          {result.likely_condition}
        </h2>
      </div>
      <span className="brand-pill px-3 py-1.5">
        Confidence: {result.confidence}
      </span>
    </div>

    <div className="mt-5 rounded-[22px] border border-[rgba(18,63,99,0.1)] bg-white/80 px-4 py-4">
      <p className="text-sm leading-7 text-[var(--shreem-muted)]">
        {result.case_summary}
      </p>
      {result.confidence_reason && (
        <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
          <span className="font-semibold text-[var(--shreem-ink)]">
            Why this confidence:
          </span>{" "}
          {result.confidence_reason}
        </p>
      )}
    </div>

    <div className="mt-5 grid gap-4">
      <ResultList title="What GrowBuddy noticed" items={result.observations} />
      <ResultList title="Possible causes" items={result.possible_causes} />
      <ResultList
        title="Do this first"
        items={result.immediate_home_steps}
        numbered
      />
      <ResultBlock title="Natural care direction" body={result.natural_remedy} />
      <ResultList
        title="Monitor over the next few days"
        items={result.monitoring_plan}
      />
      <ResultList title="Prevention tips" items={result.prevention_tips} />
      <ResultList title="Escalate quickly if you see" items={result.urgent_care_signs} />

      {!!result.recommended_products.length && (
        <div>
          <p className="brand-kicker">Useful products</p>
          <div className="mt-3 grid gap-3">
            {result.recommended_products.map((product) => (
              <div
                key={product.handle}
                className="rounded-[22px] border border-[var(--shreem-border)] bg-white/82 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--shreem-ink)]">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                      {product.reason_match}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                      <span className="font-semibold text-[var(--shreem-ink)]">
                        Benefit:
                      </span>{" "}
                      {product.advantage}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                      <span className="font-semibold text-[var(--shreem-ink)]">
                        How to use:
                      </span>{" "}
                      {product.how_to_use}
                    </p>
                  </div>
                  <LocalizedClientLink
                    href={`/products/${product.handle}`}
                    className="brand-secondary-button gap-2"
                  >
                    View product
                    <ArrowUpRightMini />
                  </LocalizedClientLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </article>
)

const ResultList = ({
  title,
  items,
  numbered = false,
}: {
  title: string
  items: string[]
  numbered?: boolean
}) => {
  if (!items.length) {
    return null
  }

  return (
    <div>
      <p className="brand-kicker">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <div
            key={`${index}-${item}`}
            className="flex gap-3 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,251,241,0.95),rgba(241,248,245,0.86))] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]"
          >
            {numbered && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-[var(--shreem-ink)]">
                {index + 1}
              </span>
            )}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ResultBlock = ({ title, body }: { title: string; body: string }) => {
  if (!body) {
    return null
  }

  return (
    <div>
      <p className="brand-kicker">{title}</p>
      <div className="mt-3 rounded-[22px] border border-[var(--shreem-border)] bg-white/82 px-4 py-4 text-sm leading-7 text-[var(--shreem-muted)]">
        {body}
      </div>
    </div>
  )
}
