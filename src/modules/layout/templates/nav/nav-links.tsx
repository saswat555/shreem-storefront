"use client"

import { useParams, usePathname } from "next/navigation"
import { clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const navItems = [
  { label: "Shop", href: "/store" },
  { label: "Astrology", href: "/shreem-astrology" },
  { label: "Blog", href: "/blog" },
  { label: "Support", href: "/customer-service" },
  { label: "Account", href: "/account" },
]

type NavLinksProps = {
  side?: "left" | "right" | "all"
}

const getNormalizedPath = (
  pathname: string,
  countryCode: string | string[] | undefined
) => {
  if (!pathname) {
    return "/"
  }

  const currentCountryCode = Array.isArray(countryCode)
    ? countryCode[0]
    : countryCode

  if (!currentCountryCode) {
    return pathname
  }

  const prefix = `/${currentCountryCode}`

  if (pathname === prefix) {
    return "/"
  }

  return pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname
}

export default function NavLinks({ side = "all" }: NavLinksProps) {
  const pathname = usePathname()
  const { countryCode } = useParams()
  const currentPath = getNormalizedPath(pathname, countryCode)
  const visibleItems =
    side === "left"
      ? navItems.slice(0, 2)
      : side === "right"
      ? navItems.slice(2)
      : navItems

  return (
    <div
      className={clx(
        "hidden min-w-0 items-center gap-x-1.5 small:flex medium:gap-x-2",
        side === "right" ? "justify-end" : "justify-start"
      )}
    >
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`)

        return (
          <LocalizedClientLink
            key={item.href}
            className={clx(
              "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold leading-none tracking-normal transition-all duration-300 medium:px-4 medium:text-sm large:px-5",
              item.label === "Astrology"
                ? "min-w-[104px] medium:min-w-[118px]"
                : "min-w-[78px] medium:min-w-[92px]",
              isActive
                ? "border-[rgba(245,199,96,0.9)] bg-[linear-gradient(135deg,#f3d37f,#d6a63a)] text-[var(--shreem-ink)] shadow-[0_12px_28px_rgba(156,105,18,0.22)]"
                : "border-[rgba(245,199,96,0.32)] bg-white/8 text-white hover:border-[rgba(245,199,96,0.58)] hover:bg-white/12"
            )}
            href={item.href}
            data-testid={`nav-${item.label.toLowerCase()}-link`}
          >
            {item.label}
          </LocalizedClientLink>
        )
      })}
    </div>
  )
}
