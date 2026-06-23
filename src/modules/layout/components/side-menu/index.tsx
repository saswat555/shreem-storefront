"use client"

import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type SideMenuItem = {
  name: string
  href: string
  description: string
  marker: string
}

type SiteLanguage = "english" | "hindi" | "hinglish"

const SITE_LANGUAGE_KEY = "shreem_site_language_v1"
const siteLanguageOptions: { value: SiteLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
]

const sideMenuItems: SideMenuItem[] = [
  {
    name: "Home",
    href: "/",
    description: "Enter the Shreem world",
    marker: "H",
  },
  {
    name: "Store",
    href: "/store",
    description: "Shop ghee, dhoop, gobar, and Jeevamrut",
    marker: "S",
  },
  {
    name: "Blog",
    href: "/blog",
    description: "Read product stories and ritual notes",
    marker: "B",
  },
  {
    name: "Shreem Astrology",
    href: "/shreem-astrology",
    description: "Muhurth, Prashna, and paid calls",
    marker: "A",
  },
  {
    name: "GrowBuddy AI",
    href: "/prakriti-guide",
    description: "Plant and animal care from photos",
    marker: "G",
  },
  {
    name: "Support",
    href: "/customer-service",
    description: "Get help with orders, accounts, and guidance",
    marker: "?",
  },
  {
    name: "Account",
    href: "/account",
    description: "Orders, addresses, and saved details",
    marker: "U",
  },
  {
    name: "Cart",
    href: "/cart",
    description: "Review your Shreem bag",
    marker: "C",
  },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  prakritiGuideEnabled?: boolean
}

