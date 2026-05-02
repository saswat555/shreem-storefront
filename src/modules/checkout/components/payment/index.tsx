"use client"

import { RadioGroup } from "@headlessui/react"
import { getPaymentInfo, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession =
    cart.payment_collection?.payment_sessions?.find(
      (paymentSession: any) =>
        paymentSession.status === "pending" ||
        paymentSession.status === "authorized"
    ) || cart.payment_collection?.payment_sessions?.[0]

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? availablePaymentMethods?.[0]?.id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

    await initiatePaymentSession(cart, {
      provider_id: method,
    }).catch((err) => {
      setError(err.message)
    })
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    ((activeSession || selectedPaymentMethod) &&
      cart?.shipping_methods.length !== 0) ||
    paidByGiftcard

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

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <section className="brand-card px-5 py-6 small:px-6">
      <p className="brand-kicker">Step 3</p>
      <div className="mb-6 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <Heading
          level="h2"
          className={clx(
            "mt-3 flex flex-row items-center gap-x-3 text-[2rem] leading-none text-[var(--shreem-ink)] small:text-[2.4rem]",
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
          <div className="mb-5 rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.76),rgba(255,249,240,0.72))] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Choose how you want to pay
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
              Pick the provider you trust. We keep the confirmation step clean and visible before the order is placed.
            </p>
          </div>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex w-full flex-col rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4 small:w-auto">
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
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && (activeSession || selectedPaymentMethod) ? (
            <div className="grid gap-4 small:grid-cols-2">
              <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white/80">
                    {getPaymentInfo(
                      activeSession?.provider_id || selectedPaymentMethod
                    ).icon || <CreditCard />}
                  </span>
                  <div>
                    <Text
                      className="txt-medium text-ui-fg-base"
                      data-testid="payment-method-summary"
                    >
                      {getPaymentInfo(
                        activeSession?.provider_id || selectedPaymentMethod
                      ).title}
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                      {
                        getPaymentInfo(
                          activeSession?.provider_id || selectedPaymentMethod
                        ).description
                      }
                    </Text>
                  </div>
                </div>
              </div>
              <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex items-start gap-3 txt-medium text-ui-fg-subtle"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(18,63,99,0.12)] bg-white/80 p-2">
                    <CreditCard />
                  </Container>
                  <Text className="text-sm leading-6 text-[var(--shreem-muted)]">
                    {isStripeLike(
                      activeSession?.provider_id || selectedPaymentMethod
                    ) && cardBrand
                      ? cardBrand
                      : "Ready for secure confirmation in the final review step."}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="w-full rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
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
      <Divider className="mt-8" />
    </section>
  )
}

export default Payment
