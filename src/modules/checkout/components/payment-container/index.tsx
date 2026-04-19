import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { getPaymentInfo, isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<
    string,
    { title: string; icon: JSX.Element; description?: string }
  >
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const paymentInfo = getPaymentInfo(paymentProviderId)

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "mb-2 flex cursor-pointer flex-col gap-y-3 rounded-[22px] border px-5 py-4 text-small-regular transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,49,70,0.12)]",
        {
          "border-ui-border-interactive bg-[rgba(255,252,248,0.94)] shadow-[0_12px_24px_rgba(15,49,70,0.08)]":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <div className="min-w-0">
            <Text className="text-base-semi text-[var(--shreem-ink)]">
              {paymentInfo.title}
            </Text>
            <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
              {paymentInfo.description}
            </Text>
            {isManual(paymentProviderId) && isDevelopment && (
              <PaymentTest className="mt-2 hidden small:block" />
            )}
          </div>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.9)] text-ui-fg-base shadow-[0_10px_24px_rgba(15,49,70,0.08)]">
          {paymentInfo.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "\"Avenir Next\", \"Segoe UI\", sans-serif",
          color: "#123f63",
          fontSize: "15px",
          "::placeholder": {
            color: "#6b7280",
          },
        },
      },
      classes: {
        base: "block w-full rounded-[18px] border border-[rgba(18,63,99,0.14)] bg-[rgba(255,252,248,0.96)] px-4 py-3 text-[15px] shadow-[0_10px_24px_rgba(15,49,70,0.08)] transition-all duration-300 ease-in-out focus:outline-none",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 rounded-[20px] border border-[rgba(18,63,99,0.12)] bg-[linear-gradient(135deg,rgba(240,248,246,0.72),rgba(255,249,240,0.72))] p-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Enter your card details
            </Text>
            <Text className="mb-3 text-sm leading-6 text-[var(--shreem-muted)]">
              Your payment is encrypted and processed securely before order confirmation.
            </Text>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
