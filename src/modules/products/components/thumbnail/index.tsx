"use client"

import React, { useState } from "react"
import Image from "next/image"

import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { toAbsoluteProductImageUrl } from "@lib/util/absolute-url"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  fallbackImage?: string | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  fallbackImage,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = toAbsoluteProductImageUrl(
    thumbnail || images?.[0]?.url || fallbackImage
  )
  const fallback = toAbsoluteProductImageUrl(fallbackImage)

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(240,248,246,0.88))] p-2 shadow-[0_12px_32px_rgba(12,47,73,0.08)] transition-all duration-500 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_48px_rgba(12,47,73,0.12)] small:rounded-[28px] small:p-3",
        className || "",
        isFeatured ? "aspect-[5/6]" : "",
        !isFeatured || size === "square" ? "aspect-[1/1]" : "",
        size === "small" ? "w-[180px]" : "",
        size === "medium" ? "w-[290px]" : "",
        size === "large" ? "w-[440px]" : "",
        size === "full" ? "w-full" : "",
      ].filter(Boolean).join(" ")}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} fallbackImage={fallback} size={size} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  fallbackImage,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string; fallbackImage?: string }) => {
  const [currentImage, setCurrentImage] = useState(image || fallbackImage || "")
  const sizes =
    size === "small"
      ? "180px"
      : size === "medium"
        ? "290px"
        : size === "large"
          ? "440px"
          : "(max-width: 767px) 50vw, (max-width: 1279px) 25vw, 320px"

  return currentImage ? (
    <Image
      src={currentImage}
      alt="Thumbnail"
      fill
      sizes={sizes}
      quality={62}
      className="absolute inset-0 h-full w-full object-contain object-center p-2 transition-transform duration-700 ease-out group-hover:scale-[1.03] small:p-3"
      draggable={false}
      onError={() => {
        if (fallbackImage && currentImage !== fallbackImage) {
          setCurrentImage(fallbackImage)
          return
        }

        setCurrentImage("")
      }}
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
