import { Dialog, Transition } from "@headlessui/react"
import { Button, clx } from "@medusajs/ui"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  return (
    <>
      <div
        className={clx("fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0 translate-y-6"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-6"
        >
          <div
            className="m-2 rounded-[20px] border border-[rgba(18,63,99,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.97),rgba(242,248,246,0.94))] p-3 shadow-[0_18px_48px_rgba(12,47,73,0.18)] backdrop-blur-2xl xsmall:m-3 xsmall:p-4"
            data-testid="mobile-actions"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]" data-testid="mobile-title">
                  {product.title}
                </p>
                {selectedPrice ? (
                  <div className="mt-1 flex items-end gap-x-2 text-sm">
                    {selectedPrice.price_type === "sale" && (
                      <p>
                        <span className="text-xs text-[var(--shreem-muted)] line-through">
                          {selectedPrice.original_price}
                        </span>
                      </p>
                    )}
                    <span
                      className={clx("font-semibold text-[var(--shreem-ink)]", {
                        "text-[var(--shreem-accent-dark)]":
                          selectedPrice.price_type === "sale",
                      })}
                    >
                      {selectedPrice.calculated_price}
                    </span>
                  </div>
                ) : null}
              </div>
              <span className="brand-pill hidden shrink-0 px-3 py-1.5 text-[10px] xsmall:inline-flex">Mobile ready</span>
            </div>
            <div
              className={clx("grid w-full grid-cols-2 gap-x-2 xsmall:gap-x-3", {
                "!grid-cols-1": isSimple,
              })}
            >
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="h-12 min-w-0 rounded-full border border-[rgba(18,63,99,0.16)] bg-white/72 text-[var(--shreem-ink)]"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate">
                      {variant ? Object.values(options).join(" / ") : "Select options"}
                    </span>
                    <ChevronDown />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="h-12 min-w-0 rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant
                  ? "Select variant"
                  : !inStock
                  ? "Out of stock"
                  : "Add to cart"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[rgba(29,21,16,0.42)] backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <div className="flex min-h-full items-end justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-8"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-8"
              >
                <Dialog.Panel
                  className="max-h-[86dvh] w-full transform overflow-y-auto rounded-t-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,252,247,0.99),rgba(244,248,247,0.98))] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 text-left small:rounded-t-[32px] small:px-5 small:pb-10 small:pt-5"
                  data-testid="mobile-actions-modal"
                >
                  <div className="mb-6 flex w-full justify-end">
                    <button
                      onClick={close}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(18,63,99,0.14)] bg-white/82 text-ui-fg-base"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="mb-5">
                    <p className="brand-kicker">Select options</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                      Tune the product to the exact combination you want before
                      adding it to your bag.
                    </p>
                  </div>
                  <div className="bg-white/70">
                    {(product.variants?.length ?? 0) > 1 && (
                      <div className="flex flex-col gap-y-6">
                        {(product.options || []).map((option) => {
                          return (
                            <div key={option.id}>
                              <OptionSelect
                                option={option}
                                current={options[option.id]}
                                updateOption={updateOptions}
                                title={option.title ?? ""}
                                disabled={optionsDisabled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
