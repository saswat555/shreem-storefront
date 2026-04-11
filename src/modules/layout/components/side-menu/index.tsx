"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import BrandLogo from "../brand-logo"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Gaatha: "/gaatha",
  Account: "/account",
  Cart: "/cart",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

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
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 backdrop-blur-2xl"
                leaveTo="opacity-0 translate-y-2"
              >
                <PopoverPanel className="absolute inset-x-0 z-[51] m-2 flex h-[calc(100vh-1rem)] w-full pr-0 text-sm text-ui-fg-on-color backdrop-blur-2xl sm:w-[420px]">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex h-full w-full flex-col justify-between rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(33,24,18,0.94),rgba(24,17,13,0.88))] p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.28)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <BrandLogo size="medium" theme="dark" />
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        <XMark />
                      </button>
                    </div>
                    <div className="mt-10 brand-pill w-fit border-white/15 bg-white/5 text-white/65">
                      A2 rituals from desi cows
                    </div>
                    <ul className="mt-8 flex flex-col items-start justify-start gap-6">
                      {Object.entries(SideMenuItems).map(([name, href]) => {
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="text-[2.2rem] leading-[1.1] text-white transition-transform duration-300 hover:translate-x-1 hover:text-white/75"
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="mt-10 flex flex-col gap-y-6 border-t border-white/10 pt-6 text-white/75">
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
