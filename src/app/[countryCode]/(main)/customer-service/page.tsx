import { Metadata } from "next"
import Image from "next/image"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import {
  shreemSupportFaqs,
  shreemSupportHighlights,
} from "@lib/constants/shreem-experience"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Customer Service",
  description:
    "Get help with your Shreem account, orders, addresses, and product questions through our customer service page.",
}

export default async function CustomerServicePage() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = customer ? await listOrders().catch(() => []) : []

  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
          <div>
            <p className="brand-pill mb-5 w-fit">Customer Service</p>
            <h1 className="max-w-[12ch] text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
              Support that stays close to your Shreem account
            </h1>
            <p className="mt-5 max-w-[44rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
              This help center is built around the customer and order flows already
              connected to your Medusa backend, so the fastest way to get support is
              through your account, your saved details, and your order history.
            </p>
          </div>
          <div className="overflow-hidden rounded-[30px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] p-2 shadow-[0_24px_70px_rgba(15,49,70,0.1)]">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(251,242,222,0.85),rgba(255,252,246,0.95))] small:aspect-[16/11]">
              <Image
                src="/shreem-scenes/hero-scene.png"
                alt="Shreem support artwork with the brand's village-inspired world"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 760px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 small:py-10">
        <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
          <article className="brand-royal-surface px-5 py-6 text-white small:px-8 small:py-8">
            <p className="brand-kicker">Your Medusa-connected space</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-white small:text-[3rem]">
              {customer
                ? `Welcome back${customer.first_name ? `, ${customer.first_name}` : ""}`
                : "Sign in for faster support"}
            </h2>
            <p className="mt-4 max-w-[34rem] text-sm leading-6 text-white/78">
              {customer
                ? "You already have access to the most useful self-serve support tools: account details, address book, and order history."
                : "Once you sign in, you can use your Shreem account to review orders, manage addresses, and keep future support conversations tied to real purchase history."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-sm font-semibold text-white">Account</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {customer ? customer.email : "Sign in to access profile tools"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-sm font-semibold text-white">Orders</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {customer ? `${orders.length} order${orders.length === 1 ? "" : "s"} available in your account` : "Your order history appears here after sign-in"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-sm font-semibold text-white">Addresses</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {customer ? `${customer.addresses?.length || 0} saved address${(customer.addresses?.length || 0) === 1 ? "" : "es"}` : "Manage delivery details after sign-in"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LocalizedClientLink href="/account" className="brand-primary-button">
                {customer ? "Open my account" : "Sign in to my account"}
              </LocalizedClientLink>
              <LocalizedClientLink href="/account/orders" className="brand-secondary-button">
                View orders
              </LocalizedClientLink>
            </div>
          </article>

          <div className="grid gap-4">
            {shreemSupportHighlights.map((item) => (
              <article key={item.title} className="brand-card px-5 py-5 small:px-6">
                <p className="brand-kicker">{item.title}</p>
                <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 small:py-10">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="flex flex-col gap-4 pb-6">
            <p className="brand-kicker">Quick actions</p>
            <h2 className="text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3.2rem]">
              The fastest support routes inside Shreem
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <LocalizedClientLink href="/account" className="brand-card px-5 py-5">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">Account overview</p>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                Review your account summary and recent activity.
              </p>
            </LocalizedClientLink>
            <LocalizedClientLink href="/account/orders" className="brand-card px-5 py-5">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">Orders</p>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                Look up previous purchases and order details.
              </p>
            </LocalizedClientLink>
            <LocalizedClientLink href="/account/addresses" className="brand-card px-5 py-5">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">Addresses</p>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                Keep delivery and billing information ready.
              </p>
            </LocalizedClientLink>
            <LocalizedClientLink href="/journal" className="brand-card px-5 py-5">
              <p className="text-sm font-semibold text-[var(--shreem-ink)]">Journal</p>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                Read ingredient, ritual, and farming guidance before you buy.
              </p>
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-8 small:pb-24 small:pt-10">
        <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="brand-card px-5 py-6 small:px-6">
            <p className="brand-kicker">Frequently asked questions</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3rem]">
              What customers ask us most often
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

          <div className="grid gap-4">
            <article className="brand-card px-5 py-6 small:px-6">
              <p className="brand-kicker">Before you reach out</p>
              <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                A cleaner support workflow for orders
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--shreem-muted)]">
                <p>1. Sign in to your Shreem account.</p>
                <p>2. Open your order history and locate the relevant purchase.</p>
                <p>3. Review the order details, address, and product information.</p>
                <p>4. If an order was placed outside your account, use the transfer flow to claim it.</p>
              </div>
            </article>
            <article className="brand-surface px-5 py-6 small:px-6">
              <p className="brand-kicker">Need product guidance?</p>
              <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                Start with the Journal
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                For bilona method notes, neem dhoop guidance, and living-soil
                context, the Journal now acts as the clearest pre-purchase
                support layer inside the storefront.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LocalizedClientLink href="/journal" className="brand-primary-button">
                  Read Journal
                </LocalizedClientLink>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
