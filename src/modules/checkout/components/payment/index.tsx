"use client"

import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import ManualUpiQrImage from "@modules/common/components/manual-upi-qr-image"
import Divider from "@modules/common/components/divider"
import { getPaymentInfo, isStripeLike, paymentInfoMap } from "@lib/constants"
import { safeInitiatePaymentSession } from "@lib/data/cart"
import { isDigitalOnlyCart } from "@lib/util/digital-cart"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

type ManualUpiLiveConfig = {
  upi_id?: string
  payee_name?: string
  qr_image_url?: string
}

const isManualUpiProvider = (providerId?: string | null) =>
  Boolean(providerId?.toLowerCase().includes("manual_upi"))

const getActiveSession = (cart: any) =>
  cart?.payment_collection?.payment_sessions?.find(
    (session: any) =>
      session?.status === "pending" || session?.status === "authorized"
  ) || cart?.payment_collection?.payment_sessions?.[0]

const hasValidPhysicalShipping = (cart: any) => {
  const methods = Array.isArray(cart?.shipping_methods) ? cart.shipping_methods : []

  if (!methods.length) {
    return false
  }

  return methods.some((method: any) => {
    const haystack = `${method?.name || ""} ${method?.shipping_option?.name || ""} ${JSON.stringify(method?.metadata || {})}`.toLowerCase()
    return !haystack.includes("no shipping") && !haystack.includes("no-shipping") && !haystack.includes("digital")
  })
}

