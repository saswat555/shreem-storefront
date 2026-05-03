import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavLinks from "./nav-links"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions()
      .then((regions: StoreRegion[]) => regions)
      .catch(() => []),
    listLocales().catch(() => []),
    getLocale().catch(() => null),
  ])
  const prakritiGuideEnabled = isPrakritiGuideEnabled()

  return (
    <div className="sticky inset-x-0 top-0 z-50 bg-[rgba(248,241,228,0.9)] px-2 py-2 backdrop-blur-xl small:bg-transparent small:px-6 small:pb-0 small:pt-3">
      <header className="relative mx-auto max-w-[1520px] rounded-[20px] border border-[rgba(212,161,38,0.18)] shadow-[0_10px_28px_rgba(11,39,53,0.14)] backdrop-blur-2xl small:rounded-[32px] small:border-[rgba(212,161,38,0.22)] small:shadow-[0_18px_52px_rgba(11,39,53,0.18)]">
        <div className="absolute inset-0 rounded-[20px] bg-[linear-gradient(135deg,rgba(10,49,67,0.98),rgba(14,63,88,0.96)_52%,rgba(82,48,24,0.9)_100%)] small:rounded-[32px] small:bg-[radial-gradient(circle_at_18%_0%,rgba(245,199,96,0.18),transparent_24%),radial-gradient(circle_at_85%_100%,rgba(13,129,126,0.16),transparent_28%),linear-gradient(135deg,rgba(10,49,67,0.96),rgba(14,63,88,0.94)_52%,rgba(82,48,24,0.88)_100%)]" />
        <nav className="txt-xsmall-plus relative flex min-h-[56px] items-center justify-between gap-2 px-2 py-1.5 text-small-regular text-white/82 small:min-h-[108px] small:gap-4 small:px-6 small:py-3">
          <div className="flex min-w-[44px] flex-1 basis-0 items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                prakritiGuideEnabled={prakritiGuideEnabled}
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center">
            <LocalizedClientLink
              href="/"
              className="min-w-0 transition-transform duration-300 hover:scale-[1.01]"
              data-testid="nav-store-link"
            >
              <BrandLogo size="nav" showCaption={false} theme="dark" />
            </LocalizedClientLink>
          </div>

          <div className="flex flex-1 basis-0 items-center justify-end gap-x-1.5 small:gap-x-4">
            <NavLinks />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="brand-primary-button px-3 py-2 text-[11px] small:px-5 small:py-3 small:text-xs"
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
