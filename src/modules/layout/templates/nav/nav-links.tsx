"use client"

import { useParams, usePathname } from "next/navigation"
import { clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const navItems = [
  { label: "Shop", href: "/store" },
  { label: "Journal", href: "/journal" },
  { label: "Support", href: "/customer-service" },
  { label: "Account", href: "/account" },
]

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

export default function NavLinks() {
  const pathname = usePathname()
  const { countryCode } = useParams()
  const currentPath = getNormalizedPath(pathname, countryCode)

  return (
    <div className="hidden items-center gap-x-2 md:flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`)

        return (
          <LocalizedClientLink
            key={item.href}
            className={clx(
              "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
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
