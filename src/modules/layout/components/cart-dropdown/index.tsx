"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="brand-primary-button px-4 py-2.5 text-xs small:px-5 small:py-3"
            href="/cart"
            data-testid="nav-cart-link"
          >{`Bag (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="absolute right-0 top-[calc(100%+10px)] hidden w-[420px] overflow-hidden rounded-[28px] border border-[rgba(18,63,99,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(242,248,246,0.94))] text-ui-fg-base shadow-[0_24px_64px_rgba(12,47,73,0.16)] backdrop-blur-xl small:block"
            data-testid="nav-cart-dropdown"
          >
            <div className="flex items-center justify-between border-b border-[rgba(18,63,99,0.12)] px-5 py-4">
              <div>
                <p className="brand-kicker">Your bag</p>
                <h3 className="mt-1 text-2xl text-[var(--shreem-ink)]">
                  Ready when you are
                </h3>
              </div>
              <span className="brand-pill">{totalItems} items</span>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="grid max-h-[402px] grid-cols-1 gap-y-6 overflow-y-scroll px-5 py-5 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[104px_1fr] gap-x-4 rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/72 p-3"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="mr-4 flex w-[180px] flex-col overflow-ellipsis whitespace-nowrap">
                                <h3 className="overflow-hidden text-base-regular text-ellipsis text-[var(--shreem-ink)]">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  className="mt-1 text-xs text-[var(--shreem-muted)]"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Quantity: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-y-4 border-t border-[rgba(18,63,99,0.12)] px-5 py-5 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-ui-fg-base font-semibold">
                      Subtotal{" "}
                      <span className="font-normal">(excl. taxes)</span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="h-12 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Review bag
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex flex-col items-center justify-center gap-y-4 px-6 py-16 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--shreem-accent-dark)] text-small-regular text-white">
                    <span>0</span>
                  </div>
                  <span className="text-[var(--shreem-muted)]">
                    Your shopping bag is still waiting for its first Shreem pick.
                  </span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">Go to all products page</span>
                        <Button
                          onClick={close}
                          className="h-12 rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-6 text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
                        >
                          Explore products
                        </Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
