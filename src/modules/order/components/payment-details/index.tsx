import { Container, Heading, Text } from "@medusajs/ui"

import { getPaymentInfo, isStripeLike } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const paymentInfo = getPaymentInfo(payment?.provider_id)
  const paymentData = (payment?.data || {}) as Record<string, unknown>
  const paymentStatus =
    (payment as { status?: string | null } | undefined)?.status ||
    order.payment_status
  const cardLast4 = getStringValue(paymentData, [
    "card_last4",
    "last4",
    "cardLast4",
  ])
  const cardBrand = getStringValue(paymentData, [
    "card_brand",
    "brand",
    "cardBrand",
  ])
  const transactionId = getStringValue(paymentData, [
    "payment_intent",
    "paymentIntentId",
    "transaction_id",
    "transactionId",
    "reference",
    "id",
  ])
  const amountPaid = payment
    ? convertToLocale({
        amount: payment.amount,
        currency_code: order.currency_code,
      })
    : null
  const paidAt = payment?.created_at
    ? new Date(payment.created_at).toLocaleString()
    : null
  const updatedAt = payment?.updated_at
    ? new Date(payment.updated_at).toLocaleString()
    : null
  const paymentRows = [
    { label: "Status", value: formatStatus(paymentStatus) },
    { label: "Amount paid", value: amountPaid },
    { label: "Currency", value: order.currency_code?.toUpperCase() },
    { label: "Provider", value: payment?.provider_id },
    { label: "Payment ID", value: payment?.id },
    { label: "Transaction ID", value: transactionId },
    { label: "Paid at", value: paidAt },
    { label: "Updated at", value: updatedAt },
  ].filter((row) => Boolean(row.value))

  return (
    <section className="brand-card px-4 py-5 small:px-6 small:py-6">
      <p className="brand-kicker">Payment</p>
      <Heading
        level="h2"
        className="mt-2 flex flex-row text-[1.8rem] leading-none text-[var(--shreem-ink)] small:text-[2rem]"
      >
        Payment details
      </Heading>
      <div className="mt-5">
        {payment ? (
          <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <div className="mt-3 flex items-start gap-3">
                <Container className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[rgba(18,63,99,0.12)] bg-white/80 p-2">
                  {paymentInfo.icon}
                </Container>
                <div className="min-w-0">
                  <Text
                    className="txt-medium text-ui-fg-base"
                    data-testid="payment-method"
                  >
                    {paymentInfo.title}
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                    {paymentInfo.description || payment.provider_id}
                  </Text>
                  {isStripeLike(payment.provider_id) && cardLast4 && (
                    <Text className="mt-2 text-sm font-semibold text-[var(--shreem-ink)]">
                      {cardBrand ? `${cardBrand} ` : ""}**** {cardLast4}
                    </Text>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[18px] border border-[rgba(18,63,99,0.1)] bg-white/58 px-4 py-4">
              <Text className="txt-medium-plus text-ui-fg-base">
                Payment information
              </Text>
              <div className="mt-3 grid gap-2" data-testid="payment-amount">
                {paymentRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-[rgba(18,63,99,0.08)] pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--shreem-muted)]">
                      {row.label}
                    </span>
                    <span className="max-w-[58%] break-words text-right text-sm font-medium text-[var(--shreem-ink)]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Text className="text-sm leading-6 text-[var(--shreem-muted)]">
            Payment details will appear here after the payment is recorded.
          </Text>
        )}
      </div>

      <Divider className="mt-6" />
    </section>
  )
}

export default PaymentDetails

function getStringValue(
  data: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = data[key]

    if (typeof value === "string" && value.trim()) {
      return value
    }

    if (typeof value === "number") {
      return String(value)
    }
  }

  return null
}

function formatStatus(status?: string | null) {
  if (!status) {
    return "Not available"
  }

  const formatted = status.split("_").join(" ")

  return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
}
