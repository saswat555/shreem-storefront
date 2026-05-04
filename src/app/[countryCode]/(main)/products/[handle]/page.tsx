import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { getBaseURL } from "@lib/util/env"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
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
  if (!selectedVariantId || !product.variants) {
    return product.images ?? []
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !(variant.images?.length ?? 0)) {
    return product.images ?? []
  }

  const imageIdsMap = new Map((variant.images ?? []).map((i) => [i.id, true]))
  return (product.images ?? []).filter((i) => imageIdsMap.has(i.id))
}

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
      images: product.thumbnail
        ? [{ url: product.thumbnail, alt: product.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Shreem`,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
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

  const images = getImagesForVariant(pricedProduct, selectedVariantId)
  const baseUrl = getBaseURL()
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const imageUrls = [
    pricedProduct.thumbnail,
    ...(images || []).map((image) => image.url),
  ].filter(Boolean)
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
          priceCurrency: cheapestPrice.currency_code?.toUpperCase(),
          price: cheapestPrice.calculated_price_number,
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
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
        <h1 className="mt-3 max-w-[14ch] text-[2.3rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem]">
          We are reconnecting to {readableHandle}.
        </h1>
        <p className="mt-4 max-w-[40rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
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
