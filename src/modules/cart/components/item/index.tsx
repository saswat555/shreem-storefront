"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const itemProduct = item.product as
    | { thumbnail?: string | null; images?: { url?: string | null }[] | null }
    | undefined
  const variantProduct = item.variant?.product as
    | { thumbnail?: string | null; images?: { url?: string | null }[] | null }
    | undefined
  const lineItemThumbnail =
    item.thumbnail || variantProduct?.thumbnail || itemProduct?.thumbnail
  const lineItemImages =
    variantProduct?.images || itemProduct?.images || item.variant?.images

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory
  const canDecrease = item.quantity > 1 && !updating
  const canIncrease = item.quantity < Math.min(maxQuantity, 10) && !updating

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={lineItemThumbnail}
            images={lineItemImages}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex items-center gap-3">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div
              className="inline-flex h-11 items-center rounded-full border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.88)] px-1.5 shadow-[0_10px_24px_rgba(15,49,70,0.08)]"
              data-testid="product-select-button"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={!canDecrease}
                onClick={() => changeQuantity(item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                -
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--shreem-ink)]">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={!canIncrease}
                onClick={() => changeQuantity(item.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                +
              </button>
            </div>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