const getNormalizedPath = (
  pathname: string,
  countryCode: string | string[] | undefined
) => {
  const currentCountryCode = Array.isArray(countryCode)
    ? countryCode[0]
    : countryCode

  if (!currentCountryCode) {
    return pathname || "/"
  }

  const prefix = `/${currentCountryCode}`

  if (pathname === prefix) {
    return "/"
  }

  return pathname?.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname || "/"
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  prakritiGuideEnabled = false,
}: SideMenuProps) => {
  const [open, setOpen] = useState(false)
  const [siteLanguage, setSiteLanguage] = useState<SiteLanguage>("english")
  const [siteLanguageReady, setSiteLanguageReady] = useState(false)
  const pathname = usePathname()
  const { countryCode } = useParams()
  const normalizedPath = getNormalizedPath(pathname, countryCode)
  const visibleMenuItems = sideMenuItems.filter(
    (item) => item.href !== "/prakriti-guide" || prakritiGuideEnabled
  )

  useEffect(() => {
    const saved = window.localStorage.getItem(SITE_LANGUAGE_KEY)

    if (saved === "hindi" || saved === "hinglish") {
      setSiteLanguage(saved)
    }

    setSiteLanguageReady(true)
  }, [])

  useEffect(() => {
    if (!siteLanguageReady) {
      return
    }

    window.localStorage.setItem(SITE_LANGUAGE_KEY, siteLanguage)
    document.documentElement.lang =
      siteLanguage === "hindi"
        ? "hi"
        : siteLanguage === "hinglish"
          ? "hi-Latn"
          : "en"
  }, [siteLanguage, siteLanguageReady])

  useEffect(() => {
    if (!open) {
      return
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      window.removeEventListener("keydown", closeOnEscape)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="h-full">
      <button
        type="button"
        data-testid="nav-menu-button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(245,199,96,0.32)] bg-[rgba(255,248,233,0.12)] p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(245,199,96,0.7)] small:h-12 small:w-12"
      >
        <span className="block h-3.5 w-5 border-y-2 border-current before:mt-[5px] before:block before:border-t-2 before:border-current" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 isolate z-[2147483647] h-[100dvh] w-screen overflow-hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            data-testid="side-menu-backdrop"
            className="absolute inset-0 h-full w-full bg-[rgba(5,16,24,0.58)] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside
            data-testid="nav-menu-popup"
            className="absolute inset-0 z-[1] flex h-[100dvh] w-full touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#092f42,#0f4a66_58%,#4a321c_100%)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-white shadow-[0_22px_64px_rgba(0,0,0,0.32)] [-webkit-overflow-scrolling:touch] small:bottom-auto small:left-6 small:right-auto small:top-28 small:h-[min(760px,calc(100dvh-120px))] small:w-[min(430px,calc(100vw-1.5rem))] small:rounded-[34px] small:border small:border-[rgba(245,199,96,0.24)] small:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">
                  Menu
                </p>
                <p className="mt-1 text-lg font-semibold leading-none text-white">
                  Navigate
                </p>
              </div>
              <button
                type="button"
                data-testid="close-menu-button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#1d5670] text-xl leading-none text-white/85 hover:bg-[#256580] hover:text-white small:h-12 small:w-12"
                aria-label="Close menu"
              >
                x
              </button>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 small:mt-6 small:flex small:flex-col">
              {visibleMenuItems.map(({ name, href, description, marker }) => {
                const isActive =
                  href === "/"
                    ? normalizedPath === "/"
                    : normalizedPath === href ||
                      normalizedPath.startsWith(`${href}/`)

                return (
                  <li key={name} className="w-full">
                    <LocalizedClientLink
                      href={href}
                      className={[
                        "group flex min-h-[116px] w-full flex-col justify-between gap-3 rounded-[22px] border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 small:min-h-0 small:flex-row small:items-center small:justify-between small:rounded-[24px] small:px-4 small:py-4",
                        isActive
                          ? "border-[rgba(245,199,96,0.88)] bg-[linear-gradient(135deg,#f3d37f,#d6a63a)] text-[var(--shreem-ink)] shadow-[0_16px_36px_rgba(156,105,18,0.2)]"
                          : "border-white/10 bg-[#1c556d] text-white hover:border-[rgba(245,199,96,0.3)] hover:bg-[#24607a]",
                      ].join(" ")}
                      onClick={() => setOpen(false)}
                      data-testid={`${name.toLowerCase()}-link`}
                    >
                      <span
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold",
                          isActive
                            ? "border-[rgba(11,39,53,0.12)] bg-white/28"
                            : "border-white/10 bg-white/10",
                        ].join(" ")}
                      >
                        {marker}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block text-base font-semibold leading-[1.1] small:text-[1.35rem] small:font-normal small:leading-[1.08]",
                            isActive ? "text-[var(--shreem-ink)]" : "text-white",
                          ].join(" ")}
                        >
                          {name}
                        </span>
                        <span
                          className={[
                            "mt-1 block text-xs leading-5 small:text-sm small:leading-6",
                            isActive
                              ? "text-[rgba(11,39,53,0.78)]"
                              : "text-white/62",
                          ].join(" ")}
                        >
                          {description}
                        </span>
                      </span>
                      <span
                        className={[
                          "hidden shrink-0 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] small:inline-flex",
                          isActive
                            ? "border-[rgba(11,39,53,0.14)] bg-[rgba(255,255,255,0.26)] text-[var(--shreem-ink)]"
                            : "border-white/12 bg-[#2a6783] text-white/72 group-hover:border-[rgba(245,199,96,0.3)] group-hover:text-white",
                        ].join(" ")}
                      >
                        Open
                      </span>
                    </LocalizedClientLink>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex flex-col gap-y-5 rounded-[18px] border border-white/10 bg-[#143646] px-4 py-4 text-white/75 small:mt-8 small:gap-y-6 small:rounded-[28px] small:py-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8c364]">
                  Site and AI language
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {siteLanguageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSiteLanguage(option.value)}
                      className={[
                        "rounded-full border px-2 py-2 text-[11px] font-semibold transition",
                        siteLanguage === option.value
                          ? "border-[#e8c364]/70 bg-[#e8c364] text-[#0b2735]"
                          : "border-white/10 bg-white/8 text-white/72",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-5 text-white/64">
                Region: {regions?.[0]?.name || "India"} · Locale:{" "}
                {currentLocale || locales?.[0]?.code || "en"}
              </p>
              <p className="text-xs leading-5 text-white/54">
                © {new Date().getFullYear()} Shreem. All rights reserved.
              </p>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SideMenu
