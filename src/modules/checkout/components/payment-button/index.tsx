"use client"

import {
  getPaymentInfo,
  isOfflineLike,
  isRazorpayLike,
  isStripeLike,
} from "@lib/constants"
import {
  completeRazorpayPayment,
  placeOrder,
  safeInitiatePaymentSession,
} from "@lib/data/cart"
import { isDigitalOnlyCart } from "@lib/util/digital-cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void
      on: (event: string, callback: (response: any) => void) => void
    }
  }
}

const CHECKOUT_ERROR_MESSAGE =
  "We could not place this order right now. Please confirm the payment and delivery details, then try again. If money was deducted, contact support with your phone number and cart details."

const SESSION_KEY = "shreem_site_session_id"
const LANDING_KEY = "shreem_site_landing_page"
const REFERRER_KEY = "shreem_site_first_referrer"
const UTM_KEY = "shreem_site_utm"

const getStoredSessionId = () => {
  try {
    return window.localStorage.getItem(SESSION_KEY) || ""
  } catch {
    return ""
  }
}

const readStoredJson = (key: string) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}")
  } catch {
    return {}
  }
}

const trackPaymentEvent = (
  eventType: string,
  metadata: Record<string, unknown>
) => {
  if (typeof window === "undefined") {
    return
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: eventType,
      path: `${window.location.pathname}${window.location.search}`,
      title: document.title,
      referrer: document.referrer,
      session_id: getStoredSessionId(),
      metadata: {
        attribution: {
          landing_page: window.localStorage.getItem(LANDING_KEY) || "",
          first_referrer:
            window.localStorage.getItem(REFERRER_KEY) || document.referrer || "",
          utm: readStoredJson(UTM_KEY),
        },
        ...metadata,
      },
    }),
    keepalive: true,
  }).catch(() => undefined)
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false)
      return
    }

    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true })
      existing.addEventListener("error", () => resolve(false), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const getActivePaymentSession = (cart: HttpTypes.StoreCart) => {
  const sessions = cart.payment_collection?.payment_sessions || []

  return (
    sessions.find(
      (session) =>
        (session.status === "pending" || session.status === "authorized") &&
        (!isRazorpayLike(session.provider_id) ||
          razorpaySessionMatchesCart(session, cart))
    ) ||
    sessions.find(
      (session) =>
        session.status === "pending" || session.status === "authorized"
    ) ||
    sessions.find(
      (session) =>
        !isRazorpayLike(session.provider_id) ||
        razorpaySessionMatchesCart(session, cart)
    ) ||
    sessions[0]
  )
}

const hasValidPhysicalShipping = (cart: HttpTypes.StoreCart) => {
  const methods = cart.shipping_methods || []

  if (!methods.length) {
    return false
  }

  return methods.some((method: any) => {
    const haystack = `${method?.name || ""} ${method?.shipping_option?.name || ""} ${JSON.stringify(method?.metadata || {})}`.toLowerCase()
    return !haystack.includes("no shipping") && !haystack.includes("no-shipping") && !haystack.includes("digital")
  })
}

const getPaymentSessionsFromResponse = (payload: any) => {
  const candidates = [
    payload?.payment_collection?.payment_sessions,
    payload?.paymentCollection?.payment_sessions,
    payload?.cart?.payment_collection?.payment_sessions,
    payload?.payment_session ? [payload.payment_session] : null,
    payload?.paymentSession ? [payload.paymentSession] : null,
  ]

  return candidates.find(Array.isArray) || []
}

const readNumber = (value: any) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getCartRazorpayMinorAmount = (cart?: HttpTypes.StoreCart) => {
  const total = readNumber((cart as any)?.total ?? (cart as any)?.payment_collection?.amount)
  return total > 0 ? Math.round(total * 100) : 0
}

const getSessionRazorpayMinorAmount = (
  session?: HttpTypes.StorePaymentSession | Record<string, any> | null
) => {
  const data = (session?.data || {}) as Record<string, any>
  const explicit = readNumber(
    data.razorpay_amount || data.razorpayAmount || data.razorpay_order_amount
  )

  return explicit > 0 ? Math.round(explicit) : 0
}

const razorpaySessionMatchesCart = (
  session?: HttpTypes.StorePaymentSession | Record<string, any> | null,
  cart?: HttpTypes.StoreCart
) => {
  if (!session || !cart || !isRazorpayLike((session as any)?.provider_id)) {
    return true
  }

  const sessionAmount = getSessionRazorpayMinorAmount(session)
  const cartAmount = getCartRazorpayMinorAmount(cart)

  return sessionAmount > 0 && cartAmount > 0 && sessionAmount === cartAmount
}

const getRazorpaySessionDetails = (
  session?: HttpTypes.StorePaymentSession | Record<string, any> | null,
  cart?: HttpTypes.StoreCart
) => {
  const sessionData = (session?.data || {}) as Record<string, any>
  const orderId =
    sessionData.razorpay_order_id ||
    sessionData.razorpayOrderId ||
    sessionData.order_id
  const amount =
    sessionData.razorpay_amount ||
    sessionData.razorpayAmount ||
    getCartRazorpayMinorAmount(cart) ||
    cart?.total ||
    cart?.payment_collection?.amount
  const currency =
    sessionData.razorpay_currency ||
    sessionData.currency ||
    cart?.currency_code ||
    "INR"
  const key =
    sessionData.razorpay_key_id ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    ""

  return {
    sessionData,
    orderId,
    amount,
    currency,
    key,
  }
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const digitalOnlyCart = isDigitalOnlyCart(cart)
  const shippingReady = digitalOnlyCart || hasValidPhysicalShipping(cart)
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    !shippingReady

  const paymentSession = getActivePaymentSession(cart)

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isRazorpayLike(paymentSession?.provider_id):
      return (
        <RazorpayPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isOfflineLike(paymentSession?.provider_id):
      return (
        <OfflinePaymentButton
          notReady={notReady}
          providerId={paymentSession?.provider_id}
          data-testid={dataTestId}
        />
      )
    default:
      return (
        <Button
          disabled
          className="w-full rounded-full border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.86)] text-[var(--shreem-muted)]"
        >
          Select a payment method
        </Button>
      )
  }
}

const RazorpayPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const session = getActivePaymentSession(cart)
  const digitalOnlyCart = isDigitalOnlyCart(cart)
  const {
    orderId: razorpayOrderId,
    amount,
    currency,
    key,
  } = getRazorpaySessionDetails(session, cart)

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)
    trackPaymentEvent("payment_started", {
      provider: "razorpay",
      cart_id: cart.id,
      amount,
      currency,
    })

    try {
      let activeSession = session
      let {
        sessionData,
        orderId: activeOrderId,
        amount: activeAmount,
        currency: activeCurrency,
        key: activeKey,
      } = getRazorpaySessionDetails(activeSession, cart)

      if (!activeSession?.id || !activeSession?.provider_id || !cart.payment_collection?.id) {
        throw new Error("Razorpay payment session is not ready. Please select Razorpay again.")
      }

      let activeSessionId = activeSession.id

      if (!activeOrderId || !razorpaySessionMatchesCart(activeSession, cart)) {
        const refreshed = await safeInitiatePaymentSession(cart, {
          provider_id: activeSession.provider_id,
        })

        if (!refreshed.ok) {
          throw new Error(refreshed.error)
        }

        const refreshedSession = getPaymentSessionsFromResponse(refreshed.data)
          .find((item: any) =>
            item?.provider_id === activeSession?.provider_id &&
            razorpaySessionMatchesCart(item, cart)
          )

        if (refreshedSession) {
          activeSession = refreshedSession
          activeSessionId = refreshedSession.id
          const details = getRazorpaySessionDetails(activeSession, cart)
          sessionData = details.sessionData
          activeOrderId = details.orderId
          activeAmount = details.amount
          activeCurrency = details.currency
          activeKey = details.key
        }
      }

      if (!activeOrderId) {
        throw new Error("Razorpay order was refreshed but is still not ready. Please refresh checkout and try once more.")
      }

      if (!razorpaySessionMatchesCart(activeSession, cart)) {
        throw new Error("Razorpay order amount did not match the cart total. Please refresh checkout and try again.")
      }

      if (!activeKey) {
        throw new Error("Razorpay key is missing on frontend.")
      }

      const loaded = await loadRazorpayScript()

      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded. Please check internet connection.")
      }

      const customerName = [
        cart.billing_address?.first_name,
        cart.billing_address?.last_name,
      ]
        .filter(Boolean)
        .join(" ")

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay!({
          key: activeKey,
          amount: activeAmount,
          currency: String(activeCurrency).toUpperCase(),
          name: "Shreem Farms",
          description: `Order payment for cart ${cart.id}`,
          order_id: activeOrderId,
          prefill: {
            name: customerName,
            email: cart.email || "",
            contact:
              cart.billing_address?.phone ||
              cart.shipping_address?.phone ||
              "",
          },
          notes: {
            cart_id: cart.id,
            payment_collection_id: cart.payment_collection?.id,
          },
          theme: {
            color: "#123f63",
          },
          handler: async (response: any) => {
            try {
              const razorpay_payment_id = response?.razorpay_payment_id
              const razorpay_order_id = response?.razorpay_order_id
              const razorpay_signature = response?.razorpay_signature

              if (
                !razorpay_payment_id ||
                !razorpay_order_id ||
                !razorpay_signature
              ) {
                throw new Error("Razorpay payment response was incomplete.")
              }

              const completedOrder = await completeRazorpayPayment({
                cartId: cart.id,
                paymentCollectionId: cart.payment_collection!.id,
                paymentSessionId: activeSessionId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
              })
              trackPaymentEvent("payment_authorized", {
                provider: "razorpay",
                cart_id: cart.id,
                razorpay_order_id,
              })

              const orderId =
                (completedOrder as any)?.complete_response?.order?.id ||
                (completedOrder as any)?.order?.id ||
                (completedOrder as any)?.id ||
                ""
              const countryCode =
                (completedOrder as any)?.complete_response?.order?.shipping_address?.country_code ||
                (completedOrder as any)?.complete_response?.order?.billing_address?.country_code ||
                (completedOrder as any)?.countryCode ||
                cart.shipping_address?.country_code ||
                cart.billing_address?.country_code ||
                "in"

              if (orderId) {
                trackPaymentEvent("order_completed", {
                  provider: "razorpay",
                  cart_id: cart.id,
                  order_id: orderId,
                })
                const accountPath = digitalOnlyCart ? "account" : "account/orders"
                window.location.assign(
                  `/${String(countryCode).toLowerCase()}/${accountPath}`
                )
                resolve()
                return
              }

              throw new Error(
                "Payment was verified, but the order did not complete automatically. Please contact support before retrying payment."
              )
            } catch (error) {
              reject(error)
            }
          },
          modal: {
            ondismiss: () => {
              trackPaymentEvent("payment_abandoned", {
                provider: "razorpay",
                cart_id: cart.id,
              })
              reject(new Error("Payment was cancelled before completion."))
            },
          },
        })

        razorpay.on("payment.failed", (response: any) => {
          trackPaymentEvent("payment_failed", {
            provider: "razorpay",
            cart_id: cart.id,
            reason:
              response?.error?.description ||
              response?.error?.reason ||
              "Razorpay payment failed.",
          })
          reject(
            new Error(
              response?.error?.description ||
                response?.error?.reason ||
                "Razorpay payment failed."
            )
          )
        })

        razorpay.open()
      })
    } catch (error: any) {
      console.error("Razorpay checkout failed", error)
      trackPaymentEvent("checkout_error", {
        provider: "razorpay",
        cart_id: cart.id,
        message: error?.message || CHECKOUT_ERROR_MESSAGE,
      })
      setErrorMessage(error?.message || CHECKOUT_ERROR_MESSAGE)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting || !key}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
        data-testid={dataTestId}
      >
