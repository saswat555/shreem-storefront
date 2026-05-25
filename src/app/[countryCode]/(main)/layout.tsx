import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { isIndexedCountryCode } from "@lib/seo/config"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

type PageLayoutProps = {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({
  params,
}: Pick<PageLayoutProps, "params">): Promise<Metadata> {
  const { countryCode } = await params
  const shouldIndex = isIndexedCountryCode(countryCode)

  return {
    metadataBase: new URL(getBaseURL()),
    ...(shouldIndex
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
            googleBot: {
              index: false,
              follow: true,
            },
          },
        }),
  }
}

export default async function PageLayout(props: PageLayoutProps) {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart().catch(() => null)
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions().catch(() => ({
      shipping_options: [],
    }))

    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
    </>
  )
}
