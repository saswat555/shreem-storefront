"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"
import { useParams, usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import BrandLogo from "../brand-logo"

const SideMenuItems = [
  {
    name: "Home",
    href: "/",
    description: "Enter the Shreem world",
  },
  {
    name: "Store",
    href: "/store",
    description: "Shop ghee, dhoop, gobar, and Jeevamrut",
  },
  {
    name: "Journal",
    href: "/journal",
    description: "Read product stories and ritual notes",
  },
  {
    name: "Prakriti Guide",
    href: "/prakriti-guide",
    description: "Upload photos for a natural-care direction",
  },
  {
    name: "Support",
    href: "/customer-service",
    description: "Get help with orders, accounts, and guidance",
  },
  {
    name: "Account",
    href: "/account",
    description: "Orders, addresses, and saved details",
  },
  {
    name: "Cart",
    href: "/cart",
    description: "Review your Shreem bag",
  },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
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
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="brand-outline-button h-auto px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white focus:outline-none"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-[rgba(5,16,24,0.32)] pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
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
                <PopoverPanel className="absolute left-0 top-[calc(100%+14px)] z-[51] flex h-[min(760px,calc(100vh-120px))] w-[min(430px,calc(100vw-1.5rem))] pr-0 text-sm text-ui-fg-on-color">
                  <div
                    data-testid="nav-menu-popup"
                    className="no-scrollbar relative flex h-full w-full flex-col justify-between overflow-y-auto rounded-[34px] border border-[rgba(245,199,96,0.24)] bg-[linear-gradient(180deg,#0d435a,#0f4a66_56%,#5a3a1d_100%)] p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.22)]"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,199,96,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(13,129,126,0.14),transparent_28%)]" />
                    <div className="relative z-[1] flex items-start justify-between gap-4">
                      <BrandLogo
                        size="sidebar"
                        theme="dark"
                        showCaption={false}
                      />
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-[#1d5670] text-white/85 hover:bg-[#256580] hover:text-white"
                      >
                        <XMark />
                      </button>
                    </div>
                    <ul className="relative z-[1] mt-6 flex flex-col items-start justify-start gap-3">
                      {SideMenuItems.map(({ name, href, description }) => {
                        const isActive =
                          href === "/"
                            ? normalizedPath === "/"
                            : normalizedPath === href ||
                              normalizedPath.startsWith(`${href}/`)

                        return (
                          <li key={name} className="w-full">
                            <LocalizedClientLink
                              href={href}
                              className={clx(
                                "group flex w-full items-center justify-between rounded-[24px] border px-4 py-4 transition-all duration-300 hover:-translate-y-0.5",
                                isActive
                                  ? "border-[rgba(245,199,96,0.88)] bg-[linear-gradient(135deg,#f3d37f,#d6a63a)] text-[var(--shreem-ink)] shadow-[0_16px_36px_rgba(156,105,18,0.2)]"
                                  : "border-white/10 bg-[#1c556d] text-white hover:border-[rgba(245,199,96,0.3)] hover:bg-[#24607a]"
                              )}
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              <div>
                                <p
                                  className={clx(
                                    "text-[1.35rem] leading-[1.08]",
                                    isActive ? "text-[var(--shreem-ink)]" : "text-white"
                                  )}
                                >
                                  {name}
                                </p>
                                <p
                                  className={clx(
                                    "mt-1 text-sm leading-6",
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
                                  "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-all duration-300",
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
                    <div className="relative z-[1] mt-8 flex flex-col gap-y-6 rounded-[28px] border border-white/10 bg-[#143646] px-4 py-5 text-white/75">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between gap-4"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
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
