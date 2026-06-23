import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import FamilyMembersManager from "../family-members-manager"
import { getAiWallet, type AiWallet } from "@lib/data/ai-wallet"
import { listAiUsage, type AiUsageRecord } from "@lib/data/ai-usage"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const formatAiDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-"

const formatCreditDelta = (value?: number) => {
  const amount = Number(value || 0)

  return `${amount > 0 ? "+" : ""}${amount}`
}

const getLedgerTitle = (item: NonNullable<AiWallet["recent_ledger"]>[number]) => {
  if (item.type === "order_credit") {
    return "Recharge credited"
  }

  if (item.type === "consume") {
    return "AI reading charged"
  }

  if (item.type === "premium_usage") {
    return "Premium AI reading"
  }

  if (item.type === "admin_adjustment") {
    return "Admin adjustment"
  }

  return item.type.replace(/_/g, " ")
}

const getUsageTitle = (item: AiUsageRecord) =>
  String(item.tool || "AI usage").replace(/_/g, " ")

const getUsageCredits = (item: AiUsageRecord) => {
  const metadata = (item.metadata || {}) as Record<string, any>
  const response = (item.response || {}) as Record<string, any>
  const input = (item.input || {}) as Record<string, any>
  const walletCharge = metadata.wallet_charge || {}
  const value =
    walletCharge.credits ??
    metadata.usage_units ??
    metadata.billing_units ??
    response.usage_units ??
    response.billing_units ??
    input.usage_units ??
    input.billing_units
  const credits = Number(value)

  return Number.isFinite(credits) && credits >= 0 ? credits : null
}

