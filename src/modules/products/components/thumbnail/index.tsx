import { Container, clx } from "@medusajs/ui"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(240,248,246,0.88))] p-2 shadow-[0_12px_32px_rgba(12,47,73,0.08)] transition-all duration-500 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_48px_rgba(12,47,73,0.12)] small:rounded-[28px] small:p-3",
        className,
        {
          "aspect-[5/6]": isFeatured,
          "aspect-[1/1]": !isFeatured || size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  return image ? (
    <img
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 h-full w-full object-contain object-center p-2 transition-transform duration-700 ease-out group-hover:scale-[1.03] small:p-3"
      draggable={false}
      loading="lazy"
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
