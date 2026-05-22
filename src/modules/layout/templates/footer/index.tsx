import { ArrowUpRightMini } from "@medusajs/icons"
import { Text, clx } from "@medusajs/ui"

import { shreemCowBreeds, shreemMascots } from "@lib/constants/shreem"
import { isPrakritiGuideEnabled } from "@lib/util/prakriti-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function Footer() {
  const prakritiGuideEnabled = isPrakritiGuideEnabled()
  const exploreLinks = [
    { href: "/", label: "Home" },
    { href: "/store", label: "Shop" },
    { href: "/blog", label: "Blog" },
    ...(prakritiGuideEnabled
      ? [{ href: "/prakriti-guide", label: "GrowBuddy AI" }]
      : []),
    { href: "/customer-service", label: "Support" },
    { href: "/account", label: "Account" },
  ]
  const promiseItems = [
    "Cultured bilona A2 ghee",
    "Naturally grazing desi cows",
    "Traditional neem dhoop rituals",
    "Living-soil farm support",
  ]
  const madeForItems = [
    "The kitchen",
    "Plant care",
    "Animal care",
    "The farm",
  ]
  const policyLinks = [
    { href: "/terms-and-conditions", label: "Terms" },
    { href: "/privacy-policy", label: "Privacy" },
    { href: "/refund-policy", label: "Refunds" },
    { href: "/return-policy", label: "Returns" },
    { href: "/shipping-policy", label: "Shipping" },
  ]

  return (
    <footer className="site-footer-shell w-full pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 small:pb-8 small:pt-16">
      <div className="content-container">
        <div className="site-footer-panel brand-royal-surface flex w-full flex-col gap-4 overflow-hidden px-4 py-5 text-white small:gap-8 small:px-10 small:py-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[34rem]">
              <BrandLogo
                size="footer"
                theme="dark"
                caption="Bilona ghee, neem dhoop, gobar cakes, and Jeevamrut from naturally grazing desi cows."
              />
              <p className="mt-4 text-sm leading-6 text-white/72 small:mt-5 small:text-base small:leading-7">
                Shreem is built around clear product purpose: bilona ghee for
                the kitchen, neem dhoop and gobar products for home rituals,
                and Jeevamrut for living-soil farm routines.
              </p>
              <p className="mt-3 hidden text-sm leading-6 text-white/60 small:mt-4 small:block">
                Our herd includes {shreemCowBreeds.join(", ")} cows, while{" "}
                {shreemMascots.map((mascot) => mascot.name).join(" and ")} give
                the brand a warmer, more human presence across the store and the
                Blog.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 small:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                <LocalizedClientLink
                  href="/store"
                  className="brand-primary-button w-full justify-center px-4 sm:w-auto"
                >
                  Shop
                </LocalizedClientLink>
                {prakritiGuideEnabled && (
                  <LocalizedClientLink
                    href="/prakriti-guide"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[rgba(212,161,38,0.24)] bg-white/10 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
                  >
                    GrowBuddy AI
                    <ArrowUpRightMini />
                  </LocalizedClientLink>
                )}
                <LocalizedClientLink
                  href="/blog"
                  className={clx(
                    "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[rgba(212,161,38,0.24)] bg-white/10 px-4 py-3 text-sm font-semibold text-white sm:w-auto",
                    prakritiGuideEnabled && "col-span-2"
                  )}
                >
                  Blog
                </LocalizedClientLink>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-small-regular sm:grid-cols-2 xl:min-w-[42rem] xl:grid-cols-[1.2fr_1fr_1fr] xl:gap-4">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.07] px-4 py-4 small:rounded-[24px] small:px-5">
                <span className="brand-kicker">Explore</span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {exploreLinks.map((link) => (
                    <LocalizedClientLink
                      key={link.href}
                      href={link.href}
                      className="min-h-10 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80 hover:border-[rgba(245,199,96,0.3)] hover:text-[var(--shreem-gold)]"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  ))}
                </div>
              </div>
              <div className="hidden rounded-[20px] border border-white/10 bg-white/[0.07] px-4 py-4 small:block small:rounded-[24px] small:px-5">
                <span className="brand-kicker">Shreem Promise</span>
                <div className="mt-3 grid gap-2">
                  {promiseItems.map((item) => (
                    <Text key={item} className="text-sm leading-5 text-white/72">
                      {item}
                    </Text>
                  ))}
                </div>
              </div>
              <div className="hidden rounded-[20px] border border-white/10 bg-white/[0.07] px-4 py-4 small:block small:rounded-[24px] small:px-5">
                <span className="brand-kicker">Made For</span>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-1">
                  {madeForItems.map((item) => (
                    <Text key={item} className="text-sm leading-5 text-white/72">
                      {item}
                    </Text>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-white/64 small:flex-row small:items-center small:justify-between small:pt-6">
            <Text className="text-xs leading-5">
              © {new Date().getFullYear()} Shreem Cow Products. Crafted around
              bilona ghee, desi cows, and quieter everyday rituals.
            </Text>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-5">
              {policyLinks.map((link) => (
                <LocalizedClientLink
                  key={link.href}
                  href={link.href}
                  className="hover:text-[var(--shreem-gold)]"
                >
                  {link.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
