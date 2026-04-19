"use client"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const AUTO_ADVANCE_MS = 4800

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const availableImages = useMemo(
    () => images.filter((image) => Boolean(image.url)),
    [images]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [ratios, setRatios] = useState<Record<string, number>>({})

  const activeImage = availableImages[activeIndex]
  const activeRatio = activeImage
    ? ratios[activeImage.id] ?? 1.18
    : 1.18

  useEffect(() => {
    if (activeIndex <= availableImages.length - 1) {
      return
    }

    setActiveIndex(0)
  }, [activeIndex, availableImages.length])

  useEffect(() => {
    if (availableImages.length <= 1 || isPaused) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % availableImages.length)
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(timer)
  }, [availableImages.length, isPaused])

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? availableImages.length - 1 : current - 1
    )
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % availableImages.length)
  }

  if (!availableImages.length) {
    return (
      <div className="brand-card flex aspect-[4/5] min-h-[360px] items-center justify-center p-6 text-center text-sm leading-6 text-[var(--shreem-muted)]">
        Product images will appear here when they are available.
      </div>
    )
  }

  return (
    <section
      className="brand-card overflow-hidden p-3 small:p-4"
      aria-label="Product image carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="relative min-h-[320px] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(240,248,246,0.88))] small:min-h-[520px]"
        style={{ aspectRatio: String(Math.min(Math.max(activeRatio, 0.78), 1.65)) }}
      >
        <Image
          key={activeImage.id}
          src={activeImage.url!}
          alt={`Product image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 576px) 100vw, (max-width: 1024px) 70vw, 780px"
          className="object-contain p-3 transition-transform duration-700 ease-out small:p-5"
          onLoad={(event) => {
            const target = event.currentTarget
            const ratio = target.naturalWidth / target.naturalHeight

            if (Number.isFinite(ratio) && ratio > 0) {
              setRatios((current) => ({
                ...current,
                [activeImage.id]: ratio,
              }))
            }
          }}
        />

        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-[rgba(18,63,99,0.12)] bg-white/86 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shreem-accent-dark)] shadow-[0_12px_28px_rgba(15,49,70,0.12)]">
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <span className="text-[var(--shreem-muted)]">/</span>
          <span>{String(availableImages.length).padStart(2, "0")}</span>
        </div>

        {availableImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Show previous product image"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(18,63,99,0.16)] bg-white/88 text-[var(--shreem-ink)] shadow-[0_14px_32px_rgba(15,49,70,0.16)] hover:bg-white"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Show next product image"
              onClick={goToNext}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(18,63,99,0.16)] bg-white/88 text-[var(--shreem-ink)] shadow-[0_14px_32px_rgba(15,49,70,0.16)] hover:bg-white"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {availableImages.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {availableImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Show product image ${index + 1}`}
              aria-current={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={clx(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border bg-white/80 transition-all duration-300 small:h-24 small:w-24",
                activeIndex === index
                  ? "border-[rgba(212,161,38,0.9)] shadow-[0_12px_28px_rgba(156,105,18,0.18)]"
                  : "border-[var(--shreem-border)] opacity-72 hover:opacity-100"
              )}
            >
              <Image
                src={image.url!}
                alt={`Product thumbnail ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default ImageGallery
