"use client"

import { clx } from "@medusajs/ui"
import Image from "next/image"

type LogoLoaderProps = {
  label?: string
  detail?: string
  compact?: boolean
  inverse?: boolean
  className?: string
}

export default function LogoLoader({
  label = "Preparing your answer...",
  detail,
  compact = false,
  inverse = false,
  className,
}: LogoLoaderProps) {
  return (
    <div
      className={clx(
        "flex items-center gap-3 rounded-[22px] border px-4 py-3",
        inverse
          ? "border-white/12 bg-white/8 text-white"
          : "border-[rgba(212,161,38,0.2)] bg-[rgba(255,249,235,0.95)] text-[var(--shreem-ink)]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={clx(
          "relative shrink-0 rounded-[18px] border",
          compact ? "h-11 w-11" : "h-14 w-14",
          inverse
            ? "border-white/15 bg-white/10"
            : "border-[rgba(212,161,38,0.25)] bg-white"
        )}
      >
        <div
          className={clx(
            "absolute inset-[-5px] rounded-[22px] border-2 border-transparent",
            inverse
              ? "border-t-[#f5dd9c] border-r-white/20"
              : "border-t-[var(--shreem-gold)] border-r-[rgba(13,129,126,0.24)]",
            "animate-spin"
          )}
        />
        <Image
          src="/logo.jpeg"
          alt=""
          fill
          sizes={compact ? "44px" : "56px"}
          className="object-contain p-2"
          priority={false}
        />
      </div>
      <div className="min-w-0">
        <p className={clx("font-semibold", compact ? "text-sm" : "text-base")}>
          {label}
        </p>
        {detail && (
          <p
            className={clx(
              "mt-1 leading-5",
              compact ? "text-xs" : "text-sm",
              inverse ? "text-white/68" : "text-[var(--shreem-muted)]"
            )}
          >
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
