import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import { ShiprocketCheckoutProvider } from "@modules/checkout/context/shiprocket-context"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
  robots: {
    index: false,
    follow: false,
  },
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
  const cart = await retrieveCart().catch(() => null)

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer().catch(() => null)
  const currentStep = searchParams.step || "address"

  return (
    <div className="content-container py-4 pb-10 small:py-10">
      <section className="brand-surface mb-4 px-4 py-5 small:mb-6 small:px-8 small:py-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <p className="brand-kicker">Checkout</p>
            <h1 className="mt-2 text-[2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.6rem] small:leading-[0.98]">
              Finish order
            </h1>
            <p className="mt-3 max-w-[42rem] text-sm leading-6 text-[var(--shreem-muted)] small:text-base small:leading-7">
              Confirm details, pay, and place the order.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 small:gap-2 xl:grid-cols-2">
            {checkoutSteps.map((step, index) => {
              const isActive = currentStep === step.key

              return (
                <div
                  key={step.key}
                  className={`min-w-0 rounded-[15px] border px-2 py-3 text-center text-xs small:rounded-[20px] small:px-4 small:text-sm ${
                    isActive
                      ? "border-[rgba(212,161,38,0.34)] bg-[linear-gradient(135deg,rgba(255,248,233,0.96),rgba(245,239,224,0.88))] text-[var(--shreem-ink)]"
                      : "border-[var(--shreem-border)] bg-white/66 text-[var(--shreem-muted)]"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {index + 1}
                  </p>
                  <p className="mt-1 truncate font-medium">{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <ShiprocketCheckoutProvider cart={cart}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
          <CheckoutSummary cart={cart} />
        </div>
      </ShiprocketCheckoutProvider>
    </div>
  )
}
