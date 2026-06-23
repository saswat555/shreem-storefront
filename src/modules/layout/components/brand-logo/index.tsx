import Image from "next/image"

type BrandLogoProps = {
  size?: "small" | "medium" | "large" | "nav" | "hero" | "footer" | "sidebar"
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
  nav: {
    container: "h-9 w-9 rounded-[12px] p-1 small:h-[76px] small:w-[76px] small:rounded-[24px] small:p-2",
    image: 58,
    title: "text-[1.15rem] small:text-[2rem]",
    caption: "text-sm",
  },
  hero: {
    container: "h-24 w-24 rounded-[28px] p-2.5 small:h-28 small:w-28",
    image: 78,
    title: "text-[2.3rem] small:text-[2.8rem]",
    caption: "text-sm small:text-base",
  },
  footer: {
    container: "h-16 w-16 rounded-[20px] p-1.5 small:h-36 small:w-36 small:rounded-[34px] small:p-3",
    image: 108,
    title: "text-[1.9rem] small:text-[2.9rem]",
    caption: "text-base",
  },
  sidebar: {
    container: "h-24 w-24 rounded-[24px] p-2 small:h-56 small:w-56 small:rounded-[46px] small:p-4",
    image: 192,
    title: "text-[2.4rem] small:text-[3.4rem]",
    caption: "text-base",
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
  const isFooter = size === "footer"
  const isSidebar = size === "sidebar"
  const imageSizes =
    size === "nav"
      ? "(max-width: 767px) 36px, 76px"
      : isFooter
        ? "(max-width: 767px) 64px, 144px"
        : isSidebar
          ? "(max-width: 767px) 96px, 224px"
          : `${config.image}px`

  return (
    <div
      className={[
        "flex items-center gap-3",
        isHero ? "flex-col gap-4" : "",
        isFooter ? "items-start gap-5" : "",
        isSidebar ? "flex-col items-center gap-4 text-center" : "",
        isCentered ? "mx-auto w-fit text-center" : "",
        className || "",
      ].filter(Boolean).join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden border shadow-[0_16px_32px_rgba(0,0,0,0.08)]",
          config.container,
          isDark
            ? "border-white/15 bg-white/10"
            : "border-[var(--shreem-border)] bg-white/85",
        ].join(" ")}
      >
        <Image
          src="/logo.jpeg"
          alt="Shreem logo with peacock feather inspired motif"
          width={config.image}
          height={config.image}
          priority={size === "nav"}
          quality={58}
          sizes={imageSizes}
          className="h-full w-full rounded-[14px] object-contain"
        />
      </div>
      <div
        className={[
          "flex min-w-0 flex-col",
          size === "nav" ? "max-w-[84px] small:max-w-none" : "",
          isCentered ? "items-center" : "",
        ].filter(Boolean).join(" ")}
      >
        <span
          className={[
            "leading-none",
            config.title,
            isDark ? "text-white" : "text-[var(--shreem-ink)]",
          ].join(" ")}
        >
          Shreem
        </span>
        {showCaption && (
          <span
            className={[
              "mt-1 hidden leading-relaxed sm:block",
              isCentered ? "max-w-[30rem]" : "",
              isFooter ? "max-w-[28rem]" : "",
              config.caption,
              isDark ? "text-white/70" : "text-[var(--shreem-muted)]",
            ].filter(Boolean).join(" ")}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}
