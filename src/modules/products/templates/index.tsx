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
  initialDeliveryPincode?: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  initialDeliveryPincode,
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
        <section className="grid gap-4 xl:grid-cols-[430px_minmax(0,1fr)] xl:items-start">
          <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1 xl:sticky xl:top-28">
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.82)] px-4 py-3 backdrop-blur-xl small:mb-5 small:rounded-[28px] small:px-5 small:py-4">
              <div>
                <p className="brand-kicker">Product</p>
                <h1
                  className="brand-card-title mt-2"
                  data-testid="product-title"
                >
                  {product.title}
                </h1>
              </div>
              <span className="brand-pill hidden px-3 py-1.5 text-[11px] xsmall:inline-flex">
                Live pricing
              </span>
            </div>
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
            <Suspense
              fallback={
                <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.82)] px-4 py-4">
                  <p className="brand-kicker">Delivery</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Loading delivery checker...
                  </p>
                </div>
              }
            >
</Suspense>
          </div>

          <div className="order-1 min-w-0 xl:order-2">
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.82)] px-4 py-3 backdrop-blur-xl small:mb-5 small:rounded-[28px] small:px-5 small:py-4">
              <div>
                <p className="brand-kicker">Gallery</p>
                <p className="mt-1 text-sm leading-5 text-[var(--shreem-muted)]">
                  Swipe photos and inspect the product before adding it to your bag.
                </p>
              </div>
            </div>
            <ImageGallery images={images} />
          </div>
        </section>

        <section className="mt-5 small:mt-8">
          <ProductInfo product={product} />
        </section>

        <section className="mt-6 small:mt-10">
          <div className="mb-4 px-1 small:mb-6">
            <p className="brand-kicker">Details</p>
            <h2 className="brand-section-title mt-2">
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
          <h2 className="brand-section-title">
            More useful picks to explore.
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
