import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 py-8 small:py-12" data-testid="account-page">
      <div className="content-container max-w-5xl">
        <div className="brand-surface flex h-full flex-col px-4 py-6 small:px-8 small:py-10">
          <div
            className={
              customer
                ? "grid grid-cols-1 gap-8 small:grid-cols-[240px_1fr]"
                : "grid grid-cols-1"
            }
          >
            <div>{customer && <AccountNav customer={customer} />}</div>
            <div className="flex-1">{children}</div>
          </div>
          <div className="mt-8 flex flex-col gap-6 rounded-[18px] border border-[var(--shreem-border)] bg-[linear-gradient(135deg,rgba(255,250,240,0.92),rgba(245,240,232,0.82))] px-4 py-5 small:mt-10 small:flex-row small:items-end small:justify-between small:rounded-[28px] small:px-6 small:py-6">
            <div>
              <h3 className="mb-4 text-xl-semi text-[var(--shreem-ink)]">Got questions?</h3>
              <span className="txt-medium text-[var(--shreem-muted)]">
                Visit customer service for order help, account guidance, and
                product support rooted in the Shreem experience.
              </span>
            </div>
            <div>
              <UnderlineLink href="/customer-service">
                Customer Service
              </UnderlineLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
