"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ProductFeedback from "@modules/order/components/product-feedback"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  const isDelivered = ["delivered", "partially_delivered"].includes(
    order.fulfillment_status
  )
  const feedbackItems =
    order.items?.map((item) => {
      const product = item.product as
        | (HttpTypes.StoreProduct & { handle?: string | null })
        | undefined

      return {
        id: item.id,
        productId: item.product_id || product?.id || "",
        productHandle: product?.handle || item.product_handle || null,
        title: item.product_title || product?.title || "Shreem product",
        thumbnail: item.thumbnail,
      }
    }) ?? []

  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <h1 className="text-[2rem] leading-none text-[var(--shreem-ink)] small:text-2xl-semi">Order details</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex items-center gap-2 text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <XMark /> Back to overview
        </LocalizedClientLink>
      </div>
      <div
        className="flex h-full w-full flex-col gap-4"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items order={order} />
        <ProductFeedback
          orderId={order.id}
          isDelivered={isDelivered}
          items={feedbackItems}
        />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
