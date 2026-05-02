import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { shreemSupportFaqs } from "@lib/constants/shreem-experience"
import MascotSprites from "@modules/common/components/mascot-sprites"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SupportContactForm from "@modules/support/components/contact-form"

export const metadata: Metadata = {
  title: "Customer Service",
  description:
    "Order support, product guidance, and direct contact options for Shreem customers.",
}

const responseStandards = [
  {
    title: "Order help",
    detail: "Share your order number for the fastest response on delivery, payment, or order confirmation questions.",
  },
  {
    title: "Product guidance",
    detail: "Ask which product suits your kitchen, prayer routine, or natural-farming use before buying.",
  },
  {
    title: "Direct support",
    detail: "Every support form goes to brajsavitrikrishisansthan@gmail.com with your details attached.",
  },
]

export default async function CustomerServicePage() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = customer ? await listOrders().catch(() => []) : []

  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface relative overflow-hidden px-5 py-8 small:px-8 small:py-10">
        <MascotSprites className="opacity-70" />
        <div className="relative z-[1] grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="brand-kicker">Customer Service</p>
            <h1 className="mt-3 max-w-[12ch] text-[2.7rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.1rem]">
              Real support for real orders
            </h1>
            <p className="mt-4 max-w-[44rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Use this page to get order help, product guidance, or account assistance.
              The goal is simple: make it easy for customers to get a useful answer without hunting through the site.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="brand-pill px-3 py-1.5">
                Email-first support
              </span>
              <span className="brand-pill px-3 py-1.5">
                Order-aware help
              </span>
              <span className="brand-pill px-3 py-1.5">
                Customer-friendly guidance
              </span>
            </div>
          </div>
          <div className="brand-card px-5 py-5 small:px-6">
            <p className="brand-kicker">Your account snapshot</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  Account
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  {customer?.email || "Not signed in yet"}
                </p>
              </div>
              <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  Orders available
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                  {customer
                    ? `${orders.length} order${orders.length === 1 ? "" : "s"} found in your account`
                    : "Sign in to see your full order history"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <LocalizedClientLink href="/account" className="brand-primary-button">
                {customer ? "Open my account" : "Sign in"}
              </LocalizedClientLink>
              <LocalizedClientLink href="/account/orders" className="brand-secondary-button">
                View orders
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 small:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {responseStandards.map((item) => (
            <article key={item.title} className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{item.title}</p>
              <h2 className="mt-3 text-[1.8rem] leading-[1.04] text-[var(--shreem-ink)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-8 small:pb-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
          <div className="brand-card px-5 py-6 small:px-6">
            <p className="brand-kicker">Send a message</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3rem]">
              Contact the Shreem support team
            </h2>
            <p className="mt-4 max-w-[42rem] text-sm leading-7 text-[var(--shreem-muted)]">
              Include your order number whenever possible. That helps us answer faster and avoids back-and-forth on delivery or payment questions.
            </p>
            <div className="mt-6">
              <SupportContactForm />
            </div>
          </div>

          <div className="grid gap-4">
            <article className="brand-card px-5 py-6 small:px-6">
              <p className="brand-kicker">Best ways to get help</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--shreem-muted)]">
                <p>1. For an existing purchase, add the order number.</p>
                <p>2. For product guidance, mention where you plan to use it: kitchen, prayer space, or farm.</p>
                <p>3. For account issues, use the same email address as your Shreem login.</p>
              </div>
            </article>

            <article className="brand-surface px-5 py-6 small:px-6">
              <p className="brand-kicker">Common customer routes</p>
              <div className="mt-4 grid gap-3">
                <LocalizedClientLink href="/account/orders" className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Orders
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Review order details, confirmation, and history.
                  </p>
                </LocalizedClientLink>
                <LocalizedClientLink href="/journal" className="brand-card px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                    Journal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
                    Read practical product guidance before you buy again.
                  </p>
                </LocalizedClientLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-4 small:pb-24">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <p className="brand-kicker">FAQs</p>
          <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3rem]">
            Questions customers ask most often
          </h2>
          <div className="mt-6 space-y-3">
            {shreemSupportFaqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-[24px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,252,248,0.96),rgba(249,244,236,0.88))] px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-[var(--shreem-ink)]">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
