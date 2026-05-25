import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"
import PhonePe from "@modules/common/icons/phonepe"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element; description?: string }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
    description: "Visa, Mastercard, RuPay and international cards",
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
    description: "Secure card payment processed at checkout",
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
    description: "Pay directly from your linked bank account",
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
    description: "Fast local bank payment with secure authorization",
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
    description: "Pay through your PayPal balance or saved methods",
  },
  pp_phonepe_phonepe: {
    title: "PhonePe",
    icon: <PhonePe />,
    description: "Popular UPI-based checkout for quick confirmation",
  },
  pp_manual_upi_manual_upi: {
    title: "UPI QR - manual approval",
    icon: <CreditCard />,
    description:
      "Scan the QR or use the UPI link. Shreem verifies the bank credit before dispatch.",
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <CreditCard />,
    description: "Manual confirmation handled outside the card gateway",
  },
  // Add more payment providers here
}

export const getPaymentInfo = (providerId?: string) => {
  if (!providerId) {
    return {
      title: "Payment method",
      icon: <CreditCard />,
      description: "Choose how you would like to complete this order",
    }
  }

  if (paymentInfoMap[providerId]) {
    return paymentInfoMap[providerId]
  }

  if (providerId.toLowerCase().includes("phonepe")) {
    return {
      title: "PhonePe",
      icon: <PhonePe />,
      description: "Popular UPI-based checkout for quick confirmation",
    }
  }

  if (providerId.toLowerCase().includes("manual_upi")) {
    return {
      title: "UPI QR - manual approval",
      icon: <CreditCard />,
      description:
        "Scan the QR or use the UPI link. Shreem verifies the bank credit before dispatch.",
    }
  }

  if (providerId.toLowerCase().includes("paypal")) {
    return {
      title: "PayPal",
      icon: <PayPal />,
      description: "Pay through your PayPal balance or saved methods",
    }
  }

  return {
    title: providerId
      .replace(/^pp_/, "")
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    icon: <CreditCard />,
    description: "Complete payment using the selected provider",
  }
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_system_default") ||
    providerId?.toLowerCase().includes("manual_upi")
  )
}

export const isOfflineLike = (providerId?: string) => {
  return !isStripeLike(providerId)
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
