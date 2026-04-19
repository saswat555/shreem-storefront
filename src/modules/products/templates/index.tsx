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
      <div className="content-container py-8 small:py-12" data-testid="product-container">
        <section className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_420px] xl:items-start">
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="brand-kicker">Product gallery</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    View the pack, label, and finish closely before you add it to bag.
                  </p>
                </div>
              </div>
              <ImageGallery images={images} />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                    Image-led view
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    The carousel keeps the product itself central, not a placeholder frame.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                    Variant clarity
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Buyers can see the selected option, live price, and stock state before adding to cart.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shreem-gold-deep)]">
                    Review-backed
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Approved customer feedback appears lower on the page with star ratings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-y-6 xl:sticky xl:top-28">
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
          </div>

          <div className="mt-8">
            <div className="mb-5">
              <p className="brand-kicker">More about this product</p>
              <h3 className="mt-3 text-[1.9rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]">
                Details, delivery guidance, and buying confidence
              </h3>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <ProductTabs product={product} />
            <Suspense
              fallback={
                <ProductOnboardingCta />
              }
            >
              <ProductOnboardingCta />
            </Suspense>
          </div>
        </section>
      </div>
      <ProductReviews productId={product.id} />
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
