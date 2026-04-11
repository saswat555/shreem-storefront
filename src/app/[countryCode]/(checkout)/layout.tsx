import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-white/60 small:min-h-screen">
      <div className="border-b border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] backdrop-blur-xl">
        <nav className="content-container flex h-20 items-center justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-2 text-small-semi uppercase text-ui-fg-base"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden txt-compact-plus text-[var(--shreem-muted)] hover:text-[var(--shreem-ink)] small:block">
              Back to shopping cart
            </span>
            <span className="mt-px block txt-compact-plus text-[var(--shreem-muted)] hover:text-[var(--shreem-ink)] small:hidden">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="transition-transform duration-300 hover:scale-[1.01]"
            data-testid="store-link"
          >
            <BrandLogo size="small" showCaption={false} />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="flex w-full items-center justify-center py-6 text-sm text-[var(--shreem-muted)]">
        Secure Shreem checkout
      </div>
    </div>
  )
}
