import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductReviews from "@modules/products/components/product-reviews"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Package from "@modules/common/icons/package"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  fallbackImage?: string
}

const getProductTrustCards = (product: HttpTypes.StoreProduct) => {
  const handle = product.handle || ""
  const title = product.title || "Shreem product"
  const isDigital =
    /jyotish|astrology|credit|consultation|ai/i.test(`${handle} ${title}`)
  const isGhee = /ghee|bilona/i.test(`${handle} ${title}`)
  const isFarmInput = /vermicompost|jeevamrut|plant|banana|soil/i.test(
    `${handle} ${title}`
  )

  if (isDigital) {
    return [
      {
        label: "Instant digital use",
        text: "AI credits and Jyotish services are handled without delivery charges.",
      },
      {
        label: "Usage history",
        text: "Wallet recharge and AI usage are logged so customers can track credits.",
      },
      {
        label: "Human support",
        text: "Expert review is available when a decision needs careful Jyotish judgement.",
      },
    ]
  }

  if (isGhee) {
    return [
      {
        label: "Curd-first bilona",
        text: "Made around the traditional curd-to-makkhan-to-ghee route.",
      },
      {
        label: "Gau-kasht finish",
        text: "Finished slowly for the warm, lightly smoky Shreem aroma.",
      },
      {
        label: "All-India shipping",
        text: "Flat shipping across India, with careful packing and free delivery on eligible cart value.",
      },
    ]
  }

  if (isFarmInput) {
    return [
      {
        label: "Practical use",
        text: "Built for kitchen gardens, farms, and soil-care routines with clear guidance.",
      },
      {
        label: "Natural farming fit",
        text: "Positioned for living soil, not chemical-pressure shortcuts.",
      },
      {
        label: "Ask before buying",
        text: "Use support if you are unsure about plant, soil, quantity, or delivery fit.",
      },
    ]
  }

  return [
    {
      label: "Real Shreem product",
      text: "Made for Indian homes with clear product information and careful packing.",
    },
    {
      label: "Secure checkout",
      text: "Pay online and track the order from your Shreem account.",
    },
    {
      label: "Support available",
      text: "Reach customer service for product, delivery, or order questions.",
    },
  ]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  fallbackImage,
}) => {
  if (!product || !product.id) {
    return notFound()
  }
  const trustCards = getProductTrustCards(product)
  const productIdentity = `${product.handle || ""} ${product.title || ""}`
  const isDigitalProduct =
    /jyotish|astrology|credit|consultation|ai/i.test(productIdentity)

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
            <div className="grid gap-2 rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.86)] p-3 backdrop-blur-xl">
              {trustCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[16px] bg-[linear-gradient(135deg,rgba(240,248,246,0.82),rgba(255,249,240,0.78))] px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-[22px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.86)] px-4 py-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(12,92,77,0.1)] text-[var(--shreem-green)]">
                  <Package size={20} />
                </span>
                <div>
                  <p className="brand-kicker">
                    {isDigitalProduct ? "Digital delivery" : "Delivery"}
                  </p>
                  <h2 className="mt-2 text-base font-semibold text-[var(--shreem-ink)]">
                    {isDigitalProduct
                      ? "No shipping charge"
                      : "All-India shipping available"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                    {isDigitalProduct
                      ? "AI credits and Jyotish services are activated digitally after payment, so no courier or delivery fee is needed."
                      : "Flat shipping across India. Free delivery applies on eligible higher-value carts, and every physical order is packed carefully before dispatch."}
                  </p>
                </div>
              </div>
            </div>
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
            <ImageGallery images={images} fallbackImage={fallbackImage} />
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
