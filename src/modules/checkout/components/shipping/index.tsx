"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import {
  buildShiprocketShippingData,
  formatShiprocketAmount,
  getCartShiprocketSignature,
  getShiprocketAmountPaise,
  getShiprocketEtaLabel,
  isCompleteIndianPincode,
  isIndianAddress,
  isShiprocketShippingOption,
  normalizePincode,
} from "@lib/util/shiprocket"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useShiprocketCheckout } from "@modules/checkout/context/shiprocket-context"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

type ShippingOptionWithServiceZone = HttpTypes.StoreCartShippingOption & {
  service_zone?: {
    fulfillment_set?: {
      type?: string
      location?: {
        address?: HttpTypes.StoreCartAddress
      }
    }
  }
}

function formatAddress(address?: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const shiprocket = useShiprocketCheckout()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const shippingOptions = useMemo(
    () => availableShippingMethods as ShippingOptionWithServiceZone[] | null,
    [availableShippingMethods]
  )

  const _shippingMethods = useMemo(
    () =>
      shippingOptions?.filter(
        (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
      ),
    [shippingOptions]
  )

  const _pickupMethods = useMemo(
    () =>
      shippingOptions?.filter(
        (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
      ),
    [shippingOptions]
  )

  const hasPickupOptions = !!_pickupMethods?.length
  const deliveryCountryCode = cart.shipping_address?.country_code || ""
  const deliveryPincode = normalizePincode(cart.shipping_address?.postal_code)
  const isIndianDelivery = isIndianAddress(deliveryCountryCode)
  const hasCompleteIndianPincode = isCompleteIndianPincode(deliveryPincode)
  const cartSignature = useMemo(() => getCartShiprocketSignature(cart), [cart])
  const selectedCartShippingMethod = cart.shipping_methods?.at(-1)
  const shiprocketMedusaOption = useMemo(
    () =>
      _shippingMethods?.find((option) => isShiprocketShippingOption(option)) ||
      null,
    [_shippingMethods]
  )
  const hasCalculatedShiprocketOption =
    shiprocketMedusaOption?.price_type === "calculated"
  const selectedIsShiprocket =
    Boolean(
      shiprocketMedusaOption?.id &&
        shippingMethodId === shiprocketMedusaOption.id
    ) || isShiprocketShippingOption(selectedCartShippingMethod)
  const fallbackSelected =
    isIndianDelivery &&
    Boolean(cart.shipping_methods?.[0] || shippingMethodId) &&
    !selectedIsShiprocket
  const shiprocketAmountPaise = getShiprocketAmountPaise(shiprocket.rate)
  const shiprocketEta = getShiprocketEtaLabel(shiprocket.rate)
  const shiprocketFresh =
    shiprocket.status === "available" &&
    Boolean(shiprocket.rate) &&
    shiprocket.postalCode === deliveryPincode &&
    shiprocket.cartSignature === cartSignature
  const fallbackAllowed =
    shiprocket.status === "error" &&
    fallbackSelected &&
    !hasCalculatedShiprocketOption
  const shiprocketReadyToCharge =
    !isIndianDelivery ||
    fallbackAllowed ||
    (shiprocketFresh && hasCalculatedShiprocketOption && selectedIsShiprocket)
  const deliveryStepComplete =
    (cart.shipping_methods?.length ?? 0) > 0 && shiprocketReadyToCharge
  const shiprocketBlockingMessage = useMemo(() => {
    if (!isIndianDelivery) {
      return null
    }

    if (!hasCompleteIndianPincode) {
      return "Enter a valid 6 digit Indian pincode before choosing delivery."
    }

    if (shiprocket.status === "loading") {
      return "Checking the Shiprocket delivery price. Please wait."
    }

    if (shiprocket.status === "unavailable") {
      return (
        shiprocket.error ||
        "Delivery is not available for this pincode. Please try another address."
      )
    }

    if (shiprocket.status === "error") {
      return fallbackAllowed
        ? null
        : shiprocket.error ||
            "Unable to calculate shipping right now. Please try again."
    }

    if (!shiprocketFresh) {
      return "Calculate Shiprocket Delivery for this pincode before payment."
    }

    if (!hasCalculatedShiprocketOption) {
      return "Live Shiprocket price is ready, but the checkout delivery option is not available yet. Payment is blocked so the order is not undercharged."
    }

    if (!selectedIsShiprocket) {
      return "Select Shiprocket Delivery so the live shipping price is included in payment."
    }

    return null
  }, [
    fallbackAllowed,
    hasCalculatedShiprocketOption,
    hasCompleteIndianPincode,
    isIndianDelivery,
    selectedIsShiprocket,
    shiprocket.error,
    shiprocket.status,
    shiprocketFresh,
  ])

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [_pickupMethods, _shippingMethods, cart.id, shippingMethodId])

  useEffect(() => {
    if (!isOpen || !isIndianDelivery) {
      return
    }

    const timer = window.setTimeout(() => {
      shiprocket.calculate({
        postalCode: deliveryPincode,
        countryCode: deliveryCountryCode,
        cart,
      })
    }, hasCompleteIndianPincode ? 500 : 100)

    return () => window.clearTimeout(timer)
  }, [
    cart,
    deliveryCountryCode,
    deliveryPincode,
    hasCompleteIndianPincode,
    isIndianDelivery,
    isOpen,
    shiprocket.calculate,
  ])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    if (shiprocketBlockingMessage) {
      setError(shiprocketBlockingMessage)
      return
    }

    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    const data =
      variant === "shipping" &&
      shiprocketMedusaOption?.id === id &&
      shiprocketFresh
        ? buildShiprocketShippingData({
            rate: shiprocket.rate,
            weightKg: shiprocket.cartWeightKg,
            postalCode: deliveryPincode,
            packageDetails: shiprocket.cartPackageDetails,
          })
        : undefined

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id, data })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <section className="brand-card px-4 py-5 small:px-6 small:py-6">
      <p className="brand-kicker">Step 2</p>
      <div className="mb-5 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <Heading
          level="h2"
          className={clx(
            "mt-2 flex flex-row items-center gap-x-3 text-[1.8rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !deliveryStepComplete,
            }
          )}
        >
          Delivery
          {!isOpen && deliveryStepComplete && <CheckCircleSolid />}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="rounded-full border border-[var(--shreem-border)] px-4 py-2 text-sm font-medium text-[var(--shreem-accent-dark)] hover:bg-white"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="mb-4 rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Delivery method
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
              Select how this order should reach you.
            </p>
          </div>
          {isIndianDelivery && (
            <div
              className={clx(
                "mb-5 rounded-[20px] border px-4 py-4 shadow-[0_16px_36px_rgba(18,63,99,0.08)] small:px-5",
                {
                  "border-[rgba(13,129,126,0.22)] bg-[rgba(240,248,246,0.88)]":
                    shiprocketFresh,
                  "border-[rgba(212,161,38,0.28)] bg-[rgba(255,248,233,0.82)]":
                    shiprocket.status === "loading" ||
                    shiprocket.status === "waiting" ||
                    shiprocket.status === "idle",
                  "border-rose-200 bg-rose-50":
                    shiprocket.status === "error" ||
                    shiprocket.status === "unavailable",
                }
              )}
              data-testid="shiprocket-rate-card"
            >
              <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-start xsmall:justify-between">
                <div>
                  <p className="brand-kicker">Live delivery</p>
                  <h3 className="mt-1 text-lg font-semibold leading-7 text-[var(--shreem-ink)]">
                    Shiprocket Delivery
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                    Pickup 486001 to pincode {deliveryPincode || "pending"}.
                  </p>
                </div>
                {shiprocketFresh && (
                  <span className="shrink-0 rounded-full border border-[rgba(13,129,126,0.22)] bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--shreem-ink)]">
                    {formatShiprocketAmount(
                      shiprocketAmountPaise,
                      cart.currency_code
                    )}
                  </span>
                )}
              </div>

              {shiprocket.status === "loading" && (
                <p className="mt-3 text-sm font-medium leading-6 text-[var(--shreem-ink)]">
                  Checking delivery price...
                </p>
              )}

              {(shiprocket.status === "idle" ||
                shiprocket.status === "waiting") && (
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  Enter a 6 digit Indian pincode to calculate the delivery
                  price.
                </p>
              )}

              {shiprocketFresh && shiprocket.rate && (
                <div className="mt-4 grid gap-3 small:grid-cols-[minmax(0,1fr)_auto] small:items-end">
                  <div className="grid gap-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    {shiprocket.rate.courier?.courier_name && (
                      <p>
                        Courier:{" "}
                        <span className="font-semibold text-[var(--shreem-ink)]">
                          {shiprocket.rate.courier.courier_name}
                        </span>
                      </p>
                    )}
                    {shiprocketEta && <p>{shiprocketEta}</p>}
                    <p>
                      Quote weight: {shiprocket.cartWeightKg.toFixed(2)} kg.
                    </p>
                    {shiprocket.cartPackageDetails.lengthCm &&
                      shiprocket.cartPackageDetails.breadthCm &&
                      shiprocket.cartPackageDetails.heightCm && (
                        <p>
                          Package: {shiprocket.cartPackageDetails.lengthCm} x{" "}
                          {shiprocket.cartPackageDetails.breadthCm} x{" "}
                          {shiprocket.cartPackageDetails.heightCm} cm.
                        </p>
                      )}
                    {hasCalculatedShiprocketOption ? (
                      <p className="font-medium text-[var(--shreem-accent-dark)]">
                        Ready to sync with secure checkout payment using the
                        configured delivery option.
                      </p>
                    ) : (
                      <p className="font-medium text-amber-800">
                        Quote is visible, but payment is blocked until a
                        Shiprocket checkout delivery option is available.
                      </p>
                    )}
                  </div>
                  {hasCalculatedShiprocketOption &&
                    shiprocketMedusaOption &&
                    !selectedIsShiprocket && (
                      <Button
                        size="small"
                        className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_100%)] text-white xsmall:w-auto"
                        onClick={() =>
                          handleSetShippingMethod(
                            shiprocketMedusaOption.id,
                            "shipping"
                          )
                        }
                        isLoading={isLoading}
                      >
                        Use Shiprocket
                      </Button>
                    )}
                </div>
              )}

              {(shiprocket.status === "error" ||
                shiprocket.status === "unavailable") && (
                <p className="mt-3 text-sm font-medium leading-6 text-rose-700">
                  {shiprocket.error ||
                    "Unable to calculate shipping right now. Please try again."}
                </p>
              )}
            </div>
          )}
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Shipping method
              </span>
              <span className="mb-4 text-ui-fg-muted txt-medium">
                How would you like your order delivered?
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(value) => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={clx(
                        "mb-2 flex cursor-pointer flex-col items-start justify-between gap-3 rounded-[16px] border px-4 py-4 text-small-regular transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,49,70,0.12)] xsmall:flex-row xsmall:items-center small:rounded-[22px] small:px-5",
                        {
                          "border-ui-border-interactive":
                            showPickupOptions === PICKUP_OPTION_ON,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span className="text-base-regular">
                          Pick up your order
                        </span>
                      </div>
                      <span className="shrink-0 justify-self-end text-ui-fg-base">
                        -
                      </span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const optionIsShiprocket =
                      isShiprocketShippingOption(option)
                    const isDisabled =
                      (option.price_type === "calculated" &&
                        !isLoadingPrices &&
                        typeof calculatedPricesMap[option.id] !== "number") ||
                      (isIndianDelivery &&
                        optionIsShiprocket &&
                        (!shiprocketFresh || !hasCalculatedShiprocketOption))

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className={clx(
                          "mb-2 flex cursor-pointer flex-col items-start justify-between gap-3 rounded-[16px] border px-4 py-4 text-small-regular transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,49,70,0.12)] xsmall:flex-row xsmall:items-center small:rounded-[22px] small:px-5",
                          {
                            "border-ui-border-interactive":
                              option.id === shippingMethodId,
                            "hover:shadow-brders-none cursor-not-allowed":
                              isDisabled,
                          }
                        )}
                      >
                        <div className="flex items-center gap-x-4">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          <span className="flex flex-col">
                            <span className="text-base-regular">
                              {optionIsShiprocket
                                ? "Shiprocket Delivery"
                                : option.name}
                            </span>
                            {optionIsShiprocket && shiprocketFresh && (
                              <span className="text-sm leading-5 text-[var(--shreem-muted)]">
                                {shiprocket.rate?.courier?.courier_name ||
                                  "Live Shiprocket courier"}
                                {shiprocketEta ? ` · ${shiprocketEta}` : ""}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="shrink-0 justify-self-end text-ui-fg-base">
                          {optionIsShiprocket && shiprocketFresh ? (
                            formatShiprocketAmount(
                              shiprocketAmountPaise,
                              cart?.currency_code
                            )
                          ) : option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })
                          ) : calculatedPricesMap[option.id] ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader />
                          ) : (
                            "-"
                          )}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="font-medium txt-medium text-ui-fg-base">
                  Store
                </span>
                <span className="mb-4 text-ui-fg-muted txt-medium">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "mb-2 flex cursor-pointer flex-col items-start justify-between gap-3 rounded-[16px] border px-4 py-4 text-small-regular transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,49,70,0.12)] xsmall:flex-row xsmall:items-center small:rounded-[22px] small:px-5",
                            {
                              "border-ui-border-interactive":
                                option.id === shippingMethodId,
                              "hover:shadow-brders-none cursor-not-allowed":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-base-regular">
                                {option.name}
                              </span>
                              <span className="text-base-regular text-ui-fg-muted">
                                {formatAddress(
                                  option.service_zone?.fulfillment_set?.location
                                    ?.address
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 justify-self-end text-ui-fg-base">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            {shiprocketBlockingMessage && (
              <div className="mb-3 rounded-[16px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] px-4 py-3 text-sm leading-6 text-[var(--shreem-ink)]">
                {shiprocketBlockingMessage}
              </div>
            )}
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt-2 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] xsmall:w-auto"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                isLoading || !cart.shipping_methods?.[0] || !shiprocketReadyToCharge
              }
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Method
                </Text>
                <Text className="txt-medium text-ui-fg-base">
                  {isShiprocketShippingOption(cart.shipping_methods!.at(-1))
                    ? "Shiprocket Delivery"
                    : cart.shipping_methods!.at(-1)!.name}
                </Text>
                <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                  {isShiprocketShippingOption(cart.shipping_methods!.at(-1)) &&
                  shiprocketFresh
                    ? formatShiprocketAmount(
                        shiprocketAmountPaise,
                        cart.currency_code
                      )
                    : convertToLocale({
                        amount: cart.shipping_methods!.at(-1)!.amount!,
                        currency_code: cart?.currency_code,
                      })}{" "}
                  charged for this order at checkout.
                </Text>
                {isShiprocketShippingOption(cart.shipping_methods!.at(-1)) &&
                  shiprocketFresh &&
                  (shiprocket.rate?.courier?.courier_name || shiprocketEta) && (
                    <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                      {shiprocket.rate?.courier?.courier_name}
                      {shiprocket.rate?.courier?.courier_name && shiprocketEta
                        ? " · "
                        : ""}
                      {shiprocketEta}
                    </Text>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-6" />
    </section>
  )
}

export default Shipping
