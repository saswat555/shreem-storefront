import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { PolicyPage as PolicyPageData } from "@lib/constants/policies"

const PolicyPage = ({ policy }: { policy: PolicyPageData }) => (
  <div className="content-container py-8 small:py-12">
    <section className="brand-surface px-5 py-8 small:px-10 small:py-10">
      <p className="brand-kicker">{policy.eyebrow}</p>
      <h1 className="brand-page-title mt-3 max-w-[16ch]">{policy.title}</h1>
      <p className="brand-page-copy mt-4 max-w-[48rem]">{policy.summary}</p>
      <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
        Last updated: {policy.lastUpdated}
      </p>
    </section>

    <section className="mt-6 grid gap-4">
      {policy.sections.map((section) => (
        <article
          key={section.heading}
          className="brand-card px-5 py-5 small:px-6 small:py-6"
        >
          <h2 className="brand-card-title">{section.heading}</h2>
          <div className="mt-3 grid gap-3">
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-7 text-[var(--shreem-muted)] small:text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      ))}
    </section>

    <section className="mt-6 rounded-[24px] border border-[rgba(13,129,126,0.16)] bg-[rgba(240,248,246,0.76)] px-5 py-5">
      <p className="text-sm leading-7 text-[var(--shreem-muted)]">
        Need help with an order, payment, delivery, return, or refund?
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/customer-service" className="brand-primary-button">
          Contact support
        </LocalizedClientLink>
      </div>
    </section>
  </div>
)

export default PolicyPage