const AiWalletHistory = ({
  wallet,
  usage,
  synced,
}: {
  wallet: AiWallet | null
  usage: AiUsageRecord[]
  synced: boolean
}) => {
  const ledger = wallet?.recent_ledger || []

  return (
    <div className="brand-card px-4 py-4 small:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">AI wallet and billing</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
            {wallet
              ? `${wallet.credit_balance || 0} credits available`
              : synced
              ? "No AI wallet yet"
              : "AI wallet unavailable"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            Recharge, usage, balance and billing history are kept here for audit
            and support.
          </p>
        </div>
        {wallet?.pro_active && (
          <span className="rounded-full border border-[rgba(13,129,126,0.22)] bg-[rgba(240,248,246,0.8)] px-3 py-1 text-xs font-semibold text-[var(--shreem-accent-dark)]">
            {wallet.plan} active
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 small:grid-cols-3">
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/70 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--shreem-muted)]">
            Balance
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--shreem-ink)]">
            {wallet?.credit_balance || 0}
          </p>
        </div>
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/70 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--shreem-muted)]">
            Plan
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--shreem-ink)]">
            {wallet?.plan || "free"}
          </p>
          {wallet?.plan_expires_at && (
            <p className="mt-1 text-xs text-[var(--shreem-muted)]">
              Until {formatAiDate(wallet.plan_expires_at)}
            </p>
          )}
        </div>
        <div className="rounded-[16px] border border-[var(--shreem-border)] bg-white/70 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--shreem-muted)]">
            Ledger rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--shreem-ink)]">
            {ledger.length}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            Credit ledger
          </p>
          <div className="mt-3 grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
            {ledger.length ? (
              ledger.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[16px] border border-[var(--shreem-border)] bg-white/76 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                        {getLedgerTitle(item)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                        {formatAiDate(item.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        Number(item.credits || 0) >= 0
                          ? "bg-[rgba(240,248,246,0.85)] text-[var(--shreem-accent-dark)]"
                          : "bg-[rgba(255,248,233,0.9)] text-[var(--shreem-gold-deep)]"
                      }`}
                    >
                      {formatCreditDelta(item.credits)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--shreem-muted)]">
                    Balance after:{" "}
                    <span className="font-semibold text-[var(--shreem-ink)]">
                      {item.balance_after}
                    </span>
                    {item.order_id ? ` · Order ${item.order_id}` : ""}
                    {item.usage_id ? ` · Usage ${item.usage_id}` : ""}
                  </p>
                  {(item.note || item.source) && (
                    <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                      {item.note || item.source}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-[16px] bg-white/66 px-3 py-3 text-sm leading-6 text-[var(--shreem-muted)]">
                No credit recharge or charge has been recorded yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--shreem-ink)]">
            AI usage history
          </p>
          <div className="mt-3 grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
            {usage.length ? (
              usage.map((item) => (
                <div
                  key={item.id || `${item.tool}-${item.created_at}`}
                  className="rounded-[16px] border border-[var(--shreem-border)] bg-white/76 px-3 py-3"
                >
                  <p className="text-sm font-semibold capitalize text-[var(--shreem-ink)]">
                    {getUsageTitle(item)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    {formatAiDate(item.created_at)} · Model{" "}
                    {item.model || "not recorded"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                    Credits charged{" "}
                    <span className="font-semibold text-[var(--shreem-ink)]">
                      {getUsageCredits(item) ?? "not charged"}
                    </span>{" "}
                    · Tokens {Number(item.total_tokens || 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[16px] bg-white/66 px-3 py-3 text-sm leading-6 text-[var(--shreem-muted)]">
                No AI reading history is attached to this account yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Overview = async ({ customer, orders }: OverviewProps) => {
  const [walletResult, usageResult] = await Promise.all([
    getAiWallet(),
    listAiUsage({ limit: 30, toolPrefix: "astrology" }),
  ])

  return (
    <div data-testid="overview-page-wrapper">
      <div className="small:hidden">
        <div className="mb-5">
          <p className="brand-kicker">Account</p>
          <h1 className="mt-2 text-[2rem] leading-none text-[var(--shreem-ink)]">
            Welcome back, {customer?.first_name || "Shreem customer"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
            Signed in as{" "}
            <span className="font-semibold text-[var(--shreem-ink)]">
              {customer?.email}
            </span>
          </p>
          <div className="mt-4">
            <FamilyMembersManager customer={customer} />
          </div>
        </div>

        <div className="grid gap-3">
          <AiWalletHistory
            wallet={walletResult.wallet}
            usage={usageResult.items || []}
            synced={walletResult.synced}
          />

          <div className="brand-card px-4 py-4">
            <p className="brand-kicker">Profile</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span
                className="text-[2.4rem] leading-none text-[var(--shreem-ink)]"
                data-testid="customer-profile-completion"
                data-value={getProfileCompletion(customer)}
              >
                {getProfileCompletion(customer)}%
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-muted)]">
                Complete
              </span>
            </div>
          </div>

          <div className="brand-card px-4 py-4">
            <p className="brand-kicker">Addresses</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span
                className="text-[2.4rem] leading-none text-[var(--shreem-ink)]"
                data-testid="addresses-count"
                data-value={customer?.addresses?.length || 0}
              >
                {customer?.addresses?.length || 0}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shreem-muted)]">
                Saved
              </span>
            </div>
          </div>

          <div className="brand-card px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="brand-kicker">Recent orders</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--shreem-ink)]">
                  {orders?.length ? "Latest activity" : "No recent orders"}
                </h2>
              </div>
              <LocalizedClientLink
                href="/account/orders"
                className="text-sm font-semibold text-[var(--shreem-accent-dark)]"
              >
                View all
              </LocalizedClientLink>
            </div>
            <ul className="mt-4 grid gap-3" data-testid="orders-wrapper">
              {orders && orders.length > 0 ? (
                orders.slice(0, 3).map((order) => (
                  <li key={order.id} data-testid="order-wrapper">
                    <LocalizedClientLink
                      href={`/account/orders/details/${order.id}`}
                      className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--shreem-border)] bg-white/72 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--shreem-ink)]">
                          #{order.display_id}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                          {new Date(order.created_at).toDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--shreem-accent-dark)]">
                        {convertToLocale({
                          amount: order.total,
                          currency_code: order.currency_code,
                        })}
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))
              ) : (
                <li className="text-sm leading-6 text-[var(--shreem-muted)]">
                  Your first Shreem order will appear here.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4">
          <span data-testid="welcome-message" data-value={customer?.first_name}>
            Hello {customer?.first_name}
          </span>
          <span className="text-small-regular text-ui-fg-base">
            Signed in as:{" "}
            <span
              className="font-semibold"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </span>
        </div>
        <div className="mb-4">
          <FamilyMembersManager customer={customer} />
        </div>
        <div className="mb-6">
          <AiWalletHistory
            wallet={walletResult.wallet}
            usage={usageResult.items || []}
            synced={walletResult.synced}
          />
        </div>
        <div className="flex flex-col py-8 border-t border-gray-200">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="flex items-start gap-x-16 mb-6">
              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Profile</h3>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none"
                    data-testid="customer-profile-completion"
                    data-value={getProfileCompletion(customer)}
                  >
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Addresses</h3>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none"
                    data-testid="addresses-count"
                    data-value={customer?.addresses?.length || 0}
                  >
                    {customer?.addresses?.length || 0}
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Saved
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <h3 className="text-large-semi">Recent orders</h3>
              </div>
              <ul
                className="flex flex-col gap-y-4"
                data-testid="orders-wrapper"
              >
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    return (
                      <li
                        key={order.id}
                        data-testid="order-wrapper"
                        data-value={order.id}
                      >
                        <LocalizedClientLink
                          href={`/account/orders/details/${order.id}`}
                        >
                          <Container className="bg-gray-50 flex justify-between items-center p-4">
                            <div className="grid grid-cols-3 grid-rows-2 text-small-regular gap-x-4 flex-1">
                              <span className="font-semibold">Date placed</span>
                              <span className="font-semibold">
                                Order number
                              </span>
                              <span className="font-semibold">
                                Total amount
                              </span>
                              <span data-testid="order-created-date">
                                {new Date(order.created_at).toDateString()}
                              </span>
                              <span
                                data-testid="order-id"
                                data-value={order.display_id}
                              >
                                #{order.display_id}
                              </span>
                              <span data-testid="order-amount">
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </span>
                            </div>
                            <button
                              className="flex items-center justify-between"
                              data-testid="open-order-button"
                            >
                              <span className="sr-only">
                                Go to order #{order.display_id}
                              </span>
                              <ChevronDown className="-rotate-90" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <span data-testid="no-orders-message">No recent orders</span>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
