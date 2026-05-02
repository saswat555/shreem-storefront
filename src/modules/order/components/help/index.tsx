import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <section className="brand-card px-5 py-6 small:px-6">
      <p className="brand-kicker">Need help?</p>
      <Heading className="mt-3 text-[2rem] leading-none text-[var(--shreem-ink)]">
        Support after your order
      </Heading>
      <div className="text-base-regular my-4">
        <ul className="gap-y-3 flex flex-col">
          <li>
            <LocalizedClientLink href="/customer-service" className="brand-secondary-button">
              Customer service
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/customer-service" className="brand-secondary-button">
              Order help
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default Help
