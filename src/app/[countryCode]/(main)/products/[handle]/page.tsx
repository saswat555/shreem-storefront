import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listAllProducts, listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { getBaseURL } from "@lib/util/env"
import { toAbsoluteProductImageUrl } from "@lib/util/absolute-url"
import { retrieveCustomer } from "@lib/data/customer"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-dynamic"
export const revalidate = 0
type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const products = await listAllProducts({
        countryCode: country,
        queryParams: { fields: "handle" },
      })

      return {
        country,
        products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  const fallbackImages =
    product.images?.length || !product.thumbnail
      ? product.images ?? []
      : [
          {
            id: `${product.id}-thumbnail`,
            url: product.thumbnail,
          } as HttpTypes.StoreProductImage,
        ]

  if (!selectedVariantId || !product.variants) {
    return fallbackImages
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !(variant.images?.length ?? 0)) {
    return fallbackImages
  }

  const imageIdsMap = new Map((variant.images ?? []).map((i) => [i.id, true]))
  const variantImages = (product.images ?? []).filter((i) => imageIdsMap.has(i.id))

  return variantImages.length ? variantImages : fallbackImages
}

const normalizeProductImage = <T extends { url?: string | null }>(image: T): T => ({
  ...image,
  url: toAbsoluteProductImageUrl(image.url),
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { countryCode, handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!product) {
    return {
      title: "Product | Shreem",
      description: "Shop Shreem Cow Products.",
    }
  }

  const description =
    product.description?.slice(0, 155) ||
    `Shop ${product.title} from Shreem Cow Products with live pricing, product details, and secure checkout.`
  const canonical = `/${countryCode}/products/${handle}`
  const productImage = toAbsoluteProductImageUrl(
    product.thumbnail || product.images?.[0]?.url
  )

  return {
    title: `${product.title} | Shreem Cow Products`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${product.title} | Shreem`,
      description,
      url: canonical,
      type: "website",
      images: productImage
        ? [{ url: productImage, alt: product.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Shreem`,
      description,
      images: productImage ? [productImage] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!pricedProduct) {
    return <ProductUnavailable handle={params.handle} />
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId).map(
    normalizeProductImage
  )
  const customer = await retrieveCustomer().catch(() => null)
  const defaultShippingAddress =
    customer?.addresses?.find((address) => address.is_default_shipping) ||
    customer?.addresses?.[0]
  const metadata = (customer?.metadata || {}) as Record<string, unknown>
  const initialDeliveryPincode =
    typeof metadata.preferred_delivery_pincode === "string"
      ? metadata.preferred_delivery_pincode
      : defaultShippingAddress?.postal_code || ""
  const baseUrl = getBaseURL()
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const imageUrls = [
    pricedProduct.thumbnail,
    ...(images || []).map((image) => image.url),
  ]
    .map(toAbsoluteProductImageUrl)
    .filter(Boolean)
  const currencyCode = cheapestPrice?.currency_code?.toUpperCase() || "INR"
  const priceValidUntil = new Date()
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description:
      pricedProduct.description ||
      `Shop ${pricedProduct.title} from Shreem Cow Products.`,
    image: imageUrls,
    sku: pricedProduct.variants?.[0]?.sku || pricedProduct.id,
    brand: {
      "@type": "Brand",
      name: "Shreem",
    },
    category: pricedProduct.collection?.title || pricedProduct.type?.value,
    offers: cheapestPrice
      ? {
          "@type": "Offer",
          url: `${baseUrl}/${params.countryCode}/products/${pricedProduct.handle}`,
          priceCurrency: currencyCode,
          price: cheapestPrice.calculated_price_number,
          priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "IN",
            },
            shippingRate: {
              "@type": "MonetaryAmount",
              currency: currencyCode,
              value: "0",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 1,
                maxValue: 2,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 7,
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/ReturnShippingFees",
          },
        }
      : undefined,
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${params.countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Store",
        item: `${baseUrl}/${params.countryCode}/store`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pricedProduct.title,
        item: `${baseUrl}/${params.countryCode}/products/${pricedProduct.handle}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
        initialDeliveryPincode={initialDeliveryPincode}
      />
    </>
  )
}

function ProductUnavailable({ handle }: { handle: string }) {
  const readableHandle = handle.replace(/-/g, " ")

  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
        <p className="brand-kicker">Product</p>
        <h1 className="brand-page-title mt-3 max-w-[16ch]">
          We are reconnecting to {readableHandle}.
        </h1>
        <p className="brand-page-copy mt-4 max-w-[40rem]">
          The product page loaded, but live pricing and availability could not
          be reached just now. Refresh in a moment or continue browsing the
          store.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LocalizedClientLink href="/store" className="brand-primary-button">
            Browse store
          </LocalizedClientLink>
          <LocalizedClientLink href="/" className="brand-secondary-button">
            Return home
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
