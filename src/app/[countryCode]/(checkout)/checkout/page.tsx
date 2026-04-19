import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

const checkoutSteps = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
]

export default async function Checkout(props: {
  searchParams: Promise<{ step?: string }>
}) {
  const searchParams = await props.searchParams
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const currentStep = searchParams.step || "address"

  return (
    <div className="content-container py-8 small:py-10">
      <section className="brand-surface mb-6 px-5 py-6 small:px-8 small:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <p className="brand-kicker">Checkout</p>
            <h1 className="mt-3 text-[2.4rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[3.6rem]">
              Finish your order without friction
            </h1>
            <p className="mt-4 max-w-[42rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Confirm your address, choose delivery, select a payment method, and place the order from one clear flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="brand-pill px-3 py-1.5">Secure checkout</span>
              <span className="brand-pill px-3 py-1.5">Live cart totals</span>
              <span className="brand-pill px-3 py-1.5">Professional order review</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 small:grid-cols-4 xl:grid-cols-2">
            {checkoutSteps.map((step, index) => {
              const isActive = currentStep === step.key

              return (
                <div
                  key={step.key}
                  className={`rounded-[20px] border px-4 py-3 text-sm ${
                    isActive
                      ? "border-[rgba(212,161,38,0.34)] bg-[linear-gradient(135deg,rgba(255,248,233,0.96),rgba(245,239,224,0.88))] text-[var(--shreem-ink)]"
                      : "border-[var(--shreem-border)] bg-white/66 text-[var(--shreem-muted)]"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-medium">{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
