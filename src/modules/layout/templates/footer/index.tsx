import { Text } from "@medusajs/ui"

import { shreemCowBreeds, shreemMascots } from "@lib/constants/shreem"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function Footer() {
  return (
    <footer className="w-full pb-8 pt-12 small:pt-16">
      <div className="content-container">
        <div className="brand-royal-surface flex w-full flex-col gap-8 px-6 py-8 text-white small:px-10 small:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[30rem]">
              <BrandLogo
                size="large"
                theme="dark"
                caption="Bilona ghee, neem dhoop, gobar cakes, and Jeevamrut from naturally grazing desi cows."
              />
              <p className="mt-5 text-base leading-7 text-white/72">
                Shreem is built around a slower desi-cow way of living: bilona
                ghee for the kitchen, neem dhoop and gobar products for the
                prayerful home, and Jeevamrut for fields that honour living
                soil.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Our herd includes {shreemCowBreeds.join(", ")} cows, while{" "}
                {shreemMascots.map((mascot) => mascot.name).join(" and ")} give
                the brand a face, a feeling, and a sense of sacred Indian
                warmth.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LocalizedClientLink href="/store" className="brand-primary-button">
                  Shop products
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/gaatha"
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(212,161,38,0.24)] bg-white/8 px-6 py-3 text-sm font-semibold text-white"
                >
                  Shreem Gaatha
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
                  href="/gaatha"
                  className="text-white/80 hover:text-[var(--shreem-gold)]"
                >
                  Shreem Gaatha
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
              © {new Date().getFullYear()} Shreem Cow Products. Rooted in desi
              cows, bilona purity, and a more natural Indian way of life.
            </Text>
            <LocalizedClientLink
              href="/gaatha"
              className="txt-compact-small hover:text-[var(--shreem-gold)]"
            >
              Read Shreem Gaatha
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
