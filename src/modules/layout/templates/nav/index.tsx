import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavLinks from "./nav-links"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 px-3 pt-3 small:px-6">
      <header className="relative mx-auto max-w-[1520px] rounded-[32px] border border-[rgba(212,161,38,0.22)] shadow-[0_18px_52px_rgba(11,39,53,0.18)] backdrop-blur-2xl">
        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_18%_0%,rgba(245,199,96,0.18),transparent_24%),radial-gradient(circle_at_85%_100%,rgba(13,129,126,0.16),transparent_28%),linear-gradient(135deg,rgba(10,49,67,0.96),rgba(14,63,88,0.94)_52%,rgba(82,48,24,0.88)_100%)]" />
        <nav className="txt-xsmall-plus relative flex min-h-[108px] items-center justify-between gap-4 px-4 py-3 text-small-regular text-white/82 small:px-6">
          <div className="flex flex-1 basis-0 items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <LocalizedClientLink
              href="/"
              className="transition-transform duration-300 hover:scale-[1.01]"
              data-testid="nav-store-link"
            >
              <BrandLogo size="nav" showCaption={false} theme="dark" />
            </LocalizedClientLink>
          </div>

          <div className="flex flex-1 basis-0 items-center justify-end gap-x-2 small:gap-x-4">
            <NavLinks />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="brand-primary-button px-4 py-2.5 text-xs small:px-5 small:py-3"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Bag (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
