"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
  digitalOnly?: boolean
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, digitalOnly = false }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle">
        <div className="flex items-start justify-between gap-4">
          <span className="max-w-[70%]">Subtotal (excl. shipping and taxes)</span>
          <span className="shrink-0 text-right" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span>{digitalOnly ? "Digital delivery" : "Shipping"}</span>
          <span className="shrink-0 text-right" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {digitalOnly
              ? "Free"
              : convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-start justify-between gap-4">
            <span>Discount</span>
            <span
              className="shrink-0 text-right text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span className="shrink-0 text-right" data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="mb-2 flex items-center justify-between gap-4 text-ui-fg-base txt-medium">
        <span>Total</span>
        <span
          className="txt-xlarge-plus shrink-0 text-right"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
