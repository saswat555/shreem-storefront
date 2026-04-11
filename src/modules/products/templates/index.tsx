import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container py-8 small:py-12"
        data-testid="product-container"
      >
        <div className="mb-6 brand-surface px-5 py-5 small:px-8">
          <p className="brand-kicker">Product detail</p>
          <h1 className="mt-3 text-[2.2rem] leading-none text-[var(--shreem-ink)] small:text-[3.4rem]">
            Discover the details before you bring it home.
          </h1>
        </div>
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:items-start">
          <div className="flex w-full flex-col gap-y-6 xl:sticky xl:top-28">
            <ProductInfo product={product} />
            <ProductTabs product={product} />
          </div>
          <div className="block w-full relative">
            <ImageGallery images={images} />
          </div>
          <div className="flex w-full flex-col gap-y-6 xl:sticky xl:top-28">
            <ProductOnboardingCta />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <div className="mb-8 flex flex-col gap-3">
          <p className="brand-kicker">You may also like</p>
          <h2 className="text-[2.2rem] leading-none text-[var(--shreem-ink)] small:text-[3rem]">
            More to explore from Shreem.
          </h2>
        </div>
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
