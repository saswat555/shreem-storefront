import { ArrowUpRightMini } from "@medusajs/icons"
import { shreemCowBreeds } from "@lib/constants/shreem"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = ({
  prakritiGuideEnabled = false,
}: {
  prakritiGuideEnabled?: boolean
}) => {
  return (
    <section className="content-container relative pt-5 small:pt-8">
      <div className="brand-surface relative overflow-hidden px-5 py-7 small:px-10 small:py-10">
        <div
          aria-hidden="true"
          className="animate-shreem-glow absolute -left-20 top-10 hidden h-64 w-64 rounded-full bg-[rgba(13,129,126,0.18)] blur-3xl small:block"
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(212,161,38,0.22),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(18,63,99,0.1),transparent_24%),linear-gradient(135deg,rgba(255,250,240,0.26),transparent_55%)]"
        />
        <div className="relative">
          <div className="brand-pill mx-auto mb-4 w-fit">
            A2 desi cow products from {shreemCowBreeds.join(", ")}
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr] xl:items-center">
            <div className="order-2 xl:order-1">
              <h1 className="max-w-[13ch] text-center text-[2.25rem] leading-[0.96] text-balance text-[var(--shreem-ink)] small:text-[4.6rem] xl:text-left">
                Bilona A2 ghee, neem dhoop, gobar cakes, and Jeevamrut from desi-cow farms.
              </h1>
              <p className="mt-6 max-w-[44rem] text-center text-base leading-7 text-[var(--shreem-muted)] small:text-lg xl:text-left">
                Shreem brings everyday cow-based products into one clean
                storefront: cultured bilona ghee for the kitchen, neem dhoop for
                home use, cow-dung cakes for havan and dhooni, and Jeevamrut for
                natural farming routines.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row xl:justify-start">
                <LocalizedClientLink href="/store" className="brand-primary-button">
                  Shop products
                </LocalizedClientLink>
                {prakritiGuideEnabled && (
                  <LocalizedClientLink
                    href="/prakriti-guide"
                    className="brand-secondary-button gap-2"
                  >
                    Try GrowBuddy AI
                    <ArrowUpRightMini />
                  </LocalizedClientLink>
                )}
              </div>
            </div>
            <div className="order-1 xl:order-2 overflow-hidden rounded-[30px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(247,242,232,0.92))] p-2 shadow-[0_24px_70px_rgba(15,49,70,0.12)]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] small:aspect-[16/9] xl:aspect-[16/11]">
                <Image
                  src="/shreem-scenes/hero-scene.png"
                  alt="Illustrated Shreem gaushala hero scene with Gauri, Mayur, and bilona ghee"
                  fill
                  priority
                  sizes="(max-width: 1279px) 100vw, 720px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
          <div
            className={`mt-6 grid gap-3 ${
              prakritiGuideEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <div className="brand-card px-4 py-4">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                Desi cow source
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                Shreem focuses on Gir, Sahiwal, Tharparkar, and Rathi desi-cow lines.
              </p>
            </div>
            <div className="brand-card px-4 py-4 animate-shreem-float">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                Everyday use
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                From bilona ghee to neem dhoop batti, each product is presented for clear daily use.
              </p>
            </div>
            {prakritiGuideEnabled && (
              <div className="brand-card px-4 py-4 animate-shreem-float-delayed">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  GrowBuddy AI
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  Plant and animal care help from photos, notes, and Gemini AI.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
