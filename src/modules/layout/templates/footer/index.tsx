import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function Footer() {
  const exploreLinks = [
    { href: "/", label: "Home" },
    { href: "/store", label: "Shop" },
    { href: "/shreem-astrology", label: "Astrology" },
    { href: "/gemstones", label: "Gemstones" },
    { href: "/blog", label: "Blog" },
    { href: "/customer-service", label: "Support" },
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
        <div className="site-footer-panel brand-royal-surface flex w-full flex-col gap-6 overflow-hidden px-4 py-5 text-white small:px-8 small:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start lg:justify-between">
            <div className="max-w-[32rem]">
              <BrandLogo
                size="footer"
                theme="dark"
                caption="Cow-based essentials, ritual products, and Jyotish guidance from Shreem."
              />
              <p className="mt-4 max-w-[28rem] text-sm leading-6 text-white/72">
                Practical products, clear support, and a calmer way to shop.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <LocalizedClientLink
                  href="/store"
                  className="brand-primary-button justify-center px-5"
                >
                  Shop
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/customer-service"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(212,161,38,0.24)] bg-white/10 px-5 py-3 text-sm font-semibold text-white"
                >
                  Get support
                </LocalizedClientLink>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-white/[0.07] px-4 py-4 small:min-w-[15rem] small:rounded-[24px] small:px-5">
              <span className="brand-kicker">Explore</span>
              <div className="mt-3 grid gap-2">
                {exploreLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold leading-6 text-white/78 hover:text-[var(--shreem-gold)]"
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-white/[0.07] px-4 py-4 small:min-w-[15rem] small:rounded-[24px] small:px-5">
              <span className="brand-kicker">Policies</span>
              <div className="mt-3 grid gap-2">
                {policyLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold leading-6 text-white/78 hover:text-[var(--shreem-gold)]"
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-white/64 small:flex-row small:items-center small:justify-between">
            <Text className="text-xs leading-5">
              © {new Date().getFullYear()} Shreem Farms. All rights reserved.
            </Text>
            <Text className="text-xs leading-5 text-white/58">
              Support, shipping, returns, and payment details are available in the links above.
            </Text>
          </div>
        </div>
      </div>
    </footer>
  )
}
