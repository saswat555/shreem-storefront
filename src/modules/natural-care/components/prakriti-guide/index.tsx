"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import MotionReveal from "@modules/common/components/motion-reveal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { ChangeEvent, useMemo, useState } from "react"

import {
  getRelevantPrakritiProducts,
  matchRecommendedProduct,
  PrakritiProduct,
  PrakritiSubject,
} from "@lib/util/prakriti"

type GuideResult = {
  likely_condition: string
  confidence: "low" | "medium" | "high"
  observations: string[]
  immediate_home_steps: string[]
  natural_remedy: string
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

type PrakritiGuideProps = {
  products: PrakritiProduct[]
  model: string
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

const parseGuideResult = (
  raw: unknown,
  products: PrakritiProduct[],
  subject: PrakritiSubject
): GuideResult => {
  const parsed =
    typeof raw === "string" ? (JSON.parse(raw) as GuideResult) : (raw as GuideResult)

  const filteredRecommendations = (parsed.recommended_products || [])
    .map((recommendation) => {
      const matchedProduct = matchRecommendedProduct(products, recommendation)

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
        advantage: recommendation.advantage,
        how_to_use: recommendation.how_to_use,
        reason_match: recommendation.reason_match,
      }
    })
    .filter(Boolean) as GuideResult["recommended_products"]

  return {
    likely_condition: parsed.likely_condition,
    confidence: parsed.confidence,
    observations: parsed.observations || [],
    immediate_home_steps: parsed.immediate_home_steps || [],
    natural_remedy: parsed.natural_remedy,
    prevention_tips: parsed.prevention_tips || [],
    urgent_care_signs: parsed.urgent_care_signs || [],
    recommended_products: filteredRecommendations,
  }
}

export default function PrakritiGuide({ products, model }: PrakritiGuideProps) {
  const [subject, setSubject] = useState<PrakritiSubject>("plant")
  const [notes, setNotes] = useState("")
  const [images, setImages] = useState<PreparedImage[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<GuideResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const relevantProducts = useMemo(
    () => getRelevantPrakritiProducts(products, subject),
    [products, subject]
  )

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []).slice(0, 3)

    if (!fileList.length) {
      return
    }

    try {
      setError(null)
      const prepared = await Promise.all(fileList.map(resizeImageToDataUrl))
      setImages(prepared)
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

  const runGuide = async () => {
    if (!images.length) {
      setError("Add at least one image to continue.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/prakriti-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          notes,
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

      setResult(parseGuideResult(payload?.result, relevantProducts, subject))
    } catch (guideError) {
      setError(
        guideError instanceof Error
          ? guideError.message
          : "Unable to analyze the images right now."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
      <MotionReveal>
        <section className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <p className="brand-kicker">Shreem Prakriti Guide</p>
          <h1 className="mt-3 text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.2rem]">
            Upload up to three photos and get a natural-care plan
          </h1>
          <p className="mt-4 max-w-[38rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
            This guide runs through a secured server route, reads the images,
            suggests a cautious natural-care direction, and only recommends a
            Shreem product when it is available in this region and genuinely
            useful for the case.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--shreem-ink)]">
              What are you checking?
              <div className="grid grid-cols-2 gap-2">
                {(["plant", "animal"] as PrakritiSubject[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSubject(option)}
                    className={clx(
                      "rounded-[20px] border px-4 py-3 text-sm font-semibold transition-all duration-300",
                      subject === option
                        ? "border-[rgba(18,63,99,0.18)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] text-[var(--shreem-ink)] shadow-[0_10px_24px_rgba(15,49,70,0.08)]"
                        : "border-[rgba(18,63,99,0.12)] bg-white/78 text-[var(--shreem-muted)]"
                    )}
                  >
                    {option === "plant" ? "Plant" : "Animal"}
                  </button>
                ))}
              </div>
            </label>

            <div className="flex flex-col justify-between rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/68 px-4 py-3">
              <p className="text-sm font-medium text-[var(--shreem-ink)]">
                AI model
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                OpenAI {model}
              </p>
            </div>
          </div>

          <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-[var(--shreem-ink)]">
            What symptoms are you noticing?
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: yellow leaves after heavy watering, white spots on stem, cattle shed has many mosquitoes, animal seems dull..."
              className="min-h-[120px] rounded-[20px] border border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] px-4 py-4 text-sm leading-6 text-[var(--shreem-ink)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,108,78,0.12)]"
            />
          </label>

          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(18,63,99,0.18)] bg-[linear-gradient(135deg,rgba(255,250,240,0.88),rgba(245,240,232,0.72))] px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  Add up to 3 photos
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                  Use clear close-ups in natural light. Leaves, stems, fur,
                  eyes, skin, waste, or surrounding environment can all help.
                </p>
              </div>
              <label className="brand-primary-button cursor-pointer">
                Upload images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {!!images.length && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-[22px] border border-[var(--shreem-border)] bg-white/80"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={image.dataUrl}
                        alt={`Uploaded preview ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="truncate pr-3 text-xs text-[var(--shreem-muted)]">
                        {image.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((item) => item.id !== image.id)
                          )
                        }
                        className="text-xs font-semibold text-[var(--shreem-accent-dark)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={runGuide}
              disabled={isAnalyzing || !images.length}
              className="brand-primary-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Analyzing images
                </>
              ) : (
                "Analyze with Prakriti Guide"
              )}
            </button>
            <LocalizedClientLink href="/store" className="brand-secondary-button">
              Browse Shreem products
            </LocalizedClientLink>
          </div>

          <p className="mt-4 text-xs leading-6 text-[var(--shreem-muted)]">
            The guide is cautious by design. It can help with first-pass natural
            direction, but severe animal illness, poisoning, major wounds, or
            fast crop loss should still go to a veterinarian or local expert.
          </p>

          {error && (
            <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
              {error}
            </div>
          )}
        </section>
      </MotionReveal>

      <MotionReveal delayMs={90}>
        <section className="grid gap-4">
          <article className="brand-card px-5 py-6 small:px-6">
            <p className="brand-kicker">How it works</p>
            <div className="mt-4 grid gap-3">
              {[
                "Upload one to three clear images.",
                "The guide estimates the likely issue and home-care direction.",
                "It checks only the products available in your current region.",
                "It recommends a Shreem product only when the fit is genuinely useful.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[20px] bg-[linear-gradient(135deg,rgba(255,251,241,0.95),rgba(241,248,245,0.86))] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]"
                >
                  <span className="mr-2 font-semibold text-[var(--shreem-ink)]">
                    {index + 1}.
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </article>

          <article className="brand-card px-5 py-6 small:px-6">
            <p className="brand-kicker">Region-aware Shreem products</p>
            <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
              Products the guide can consider right now
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relevantProducts.length ? (
                relevantProducts.map((product) => (
                  <span key={product.handle} className="brand-pill px-3 py-1.5">
                    {product.title}
                  </span>
                ))
              ) : (
                <span className="text-sm leading-6 text-[var(--shreem-muted)]">
                  No strongly relevant Shreem products are available for this
                  subject in the current region, so the guide will stay with
                  natural home-care advice only.
                </span>
              )}
            </div>
          </article>

          {result ? (
            <article className="brand-surface px-5 py-6 small:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="brand-kicker">Guide result</p>
                  <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                    {result.likely_condition}
                  </h2>
                </div>
                <span className="brand-pill px-3 py-1.5">
                  Confidence: {result.confidence}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <ResultList title="What the guide noticed" items={result.observations} />
                <ResultList
                  title="Immediate home steps"
                  items={result.immediate_home_steps}
                />
                <ResultBlock
                  title="Natural home remedy direction"
                  body={result.natural_remedy}
                />
                <ResultList
                  title="Prevention tips"
                  items={result.prevention_tips}
                />
                <ResultList
                  title="Escalate quickly if you see"
                  items={result.urgent_care_signs}
                />

                {!!result.recommended_products.length && (
                  <div>
                    <p className="brand-kicker">Useful Shreem products</p>
                    <div className="mt-3 grid gap-3">
                      {result.recommended_products.map((product) => (
                        <div
                          key={product.handle}
                          className="rounded-[24px] border border-[var(--shreem-border)] bg-white/80 px-4 py-4"
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
                                  Why it helps:
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
          ) : (
            <article className="brand-card px-5 py-6 small:px-6">
              <p className="brand-kicker">Important note</p>
              <p className="mt-3 text-sm leading-7 text-[var(--shreem-muted)]">
                This tool is meant for first-pass guidance and natural-care
                support, not a medical or agronomy diagnosis. For animal
                distress, wounds, fever, breathing trouble, poisoning, or fast
                decline, consult a veterinarian. For rapidly spreading plant
                disease or heavy crop loss, consult a local plant expert.
              </p>
            </article>
          )}
        </section>
      </MotionReveal>
    </div>
  )
}

const ResultList = ({ title, items }: { title: string; items: string[] }) => {
  if (!items.length) {
    return null
  }

  return (
    <div>
      <p className="brand-kicker">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[20px] bg-[linear-gradient(135deg,rgba(255,251,241,0.95),rgba(241,248,245,0.86))] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]"
          >
            {item}
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
      <div className="mt-3 rounded-[24px] border border-[var(--shreem-border)] bg-white/80 px-4 py-4 text-sm leading-7 text-[var(--shreem-muted)]">
        {body}
      </div>
    </div>
  )
}