const ManualUpiNotice = ({ data }: { data?: Record<string, unknown> | null }) => {
  const [liveConfig, setLiveConfig] = useState<ManualUpiLiveConfig | null>(null)

  const qrImageUrl =
    (typeof data?.qr_image_url === "string" ? data.qr_image_url : "") ||
    liveConfig?.qr_image_url ||
    ""

  const upiDeepLink =
    typeof data?.upi_deep_link === "string" ? data.upi_deep_link : ""

  const upiId =
    (typeof data?.upi_id === "string" ? data.upi_id : "") ||
    liveConfig?.upi_id ||
    ""

  const payeeName =
    (typeof data?.payee_name === "string" ? data.payee_name : "") ||
    liveConfig?.payee_name ||
    ""

  const reference = typeof data?.reference === "string" ? data.reference : ""

  useEffect(() => {
    let active = true

    fetch("/api/manual-upi/config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active || !payload?.ok) {
          return
        }

        setLiveConfig({
          upi_id: typeof payload.upi_id === "string" ? payload.upi_id : "",
          payee_name:
            typeof payload.payee_name === "string" ? payload.payee_name : "",
          qr_image_url:
            typeof payload.qr_image_url === "string"
              ? payload.qr_image_url
              : "",
        })
      })
      .catch(() => null)

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mt-4 rounded-[18px] border border-[rgba(212,161,38,0.24)] bg-[rgba(255,248,233,0.78)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--shreem-ink)]">
        UPI payment will be checked manually
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
        Pay using the QR/link, then place the order. Dispatch starts after the
        bank credit is verified by Shreem Farms.
      </p>

      <div className="mt-3 grid gap-3 small:grid-cols-[120px_minmax(0,1fr)] small:items-center">
        {qrImageUrl ? (
          <ManualUpiQrImage
            src={qrImageUrl}
            alt="UPI QR code"
            className="h-[120px] w-[120px] rounded-[16px] border border-[var(--shreem-border)] bg-white object-contain p-2"
          />
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-[16px] border border-[var(--shreem-border)] bg-white px-3 text-center text-xs leading-5 text-[var(--shreem-muted)]">
            QR is loading. Refresh payment if it does not appear.
          </div>
        )}

        <div className="grid gap-1 text-xs leading-5 text-[var(--shreem-muted)]">
          {upiId && (
            <p>
              <span className="font-semibold text-[var(--shreem-ink)]">
                UPI:
              </span>{" "}
              {upiId}
            </p>
          )}
          {payeeName && (
            <p>
              <span className="font-semibold text-[var(--shreem-ink)]">
                Payee:
              </span>{" "}
              {payeeName}
            </p>
          )}
          {reference && (
            <p>
              <span className="font-semibold text-[var(--shreem-ink)]">
                Reference:
              </span>{" "}
              {reference}
            </p>
          )}
          {upiDeepLink && (
            <a
              href={upiDeepLink}
              className="mt-2 inline-flex w-max rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_58%,#6f211f_100%)] px-4 py-2 text-xs font-semibold text-white"
            >
              Open UPI app
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeSession = useMemo(() => getActiveSession(cart), [cart])
  const providerMethods = useMemo(
    () => (Array.isArray(availablePaymentMethods) ? availablePaymentMethods : []),
    [availablePaymentMethods]
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id || providerMethods?.[0]?.id || ""
  )

  useEffect(() => {
    const latestSession = getActiveSession(cart)
    const nextMethod =
      latestSession?.provider_id || providerMethods?.[0]?.id || ""

    if (!selectedPaymentMethod && nextMethod) {
      setSelectedPaymentMethod(nextMethod)
    }
  }, [cart, providerMethods, selectedPaymentMethod])

  const isOpen = searchParams.get("step") === "payment"

  const paidByGiftcard =
    Array.isArray(cart?.gift_cards) &&
    cart.gift_cards.length > 0 &&
    Number(cart?.total || 0) === 0

  const digitalOnlyCart = isDigitalOnlyCart(cart)
  const hasShipping =
    digitalOnlyCart ||
    Boolean(cart?.shipping_address && hasValidPhysicalShipping(cart))

  const paymentReady =
    paidByGiftcard ||
    (Boolean(activeSession || selectedPaymentMethod) && hasShipping)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!paidByGiftcard && !selectedPaymentMethod) {
        throw new Error("Please select a payment method.")
      }

      const latestSession = getActiveSession(cart)
      const sessionMatches = latestSession?.provider_id === selectedPaymentMethod

      if (!paidByGiftcard && !sessionMatches) {
        const result = await safeInitiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })

        if (!result.ok) {
          setError(result.error)
          setIsLoading(false)
          return
        }
      }

      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Unable to continue to review.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const summaryProvider = activeSession?.provider_id || selectedPaymentMethod
  const summaryInfo = getPaymentInfo(summaryProvider)

  return (
    <section className="brand-card px-4 py-5 small:px-6 small:py-6">
      <p className="brand-kicker">Step 3</p>

      <div className="mb-5 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <Heading
          level="h2"
          className={clx(
            "mt-2 flex flex-row items-center gap-x-3 text-[1.8rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>

        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="rounded-full border border-[var(--shreem-border)] px-4 py-2 text-sm font-medium text-[var(--shreem-accent-dark)] hover:bg-white"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          <div className="mb-4 rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Payment method
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
              Choose a provider and continue to review.
            </p>
          </div>

          {!paidByGiftcard && providerMethods.length > 0 && (
            <div className="grid gap-3">
              {providerMethods.map((paymentMethod) => {
                const methodId = paymentMethod.id
                const selected = selectedPaymentMethod === methodId

                return (
                  <button
                    key={methodId}
                    type="button"
                    onClick={() => setPaymentMethod(methodId)}
                    className={clx(
                      "rounded-[18px] border px-4 py-4 text-left transition",
                      selected
                        ? "border-[var(--shreem-accent)] bg-[rgba(255,248,233,0.8)]"
                        : "border-[rgba(18,63,99,0.1)] bg-white/58 hover:border-[var(--shreem-accent)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white/80">
                        {getPaymentInfo(methodId).icon || <CreditCard />}
                      </span>
                      <div>
                        <Text className="txt-medium text-ui-fg-base">
                          {getPaymentInfo(methodId).title}
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                          {getPaymentInfo(methodId).description}
                        </Text>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {!paidByGiftcard && providerMethods.length === 0 && (
            <div className="rounded-[18px] border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700">
              No payment method is available for this region. Enable Razorpay or
              manual UPI in Medusa Admin → Region payment providers.
            </div>
          )}

          {paidByGiftcard && (
            <div className="flex w-full flex-col rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4 small:w-auto">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          {isManualUpiProvider(selectedPaymentMethod) && (
            <ManualUpiNotice
              data={activeSession?.data as Record<string, unknown>}
            />
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6 w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)] xsmall:w-auto"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              isLoading ||
              (!selectedPaymentMethod && !paidByGiftcard) ||
              (isStripeLike(selectedPaymentMethod) && !cardComplete)
            }
            data-testid="submit-payment-button"
          >
            Continue to review
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && (activeSession || selectedPaymentMethod) ? (
            <div className="grid gap-3 small:grid-cols-2">
              <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white/80">
                    {summaryInfo.icon || <CreditCard />}
                  </span>
                  <div>
                    <Text
                      className="txt-medium text-ui-fg-base"
                      data-testid="payment-method-summary"
                    >
                      {summaryInfo.title}
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                      {summaryInfo.description}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex items-start gap-3 txt-medium text-ui-fg-subtle"
                  data-testid="payment-details-summary"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white/80">
                    <CreditCard />
                  </span>
                  <Text className="text-sm leading-6 text-[var(--shreem-muted)]">
                    {isStripeLike(summaryProvider) && cardBrand
                      ? cardBrand
                      : "Ready for secure confirmation in the final review step."}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="w-full rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>

      <Divider className="mt-6" />
    </section>
  )
}

export default Payment
