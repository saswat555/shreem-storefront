import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
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
        </div>

        <div className="grid gap-3">
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
