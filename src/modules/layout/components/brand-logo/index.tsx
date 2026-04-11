import { clx } from "@medusajs/ui"
import Image from "next/image"

type BrandLogoProps = {
  size?: "small" | "medium" | "large" | "hero"
  theme?: "light" | "dark"
  showCaption?: boolean
  caption?: string
  align?: "start" | "center"
  className?: string
}

const sizeMap = {
  small: {
    container: "h-11 w-11 rounded-[16px] p-1.5",
    image: 32,
    title: "text-lg",
    caption: "text-[11px]",
  },
  medium: {
    container: "h-14 w-14 rounded-[18px] p-1.5",
    image: 44,
    title: "text-[1.4rem]",
    caption: "text-xs",
  },
  large: {
    container: "h-16 w-16 rounded-[20px] p-2",
    image: 52,
    title: "text-[1.7rem]",
    caption: "text-sm",
  },
  hero: {
    container: "h-24 w-24 rounded-[28px] p-2.5 small:h-28 small:w-28",
    image: 78,
    title: "text-[2.3rem] small:text-[2.8rem]",
    caption: "text-sm small:text-base",
  },
}

export default function BrandLogo({
  size = "medium",
  theme = "light",
  showCaption = true,
  caption = "Bilona ghee, neem dhoop, and A2 desi cow essentials",
  align = "start",
  className,
}: BrandLogoProps) {
  const config = sizeMap[size]
  const isDark = theme === "dark"
  const isCentered = align === "center"
  const isHero = size === "hero"

  return (
    <div
      className={clx(
        "flex items-center gap-3",
        isHero && "flex-col gap-4",
        isCentered && "mx-auto w-fit text-center",
        className
      )}
    >
      <div
        className={clx(
          "relative overflow-hidden border shadow-[0_16px_32px_rgba(0,0,0,0.08)]",
          config.container,
          isDark
            ? "border-white/15 bg-white/10"
            : "border-[var(--shreem-border)] bg-white/85"
        )}
      >
        <Image
          src="/logo.jpeg"
          alt="Shreem logo with peacock feather inspired motif"
          width={config.image}
          height={config.image}
          priority
          className="h-full w-full rounded-[14px] object-contain"
        />
      </div>
      <div
        className={clx("flex min-w-0 flex-col", isCentered && "items-center")}
      >
        <span
          className={clx(
            "leading-none",
            config.title,
            isDark ? "text-white" : "text-[var(--shreem-ink)]"
          )}
        >
          Shreem
        </span>
        {showCaption && (
          <span
            className={clx(
              "mt-1 hidden leading-relaxed sm:block",
              isCentered && "max-w-[30rem]",
              config.caption,
              isDark ? "text-white/70" : "text-[var(--shreem-muted)]"
            )}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}
