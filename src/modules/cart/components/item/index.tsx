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
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(item.quantity || 1)
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

  useEffect(() => {
    setQuantity(item.quantity || 1)
  }, [item.quantity])

  const changeQuantity = async (nextQuantity: number) => {
    if (nextQuantity < 1 || updating) {
      return
    }

    const previousQuantity = quantity
    setError(null)
    setQuantity(nextQuantity)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity: nextQuantity,
    })
      .catch((err) => {
        setQuantity(previousQuantity)
        setError(
          err?.message ||
            "We could not update this item quantity. Please try again."
        )
      })
      .finally(() => {
        setUpdating(false)
        router.refresh()
      })
  }

  const inventoryQuantity = Number(
    (item.variant as { inventory_quantity?: number | null } | undefined)
      ?.inventory_quantity
  )
  const maxQuantity =
    item.variant?.manage_inventory &&
    Number.isFinite(inventoryQuantity) &&
    inventoryQuantity > 0
      ? inventoryQuantity
      : 99
  const canDecrease = quantity > 1 && !updating
  const canIncrease = quantity < maxQuantity && !updating

  return (
    <Table.Row
      className="mb-3 grid w-full grid-cols-[76px_minmax(0,1fr)] gap-x-3 overflow-hidden rounded-[16px] border border-[rgba(18,63,99,0.12)] bg-white/82 p-3 shadow-[0_12px_26px_rgba(15,49,70,0.06)] small:mb-0 small:table-row small:rounded-none small:border-0 small:bg-transparent small:p-0 small:shadow-none"
      data-testid="product-row"
    >
      <Table.Cell className="col-start-1 row-span-3 block !pl-0 p-0 small:table-cell small:p-4 small:w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("mb-0 flex small:mb-0", {
            "w-16": type === "preview",
            "w-[76px] small:w-24": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={lineItemThumbnail}
            images={lineItemImages}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="col-start-2 block px-0 py-0 text-left small:table-cell small:px-4 small:py-4">
        <Text
          className="txt-medium-plus line-clamp-2 break-words text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell className="col-start-2 block px-0 pt-3 small:table-cell small:px-4 small:pt-4">
          <div className="flex flex-wrap items-center gap-2 small:gap-3">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div
              className="inline-flex h-10 items-center rounded-full border border-[var(--shreem-border)] bg-[rgba(255,252,248,0.88)] px-1.5 shadow-[0_10px_24px_rgba(15,49,70,0.08)] small:h-11"
              data-testid="product-select-button"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={!canDecrease}
                onClick={() => changeQuantity(quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-[var(--shreem-ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                -
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--shreem-ink)]">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={!canIncrease}
                onClick={() => changeQuantity(quantity + 1)}
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

      <Table.Cell className="col-start-2 block !pr-0 px-0 pt-3 small:table-cell small:px-4 small:pt-4">
        <span
          className={clx("!pr-0 flex items-end justify-between gap-4 small:block", {
            "small:flex small:flex-col small:items-end small:h-full small:justify-center":
              type === "preview",
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
