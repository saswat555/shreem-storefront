import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { shreemSupportFaqs } from "@lib/constants/shreem-experience"
import { getBaseURL } from "@lib/util/env"
import MascotSprites from "@modules/common/components/mascot-sprites"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SupportChat from "@modules/support/components/support-chat"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title = "Customer Service | Shreem Order Support & Product Help"
  const description =
    "Get AI-assisted order support, checkout help, payment guidance, and product advice from Shreem."

  return {
    title,
    description,
    alternates: {
      canonical: `/${countryCode}/customer-service`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}/customer-service`,
      images: ["/logo.jpeg"],
    },
  }
}

export default async function CustomerServicePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = customer ? await listOrders().catch(() => []) : []
  const baseUrl = getBaseURL()
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: shreemSupportFaqs.slice(0, 5).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Shreem Customer Service",
    url: `${baseUrl}/${countryCode}/customer-service`,
    about:
      "AI-assisted customer support for Shreem orders, checkout, payment guidance, and product questions.",
  }

  return (
    <div className="content-container py-5 pb-14 small:py-10 small:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <section className="brand-surface relative overflow-hidden px-5 py-7 small:px-8 small:py-10">
        <MascotSprites className="opacity-70" />
        <div className="relative z-[1] grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="brand-kicker">Care desk</p>
            <h1 className="brand-page-title mt-3 max-w-[16ch]">
              Quick help without losing the human thread.
            </h1>
            <p className="mt-4 max-w-[45rem] text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
              Ask for order help, checkout support, payment guidance, or product
              advice. If AI cannot solve it, the chat can be passed to the team
              with the useful context already attached.
            </p>
          </div>

          <div className="brand-card px-5 py-5 small:px-6">
            <p className="brand-kicker">Account</p>
            <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
              {customer?.email || "Sign in for faster order support."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-[18px] bg-[rgba(240,248,246,0.82)] px-3 py-3">
                <p className="text-2xl font-semibold text-[var(--shreem-ink)]">
                  {orders.length}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-muted)]">
                  Orders
                </p>
              </div>
              <LocalizedClientLink
                href="/account"
                className="brand-secondary-button min-h-full"
              >
                {customer ? "Account" : "Sign in"}
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 small:mt-8">
        <SupportChat customerEmail={customer?.email} orderCount={orders.length} />
      </div>

      <section className="mt-6 small:mt-10">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <p className="brand-kicker">FAQs</p>
          <h2 className="brand-section-title mt-3">
            Quick answers
          </h2>
          <div className="mt-5 grid gap-3">
            {shreemSupportFaqs.slice(0, 5).map((faq) => (
              <details
                key={faq.question}
                className="rounded-[20px] border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.82)] px-4 py-4"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--shreem-ink)] small:text-base">
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
