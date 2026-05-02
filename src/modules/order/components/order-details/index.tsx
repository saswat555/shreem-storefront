import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[16px] bg-white/76 px-4 py-4 small:rounded-[22px]">
        <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
        We have sent the order confirmation details to{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
        </Text>
      </div>
      <div className="rounded-[16px] bg-white/76 px-4 py-4 small:rounded-[22px]">
        <Text className="txt-medium-plus text-ui-fg-base mb-1">Order date</Text>
        <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
          <span data-testid="order-date">
            {new Date(order.created_at).toDateString()}
          </span>
        </Text>
        <Text className="mt-3 txt-medium-plus text-ui-fg-base mb-1">
          Order number
        </Text>
        <Text className="text-sm font-semibold text-[var(--shreem-accent-dark)]">
          <span data-testid="order-id">{order.display_id}</span>
        </Text>
      </div>
      <div className="rounded-[16px] bg-white/76 px-4 py-4 small:rounded-[22px]">
        <Text className="txt-medium-plus text-ui-fg-base mb-1">Status</Text>
        <div className="mt-2 flex flex-col gap-2 text-compact-small">
        {showStatus && (
          <>
            <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
              Order status:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text className="text-sm leading-7 text-[var(--shreem-muted)]">
              Payment status:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
      </div>
    </div>
  )
}

export default OrderDetails
