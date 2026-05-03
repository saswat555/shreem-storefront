import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductReviews from "@modules/products/components/product-reviews"
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
        className="content-container py-4 pb-12 small:py-10"
        data-testid="product-container"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.82)] px-4 py-3 backdrop-blur-xl small:mb-5 small:rounded-[28px] small:px-5 small:py-4">
              <div>
                <p className="brand-kicker">Product</p>
                <p className="mt-1 text-sm leading-5 text-[var(--shreem-muted)]">
                  Swipe photos, choose a variant, add to bag.
                </p>
              </div>
              <span className="brand-pill hidden px-3 py-1.5 text-[11px] xsmall:inline-flex">
                Live pricing
              </span>
            </div>
            <ImageGallery images={images} />
          </div>

          <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-28">
            <ProductInfo product={product} />
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
        </section>

        <section className="mt-6 small:mt-10">
          <div className="mb-4 px-1 small:mb-6">
            <p className="brand-kicker">Details</p>
            <h2 className="mt-2 text-[1.9rem] leading-none text-[var(--shreem-ink)] small:text-[2.6rem]">
              Product information
            </h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <ProductTabs product={product} />
            <Suspense fallback={<ProductOnboardingCta />}>
              <ProductOnboardingCta />
            </Suspense>
          </div>
        </section>
      </div>
      <ProductReviews productId={product.id} />
      <div
        className="content-container my-10 small:my-20"
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
