import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative">
      <div
        className={clx("grid flex-1 gap-4 small:mx-2", {
          "sm:grid-cols-2": images.length > 1,
        })}
      >
        {images.map((image, index) => {
          const isHeroImage = index === 0 && images.length > 1

          return (
            <Container
              key={image.id}
              className={clx(
                "brand-card relative overflow-hidden p-0",
                isHeroImage ? "aspect-[16/11] sm:col-span-2" : "aspect-[4/5]"
              )}
              id={image.id}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index <= 2}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 576px) 100vw, (max-width: 1024px) 50vw, 900px"
                />
              )}
            </Container>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
