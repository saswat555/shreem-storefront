import { Text } from "@medusajs/ui"

import { shreemCowBreeds, shreemMascots } from "@lib/constants/shreem"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function Footer() {
  const prakritiGuideEnabled = isPrakritiGuideEnabled()

  return (
    <footer className="w-full pb-8 pt-10 small:pt-16">
      <div className="content-container">
        <div className="brand-royal-surface flex w-full flex-col gap-8 px-4 py-6 text-white small:px-10 small:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[30rem]">
              <BrandLogo
                size="footer"
                theme="dark"
                caption="Bilona ghee, neem dhoop, gobar cakes, and Jeevamrut from naturally grazing desi cows."
              />
              <p className="mt-5 text-base leading-7 text-white/72">
                Shreem is built for homes that want purity without theatre:
                bilona ghee for the kitchen, neem dhoop and gobar products for
                daily rituals, and Jeevamrut for fields that care about living
                soil.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Our herd includes {shreemCowBreeds.join(", ")} cows, while{" "}
                {shreemMascots.map((mascot) => mascot.name).join(" and ")} give
                the brand a warmer, more human presence across the store and the
                Journal.
              </p>
              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                <LocalizedClientLink href="/store" className="brand-primary-button w-full justify-center sm:w-auto">
                  Shop products
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/journal"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[rgba(212,161,38,0.24)] bg-white/8 px-6 py-3 text-sm font-semibold text-white sm:w-auto"
                >
                  Read Journal
                </LocalizedClientLink>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 text-small-regular sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-y-3">
                <span className="brand-kicker">Explore</span>
                <LocalizedClientLink
                  href="/"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Home
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/store"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Shop
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/journal"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Journal
                </LocalizedClientLink>
                {prakritiGuideEnabled && (
                  <LocalizedClientLink
                    href="/prakriti-guide"
                    className="text-white/80 hover:text-[var(--shreem-gold)]"
                  >
                    Prakriti Guide
                  </LocalizedClientLink>
                )}
                <LocalizedClientLink
                  href="/customer-service"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Customer Service
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/account"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Account
                </LocalizedClientLink>
              </div>
              <div className="flex flex-col gap-y-3">
                <span className="brand-kicker">Shreem Promise</span>
                <Text className="text-white/72">Cultured bilona A2 ghee</Text>
                <Text className="text-white/72">Naturally grazing desi cows</Text>
                <Text className="text-white/72">Prayerful neem dhoop rituals</Text>
                <Text className="text-white/72">Living-soil farm support</Text>
              </div>
              <div className="flex flex-col gap-y-3">
                <span className="brand-kicker">Made For</span>
                <Text className="text-white/72">The kitchen</Text>
                <Text className="text-white/72">The prayer room</Text>
                <Text className="text-white/72">The family home</Text>
                <Text className="text-white/72">The farm</Text>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-white/64 small:flex-row small:items-center small:justify-between">
            <Text className="txt-compact-small">
              © {new Date().getFullYear()} Shreem Cow Products. Crafted around
              bilona purity, desi cows, and quieter everyday rituals.
            </Text>
            <LocalizedClientLink
              href="/journal"
              className="txt-compact-small hover:text-[var(--shreem-gold)]"
            >
              Read Journal
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
