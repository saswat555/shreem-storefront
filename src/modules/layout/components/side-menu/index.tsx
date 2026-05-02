"use client"

import { Popover, PopoverPanel, Portal, Transition } from "@headlessui/react"
import {
  ArrowRightMini,
  BarsThree,
  BookOpen,
  BuildingStorefront,
  HouseStar,
  ShoppingBag,
  Sparkles,
  User,
  UserGroup,
  XMark,
} from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment, type ComponentType, useEffect } from "react"
import { useParams, usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import BrandLogo from "../brand-logo"

type SideMenuItem = {
  name: string
  href: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const SideMenuItems: SideMenuItem[] = [
  {
    name: "Home",
    href: "/",
    description: "Enter the Shreem world",
    icon: HouseStar,
  },
  {
    name: "Store",
    href: "/store",
    description: "Shop ghee, dhoop, gobar, and Jeevamrut",
    icon: BuildingStorefront,
  },
  {
    name: "Journal",
    href: "/journal",
    description: "Read product stories and ritual notes",
    icon: BookOpen,
  },
  {
    name: "Prakriti Guide",
    href: "/prakriti-guide",
    description: "Upload photos for a natural-care direction",
    icon: Sparkles,
  },
  {
    name: "Support",
    href: "/customer-service",
    description: "Get help with orders, accounts, and guidance",
    icon: UserGroup,
  },
  {
    name: "Account",
    href: "/account",
    description: "Orders, addresses, and saved details",
    icon: User,
  },
  {
    name: "Cart",
    href: "/cart",
    description: "Review your Shreem bag",
    icon: ShoppingBag,
  },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const ScrollLock = ({ active }: { active: boolean }) => {
  useEffect(() => {
    if (!active) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])

  return null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const pathname = usePathname()
  const { countryCode } = useParams()
  const currentCountryCode = Array.isArray(countryCode)
    ? countryCode[0]
    : countryCode
  const normalizedPath =
    currentCountryCode && pathname.startsWith(`/${currentCountryCode}`)
      ? pathname.slice(`/${currentCountryCode}`.length) || "/"
      : pathname

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <ScrollLock active={open} />
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  aria-label="Open navigation menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(245,199,96,0.32)] bg-[rgba(255,248,233,0.12)] p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(245,199,96,0.7)] small:h-12 small:w-12"
                >
                  <BarsThree className="h-5 w-5" />
                </Popover.Button>
              </div>

              {open && (
                <Portal>
                  <div
                    className="fixed inset-0 z-[50] bg-[rgba(5,16,24,0.32)] pointer-events-auto"
                    onClick={close}
                    data-testid="side-menu-backdrop"
                  />
                </Portal>
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-3"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-2"
              >
                <PopoverPanel
                  portal
                  className="fixed inset-0 z-[51] flex h-auto w-auto pr-0 text-sm text-ui-fg-on-color small:inset-auto small:left-6 small:top-28 small:h-[min(760px,calc(100vh-120px))] small:w-[min(430px,calc(100vw-1.5rem))]"
                >
                  <div
                    data-testid="nav-menu-popup"
                    className="no-scrollbar relative flex h-full w-full flex-col justify-between overflow-y-auto border-0 border-[rgba(245,199,96,0.24)] bg-[linear-gradient(180deg,#092f42,#0f4a66_58%,#4a321c_100%)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-white shadow-[0_22px_64px_rgba(0,0,0,0.22)] small:rounded-[34px] small:border small:bg-[linear-gradient(180deg,#0d435a,#0f4a66_56%,#5a3a1d_100%)] small:p-6"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,199,96,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(13,129,126,0.14),transparent_28%)]" />
                    <div className="relative z-[1] flex items-center justify-between gap-4">
                      <div className="small:hidden">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">
                          Menu
                        </p>
                        <p className="mt-1 text-lg font-semibold leading-none text-white">
                          Navigate
                        </p>
                      </div>
                      <div className="hidden small:block">
                        <BrandLogo
                          size="small"
                          theme="dark"
                          showCaption={false}
                        />
                      </div>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#1d5670] text-white/85 hover:bg-[#256580] hover:text-white small:h-12 small:w-12"
                      >
                        <XMark />
                      </button>
                    </div>
                    <div className="relative z-[1] mt-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                        Navigate
                      </p>
                    </div>
                    <ul className="relative z-[1] mt-3 grid grid-cols-2 gap-3 small:mt-6 small:flex small:flex-col small:items-start small:justify-start">
                      {SideMenuItems.map(({ name, href, description, icon }) => {
                        const isActive =
                          href === "/"
                            ? normalizedPath === "/"
                            : normalizedPath === href ||
                              normalizedPath.startsWith(`${href}/`)
                        const Icon = icon

                        return (
                          <li key={name} className="w-full">
                            <LocalizedClientLink
                              href={href}
                              className={clx(
                                "group flex min-h-[116px] w-full flex-col justify-between gap-3 rounded-[22px] border px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 small:min-h-0 small:flex-row small:items-center small:justify-between small:rounded-[24px] small:px-4 small:py-4",
                                isActive
                                  ? "border-[rgba(245,199,96,0.88)] bg-[linear-gradient(135deg,#f3d37f,#d6a63a)] text-[var(--shreem-ink)] shadow-[0_16px_36px_rgba(156,105,18,0.2)]"
                                  : "border-white/10 bg-[#1c556d] text-white hover:border-[rgba(245,199,96,0.3)] hover:bg-[#24607a]"
                              )}
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              <div
                                className={clx(
                                  "flex h-9 w-9 items-center justify-center rounded-full border",
                                  isActive
                                    ? "border-[rgba(11,39,53,0.12)] bg-white/28"
                                    : "border-white/10 bg-white/10"
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={clx(
                                    "text-base font-semibold leading-[1.1] small:text-[1.35rem] small:font-normal small:leading-[1.08]",
                                    isActive ? "text-[var(--shreem-ink)]" : "text-white"
                                  )}
                                >
                                  {name}
                                </p>
                                <p
                                  className={clx(
                                    "mt-1 text-xs leading-5 small:text-sm small:leading-6",
                                    isActive
                                      ? "text-[rgba(11,39,53,0.78)]"
                                      : "text-white/62"
                                  )}
                                >
                                  {description}
                                </p>
                              </div>
                              <span
                                className={clx(
                                  "hidden shrink-0 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-all duration-300 small:inline-flex",
                                  isActive
                                    ? "border-[rgba(11,39,53,0.14)] bg-[rgba(255,255,255,0.26)] text-[var(--shreem-ink)]"
                                    : "border-white/12 bg-[#2a6783] text-white/72 group-hover:border-[rgba(245,199,96,0.3)] group-hover:text-white"
                                )}
                              >
                                Open
                              </span>
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="relative z-[1] mt-5 flex flex-col gap-y-5 rounded-[18px] border border-white/10 bg-[#143646] px-4 py-4 text-white/75 small:mt-8 small:gap-y-6 small:rounded-[28px] small:py-5">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between gap-4"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                          onClick={languageToggleState.toggle}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between gap-4"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                        onClick={countryToggleState.toggle}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} Shreem. All rights reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