Pay securely with Razorpay
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="razorpay-payment-error-message"
      />
    </>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        console.error("Place order failed", err)
        trackPaymentEvent("checkout_error", {
          provider: "stripe",
          cart_id: cart.id,
          message: err?.message || CHECKOUT_ERROR_MESSAGE,
        })
        setErrorMessage(CHECKOUT_ERROR_MESSAGE)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)
    trackPaymentEvent("payment_started", {
      provider: "stripe",
      cart_id: cart.id,
    })

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          trackPaymentEvent("payment_failed", {
            provider: "stripe",
            cart_id: cart.id,
            message: error.message,
          })
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(
            error.message ||
              "Payment could not be confirmed. Please try again or choose another payment method."
          )
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const OfflinePaymentButton = ({
  notReady,
  providerId,
}: {
  notReady: boolean
  providerId?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        console.error("Place order failed", err)
        trackPaymentEvent("checkout_error", {
          provider: providerId || "offline",
          message: err?.message || CHECKOUT_ERROR_MESSAGE,
        })
        setErrorMessage(CHECKOUT_ERROR_MESSAGE)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)
    trackPaymentEvent("payment_started", {
      provider: providerId || "offline",
    })

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] text-white shadow-[0_18px_34px_rgba(18,63,99,0.26)]"
        data-testid="submit-order-button"
      >
        Place order with {getPaymentInfo(providerId).title}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="offline-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
