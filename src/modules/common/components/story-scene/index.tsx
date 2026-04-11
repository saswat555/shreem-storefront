import { clx } from "@medusajs/ui"
import Image from "next/image"

type StorySceneProps = {
  src: string
  alt: string
  eyebrow?: string
  title: string
  description?: string
  className?: string
  imageWrapperClassName?: string
  imageClassName?: string
  contentClassName?: string
  imageFit?: "cover" | "contain"
  sizes?: string
  priority?: boolean
}

export default function StoryScene({
  src,
  alt,
  eyebrow,
  title,
  description,
  className,
  imageWrapperClassName,
  imageClassName,
  contentClassName,
  imageFit = "cover",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: StorySceneProps) {
  return (
    <article className={clx("brand-card overflow-hidden", className)}>
      <div
        className={clx(
          "relative aspect-[16/10] border-b border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(240,248,246,0.88))]",
          imageWrapperClassName
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={clx(
            imageFit === "contain" ? "object-contain p-4" : "object-cover",
            imageClassName
          )}
        />
      </div>
      <div className={clx("p-5 small:p-6", contentClassName)}>
        {eyebrow && <p className="brand-kicker">{eyebrow}</p>}
        <h3 className="mt-3 text-[1.9rem] leading-[1.04] text-[var(--shreem-ink)]">
          {title}
        </h3>
        {description && (
          <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
            {description}
          </p>
        )}
      </div>
    </article>
  )
}
